import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { CANONICAL_REQUEST, DomainError } from "../src/domain.js";
import { WovenStore, parseCsv } from "../src/store.js";

function setup() {
  const store = new WovenStore(":memory:");
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
    assert.match(first.order.receiptNumber ?? "", /^WV-/);
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
  const store = new WovenStore(":memory:");
  try {
    assert.throws(
      () => store.updateCatalogCsv("offer_id,price_sgd,stock\nbyteroute-funan-br-gan65,,4\n"),
      (error) => error instanceof DomainError && error.code === "INVALID_CSV_VALUE",
    );
  } finally {
    store.close();
  }
});

test("existing catalog rows gain pickup metadata without losing merchant updates", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "woven-upgrade-"));
  const filename = path.join(directory, "woven.db");
  try {
    const original = new WovenStore(filename);
    original.updateCatalogCsv("offer_id,price_sgd,stock\nbyteroute-funan-br-gan65,79.00,2\n");
    original.close();

    const legacy = new DatabaseSync(filename);
    const row = legacy.prepare("SELECT data FROM catalog WHERE offer_id = ?").get("byteroute-funan-br-gan65")!;
    const item = JSON.parse(String(row.data));
    delete item.transitMinutes;
    delete item.closesAt;
    delete item.area;
    legacy.prepare("UPDATE catalog SET data = ? WHERE offer_id = ?")
      .run(JSON.stringify(item), "byteroute-funan-br-gan65");
    legacy.close();

    const upgraded = new WovenStore(filename);
    const refreshed = upgraded.getCatalog().find((candidate) => candidate.offerId === "byteroute-funan-br-gan65")!;
    assert.equal(refreshed.priceCents, 7_900);
    assert.equal(refreshed.stock, 2);
    assert.equal(refreshed.transitMinutes, 18);
    assert.equal(refreshed.closesAt, "21:30");
    assert.equal(refreshed.area, "Central");
    upgraded.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("only active merchant-approved alternatives can replace a cart item", () => {
  const { store, view, cart } = setup();
  try {
    const alternative = cart.alternatives[0]!;
    assert.ok(alternative);
    const swapped = store.swapCartItem(view.mission.id, cart.id, alternative.offerId);
    assert.equal(swapped.carts.length, view.carts.length);
    const selected = swapped.carts.find((candidate) => candidate.id === swapped.selectedCartId)!;
    assert.ok(selected.lines.some((line) => line.offerId === alternative.offerId));
    assert.equal(selected.lines.length, 4);
    assert.ok(selected.totalCents <= view.mission.budgetCents);

    const secondMission = store.startMission({ request: CANONICAL_REQUEST });
    const secondCart = secondMission.carts[0]!;
    const secondAlternative = secondCart.alternatives.find((candidate) => candidate.offerId === alternative.offerId)!;
    assert.ok(secondAlternative);
    assert.doesNotThrow(() => store.swapCartItem(secondMission.mission.id, secondCart.id, secondAlternative.offerId));

    store.setAlternative(alternative.fromOfferId, alternative.offerId, false);
    assert.throws(
      () => store.swapCartItem(view.mission.id, cart.id, alternative.offerId),
      (error) => error instanceof DomainError && error.code === "ALTERNATIVE_NOT_APPROVED",
    );
  } finally {
    store.close();
  }
});

test("stock changes refresh complete recovery choices without selecting a stale cart", () => {
  const { store, view, cart } = setup();
  try {
    store.selectCart(view.mission.id, cart.id);
    store.setScenario("stockout");
    const recovered = store.view(view.mission.id);
    assert.equal(recovered.selectedCartId, null);
    assert.ok(recovered.carts.length >= 2);
    assert.ok(recovered.carts.every((candidate) => candidate.lines.length === 4));
    assert.ok(recovered.carts.every((candidate) => candidate.lines.every((line) => line.offerId !== "byteroute-funan-br-gan65")));
  } finally {
    store.close();
  }
});

test("confirmed receipts are signed and reject tampering", () => {
  const { store, view, cart } = setup();
  try {
    const preview = store.checkoutPreview(view.mission.id, cart.id);
    const signedAt = new Date("2026-08-30T02:55:00.000Z");
    const { order } = store.confirmPurchase({
      previewId: preview.view.preview!.id,
      mandateHash: preview.view.preview!.mandateHash,
      confirmationNonce: preview.nonce,
      idempotencyKey: "idem-signed-receipt-0001",
    }, signedAt);
    assert.ok(order.receipt);
    assert.equal(store.verifyReceipt(order.receipt!.receiptNumber, order.receipt!.signature).valid, true);
    assert.equal(store.verifyReceipt(order.receipt!.receiptNumber, "0".repeat(64)).valid, false);
    assert.equal(store.view(view.mission.id).receiptVerification?.valid, true);

    const second = store.startMission({ request: CANONICAL_REQUEST });
    const secondPreview = store.checkoutPreview(second.mission.id, second.carts[0]!.id);
    const secondOrder = store.confirmPurchase({
      previewId: secondPreview.view.preview!.id,
      mandateHash: secondPreview.view.preview!.mandateHash,
      confirmationNonce: secondPreview.nonce,
      idempotencyKey: "idem-signed-receipt-0002",
    }, signedAt).order;
    assert.notEqual(secondOrder.receiptNumber, order.receiptNumber);
    assert.equal(store.verifyReceipt(secondOrder.receipt!.receiptNumber, secondOrder.receipt!.signature).valid, true);
  } finally {
    store.close();
  }
});
