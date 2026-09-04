export const WOVEN_DEMO_MESSAGE = "woven:demo"

export type GuidedDemoStage =
  | "ready"
  | "running"
  | "results"
  | "browsing"
  | "selecting"
  | "adding"
  | "selected"
  | "handoff"
  | "complete"
  | "error"

export interface GuidedDemoStartMessage {
  type: typeof WOVEN_DEMO_MESSAGE
  action: "start"
  request: string
}

export interface GuidedDemoStageMessage {
  type: typeof WOVEN_DEMO_MESSAGE
  action: "stage"
  stage: GuidedDemoStage
  detail?: string
}

export interface GuidedDemoControlMessage {
  type: typeof WOVEN_DEMO_MESSAGE
  action: "control"
  command: "advance"
}

export function isGuidedDemoStartMessage(value: unknown): value is GuidedDemoStartMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === WOVEN_DEMO_MESSAGE
    && message.action === "start"
    && typeof message.request === "string"
    && message.request.trim().length > 0
    && message.request.length <= 1_000
}

export function isGuidedDemoStageMessage(value: unknown): value is GuidedDemoStageMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === WOVEN_DEMO_MESSAGE
    && message.action === "stage"
    && ["ready", "running", "results", "browsing", "selecting", "adding", "selected", "handoff", "complete", "error"].includes(String(message.stage))
    && (message.detail === undefined || typeof message.detail === "string")
}

export function isGuidedDemoControlMessage(value: unknown): value is GuidedDemoControlMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === WOVEN_DEMO_MESSAGE
    && message.action === "control"
    && message.command === "advance"
}
