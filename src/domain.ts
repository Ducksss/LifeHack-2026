import { createHash, randomUUID } from "node:crypto";
import type { AgentEvent, EvidenceCheck, EvidenceSource, MissionSpec, ResearchLead } from "./open-world.js";

export const CANONICAL_REQUEST =
  "I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it under S$300, fit it in one car boot, and make it pickup-ready today.";

export type Scenario =
  | "normal"
  | "stockout"
  | "price-change"
  | "auth-decline"
  | "order-fail";

export type Category = string;

export type SourceMode = "demo" | "live";
export type CommercePlatform = "demo" | "shopify" | "woocommerce";

export interface ConnectorStatus {
  platform: Exclude<CommercePlatform, "demo">;
  status: "healthy" | "failed" | "unconfigured";
  message: string;
  checkedAt: string;
  retryable: boolean;
}

export interface MissionInput {
  request: string;
  budgetCents?: number;
  campers?: number;
  pickupDate?: string;
  sourceMode?: SourceMode;
}

export interface Mission {
  id: string;
  request: string;
  budgetCents: number;
  campers: number;
  weather: "Rainy" | "Fair";
  maxPackedLiters: number;
  minTentWaterproofMm: number;
  pickupDate: string;
  currency: "SGD";
  assumptions: string[];
  createdAt: string;
  engine?: "camping" | "open-world";
  sourceMode?: SourceMode;
  liveCommerce?: {
    connectorStatuses: ConnectorStatus[];
  };
  openWorld?: {
    spec: MissionSpec;
    researchLeads: ResearchLead[];
    sources: EvidenceSource[];
    events: AgentEvent[];
    evidenceChecks: EvidenceCheck[];
  };
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
  area: "Central" | "East" | "North";
  sku: string;
  name: string;
  category: Category;
  priceCents: number;
  stock: number;
  packedLiters: number;
  capacity?: number;
  waterproofMm?: number;
  dampReady?: boolean;
  rValue?: number;
  lumens?: number;
  ipRating?: "IPX4";
  peopleCovered?: number;
  waterResistant?: boolean;
  alternativeFor?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface CartLine {
  offerId: string;
  sku: string;
  name: string;
  category: Category;
  priceCents: number;
  quantity: number;
  compatibility: string;
  platform?: CommercePlatform;
  externalStoreId?: string;
  externalProductId?: string;
  externalVariantId?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
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
  evidence?: EvidenceCheck[];
  sources?: EvidenceSource[];
  checkoutEligible?: boolean;
  rankingBreakdown?: { evidence: number; pickup: number; budget: number };
  platform?: CommercePlatform;
  externalStoreId?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
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
  identity: DemoIdentityStatus;
  preview?: PublicPreview;
  externalCheckout?: ExternalCheckoutPreview;
  order?: Order;
  receiptVerification?: ReceiptVerification;
  scenario: Scenario;
  requirements?: MissionSpec["requirements"];
  researchLeads?: ResearchLead[];
  sources?: EvidenceSource[];
  agentEvents?: AgentEvent[];
  evidenceChecks?: EvidenceCheck[];
  checkoutEligible: boolean;
  connectorStatuses?: ConnectorStatus[];
}

export interface ExternalCheckoutPreview {
  id: string;
  missionId: string;
  cartId: string;
  cartVersion: string;
  platform: Exclude<CommercePlatform, "demo">;
  merchantName: string;
  currency: "SGD";
  amountCents: number;
  lines: Array<{ offerId: string; name: string; quantity: number; priceCents: number }>;
  expiresAt: string;
  status: "pending" | "expired" | "invalidated";
  createdAt: string;
}

export interface DemoIdentityStatus {
  status: "not_connected" | "pending" | "verified" | "expired";
  displayLabel?: string;
  expiresAt?: string;
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
  lines: Array<{ offerId: string; quantity: number; priceCents: number }>;
}

export interface CheckoutPreview {
  id: string;
  missionId: string;
  cart: RankedCart;
  mandate: Mandate;
  mandateHash: string;
  nonce: string;
  identitySessionId: string;
  identitySubject: string;
  expiresAt: string;
  status: "pending" | "consumed" | "expired";
  createdAt: string;
}

export type PublicPreview = Omit<CheckoutPreview, "nonce" | "identitySessionId" | "identitySubject">;

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
  lines: Array<{ offerId: string; name: string; category: Category; priceCents: number; quantity: number }>;
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

type SeedProduct = Omit<
  CatalogItem,
  "offerId" | "merchantId" | "merchantName" | "locationId" | "locationName" | "address" | "pickupMinutes" | "transitMinutes" | "closesAt" | "area" | "stock"
>;

const merchants: Array<{
  id: string;
  name: string;
  locations: Array<readonly [string, string, string, number, number, string, CatalogItem["area"]]>;
  products: SeedProduct[];
}> = [
  {
    id: "trailhaus",
    name: "TrailHaus",
    locations: [
      ["funan", "Funan · L3", "107 North Bridge Rd", 30, 18, "21:30", "Central"],
      ["tampines", "Tampines Mall · L2", "4 Tampines Central 5", 70, 32, "22:00", "East"],
    ],
    products: [
      { sku: "TH-STORM2", name: "StormLite 2P tent · 3,000 mm rainfly", category: "tent", priceCents: 8_900, packedLiters: 42, capacity: 2, waterproofMm: 3_000 },
      { sku: "TH-DRYNEST", name: "DryNest synthetic sleeping bag · 18°C", category: "sleeping_bag", priceCents: 2_800, packedLiters: 12, dampReady: true },
      { sku: "TH-DRYNEST-LITE", name: "DryNest Lite synthetic sleeping bag · 20°C", category: "sleeping_bag", priceCents: 2_400, packedLiters: 10, dampReady: true, alternativeFor: "TH-DRYNEST" },
      { sku: "TH-REST2", name: "RestEasy sleeping mat · R 2.0", category: "sleeping_mat", priceCents: 2_200, packedLiters: 8, rValue: 2 },
      { sku: "TH-RAINBEAM", name: "RainBeam lantern · 250 lm · IPX4", category: "lantern", priceCents: 1_800, packedLiters: 3, lumens: 250, ipRating: "IPX4" },
      { sku: "TH-AID4", name: "Trail first-aid kit · covers 4", category: "first_aid", priceCents: 2_400, packedLiters: 4, peopleCovered: 4, waterResistant: true },
    ],
  },
  {
    id: "campworks",
    name: "CampWorks",
    locations: [
      ["plaza", "Plaza Singapura · B1", "68 Orchard Rd", 55, 15, "21:30", "Central"],
      ["junction8", "Junction 8 · L2", "9 Bishan Pl", 85, 25, "22:00", "North"],
    ],
    products: [
      { sku: "CW-RAIN2", name: "Weekender 2P tent · 2,500 mm rainfly", category: "tent", priceCents: 7_900, packedLiters: 46, capacity: 2, waterproofMm: 2_500 },
      { sku: "CW-SYN18", name: "CloudDown synthetic sleeping bag · 18°C", category: "sleeping_bag", priceCents: 2_500, packedLiters: 13, dampReady: true },
      { sku: "CW-MAT15", name: "CampRoll sleeping mat · R 1.5", category: "sleeping_mat", priceCents: 1_900, packedLiters: 9, rValue: 1.5 },
      { sku: "CW-MAT20", name: "CampRoll Plus sleeping mat · R 2.0", category: "sleeping_mat", priceCents: 2_200, packedLiters: 8, rValue: 2, alternativeFor: "CW-MAT15" },
      { sku: "CW-GLOW200", name: "CampGlow lantern · 200 lm · IPX4", category: "lantern", priceCents: 1_500, packedLiters: 3, lumens: 200, ipRating: "IPX4" },
      { sku: "CW-AID2", name: "Weekend first-aid kit · covers 2", category: "first_aid", priceCents: 2_100, packedLiters: 4, peopleCovered: 2, waterResistant: true },
    ],
  },
  {
    id: "outpostsupply",
    name: "Outpost Supply",
    locations: [
      ["greatworld", "Great World · L2", "1 Kim Seng Promenade", 45, 20, "21:30", "Central"],
      ["northpoint", "Northpoint City · B1", "930 Yishun Ave 2", 75, 35, "22:00", "North"],
    ],
    products: [
      { sku: "OS-SQUALL2", name: "SquallShield 2P tent · 4,000 mm rainfly", category: "tent", priceCents: 9_900, packedLiters: 38, capacity: 2, waterproofMm: 4_000 },
      { sku: "OS-DRY15", name: "DryTrail synthetic sleeping bag · 15°C", category: "sleeping_bag", priceCents: 3_000, packedLiters: 11, dampReady: true },
      { sku: "OS-MAT25", name: "TrailCore sleeping mat · R 2.5", category: "sleeping_mat", priceCents: 2_400, packedLiters: 7, rValue: 2.5 },
      { sku: "OS-BEACON", name: "StormBeacon lantern · 350 lm · IPX4", category: "lantern", priceCents: 2_200, packedLiters: 3, lumens: 350, ipRating: "IPX4" },
      { sku: "OS-BEACON-LITE", name: "StormBeacon Lite lantern · 250 lm · IPX4", category: "lantern", priceCents: 1_900, packedLiters: 3, lumens: 250, ipRating: "IPX4", alternativeFor: "OS-BEACON" },
      { sku: "OS-AID4", name: "Waterproof first-aid kit · covers 4", category: "first_aid", priceCents: 2_900, packedLiters: 4, peopleCovered: 4, waterResistant: true },
    ],
  },
  {
    id: "workhub",
    name: "WorkHub",
    locations: [
      ["funan", "Funan · L4", "107 North Bridge Rd", 25, 18, "21:30", "Central"],
    ],
    products: [
      { sku: "WH-DISPLAY27", name: "ViewPoint 27-inch USB-C monitor", category: "monitor", priceCents: 32_900, packedLiters: 0, attributes: { input: "usb-c", videoProtocol: "displayport", sizeInches: 27 } },
      { sku: "WH-DOCK11", name: "LinkDock 11-in-1 · 65 W", category: "dock", priceCents: 29_900, packedLiters: 0, attributes: { powerW: 65, videoOutput: "displayport", hostInput: "usb-c" } },
      { sku: "WH-CAM1080", name: "ClearCall 1080p webcam", category: "webcam", priceCents: 14_900, packedLiters: 0, attributes: { resolution: 1080, interface: "usb" } },
    ],
  },
];

export const seedCatalog: CatalogItem[] = merchants.flatMap((merchant) =>
  merchant.locations.flatMap(([locationId, locationName, address, pickupMinutes, transitMinutes, closesAt, area]) =>
    merchant.products.map((product, index) => ({
      ...product,
      offerId: `${merchant.id}-${locationId}-${product.sku}`.toLowerCase(),
      merchantId: merchant.id,
      merchantName: merchant.name,
      locationId,
      locationName,
      address,
      pickupMinutes,
      transitMinutes,
      closesAt,
      area,
      stock: locationId === "junction8" && index === 0 ? 1 : 4 + (index % 3),
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
    (budgetMatch ? Math.round(Number(budgetMatch[1]) * 100) : 30_000);
  if (!Number.isInteger(budgetCents) || budgetCents < 1_000 || budgetCents > 100_000) {
    throw new DomainError("INVALID_BUDGET", "Budget must be between S$10 and S$1,000.");
  }

  const campersMatch = request.match(/(\d+)\s*(?:first-time\s+)?(?:campers?|people|adults?)/i);
  const campers = input.campers ?? (campersMatch ? Number(campersMatch[1]) : 2);
  if (!Number.isInteger(campers) || campers < 1 || campers > 6) {
    throw new DomainError("INVALID_CAMPERS", "Camping kits support between 1 and 6 campers.");
  }

  const weather = /rain|wet/i.test(request) ? "Rainy" : "Fair";

  return {
    id: `mis_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    request,
    budgetCents,
    campers,
    weather,
    maxPackedLiters: 120,
    minTentWaterproofMm: weather === "Rainy" ? 2_000 : 0,
    pickupDate: input.pickupDate || today(),
    currency: "SGD",
    assumptions: [
      "The essential gear scope covers shelter, sleep, lighting, and first aid; food, water, clothing, transport, and campsite booking are already handled.",
      "A 120 L packed-gear allowance represents the available car-boot space.",
      "Pickup time is an estimate from seeded merchant inventory.",
      "Prices include the complete demo gear cart; no delivery or hidden fees.",
    ],
    createdAt: now.toISOString(),
    engine: "camping",
    sourceMode: input.sourceMode || "demo",
  };
}

export function effectiveCatalog(items: CatalogItem[], scenario: Scenario): CatalogItem[] {
  return items.map((item) => {
    if (scenario === "stockout" && item.offerId === "trailhaus-funan-th-storm2") {
      return { ...item, stock: 0 };
    }
    if (scenario === "price-change" && item.offerId === "trailhaus-funan-th-storm2") {
      return { ...item, priceCents: item.priceCents + 3_000 };
    }
    return { ...item };
  });
}

function requiredQuantity(category: Category, mission: Mission): number {
  return category === "sleeping_bag" || category === "sleeping_mat" ? mission.campers : 1;
}

function compatibility(item: CatalogItem, mission: Mission): string | null {
  switch (item.category) {
    case "tent":
      if ((item.capacity ?? 0) < mission.campers || (item.waterproofMm ?? 0) < mission.minTentWaterproofMm) return null;
      return `${item.capacity}-person tent with a ${item.waterproofMm?.toLocaleString()} mm rainfly keeps both campers covered in wet weather.`;
    case "sleeping_bag":
      if (!item.dampReady) return null;
      return `${mission.campers} synthetic sleeping bags stay dependable in damp conditions—one per camper.`;
    case "sleeping_mat":
      if ((item.rValue ?? 0) < 1.5) return null;
      return `${mission.campers} sleeping mats with R-value ${item.rValue} keep both campers off the wet ground.`;
    case "lantern":
      if ((item.lumens ?? 0) < 200 || (mission.weather === "Rainy" && item.ipRating !== "IPX4")) return null;
      return `${item.lumens} lumens and ${item.ipRating} protection provide rain-ready shared campsite lighting.`;
    case "first_aid":
      if ((item.peopleCovered ?? 0) < mission.campers || !item.waterResistant) return null;
      return `Water-resistant first-aid supplies cover all ${mission.campers} campers.`;
    default:
      return null;
  }
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const requiredCategories: Category[] = ["tent", "sleeping_bag", "sleeping_mat", "lantern", "first_aid"];

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
    item.merchantId !== first.merchantId || item.locationId !== first.locationId ||
    item.stock < requiredQuantity(item.category, mission) || !compatibility(item, mission)
  )) return null;
  if (new Set(chosen.map((item) => item.category)).size !== requiredCategories.length) return null;

  const ordered = requiredCategories.map((category) => chosen.find((item) => item.category === category)!);
  const packedLiters = ordered.reduce((sum, item) => sum + item.packedLiters * requiredQuantity(item.category, mission), 0);
  const totalCents = ordered.reduce((sum, item) => sum + item.priceCents * requiredQuantity(item.category, mission), 0);
  if (packedLiters > mission.maxPackedLiters || totalCents > mission.budgetCents) return null;

  const cartIdentity = { merchantId: first.merchantId, locationId: first.locationId, offerIds: ordered.map((item) => item.offerId) };
  const id = `cart_${sha256(cartIdentity).slice(0, 12)}`;
  const lines: CartLine[] = ordered.map((item) => ({
    offerId: item.offerId,
    sku: item.sku,
    name: item.name,
    category: item.category,
    priceCents: item.priceCents,
    quantity: requiredQuantity(item.category, mission),
    compatibility: compatibility(item, mission)!,
  }));
  const tent = ordered.find((item) => item.category === "tent")!;
  const weatherScore = Math.min(6, ((tent.waterproofMm ?? 0) - mission.minTentWaterproofMm) / 500);
  const pickupScore = Math.max(0, 20 - first.pickupMinutes / 5);
  const compactScore = 5 * (1 - packedLiters / mission.maxPackedLiters);
  const valueScore = 8 * (1 - totalCents / mission.budgetCents);

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
    score: Math.round((100 + weatherScore + pickupScore + compactScore + valueScore) * 10) / 10,
    badge,
    lines,
    checks: [
      `Rain-rated shelter, ${mission.campers} sleeping bags, ${mission.campers} mats, lighting, and first aid are in stock at one pickup location.`,
      `Packed volume is ${packedLiters} L—within the ${mission.maxPackedLiters} L car-boot allowance.`,
      `Every component covers ${mission.campers} campers and the cart stays within the hard budget.`,
    ],
    alternatives: [],
    inventoryCheckedAt: now.toISOString(),
    checkoutEligible: true,
    platform: "demo",
    lastVerifiedAt: now.toISOString(),
  };
}

export function buildRankedCarts(mission: Mission, catalog: CatalogItem[], scenario: Scenario, now = new Date()): RankedCart[] {
  const eligible = effectiveCatalog(catalog, scenario).filter(
    (item) => item.stock >= requiredQuantity(item.category, mission) && compatibility(item, mission) && !item.alternativeFor,
  );
  const carts = [...Map.groupBy(eligible, (item) => `${item.merchantId}:${item.locationId}`).values()]
    .map((items) => createRankedCart(
      mission,
      requiredCategories.map((category) => items.find((item) => item.category === category)!).filter(Boolean),
      scenario,
      now,
      "ALTERNATIVE",
    ))
    .filter((cart): cart is RankedCart => Boolean(cart))
    .sort((a, b) => b.score - a.score || a.totalCents - b.totalCents);
  const selected = [...Map.groupBy(carts, (cart) => cart.merchantId).values()].map((group) => group[0]!);
  for (const area of ["East", "North"] as const) {
    const choice = carts.find((cart) => cart.area === area && !selected.includes(cart));
    if (choice) selected.push(choice);
  }
  for (const cart of carts) {
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
  if (!cart) throw new DomainError("INVALID_SUBSTITUTION", "That substitution no longer forms a complete, compatible, in-stock cart under budget.", true);
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
    const source = cart.lines.find((line) => line.offerId === pair.fromOfferId || line.offerId === pair.toOfferId);
    const replacement = current.get(source?.offerId === pair.fromOfferId ? pair.toOfferId : pair.fromOfferId);
    if (!source || !replacement || replacement.category !== source.category) continue;
    try {
      const swapped = buildCartFromOfferIds(mission, catalog, scenario, cart.lines.map((line) => line.offerId === source.offerId ? replacement.offerId : line.offerId));
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
      // A stale or over-budget replacement is intentionally omitted.
    }
  }
  return alternatives;
}

export function createPreview(
  mission: Mission,
  cart: RankedCart,
  identitySessionId: string,
  identitySubject: string,
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
      quantity: line.quantity,
      priceCents: line.priceCents,
    })),
  };
  return {
    id: `pre_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    missionId: mission.id,
    cart,
    mandate,
    mandateHash: sha256({ mandate, identitySessionId, identitySubject }),
    nonce: randomUUID(),
    identitySessionId,
    identitySubject,
    expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    status: "pending",
    createdAt: now.toISOString(),
  };
}

export function publicPreview(preview: CheckoutPreview): PublicPreview {
  const {
    nonce: _nonce,
    identitySessionId: _identitySessionId,
    identitySubject: _identitySubject,
    ...safe
  } = preview;
  return safe;
}

export function money(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}
