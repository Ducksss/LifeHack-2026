import type { GuidedDemoStage } from "./demo-protocol"

export type PresentationStage = "opening" | "connecting" | GuidedDemoStage

export const DEMO_PRESENTATION_HOLDS = {
  opening: 1_200,
  connecting: 4_500,
  results: 1_400,
  browsing: 2_400,
  selecting: 1_300,
  selected: 1_200,
  handoff: 2_500,
} as const satisfies Partial<Record<PresentationStage, number>>

export interface DemoBeat {
  current: number
  total: 5
  label: string
}

export function demoBeatFor(stage: PresentationStage): DemoBeat {
  if (stage === "opening" || stage === "connecting" || stage === "ready") {
    return { current: 1, total: 5, label: "Connect safely" }
  }
  if (stage === "running" || stage === "results") {
    return { current: 2, total: 5, label: "Build complete kits" }
  }
  if (stage === "browsing") {
    return { current: 3, total: 5, label: "Compare verified carts" }
  }
  if (stage === "selecting" || stage === "adding" || stage === "selected") {
    return { current: 4, total: 5, label: "Choose reversibly" }
  }
  return { current: 5, total: 5, label: "Return human control" }
}

export function presentationHoldFor(stage: PresentationStage): number | null {
  return stage in DEMO_PRESENTATION_HOLDS
    ? DEMO_PRESENTATION_HOLDS[stage as keyof typeof DEMO_PRESENTATION_HOLDS]
    : null
}

export function isRealNetworkStage(stage: PresentationStage) {
  return stage === "running" || stage === "adding"
}
