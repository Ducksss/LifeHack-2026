import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_REQUEST, DomainError } from "../src/domain.js";
import { WovenStore, parseCsv } from "../src/store.js";

function setup() {
  const store = new WovenStore(":memory:");
  const view = store.startMission({ request: CANONICAL_REQUEST });
  const cart = view.carts[0]!;
  verifyIdentity(store, view.mission.id);
  return { store, view, cart };
}

function verifyIdentity(store: WovenStore, missionId: string, now = new Date()) {
  const started = store.beginDemoIdentity(missionId, "https://woven.example/auth/demo/callback", now);
  const authorizationUrl = new URL(started.authorizationUrl);
  const requestId = authorizationUrl.searchParams.get("request_id")!;
  const state = authorizationUrl.searchParams.get("state")!;
  const authorized = store.authorizeDemoIdentity(requestId, state, now);
  const callback = new URL(authorized.redirectUrl);
  store.completeDemoIdentity(callback.searchParams.get("code")!, state, now);
  return { requestId, state, code: callback.searchParams.get("code")! };
}

test("checkout requires a short-lived, single-use demo identity handoff", () => {
  const store = new WovenStore(":memory:");
  try {
    const view = store.startMission({ request: CANONICAL_REQUEST });
    const cart = view.carts[0]!;
    assert.equal(view.identity.status, "not_connected");
    assert.throws(
      () => store.checkoutPreview(view.mission.id, cart.id),
      (error) => error instanceof DomainError && error.code === "IDENTITY_REQUIRED",
    );

    const started = store.beginDemoIdentity(view.mission.id, "https://woven.example/auth/demo/callback");
    const authorizationUrl = new URL(started.authorizationUrl);
    const requestId = authorizationUrl.searchParams.get("request_id")!;
    const state = authorizationUrl.searchParams.get("state")!;
    assert.equal(started.view.identity.status, "pending");
    assert.throws(
      () => store.demoIdentityRequest(requestId, `${state}x`),
      (error) => error instanceof DomainError && error.code === "IDENTITY_STATE_INVALID",
    );

    const authorized = store.authorizeDemoIdentity(requestId, state);
    const callback = new URL(authorized.redirectUrl);
    const code = callback.searchParams.get("code")!;
    store.completeDemoIdentity(code, state);
    assert.equal(store.view(view.mission.id).identity.status, "verified");
    assert.throws(
      () => store.completeDemoIdentity(code, state),
      (error) => error instanceof DomainError && error.code === "IDENTITY_CODE_USED",
    );

    const preview = store.checkoutPreview(view.mission.id, cart.id);
    assert.equal("identitySessionId" in preview.view.preview!, false);
    assert.equal("identitySubject" in preview.view.preview!, false);
  } finally {
    store.close();
  }
});

test("checkout rejects expired or replaced identity sessions", () => {
  const base = new Date("2026-08-30T08:00:00Z");
  for (const failure of ["expired", "replaced"] as const) {
    const store = new WovenStore(":memory:");
    try {
      const view = store.startMission({ request: CANONICAL_REQUEST });
      const cart = view.carts[0]!;
      verifyIdentity(store, view.mission.id, base);
      const preview = store.checkoutPreview(
        view.mission.id,
        cart.id,
        failure === "expired" ? new Date(base.getTime() + 14 * 60_000) : base,
      );
      if (failure === "replaced") verifyIdentity(store, view.mission.id, new Date(base.getTime() + 60_000));

      assert.throws(
        () => store.confirmPurchase({
          previewId: preview.view.preview!.id,
          mandateHash: preview.view.preview!.mandateHash,
          confirmationNonce: preview.nonce,
          idempotencyKey: `idem-identity-${failure}`,
        }, new Date(base.getTime() + (failure === "expired" ? 16 : 2) * 60_000)),
        (error) => error instanceof DomainError && error.code === (failure === "expired" ? "IDENTITY_EXPIRED" : "IDENTITY_MISMATCH"),
      );
    } finally {
      store.close();
    }
  }
});

test("checkout is explicit, nonce-bound, idempotent, and decrements stock once", () => {
  const { store, view, cart } = setup();
  try {
    const before = new Map(store.getCatalog().map((item) => [item.offerId, item.stock]));
    const preview = store.checkoutPreview(view.mission.id, cart.id);
    assert.ok(preview.view.preview);
    assert.equal("nonce" in preview.view.preview!, false);

    assert.throws(
      () => store.confirmPurchase({
        previewId: preview.view.preview!.id,
        mandateHash: preview.view.preview!.mandateHash,
        confirmationNonce: crypto.randomUUID(),
        idempotencyKey: "idem-wrong-nonce",
      }),
      (error) => error instanceof DomainError && error.code === "CONFIRMATION_INVALID",
    );

    const input = {
      previewId: preview.view.preview!.id,
      mandateHash: preview.view.preview!.mandateHash,
      confirmationNonce: preview.nonce,
      idempotencyKey: "idem-success-0001",
    };
    const first = store.confirmPurchase(input);
    const second = store.confirmPurchase(input);
    assert.equal(first.order.status, "confirmed");
    assert.match(first.order.receiptNumber ?? "", /^WV-/);
    assert.equal(store.verifyReceipt(first.order.receipt!.receiptNumber, first.order.receipt!.signature).valid, true);
    assert.equal(store.verifyReceipt(first.order.receipt!.receiptNumber, "0".repeat(64)).valid, false);
    assert.equal(second.order.id, first.order.id);
    assert.throws(
      () => store.confirmPurchase({ ...input, previewId: "pre_different_checkout" }),
      (error) => error instanceof DomainError && error.code === "IDEMPOTENCY_CONFLICT",
    );

    const after = new Map(store.getCatalog().map((item) => [item.offerId, item.stock]));
    for (const line of cart.lines) assert.equal(after.get(line.offerId), before.get(line.offerId)! - line.quantity);
  } finally {
    store.close();
  }
});

test("merchant-approved swaps preserve a complete cart and can be withdrawn", () => {
  const store = new WovenStore(":memory:");
  try {
    const view = store.startMission({ request: CANONICAL_REQUEST });
    const cart = view.carts.find((candidate) => candidate.alternatives.length)!;
    const alternative = cart.alternatives[0]!;
    const swapped = store.swapCartItem(view.mission.id, cart.id, alternative.offerId);
    const custom = swapped.carts.find((candidate) => candidate.id === swapped.selectedCartId)!;
    assert.equal(custom.badge, "CUSTOM");
    assert.equal(custom.lines.length, 5);
    assert.ok(custom.lines.some((line) => line.offerId === alternative.offerId));

    const pair = store.merchantAlternatives().find((candidate) => candidate.toOfferId === alternative.offerId)!;
    store.setAlternative(pair.fromOfferId, pair.toOfferId, false);
    assert.equal(store.view(view.mission.id).selectedCartId, null);
  } finally {
    store.close();
  }
});

test("changed price invalidates the exact checkout mandate", () => {
  const { store, view, cart } = setup();
  try {
    const preview = store.checkoutPreview(view.mission.id, cart.id);
    store.setScenario("price-change");
    assert.throws(
      () => store.confirmPurchase({
        previewId: preview.view.preview!.id,
        mandateHash: preview.view.preview!.mandateHash,
        confirmationNonce: preview.nonce,
        idempotencyKey: "idem-stale-0001",
      }),
      (error) => error instanceof DomainError && error.code === "CART_STALE" && error.retryable,
    );
  } finally {
    store.close();
  }
});

test("checkout rejects a changed mandate and an expired preview", () => {
  for (const failure of ["hash", "expiry"] as const) {
    const { store, view, cart } = setup();
    try {
      const preview = store.checkoutPreview(view.mission.id, cart.id);
      const input = {
        previewId: preview.view.preview!.id,
        mandateHash: failure === "hash" ? "0".repeat(64) : preview.view.preview!.mandateHash,
        confirmationNonce: preview.nonce,
        idempotencyKey: `idem-${failure}-0001`,
      };
      const now = failure === "expiry" ? new Date(preview.view.preview!.expiresAt) : new Date();
      assert.throws(
        () => store.confirmPurchase(input, now),
        (error) => error instanceof DomainError && error.code === (failure === "hash" ? "MANDATE_CHANGED" : "PREVIEW_EXPIRED"),
      );
    } finally {
      store.close();
    }
  }
});

test("simulator exposes decline and reversal outcomes without a live charge", () => {
  for (const [scenario, expected] of [
    ["auth-decline", "authorization_declined"],
    ["order-fail", "order_failed_reversing"],
  ] as const) {
    const { store, view, cart } = setup();
    try {
      store.setScenario(scenario);
      const preview = store.checkoutPreview(view.mission.id, cart.id);
      const result = store.confirmPurchase({
        previewId: preview.view.preview!.id,
        mandateHash: preview.view.preview!.mandateHash,
        confirmationNonce: preview.nonce,
        idempotencyKey: `idem-${scenario}-0001`,
      });
      assert.equal(result.order.status, expected);
      assert.equal(result.order.paymentMode, "simulated");
      assert.equal(result.order.receiptNumber, undefined);
    } finally {
      store.close();
    }
  }
});

test("CSV parser handles quoted commas and escaped quotes", () => {
  assert.deepEqual(
    parseCsv('offer_id,price_sgd,stock,note\nabc,12.50,3,"Ready, \"\"today\"\""\n'),
    [["offer_id", "price_sgd", "stock", "note"], ["abc", "12.50", "3", 'Ready, "today"']],
  );
});

test("catalog CSV rejects blank values instead of silently zeroing an offer", () => {
  const store = new WovenStore(":memory:");
  try {
    assert.throws(
      () => store.updateCatalogCsv("offer_id,price_sgd,stock\ntrailhaus-funan-th-storm2,,4\n"),
      (error) => error instanceof DomainError && error.code === "INVALID_CSV_VALUE",
    );
  } finally {
    store.close();
  }
});
