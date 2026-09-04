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

  assert.equal(mission.budgetCents, 30_000);
  assert.equal(mission.campers, 2);
  assert.equal(mission.weather, "Rainy");
  assert.equal(mission.maxPackedLiters, 120);
  assert.equal(carts.length, 5);
  assert.equal(carts[0]?.merchantName, "TrailHaus");
  assert.equal(carts[0]?.totalCents, 23_100);
  assert.equal(carts[0]?.badge, "BEST MATCH");
  assert.deepEqual(carts[0]?.metrics, {
    unitCount: 7,
    categoryCount: 5,
    packedLiters: 89,
    tentWaterproofMm: 3_000,
  });
  assert.equal(carts.find((cart) => cart.badge === "BEST VALUE")?.merchantName, "CampWorks");
  for (const cart of carts) {
    assert.ok(cart.totalCents <= mission.budgetCents);
    assert.deepEqual(new Set(cart.lines.map((line) => line.category)), new Set(["tent", "sleeping_bag", "sleeping_mat", "lantern", "first_aid"]));
    assert.equal(cart.lines.find((line) => line.category === "sleeping_bag")?.quantity, 2);
    assert.equal(cart.lines.find((line) => line.category === "sleeping_mat")?.quantity, 2);
    assert.ok(cart.lines.every((line) => line.compatibility.length > 20));
    assert.ok(cart.transitMinutes > 0);
    assert.match(cart.closesAt, /^\d{2}:\d{2}$/);
  }
});

test("hard compatibility and inventory constraints reject incomplete kits", () => {
  const mission = createMission({ request: CANONICAL_REQUEST });
  const incompatible = seedCatalog.map((item) =>
    item.category === "tent" ? { ...item, waterproofMm: 1_500 } : item,
  );
  assert.equal(buildRankedCarts(mission, incompatible, "normal").length, 0);

  const stockout = buildRankedCarts(mission, seedCatalog, "stockout");
  assert.ok(stockout.every((cart) => cart.lines.every((line) => !line.offerId.includes("trailhaus-funan-th-storm2"))));
});
