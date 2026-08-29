import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRankedCarts,
  CANONICAL_REQUEST,
  createMission,
  seedCatalog,
} from "../src/domain.js";

test("canonical mission produces complete, compatible carts under budget", () => {
  const mission = createMission({ request: CANONICAL_REQUEST });
  const carts = buildRankedCarts(mission, seedCatalog, "normal", new Date("2026-08-29T08:00:00Z"));

  assert.equal(mission.budgetCents, 15_000);
  assert.equal(carts.length, 3);
  assert.equal(carts[0]?.merchantName, "ByteRoute");
  assert.equal(carts[0]?.badge, "BEST MATCH");
  assert.equal(carts.find((cart) => cart.badge === "BEST VALUE")?.merchantName, "City Mobile");
  for (const cart of carts) {
    assert.ok(cart.totalCents <= mission.budgetCents);
    assert.deepEqual(new Set(cart.lines.map((line) => line.category)), new Set(["charger", "mac_cable", "iphone_cable", "adapter"]));
    assert.ok(cart.lines.every((line) => line.compatibility.length > 20));
  }
});

test("hard compatibility and inventory constraints reject incomplete kits", () => {
  const mission = createMission({ request: CANONICAL_REQUEST });
  const incompatible = seedCatalog.map((item) =>
    item.category === "charger" ? { ...item, watts: 30 } : item,
  );
  assert.equal(buildRankedCarts(mission, incompatible, "normal").length, 0);

  const stockout = buildRankedCarts(mission, seedCatalog, "stockout");
  assert.ok(stockout.every((cart) => cart.lines.every((line) => !line.offerId.includes("byteroute-funan-br-gan65"))));
});
