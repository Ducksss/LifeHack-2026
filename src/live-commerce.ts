import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  DomainError,
  type CartLine,
  type ConnectorStatus,
  type MissionInput,
} from "./domain.js";
import {
  missionSpecSchema,
  type AttributeValue,
  type ConnectedOffer,
  type MissionSpec,
} from "./open-world.js";

export type LivePlatform = "shopify" | "woocommerce";

export interface PrivateCheckoutHandoff {
  platform: LivePlatform;
  externalCartId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface CommerceConnector {
  readonly platform: LivePlatform;
  discover(spec: MissionSpec, signal: AbortSignal): Promise<ConnectedOffer[]>;
  revalidate(lines: CartLine[], signal: AbortSignal): Promise<ConnectedOffer[]>;
  createCart(lines: CartLine[], idempotencyKey: string, signal: AbortSignal): Promise<PrivateCheckoutHandoff>;
}

export interface LiveDiscoveryResult {
  offers: ConnectedOffer[];
  statuses: ConnectorStatus[];
}

const livePlatforms: LivePlatform[] = ["shopify", "woocommerce"];

function message(error: unknown): string {
  return error instanceof Error ? error.message : "The platform did not return a usable response.";
}

export class LiveConnectorRegistry {
  private readonly byPlatform: Map<LivePlatform, CommerceConnector>;
  private currentStatuses: ConnectorStatus[] = livePlatforms.map((platform) => ({
    platform,
    status: "unconfigured",
    message: `${platform === "shopify" ? "Shopify" : "WooCommerce"} is not configured for this deployment.`,
    checkedAt: new Date(0).toISOString(),
    retryable: false,
  }));

  constructor(connectors: CommerceConnector[]) {
    this.byPlatform = new Map(connectors.map((connector) => [connector.platform, connector]));
  }

  connector(platform: LivePlatform): CommerceConnector {
    const connector = this.byPlatform.get(platform);
    if (!connector) {
      throw new DomainError("CONNECTOR_UNCONFIGURED", `${platform === "shopify" ? "Shopify" : "WooCommerce"} is not configured.`, true);
    }
    return connector;
  }

  statuses(): ConnectorStatus[] {
    return this.currentStatuses.map((status) => ({ ...status }));
  }

  async discoverWithStatuses(spec: MissionSpec, _pass: number, signal: AbortSignal): Promise<LiveDiscoveryResult> {
    const checkedAt = new Date().toISOString();
    const results = await Promise.allSettled(livePlatforms.map(async (platform) => {
      const connector = this.byPlatform.get(platform);
      if (!connector) return { platform, configured: false as const, offers: [] };
      return { platform, configured: true as const, offers: await connector.discover(spec, signal) };
    }));

    const offers: ConnectedOffer[] = [];
    this.currentStatuses = results.map((result, index): ConnectorStatus => {
      const platform = livePlatforms[index]!;
      if (result.status === "rejected") {
        return { platform, status: "failed", message: message(result.reason), checkedAt, retryable: true };
      }
      if (!result.value.configured) {
        return {
          platform,
          status: "unconfigured",
          message: `${platform === "shopify" ? "Shopify" : "WooCommerce"} is not configured for this deployment.`,
          checkedAt,
          retryable: false,
        };
      }
      offers.push(...result.value.offers);
      return {
        platform,
        status: "healthy",
        message: `${result.value.offers.length} current offer${result.value.offers.length === 1 ? "" : "s"} normalized.`,
        checkedAt,
        retryable: false,
      };
    });
    return { offers, statuses: this.statuses() };
  }

  async discover(spec: MissionSpec, pass: number, signal: AbortSignal): Promise<ConnectedOffer[]> {
    return (await this.discoverWithStatuses(spec, pass, signal)).offers;
  }
}

export function isCampingRequest(request: string): boolean {
  return /\b(?:camp|camping|tent|sleeping\s*(?:bag|mat))\b/i.test(request);
}

export function campingMissionSpec(input: MissionInput, now = new Date()): MissionSpec {
  const budgetMatch = input.request.match(/(?:S\$|SGD\s*)\s?(\d+(?:\.\d{1,2})?)/i);
  const campersMatch = input.request.match(/(\d+)\s*(?:first-time\s+)?(?:campers?|people|adults?)/i);
  const budgetCents = input.budgetCents ?? (budgetMatch ? Math.round(Number(budgetMatch[1]) * 100) : 90_000);
  const campers = input.campers ?? (campersMatch ? Number(campersMatch[1]) : 2);
  const pickupDate = input.pickupDate || new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return missionSpecSchema.parse({
    goal: `Complete rainy-weekend camping kit for ${campers} first-time campers`,
    market: "Singapore",
    currency: "SGD",
    budgetCents,
    pickupDate,
    maxPackedLiters: 120,
    requirements: [
      {
        id: "tent",
        label: "Rain-rated tent",
        searchQuery: `${campers}-person waterproof camping tent pickup Singapore`,
        quantity: 1,
        predicates: [
          { field: "capacity", operator: "gte", value: campers },
          { field: "waterproofMm", operator: "gte", value: 2_000 },
        ],
      },
      {
        id: "sleeping_bag",
        label: "Damp-ready sleeping bag",
        searchQuery: "synthetic damp-weather sleeping bag pickup Singapore",
        quantity: campers,
        predicates: [{ field: "dampReady", operator: "eq", value: true }],
      },
      {
        id: "sleeping_mat",
        label: "Insulated sleeping mat",
        searchQuery: "camping sleeping mat R-value pickup Singapore",
        quantity: campers,
        predicates: [{ field: "rValue", operator: "gte", value: 1.5 }],
      },
      {
        id: "lantern",
        label: "Rain-ready lantern",
        searchQuery: "IPX4 camping lantern 200 lumens pickup Singapore",
        quantity: 1,
        predicates: [
          { field: "lumens", operator: "gte", value: 200 },
          { field: "ipRating", operator: "eq", value: "IPX4" },
        ],
      },
      {
        id: "first_aid",
        label: "Water-resistant first-aid kit",
        searchQuery: `${campers}-person water-resistant camping first-aid kit Singapore`,
        quantity: 1,
        predicates: [
          { field: "peopleCovered", operator: "gte", value: campers },
          { field: "waterResistant", operator: "eq", value: true },
        ],
      },
    ],
    compatibility: [],
    preferences: ["Complete one-store cart", "Current stock", "Lower total", "Sooner pickup"],
    assumptions: [
      "Food, water, clothing, transport, and campsite booking are already handled.",
      "The complete packed gear must fit within a 120 L car-boot allowance.",
      "Payment and the final order remain on the merchant site.",
    ],
  });
}

const keyAliases: Record<string, string> = {
  category: "category",
  wovencategory: "category",
  capacity: "capacity",
  waterproof: "waterproofMm",
  waterproofmm: "waterproofMm",
  dampready: "dampReady",
  rvalue: "rValue",
  brightness: "lumens",
  lumens: "lumens",
  iprating: "ipRating",
  peoplecovered: "peopleCovered",
  waterresistant: "waterResistant",
  packedvolume: "packedLiters",
  packedliters: "packedLiters",
  pickupminutes: "pickupMinutes",
  transitminutes: "transitMinutes",
  closesat: "closesAt",
  pickuparea: "area",
  area: "area",
  pickuplocation: "locationName",
  locationname: "locationName",
  pickupaddress: "address",
  address: "address",
};

function attributeKey(value: string): string | undefined {
  return keyAliases[value.toLowerCase().replaceAll(/[^a-z0-9]/g, "")];
}

function attributeValue(value: unknown): AttributeValue | undefined {
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (/^(?:true|yes)$/i.test(trimmed)) return true;
  if (/^(?:false|no)$/i.test(trimmed)) return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.slice(0, 200);
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function addAttribute(target: Record<string, AttributeValue>, name: unknown, value: unknown): void {
  if (typeof name !== "string") return;
  const key = attributeKey(name);
  const parsed = attributeValue(value);
  if (key && parsed !== undefined) target[key] = parsed;
}

function parsePairs(target: Record<string, AttributeValue>, value: unknown): void {
  if (typeof value !== "string") return;
  for (const pair of value.split(/[;|\n]/)) {
    const normalized = pair.replace(/^\s*\[woven\]\s*/i, "");
    const match = normalized.match(/^\s*(?:woven[.:_-])?([a-zA-Z][a-zA-Z0-9 _.-]{0,60})\s*[:=]\s*(.+?)\s*$/);
    if (match) addAttribute(target, match[1], match[2]);
  }
}

function normalizedAttributes(product: Record<string, unknown>, variant: Record<string, unknown>): Record<string, AttributeValue> {
  const attributes: Record<string, AttributeValue> = {};
  for (const [name, value] of Object.entries(record(product.attributes))) addAttribute(attributes, name, value);
  for (const [name, value] of Object.entries(record(variant.attributes))) addAttribute(attributes, name, value);
  for (const tag of list(product.tags)) parsePairs(attributes, typeof tag === "string" ? tag.replace(/^woven[:_-]?/i, "") : tag);
  for (const tag of list(variant.tags)) parsePairs(attributes, typeof tag === "string" ? tag.replace(/^woven[:_-]?/i, "") : tag);
  const description = record(product.description);
  parsePairs(attributes, product.description);
  parsePairs(attributes, description.plain);
  parsePairs(attributes, description.html);
  parsePairs(attributes, product.description_html);
  for (const [name, value] of Object.entries(record(record(product.metadata).attributes))) addAttribute(attributes, name, value);
  for (const [name, value] of Object.entries(record(record(product.metadata).tech_specs))) addAttribute(attributes, name, value);
  for (const metafield of list(product.metafields)) {
    const field = record(metafield);
    addAttribute(attributes, field.key || field.name, field.value);
  }
  for (const item of list(product.attributes)) {
    const field = record(item);
    const values = list(field.terms).map((term) => record(term).name).filter(Boolean);
    const options = list(field.options);
    addAttribute(attributes, field.name || field.slug, values[0] ?? options[0]);
  }
  for (const option of list(variant.options)) {
    const field = record(option);
    addAttribute(attributes, field.name, field.value);
  }
  return attributes;
}

function integer(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function sourceDetails(attributes: Record<string, AttributeValue>): Pick<ConnectedOffer, "locationName" | "address" | "pickupMinutes" | "transitMinutes" | "closesAt" | "area"> {
  const area = attributes.area;
  return {
    locationName: typeof attributes.locationName === "string" ? attributes.locationName : "Merchant online store",
    address: typeof attributes.address === "string" ? attributes.address : "Singapore",
    pickupMinutes: integer(attributes.pickupMinutes, 120),
    transitMinutes: integer(attributes.transitMinutes, 30),
    closesAt: typeof attributes.closesAt === "string" && /^\d{2}:\d{2}$/.test(attributes.closesAt) ? attributes.closesAt : "21:00",
    area: area === "East" || area === "North" ? area : "Central",
  };
}

function minorAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  const candidate = record(value);
  return minorAmount(candidate.amount ?? candidate.value ?? candidate.min ?? candidate.min_amount);
}

function currencyOf(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && /^[A-Z]{3}$/.test(value)) return value;
    const candidate = record(value);
    const found = currencyOf(candidate.currency, candidate.currency_code);
    if (found) return found;
  }
  return undefined;
}

function requirePublicStoreUrl(value: string, label: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new DomainError("CONNECTOR_CONFIG_INVALID", `${label} must use HTTP or HTTPS.`);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new DomainError("CONNECTOR_CONFIG_INVALID", `${label} must use HTTPS.`);
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url;
}

function requirePrivateCheckoutUrl(value: string, label: string): URL {
  const url = new URL(value);
  if (url.username || url.password) throw new DomainError("CONNECTOR_RESPONSE_INVALID", `${label} cannot contain URL credentials.`);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new DomainError("CONNECTOR_RESPONSE_INVALID", `${label} must use HTTPS.`);
  }
  return url;
}

async function responseJson(response: Response, platform: string): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new DomainError("CONNECTOR_UNAVAILABLE", `${platform} returned HTTP ${response.status}.`, true);
  return record(body);
}

interface ShopifyConnectorOptions {
  storeUrl: string;
  agentProfileUrl: string;
  merchantName?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

export class ShopifyUcpConnector implements CommerceConnector {
  readonly platform = "shopify" as const;
  private readonly storeUrl: URL;
  private readonly agentProfileUrl: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly merchantName: string;
  private readonly now: () => Date;
  private requestId = 0;

  constructor(options: ShopifyConnectorOptions) {
    this.storeUrl = requirePublicStoreUrl(options.storeUrl, "SHOPIFY_STORE_URL");
    this.agentProfileUrl = requirePublicStoreUrl(options.agentProfileUrl, "SHOPIFY_AGENT_PROFILE_URL");
    this.fetchImpl = options.fetchImpl || fetch;
    this.merchantName = options.merchantName || "Woven Trail Shop · Shopify";
    this.now = options.now || (() => new Date());
  }

  private async tool(name: string, arguments_: Record<string, unknown>, signal: AbortSignal, idempotencyKey?: string): Promise<Record<string, unknown>> {
    const endpoint = new URL("/api/ucp/mcp", this.storeUrl);
    const body = await responseJson(await this.fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++this.requestId,
        method: "tools/call",
        params: {
          name,
          arguments: {
            meta: {
              "ucp-agent": { profile: this.agentProfileUrl.toString() },
              ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
            },
            ...arguments_,
          },
        },
      }),
      signal,
    }), "Shopify");
    if (body.error) throw new DomainError("CONNECTOR_UNAVAILABLE", `Shopify ${name} failed: ${String(record(body.error).message || "unknown UCP error")}.`, true);
    const result = record(body.result);
    if (result.isError) throw new DomainError("CONNECTOR_UNAVAILABLE", `Shopify ${name} returned an error.`, true);
    return record(result.structuredContent || result);
  }

  private products(content: Record<string, unknown>): Record<string, unknown>[] {
    const catalog = record(content.catalog);
    const products = list(content.products).length ? list(content.products) : list(catalog.products);
    return products.map(record);
  }

  private normalizeProduct(product: Record<string, unknown>, requirementId: string): ConnectedOffer[] {
    const variants = list(product.variants).length ? list(product.variants).map(record) : [record(product.variant)];
    return variants.flatMap((variant, index) => {
      const attributes = normalizedAttributes(product, variant);
      const category = typeof attributes.category === "string" ? attributes.category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_") : "";
      if (category !== requirementId) return [];
      const price = variant.price ?? record(product.price_range).min ?? product.price;
      const priceCents = minorAmount(price);
      const currency = currencyOf(price, product.price_range, variant, product);
      const availability = record(variant.availability);
      const available = variant.available_for_sale ?? variant.availableForSale ?? variant.available ?? availability.available ?? product.available_for_sale ?? product.available;
      const stock = integer(variant.quantity_available ?? variant.quantityAvailable ?? availability.quantity, available === false ? 0 : 999);
      const productId = String(product.id || product.product_id || "");
      const variantId = String(variant.id || variant.variant_id || productId);
      const sourceUrl = String(product.url || product.online_store_url || new URL(`/products/${String(product.handle || productId)}`, this.storeUrl));
      if (!productId || !variantId || priceCents === undefined || currency !== "SGD" || stock <= 0) return [];
      const details = sourceDetails(attributes);
      const checkedAt = this.now().toISOString();
      return [{
        offerId: `shopify:${variantId}`,
        requirementId,
        merchantId: `shopify:${this.storeUrl.host}`,
        merchantName: this.merchantName,
        locationId: `shopify:${this.storeUrl.host}`,
        ...details,
        sku: String(variant.sku || product.sku || `SHOPIFY-${index + 1}`),
        name: String(variant.title && variant.title !== "Default Title" ? `${product.title} · ${variant.title}` : product.title || "Shopify product"),
        priceCents,
        stock,
        attributes,
        source: { id: `shopify:${productId}`, kind: "connected", title: `${this.merchantName} live catalog`, url: sourceUrl },
        platform: "shopify",
        externalStoreId: this.storeUrl.origin,
        externalProductId: productId,
        externalVariantId: variantId,
        sourceUrl,
        lastVerifiedAt: checkedAt,
      }];
    });
  }

  async discover(spec: MissionSpec, signal: AbortSignal): Promise<ConnectedOffer[]> {
    const batches = await Promise.all(spec.requirements.map(async (requirement) => {
      const content = await this.tool("search_catalog", {
        catalog: {
          query: requirement.searchQuery,
          context: { address_country: "SG", currency: "SGD" },
          pagination: { limit: 50 },
        },
      }, signal);
      return this.products(content).flatMap((product) => this.normalizeProduct(product, requirement.id));
    }));
    return [...new Map(batches.flat().map((offer) => [`${offer.offerId}:${offer.requirementId}`, offer])).values()];
  }

  async revalidate(lines: CartLine[], signal: AbortSignal): Promise<ConnectedOffer[]> {
    const productIds = [...new Set(lines.map((line) => line.externalProductId).filter((id): id is string => Boolean(id)))];
    if (productIds.length !== new Set(lines.map((line) => line.externalProductId)).size || !productIds.length) {
      throw new DomainError("CART_STALE", "A Shopify product identifier is missing. Rebuild the cart.", true);
    }
    const content = await this.tool("lookup_catalog", {
      catalog: { ids: productIds, context: { address_country: "SG", currency: "SGD" } },
    }, signal);
    const offers = lines.flatMap((line) => this.products(content)
      .filter((product) => String(product.id || product.product_id) === line.externalProductId)
      .flatMap((product) => this.normalizeProduct(product, line.category))
      .filter((offer) => offer.externalVariantId === line.externalVariantId));
    return offers;
  }

  async createCart(lines: CartLine[], idempotencyKey: string, signal: AbortSignal): Promise<PrivateCheckoutHandoff> {
    if (!idempotencyKey.trim() || idempotencyKey.length > 128) throw new DomainError("INVALID_IDEMPOTENCY_KEY", "A valid idempotency key is required.");
    if (lines.some((line) => line.platform !== "shopify" || !line.externalVariantId)) {
      throw new DomainError("MIXED_PLATFORM_CART", "Shopify cart creation accepts only Shopify variants.");
    }
    const content = await this.tool("create_cart", {
      cart: {
        line_items: lines.map((line) => ({ quantity: line.quantity, item: { id: line.externalVariantId } })),
        context: { address_country: "SG", currency: "SGD" },
      },
    }, signal, idempotencyKey);
    const cart = record(content.cart);
    const outcomes = [...list(content.messages), ...list(cart.messages)].map(record);
    if (outcomes.some((outcome) => outcome.type === "error" || ["quantity_adjusted", "out_of_stock", "item_unavailable"].includes(String(outcome.code)))) {
      throw new DomainError("CART_STALE", "Shopify adjusted or rejected a selected line. Review a refreshed cart.", true);
    }
    const returnedLines = list(cart.line_items).map(record);
    if (returnedLines.length) {
      const exactLines = lines.every((line) => returnedLines.some((returned) => {
        const item = record(returned.item);
        return String(item.id || returned.item_id || "") === line.externalVariantId && integer(returned.quantity, -1) === line.quantity;
      }));
      if (!exactLines || returnedLines.length !== lines.length) {
        throw new DomainError("CART_STALE", "Shopify returned a different cart composition. Review refreshed terms.", true);
      }
    }
    const total = list(cart.totals).map(record).find((candidate) => candidate.type === "total");
    if (total) {
      const expectedTotal = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
      if (minorAmount(total.amount) !== expectedTotal || currencyOf(total, cart) !== "SGD") {
        throw new DomainError("CART_STALE", "Shopify returned a different SGD total. Review refreshed terms.", true);
      }
    }
    const checkoutUrl = String(cart.continue_url || cart.continueUrl || "");
    const parsed = requirePrivateCheckoutUrl(checkoutUrl, "Shopify continue_url");
    const expiresAt = String(cart.expires_at || cart.expiresAt || new Date(this.now().getTime() + 10 * 60_000).toISOString());
    return {
      platform: "shopify",
      externalCartId: String(cart.id || `shopify_${randomBytes(8).toString("hex")}`),
      checkoutUrl: parsed.toString(),
      expiresAt,
    };
  }
}

interface WooCommerceConnectorOptions {
  storeUrl: string;
  handoffSecret: string;
  allowedProductIds: number[];
  merchantName?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

const wooHandoffPayloadSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(10),
  }).strict()).min(1).max(20),
  expiresAt: z.number().int().positive(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,80}$/),
}).strict();

export type WooHandoffPayload = z.infer<typeof wooHandoffPayloadSchema>;

function handoffSignature(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeSignature(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signWooHandoff(payload: WooHandoffPayload, secret: string): { payload: string; signature: string } {
  if (secret.length < 32) throw new DomainError("HANDOFF_SECRET_INVALID", "The WooCommerce handoff secret must be at least 32 characters.");
  const parsed = wooHandoffPayloadSchema.parse(payload);
  const encoded = Buffer.from(JSON.stringify(parsed)).toString("base64url");
  return { payload: encoded, signature: handoffSignature(encoded, secret) };
}

export function verifyWooHandoff(input: {
  payload: string;
  signature: string;
  secret: string;
  allowedProductIds: ReadonlySet<number>;
  usedNonces: Set<string>;
  now?: Date;
}): WooHandoffPayload {
  if (!safeSignature(handoffSignature(input.payload, input.secret), input.signature)) {
    throw new DomainError("HANDOFF_SIGNATURE_INVALID", "The WooCommerce handoff signature is invalid.");
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(input.payload, "base64url").toString("utf8"));
  } catch {
    throw new DomainError("HANDOFF_PAYLOAD_INVALID", "The WooCommerce handoff payload is invalid.");
  }
  const payload = wooHandoffPayloadSchema.parse(decoded);
  const nowSeconds = Math.floor((input.now || new Date()).getTime() / 1_000);
  if (payload.expiresAt <= nowSeconds) throw new DomainError("HANDOFF_EXPIRED", "The WooCommerce handoff expired.", true);
  if (payload.expiresAt > nowSeconds + 10 * 60) throw new DomainError("HANDOFF_EXPIRY_INVALID", "The WooCommerce handoff expiry is outside the allowed window.");
  if (input.usedNonces.has(payload.nonce)) throw new DomainError("HANDOFF_REPLAYED", "The WooCommerce handoff was already used.");
  if (payload.items.some((item) => !input.allowedProductIds.has(item.productId))) {
    throw new DomainError("HANDOFF_PRODUCT_DENIED", "The WooCommerce handoff contains an unknown product.");
  }
  if (payload.items.reduce((sum, item) => sum + item.quantity, 0) > 50) {
    throw new DomainError("HANDOFF_QUANTITY_INVALID", "The WooCommerce handoff contains too many items.");
  }
  input.usedNonces.add(payload.nonce);
  return payload;
}

export class WooCommerceStoreConnector implements CommerceConnector {
  readonly platform = "woocommerce" as const;
  private readonly storeUrl: URL;
  private readonly handoffSecret: string;
  private readonly allowedProductIds: Set<number>;
  private readonly fetchImpl: typeof fetch;
  private readonly merchantName: string;
  private readonly now: () => Date;

  constructor(options: WooCommerceConnectorOptions) {
    this.storeUrl = requirePublicStoreUrl(options.storeUrl, "WOOCOMMERCE_STORE_URL");
    if (options.handoffSecret.length < 32) throw new DomainError("CONNECTOR_CONFIG_INVALID", "WOOCOMMERCE_HANDOFF_SECRET must be at least 32 characters.");
    if (!options.allowedProductIds.length) throw new DomainError("CONNECTOR_CONFIG_INVALID", "WOOCOMMERCE_ALLOWED_PRODUCT_IDS must list the imported products.");
    this.handoffSecret = options.handoffSecret;
    this.allowedProductIds = new Set(options.allowedProductIds);
    this.fetchImpl = options.fetchImpl || fetch;
    this.merchantName = options.merchantName || "Woven Trail Shop · WooCommerce";
    this.now = options.now || (() => new Date());
  }

  private async products(ids: number[] | undefined, signal: AbortSignal): Promise<Record<string, unknown>[]> {
    const endpoint = new URL("/wp-json/wc/store/v1/products", this.storeUrl);
    endpoint.searchParams.set("per_page", "100");
    if (ids?.length) endpoint.searchParams.set("include", ids.join(","));
    const body = await this.fetchImpl(endpoint, { headers: { accept: "application/json" }, signal });
    const parsed = await body.json().catch(() => null);
    if (!body.ok || !Array.isArray(parsed)) throw new DomainError("CONNECTOR_UNAVAILABLE", `WooCommerce returned HTTP ${body.status}.`, true);
    return parsed.map(record);
  }

  private normalizeProduct(product: Record<string, unknown>, requirementId: string): ConnectedOffer[] {
    const productId = integer(product.id, 0);
    if (!productId || !this.allowedProductIds.has(productId)) return [];
    const attributes = normalizedAttributes(product, {});
    const category = typeof attributes.category === "string" ? attributes.category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_") : "";
    if (category !== requirementId) return [];
    const prices = record(product.prices);
    const priceCents = minorAmount(prices.price);
    const currency = currencyOf(prices.currency_code, prices);
    if (priceCents === undefined || currency !== "SGD" || product.is_in_stock !== true || product.is_purchasable === false) return [];
    const sourceUrl = String(product.permalink || new URL(`/?p=${productId}`, this.storeUrl));
    const details = sourceDetails(attributes);
    const checkedAt = this.now().toISOString();
    return [{
      offerId: `woocommerce:${productId}`,
      requirementId,
      merchantId: `woocommerce:${this.storeUrl.host}`,
      merchantName: this.merchantName,
      locationId: `woocommerce:${this.storeUrl.host}`,
      ...details,
      sku: String(product.sku || `WOO-${productId}`),
      name: String(product.name || "WooCommerce product"),
      priceCents,
      stock: integer(product.low_stock_remaining, 999),
      attributes,
      source: { id: `woocommerce:${productId}`, kind: "connected", title: `${this.merchantName} live Store API`, url: sourceUrl },
      platform: "woocommerce",
      externalStoreId: this.storeUrl.origin,
      externalProductId: String(productId),
      externalVariantId: String(productId),
      sourceUrl,
      lastVerifiedAt: checkedAt,
    }];
  }

  async discover(spec: MissionSpec, signal: AbortSignal): Promise<ConnectedOffer[]> {
    const products = await this.products(undefined, signal);
    return spec.requirements.flatMap((requirement) => products.flatMap((product) => this.normalizeProduct(product, requirement.id)));
  }

  async revalidate(lines: CartLine[], signal: AbortSignal): Promise<ConnectedOffer[]> {
    const ids = lines.map((line) => Number(line.externalProductId));
    if (ids.some((id) => !Number.isInteger(id) || !this.allowedProductIds.has(id))) {
      throw new DomainError("CART_STALE", "A WooCommerce product identifier is missing or no longer allowed. Rebuild the cart.", true);
    }
    const products = await this.products(ids, signal);
    return lines.flatMap((line) => products
      .filter((product) => integer(product.id, 0) === Number(line.externalProductId))
      .flatMap((product) => this.normalizeProduct(product, line.category))
      .filter((offer) => offer.externalVariantId === line.externalVariantId));
  }

  async createCart(lines: CartLine[], idempotencyKey: string, _signal: AbortSignal): Promise<PrivateCheckoutHandoff> {
    if (!idempotencyKey.trim() || idempotencyKey.length > 128) throw new DomainError("INVALID_IDEMPOTENCY_KEY", "A valid idempotency key is required.");
    if (lines.some((line) => line.platform !== "woocommerce" || !line.externalProductId)) {
      throw new DomainError("MIXED_PLATFORM_CART", "WooCommerce cart creation accepts only WooCommerce products.");
    }
    const expiresAt = new Date(this.now().getTime() + 5 * 60_000);
    const signed = signWooHandoff({
      items: lines.map((line) => ({ productId: Number(line.externalProductId), quantity: line.quantity })),
      expiresAt: Math.floor(expiresAt.getTime() / 1_000),
      nonce: randomBytes(18).toString("base64url"),
    }, this.handoffSecret);
    const checkout = new URL("/woven-commerce/handoff", this.storeUrl);
    checkout.searchParams.set("woven_payload", signed.payload);
    checkout.searchParams.set("woven_signature", signed.signature);
    return {
      platform: "woocommerce",
      externalCartId: `woo_${createHmac("sha256", this.handoffSecret).update(idempotencyKey).digest("hex").slice(0, 16)}`,
      checkoutUrl: checkout.toString(),
      expiresAt: expiresAt.toISOString(),
    };
  }
}

export function liveConnectorsFromEnv(baseUrl: string): CommerceConnector[] {
  const connectors: CommerceConnector[] = [];
  if (process.env.SHOPIFY_STORE_URL) {
    connectors.push(new ShopifyUcpConnector({
      storeUrl: process.env.SHOPIFY_STORE_URL,
      agentProfileUrl: process.env.SHOPIFY_AGENT_PROFILE_URL || `${baseUrl.replace(/\/$/, "")}/.well-known/ucp`,
      merchantName: process.env.SHOPIFY_MERCHANT_NAME,
    }));
  }
  if (process.env.WOOCOMMERCE_STORE_URL && process.env.WOOCOMMERCE_HANDOFF_SECRET) {
    const allowedProductIds = (process.env.WOOCOMMERCE_ALLOWED_PRODUCT_IDS || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    connectors.push(new WooCommerceStoreConnector({
      storeUrl: process.env.WOOCOMMERCE_STORE_URL,
      handoffSecret: process.env.WOOCOMMERCE_HANDOFF_SECRET,
      allowedProductIds,
      merchantName: process.env.WOOCOMMERCE_MERCHANT_NAME,
    }));
  }
  return connectors;
}
