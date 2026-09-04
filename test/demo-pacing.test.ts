import assert from "node:assert/strict"
import test from "node:test"

import {
  DEMO_PRESENTATION_HOLDS,
  demoBeatFor,
  isRealNetworkStage,
  presentationHoldFor,
} from "../web/demo-pacing.js"

test("guided rehearsal uses the approved deliberate presentation holds", () => {
  assert.deepEqual(DEMO_PRESENTATION_HOLDS, {
    opening: 1_200,
    connecting: 4_500,
    results: 1_400,
    browsing: 2_400,
    selecting: 1_300,
    selected: 1_200,
    handoff: 2_500,
  })
  assert.equal(presentationHoldFor("running"), null)
  assert.equal(presentationHoldFor("adding"), null)
  assert.equal(isRealNetworkStage("running"), true)
  assert.equal(isRealNetworkStage("adding"), true)
})

test("guided rehearsal exposes five legible beats without inventing backend progress", () => {
  assert.deepEqual(demoBeatFor("connecting"), { current: 1, total: 5, label: "Connect safely" })
  assert.deepEqual(demoBeatFor("results"), { current: 2, total: 5, label: "Build complete kits" })
  assert.deepEqual(demoBeatFor("browsing"), { current: 3, total: 5, label: "Compare verified carts" })
  assert.deepEqual(demoBeatFor("selected"), { current: 4, total: 5, label: "Choose reversibly" })
  assert.deepEqual(demoBeatFor("handoff"), { current: 5, total: 5, label: "Return human control" })
})
