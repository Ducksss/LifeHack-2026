import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_REQUEST, DomainError } from "../src/domain.js";
import { MissionCartStore, parseCsv } from "../src/store.js";

function setup() {
  const store = new MissionCartStore(":memory:");
  const view = store.startMission({ request: CANONICAL_REQUEST });
  const cart = view.carts[0]!;
  return { store, view, cart };
}

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
    assert.equal(second.order.id, first.order.id);
    assert.throws(
      () => store.confirmPurchase({ ...input, previewId: "pre_different_checkout" }),
      (error) => error instanceof DomainError && error.code === "IDEMPOTENCY_CONFLICT",
    );

    const after = new Map(store.getCatalog().map((item) => [item.offerId, item.stock]));
    for (const line of cart.lines) assert.equal(after.get(line.offerId), before.get(line.offerId)! - 1);
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
  const store = new MissionCartStore(":memory:");
  try {
    assert.throws(
      () => store.updateCatalogCsv("offer_id,price_sgd,stock\nbyteroute-funan-br-gan65,,4\n"),
      (error) => error instanceof DomainError && error.code === "INVALID_CSV_VALUE",
    );
  } finally {
    store.close();
  }
});
