import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Loader2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Terminal,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  WOVEN_DEMO_MESSAGE,
  type GuidedDemoStage,
  isGuidedDemoStageMessage,
} from "./demo-protocol"
import {
  DEMO_PRESENTATION_HOLDS,
  demoBeatFor,
  isRealNetworkStage,
  presentationHoldFor,
  type PresentationStage,
} from "./demo-pacing"
import { WEBMCP_CHALLENGE_URL, WEBMCP_TESTING_OPTIONS } from "./webmcp-testing"
import "./styles.css"

const CANONICAL_REQUEST =
  "I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it under S$300, fit it in one car boot, and make it pickup-ready today. Compare Shopify and WooCommerce."

type HostStage = "idle" | "opening" | "connecting" | GuidedDemoStage

interface PendingPresentationHold {
  stage: PresentationStage
  remaining: number
  startedAt: number
  timerId: number | null
  callback: () => void
}

const activeBrowserStages = new Set<HostStage>([
  "ready",
  "connecting",
  "running",
  "results",
  "browsing",
  "selecting",
  "adding",
  "selected",
  "handoff",
])

const stageCopy: Record<HostStage, { label: string; detail: string; tool: string }> = {
  idle: { label: "Ready", detail: "Send a shopping mission to Woven.", tool: "—" },
  opening: { label: "Evaluating your request", detail: "Woven is checking whether the storefront can handle this through a bounded site action.", tool: "evaluate_request" },
  connecting: { label: "WebMCP rehearsal active", detail: "Seven reversible site actions are available; identity and checkout stay private.", tool: "register_site_tools" },
  ready: { label: "Storefront ready", detail: "The guided storefront is ready for the bounded request.", tool: "open_page" },
  running: { label: "Evaluating request", detail: "Waiting for the real mission response—no progress is being invented.", tool: "start_mission" },
  results: { label: "Complete kits returned", detail: "The browser can now reveal evidence and exact totals from the response.", tool: "get_mission" },
  browsing: { label: "Comparing verified carts", detail: "The storefront is showing two complete one-store results from the returned mission.", tool: "compare_carts" },
  selecting: { label: "Targeting the best match", detail: "The highlighted TrailHaus cart satisfies every hard constraint.", tool: "select_cart" },
  adding: { label: "Selecting TrailHaus", detail: "This reversible site action is waiting for the real server response.", tool: "select_cart" },
  selected: { label: "TrailHaus selected", detail: "The visible cart changed only after the server confirmed the reversible action.", tool: "select_cart" },
  handoff: { label: "Human control required", detail: "The browser stopped before identity, exact checkout terms, or purchase authorization.", tool: "handoff" },
  complete: { label: "Control returned", detail: "The verified selection is back in chat. Identity and checkout remain yours.", tool: "handoff" },
  error: { label: "Run stopped safely", detail: "No result was fabricated. Replay the request to try again.", tool: "error" },
}

function DemoHost() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const instant = query.has("instant") || query.get("loop") === "true"
  const loop = query.get("loop") === "true"
  const [draft, setDraft] = useState(CANONICAL_REQUEST)
  const [activeRequest, setActiveRequest] = useState<string | null>(null)
  const [stage, setStage] = useState<HostStage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)
  const [browserReview, setBrowserReview] = useState(false)
  const [paused, setPaused] = useState(false)
  const [, setHoldVersion] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const requestRef = useRef<string | null>(null)
  const startedRunRef = useRef(0)
  const preparedRunRef = useRef(0)
  const instantStartedRef = useRef(false)
  const loopTimerRef = useRef<number | null>(null)
  const pausedRef = useRef(false)
  const pendingHoldRef = useRef<PendingPresentationHold | null>(null)

  const armPresentationHold = useCallback((hold: PendingPresentationHold) => {
    hold.startedAt = performance.now()
    hold.timerId = window.setTimeout(() => {
      if (pendingHoldRef.current !== hold) return
      pendingHoldRef.current = null
      setHoldVersion((current) => current + 1)
      hold.callback()
    }, hold.remaining)
  }, [])

  const clearPresentationHold = useCallback(() => {
    const hold = pendingHoldRef.current
    if (hold?.timerId !== null && hold?.timerId !== undefined) window.clearTimeout(hold.timerId)
    pendingHoldRef.current = null
    setHoldVersion((current) => current + 1)
  }, [])

  const schedulePresentationHold = useCallback((nextStage: PresentationStage, milliseconds: number, callback: () => void) => {
    clearPresentationHold()
    const hold: PendingPresentationHold = {
      stage: nextStage,
      remaining: milliseconds,
      startedAt: 0,
      timerId: null,
      callback,
    }
    pendingHoldRef.current = hold
    setHoldVersion((current) => current + 1)
    if (!pausedRef.current) armPresentationHold(hold)
  }, [armPresentationHold, clearPresentationHold])

  const postFrameAdvance = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: WOVEN_DEMO_MESSAGE,
      action: "control",
      command: "advance",
    }, window.location.origin)
  }, [])

  const startShowcase = useCallback((event?: FormEvent) => {
    event?.preventDefault()
    const request = draft.trim()
    if (!request) {
      setError("Describe the trip before Woven opens the browser.")
      return
    }
    if (loopTimerRef.current !== null) window.clearTimeout(loopTimerRef.current)
    clearPresentationHold()
    pausedRef.current = false
    setPaused(false)
    requestRef.current = request
    setActiveRequest(request)
    setBrowserReview(false)
    setError(null)
    setStage("opening")
    setRunId((current) => current + 1)
  }, [clearPresentationHold, draft])

  useEffect(() => {
    document.title = "Woven — Chat to Browser Demo"
    document.body.classList.add("demo-host-body")
    return () => {
      document.body.classList.remove("demo-host-body")
      if (loopTimerRef.current !== null) window.clearTimeout(loopTimerRef.current)
      const hold = pendingHoldRef.current
      if (hold?.timerId !== null && hold?.timerId !== undefined) window.clearTimeout(hold.timerId)
      pendingHoldRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      if (!isGuidedDemoStageMessage(event.data)) return

      if (event.data.stage === "error") {
        clearPresentationHold()
        setStage("error")
        setBrowserReview(false)
        setError(event.data.detail || "The guided storefront could not finish.")
        return
      }
      if (event.data.stage === "complete") {
        clearPresentationHold()
        setStage("complete")
        setBrowserReview(false)
        if (loop) loopTimerRef.current = window.setTimeout(() => startShowcase(), 8_000)
        return
      }

      if (event.data.stage === "ready" && requestRef.current && preparedRunRef.current !== runId) {
        preparedRunRef.current = runId
        schedulePresentationHold("opening", DEMO_PRESENTATION_HOLDS.opening, () => {
          if (!requestRef.current || startedRunRef.current === runId) return
          setStage("connecting")
          schedulePresentationHold("connecting", DEMO_PRESENTATION_HOLDS.connecting, () => {
            if (!requestRef.current || startedRunRef.current === runId) return
            startedRunRef.current = runId
            iframeRef.current?.contentWindow?.postMessage({
              type: WOVEN_DEMO_MESSAGE,
              action: "start",
              request: requestRef.current,
            }, window.location.origin)
          })
        })
        return
      }

      setStage(event.data.stage)
      const hold = presentationHoldFor(event.data.stage)
      if (hold !== null) schedulePresentationHold(event.data.stage, hold, postFrameAdvance)
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [clearPresentationHold, loop, postFrameAdvance, runId, schedulePresentationHold, startShowcase])

  useEffect(() => {
    if (!instant || instantStartedRef.current) return
    instantStartedRef.current = true
    const frame = window.requestAnimationFrame(() => startShowcase())
    return () => window.cancelAnimationFrame(frame)
  }, [instant, startShowcase])

  const togglePause = useCallback(() => {
    const nextPaused = !pausedRef.current
    pausedRef.current = nextPaused
    setPaused(nextPaused)
    const hold = pendingHoldRef.current
    if (!hold) return
    if (nextPaused) {
      if (hold.timerId !== null) {
        window.clearTimeout(hold.timerId)
        hold.remaining = Math.max(0, hold.remaining - (performance.now() - hold.startedAt))
        hold.timerId = null
      }
      return
    }
    armPresentationHold(hold)
  }, [armPresentationHold])

  const advancePresentation = useCallback(() => {
    const hold = pendingHoldRef.current
    if (!hold) return
    if (hold.timerId !== null) window.clearTimeout(hold.timerId)
    pendingHoldRef.current = null
    setHoldVersion((current) => current + 1)
    hold.callback()
  }, [])

  const status = stageCopy[stage]
  const running = activeRequest !== null && stage !== "complete" && stage !== "error"
  const browserOpen = activeRequest !== null && (activeBrowserStages.has(stage) || browserReview)
  const storefrontAddress = `${window.location.host}/webmcp`
  const beat = stage === "idle" ? null : demoBeatFor(stage)
  const canAdvance = stage !== "idle" && pendingHoldRef.current?.stage === stage && !isRealNetworkStage(stage)
  const humanControl = browserReview || stage === "handoff" || stage === "complete"

  return (
    <div className="demo-scene">
      <div className="demo-laptop" aria-label="Woven chat-to-browser demo presented inside a laptop frame">
        <div className="demo-laptop-lid">
          <span className="demo-laptop-camera" aria-hidden="true" />
          <div className="demo-laptop-screen">
            <div className="demo-chat-app demo-lifehack-host">
              <div className="demo-chat-main">
                <header className="demo-chat-topbar">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="truncate text-sm font-semibold tracking-tight">Woven Demo Host</span>
                    <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-[0.1em]">Simulated</Badge>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                      <a href="/webmcp" target="_blank" rel="noreferrer">Test WebMCP<ArrowUpRight data-icon="inline-end" /></a>
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden lg:inline-flex" asChild>
                      <a href="/install" target="_blank" rel="noreferrer">How to install<ArrowUpRight data-icon="inline-end" /></a>
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                      <a href="/merchant" target="_blank" rel="noreferrer">Merchant desk<ArrowUpRight data-icon="inline-end" /></a>
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Replay demo" onClick={() => startShowcase()}>
                      <RotateCcw />
                    </Button>
                  </div>
                </header>

                <main className="demo-chat-thread" aria-label="Demo conversation">
                  {!activeRequest ? (
                    <div className="demo-chat-welcome">
                      <h1>What do you need?</h1>
                    </div>
                  ) : (
                    <div className="demo-chat-conversation demo-lifehack-conversation">
                      <div className="demo-lifehack-user-row">
                        <p>{activeRequest}</p>
                      </div>

                      <div className="demo-lifehack-assistant">
                          {stage === "complete" ? (
                            <div className="demo-chat-result">
                              <p>I found two complete one-store kits and added the best match to the storefront cart.</p>
                              <div className="demo-result-card">
                                <div>
                                  <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Selected cart</span>
                                  <h2>TrailHaus · S$231</h2>
                                  <p>7 units · 5 categories · 89 L · 3,000 mm · pickup today</p>
                                </div>
                                <span className="demo-result-check" aria-hidden="true"><Check /></span>
                              </div>
                              <div className="demo-return-note">
                                <ShieldCheck className="size-4 text-success" />
                                <span>Browser control returned to chat. Identity and checkout remain yours.</span>
                              </div>
                              <Button type="button" variant="outline" onClick={() => setBrowserReview(true)}>
                                Review in browser<ExternalLink data-icon="inline-end" />
                              </Button>
                            </div>
                          ) : stage === "error" ? (
                            <div className="demo-chat-result">
                              <p>{status.detail}</p>
                              <Button type="button" variant="outline" onClick={() => startShowcase()}>Replay request</Button>
                            </div>
                          ) : (
                            <div aria-live="polite">
                              <div className="demo-lifehack-activity">
                                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                                <span className="shimmer-text">{status.label}</span>
                              </div>
                              <div className="demo-lifehack-toolchip">
                                <Terminal className="size-3 text-muted-foreground" />
                                <code>{status.tool}</code>
                                <span>safe site action</span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </main>

                <form className="demo-chat-composer-wrap" noValidate onSubmit={startShowcase}>
                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor="demo-request" className="sr-only">Message Woven</FieldLabel>
                    <div className="demo-chat-composer">
                      <Textarea
                        id="demo-request"
                        value={draft}
                        maxLength={1_000}
                        rows={2}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "demo-request-error demo-request-help" : "demo-request-help"}
                        onChange={(event) => setDraft(event.target.value)}
                        className="min-h-16 resize-none border-0 bg-transparent px-5 py-4 pr-16 text-sm leading-6 shadow-none focus-visible:ring-0"
                      />
                      <Button type="submit" size="icon" aria-label={running ? "Woven is running" : activeRequest ? "Replay showcase" : "Send mission"} disabled={running}>
                        {running ? <Spinner /> : <ArrowUp />}
                      </Button>
                    </div>
                    <div className="flex items-start justify-between gap-3 px-1">
                      <FieldDescription id="demo-request-help">Simulated rehearsal of the ChatGPT/Codex MCP experience — same server, real tool calls, no live charge.</FieldDescription>
                    </div>
                    <FieldError id="demo-request-error">{error}</FieldError>
                  </Field>
                </form>

                {activeRequest ? (
                  <section className={cn("demo-browser-takeover", browserOpen && "demo-browser-takeover-open")} aria-label="Simulated browser control">
                    <div className="demo-browser-controlbar">
                      <span className={cn("demo-control-status", humanControl && "demo-control-human")}>
                        {humanControl ? <LockKeyhole className="size-4" /> : <MousePointer2 className="size-4" />}
                        {browserReview ? "Human control" : humanControl ? "Human control required" : "WebMCP rehearsal active"}
                      </span>
                      {beat ? <span className="demo-control-beat"><b>{beat.current}/{beat.total}</b><span>{beat.label}</span></span> : null}
                      <span className="demo-control-tool"><Sparkles className="size-3.5" /><code>{browserReview ? "handoff" : status.tool}</code></span>
                      <div className="demo-control-actions">
                        {browserReview ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => setBrowserReview(false)}>Return to chat</Button>
                        ) : (
                          <>
                            <Button type="button" variant="ghost" size="sm" aria-label={paused ? "Resume guided presentation" : "Pause guided presentation"} aria-pressed={paused} onClick={togglePause}>
                              {paused ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}
                              <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
                            </Button>
                            <Button type="button" variant="outline" size="sm" aria-label="Advance to the next presentation beat" disabled={!canAdvance} onClick={advancePresentation}>
                              <SkipForward data-icon="inline-start" />
                              <span className="hidden sm:inline">Next beat</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="demo-browser-window">
                      <div className="demo-browser-chrome">
                        <div className="flex gap-1.5" aria-hidden="true"><i /><i /><i /></div>
                        <div className="demo-address"><Globe2 className="size-3.5" /><span>{storefrontAddress}</span><Badge variant="secondary">Showcase data</Badge></div>
                        <Button asChild variant="ghost" size="icon-sm" aria-label="Open storefront directly">
                          <a href="/webmcp" target="_blank" rel="noreferrer"><ExternalLink /></a>
                        </Button>
                      </div>
                      <iframe
                        key={runId}
                        ref={iframeRef}
                        className="demo-browser-frame"
                        src={`/webmcp?guided=demo&run=${runId}`}
                        title="Woven Trail Market guided showcase storefront"
                      />
                      {stage === "connecting" && !browserReview ? (
                        <div className="demo-webmcp-activation" role="status" aria-live="polite">
                          <div className="demo-webmcp-activation-card">
                            <div className="demo-activation-kicker"><span aria-hidden="true" /><span>WebMCP rehearsal</span><Badge variant="secondary">Showcase data</Badge></div>
                            <h2>WebMCP rehearsal active</h2>
                            <p>This embedded scene demonstrates the flow but does not register site tools. Test the actual seven-tool surface by opening Woven Trail Market at the top level in a supported browser.</p>
                            <div className="demo-test-paths" aria-label="Supported WebMCP testing options">
                              {WEBMCP_TESTING_OPTIONS.map((option) => (
                                <div className="demo-test-path" key={option.label}>
                                  <Globe2 aria-hidden="true" />
                                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                                </div>
                              ))}
                            </div>
                            <div className="demo-test-actions">
                              <Button asChild size="sm">
                                <a href="/webmcp" target="_blank" rel="noreferrer">Open real WebMCP storefront<ExternalLink data-icon="inline-end" /></a>
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <a href={WEBMCP_CHALLENGE_URL} target="_blank" rel="noreferrer">Official testing guide<ArrowUpRight data-icon="inline-end" /></a>
                              </Button>
                            </div>
                            <div className="demo-activation-boundary">
                              <ShieldCheck aria-hidden="true" />
                              <span><strong>Rehearsal boundary:</strong> safe mission, comparison, and cart-choice actions only. Identity, checkout terms, and purchase authorization stay human-only.</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="demo-laptop-base" aria-hidden="true"><span /></div>
      </div>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<DemoHost />)
