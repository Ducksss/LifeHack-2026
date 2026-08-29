import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  buildRankedCarts,
  createMission,
  createPreview,
  DomainError,
  publicPreview,
  seedCatalog,
  type CatalogItem,
  type CheckoutPreview,
  type Mission,
  type MissionInput,
  type MissionView,
  type Order,
  type Scenario,
} from "./domain.js";
import { authorizePayment } from "./payment.js";

interface AuditEvent {
  id: number;
  event: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

interface ConfirmInput {
  previewId: string;
  mandateHash: string;
  confirmationNonce: string;
  idempotencyKey: string;
}

export class WovenStore {
  private readonly db: DatabaseSync;

  constructor(filename = process.env.WOVEN_DB || "./data/woven.db") {
    if (filename !== ":memory:") mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.migrate();
    this.seed();
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS catalog (
        offer_id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        selected_cart_id TEXT
      );
      CREATE TABLE IF NOT EXISTS previews (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES missions(id),
        data TEXT NOT NULL,
        nonce TEXT NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES missions(id),
        idempotency_key TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  private seed(): void {
    this.db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES ('scenario', 'normal')").run();
    const insert = this.db.prepare("INSERT OR IGNORE INTO catalog(offer_id, data) VALUES (?, ?)");
    for (const item of seedCatalog) insert.run(item.offerId, JSON.stringify(item));
  }

  private audit(event: string, detail: Record<string, unknown>): void {
    this.db
      .prepare("INSERT INTO audit(event, detail, created_at) VALUES (?, ?, ?)")
      .run(event, JSON.stringify(detail), new Date().toISOString());
  }

  getScenario(): Scenario {
    return this.db.prepare("SELECT value FROM settings WHERE key = 'scenario'").get()!.value as Scenario;
  }

  setScenario(scenario: Scenario): void {
    this.db.prepare("UPDATE settings SET value = ? WHERE key = 'scenario'").run(scenario);
    this.audit("scenario.changed", { scenario });
  }

  getCatalog(): CatalogItem[] {
    return this.db
      .prepare("SELECT data FROM catalog ORDER BY offer_id")
      .all()
      .map((row) => JSON.parse(String(row.data)) as CatalogItem);
  }

  startMission(input: MissionInput): MissionView {
    const mission = createMission(input);
    this.db
      .prepare("INSERT INTO missions(id, data) VALUES (?, ?)")
      .run(mission.id, JSON.stringify(mission));
    this.audit("mission.started", { missionId: mission.id, request: mission.request });
    return this.view(mission.id);
  }

  private getMission(missionId: string): Mission {
    const row = this.db.prepare("SELECT data FROM missions WHERE id = ?").get(missionId);
    if (!row) throw new DomainError("MISSION_NOT_FOUND", "Mission not found. Start a new mission.");
    return JSON.parse(String(row.data)) as Mission;
  }

  view(missionId: string): MissionView {
    const missionRow = this.db
      .prepare("SELECT data, selected_cart_id FROM missions WHERE id = ?")
      .get(missionId);
    if (!missionRow) throw new DomainError("MISSION_NOT_FOUND", "Mission not found. Start a new mission.");
    const mission = JSON.parse(String(missionRow.data)) as Mission;
    const carts = buildRankedCarts(mission, this.getCatalog(), this.getScenario());
    const previewRow = this.db
      .prepare("SELECT data, status FROM previews WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(missionId);
    const orderRow = this.db
      .prepare("SELECT data FROM orders WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(missionId);
    let preview = previewRow ? (JSON.parse(String(previewRow.data)) as CheckoutPreview) : undefined;
    if (preview) preview = { ...preview, status: String(previewRow!.status) as CheckoutPreview["status"] };
    return {
      mission,
      carts,
      selectedCartId: missionRow.selected_cart_id ? String(missionRow.selected_cart_id) : null,
      ...(preview ? { preview: publicPreview(preview) } : {}),
      ...(orderRow ? { order: JSON.parse(String(orderRow.data)) as Order } : {}),
      scenario: this.getScenario(),
    };
  }

  selectCart(missionId: string, cartId: string): MissionView {
    const view = this.view(missionId);
    if (!view.carts.some((cart) => cart.id === cartId)) {
      throw new DomainError("CART_NOT_FOUND", "That cart is no longer available. Refresh the mission.", true);
    }
    this.db.prepare("UPDATE missions SET selected_cart_id = ? WHERE id = ?").run(cartId, missionId);
    this.audit("cart.selected", { missionId, cartId });
    return this.view(missionId);
  }

  checkoutPreview(missionId: string, cartId: string): { view: MissionView; nonce: string } {
    const mission = this.getMission(missionId);
    const carts = buildRankedCarts(mission, this.getCatalog(), this.getScenario());
    const cart = carts.find((candidate) => candidate.id === cartId);
    if (!cart) {
      throw new DomainError("CART_STALE", "Inventory or price changed. Review the refreshed carts.", true);
    }
    const preview = createPreview(mission, cart);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("INSERT INTO previews(id, mission_id, data, nonce, status) VALUES (?, ?, ?, ?, ?)")
        .run(preview.id, missionId, JSON.stringify(preview), preview.nonce, preview.status);
      this.db.prepare("UPDATE missions SET selected_cart_id = ? WHERE id = ?").run(cartId, missionId);
      this.audit("checkout.preview_created", {
        missionId,
        previewId: preview.id,
        mandateHash: preview.mandateHash,
        amountCents: preview.mandate.amountCents,
      });
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { view: this.view(missionId), nonce: preview.nonce };
  }

  confirmPurchase(input: ConfirmInput, now = new Date()): { view: MissionView; order: Order } {
    if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 128) {
      throw new DomainError("INVALID_IDEMPOTENCY_KEY", "A valid idempotency key is required.");
    }

    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.db
        .prepare("SELECT data FROM orders WHERE idempotency_key = ?")
        .get(input.idempotencyKey);
      if (existing) {
        const order = JSON.parse(String(existing.data)) as Order;
        if (order.previewId !== input.previewId) {
          throw new DomainError("IDEMPOTENCY_CONFLICT", "That idempotency key belongs to a different checkout.");
        }
        this.db.exec("COMMIT");
        return { view: this.view(order.missionId), order };
      }

      const row = this.db
        .prepare("SELECT data, nonce, status FROM previews WHERE id = ?")
        .get(input.previewId);
      if (!row) throw new DomainError("PREVIEW_NOT_FOUND", "Checkout preview not found. Create a new one.");
      const preview = JSON.parse(String(row.data)) as CheckoutPreview;
      if (row.status !== "pending") {
        throw new DomainError("PREVIEW_USED", "This confirmation has already been used. Create a new preview.");
      }
      if (new Date(preview.expiresAt).getTime() <= now.getTime()) {
        this.db.prepare("UPDATE previews SET status = 'expired' WHERE id = ?").run(preview.id);
        throw new DomainError("PREVIEW_EXPIRED", "Checkout preview expired. Review current price and stock.", true);
      }
      if (!safeEqual(String(row.nonce), input.confirmationNonce)) {
        throw new DomainError("CONFIRMATION_INVALID", "Confirmation token is invalid.");
      }
      if (!safeEqual(preview.mandateHash, input.mandateHash)) {
        throw new DomainError("MANDATE_CHANGED", "The confirmed terms do not match the checkout preview.");
      }

      const mission = this.getMission(preview.missionId);
      const currentCart = buildRankedCarts(mission, this.getCatalog(), this.getScenario()).find(
        (cart) => cart.id === preview.cart.id,
      );
      if (!currentCart || currentCart.version !== preview.mandate.cartVersion || currentCart.totalCents !== preview.mandate.amountCents) {
        throw new DomainError("CART_STALE", "Price or inventory changed. Review a new checkout preview.", true);
      }

      const scenario = this.getScenario();
      const authorization = authorizePayment(scenario);
      const status: Order["status"] =
        !authorization.approved
          ? "authorization_declined"
          : scenario === "order-fail"
            ? "order_failed_reversing"
            : "confirmed";
      const order: Order = {
        id: `ord_${randomBytes(6).toString("hex")}`,
        missionId: mission.id,
        previewId: preview.id,
        idempotencyKey: input.idempotencyKey,
        merchantName: preview.mandate.merchantName,
        pickupLocation: preview.mandate.pickupLocation,
        amountCents: preview.mandate.amountCents,
        currency: "SGD",
        status,
        paymentMode: authorization.mode,
        ...(authorization.authorizationCode
          ? { authorizationCode: authorization.authorizationCode }
          : {}),
        ...(status === "confirmed" ? { receiptNumber: `WV-${Date.now().toString(36).toUpperCase()}` } : {}),
        createdAt: now.toISOString(),
      };

      if (status === "confirmed") {
        const get = this.db.prepare("SELECT data FROM catalog WHERE offer_id = ?");
        const update = this.db.prepare("UPDATE catalog SET data = ? WHERE offer_id = ?");
        for (const line of preview.mandate.lines) {
          const itemRow = get.get(line.offerId);
          if (!itemRow) throw new DomainError("INVENTORY_MISSING", "An item disappeared during checkout.", true);
          const item = JSON.parse(String(itemRow.data)) as CatalogItem;
          if (item.stock < line.quantity) throw new DomainError("OUT_OF_STOCK", `${item.name} sold out.`, true);
          update.run(JSON.stringify({ ...item, stock: item.stock - line.quantity }), item.offerId);
        }
      }

      this.db
        .prepare("INSERT INTO orders(id, mission_id, idempotency_key, data) VALUES (?, ?, ?, ?)")
        .run(order.id, order.missionId, order.idempotencyKey, JSON.stringify(order));
      this.db.prepare("UPDATE previews SET status = 'consumed' WHERE id = ?").run(preview.id);
      this.audit(`payment.${status}`, {
        missionId: mission.id,
        previewId: preview.id,
        orderId: order.id,
        paymentMode: order.paymentMode,
      });
      this.db.exec("COMMIT");
      return { view: this.view(mission.id), order };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  dashboard(): {
    scenario: Scenario;
    catalog: CatalogItem[];
    orders: Order[];
    audit: AuditEvent[];
  } {
    const orders = this.db
      .prepare("SELECT data FROM orders ORDER BY rowid DESC LIMIT 20")
      .all()
      .map((row) => JSON.parse(String(row.data)) as Order);
    const audit = this.db
      .prepare("SELECT id, event, detail, created_at FROM audit ORDER BY id DESC LIMIT 50")
      .all()
      .map((row) => ({
        id: Number(row.id),
        event: String(row.event),
        detail: JSON.parse(String(row.detail)) as Record<string, unknown>,
        createdAt: String(row.created_at),
      }));
    return { scenario: this.getScenario(), catalog: this.getCatalog(), orders, audit };
  }

  updateCatalogCsv(csv: string): { updated: number } {
    const rows = parseCsv(csv);
    if (rows.length < 2) throw new DomainError("INVALID_CSV", "CSV needs a header and at least one data row.");
    const [header, ...dataRows] = rows;
    const offerIndex = header!.indexOf("offer_id");
    const priceIndex = header!.indexOf("price_sgd");
    const stockIndex = header!.indexOf("stock");
    if ([offerIndex, priceIndex, stockIndex].includes(-1)) {
      throw new DomainError("INVALID_CSV", "CSV headers must include offer_id, price_sgd, and stock.");
    }

    this.db.exec("BEGIN IMMEDIATE");
    try {
      let updated = 0;
      const get = this.db.prepare("SELECT data FROM catalog WHERE offer_id = ?");
      const save = this.db.prepare("UPDATE catalog SET data = ? WHERE offer_id = ?");
      for (const row of dataRows) {
        const offerId = row[offerIndex]?.trim();
        if (!offerId) continue;
        const existing = get.get(offerId);
        if (!existing) throw new DomainError("UNKNOWN_OFFER", `Unknown offer_id: ${offerId}`);
        const priceValue = row[priceIndex]?.trim() || "";
        const stockValue = row[stockIndex]?.trim() || "";
        if (!/^\d+(?:\.\d{1,2})?$/.test(priceValue) || !/^\d+$/.test(stockValue)) {
          throw new DomainError("INVALID_CSV_VALUE", `Invalid price or stock for ${offerId}.`);
        }
        const priceCents = Math.round(Number(priceValue) * 100);
        const stock = Number(stockValue);
        if (!Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(stock) || stock < 0) {
          throw new DomainError("INVALID_CSV_VALUE", `Invalid price or stock for ${offerId}.`);
        }
        const item = JSON.parse(String(existing.data)) as CatalogItem;
        save.run(JSON.stringify({ ...item, priceCents, stock }), offerId);
        updated += 1;
      }
      this.audit("catalog.csv_updated", { updated });
      this.db.exec("COMMIT");
      return { updated };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  catalogCsv(): string {
    return [
      "offer_id,price_sgd,stock",
      ...this.getCatalog().map((item) => `${item.offerId},${(item.priceCents / 100).toFixed(2)},${item.stock}`),
    ].join("\n");
  }

  reset(): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.exec(`
        DELETE FROM orders;
        DELETE FROM previews;
        DELETE FROM missions;
        DELETE FROM audit;
        DELETE FROM catalog;
        UPDATE settings SET value = 'normal' WHERE key = 'scenario';
      `);
      this.seed();
      this.audit("demo.reset", {});
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function safeEqual(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]!;
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new DomainError("INVALID_CSV", "CSV contains an unterminated quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
