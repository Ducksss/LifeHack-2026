import { createHash, randomUUID } from "node:crypto";

export const CANONICAL_REQUEST =
  "I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and AirPods under S$150, with pickup today.";

export type Scenario =
  | "normal"
  | "stockout"
  | "price-change"
  | "auth-decline"
  | "order-fail";

export type Category = "charger" | "mac_cable" | "iphone_cable" | "adapter";

export interface MissionInput {
  request: string;
  budgetCents?: number;
  destination?: string;
  pickupDate?: string;
}

export interface Mission {
  id: string;
  request: string;
  budgetCents: number;
  destination: string;
  pickupDate: string;
  currency: "SGD";
  devices: string[];
  assumptions: string[];
  createdAt: string;
}

export interface CatalogItem {
  offerId: string;
  merchantId: string;
  merchantName: string;
  locationId: string;
  locationName: string;
  address: string;
  pickupMinutes: number;
  transitMinutes: number;
  closesAt: string;
  area: "Central" | "Airport" | "East";
  sku: string;
  name: string;
  category: Category;
  priceCents: number;
  stock: number;
  watts?: number;
  maxWatts?: number;
  inputVoltage?: string;
  destination?: string;
  connector?: string;
  alternativeFor?: string;
}

export interface CartLine {
  offerId: string;
  sku: string;
  name: string;
  category: Category;
  priceCents: number;
  quantity: 1;
  compatibility: string;
}

export interface RankedCart {
  id: string;
  version: string;
  merchantId: string;
  merchantName: string;
  locationId: string;
  locationName: string;
  address: string;
  pickupMinutes: number;
  transitMinutes: number;
  closesAt: string;
  area: CatalogItem["area"];
  totalCents: number;
  currency: "SGD";
  score: number;
  badge: "BEST MATCH" | "BEST VALUE" | "ALTERNATIVE" | "CUSTOM";
  lines: CartLine[];
  checks: string[];
  alternatives: CartAlternative[];
  inventoryCheckedAt: string;
}

export interface CartAlternative {
  fromOfferId: string;
  offerId: string;
  name: string;
  category: Category;
  priceCents: number;
  stock: number;
  compatibility: string;
  deltaCents: number;
  totalCents: number;
}

export interface ApprovedAlternative {
  fromOfferId: string;
  toOfferId: string;
}

export interface MerchantAlternative extends ApprovedAlternative {
  fromName: string;
  toName: string;
  merchantName: string;
  locationName: string;
  category: Category;
  active: boolean;
}

export interface MissionView {
  mission: Mission;
  carts: RankedCart[];
  selectedCartId: string | null;
  preview?: PublicPreview;
  order?: Order;
  receiptVerification?: ReceiptVerification;
  scenario: Scenario;
}

export interface Mandate {
  version: 1;
  missionId: string;
  cartId: string;
  cartVersion: string;
  merchantId: string;
  merchantName: string;
  pickupLocation: string;
  currency: "SGD";
  amountCents: number;
  lines: Array<{ offerId: string; quantity: 1; priceCents: number }>;
}

export interface CheckoutPreview {
  id: string;
  missionId: string;
  cart: RankedCart;
  mandate: Mandate;
  mandateHash: string;
  nonce: string;
  expiresAt: string;
  status: "pending" | "consumed" | "expired";
  createdAt: string;
}

export type PublicPreview = Omit<CheckoutPreview, "nonce">;

export interface Order {
  id: string;
  missionId: string;
  previewId: string;
  idempotencyKey: string;
  merchantName: string;
  pickupLocation: string;
  amountCents: number;
  currency: "SGD";
  status:
    | "confirmed"
    | "authorization_declined"
    | "order_failed_reversing";
  paymentMode: "simulated";
  authorizationCode?: string;
  receiptNumber?: string;
  receipt?: Receipt;
  createdAt: string;
}

export interface Receipt {
  receiptNumber: string;
  orderId: string;
  missionId: string;
  request: string;
  merchantName: string;
  pickupLocation: string;
  lines: Array<{ offerId: string; name: string; category: Category; priceCents: number }>;
  amountCents: number;
  currency: "SGD";
  paymentMode: "simulated";
  createdAt: string;
  signature: string;
}

export interface ReceiptVerification {
  valid: boolean;
  receipt?: Receipt;
}

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

const merchants = [
  {
    id: "byteroute",
    name: "ByteRoute",
    locations: [
      ["funan", "Funan · Level 3", "107 North Bridge Rd", 45, 18, "21:30", "Central"],
      ["jewel", "Jewel · Level 4", "78 Airport Blvd", 70, 32, "22:00", "Airport"],
    ],
    products: [
      ["BR-GAN65", "65W GaN dual-port charger", "charger", 6900, 65, "100–240V"],
      ["BR-GAN30", "30W compact charger", "charger", 3900, 30, "100–240V"],
      ["BR-C2C100", "100W USB-C woven cable", "mac_cable", 2400, 100, "USB-C ↔ USB-C"],
      ["BR-C2C60", "60W USB-C soft-touch cable", "mac_cable", 2000, 60, "USB-C ↔ USB-C", "BR-C2C100"],
      ["BR-C2L", "USB-C to Lightning cable", "iphone_cable", 2800, 20, "USB-C ↔ Lightning"],
      ["BR-JP", "Japan Type-A travel adapter", "adapter", 1200, 0, "Japan / Type A"],
    ],
  },
  {
    id: "citymobile",
    name: "City Mobile",
    locations: [
      ["bugis", "Bugis Junction · B1", "200 Victoria St", 65, 16, "21:30", "Central"],
      ["plq", "Paya Lebar Quarter · L2", "10 Paya Lebar Rd", 95, 24, "22:00", "East"],
    ],
    products: [
      ["CM-PD45", "45W PD travel charger", "charger", 4900, 45, "100–240V"],
      ["CM-C2C60", "60W USB-C cable", "mac_cable", 1800, 60, "USB-C ↔ USB-C"],
      ["CM-C2C100", "100W USB-C reinforced cable", "mac_cable", 2300, 100, "USB-C ↔ USB-C", "CM-C2C60"],
      ["CM-C2L", "USB-C to Lightning cable", "iphone_cable", 2500, 20, "USB-C ↔ Lightning"],
      ["CM-JP", "Japan slim travel adapter", "adapter", 1000, 0, "Japan / Type A"],
    ],
  },
  {
    id: "voltandgo",
    name: "Volt & Go",
    locations: [
      ["orchard", "Orchard Gateway · L2", "277 Orchard Rd", 55, 22, "22:00", "Central"],
      ["marina", "Marina Square · L2", "6 Raffles Blvd", 85, 20, "21:30", "Central"],
    ],
    products: [
      ["VG-GAN67", "67W GaN charger", "charger", 7300, 67, "100–240V"],
      ["VG-C2C100", "100W USB-C cable", "mac_cable", 2600, 100, "USB-C ↔ USB-C"],
      ["VG-C2C60", "60W USB-C travel cable", "mac_cable", 2100, 60, "USB-C ↔ USB-C", "VG-C2C100"],
      ["VG-C2L", "Braided Lightning cable", "iphone_cable", 3000, 20, "USB-C ↔ Lightning"],
      ["VG-JP", "Japan grounded travel adapter", "adapter", 1400, 0, "Japan / Type A"],
    ],
  },
] as const;

export const seedCatalog: CatalogItem[] = merchants.flatMap((merchant) =>
  merchant.locations.flatMap(([locationId, locationName, address, pickupMinutes, transitMinutes, closesAt, area]) =>
    merchant.products.map(([sku, name, category, priceCents, watts, detail, alternativeFor], index) => ({
      offerId: `${merchant.id}-${locationId}-${sku}`.toLowerCase(),
      merchantId: merchant.id,
      merchantName: merchant.name,
      locationId,
      locationName,
      address,
      pickupMinutes,
      transitMinutes,
      closesAt,
      area,
      sku,
      name,
      category,
      priceCents,
      stock: locationId === "plq" && index === 0 ? 1 : 4 + (index % 3),
      ...(alternativeFor ? { alternativeFor } : {}),
      ...(category === "charger"
        ? { watts, inputVoltage: detail }
        : category === "adapter"
          ? { destination: detail }
          : { maxWatts: watts, connector: detail }),
    })),
  ),
);

function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function createMission(input: MissionInput, now = new Date()): Mission {
  const request = input.request.trim();
  if (!request) throw new DomainError("INVALID_MISSION", "Describe what you need to buy.");

  const budgetMatch = request.match(/(?:S\$|SGD\s*)\s?(\d+(?:\.\d{1,2})?)/i);
  const budgetCents = input.budgetCents ??
    (budgetMatch ? Math.round(Number(budgetMatch[1]) * 100) : 15_000);
  if (!Number.isInteger(budgetCents) || budgetCents < 1_000 || budgetCents > 100_000) {
    throw new DomainError("INVALID_BUDGET", "Budget must be between S$10 and S$1,000.");
  }

  return {
    id: `mis_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    request,
    budgetCents,
    destination: input.destination?.trim() || (/tokyo|japan/i.test(request) ? "Tokyo, Japan" : "Tokyo, Japan"),
    pickupDate: input.pickupDate || today(),
    currency: "SGD",
    devices: ["MacBook Air (USB-C PD)", "iPhone (Lightning)", "AirPods (Lightning)"],
    assumptions: [
      "iPhone and AirPods use Lightning; change the mission if yours use USB-C.",
      "Pickup time is an estimate from seeded merchant inventory.",
      "Prices include the full demo cart; no delivery or hidden fees.",
    ],
    createdAt: now.toISOString(),
  };
}

export function effectiveCatalog(items: CatalogItem[], scenario: Scenario): CatalogItem[] {
  return items.map((item) => {
    if (scenario === "stockout" && item.offerId === "byteroute-funan-br-gan65") {
      return { ...item, stock: 0 };
    }
    if (scenario === "price-change" && item.offerId === "byteroute-funan-br-gan65") {
      return { ...item, priceCents: item.priceCents + 1_000 };
    }
    return { ...item };
  });
}

function compatibility(item: CatalogItem): string | null {
  switch (item.category) {
    case "charger":
      if ((item.watts ?? 0) < 45 || item.inputVoltage !== "100–240V") return null;
      return `${item.watts}W USB-C PD covers the MacBook Air and smaller devices; ${item.inputVoltage} input works in Japan.`;
    case "mac_cable":
      if ((item.maxWatts ?? 0) < 45 || item.connector !== "USB-C ↔ USB-C") return null;
      return `${item.maxWatts}W USB-C cable supports the selected charger and MacBook Air.`;
    case "iphone_cable":
      if (item.connector !== "USB-C ↔ Lightning") return null;
      return "USB-C to Lightning matches the assumed iPhone and AirPods ports.";
    case "adapter":
      if (!item.destination?.includes("Japan")) return null;
      return "Type-A plug adapter fits standard Japanese outlets; the charger handles voltage conversion.";
  }
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const requiredCategories: Category[] = ["charger", "mac_cable", "iphone_cable", "adapter"];

function createRankedCart(
  mission: Mission,
  chosen: CatalogItem[],
  scenario: Scenario,
  now: Date,
  badge: RankedCart["badge"],
): RankedCart | null {
  const first = chosen[0];
  if (!first || chosen.length !== requiredCategories.length) return null;
  if (chosen.some((item) =>
    item.merchantId !== first.merchantId ||
    item.locationId !== first.locationId ||
    item.stock < 1 ||
    !compatibility(item)
  )) return null;
  if (new Set(chosen.map((item) => item.category)).size !== requiredCategories.length) return null;

  const totalCents = chosen.reduce((sum, item) => sum + item.priceCents, 0);
  if (totalCents > mission.budgetCents) return null;
  const ordered = requiredCategories.map((category) => chosen.find((item) => item.category === category)!);
  const cartIdentity = {
    merchantId: first.merchantId,
    locationId: first.locationId,
    offerIds: ordered.map((item) => item.offerId),
  };
  const lines: CartLine[] = ordered.map((item) => ({
    offerId: item.offerId,
    sku: item.sku,
    name: item.name,
    category: item.category,
    priceCents: item.priceCents,
    quantity: 1,
    compatibility: compatibility(item)!,
  }));
  const charger = ordered.find((item) => item.category === "charger")!;
  const powerScore = (charger.watts ?? 0) >= 65 ? 30 : 15;
  const pickupScore = Math.max(0, 18 - first.pickupMinutes / 10);
  const valueScore = 12 * (1 - totalCents / mission.budgetCents);
  const score = Math.round((100 + powerScore + pickupScore + valueScore) * 10) / 10;
  const id = `cart_${sha256(cartIdentity).slice(0, 12)}`;

  return {
    id,
    version: sha256({
      id,
      prices: ordered.map((item) => [item.offerId, item.priceCents]),
      scenario: scenario === "stockout" || scenario === "price-change" ? scenario : "normal",
    }),
    merchantId: first.merchantId,
    merchantName: first.merchantName,
    locationId: first.locationId,
    locationName: first.locationName,
    address: first.address,
    pickupMinutes: first.pickupMinutes,
    transitMinutes: first.transitMinutes,
    closesAt: first.closesAt,
    area: first.area,
    totalCents,
    currency: "SGD",
    score,
    badge,
    lines,
    checks: [
      "All four required components are in stock at one pickup location.",
      "Charger supports USB-C Power Delivery and 100–240V input.",
      "Every item is merchant-approved, compatible, and within the hard budget.",
    ],
    alternatives: [],
    inventoryCheckedAt: now.toISOString(),
  };
}

export function buildRankedCarts(
  mission: Mission,
  catalog: CatalogItem[],
  scenario: Scenario,
  now = new Date(),
): RankedCart[] {
  const eligible = effectiveCatalog(catalog, scenario).filter(
    (item) => item.stock > 0 && compatibility(item) && !item.alternativeFor,
  );
  const locations = Map.groupBy(eligible, (item) => `${item.merchantId}:${item.locationId}`);
  const carts: RankedCart[] = [];

  for (const items of locations.values()) {
    const first = items[0];
    if (!first) continue;
    const byCategory = Map.groupBy(items, (item) => item.category);
    if (requiredCategories.some((category) => !byCategory.get(category)?.length)) continue;

    for (const charger of byCategory.get("charger") ?? []) {
      const chosen = [
        charger,
        byCategory.get("mac_cable")![0]!,
        byCategory.get("iphone_cable")![0]!,
        byCategory.get("adapter")![0]!,
      ];
      const cart = createRankedCart(mission, chosen, scenario, now, "ALTERNATIVE");
      if (cart) carts.push(cart);
    }
  }

  const bestPerLocation = [...Map.groupBy(carts, (cart) => `${cart.merchantId}:${cart.locationId}`).values()]
    .map((locationCarts) => locationCarts.sort((a, b) => b.score - a.score)[0]!)
    .sort((a, b) => b.score - a.score || a.totalCents - b.totalCents);
  const selected = [...Map.groupBy(bestPerLocation, (cart) => cart.merchantId).values()]
    .map((merchantCarts) => merchantCarts[0]!);
  for (const area of ["Airport", "East"] as const) {
    const areaChoice = bestPerLocation.find((cart) => cart.area === area && !selected.includes(cart));
    if (areaChoice) selected.push(areaChoice);
  }
  for (const cart of bestPerLocation) {
    if (selected.length >= 5) break;
    if (!selected.includes(cart)) selected.push(cart);
  }
  selected.sort((a, b) => b.score - a.score || a.totalCents - b.totalCents);
  if (selected[0]) selected[0].badge = "BEST MATCH";
  const cheapest = selected.toSorted((a, b) => a.totalCents - b.totalCents)[0];
  if (cheapest && cheapest !== selected[0]) cheapest.badge = "BEST VALUE";
  return selected.slice(0, 5);
}

export function buildCartFromOfferIds(
  mission: Mission,
  catalog: CatalogItem[],
  scenario: Scenario,
  offerIds: string[],
  now = new Date(),
): RankedCart {
  const current = new Map(effectiveCatalog(catalog, scenario).map((item) => [item.offerId, item]));
  const chosen = offerIds.map((offerId) => current.get(offerId)).filter((item): item is CatalogItem => Boolean(item));
  const cart = createRankedCart(mission, chosen, scenario, now, "CUSTOM");
  if (!cart) {
    throw new DomainError(
      "INVALID_SUBSTITUTION",
      "That substitution no longer forms a complete, compatible, in-stock cart under budget.",
      true,
    );
  }
  return cart;
}

export function buildCartAlternatives(
  mission: Mission,
  cart: RankedCart,
  catalog: CatalogItem[],
  scenario: Scenario,
  approved: ApprovedAlternative[],
): CartAlternative[] {
  const current = new Map(effectiveCatalog(catalog, scenario).map((item) => [item.offerId, item]));
  const alternatives: CartAlternative[] = [];
  for (const pair of approved) {
    const fromLine = cart.lines.find((line) => line.offerId === pair.fromOfferId);
    const toLine = cart.lines.find((line) => line.offerId === pair.toOfferId);
    const source = fromLine || toLine;
    const replacement = current.get(fromLine ? pair.toOfferId : pair.fromOfferId);
    if (!source || !replacement || replacement.stock < 1 || replacement.category !== source.category) continue;
    try {
      const swapped = buildCartFromOfferIds(
        mission,
        catalog,
        scenario,
        cart.lines.map((line) => line.offerId === source.offerId ? replacement.offerId : line.offerId),
      );
      const replacementLine = swapped.lines.find((line) => line.offerId === replacement.offerId)!;
      alternatives.push({
        fromOfferId: source.offerId,
        offerId: replacement.offerId,
        name: replacementLine.name,
        category: replacementLine.category,
        priceCents: replacementLine.priceCents,
        stock: replacement.stock,
        compatibility: replacementLine.compatibility,
        deltaCents: swapped.totalCents - cart.totalCents,
        totalCents: swapped.totalCents,
      });
    } catch {
      // A disabled, stale, or over-budget replacement is intentionally omitted.
    }
  }
  return alternatives;
}

export function createPreview(
  mission: Mission,
  cart: RankedCart,
  now = new Date(),
): CheckoutPreview {
  const mandate: Mandate = {
    version: 1,
    missionId: mission.id,
    cartId: cart.id,
    cartVersion: cart.version,
    merchantId: cart.merchantId,
    merchantName: cart.merchantName,
    pickupLocation: cart.locationName,
    currency: cart.currency,
    amountCents: cart.totalCents,
    lines: cart.lines.map((line) => ({
      offerId: line.offerId,
      quantity: 1,
      priceCents: line.priceCents,
    })),
  };
  return {
    id: `pre_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    missionId: mission.id,
    cart,
    mandate,
    mandateHash: sha256(mandate),
    nonce: randomUUID(),
    expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    status: "pending",
    createdAt: now.toISOString(),
  };
}

export function publicPreview(preview: CheckoutPreview): PublicPreview {
  const { nonce: _nonce, ...safe } = preview;
  return safe;
}

export function money(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}
