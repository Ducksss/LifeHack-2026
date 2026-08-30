import { seedCatalog } from "../src/domain.js";
import { connectedOffersForSpec, createOpenAIDependencies, runOpenWorldMission } from "../src/open-world.js";

const requests = [
  "Build a complete USB-C home-office video-call setup under S$1,200 for pickup today.",
  "Find a complete beginner photography kit under S$1,500 for pickup today.",
  "Build a compact induction cooking starter set under S$500 for pickup today.",
];

for (const request of requests) {
  const openai = createOpenAIDependencies();
  const result = await runOpenWorldMission({
    request,
    connectedOffers: [],
    dependencies: {
      ...openai,
      discoverConnected: async (spec) => connectedOffersForSpec(spec, seedCatalog),
    },
  });
  console.log(JSON.stringify({
    request,
    passes: result.passes,
    requirements: result.spec.requirements.length,
    connectedCarts: result.carts.length,
    researchLeads: result.researchLeads.length,
    checkoutEligible: result.carts.some((cart) => cart.checkoutEligible),
  }));
}
