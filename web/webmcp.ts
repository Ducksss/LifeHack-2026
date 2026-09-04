import type { CartAlternative, MissionInput, MissionView, RankedCart } from "../src/domain";
import {
  PICKUP_AREAS,
  PRIORITY_LABELS,
  RANKING_PRIORITIES,
  cartTraits,
  cartWaterproof,
  formatMoney,
  rankCarts,
  type PickupArea,
  type RankingPriority,
} from "./ranking";

type JsonSchema = Record<string, unknown> & { additionalProperties: false };

export interface WebMcpTool {
  name: WebMcpToolName;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
}

export interface WebMcpContext {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
}

export interface WebMcpActivity {
  id: string;
  tool: WebMcpToolName;
  input: Record<string, unknown>;
  status: "running" | "done" | "error";
  message?: string;
  at: string;
}

export interface WebMcpAdapter {
  getView: () => MissionView | null;
  startMission: (input: MissionInput, signal: AbortSignal) => Promise<MissionView>;
  invoke: (
    name: "select_cart" | "swap_cart_item" | "build_carts",
    arguments_: Record<string, unknown>,
    signal: AbortSignal,
  ) => Promise<MissionView>;
  compare: (options: { priority?: RankingPriority; area?: PickupArea }) => void;
  verifyReceipt: (receiptNumber: string, signature: string, signal: AbortSignal) => Promise<unknown>;
  onActivity?: (activity: WebMcpActivity) => void;
}

export const WEBMCP_TOOL_NAMES = [
  "start_mission",
  "get_mission",
  "compare_carts",
  "select_cart",
  "swap_cart_item",
  "refresh_carts",
  "verify_receipt",
] as const;

export type WebMcpToolName = (typeof WEBMCP_TOOL_NAMES)[number];

export const WEBMCP_READ_ONLY_TOOLS: readonly WebMcpToolName[] = ["get_mission", "refresh_carts", "verify_receipt"];

/** Actions that are deliberately absent from the tool surface. Only the person can take them, in the visible page. */
export const WEBMCP_HUMAN_ONLY_ACTIONS = [
  "Verify demo identity",
  "Review exact checkout terms",
  "Confirm the purchase",
] as const;

/** Prompts a person can paste into ChatGPT or Codex to exercise the shared page. */
export const WEBMCP_PROMPTS = [
  "Compare the camping carts by rain protection with Central pickup, then select the best one.",
  "Which approved swap changes the selected cart's total? Apply it if the kit stays rain-ready.",
  "Refresh price and stock, tell me if anything changed, and summarise what I still have to do myself.",
] as const;

export const WEBMCP_COMPARE_EVENT = "woven:webmcp:compare";

/**
 * The spec and the ChatGPT desktop browser expose the API on `document`; Chrome's early preview shipped it on
 * `navigator`. Prefer the spec location and fall back so one build works in both.
 */
export function resolveModelContext(scope: { document?: unknown; navigator?: unknown }): WebMcpContext | null {
  for (const holder of [scope.document, scope.navigator]) {
    const candidate = (holder as { modelContext?: unknown } | undefined)?.modelContext;
    if (candidate && typeof (candidate as WebMcpContext).registerTool === "function") return candidate as WebMcpContext;
  }
  return null;
}

const emptySchema: JsonSchema = { type: "object", properties: {}, additionalProperties: false };

const BOUNDARY = "The person verifies identity, reviews exact terms, and confirms on the page; no tool can do that.";

function currentView(adapter: WebMcpAdapter): MissionView {
  const view = adapter.getView();
  if (!view) throw new Error("Woven is still loading the mission. Retry in a moment.");
  return view;
}

function place(cart: RankedCart) {
  return `${cart.merchantName} · ${cart.locationName}`;
}

function lineName(cart: RankedCart, offerId: string) {
  return cart.lines.find((line) => line.offerId === offerId)?.name || offerId;
}

function describeAlternative(cart: RankedCart, alternative: CartAlternative) {
  const delta = alternative.deltaCents === 0
    ? "same price"
    : `${alternative.deltaCents > 0 ? "+" : "−"}${formatMoney(Math.abs(alternative.deltaCents))}`;
  return {
    offerId: alternative.offerId,
    name: alternative.name,
    replaces: lineName(cart, alternative.fromOfferId),
    priceDelta: delta,
    newTotal: formatMoney(alternative.totalCents),
    stock: alternative.stock,
  };
}

export function summarizeCart(cart: RankedCart, view: MissionView, options: { detailed?: boolean } = {}) {
  const summary: Record<string, unknown> = {
    cartId: cart.id,
    merchant: cart.merchantName,
    location: cart.locationName,
    area: cart.area,
    total: formatMoney(cart.totalCents),
    readyInMinutes: cart.pickupMinutes,
    rainflyMm: cartWaterproof(cart),
    badge: cart.badge.toLowerCase(),
    approvedSwaps: cart.alternatives.length,
    selected: cart.id === view.selectedCartId,
  };
  if (cart.checkoutEligible === false) summary.checkoutEligible = false;
  if (options.detailed) {
    summary.travelMinutes = cart.transitMinutes;
    summary.closesAt = cart.closesAt;
    summary.items = cart.lines.map((line) => `${line.quantity > 1 ? `${line.quantity}× ` : ""}${line.name} (${formatMoney(line.priceCents * line.quantity)})`);
    summary.checks = cart.checks;
    summary.approvedAlternatives = cart.alternatives.map((alternative) => describeAlternative(cart, alternative));
  }
  return summary;
}

function nextSteps(view: MissionView): string {
  if (view.order) {
    return view.order.receipt
      ? "The order is complete. Call verify_receipt to check the receipt signature."
      : "The order did not complete. The person can review the result on the page.";
  }
  if (view.preview?.status === "pending") {
    return "Exact checkout terms are on the page waiting for the person's own confirmation. Wait for them.";
  }
  if (!view.carts.length) {
    return "No complete cart fits right now. Ask the person to relax a constraint, or call refresh_carts after stock changes.";
  }
  if (view.selectedCartId) {
    return `A cart is selected. The person must click Review checkout, verify demo identity, and confirm exact terms on the page. You can still compare_carts, swap_cart_item, or refresh_carts.`;
  }
  return "Call compare_carts to rerank on the page, then select_cart by merchant name or cartId.";
}

export function summarizeMission(view: MissionView) {
  const selected = view.carts.find((cart) => cart.id === view.selectedCartId) || null;
  return {
    missionId: view.mission.id,
    request: view.mission.request,
    engine: view.mission.engine || "camping",
    budget: formatMoney(view.mission.budgetCents),
    campers: view.mission.campers,
    weather: view.mission.weather,
    pickupDate: view.mission.pickupDate,
    carts: view.carts.map((cart) => summarizeCart(cart, view)),
    selectedCart: selected ? summarizeCart(selected, view, { detailed: true }) : null,
    identity: view.identity.status,
    checkout: view.order
      ? `order ${view.order.status}`
      : view.preview?.status === "pending"
        ? "exact terms shown, awaiting the person's confirmation"
        : "not started",
    ...(view.order ? { order: { id: view.order.id, status: view.order.status, total: formatMoney(view.order.amountCents), receiptNumber: view.order.receiptNumber } } : {}),
    humanOnly: [...WEBMCP_HUMAN_ONLY_ACTIONS],
    nextSteps: nextSteps(view),
  };
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

/** Resolve a cart from an exact id or from natural-language merchant and location names. */
export function resolveCart(view: MissionView, input: { cartId?: unknown; merchant?: unknown; location?: unknown }): RankedCart {
  const cartId = normalize(input.cartId);
  if (cartId) {
    const byId = view.carts.find((cart) => cart.id.toLowerCase() === cartId);
    if (byId) return byId;
  }
  const merchant = normalize(input.merchant);
  const location = normalize(input.location);
  const options = () => view.carts.map((cart) => `${place(cart)} (cartId ${cart.id})`).join("; ");
  if (!merchant && !location) {
    throw new Error(cartId ? `No cart ${input.cartId} in this mission. Choose one of: ${options()}.` : `Give a cartId or a merchant name. Current carts: ${options()}.`);
  }
  const matches = view.carts.filter((cart) =>
    (!merchant || cart.merchantName.toLowerCase().includes(merchant))
    && (!location || `${cart.locationName} ${cart.area} ${cart.address}`.toLowerCase().includes(location)));
  if (matches.length === 1) return matches[0]!;
  if (!matches.length) throw new Error(`No cart matches merchant "${input.merchant ?? ""}"${location ? ` at "${input.location}"` : ""}. Current carts: ${options()}.`);
  throw new Error(`Several carts match. Add a location or use a cartId: ${matches.map((cart) => `${place(cart)} (cartId ${cart.id})`).join("; ")}.`);
}

function resolveAlternative(cart: RankedCart, input: { offerId?: unknown; itemName?: unknown }): CartAlternative {
  const offerId = normalize(input.offerId);
  const itemName = normalize(input.itemName);
  const options = () => cart.alternatives.map((alternative) => `${alternative.name} (offerId ${alternative.offerId})`).join("; ");
  if (!cart.alternatives.length) throw new Error(`${place(cart)} has no merchant-approved alternative right now.`);
  const byId = offerId ? cart.alternatives.find((alternative) => alternative.offerId.toLowerCase() === offerId) : undefined;
  if (byId) return byId;
  if (itemName) {
    const byName = cart.alternatives.filter((alternative) => alternative.name.toLowerCase().includes(itemName));
    if (byName.length === 1) return byName[0]!;
    if (byName.length > 1) throw new Error(`Several alternatives match "${input.itemName}". Use an offerId: ${options()}.`);
  }
  throw new Error(`Choose an approved alternative for ${place(cart)}: ${options()}.`);
}

/** Carts are compared per merchant location, so an approved swap that reissues the cart id reads as a total change, not a disappearance. */
export function diffCarts(before: RankedCart[], after: RankedCart[]) {
  const key = (cart: RankedCart) => `${cart.merchantId}|${cart.locationId}`;
  const changes: string[] = [];
  const afterByPlace = new Map(after.map((cart) => [key(cart), cart]));
  for (const cart of before) {
    const next = afterByPlace.get(key(cart));
    if (!next) changes.push(`${place(cart)} is no longer a complete in-stock cart`);
    else if (next.totalCents !== cart.totalCents) changes.push(`${place(cart)} total ${formatMoney(cart.totalCents)} → ${formatMoney(next.totalCents)}`);
    else if (next.id !== cart.id || next.version !== cart.version) changes.push(`${place(cart)} was rebuilt as cart ${next.id} at the same total`);
  }
  const beforePlaces = new Set(before.map(key));
  for (const cart of after) if (!beforePlaces.has(key(cart))) changes.push(`${place(cart)} is newly available at ${formatMoney(cart.totalCents)}`);
  return changes;
}

function withActivity(tool: WebMcpTool, adapter: WebMcpAdapter): WebMcpTool {
  let sequence = 0;
  const execute: WebMcpTool["execute"] = async (input, options) => {
    const id = `${tool.name}-${++sequence}-${Date.now().toString(36)}`;
    const emit = (status: WebMcpActivity["status"], message?: string) =>
      adapter.onActivity?.({ id, tool: tool.name, input, status, message, at: new Date().toISOString() });
    emit("running");
    try {
      const result = await tool.execute(input, options);
      const message = result && typeof result === "object" && "message" in result ? String((result as { message: unknown }).message) : undefined;
      emit("done", message);
      return result;
    } catch (caught) {
      emit("error", caught instanceof Error ? caught.message : "Tool failed.");
      throw caught;
    }
  };
  return { ...tool, execute };
}

export function createWebMcpTools(adapter: WebMcpAdapter): WebMcpTool[] {
  const tools: WebMcpTool[] = [
    {
      name: "start_mission",
      title: "Start a Woven mission",
      description: "Start a new shopping mission on this page from one plain-language request, for example a rainy-weekend camping kit for two under S$300 with pickup today. Woven builds complete, compatible carts, each from one merchant pickup location, and shows them to the person. Call get_mission first if a mission is already open.",
      inputSchema: {
        type: "object",
        properties: {
          request: { type: "string", minLength: 1, maxLength: 1_000, description: "What the person needs, in their words, including hard constraints." },
          budgetCents: { type: "integer", minimum: 1_000, maximum: 100_000, description: "Optional hard budget in SGD cents, e.g. 30000 for S$300." },
          campers: { type: "integer", minimum: 1, maximum: 6, description: "Optional number of campers to equip." },
          pickupDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Optional pickup date, YYYY-MM-DD." },
        },
        required: ["request"],
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const view = await adapter.startMission(input as unknown as MissionInput, signal);
        const mission = summarizeMission(view);
        return { message: `Mission ${view.mission.id}: ${view.carts.length} complete cart${view.carts.length === 1 ? "" : "s"} within ${mission.budget}.`, mission };
      },
    },
    {
      name: "get_mission",
      title: "Read the mission on this page",
      description: "Read the mission the person is looking at: request, constraints, every complete cart with totals, pickup times and rain ratings, the selected cart's items and approved swaps, identity status, and what still needs the person. Use it before selecting or swapping.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const view = currentView(adapter);
        const selected = view.carts.find((cart) => cart.id === view.selectedCartId);
        return {
          message: `Mission ${view.mission.id} has ${view.carts.length} complete cart${view.carts.length === 1 ? "" : "s"}${selected ? `; ${place(selected)} is selected` : ""}.`,
          mission: summarizeMission(view),
        };
      },
    },
    {
      name: "compare_carts",
      title: "Compare carts on the page",
      description: "Open the Choice Center the person sees and rerank the complete carts by what matters most: balanced, value (lowest total), speed (soonest pickup), or weather (most rainproof), optionally preferring a pickup area. Returns the ranked carts with cartIds so you can select one.",
      inputSchema: {
        type: "object",
        properties: {
          priority: { type: "string", enum: [...RANKING_PRIORITIES], description: "balanced (default), value = lowest total, speed = soonest pickup, weather = most rainproof." },
          area: { type: "string", enum: [...PICKUP_AREAS], description: "Preferred pickup area; matching carts rank first. Default Any." },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input) => {
        const view = currentView(adapter);
        if (view.mission.engine === "open-world") throw new Error("The visual Choice Center is available for camping missions. Use get_mission to read these carts.");
        if (!view.carts.length) throw new Error("There are no complete carts to compare right now.");
        const priority = (RANKING_PRIORITIES as readonly string[]).includes(String(input.priority)) ? input.priority as RankingPriority : "balanced";
        const area = (PICKUP_AREAS as readonly string[]).includes(String(input.area)) ? input.area as PickupArea : "Any";
        adapter.compare({ priority, area });
        const ranked = rankCarts(view.carts, priority, area);
        return {
          message: `Opened the Choice Center ranked by ${PRIORITY_LABELS[priority].toLowerCase()}${area === "Any" ? "" : ` with ${area} pickup first`}; ${place(ranked[0]!)} leads.`,
          applied: { priority, area },
          ranking: ranked.map((cart, index) => ({
            rank: index + 1,
            cartId: cart.id,
            merchant: cart.merchantName,
            location: cart.locationName,
            area: cart.area,
            total: formatMoney(cart.totalCents),
            readyInMinutes: cart.pickupMinutes,
            rainflyMm: cartWaterproof(cart),
            traits: cartTraits(cart, view.carts),
            selected: cart.id === view.selectedCartId,
          })),
          nextSteps: "Call select_cart with a cartId or merchant name. " + BOUNDARY,
        };
      },
    },
    {
      name: "select_cart",
      title: "Select a cart",
      description: "Select one of the complete carts on this page, by cartId or by merchant name plus an optional location such as merchant \"TrailHaus\" and location \"Funan\". The page updates to show that cart's items, proof, and pickup plan. Selection is reversible and is not identity verification or purchase authorization.",
      inputSchema: {
        type: "object",
        properties: {
          cartId: { type: "string", minLength: 5, maxLength: 80, description: "Exact cartId from get_mission or compare_carts." },
          merchant: { type: "string", minLength: 2, maxLength: 80, description: "Merchant name, e.g. TrailHaus, Outpost Supply, CampWorks." },
          location: { type: "string", minLength: 2, maxLength: 80, description: "Optional pickup location or area, e.g. Funan or Central." },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const current = currentView(adapter);
        const cart = resolveCart(current, input);
        const view = await adapter.invoke("select_cart", { missionId: current.mission.id, cartId: cart.id }, signal);
        const selected = view.carts.find(({ id }) => id === view.selectedCartId) || cart;
        return {
          message: `Selected ${place(selected)} · ${formatMoney(selected.totalCents)}.`,
          selected: summarizeCart(selected, view, { detailed: true }),
          nextSteps: nextSteps(view),
        };
      },
    },
    {
      name: "swap_cart_item",
      title: "Apply an approved alternative",
      description: "Replace one item in the selected cart with a merchant-approved compatible alternative, by offerId or by the alternative's item name, and update the page. Woven revalidates completeness, rain rating, stock, and budget. Only current approved alternatives are allowed; arbitrary products cannot be added.",
      inputSchema: {
        type: "object",
        properties: {
          offerId: { type: "string", minLength: 5, maxLength: 120, description: "Exact offerId from the selected cart's approvedAlternatives." },
          itemName: { type: "string", minLength: 2, maxLength: 120, description: "Or the approved alternative's item name." },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const current = currentView(adapter);
        const cart = current.carts.find(({ id }) => id === current.selectedCartId);
        if (!cart) throw new Error("Select a cart before applying an alternative.");
        const alternative = resolveAlternative(cart, input);
        const view = await adapter.invoke("swap_cart_item", { missionId: current.mission.id, cartId: cart.id, offerId: alternative.offerId }, signal);
        const selected = view.carts.find(({ id }) => id === view.selectedCartId) || cart;
        return {
          message: `Swapped ${lineName(cart, alternative.fromOfferId)} for ${alternative.name} at ${place(selected)} · now ${formatMoney(selected.totalCents)}.`,
          swap: { replaced: lineName(cart, alternative.fromOfferId), with: alternative.name, newTotal: formatMoney(selected.totalCents) },
          selected: summarizeCart(selected, view, { detailed: true }),
          nextSteps: nextSteps(view),
        };
      },
    },
    {
      name: "refresh_carts",
      title: "Refresh price and stock",
      description: "Ask Woven to revalidate current merchant price and stock for the mission on this page and report what changed. Use it before the person reviews checkout. This does not create checkout terms or authorize a purchase.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (_input, { signal }) => {
        const current = currentView(adapter);
        const view = await adapter.invoke("build_carts", { missionId: current.mission.id }, signal);
        const changes = diffCarts(current.carts, view.carts);
        return {
          message: changes.length
            ? `Refreshed ${view.carts.length} carts. ${changes.length} change${changes.length === 1 ? "" : "s"}: ${changes.join("; ")}.`
            : `Refreshed ${view.carts.length} carts. No price or stock changes.`,
          changes,
          mission: summarizeMission(view),
        };
      },
    },
    {
      name: "verify_receipt",
      title: "Verify the receipt",
      description: "Verify the server signature on the simulated receipt for the order on this page, after the person has confirmed a purchase themselves. This reads an existing result and cannot create an order.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async (_input, { signal }) => {
        const view = currentView(adapter);
        const receipt = view.order?.receipt;
        if (!receipt) throw new Error("There is no receipt yet. Only the person can confirm a purchase on the page.");
        const verification = await adapter.verifyReceipt(receipt.receiptNumber, receipt.signature, signal);
        const valid = Boolean((verification as { valid?: unknown } | undefined)?.valid);
        return {
          message: `Receipt ${receipt.receiptNumber} signature ${valid ? "is valid" : "did not verify"}.`,
          receiptNumber: receipt.receiptNumber,
          merchant: receipt.merchantName,
          total: formatMoney(view.order!.amountCents),
          verification,
        };
      },
    },
  ];
  return tools.map((tool) => withActivity(tool, adapter));
}

export async function registerWebMcpTools(context: WebMcpContext, adapter: WebMcpAdapter, signal: AbortSignal) {
  for (const tool of createWebMcpTools(adapter)) await context.registerTool(tool, { signal });
}
