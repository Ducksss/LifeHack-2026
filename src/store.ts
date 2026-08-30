import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  buildCartAlternatives,
  buildCartFromOfferIds,
  buildRankedCarts,
  createMission,
  createPreview,
  DomainError,
  publicPreview,
  seedCatalog,
  type CatalogItem,
  type CheckoutPreview,
  type ApprovedAlternative,
  type MerchantAlternative,
  type Mission,
  type MissionInput,
  type MissionView,
  type Order,
  type RankedCart,
  type Receipt,
  type ReceiptVerification,
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

interface IdentitySession {
  id: string;
  subject: string;
  displayLabel: string;
  expiresAt: string;
}

const DEMO_IDENTITY_SUBJECT = "demo_user_chai_2026";
const DEMO_IDENTITY_LABEL = "Chai · demo profile";

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
      CREATE TABLE IF NOT EXISTS mission_carts (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES missions(id),
        offer_ids TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS merchant_alternatives (
        from_offer_id TEXT NOT NULL REFERENCES catalog(offer_id),
        to_offer_id TEXT NOT NULL REFERENCES catalog(offer_id),
        active INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (from_offer_id, to_offer_id)
      );
      CREATE TABLE IF NOT EXISTS previews (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES missions(id),
        data TEXT NOT NULL,
        nonce TEXT NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS demo_identity_requests (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES missions(id),
        state TEXT NOT NULL UNIQUE,
        code_challenge TEXT NOT NULL,
        code_verifier TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        code_hash TEXT,
        status TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS demo_identity_sessions (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL UNIQUE REFERENCES missions(id),
        subject TEXT NOT NULL,
        display_label TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
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
    this.db
      .prepare("INSERT OR IGNORE INTO settings(key, value) VALUES ('receipt_key', ?)")
      .run(randomBytes(32).toString("hex"));
    const insert = this.db.prepare("INSERT OR IGNORE INTO catalog(offer_id, data) VALUES (?, ?)");
    const read = this.db.prepare("SELECT data FROM catalog WHERE offer_id = ?");
    const update = this.db.prepare("UPDATE catalog SET data = ? WHERE offer_id = ?");
    for (const item of seedCatalog) {
      insert.run(item.offerId, JSON.stringify(item));
      const existing = JSON.parse(String(read.get(item.offerId)!.data)) as CatalogItem;
      update.run(JSON.stringify({ ...item, priceCents: existing.priceCents, stock: existing.stock }), item.offerId);
    }
    const addAlternative = this.db.prepare(
      "INSERT OR IGNORE INTO merchant_alternatives(from_offer_id, to_offer_id, active) VALUES (?, ?, 1)",
    );
    for (const item of seedCatalog) {
      if (!item.alternativeFor) continue;
      const source = seedCatalog.find((candidate) =>
        candidate.merchantId === item.merchantId &&
        candidate.locationId === item.locationId &&
        candidate.sku === item.alternativeFor
      );
      if (source) addAlternative.run(source.offerId, item.offerId);
    }
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

  private approvedAlternatives(): ApprovedAlternative[] {
    return this.db
      .prepare("SELECT from_offer_id, to_offer_id FROM merchant_alternatives WHERE active = 1")
      .all()
      .map((row) => ({ fromOfferId: String(row.from_offer_id), toOfferId: String(row.to_offer_id) }));
  }

  merchantAlternatives(): MerchantAlternative[] {
    const catalog = new Map(this.getCatalog().map((item) => [item.offerId, item]));
    return this.db
      .prepare("SELECT from_offer_id, to_offer_id, active FROM merchant_alternatives ORDER BY from_offer_id, to_offer_id")
      .all()
      .flatMap((row) => {
        const from = catalog.get(String(row.from_offer_id));
        const to = catalog.get(String(row.to_offer_id));
        return from && to ? [{
          fromOfferId: from.offerId,
          toOfferId: to.offerId,
          fromName: from.name,
          toName: to.name,
          merchantName: from.merchantName,
          locationName: from.locationName,
          category: from.category,
          active: Boolean(row.active),
        }] : [];
      });
  }

  private cartsForMission(mission: Mission): RankedCart[] {
    const catalog = this.getCatalog();
    const scenario = this.getScenario();
    const approved = this.approvedAlternatives();
    const base = buildRankedCarts(mission, catalog, scenario);
    const custom = this.db
      .prepare("SELECT offer_ids FROM mission_carts WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .all(mission.id)
      .flatMap((row) => {
        const offerIds = JSON.parse(String(row.offer_ids)) as string[];
        const items = offerIds.map((offerId) => catalog.find((item) => item.offerId === offerId));
        const approvedComposition = items.every((item) => {
          if (!item?.alternativeFor) return Boolean(item);
          const source = catalog.find((candidate) =>
            candidate.merchantId === item.merchantId &&
            candidate.locationId === item.locationId &&
            candidate.sku === item.alternativeFor
          );
          return Boolean(source && approved.some((pair) => pair.fromOfferId === source.offerId && pair.toOfferId === item.offerId));
        });
        if (!approvedComposition) return [];
        try {
          return [buildCartFromOfferIds(mission, catalog, scenario, offerIds)];
        } catch {
          return [];
        }
      });
    const carts = [
      ...custom,
      ...base.filter((cart) => !custom.some((candidate) =>
        candidate.merchantId === cart.merchantId && candidate.locationId === cart.locationId
      )),
    ];
    return carts.map((cart) => ({
      ...cart,
      alternatives: buildCartAlternatives(mission, cart, catalog, scenario, approved),
    }));
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

  identityStatus(missionId: string, now = new Date()): MissionView["identity"] {
    this.getMission(missionId);
    const session = this.db
      .prepare("SELECT display_label, expires_at FROM demo_identity_sessions WHERE mission_id = ?")
      .get(missionId);
    if (session) {
      const expiresAt = String(session.expires_at);
      return new Date(expiresAt).getTime() > now.getTime()
        ? { status: "verified", displayLabel: String(session.display_label), expiresAt }
        : { status: "expired", displayLabel: String(session.display_label), expiresAt };
    }
    const request = this.db
      .prepare("SELECT status, expires_at FROM demo_identity_requests WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(missionId);
    if (request?.status === "pending" || request?.status === "authorized") {
      return new Date(String(request.expires_at)).getTime() > now.getTime()
        ? { status: "pending", expiresAt: String(request.expires_at) }
        : { status: "expired", expiresAt: String(request.expires_at) };
    }
    return { status: "not_connected" };
  }

  beginDemoIdentity(
    missionId: string,
    redirectUri: string,
    now = new Date(),
  ): { view: MissionView; authorizationUrl: string } {
    this.getMission(missionId);
    const callback = new URL(redirectUri);
    if (callback.pathname !== "/auth/demo/callback" || callback.search || callback.hash) {
      throw new DomainError("IDENTITY_CALLBACK_INVALID", "The demo identity callback is not allowlisted.");
    }
    const requestId = `idr_${randomBytes(8).toString("hex")}`;
    const state = token();
    const verifier = token();
    const challenge = pkceChallenge(verifier);
    const expiresAt = new Date(now.getTime() + 5 * 60_000).toISOString();

    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("UPDATE demo_identity_requests SET status = 'replaced' WHERE mission_id = ? AND status IN ('pending', 'authorized')")
        .run(missionId);
      this.db.prepare(`
        INSERT INTO demo_identity_requests(
          id, mission_id, state, code_challenge, code_verifier, redirect_uri,
          status, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(requestId, missionId, state, challenge, verifier, callback.toString(), expiresAt, now.toISOString());
      this.audit("identity.started", { missionId, requestId });
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    const authorizationUrl = new URL("/identity", callback.origin);
    authorizationUrl.searchParams.set("request_id", requestId);
    authorizationUrl.searchParams.set("state", state);
    return { view: this.view(missionId, now), authorizationUrl: authorizationUrl.toString() };
  }

  demoIdentityRequest(requestId: string, state: string, now = new Date()): {
    requestId: string;
    clientName: string;
    displayLabel: string;
    expiresAt: string;
  } {
    const row = this.db
      .prepare("SELECT state, status, expires_at FROM demo_identity_requests WHERE id = ?")
      .get(requestId);
    if (!row || !safeEqual(String(row.state), state)) {
      throw new DomainError("IDENTITY_STATE_INVALID", "This demo identity request is invalid. Start again from Woven.");
    }
    if (row.status !== "pending") {
      throw new DomainError("IDENTITY_REQUEST_USED", "This demo identity request has already been used. Start again from Woven.");
    }
    if (new Date(String(row.expires_at)).getTime() <= now.getTime()) {
      throw new DomainError("IDENTITY_REQUEST_EXPIRED", "This demo identity request expired. Start again from Woven.", true);
    }
    return {
      requestId,
      clientName: "Woven",
      displayLabel: DEMO_IDENTITY_LABEL,
      expiresAt: String(row.expires_at),
    };
  }

  authorizeDemoIdentity(
    requestId: string,
    state: string,
    now = new Date(),
  ): { redirectUrl: string } {
    const request = this.demoIdentityRequest(requestId, state, now);
    const row = this.db
      .prepare("SELECT mission_id, redirect_uri FROM demo_identity_requests WHERE id = ?")
      .get(requestId)!;
    const code = token();
    const updated = this.db
      .prepare("UPDATE demo_identity_requests SET status = 'authorized', code_hash = ? WHERE id = ? AND status = 'pending'")
      .run(sha256(code), requestId);
    if (updated.changes !== 1) {
      throw new DomainError("IDENTITY_REQUEST_USED", "This demo identity request has already been used. Start again from Woven.");
    }
    this.audit("identity.authorized", { missionId: String(row.mission_id), requestId });
    const redirect = new URL(String(row.redirect_uri));
    redirect.searchParams.set("code", code);
    redirect.searchParams.set("state", state);
    redirect.searchParams.set("request_id", request.requestId);
    return { redirectUrl: redirect.toString() };
  }

  completeDemoIdentity(code: string, state: string, now = new Date()): { missionId: string } {
    const row = this.db.prepare(`
      SELECT id, mission_id, code_challenge, code_verifier, code_hash, status, expires_at
      FROM demo_identity_requests WHERE state = ?
    `).get(state);
    if (!row) throw new DomainError("IDENTITY_STATE_INVALID", "The demo identity state did not match.");
    if (row.status !== "authorized") {
      throw new DomainError("IDENTITY_CODE_USED", "This demo identity authorization code has already been used.");
    }
    if (new Date(String(row.expires_at)).getTime() <= now.getTime()) {
      throw new DomainError("IDENTITY_REQUEST_EXPIRED", "This demo identity request expired. Start again from Woven.", true);
    }
    if (!row.code_hash || !safeEqual(String(row.code_hash), sha256(code))) {
      throw new DomainError("IDENTITY_CODE_INVALID", "The demo identity authorization code is invalid.");
    }
    if (!safeEqual(String(row.code_challenge), pkceChallenge(String(row.code_verifier)))) {
      throw new DomainError("IDENTITY_PKCE_INVALID", "The demo identity PKCE proof is invalid.");
    }

    const missionId = String(row.mission_id);
    const sessionId = `ids_${randomBytes(8).toString("hex")}`;
    const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("DELETE FROM demo_identity_sessions WHERE mission_id = ?").run(missionId);
      this.db.prepare(`
        INSERT INTO demo_identity_sessions(id, mission_id, subject, display_label, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionId, missionId, DEMO_IDENTITY_SUBJECT, DEMO_IDENTITY_LABEL, expiresAt, now.toISOString());
      const updated = this.db
        .prepare("UPDATE demo_identity_requests SET status = 'consumed' WHERE id = ? AND status = 'authorized'")
        .run(String(row.id));
      if (updated.changes !== 1) {
        throw new DomainError("IDENTITY_CODE_USED", "This demo identity authorization code has already been used.");
      }
      this.audit("identity.verified", { missionId, requestId: String(row.id), sessionId });
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { missionId };
  }

  private requireIdentitySession(missionId: string, now: Date): IdentitySession {
    const row = this.db
      .prepare("SELECT id, subject, display_label, expires_at FROM demo_identity_sessions WHERE mission_id = ?")
      .get(missionId);
    if (!row) {
      throw new DomainError("IDENTITY_REQUIRED", "Verify the demo identity before reviewing checkout.", true);
    }
    const session: IdentitySession = {
      id: String(row.id),
      subject: String(row.subject),
      displayLabel: String(row.display_label),
      expiresAt: String(row.expires_at),
    };
    if (new Date(session.expiresAt).getTime() <= now.getTime()) {
      throw new DomainError("IDENTITY_EXPIRED", "The demo identity session expired. Verify again.", true);
    }
    return session;
  }

  view(missionId: string, now = new Date()): MissionView {
    const missionRow = this.db
      .prepare("SELECT data, selected_cart_id FROM missions WHERE id = ?")
      .get(missionId);
    if (!missionRow) throw new DomainError("MISSION_NOT_FOUND", "Mission not found. Start a new mission.");
    const mission = JSON.parse(String(missionRow.data)) as Mission;
    const carts = this.cartsForMission(mission);
    const previewRow = this.db
      .prepare("SELECT data, status FROM previews WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(missionId);
    const orderRow = this.db
      .prepare("SELECT data FROM orders WHERE mission_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(missionId);
    let preview = previewRow ? (JSON.parse(String(previewRow.data)) as CheckoutPreview) : undefined;
    if (preview) preview = { ...preview, status: String(previewRow!.status) as CheckoutPreview["status"] };
    const order = orderRow ? JSON.parse(String(orderRow.data)) as Order : undefined;
    const selectedCartId = missionRow.selected_cart_id && carts.some((cart) => cart.id === missionRow.selected_cart_id)
      ? String(missionRow.selected_cart_id)
      : null;
    return {
      mission,
      carts,
      selectedCartId,
      identity: this.identityStatus(missionId, now),
      ...(preview ? { preview: publicPreview(preview) } : {}),
      ...(order ? { order } : {}),
      ...(order?.receipt ? { receiptVerification: this.verifyReceipt(order.receipt.receiptNumber, order.receipt.signature) } : {}),
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

  swapCartItem(missionId: string, cartId: string, offerId: string): MissionView {
    const mission = this.getMission(missionId);
    const cart = this.cartsForMission(mission).find((candidate) => candidate.id === cartId);
    if (!cart) throw new DomainError("CART_NOT_FOUND", "That cart is no longer available. Refresh the mission.", true);
    const alternative = cart.alternatives.find((candidate) => candidate.offerId === offerId);
    if (!alternative) throw new DomainError("ALTERNATIVE_NOT_APPROVED", "That item is not an active merchant-approved alternative.");
    const offerIds = cart.lines.map((line) => line.offerId === alternative.fromOfferId ? offerId : line.offerId);
    const swapped = buildCartFromOfferIds(mission, this.getCatalog(), this.getScenario(), offerIds);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("DELETE FROM mission_carts WHERE mission_id = ?").run(missionId);
      this.db
        .prepare("INSERT INTO mission_carts(id, mission_id, offer_ids) VALUES (?, ?, ?)")
        .run(`${missionId}:${swapped.id}`, missionId, JSON.stringify(offerIds));
      this.db.prepare("UPDATE missions SET selected_cart_id = ? WHERE id = ?").run(swapped.id, missionId);
      this.audit("cart.item_swapped", { missionId, cartId, swappedCartId: swapped.id, offerId });
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.view(missionId);
  }

  checkoutPreview(missionId: string, cartId: string, now = new Date()): { view: MissionView; nonce: string } {
    const mission = this.getMission(missionId);
    const identity = this.requireIdentitySession(missionId, now);
    const carts = this.cartsForMission(mission);
    const cart = carts.find((candidate) => candidate.id === cartId);
    if (!cart) {
      throw new DomainError("CART_STALE", "Inventory or price changed. Review the refreshed carts.", true);
    }
    const preview = createPreview(mission, cart, identity.id, identity.subject, now);
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
        identitySessionId: identity.id,
      });
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { view: this.view(missionId, now), nonce: preview.nonce };
  }

  private signReceipt(receipt: Omit<Receipt, "signature">): string {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'receipt_key'").get();
    if (!row) throw new DomainError("RECEIPT_KEY_MISSING", "Receipt verification is unavailable.");
    return createHmac("sha256", String(row.value)).update(JSON.stringify(receipt)).digest("hex");
  }

  verifyReceipt(receiptNumber: string, signature: string): ReceiptVerification {
    const order = this.db
      .prepare("SELECT data FROM orders ORDER BY rowid DESC")
      .all()
      .map((row) => JSON.parse(String(row.data)) as Order)
      .find((candidate) => candidate.receipt?.receiptNumber === receiptNumber);
    const receipt = order?.receipt;
    if (!receipt) return { valid: false };
    const { signature: storedSignature, ...unsigned } = receipt;
    const expected = this.signReceipt(unsigned);
    return safeEqual(expected, storedSignature) && safeEqual(expected, signature)
      ? { valid: true, receipt }
      : { valid: false };
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

      const identity = this.requireIdentitySession(preview.missionId, now);
      if (
        !preview.identitySessionId ||
        !preview.identitySubject ||
        !safeEqual(preview.identitySessionId, identity.id) ||
        !safeEqual(preview.identitySubject, identity.subject)
      ) {
        throw new DomainError("IDENTITY_MISMATCH", "The verified demo identity changed. Review checkout again.", true);
      }

      const mission = this.getMission(preview.missionId);
      const currentCart = this.cartsForMission(mission).find(
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
      const orderId = `ord_${randomBytes(6).toString("hex")}`;
      const createdAt = now.toISOString();
      const receiptNumber = status === "confirmed"
        ? `WV-${now.getTime().toString(36).toUpperCase()}-${orderId.slice(-6).toUpperCase()}`
        : undefined;
      const unsignedReceipt: Omit<Receipt, "signature"> | undefined = receiptNumber ? {
        receiptNumber,
        orderId,
        missionId: mission.id,
        request: mission.request,
        merchantName: preview.mandate.merchantName,
        pickupLocation: preview.mandate.pickupLocation,
        lines: preview.cart.lines.map((line) => ({
          offerId: line.offerId,
          name: line.name,
          category: line.category,
          priceCents: line.priceCents,
          quantity: line.quantity,
        })),
        amountCents: preview.mandate.amountCents,
        currency: "SGD",
        paymentMode: "simulated",
        createdAt,
      } : undefined;
      const receipt = unsignedReceipt ? { ...unsignedReceipt, signature: this.signReceipt(unsignedReceipt) } : undefined;
      const order: Order = {
        id: orderId,
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
        ...(receiptNumber ? { receiptNumber } : {}),
        ...(receipt ? { receipt } : {}),
        createdAt,
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
    alternatives: MerchantAlternative[];
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
    return {
      scenario: this.getScenario(),
      catalog: this.getCatalog(),
      alternatives: this.merchantAlternatives(),
      orders,
      audit,
    };
  }

  setAlternative(fromOfferId: string, toOfferId: string, active: boolean): void {
    const result = this.db
      .prepare("UPDATE merchant_alternatives SET active = ? WHERE from_offer_id = ? AND to_offer_id = ?")
      .run(active ? 1 : 0, fromOfferId, toOfferId);
    if (result.changes !== 1) throw new DomainError("ALTERNATIVE_NOT_FOUND", "Merchant alternative not found.");
    this.audit("alternative.changed", { fromOfferId, toOfferId, active });
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
        DELETE FROM mission_carts;
        DELETE FROM demo_identity_sessions;
        DELETE FROM demo_identity_requests;
        DELETE FROM missions;
        DELETE FROM audit;
        DELETE FROM merchant_alternatives;
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

function token(): string {
  return randomBytes(32).toString("base64url");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
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
