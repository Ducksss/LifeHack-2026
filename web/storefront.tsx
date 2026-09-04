import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleAlert,
  CloudSun,
  Fingerprint,
  Globe2,
  MapPin,
  MousePointer2,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TerminalSquare,
  TriangleAlert,
} from "lucide-react"

import type { MissionInput, MissionView, RankedCart, SourceMode } from "../src/domain"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import drynestImage from "@/assets/storefront/drynest-sleeping-bag.webp"
import rainbeamImage from "@/assets/storefront/rainbeam-lantern.webp"
import stormweaveImage from "@/assets/storefront/stormweave-tent.webp"
import trailguardImage from "@/assets/storefront/trailguard-first-aid.webp"
import trailrestImage from "@/assets/storefront/trailrest-sleeping-mat.webp"
import { WovenMark } from "@/woven-mark"
import {
  type WebMcpAdapter,
  type WebMcpContext,
  registerWebMcpTools,
} from "./webmcp"
import {
  STOREFRONT_TOOL_NAMES,
  type StorefrontActivity,
  activityFromView,
  activityAfterAbort,
  activitySteps,
  errorActivity,
  idleActivity,
  invalidatesPrivateHandoff,
  isCurrentStorefrontRequest,
  runningActivity,
} from "./storefront-state"
import {
  WOVEN_DEMO_MESSAGE,
  isGuidedDemoControlMessage,
  isGuidedDemoStartMessage,
  type GuidedDemoStage,
} from "./demo-protocol"
import { WEBMCP_CHALLENGE_URL, WEBMCP_TESTING_OPTIONS } from "./webmcp-testing"
import "./styles.css"

const LIVE_REQUEST =
  "I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it under S$900, fit it in one car boot, and make it pickup-ready today. Compare Shopify and WooCommerce."

const PRODUCT_ART: Record<string, string> = {
  tent: stormweaveImage,
  sleeping_bag: drynestImage,
  sleeping_mat: trailrestImage,
  lantern: rainbeamImage,
  first_aid: trailguardImage,
}

const catalogPreview = [
  { category: "tent", name: "StormWeave 2-Person Rain Tent", detail: "3,000 mm rainfly", priceCents: 18_900 },
  { category: "sleeping_bag", name: "DryNest Synthetic Sleeping Bag", detail: "Damp-ready", priceCents: 7_900 },
  { category: "sleeping_mat", name: "TrailRest R2 Sleeping Mat", detail: "R-value 2", priceCents: 5_500 },
  { category: "lantern", name: "RainBeam 250 IPX4 Lantern", detail: "Rain-ready", priceCents: 4_900 },
  { category: "first_aid", name: "TrailGuard First-Aid Kit", detail: "Covers four", priceCents: 3_900 },
] as const

type Priority = "balanced" | "value" | "speed" | "weather"
type PickupArea = "Any" | "Central" | "East" | "North"
type ToolCallStatus = "running" | "done" | "error"

interface ToolCall {
  id: string
  name: string
  status: ToolCallStatus
}

interface ApiPayload {
  view?: MissionView
  verification?: unknown
  _meta?: {
    authorizationUrl?: string
    checkoutUrl?: string
    confirmationNonce?: string
  }
  error?: { code?: string; message?: string; retryable?: boolean }
}

class WovenRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
  }
}

async function post(url: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ApiPayload> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
  const payload = await response.json() as ApiPayload
  if (!response.ok || payload.error) {
    throw new WovenRequestError(
      payload.error?.code || "REQUEST_FAILED",
      payload.error?.message || "Woven could not complete that request.",
      Boolean(payload.error?.retryable),
    )
  }
  return payload
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", minimumFractionDigits: 0 }).format(cents / 100)
}

function formatTime(value: string | undefined) {
  if (!value) return "just now"
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Singapore",
  }).format(new Date(value))
}

function platformLabel(cart: RankedCart) {
  if (cart.platform === "shopify") return "Shopify"
  if (cart.platform === "woocommerce") return "WooCommerce"
  return "Showcase catalog"
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" })
}

function scrollToHandoff() {
  document.querySelector<HTMLElement>(".handoff-panel")?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" })
}

function scrollToBestCart() {
  document.querySelector<HTMLElement>(".kit-card")?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" })
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
}

type GuidedAction = "start_mission" | "compare_carts" | "selecting" | "select_cart" | "selected" | "handoff"
type WebMcpConnectionState = "rehearsal" | "unsupported" | "registering" | "connected" | "failed"

function StorefrontApp() {
  const guidedDemo = useMemo(() => new URLSearchParams(window.location.search).get("guided") === "demo", [])
  const [request, setRequest] = useState(LIVE_REQUEST)
  const [sourceMode, setSourceModeState] = useState<SourceMode>(() => {
    if (new URLSearchParams(window.location.search).get("guided") === "demo") return "demo"
    try {
      return sessionStorage.getItem("woven-storefront-source") === "demo" ? "demo" : "live"
    } catch {
      return "live"
    }
  })
  const [view, setView] = useState<MissionView | null>(null)
  const [activity, setActivity] = useState<StorefrontActivity>(idleActivity)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [humanBusy, setHumanBusy] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [humanError, setHumanError] = useState<string | null>(null)
  const [webMcpConnection, setWebMcpConnection] = useState<WebMcpConnectionState>(() => {
    if (guidedDemo) return "rehearsal"
    return (document as Document & { modelContext?: WebMcpContext }).modelContext ? "registering" : "unsupported"
  })
  const [priority, setPriority] = useState<Priority>("balanced")
  const [area, setArea] = useState<PickupArea>("Any")
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [identityUrl, setIdentityUrl] = useState<string | null>(null)
  const [nonce, setNonce] = useState<string | null>(null)
  const [guidedAction, setGuidedAction] = useState<GuidedAction | null>(null)

  const viewRef = useRef<MissionView | null>(null)
  const sourceModeRef = useRef(sourceMode)
  const operationSequence = useRef(0)
  const operationController = useRef<AbortController | null>(null)
  const humanController = useRef<AbortController | null>(null)
  const guidedSequence = useRef(0)

  useEffect(() => {
    document.title = guidedDemo
      ? "Woven Trail Market — Guided Showcase"
      : "Woven Trail Market — WebMCP Showcase"
  }, [guidedDemo])

  useEffect(() => () => {
    operationController.current?.abort()
    humanController.current?.abort()
  }, [])

  const setCurrentView = useCallback((next: MissionView, operation: string) => {
    viewRef.current = next
    setView(next)
    setActivity(activityFromView(next, operation))
  }, [])

  const beginToolCall = useCallback((name: string) => {
    const id = crypto.randomUUID()
    const call: ToolCall = { id, name, status: "running" }
    setToolCalls((current) => [call, ...current].slice(0, 9))
    return id
  }, [])

  const finishToolCall = useCallback((id: string, status: Exclude<ToolCallStatus, "running">) => {
    setToolCalls((current) => current.map((call) => call.id === id ? { ...call, status } : call))
  }, [])

  const syncSourceMode = useCallback((mode: SourceMode) => {
    sourceModeRef.current = mode
    setSourceModeState(mode)
    try {
      sessionStorage.setItem("woven-storefront-source", mode)
    } catch {
      // Session storage is optional; the visible selection remains authoritative.
    }
  }, [])

  const runOperation = useCallback(async (
    operation: string,
    work: (signal: AbortSignal) => Promise<ApiPayload>,
    outsideSignal?: AbortSignal,
  ) => {
    operationController.current?.abort()
    const controller = new AbortController()
    operationController.current = controller
    const sequence = ++operationSequence.current
    const signal = outsideSignal ? AbortSignal.any([controller.signal, outsideSignal]) : controller.signal
    const callId = beginToolCall(operation === "build_carts" ? "refresh_carts" : operation)
    setBusy(operation)
    setFormError(null)
    setActivity(runningActivity(operation))
    try {
      const payload = await work(signal)
      if (!isCurrentStorefrontRequest(sequence, operationSequence.current)) return null
      if (payload.view) setCurrentView(payload.view, operation)
      finishToolCall(callId, "done")
      return payload
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        finishToolCall(callId, "error")
        if (isCurrentStorefrontRequest(sequence, operationSequence.current)) {
          setActivity(activityAfterAbort(viewRef.current))
        }
        throw caught
      }
      const requestError = caught instanceof WovenRequestError
        ? caught
        : new WovenRequestError("REQUEST_FAILED", caught instanceof Error ? caught.message : "Woven could not complete that request.", false)
      if (isCurrentStorefrontRequest(sequence, operationSequence.current)) {
        setActivity(errorActivity(operation, requestError.message, requestError.retryable))
        setFormError(requestError.message)
      }
      finishToolCall(callId, "error")
      throw requestError
    } finally {
      if (isCurrentStorefrontRequest(sequence, operationSequence.current)) setBusy(null)
    }
  }, [beginToolCall, finishToolCall, setCurrentView])

  const startMission = useCallback(async (input: MissionInput, signal?: AbortSignal) => {
    const mode = input.sourceMode || sourceModeRef.current
    syncSourceMode(mode)
    setRequest(input.request)
    setCheckoutUrl(null)
    setIdentityUrl(null)
    setNonce(null)
    const payload = await runOperation(
      "start_mission",
      (requestSignal) => post("/api/missions/start", { ...input, sourceMode: mode }, requestSignal),
      signal,
    )
    if (!payload?.view) throw new WovenRequestError("MISSION_MISSING", "The mission response did not contain a visible result.", true)
    return payload.view
  }, [runOperation, syncSourceMode])

  const invokeTool = useCallback(async (
    name: "select_cart" | "swap_cart_item" | "build_carts",
    arguments_: Record<string, unknown>,
    signal?: AbortSignal,
  ) => {
    if (invalidatesPrivateHandoff(name)) {
      setCheckoutUrl(null)
      setNonce(null)
    }
    const payload = await runOperation(
      name,
      (requestSignal) => post(`/api/tools/${name}`, arguments_, requestSignal),
      signal,
    )
    if (!payload?.view) throw new WovenRequestError("MISSION_MISSING", "The site tool did not return the current mission.", true)
    return payload.view
  }, [runOperation])

  const compareCarts = useCallback((options: { priority?: Priority; area?: PickupArea }) => {
    if (options.priority) setPriority(options.priority)
    if (options.area) setArea(options.area)
    const callId = beginToolCall("compare_carts")
    finishToolCall(callId, "done")
    const current = viewRef.current
    if (current) setActivity(activityFromView(current, "compare_carts"))
    scrollToId("complete-kits")
  }, [beginToolCall, finishToolCall])

  const verifyReceipt = useCallback(async (receiptNumber: string, signature: string, signal: AbortSignal) => {
    const payload = await runOperation(
      "verify_receipt",
      (requestSignal) => post("/api/tools/verify_receipt", { receiptNumber, signature }, requestSignal),
      signal,
    )
    return payload?.verification
  }, [runOperation])

  useEffect(() => {
    if (window.self !== window.top) return
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext
    if (!context) {
      setWebMcpConnection("unsupported")
      return
    }
    setWebMcpConnection("registering")
    const controller = new AbortController()
    const adapter: WebMcpAdapter = {
      getView: () => viewRef.current,
      startMission: (input, signal) => startMission(input, signal),
      invoke: (name, arguments_, signal) => invokeTool(name, arguments_, signal),
      compare: compareCarts,
      verifyReceipt,
    }
    void registerWebMcpTools(context, adapter, controller.signal)
      .then(() => setWebMcpConnection("connected"))
      .catch((caught) => {
        if (!controller.signal.aborted) {
          setWebMcpConnection("failed")
          setActivity(errorActivity("register_tools", caught instanceof Error ? caught.message : "The browser could not register Woven's site tools."))
        }
      })
    return () => controller.abort()
  }, [compareCarts, invokeTool, startMission, verifyReceipt])

  useEffect(() => {
    if (!guidedDemo || window.parent === window) return
    const parent = window.parent
    let advanceResolver: (() => void) | null = null
    const postStage = (stage: GuidedDemoStage, detail?: string) => {
      parent.postMessage({ type: WOVEN_DEMO_MESSAGE, action: "stage", stage, detail }, window.location.origin)
    }
    const waitForAdvance = () => new Promise<void>((resolve) => {
      advanceResolver = resolve
    })
    const runGuidedMission = async (missionRequest: string) => {
      const sequence = ++guidedSequence.current
      const current = () => sequence === guidedSequence.current
      try {
        setGuidedAction("start_mission")
        postStage("running")
        const result = await startMission({ request: missionRequest, sourceMode: "demo" })
        if (!current()) return
        postStage("results")
        await waitForAdvance()
        if (!current()) return
        setGuidedAction("compare_carts")
        postStage("browsing")
        scrollToId("complete-kits")
        await waitForAdvance()
        if (!current()) return
        const bestCart = result.carts[0]
        if (!bestCart) throw new WovenRequestError("NO_COMPLETE_CART", "No complete showcase cart was returned.", true)
        setGuidedAction("selecting")
        postStage("selecting")
        scrollToBestCart()
        await waitForAdvance()
        if (!current()) return
        setGuidedAction("select_cart")
        postStage("adding")
        await invokeTool("select_cart", { missionId: result.mission.id, cartId: bestCart.id })
        if (!current()) return
        setGuidedAction("selected")
        postStage("selected")
        await waitForAdvance()
        if (!current()) return
        setGuidedAction("handoff")
        scrollToHandoff()
        postStage("handoff")
        await waitForAdvance()
        if (!current()) return
        postStage("complete")
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return
        if (current()) {
          setGuidedAction(null)
          postStage("error", caught instanceof Error ? caught.message : "The guided storefront could not finish.")
        }
      }
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== parent) return
      if (isGuidedDemoControlMessage(event.data)) {
        const resolve = advanceResolver
        advanceResolver = null
        resolve?.()
        return
      }
      if (!isGuidedDemoStartMessage(event.data)) return
      void runGuidedMission(event.data.request.trim())
    }
    window.addEventListener("message", handleMessage)
    postStage("ready")
    return () => {
      guidedSequence.current += 1
      const resolve = advanceResolver
      advanceResolver = null
      resolve?.()
      setGuidedAction(null)
      window.removeEventListener("message", handleMessage)
    }
  }, [guidedDemo, invokeTool, startMission])

  const setSourceMode = useCallback((mode: SourceMode) => {
    syncSourceMode(mode)
    viewRef.current = null
    setView(null)
    setActivity(idleActivity)
    setFormError(null)
    setHumanError(null)
    setCheckoutUrl(null)
    setIdentityUrl(null)
    setNonce(null)
  }, [syncSourceMode])

  const submitMission = useCallback(async (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = request.trim()
    if (!trimmed) {
      setFormError("Describe the trip so Woven knows what the complete kit must cover.")
      return
    }
    try {
      await startMission({ request: trimmed, sourceMode: sourceModeRef.current })
      window.setTimeout(() => scrollToId("complete-kits"), 80)
    } catch {
      // The persistent activity panel and form error own recovery copy.
    }
  }, [request, startMission])

  const useShowcaseData = useCallback(async () => {
    try {
      await startMission({ request: request.trim() || LIVE_REQUEST, sourceMode: "demo" })
      window.setTimeout(() => scrollToId("complete-kits"), 80)
    } catch {
      // The persistent activity panel and form error own recovery copy.
    }
  }, [request, startMission])

  const runHumanAction = useCallback(async (
    label: string,
    work: (signal: AbortSignal) => Promise<ApiPayload>,
  ) => {
    humanController.current?.abort()
    const controller = new AbortController()
    humanController.current = controller
    setHumanBusy(label)
    setHumanError(null)
    try {
      const payload = await work(controller.signal)
      if (payload.view) {
        viewRef.current = payload.view
        setView(payload.view)
      }
      return payload
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return null
      setHumanError(caught instanceof Error ? caught.message : "The human handoff could not continue.")
      return null
    } finally {
      if (humanController.current === controller) setHumanBusy(null)
    }
  }, [])

  const selectCart = useCallback(async (cartId: string) => {
    const current = viewRef.current
    if (!current) return
    try {
      await invokeTool("select_cart", { missionId: current.mission.id, cartId })
      window.setTimeout(scrollToHandoff, 80)
    } catch {
      // Tool activity owns the error.
    }
  }, [invokeTool])

  const beginIdentity = useCallback(async () => {
    const current = viewRef.current
    if (!current) return
    const popup = window.open("about:blank", "woven-demo-identity")
    const payload = await runHumanAction(
      "identity",
      (signal) => post("/api/tools/start_demo_identity", { missionId: current.mission.id }, signal),
    )
    const url = payload?._meta?.authorizationUrl
    if (!url) {
      popup?.close()
      if (payload) setHumanError("The demo identity link was not returned. Start the handoff again.")
      return
    }
    setIdentityUrl(url)
    if (popup) popup.location.href = url
  }, [runHumanAction])

  const checkIdentity = useCallback(async () => {
    const current = viewRef.current
    if (!current) return
    try {
      const next = await invokeTool("build_carts", { missionId: current.mission.id })
      if (next.identity.status !== "verified") await beginIdentity()
    } catch {
      // Tool activity owns the error.
    }
  }, [beginIdentity, invokeTool])

  const createCheckoutPreview = useCallback(async () => {
    const current = viewRef.current
    const cart = current?.carts.find((candidate) => candidate.id === current.selectedCartId)
    if (!current || !cart) return
    if (current.identity.status !== "verified") {
      await beginIdentity()
      return
    }
    const payload = await runHumanAction(
      "preview",
      (signal) => post("/api/tools/create_checkout_preview", { missionId: current.mission.id, cartId: cart.id }, signal),
    )
    if (!payload) return
    setCheckoutUrl(payload._meta?.checkoutUrl || null)
    setNonce(payload._meta?.confirmationNonce || null)
  }, [beginIdentity, runHumanAction])

  const confirmDemoPurchase = useCallback(async () => {
    const current = viewRef.current
    const preview = current?.preview
    if (!preview || !nonce) {
      setHumanError("Create a fresh exact review before confirming the simulated purchase.")
      return
    }
    await runHumanAction(
      "confirm",
      (signal) => post("/api/tools/confirm_purchase", {
        previewId: preview.id,
        mandateHash: preview.mandateHash,
        confirmationNonce: nonce,
        idempotencyKey: crypto.randomUUID(),
      }, signal),
    )
  }, [nonce, runHumanAction])

  const sortedCarts = useMemo(() => {
    const carts = (view?.carts || []).filter((cart) => area === "Any" || cart.area === area)
    return carts.toSorted((left, right) => {
      if (priority === "value") return left.totalCents - right.totalCents
      if (priority === "speed") return left.pickupMinutes - right.pickupMinutes
      if (priority === "weather") return (right.metrics.tentWaterproofMm || 0) - (left.metrics.tentWaterproofMm || 0)
      return right.score - left.score
    }).slice(0, 2)
  }, [area, priority, view?.carts])

  const selectedCart = view?.carts.find((cart) => cart.id === view.selectedCartId) || null

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      guidedDemo && "guided-storefront",
      guidedDemo && guidedAction && `guided-action-${guidedAction}`,
      guidedDemo && view?.selectedCartId && "guided-storefront-handoff",
    )}>
      <StorefrontHeader connection={webMcpConnection} />
      {!guidedDemo && (webMcpConnection === "unsupported" || webMcpConnection === "failed") ? (
        <WebMcpTestingNotice connection={webMcpConnection} />
      ) : null}
      <main id="main-content" className="pb-80 lg:pb-24">
        <HeroMission
          request={request}
          sourceMode={sourceMode}
          busy={busy === "start_mission"}
          error={formError}
          onRequestChange={setRequest}
          onSourceModeChange={setSourceMode}
          onSubmit={submitMission}
        />
        <ProductRail />
        <KitResults
          view={view}
          carts={sortedCarts}
          selectedCartId={view?.selectedCartId || null}
          priority={priority}
          area={area}
          busy={busy !== null}
          guidedAction={guidedAction}
          onPriorityChange={setPriority}
          onAreaChange={setArea}
          onSelect={selectCart}
        />
        <HumanHandoff
          view={view}
          cart={selectedCart}
          guidedDemo={guidedDemo}
          busy={humanBusy}
          error={humanError}
          checkoutUrl={checkoutUrl}
          identityUrl={identityUrl}
          nonce={nonce}
          onBeginIdentity={beginIdentity}
          onCheckIdentity={checkIdentity}
          onReview={createCheckoutPreview}
          onConfirm={confirmDemoPurchase}
        />
        <FieldGuide />
      </main>
      <StorefrontFooter />
      <BehindTheCart
        activity={activity}
        view={view}
        toolCalls={toolCalls}
        guidedDemo={guidedDemo}
        onRetry={() => void submitMission()}
        onUseShowcase={() => void useShowcaseData()}
      />
    </div>
  )
}

const webMcpConnectionCopy: Record<WebMcpConnectionState, { label: string; aria: string; tone: string }> = {
  rehearsal: { label: "WebMCP rehearsal · 7 safe actions", aria: "WebMCP rehearsal with seven safe site actions", tone: "bg-signal" },
  unsupported: { label: "Open in a WebMCP browser", aria: "WebMCP is not available in this browser", tone: "bg-muted-foreground/50" },
  registering: { label: "Connecting 7 site tools", aria: "Registering seven WebMCP site tools", tone: "bg-warning pulse-dot" },
  connected: { label: "WebMCP active · 7 tools", aria: "Seven WebMCP site tools connected", tone: "bg-success" },
  failed: { label: "WebMCP unavailable", aria: "WebMCP site tool registration failed", tone: "bg-destructive" },
}

function StorefrontHeader({ connection }: { connection: WebMcpConnectionState }) {
  const status = webMcpConnectionCopy[connection]
  return (
    <header className="storefront-header sticky top-0 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center gap-5 px-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <WovenMark className="size-7 shrink-0" />
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">Woven Trail Market</span>
          <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-[0.1em]">Showcase</Badge>
        </a>
        <nav aria-label="Storefront" className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a className="storefront-nav-link" href="#shop">Shop</a>
          <a className="storefront-nav-link" href="#complete-kits">Complete kits</a>
          <a className="storefront-nav-link" href="#field-guide">Field guide</a>
          <a className="storefront-nav-link flex items-center gap-2" href="#handoff"><ShoppingBag className="size-4" />Cart</a>
        </nav>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground md:ml-0" aria-label={status.aria}>
          <span className={cn("size-2 rounded-full", status.tone)} />
          <span className="hidden sm:inline">{status.label}</span>
        </span>
      </div>
    </header>
  )
}

function WebMcpTestingNotice({ connection }: { connection: Extract<WebMcpConnectionState, "unsupported" | "failed"> }) {
  return (
    <section className="border-b border-border/70 bg-storefront-mist/65 px-5 py-4 sm:px-8 lg:px-12" aria-labelledby="webmcp-testing-title">
      <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <Globe2 className="mt-0.5 size-4 shrink-0 text-route" aria-hidden="true" />
          <div>
            <h2 id="webmcp-testing-title" className="text-sm font-semibold">
              {connection === "failed" ? "The storefront loaded, but its WebMCP tools did not connect." : "Storefront-only mode in this browser."}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              The storefront still works manually. To discover and invoke its seven site tools, use one of the supported test paths below.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {WEBMCP_TESTING_OPTIONS.map((option) => (
            <div className="rounded-lg border border-border bg-background px-3 py-2" key={option.label}>
              <strong className="block text-xs font-medium">{option.label}</strong>
              <span className="block text-[11px] leading-4 text-muted-foreground">{option.detail}</span>
            </div>
          ))}
          <Button asChild variant="outline" size="sm">
            <a href={WEBMCP_CHALLENGE_URL} target="_blank" rel="noreferrer">Official testing guide<ArrowUpRight data-icon="inline-end" /></a>
          </Button>
        </div>
      </div>
    </section>
  )
}

interface HeroMissionProps {
  request: string
  sourceMode: SourceMode
  busy: boolean
  error: string | null
  onRequestChange: (value: string) => void
  onSourceModeChange: (mode: SourceMode) => void
  onSubmit: (event: FormEvent) => void
}

function HeroMission({ request, sourceMode, busy, error, onRequestChange, onSourceModeChange, onSubmit }: HeroMissionProps) {
  return (
    <section id="top" className="storefront-hero scroll-mt-24 px-5 pb-10 pt-14 sm:px-8 sm:pb-14 sm:pt-20 lg:px-12">
      <div className="mx-auto max-w-[1440px] lg:pr-[31rem]">
        <div className="max-w-3xl">
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[4.6rem] lg:leading-[0.98]">
            Tell us the trip.<br />We’ll build the whole kit.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            One brief becomes a complete, compatible cart from one store—checked for weather, quantity, packed volume, stock, timing, and budget.
          </p>
        </div>

        <form className="mt-9 max-w-3xl" noValidate onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <FieldLabel htmlFor="mission-request" className="text-sm font-medium">What are you heading out to do?</FieldLabel>
                <div className="source-switch" aria-label="Catalog source">
                  <button type="button" aria-pressed={sourceMode === "live"} onClick={() => onSourceModeChange("live")}>Connected stores</button>
                  <button type="button" aria-pressed={sourceMode === "demo"} onClick={() => onSourceModeChange("demo")}>Showcase data</button>
                </div>
              </div>
              <div className="mission-composer">
                <Textarea
                  id="mission-request"
                  value={request}
                  onChange={(event) => onRequestChange(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "mission-error mission-help" : "mission-help"}
                  maxLength={1_000}
                  rows={4}
                  className="min-h-32 resize-none border-0 bg-transparent px-5 py-5 text-[15px] leading-6 shadow-none focus-visible:ring-0 sm:min-h-28 sm:pr-44"
                />
                <Button type="submit" size="lg" disabled={busy} className="mission-submit min-w-40">
                  {busy ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
                  Build my kit
                </Button>
              </div>
              <FieldDescription id="mission-help">Live mode checks configured Shopify and WooCommerce catalogs. Showcase data runs only after you select it.</FieldDescription>
              <FieldError id="mission-error">{error}</FieldError>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </section>
  )
}

function ProductRail() {
  return (
    <section id="shop" className="scroll-mt-24 border-y border-border/70 bg-storefront-mist/55 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Rain-ready essentials</h2>
            <p className="mt-1 text-sm text-muted-foreground">The five categories Woven must connect into one complete decision.</p>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">Connected catalog preview</span>
        </div>
        <div className="product-rail">
          {catalogPreview.map((product, index) => (
            <Card key={product.category} className="product-card min-w-52 gap-0 overflow-hidden py-0 shadow-none">
              <div className="product-image-frame">
                <img src={PRODUCT_ART[product.category]} width="720" height="720" alt="" loading={index < 2 ? "eager" : "lazy"} decoding="async" />
              </div>
              <CardHeader className="gap-1 px-4 pb-4 pt-3">
                <CardTitle><h3 className="text-sm leading-5">{product.name}</h3></CardTitle>
                <CardDescription className="flex items-center justify-between gap-3 text-xs">
                  <span>{product.detail}</span><span className="font-medium text-foreground">{formatMoney(product.priceCents)}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

interface BehindTheCartProps {
  activity: StorefrontActivity
  view: MissionView | null
  toolCalls: ToolCall[]
  guidedDemo: boolean
  onRetry: () => void
  onUseShowcase: () => void
}

function BehindTheCart({ activity, view, toolCalls, guidedDemo, onRetry, onUseShowcase }: BehindTheCartProps) {
  const [open, setOpen] = useState(() => typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const steps = activitySteps(activity, view)
  const failedLive = activity.phase === "error" && activity.operation === "start_mission"
  useEffect(() => {
    if (guidedDemo && view?.selectedCartId) setOpen(false)
    else if (activity.phase !== "idle") setOpen(true)
  }, [activity.phase, guidedDemo, view?.selectedCartId])
  useEffect(() => {
    surfaceRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }, [activity.message, activity.operation, activity.phase])
  return (
    <aside className={cn("storefront-activity", activity.phase === "resolved" && "activity-resolved")} aria-label="Behind the cart activity">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div ref={surfaceRef} className="activity-surface">
          <div className="activity-gloss" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <WovenMark className="size-5" />
                Behind the cart
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground" aria-live="polite">{activity.message}</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={open ? "Collapse activity" : "Expand activity"}>
                {open ? <ChevronDown data-icon="inline-start" /> : <ChevronUp data-icon="inline-start" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <ol className="flex flex-col gap-3" aria-label="Observable storefront checks">
                {steps.map((step) => <ActivityRow key={step.id} step={step} />)}
              </ol>

              {activity.phase === "degraded" ? (
                <Alert className="mt-4">
                  <TriangleAlert />
                  <AlertTitle>One store needs attention</AlertTitle>
                  <AlertDescription>Healthy verified carts remain available. Refresh before creating exact checkout terms.</AlertDescription>
                </Alert>
              ) : null}

              {failedLive ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activity.retryable ? <Button variant="outline" size="sm" onClick={onRetry}><RefreshCcw data-icon="inline-start" />Retry connected stores</Button> : null}
                  <Button variant="secondary" size="sm" onClick={onUseShowcase}>Use showcase data</Button>
                </div>
              ) : null}

              <Separator className="my-4" />
              <ToolDisclosure calls={toolCalls} />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </aside>
  )
}

function ActivityRow({ step }: { step: ReturnType<typeof activitySteps>[number] }) {
  const icon = step.status === "running"
    ? <Spinner className="text-foreground" />
    : step.status === "complete"
      ? <CheckCircle2 className="size-4 text-success" />
      : step.status === "warning"
        ? <TriangleAlert className="size-4 text-warning" />
        : step.status === "error"
          ? <CircleAlert className="size-4 text-destructive" />
          : <Circle className="size-4 text-muted-foreground/45" />
  return (
    <li className="grid grid-cols-[1rem_1fr] gap-3">
      <span className="mt-0.5" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-5">{step.label}</p>
        <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
      </div>
    </li>
  )
}

function ToolDisclosure({ calls }: { calls: ToolCall[] }) {
  const [open, setOpen] = useState(false)
  const statusByName = new Map(calls.map((call) => [call.name, call.status]))
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span className="flex items-center gap-2"><TerminalSquare data-icon="inline-start" />View 7 WebMCP site tools and activity</span>
          {open ? <ChevronUp data-icon="inline-end" /> : <ChevronDown data-icon="inline-end" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-3 grid gap-2 rounded-lg bg-background/65 p-3">
          {STOREFRONT_TOOL_NAMES.map((name) => {
            const status = statusByName.get(name)
            return (
              <li key={name} className="flex items-center justify-between gap-3 text-xs">
                <code className="font-mono">{name}</code>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {status === "running" ? <Spinner /> : status === "done" ? <Check className="size-3.5 text-success" /> : status === "error" ? <CircleAlert className="size-3.5 text-destructive" /> : <Circle className="size-3.5 text-muted-foreground/40" />}
                  {status || "available"}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Identity, exact checkout terms, confirmation secrets, and purchase authorization are intentionally absent.</p>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface KitResultsProps {
  view: MissionView | null
  carts: RankedCart[]
  selectedCartId: string | null
  priority: Priority
  area: PickupArea
  busy: boolean
  guidedAction: GuidedAction | null
  onPriorityChange: (priority: Priority) => void
  onAreaChange: (area: PickupArea) => void
  onSelect: (cartId: string) => void
}

function KitResults({ view, carts, selectedCartId, priority, area, busy, guidedAction, onPriorityChange, onAreaChange, onSelect }: KitResultsProps) {
  return (
    <section id="complete-kits" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1440px] lg:pr-[31rem]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Complete kits</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">One store. Every required thread.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Only connected or explicitly selected showcase facts can form a cart. Web research never unlocks checkout.</p>
          </div>
          {view ? (
            <div className="flex flex-wrap gap-2" aria-label="Cart comparison settings">
              <ComparisonButton active={priority === "balanced"} onClick={() => onPriorityChange("balanced")}>Best match</ComparisonButton>
              <ComparisonButton active={priority === "value"} onClick={() => onPriorityChange("value")}>Lowest total</ComparisonButton>
              <ComparisonButton active={priority === "weather"} onClick={() => onPriorityChange("weather")}>Most rainproof</ComparisonButton>
              <ComparisonButton active={area === "Central"} onClick={() => onAreaChange(area === "Central" ? "Any" : "Central")}>Central</ComparisonButton>
            </div>
          ) : null}
        </div>

        {!view ? (
          <div className="result-placeholder mt-10">
            <PackageCheck className="size-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Your complete kits will appear here.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Build the mission above, or ask an agent to call <code className="font-mono text-xs">start_mission</code> on this page.</p>
            </div>
          </div>
        ) : carts.length ? (
          <div className="mt-10 grid gap-5 xl:grid-cols-2">
            {carts.map((cart, index) => (
              <KitCard key={cart.id} cart={cart} selected={selectedCartId === cart.id} index={index} busy={busy} guidedAction={index === 0 ? guidedAction : null} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <Alert className="mt-10">
            <CircleAlert />
            <AlertTitle>No complete kits match this comparison.</AlertTitle>
            <AlertDescription>Clear the pickup-area filter or refresh the current connected catalogs.</AlertDescription>
          </Alert>
        )}
      </div>
    </section>
  )
}

function ComparisonButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className="comparison-chip">
      {children}
    </button>
  )
}

function KitCard({ cart, selected, index, busy, guidedAction, onSelect }: { cart: RankedCart; selected: boolean; index: number; busy: boolean; guidedAction: GuidedAction | null; onSelect: (cartId: string) => void }) {
  return (
    <Card className={cn("kit-card gap-0 overflow-hidden py-0 shadow-none", selected && "kit-card-selected")}>
      {guidedAction === "selecting" || guidedAction === "select_cart" || guidedAction === "selected" ? (
        <span className={cn("guided-agent-cursor", guidedAction === "select_cart" && "guided-agent-cursor-clicking", guidedAction === "selected" && "guided-agent-cursor-selected")} aria-hidden="true">
          <MousePointer2 />
        </span>
      ) : null}
      <CardHeader className="gap-4 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={index === 0 ? "default" : "outline"}>{index === 0 ? "Best match" : cart.badge.toLowerCase()}</Badge>
              <Badge variant="secondary">{platformLabel(cart)}</Badge>
            </div>
            <CardTitle><h3 className="mt-4 text-xl">{cart.merchantName}</h3></CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5"><MapPin className="size-3.5" />{cart.locationName} · ready in about {cart.pickupMinutes} min</CardDescription>
          </div>
          <div className="text-right">
            <span className="block text-xs text-muted-foreground">Exact total</span>
            <strong className="mt-1 block text-2xl tracking-tight">{formatMoney(cart.totalCents)}</strong>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-5 gap-2" aria-label={`${cart.merchantName} kit products`}>
          {cart.lines.map((line) => (
            <div key={line.offerId} className="kit-line-image" title={`${line.quantity} × ${line.name}`}>
              <img src={PRODUCT_ART[line.category] || stormweaveImage} width="720" height="720" alt="" loading="lazy" />
              <span>{line.quantity}×</span>
            </div>
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border/70 py-4 text-sm sm:grid-cols-4">
          <Metric label="Complete kit" value={`${cart.metrics.unitCount} units`} />
          <Metric label="Categories" value={`${cart.metrics.categoryCount} covered`} />
          <Metric label="Packed" value={cart.metrics.packedLiters === undefined ? "Verified" : `${cart.metrics.packedLiters} L`} />
          <Metric label="Rainfly" value={cart.metrics.tentWaterproofMm === undefined ? "Verified" : `${cart.metrics.tentWaterproofMm.toLocaleString("en-SG")} mm`} />
        </dl>
        <ul className="mt-4 flex flex-col gap-2 text-xs leading-5 text-muted-foreground">
          {cart.checks.slice(0, 2).map((check) => <li key={check} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-success" />{check}</li>)}
        </ul>
      </CardContent>
      <CardFooter className="justify-between gap-3 border-t border-border/70 bg-storefront-mist/45 px-5 py-4">
        <span className="text-xs text-muted-foreground">Verified {formatTime(cart.lastVerifiedAt || cart.inventoryCheckedAt)}</span>
        <Button variant={selected ? "secondary" : "default"} disabled={busy} onClick={() => onSelect(cart.id)}>
          {selected ? <><Check data-icon="inline-start" />In cart</> : <>Add kit to cart<ArrowRight data-icon="inline-end" /></>}
        </Button>
      </CardFooter>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>
}

interface HumanHandoffProps {
  view: MissionView | null
  cart: RankedCart | null
  guidedDemo: boolean
  busy: string | null
  error: string | null
  checkoutUrl: string | null
  identityUrl: string | null
  nonce: string | null
  onBeginIdentity: () => void
  onCheckIdentity: () => void
  onReview: () => void
  onConfirm: () => void
}

function HumanHandoff({ view, cart, guidedDemo, busy, error, checkoutUrl, identityUrl, nonce, onBeginIdentity, onCheckIdentity, onReview, onConfirm }: HumanHandoffProps) {
  const external = view?.externalCheckout?.status === "pending" && view.externalCheckout.cartId === cart?.id ? view.externalCheckout : null
  const preview = view?.preview?.status === "pending" && view.preview.cart.id === cart?.id ? view.preview : null
  const identityVerified = view?.identity.status === "verified"
  const liveMode = view?.mission.sourceMode === "live"
  return (
    <section id="handoff" className="scroll-mt-24 border-y border-border/70 bg-route px-5 py-14 text-route-foreground sm:px-8 sm:py-18 lg:px-12">
      <div className={cn("mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:items-center", !guidedDemo && "lg:pr-[31rem]")}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-route-foreground/55">Human-only decision</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">The agent can prepare the cart.<br />Only you can continue.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-route-foreground/65">Identity, exact terms, private merchant handoff, and simulated purchase confirmation never appear in the seven site tools.</p>
        </div>
        <div className="handoff-panel text-foreground">
          {!view ? (
            <HandoffEmpty icon={<ShoppingBag className="size-5" />} title="Build a kit first" body="The human handoff stays closed until Woven has verified a complete cart." />
          ) : !cart ? (
            <HandoffEmpty icon={<PackageCheck className="size-5" />} title="Choose one complete kit" body="Selection is reversible and still does not authorize checkout." />
          ) : view.order ? (
            <div>
              <Badge variant="visa">Simulated result</Badge>
              <h3 className="mt-4 text-xl font-semibold">Pickup receipt created</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Receipt {view.order.receipt?.receiptNumber} is signed and server-verifiable. No live charge occurred.</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-success"><ShieldCheck className="size-4" />Receipt signature valid</div>
            </div>
          ) : external ? (
            <div>
              <Badge variant="success">Exact terms revalidated</Badge>
              <h3 className="mt-4 text-xl font-semibold">Continue at {external.platform === "shopify" ? "Shopify" : "WooCommerce"}</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <HandoffTerm label="Merchant" value={external.merchantName} />
                <HandoffTerm label="Exact total" value={formatMoney(external.amountCents)} />
                <HandoffTerm label="Handoff expires" value={formatTime(external.expiresAt)} />
              </dl>
              <Button className="mt-5 w-full" disabled={Boolean(busy) || !checkoutUrl} onClick={() => checkoutUrl && window.open(checkoutUrl, "_blank", "noopener,noreferrer")}>
                Continue at {external.platform === "shopify" ? "Shopify" : "WooCommerce"}<ArrowUpRight data-icon="inline-end" />
              </Button>
              {!checkoutUrl ? <Button variant="ghost" className="mt-2 w-full" onClick={onReview}>Recreate private handoff</Button> : null}
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Payment occurs on the merchant site. Woven has not placed an order.</p>
            </div>
          ) : preview ? (
            <div>
              <Badge variant="visa">Simulated checkout</Badge>
              <h3 className="mt-4 text-xl font-semibold">Review the exact terms</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <HandoffTerm label="Merchant" value={preview.mandate.merchantName} />
                <HandoffTerm label="Pickup" value={preview.mandate.pickupLocation} />
                <HandoffTerm label="Authorized total" value={formatMoney(preview.mandate.amountCents)} />
                <HandoffTerm label="Expires" value={formatTime(preview.expiresAt)} />
              </dl>
              <Button className="mt-5 w-full" disabled={Boolean(busy) || !nonce} onClick={onConfirm}>
                {busy === "confirm" ? <Spinner data-icon="inline-start" /> : <Fingerprint data-icon="inline-start" />}
                Confirm {formatMoney(preview.mandate.amountCents)}
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Clearly simulated. No card credentials are collected and no live charge occurs.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant={identityVerified ? "success" : "outline"}>{identityVerified ? "Demo identity verified" : "Demo identity required"}</Badge>
                  <h3 className="mt-4 text-xl font-semibold">{cart.merchantName} · {formatMoney(cart.totalCents)}</h3>
                </div>
                <Fingerprint className="size-7 text-handoff" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {identityVerified
                  ? `${view.identity.displayLabel || "Demo user"} is connected for this mission. Exact checkout review remains a separate action.`
                  : "The simulated provider handoff creates a short-lived server session without asking for Visa, card, or payment credentials."}
              </p>
              {view.identity.status === "pending" ? (
                <Button className="mt-5 w-full" disabled={Boolean(busy)} onClick={onCheckIdentity}>
                  {busy ? <Spinner data-icon="inline-start" /> : <RefreshCcw data-icon="inline-start" />}I verified · check status
                </Button>
              ) : identityVerified ? (
                <Button className="mt-5 w-full" disabled={Boolean(busy)} onClick={onReview}>
                  {busy === "preview" ? <Spinner data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
                  {liveMode ? `Review & continue at ${platformLabel(cart)}` : "Review exact terms"}
                </Button>
              ) : (
                <Button className="mt-5 w-full" disabled={Boolean(busy)} onClick={onBeginIdentity}>
                  {busy === "identity" ? <Spinner data-icon="inline-start" /> : <Fingerprint data-icon="inline-start" />}Verify demo identity
                </Button>
              )}
              {identityUrl && !identityVerified ? <Button asChild variant="ghost" className="mt-2 w-full"><a href={identityUrl} target="_blank" rel="noreferrer">Open verification page<ArrowUpRight data-icon="inline-end" /></a></Button> : null}
            </div>
          )}
          {error ? <p className="mt-4 text-sm leading-6 text-destructive" role="alert">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}

function HandoffEmpty({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-muted-foreground">{icon}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div></div>
}

function HandoffTerm({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-5 border-b border-border/70 pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>
}

function FieldGuide() {
  return (
    <section id="field-guide" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1440px] lg:pr-[31rem]">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Field guide</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">What happens behind one request</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          <GuideStep icon={<CloudSun className="size-5" />} title="Agent prepares" body="Seven reversible site tools start, inspect, compare, select, refresh, swap, and verify." />
          <GuideStep icon={<ShieldCheck className="size-5" />} title="Server verifies" body="Connected facts must satisfy quantity, compatibility, weather, stock, pickup, packed volume, and budget." />
          <GuideStep icon={<Fingerprint className="size-5" />} title="You decide" body="Identity and exact checkout remain private, expiring, and available only through direct human actions." />
        </div>
      </div>
    </section>
  )
}

function GuideStep({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <article className="bg-background p-6"><span className="text-muted-foreground">{icon}</span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>
}

function StorefrontFooter() {
  return (
    <footer className="border-t border-border/70 px-5 py-8 text-sm text-muted-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2"><WovenMark className="size-5" />Woven Trail Market · Fictional showcase storefront</span>
        <span>Connected stores where configured · Demo identity and payment are simulated</span>
      </div>
    </footer>
  )
}

createRoot(document.getElementById("root")!).render(<StorefrontApp />)
