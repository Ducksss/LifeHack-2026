import type { RankedCart } from "../src/domain";

export type RankingPriority = "balanced" | "value" | "speed" | "weather";
export type PickupArea = "Any" | RankedCart["area"];

export const RANKING_PRIORITIES: readonly RankingPriority[] = ["balanced", "value", "speed", "weather"];
export const PICKUP_AREAS: readonly PickupArea[] = ["Any", "Central", "East", "North"];

export const PRIORITY_LABELS: Record<RankingPriority, string> = {
  balanced: "Balanced",
  value: "Lowest total",
  speed: "Soonest pickup",
  weather: "Most rainproof",
};

export function formatMoney(cents: number) {
  return `S$${(cents / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function cartWaterproof(cart: RankedCart) {
  return Number(cart.lines.find((line) => line.category === "tent")?.name.match(/([\d,]+)\s*mm/i)?.[1]?.replaceAll(",", "") || 0);
}

export function rankCarts(carts: RankedCart[], priority: RankingPriority, area: PickupArea) {
  return carts.toSorted((a, b) => {
    const areaDifference = area === "Any" ? 0 : Number(b.area === area) - Number(a.area === area);
    if (areaDifference) return areaDifference;
    if (priority === "value") return a.totalCents - b.totalCents;
    if (priority === "speed") return a.pickupMinutes - b.pickupMinutes;
    if (priority === "weather") return cartWaterproof(b) - cartWaterproof(a);
    return b.score - a.score;
  });
}

export function cartTraits(cart: RankedCart, carts: RankedCart[]) {
  const traits = [cart.badge === "CUSTOM" ? "Custom" : cart.badge.replace("BEST ", "Best ").toLowerCase()];
  if (cart.totalCents === Math.min(...carts.map((candidate) => candidate.totalCents))) traits.push("Lowest total");
  if (cart.pickupMinutes === Math.min(...carts.map((candidate) => candidate.pickupMinutes))) traits.push("Soonest pickup");
  if (cartWaterproof(cart) === Math.max(...carts.map(cartWaterproof))) traits.push("Most rainproof");
  return [...new Set(traits)];
}
