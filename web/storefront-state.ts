import type { ConnectorStatus, MissionView } from "../src/domain"

export type StorefrontPhase = "idle" | "running" | "resolved" | "degraded" | "error"
export type ActivityStepStatus = "pending" | "running" | "complete" | "warning" | "error"

export interface StorefrontActivity {
  phase: StorefrontPhase
  operation: string | null
  message: string
  retryable?: boolean
}

export interface ActivityStep {
  id: string
  label: string
  detail: string
  status: ActivityStepStatus
}

export const STOREFRONT_TOOL_NAMES = [
  "start_mission",
  "get_mission",
  "compare_carts",
  "select_cart",
  "swap_cart_item",
  "refresh_carts",
  "verify_receipt",
] as const

const operationLabels: Record<string, string> = {
  start_mission: "Checking connected stores",
  get_mission: "Reading the current mission",
  compare_carts: "Comparing complete kits",
  select_cart: "Saving the selected kit",
  swap_cart_item: "Checking the approved alternative",
  refresh_carts: "Refreshing price and stock",
  build_carts: "Refreshing price and stock",
  verify_receipt: "Verifying the receipt",
}

export const idleActivity: StorefrontActivity = {
  phase: "idle",
  operation: null,
  message: "Describe the trip and Woven will check every thread of the kit.",
}

export function runningActivity(operation: string): StorefrontActivity {
  return {
    phase: "running",
    operation,
    message: operation === "start_mission"
      ? "Checking both stores for one complete rain-ready kit…"
      : `${operationLabels[operation] || "Updating the storefront"}…`,
  }
}

function sourceHealth(statuses: ConnectorStatus[] | undefined) {
  const entries = statuses || []
  const healthy = entries.filter((status) => status.status === "healthy")
  const unavailable = entries.filter((status) => status.status !== "healthy")
  return { entries, healthy, unavailable }
}

export function activityFromView(
  view: Pick<MissionView, "carts" | "connectorStatuses">,
  operation: string,
  visibleCartLimit = 2,
): StorefrontActivity {
  const { unavailable } = sourceHealth(view.connectorStatuses)
  if (view.carts.length === 0 && unavailable.length > 0) {
    return {
      phase: "error",
      operation,
      message: "No connected store produced a complete verified cart.",
      retryable: unavailable.some((status) => status.retryable),
    }
  }
  if (unavailable.length > 0) {
    return {
      phase: "degraded",
      operation,
      message: `I found ${view.carts.length} complete ${view.carts.length === 1 ? "kit" : "kits"}, but one connected store needs attention.`,
      retryable: unavailable.some((status) => status.retryable),
    }
  }
  return {
    phase: "resolved",
    operation,
    message: view.carts.length > visibleCartLimit
      ? `I found ${view.carts.length} complete showcase kits. Showing the best ${visibleCartLimit}.`
      : view.carts.length === 2
      ? "I found two complete rain-ready kits—one from each connected store."
      : `I found ${view.carts.length} complete rain-ready ${view.carts.length === 1 ? "kit" : "kits"}.`,
  }
}

export function isCurrentStorefrontRequest(completedSequence: number, latestSequence: number) {
  return completedSequence === latestSequence
}

export function invalidatesPrivateHandoff(operation: string) {
  return ["start_mission", "select_cart", "swap_cart_item", "refresh_carts", "build_carts"].includes(operation)
}

export function activityAfterAbort(
  previousView: Pick<MissionView, "carts" | "connectorStatuses"> | null,
): StorefrontActivity {
  return previousView ? activityFromView(previousView, "get_mission") : idleActivity
}

export function errorActivity(operation: string, message: string, retryable = false): StorefrontActivity {
  return { phase: "error", operation, message, retryable }
}

export function activitySteps(activity: StorefrontActivity, view: Pick<MissionView, "carts" | "connectorStatuses"> | null): ActivityStep[] {
  if (activity.phase === "running") {
    return [
      { id: "sources", label: "Connected catalogs", detail: operationLabels[activity.operation || ""] || "Request in progress", status: "running" },
      { id: "compose", label: "Complete-kit composition", detail: "Waiting for verified catalog facts", status: "pending" },
      { id: "verify", label: "Compatibility and hard limits", detail: "No completion is claimed before the response", status: "pending" },
      { id: "handoff", label: "Human handoff boundary", detail: "Identity and checkout remain unavailable to the agent", status: "pending" },
    ]
  }

  if (activity.phase === "error") {
    return [
      { id: "sources", label: "Connected catalogs", detail: activity.message, status: "error" },
      { id: "compose", label: "Complete-kit composition", detail: "No result was fabricated", status: "pending" },
      { id: "verify", label: "Compatibility and hard limits", detail: "Waiting for a verified retry", status: "pending" },
      { id: "handoff", label: "Human handoff boundary", detail: "Checkout remains closed", status: "complete" },
    ]
  }

  if (!view || activity.phase === "idle") {
    return [
      { id: "sources", label: "Connected catalogs", detail: "Shopify and WooCommerce are ready to be checked", status: "pending" },
      { id: "compose", label: "Complete-kit composition", detail: "One merchant and pickup point per kit", status: "pending" },
      { id: "verify", label: "Compatibility and hard limits", detail: "Quantity, weather, volume, stock, timing, and budget", status: "pending" },
      { id: "handoff", label: "Human handoff boundary", detail: "Identity and purchase stay human-only", status: "complete" },
    ]
  }

  const { entries, unavailable } = sourceHealth(view.connectorStatuses)
  const top = view.carts[0]
  const metrics = top?.metrics
  const sourceDetail = entries.length
    ? entries.map((status) => `${status.platform} ${status.status}`).join(" · ")
    : "Seeded showcase catalog checked"
  const visibleCount = Math.min(view.carts.length, 2)
  const countDetail = view.carts.length > visibleCount ? `${visibleCount} shown of ${view.carts.length}` : `${visibleCount}`
  const compositionDetail = metrics
    ? `${countDetail} ${visibleCount === 1 ? "kit" : "kits"} · ${metrics.unitCount} units · ${metrics.categoryCount} categories`
    : `${view.carts.length} complete ${view.carts.length === 1 ? "kit" : "kits"}`
  const proof = [
    metrics?.packedLiters === undefined ? null : `${metrics.packedLiters} L packed`,
    metrics?.tentWaterproofMm === undefined ? null : `${metrics.tentWaterproofMm.toLocaleString("en-SG")} mm rainfly`,
  ].filter(Boolean).join(" · ") || "Every returned cart passed the server verifier"

  return [
    { id: "sources", label: "Connected catalogs checked", detail: sourceDetail, status: unavailable.length ? "warning" : "complete" },
    { id: "compose", label: "Complete one-store kits composed", detail: compositionDetail, status: "complete" },
    { id: "verify", label: "Hard constraints verified", detail: proof, status: "complete" },
    { id: "handoff", label: "Human handoff held back", detail: "The agent cannot verify identity, create checkout terms, or authorize payment", status: "complete" },
  ]
}
