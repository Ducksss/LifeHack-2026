import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { MissionView } from "../src/domain.js";
import {
  WEBMCP_TOOL_NAMES,
  createWebMcpTools,
  registerWebMcpTools,
  type WebMcpAdapter,
  type WebMcpTool,
} from "../web/webmcp.js";

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
    {
      id: "cart_webmcp",
      version: "version-1",
      merchantId: "trailhaus",
      merchantName: "TrailHaus",
      locationId: "funan",
      locationName: "Funan · L3",
      address: "107 North Bridge Rd",
      pickupMinutes: 30,
      transitMinutes: 18,
      closesAt: "21:30",
      area: "Central",
      totalCents: 23_100,
      currency: "SGD",
      score: 120,
      badge: "BEST MATCH",
      lines: [],
      metrics: { unitCount: 0, categoryCount: 0 },
      checks: ["Complete and compatible"],
      alternatives: [
        {
          fromOfferId: "offer-old",
          offerId: "offer-new",
          name: "Approved alternative",
          category: "lantern",
          priceCents: 1_900,
          stock: 2,
          compatibility: "Still rain-ready",
          deltaCents: 100,
          totalCents: 23_200,
        },
      ],
      inventoryCheckedAt: "2026-08-30T00:00:00.000Z",
      checkoutEligible: true,
    },
  ],
  selectedCartId: "cart_webmcp",
  identity: { status: "not_connected" },
  scenario: "normal",
  checkoutEligible: true,
} satisfies MissionView;

function adapter(overrides: Partial<WebMcpAdapter> = {}) {
  const calls: Array<[string, Record<string, unknown>]> = [];
  const comparisons: Array<Record<string, unknown>> = [];
  const base: WebMcpAdapter = {
    getView: () => view,
    startMission: async () => view,
    invoke: async (name, arguments_) => {
      calls.push([name, arguments_]);
      return view;
    },
    compare: (options) => comparisons.push(options),
    verifyReceipt: async () => ({ valid: true }),
  };
  return { value: { ...base, ...overrides }, calls, comparisons };
}

test("WebMCP exposes a useful site-tool surface without identity or purchase authority", () => {
  const { value } = adapter();
  const tools = createWebMcpTools(value);

  assert.deepEqual(tools.map((tool) => tool.name), WEBMCP_TOOL_NAMES);
  assert.equal(tools.length, 7);
  assert.ok(tools.every((tool) => tool.inputSchema.additionalProperties === false));
  assert.equal(tools.find((tool) => tool.name === "get_mission")?.annotations?.readOnlyHint, true);
  assert.equal(tools.find((tool) => tool.name === "verify_receipt")?.annotations?.readOnlyHint, true);
  assert.ok(tools.every((tool) => !/identity|checkout|confirm|purchase/i.test(tool.name)));
  assert.deepEqual(tools.map((tool) => tool.name), WEBMCP_TOOL_NAMES);
  const start = tools.find((tool) => tool.name === "start_mission")!;
  assert.deepEqual((start.inputSchema.properties as Record<string, { enum?: string[] }>).sourceMode?.enum, ["demo", "live"]);
});

test("WebMCP actions reuse the current mission and update the visible page", async () => {
  const { value, calls, comparisons } = adapter();
  const tools = new Map(createWebMcpTools(value).map((tool) => [tool.name, tool]));
  const execute = (name: string, input: Record<string, unknown> = {}) =>
    tools.get(name)!.execute(input, { signal: new AbortController().signal });

  await execute("compare_carts", { priority: "weather", area: "Central" });
  await execute("select_cart", { cartId: "cart_webmcp" });
  await execute("swap_cart_item", { offerId: "offer-new" });
  await execute("refresh_carts");
  const publicResult = await execute("get_mission");

  assert.deepEqual(comparisons, [{ priority: "weather", area: "Central" }]);
  assert.deepEqual(calls, [
    ["select_cart", { missionId: "mis_webmcp", cartId: "cart_webmcp" }],
    ["swap_cart_item", { missionId: "mis_webmcp", cartId: "cart_webmcp", offerId: "offer-new" }],
    ["build_carts", { missionId: "mis_webmcp" }],
  ]);
  assert.doesNotMatch(JSON.stringify(publicResult), /checkoutUrl|authorizationUrl|confirmationNonce|identitySession|nonce/i);
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

test("the public WebMCP route is top-level and origin-keyed", () => {
  const server = readFileSync("src/server.ts", "utf8");
  const storefront = readFileSync("web/storefront.html", "utf8");
  assert.match(server, /Origin-Agent-Cluster", "\?1"/);
  assert.match(server, /Permissions-Policy", "tools=\(self\)"/);
  assert.match(server, /app\.get\("\/webmcp"[^]*storefront\.html/);
  assert.doesNotMatch(server, /app\.get\("\/webmcp"[^]*demo\.html/);
  assert.match(storefront, /storefront\.tsx/);
  assert.match(storefront, /Woven Trail Market/);
});
