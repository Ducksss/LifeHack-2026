import assert from "node:assert/strict"
import test from "node:test"

import {
  activityFromView,
  activityAfterAbort,
  activitySteps,
  errorActivity,
  idleActivity,
  invalidatesPrivateHandoff,
  isCurrentStorefrontRequest,
  runningActivity,
} from "../web/storefront-state.js"

const cart = {
  metrics: { unitCount: 7, categoryCount: 5, packedLiters: 89, tentWaterproofMm: 3_000 },
}

test("storefront activity never claims completed server work while a request is pending", () => {
  const activity = runningActivity("start_mission")
  const steps = activitySteps(activity, null)

  assert.equal(activity.phase, "running")
  assert.equal(steps.filter((step) => step.status === "running").length, 1)
  assert.equal(steps.filter((step) => step.status === "complete").length, 0)
})

test("storefront activity derives exact cart proof only after a healthy response", () => {
  const view = {
    carts: [cart, cart],
    connectorStatuses: [
      { platform: "shopify", status: "healthy", message: "ready", checkedAt: "2026-09-02T00:00:00.000Z", retryable: false },
      { platform: "woocommerce", status: "healthy", message: "ready", checkedAt: "2026-09-02T00:00:00.000Z", retryable: false },
    ],
  } as const
  const activity = activityFromView(view as never, "start_mission")
  const steps = activitySteps(activity, view as never)

  assert.equal(activity.phase, "resolved")
  assert.match(activity.message, /two complete rain-ready kits/i)
  assert.match(steps.find((step) => step.id === "compose")!.detail, /7 units · 5 categories/)
  assert.match(steps.find((step) => step.id === "verify")!.detail, /89 L packed · 3,000 mm rainfly/)
})

test("storefront activity preserves healthy carts when one connector is degraded", () => {
  const view = {
    carts: [cart],
    connectorStatuses: [
      { platform: "shopify", status: "healthy", message: "ready", checkedAt: "2026-09-02T00:00:00.000Z", retryable: false },
      { platform: "woocommerce", status: "failed", message: "timeout", checkedAt: "2026-09-02T00:00:00.000Z", retryable: true },
    ],
  } as const
  const activity = activityFromView(view as never, "start_mission")
  const steps = activitySteps(activity, view as never)

  assert.equal(activity.phase, "degraded")
  assert.equal(activity.retryable, true)
  assert.equal(steps.find((step) => step.id === "sources")!.status, "warning")
  assert.equal(steps.find((step) => step.id === "compose")!.status, "complete")
})

test("storefront error remains fail-closed and provides a retryable state", () => {
  const activity = errorActivity("start_mission", "No connected store produced a complete cart.", true)
  const steps = activitySteps(activity, null)

  assert.equal(activity.phase, "error")
  assert.equal(activity.retryable, true)
  assert.equal(steps.find((step) => step.id === "compose")!.status, "pending")
  assert.equal(steps.find((step) => step.id === "handoff")!.status, "complete")
  assert.equal(idleActivity.phase, "idle")
})

test("unconfigured or totally failed connectors cannot resolve an empty storefront", () => {
  const view = {
    carts: [],
    connectorStatuses: [
      { platform: "shopify", status: "unconfigured", message: "missing config", checkedAt: "2026-09-02T00:00:00.000Z", retryable: false },
      { platform: "woocommerce", status: "failed", message: "timeout", checkedAt: "2026-09-02T00:00:00.000Z", retryable: true },
    ],
  } as const

  const activity = activityFromView(view as never, "start_mission")
  assert.equal(activity.phase, "error")
  assert.equal(activity.retryable, true)
})

test("aborts restore stable visible state and stale responses never win", () => {
  assert.equal(activityAfterAbort(null).phase, "idle")
  assert.equal(activityAfterAbort({ carts: [cart, cart], connectorStatuses: [] } as never).phase, "resolved")
  assert.equal(isCurrentStorefrontRequest(3, 3), true)
  assert.equal(isCurrentStorefrontRequest(2, 3), false)
})

test("refreshes, swaps, and selection changes invalidate private handoff data", () => {
  assert.equal(invalidatesPrivateHandoff("select_cart"), true)
  assert.equal(invalidatesPrivateHandoff("swap_cart_item"), true)
  assert.equal(invalidatesPrivateHandoff("refresh_carts"), true)
  assert.equal(invalidatesPrivateHandoff("build_carts"), true)
  assert.equal(invalidatesPrivateHandoff("compare_carts"), false)
})

test("refresh and swap responses derive a fresh resolved state", () => {
  const view = { carts: [cart, cart], connectorStatuses: [] } as never
  assert.equal(activityFromView(view, "refresh_carts").operation, "refresh_carts")
  assert.equal(activityFromView(view, "swap_cart_item").operation, "swap_cart_item")
})

test("showcase results truthfully disclose when the storefront displays the best two", () => {
  const view = { carts: [cart, cart, cart, cart, cart], connectorStatuses: [] } as never
  const activity = activityFromView(view, "start_mission")
  const steps = activitySteps(activity, view)

  assert.match(activity.message, /found 5 complete showcase kits/i)
  assert.match(steps.find((step) => step.id === "compose")!.detail, /2 shown of 5 kits/)
})
