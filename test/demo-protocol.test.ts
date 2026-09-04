import assert from "node:assert/strict"
import test from "node:test"

import {
  WOVEN_DEMO_MESSAGE,
  isGuidedDemoControlMessage,
  isGuidedDemoStageMessage,
  isGuidedDemoStartMessage,
} from "../web/demo-protocol.js"

test("guided demo messages accept only bounded start requests and known stages", () => {
  assert.equal(isGuidedDemoStartMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "start",
    request: "Build a rainy camping kit",
  }), true)
  assert.equal(isGuidedDemoStartMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "start",
    request: "",
  }), false)
  assert.equal(isGuidedDemoStartMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "start",
    request: "x".repeat(1_001),
  }), false)

  assert.equal(isGuidedDemoStageMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "stage",
    stage: "handoff",
  }), true)
  assert.equal(isGuidedDemoStageMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "stage",
    stage: "checkout",
  }), false)
  assert.equal(isGuidedDemoStageMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "stage",
    stage: "selected",
  }), true)
  assert.equal(isGuidedDemoControlMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "control",
    command: "advance",
  }), true)
  assert.equal(isGuidedDemoControlMessage({
    type: WOVEN_DEMO_MESSAGE,
    action: "control",
    command: "checkout",
  }), false)
})
