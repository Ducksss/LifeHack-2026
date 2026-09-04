import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  campingMissionSpec,
  LiveConnectorRegistry,
  ShopifyUcpConnector,
  signWooHandoff,
  verifyWooHandoff,
  WooCommerceStoreConnector,
  type CommerceConnector,
} from "../src/live-commerce.js";
import { buildGenericCarts, runOpenWorldMission, type ConnectedOffer, type OpenWorldResult } from "../src/open-world.js";
import { WovenStore } from "../src/store.js";

const now = new Date("2026-09-01T12:00:00.000Z");
const request = "Complete rainy-weekend camping kit for 2 people under S$900";
const spec = campingMissionSpec({ request, sourceMode: "live" }, now);
const shopifyCatalog = JSON.parse(readFileSync("test/fixtures/shopify-ucp-catalog.json", "utf8"));
const shopifyCart = JSON.parse(readFileSync("test/fixtures/shopify-ucp-cart.json", "utf8"));
const wooProducts = JSON.parse(readFileSync("test/fixtures/woocommerce-products.json", "utf8"));
const wooSecret = "woo-test-secret-at-least-thirty-two-characters";
const wooIds = [101, 102, 103, 104, 105];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function shopifyConnector(catalog = shopifyCatalog): ShopifyUcpConnector {
  return new ShopifyUcpConnector({
    storeUrl: "https://woven-trail-shop.myshopify.com",
    agentProfileUrl: "https://woven.example/.well-known/ucp-agent-profile.json",
    now: () => now,
    fetchImpl: async (_url, init) => {
      const requestBody = JSON.parse(String(init?.body));
      return jsonResponse(requestBody.params.name === "create_cart" ? shopifyCart : catalog);
    },
  });
}

function wooConnector(products = wooProducts): WooCommerceStoreConnector {
  return new WooCommerceStoreConnector({
    storeUrl: "https://woo.example",
    handoffSecret: wooSecret,
    allowedProductIds: wooIds,
    now: () => now,
    fetchImpl: async () => jsonResponse(products),
  });
}

async function offers() {
  const signal = new AbortController().signal;
  const [shopify, woo] = await Promise.all([
    shopifyConnector().discover(spec, signal),
    wooConnector().discover(spec, signal),
  ]);
  return { shopify, woo };
}

test("captured Shopify UCP and WooCommerce Store API shapes normalize into complete SGD carts", async () => {
  const discovered = await offers();
  const carts = buildGenericCarts(spec, [...discovered.shopify, ...discovered.woo], now);

  assert.equal(discovered.shopify.length, 5);
  assert.equal(discovered.woo.length, 5);
  assert.deepEqual(new Set(carts.map((cart) => cart.platform)), new Set(["shopify", "woocommerce"]));
  assert.ok(carts.every((cart) => cart.totalCents === 54_500 && cart.totalCents < 90_000));
  assert.ok(carts.every((cart) => cart.lines.length === 5 && cart.lines.reduce((sum, line) => sum + line.quantity, 0) === 7));
  assert.ok(carts.every((cart) => cart.metrics.unitCount === 7 && cart.metrics.categoryCount === 5));
  assert.ok(carts.every((cart) => cart.metrics.packedLiters === 89 && cart.metrics.tentWaterproofMm === 3_000));
  assert.ok(carts.every((cart) => cart.lines.every((line) => line.externalProductId && line.externalVariantId && line.lastVerifiedAt)));
});

test("normalization fails closed for missing metadata, non-SGD prices, unavailable variants, mixed platforms, and budget", async () => {
  const missing = structuredClone(shopifyCatalog);
  missing.result.structuredContent.catalog.products[0].variants[0].tags = ["woven:category=tent;waterproofMm=3000;packedLiters=42"];
  assert.equal(buildGenericCarts(spec, await shopifyConnector(missing).discover(spec, new AbortController().signal)).length, 0);

  const usd = structuredClone(shopifyCatalog);
  usd.result.structuredContent.catalog.products[0].variants[0].price.currency = "USD";
  assert.equal(buildGenericCarts(spec, await shopifyConnector(usd).discover(spec, new AbortController().signal)).length, 0);

  const unavailable = structuredClone(shopifyCatalog);
  unavailable.result.structuredContent.catalog.products[4].variants[0].available_for_sale = false;
  unavailable.result.structuredContent.catalog.products[4].variants[0].quantity_available = 0;
  assert.equal(buildGenericCarts(spec, await shopifyConnector(unavailable).discover(spec, new AbortController().signal)).length, 0);

  const discovered = await offers();
  const mixed = discovered.shopify.map((offer, index) => index < 2 ? offer : {
    ...discovered.woo.find((candidate) => candidate.requirementId === offer.requirementId)!,
    merchantId: offer.merchantId,
    locationId: offer.locationId,
  });
  assert.equal(buildGenericCarts(spec, mixed).length, 0);

  assert.equal(buildGenericCarts({ ...spec, budgetCents: 50_000 }, discovered.shopify).length, 0);
});

test("both connectors revalidate exact variants and create private native handoffs", async () => {
  const discovered = await offers();
  const carts = buildGenericCarts(spec, [...discovered.shopify, ...discovered.woo], now);
  const shopify = carts.find((cart) => cart.platform === "shopify")!;
  const woo = carts.find((cart) => cart.platform === "woocommerce")!;
  const signal = new AbortController().signal;

  const shopifyCurrent = await shopifyConnector().revalidate(shopify.lines, signal);
  const wooCurrent = await wooConnector().revalidate(woo.lines, signal);
  assert.ok(shopify.lines.every((line) => shopifyCurrent.some((offer) => offer.externalVariantId === line.externalVariantId && offer.priceCents === line.priceCents)));
  assert.ok(woo.lines.every((line) => wooCurrent.some((offer) => offer.externalVariantId === line.externalVariantId && offer.priceCents === line.priceCents)));

  const shopifyHandoff = await shopifyConnector().createCart(shopify.lines, "idem-shopify-0001", signal);
  const wooHandoff = await wooConnector().createCart(woo.lines, "idem-woo-0001", signal);
  assert.equal(new URL(shopifyHandoff.checkoutUrl).hostname, "woven-trail-shop.myshopify.com");
  assert.equal(new URL(shopifyHandoff.checkoutUrl).searchParams.get("key"), "private-query-token");
  assert.equal(new URL(wooHandoff.checkoutUrl).pathname, "/woven-commerce/handoff");
  assert.match(wooHandoff.checkoutUrl, /woven_payload=.*woven_signature=/);
});

test("connector registry tolerates one-platform failure and reports total failure without demo fallback", async () => {
  const discovered = await offers();
  const healthy: CommerceConnector = {
    platform: "shopify",
    discover: async () => discovered.shopify,
    revalidate: async () => discovered.shopify,
    createCart: async () => { throw new Error("unused"); },
  };
  const failed: CommerceConnector = {
    platform: "woocommerce",
    discover: async () => { throw new Error("Woo Store API timed out"); },
    revalidate: async () => [],
    createCart: async () => { throw new Error("unused"); },
  };
  const partial = new LiveConnectorRegistry([healthy, failed]);
  assert.equal((await partial.discover(spec, 0, new AbortController().signal)).length, 5);
  assert.equal(partial.statuses().find((status) => status.platform === "woocommerce")?.status, "failed");
  assert.equal(buildGenericCarts(spec, await partial.discover(spec, 1, new AbortController().signal)).length, 1);

  const total = new LiveConnectorRegistry([{ ...failed, platform: "shopify" }, failed]);
  assert.equal((await total.discover(spec, 0, new AbortController().signal)).length, 0);
  assert.ok(total.statuses().every((status) => status.status === "failed"));
});

test("live connector work remains inside the graph timeout", async () => {
  const slow = new LiveConnectorRegistry([{
    platform: "shopify",
    discover: async () => new Promise<ConnectedOffer[]>((resolve) => setTimeout(() => resolve([]), 50)),
    revalidate: async () => [],
    createCart: async () => { throw new Error("unused"); },
  }]);
  await assert.rejects(runOpenWorldMission({
    request,
    connectedOffers: [],
    dependencies: {
      interpret: async () => spec,
      discoverConnected: (mission, pass, signal) => slow.discover(mission, pass, signal),
      discoverWeb: async () => ({ leads: [], sources: [] }),
    },
    timeoutMs: 5,
  }), (error: Error & { code?: string }) => error.code === "AGENT_TIMEOUT");
});

function openWorldResult(allOffers: ConnectedOffer[]): OpenWorldResult {
  const carts = buildGenericCarts(spec, allOffers, now);
  return {
    spec,
    carts,
    researchLeads: [],
    sources: [],
    events: [{ node: "finalize", pass: 0, status: "completed", occurredAt: now.toISOString() }],
    evidenceChecks: carts[0]!.evidence,
    passes: 1,
  };
}

function verifyIdentity(store: WovenStore, missionId: string) {
  const started = store.beginDemoIdentity(missionId, "https://woven.example/auth/demo/callback", now);
  const authorization = new URL(started.authorizationUrl);
  const state = authorization.searchParams.get("state")!;
  const callback = new URL(store.authorizeDemoIdentity(authorization.searchParams.get("request_id")!, state, now).redirectUrl);
  store.completeDemoIdentity(callback.searchParams.get("code")!, state, now);
}

test("live snapshots preserve unchanged selection and invalidate price or stock changes", async () => {
  const discovered = await offers();
  for (const change of ["price", "stock"] as const) {
    const store = new WovenStore(":memory:");
    try {
      const all = [...discovered.shopify, ...discovered.woo];
      const view = store.startLiveMission(request, openWorldResult(all), all, [
        { platform: "shopify", status: "healthy", message: "ok", checkedAt: now.toISOString(), retryable: false },
        { platform: "woocommerce", status: "healthy", message: "ok", checkedAt: now.toISOString(), retryable: false },
      ], now);
      const selected = view.carts.find((cart) => cart.platform === "shopify")!;
      store.selectCart(view.mission.id, selected.id);
      assert.equal(store.replaceLiveOffers(view.mission.id, all, view.connectorStatuses!, now).selectionInvalidated, false);
      const changed = all.map((offer) => offer.offerId === selected.lines[0]!.offerId
        ? { ...offer, ...(change === "price" ? { priceCents: offer.priceCents + 100 } : { stock: 0 }) }
        : offer);
      const refreshed = store.replaceLiveOffers(view.mission.id, changed, view.connectorStatuses!, now);
      assert.equal(refreshed.selectionInvalidated, true);
      assert.equal(refreshed.view.selectedCartId, null);
      assert.equal(refreshed.view.externalCheckout, undefined);
    } finally {
      store.close();
    }
  }
});

test("external previews expose exact terms but never checkout secrets, orders, receipts, or Woven inventory mutation", async () => {
  const discovered = await offers();
  const all = [...discovered.shopify, ...discovered.woo];
  const store = new WovenStore(":memory:");
  try {
    const beforeStock = store.getCatalog().map((item) => [item.offerId, item.stock]);
    const view = store.startLiveMission(request, openWorldResult(all), all, [
      { platform: "shopify", status: "healthy", message: "ok", checkedAt: now.toISOString(), retryable: false },
      { platform: "woocommerce", status: "healthy", message: "ok", checkedAt: now.toISOString(), retryable: false },
    ], now);
    const cart = view.carts.find((candidate) => candidate.platform === "shopify")!;
    store.selectCart(view.mission.id, cart.id);
    verifyIdentity(store, view.mission.id);
    const privateUrl = "https://woven-trail-shop.myshopify.com/cart/c/private-secret-token";
    const created = store.createExternalCheckoutPreview(view.mission.id, cart.id, {
      platform: "shopify",
      externalCartId: "gid://shopify/Cart/private",
      checkoutUrl: privateUrl,
      expiresAt: "2026-09-01T12:05:00.000Z",
    }, now);
    const serialized = JSON.stringify(created.view);
    assert.equal(created.checkoutUrl, privateUrl);
    assert.doesNotMatch(serialized, /private-secret-token|woven_signature|checkoutUrl|externalCartId/);
    assert.equal(created.view.externalCheckout?.amountCents, cart.totalCents);
    assert.equal(created.view.order, undefined);
    assert.equal(created.view.receiptVerification, undefined);
    assert.deepEqual(store.getCatalog().map((item) => [item.offerId, item.stock]), beforeStock);
    assert.equal(store.dashboard().orders.length, 0);
    assert.equal(store.view(view.mission.id, new Date("2026-09-01T12:06:00.000Z")).externalCheckout?.status, "expired");
  } finally {
    store.close();
  }
});

test("WooCommerce HMAC handoffs reject modification, expiry, replay, unknown products, and excessive quantities", () => {
  const base = { items: [{ productId: 101, quantity: 1 }], expiresAt: Math.floor(now.getTime() / 1_000) + 300, nonce: "nonce_valid_1234567890" };
  const signed = signWooHandoff(base, wooSecret);
  const used = new Set<string>();
  assert.deepEqual(verifyWooHandoff({ ...signed, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: used, now }), base);
  assert.throws(() => verifyWooHandoff({ ...signed, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: used, now }), /already used/i);
  assert.throws(() => verifyWooHandoff({ payload: `${signed.payload}x`, signature: signed.signature, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: new Set(), now }), /signature/i);

  const expired = signWooHandoff({ ...base, expiresAt: Math.floor(now.getTime() / 1_000) - 1, nonce: "nonce_expired_12345678" }, wooSecret);
  assert.throws(() => verifyWooHandoff({ ...expired, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: new Set(), now }), /expired/i);
  const unknown = signWooHandoff({ ...base, items: [{ productId: 999, quantity: 1 }], nonce: "nonce_unknown_12345678" }, wooSecret);
  assert.throws(() => verifyWooHandoff({ ...unknown, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: new Set(), now }), /unknown product/i);

  const excessivePayload = Buffer.from(JSON.stringify({ ...base, items: [{ productId: 101, quantity: 11 }], nonce: "nonce_excessive_123456" })).toString("base64url");
  const excessiveSignature = createHmac("sha256", wooSecret).update(excessivePayload).digest("base64url");
  assert.throws(() => verifyWooHandoff({ payload: excessivePayload, signature: excessiveSignature, secret: wooSecret, allowedProductIds: new Set(wooIds), usedNonces: new Set(), now }));
});

test("the bundled WooCommerce plugin mirrors the signed payload and replay contract", () => {
  const plugin = readFileSync("integrations/woocommerce/woven-commerce-handoff/woven-commerce-handoff.php", "utf8");
  assert.match(plugin, /hash_hmac\('sha256'/);
  assert.match(plugin, /hash_equals/);
  assert.match(plugin, /get_transient\(\$nonce_key\)/);
  assert.match(plugin, /set_transient\(\$nonce_key/);
  assert.match(plugin, /WOVEN_COMMERCE_ALLOWED_PRODUCT_IDS/);
  assert.match(plugin, /MAX_LINE_QUANTITY = 10/);
  assert.match(plugin, /empty_cart\(true\)/);
  assert.match(plugin, /wc_get_checkout_url\(\)/);
});
