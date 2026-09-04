import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { MissionView, RankedCart } from "../src/domain.js";
import {
  WEBMCP_HUMAN_ONLY_ACTIONS,
  WEBMCP_PROMPTS,
  WEBMCP_READ_ONLY_TOOLS,
  WEBMCP_TOOL_NAMES,
  createWebMcpTools,
  registerWebMcpTools,
  resolveCart,
  resolveModelContext,
  summarizeMission,
  type WebMcpActivity,
  type WebMcpAdapter,
  type WebMcpTool,
} from "../web/webmcp.js";

function cart(overrides: Partial<RankedCart> & Pick<RankedCart, "id" | "merchantName" | "locationName" | "area" | "totalCents">): RankedCart {
  return {
    version: "version-1",
    merchantId: overrides.merchantName.toLowerCase().replaceAll(" ", "-"),
    address: "1 Demo Road",
    pickupMinutes: 30,
    transitMinutes: 18,
    closesAt: "21:30",
    currency: "SGD",
    score: 100,
    badge: "ALTERNATIVE",
    lines: [
      { offerId: `${overrides.id}-tent`, sku: "TENT", name: "Stormline 2P tent · 3,000 mm rainfly", category: "tent", priceCents: 12_900, quantity: 1, compatibility: "Covers two campers" },
      { offerId: `${overrides.id}-bag`, sku: "BAG", name: "Damp-ready sleeping bag", category: "sleeping_bag", priceCents: 3_900, quantity: 2, compatibility: "One per camper" },
      { offerId: `${overrides.id}-mat`, sku: "MAT", name: "R2 sleeping mat", category: "sleeping_mat", priceCents: 2_500, quantity: 2, compatibility: "Off the wet ground" },
      { offerId: `${overrides.id}-lantern`, sku: "LAMP", name: "IPX4 lantern", category: "lantern", priceCents: 2_900, quantity: 1, compatibility: "Rain-ready light" },
      { offerId: `${overrides.id}-aid`, sku: "AID", name: "Water-resistant first-aid kit", category: "first_aid", priceCents: 1_900, quantity: 1, compatibility: "Covers two campers" },
    ],
    checks: ["Complete and compatible", "Under budget", "In stock at one location"],
    alternatives: [],
    inventoryCheckedAt: "2026-08-30T00:00:00.000Z",
    checkoutEligible: true,
    locationId: overrides.locationName.toLowerCase(),
    ...overrides,
  };
}

const trailhausFunan = cart({
  id: "cart_trailhaus_funan",
  merchantName: "TrailHaus",
  locationName: "Funan · L3",
  area: "Central",
  totalCents: 23_100,
  badge: "BEST MATCH",
  score: 120,
  alternatives: [
    {
      fromOfferId: "cart_trailhaus_funan-lantern",
      offerId: "offer-lantern-alt",
      name: "Stormlight 300 lantern",
      category: "lantern",
      priceCents: 3_000,
      stock: 2,
      compatibility: "Still rain-ready",
      deltaCents: 100,
      totalCents: 23_200,
    },
  ],
});

const view = {
  mission: {
    id: "mis_webmcp",
    request: "A complete rainy camping kit for two",
    budgetCents: 30_000,
    campers: 2,
    weather: "Rainy",
    maxPackedLiters: 120,
    minTentWaterproofMm: 2_000,
    pickupDate: "2026-08-31",
    currency: "SGD",
    assumptions: [],
    createdAt: "2026-08-30T00:00:00.000Z",
    engine: "camping",
  },
  carts: [
    trailhausFunan,
    cart({ id: "cart_outpost_greatworld", merchantName: "Outpost Supply", locationName: "Great World · L2", area: "Central", totalCents: 25_800, pickupMinutes: 45, lines: [{ offerId: "o-tent", sku: "T", name: "Ridgeline 2P tent · 4,000 mm rainfly", category: "tent", priceCents: 15_900, quantity: 1, compatibility: "Covers two" }] }),
    cart({ id: "cart_campworks_plaza", merchantName: "CampWorks", locationName: "Plaza Singapura · B1", area: "Central", totalCents: 20_900, pickupMinutes: 55, badge: "BEST VALUE" }),
    cart({ id: "cart_outpost_northpoint", merchantName: "Outpost Supply", locationName: "Northpoint City · B1", area: "North", totalCents: 25_800, pickupMinutes: 75 }),
    cart({ id: "cart_trailhaus_tampines", merchantName: "TrailHaus", locationName: "Tampines Mall · L2", area: "East", totalCents: 23_100, pickupMinutes: 70 }),
  ],
  selectedCartId: "cart_trailhaus_funan",
  identity: { status: "not_connected" },
  scenario: "normal",
  checkoutEligible: true,
} satisfies MissionView;

function adapter(overrides: Partial<WebMcpAdapter> = {}) {
  const calls: Array<[string, Record<string, unknown>]> = [];
  const comparisons: Array<Record<string, unknown>> = [];
  const activity: WebMcpActivity[] = [];
  const base: WebMcpAdapter = {
    getView: () => view,
    startMission: async () => view,
    invoke: async (name, arguments_) => {
      calls.push([name, arguments_]);
      return view;
    },
    compare: (options) => comparisons.push(options),
    verifyReceipt: async () => ({ valid: true }),
    onActivity: (entry) => activity.push(entry),
  };
  return { value: { ...base, ...overrides }, calls, comparisons, activity };
}

function toolsFor(value: WebMcpAdapter) {
  const tools = new Map(createWebMcpTools(value).map((tool) => [tool.name, tool]));
  const execute = (name: string, input: Record<string, unknown> = {}) =>
    tools.get(name as WebMcpTool["name"])!.execute(input, { signal: new AbortController().signal }) as Promise<Record<string, any>>;
  return { tools, execute };
}

test("WebMCP exposes a useful site-tool surface without identity or purchase authority", () => {
  const { value } = adapter();
  const tools = createWebMcpTools(value);

  assert.deepEqual(tools.map((tool) => tool.name), WEBMCP_TOOL_NAMES);
  assert.equal(tools.length, 7);
  assert.ok(tools.every((tool) => tool.inputSchema.additionalProperties === false));
  for (const name of WEBMCP_READ_ONLY_TOOLS) assert.equal(tools.find((tool) => tool.name === name)?.annotations?.readOnlyHint, true, name);
  assert.ok(tools.every((tool) => !/identity|checkout|confirm|purchase|pay/i.test(tool.name)));
  assert.ok(tools.every((tool) => tool.description.length <= 500), "descriptions stay within the agent budget");
  assert.ok(tools.every((tool) => /^[a-z_]{1,30}$/.test(tool.name)));
  assert.equal(WEBMCP_HUMAN_ONLY_ACTIONS.length, 3);
  assert.equal(WEBMCP_PROMPTS.length, 3);
});

test("WebMCP results are compact, id-bearing, and free of confirmation or identity secrets", async () => {
  const { value } = adapter();
  const { execute } = toolsFor(value);
  const result = await execute("get_mission");
  const serialized = JSON.stringify(result);

  assert.ok(serialized.length < 2_600, `get_mission result is ${serialized.length} characters`);
  assert.equal(result.mission.carts.length, 5);
  assert.ok(result.mission.carts.every((entry: { cartId: string; total: string }) => entry.cartId && entry.total.startsWith("S$")));
  assert.equal(result.mission.selectedCart.merchant, "TrailHaus");
  assert.deepEqual(result.mission.selectedCart.approvedAlternatives[0].replaces, "IPX4 lantern");
  assert.equal(result.mission.identity, "not_connected");
  assert.deepEqual(result.mission.humanOnly, [...WEBMCP_HUMAN_ONLY_ACTIONS]);
  assert.match(result.mission.nextSteps, /Review checkout/);
  assert.doesNotMatch(serialized, /nonce|authorizationUrl|identitySession|mandateHash|signature/i);
  assert.doesNotMatch(serialized, /"lines"|"version"|"score"|"inventoryCheckedAt"/);
});

test("select_cart accepts natural-language merchant and location names as well as ids", async () => {
  assert.equal(resolveCart(view, { cartId: "cart_campworks_plaza" }).merchantName, "CampWorks");
  assert.equal(resolveCart(view, { merchant: "campworks" }).id, "cart_campworks_plaza");
  assert.equal(resolveCart(view, { merchant: "TrailHaus", location: "Tampines" }).id, "cart_trailhaus_tampines");
  assert.equal(resolveCart(view, { merchant: "outpost", location: "North" }).id, "cart_outpost_northpoint");
  assert.throws(() => resolveCart(view, { merchant: "TrailHaus" }), /Several carts match.*Funan.*Tampines/);
  assert.throws(() => resolveCart(view, { merchant: "Decathlon" }), /No cart matches merchant "Decathlon"/);
  assert.throws(() => resolveCart(view, { cartId: "cart_missing" }), /No cart cart_missing/);
  assert.throws(() => resolveCart(view, {}), /Give a cartId or a merchant name/);

  const { value, calls } = adapter();
  const { execute } = toolsFor(value);
  const result = await execute("select_cart", { merchant: "TrailHaus", location: "Funan" });
  assert.deepEqual(calls, [["select_cart", { missionId: "mis_webmcp", cartId: "cart_trailhaus_funan" }]]);
  assert.match(result.message, /Selected TrailHaus · Funan · L3 · S\$231\.00/);
  assert.equal(result.selected.items.length, 5);
});

test("swap_cart_item resolves approved alternatives by offerId or item name and refuses anything else", async () => {
  const { value, calls } = adapter();
  const { execute } = toolsFor(value);

  const byName = await execute("swap_cart_item", { itemName: "stormlight" });
  assert.match(byName.message, /Swapped IPX4 lantern for Stormlight 300 lantern/);
  await execute("swap_cart_item", { offerId: "offer-lantern-alt" });
  assert.deepEqual(calls.map(([, arguments_]) => arguments_.offerId), ["offer-lantern-alt", "offer-lantern-alt"]);
  await assert.rejects(execute("swap_cart_item", { itemName: "random product" }), /Choose an approved alternative/);
});

test("compare_carts reranks the shared page and returns the same order the person sees", async () => {
  const { value, comparisons } = adapter();
  const { execute } = toolsFor(value);

  const result = await execute("compare_carts", { priority: "weather", area: "Central" });
  assert.deepEqual(comparisons, [{ priority: "weather", area: "Central" }]);
  assert.deepEqual(result.applied, { priority: "weather", area: "Central" });
  assert.equal(result.ranking[0].merchant, "Outpost Supply");
  assert.equal(result.ranking[0].rainflyMm, 4_000);
  assert.ok(result.ranking.slice(0, 3).every((entry: { area: string }) => entry.area === "Central"));
  assert.match(result.message, /Most rainproof|most rainproof/);

  const fallback = await execute("compare_carts", { priority: "nonsense" });
  assert.deepEqual(fallback.applied, { priority: "balanced", area: "Any" });
});

test("refresh_carts reports price and stock changes between revalidations", async () => {
  const refreshed: MissionView = {
    ...view,
    carts: view.carts
      .filter((entry) => entry.id !== "cart_campworks_plaza")
      .map((entry) => (entry.id === "cart_trailhaus_funan" ? { ...entry, totalCents: 23_900 } : entry))
      .map((entry) => (entry.id === "cart_outpost_northpoint" ? { ...entry, id: "cart_outpost_northpoint_custom", version: "version-2" } : entry)),
  };
  const { value, calls } = adapter({ invoke: async (name, arguments_) => { calls.push([name, arguments_]); return refreshed; } });
  const { execute } = toolsFor(value);

  const result = await execute("refresh_carts");
  assert.deepEqual(calls, [["build_carts", { missionId: "mis_webmcp" }]]);
  assert.deepEqual(result.changes, [
    "TrailHaus · Funan · L3 total S$231.00 → S$239.00",
    "CampWorks · Plaza Singapura · B1 is no longer a complete in-stock cart",
    "Outpost Supply · Northpoint City · B1 was rebuilt as cart cart_outpost_northpoint_custom at the same total",
  ]);
  assert.match(result.message, /3 changes/);

  const unchanged = await toolsFor(adapter().value).execute("refresh_carts");
  assert.deepEqual(unchanged.changes, []);
  assert.match(unchanged.message, /No price or stock changes/);
});

test("verify_receipt only reads an existing receipt and never creates one", async () => {
  await assert.rejects(toolsFor(adapter().value).execute("verify_receipt"), /Only the person can confirm a purchase/);

  const ordered: MissionView = {
    ...view,
    order: {
      id: "ord_1",
      missionId: "mis_webmcp",
      previewId: "prev_1",
      idempotencyKey: "idem",
      merchantName: "TrailHaus",
      pickupLocation: "Funan · L3",
      amountCents: 23_100,
      currency: "SGD",
      status: "confirmed",
      paymentMode: "simulated",
      receiptNumber: "RCPT-1",
      createdAt: "2026-08-30T00:00:00.000Z",
      receipt: {
        receiptNumber: "RCPT-1",
        orderId: "ord_1",
        missionId: "mis_webmcp",
        request: view.mission.request,
        merchantName: "TrailHaus",
        pickupLocation: "Funan · L3",
        lines: [],
        amountCents: 23_100,
        currency: "SGD",
        paymentMode: "simulated",
        createdAt: "2026-08-30T00:00:00.000Z",
        signature: "a".repeat(64),
      },
    },
  };
  const { value } = adapter({ getView: () => ordered });
  const result = await toolsFor(value).execute("verify_receipt");
  assert.match(result.message, /RCPT-1 signature is valid/);
  assert.equal(summarizeMission(ordered).checkout, "order confirmed");
  assert.match(summarizeMission(ordered).nextSteps, /verify_receipt/);
});

test("every WebMCP call is reported to the shared page as running, then done or failed", async () => {
  const { value, activity } = adapter();
  const { execute } = toolsFor(value);

  await execute("get_mission");
  await assert.rejects(execute("select_cart", { merchant: "Nowhere" }));

  assert.deepEqual(activity.map((entry) => [entry.tool, entry.status]), [
    ["get_mission", "running"],
    ["get_mission", "done"],
    ["select_cart", "running"],
    ["select_cart", "error"],
  ]);
  assert.equal(activity[0]!.id, activity[1]!.id);
  assert.match(activity[1]!.message!, /5 complete carts/);
  assert.match(activity[3]!.message!, /No cart matches/);
});

test("the model context is resolved from the spec location first, then Chrome's preview location", () => {
  const spec = { registerTool: async () => {} };
  const preview = { registerTool: async () => {} };
  assert.equal(resolveModelContext({ document: { modelContext: spec }, navigator: { modelContext: preview } }), spec);
  assert.equal(resolveModelContext({ document: {}, navigator: { modelContext: preview } }), preview);
  assert.equal(resolveModelContext({ document: { modelContext: {} }, navigator: {} }), null);
  assert.equal(resolveModelContext({}), null);
});

test("WebMCP registration is abort-bound so page navigation unregisters every tool", async () => {
  const { value } = adapter();
  const registrations: Array<{ tool: WebMcpTool; signal?: AbortSignal }> = [];
  const controller = new AbortController();

  await registerWebMcpTools({
    registerTool: async (tool, options) => {
      registrations.push({ tool, signal: options?.signal });
    },
  }, value, controller.signal);

  assert.deepEqual(registrations.map(({ tool }) => tool.name), WEBMCP_TOOL_NAMES);
  assert.ok(registrations.every(({ signal }) => signal === controller.signal));
  controller.abort();
  assert.ok(registrations.every(({ signal }) => signal?.aborted));
});

test("the public WebMCP route is top-level, origin-keyed, and reuses the shared page", () => {
  const server = readFileSync("src/server.ts", "utf8");
  const widget = readFileSync("web/widget.tsx", "utf8");
  assert.match(server, /Origin-Agent-Cluster", "\?1"/);
  assert.match(server, /Permissions-Policy", "tools=\(self\)"/);
  assert.match(server, /app\.get\("\/webmcp"[^]*demo\.html/);
  assert.match(widget, /resolveModelContext\(window\)/);
  assert.match(widget, /onActivity: recordAgentActivity/);
  assert.match(widget, /WEBMCP_HUMAN_ONLY_ACTIONS/);
  assert.match(widget, /WEBMCP_PROMPTS/);
});
