import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  BedSingle,
  BriefcaseMedical,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Fingerprint,
  GitCompareArrows,
  Globe2,
  Loader2,
  MapPin,
  Navigation,
  PackageSearch,
  CloudRain,
  Lamp,
  Layers3,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Store,
  TentTree,
  Terminal,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CartAlternative, Category, MissionView, RankedCart } from "../src/domain";
import { initialToolResult } from "../src/widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WovenMark } from "./woven-mark";
import {
  WEBMCP_COMPARE_EVENT,
  WEBMCP_TOOL_NAMES,
  registerWebMcpTools,
  type WebMcpAdapter,
  type WebMcpContext,
} from "./webmcp";
import "./styles.css";

interface Payload {
  view?: MissionView;
  verification?: unknown;
  error?: { code: string; message: string; retryable: boolean };
  _meta?: Record<string, unknown>;
}

class WovenError extends Error {
  constructor(public readonly code: string, message: string, public readonly retryable: boolean) {
    super(message);
  }
}

type RankingPriority = "balanced" | "value" | "speed" | "weather";
type PickupArea = "Any" | RankedCart["area"];

type Invoke = (name: string, arguments_: Record<string, unknown>) => Promise<Payload>;

const canonicalRequest =
  "I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it under S$300, fit it in one car boot, and make it pickup-ready today.";
const liveCanonicalRequest =
  "I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it under S$900, fit it in one car boot, and make it pickup-ready today. Compare Shopify and WooCommerce.";

function HostedWidget() {
  const initialResult = initialToolResult((window as Window & { openai?: unknown }).openai);
  const initialPayload = (initialResult?.structuredContent || {}) as Payload;
  const [view, setView] = useState<MissionView | null>(initialPayload.view || null);
  const [nonce, setNonce] = useState<string | null>(
    typeof initialResult?._meta?.confirmationNonce === "string"
      ? initialResult._meta.confirmationNonce
      : null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(initialPayload.error?.message || null);

  const receive = (result: { structuredContent?: unknown; _meta?: Record<string, unknown>; isError?: boolean }) => {
    const payload = (result.structuredContent || {}) as Payload;
    if (payload.view) setView(payload.view);
    if (typeof result._meta?.confirmationNonce === "string") setNonce(result._meta.confirmationNonce);
    if (payload.error) throw new WovenError(payload.error.code, payload.error.message, payload.error.retryable);
    return { ...payload, _meta: result._meta };
  };

  const { app, error } = useApp({
    appInfo: { name: "Woven", version: "0.3.0" },
    capabilities: {},
    onAppCreated: (created: McpApp) => {
      created.ontoolresult = (result) => {
        try {
          receive(result);
        } catch (caught) {
          setConnectionError(caught instanceof Error ? caught.message : "Could not read Woven data.");
        }
      };
    },
  });

  const invoke: Invoke = async (name, arguments_) => {
    if (!app) throw new Error("Woven is still connecting.");
    return receive(await app.callServerTool({ name, arguments: arguments_ }));
  };

  if (error || connectionError) return <ConnectionError message={connectionError || error!.message} />;
  if (!app || !view) return <Loading message={!app ? "Connecting secure cart…" : "Building compatible kits…"} />;
  return (
    <Woven
      view={view}
      setView={setView}
      nonce={nonce}
      invoke={invoke}
      openUrl={(url) => app.openLink({ url }).then(() => undefined)}
    />
  );
}

type ChatPhase = "typing" | "sent" | "ready" | "failed";
interface ToolCall {
  id: number;
  name: string;
  status: "running" | "done" | "error";
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const activityStages = [
  "Reading your request…",
  "Checking the rainy-weekend brief…",
  "Calling start_mission…",
  "Checking live stock across merchants…",
  "Weaving complete camping kits…",
];

const narrationText =
  "Five complete camping kits fit your request — one pickup location each, rain-ready for 2 campers, compact enough for one car boot, and under budget. Compare the choices below; nothing is charged without your explicit confirmation.";

const identityReplyText =
  "Demo identity verified — Chai is connected for this mission. Woven is ready to recheck price and stock; checkout still waits for your review and explicit confirmation.";

const thanksMessage = "Perfect — that’s exactly what I needed. Thanks!";

function StandaloneDemo() {
  const webmcpMode = useMemo(() => window.location.pathname === "/webmcp", []);
  const instant = useMemo(() => webmcpMode || new URLSearchParams(window.location.search).has("instant"), [webmcpMode]);
  const loop = useMemo(() => new URLSearchParams(window.location.search).get("loop") === "true", []);
  const [sourceMode, setSourceMode] = useState<"demo" | "live">(webmcpMode ? "live" : "demo");
  const [phase, setPhase] = useState<ChatPhase>("typing");
  const [typed, setTyped] = useState("");
  const [stage, setStage] = useState(-1);
  const [narration, setNarration] = useState("");
  const [showWidget, setShowWidget] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [farewell, setFarewell] = useState("");
  const [identityReply, setIdentityReply] = useState("");
  const [epilogueDone, setEpilogueDone] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [view, setView] = useState<MissionView | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const [webMcpStatus, setWebMcpStatus] = useState<"unavailable" | "registering" | "ready" | "error">("unavailable");
  const [webMcpError, setWebMcpError] = useState<string | null>(null);
  const callId = useRef(0);
  const skipTyping = useRef(false);
  const identityReplyStarted = useRef(false);
  const epilogueStarted = useRef(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MissionView | null>(null);
  viewRef.current = view;
  const activeRequest = sourceMode === "live" ? liveCanonicalRequest : canonicalRequest;

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      const thread = threadRef.current;
      thread?.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
    });
  };

  // Timers throttle in background tabs, so both writers pace by wall clock instead of one tick per character.
  const typeInComposer = async (text: string, isCancelled: () => boolean) => {
    skipTyping.current = false;
    const startedAt = performance.now();
    while (!isCancelled() && !skipTyping.current) {
      const visible = Math.floor((performance.now() - startedAt) / 13);
      setTyped(text.slice(0, Math.min(visible, text.length)));
      if (visible >= text.length) break;
      await sleep(16);
    }
    if (isCancelled()) return;
    setTyped(text);
    if (!skipTyping.current) await sleep(450);
    setTyped("");
  };

  const streamText = async (text: string, write: (value: string) => void, isCancelled: () => boolean) => {
    const startedAt = performance.now();
    while (!isCancelled()) {
      const visible = Math.floor((performance.now() - startedAt) / 8);
      write(text.slice(0, Math.min(visible, text.length)));
      if (visible >= text.length) break;
      await sleep(24);
    }
    if (!isCancelled()) write(text);
  };

  const track = async <T,>(name: string, work: () => Promise<T>): Promise<T> => {
    const id = ++callId.current;
    setCalls((current) => [...current, { id, name, status: "running" }]);
    try {
      const result = await work();
      setCalls((current) => current.map((call) => (call.id === id ? { ...call, status: "done" } : call)));
      return result;
    } catch (caught) {
      setCalls((current) => current.map((call) => (call.id === id ? { ...call, status: "error" } : call)));
      throw caught;
    }
  };

  const invoke: Invoke = async (name, arguments_) => {
    const payload = await track(name, () => post(`/api/tools/${name}`, arguments_));
    if (payload.view) setView(payload.view);
    if (typeof payload._meta?.confirmationNonce === "string") setNonce(payload._meta.confirmationNonce);
    return payload;
  };

  const siteToolAdapter: WebMcpAdapter = {
    getView: () => viewRef.current,
    startMission: async (input, signal) => {
      const selectedMode = webmcpMode ? input.sourceMode || sourceMode : "demo";
      const endpoint = webmcpMode ? "/api/missions/start" : "/api/demo/start";
      const payload = await track("start_mission", () => post(endpoint, { ...input, sourceMode: selectedMode }, signal));
      if (!payload.view) throw new Error("Woven did not return a mission.");
      setView(payload.view);
      setError(null);
      setPhase("ready");
      setNarration(narrationText);
      setShowWidget(true);
      scrollToEnd();
      return payload.view;
    },
    invoke: async (name, arguments_, signal) => {
      const payload = await track(name, () => post(`/api/tools/${name}`, arguments_, signal));
      if (!payload.view) throw new Error(`Woven did not return an updated mission after ${name}.`);
      setView(payload.view);
      scrollToEnd();
      return payload.view;
    },
    compare: (options) => window.dispatchEvent(new CustomEvent(WEBMCP_COMPARE_EVENT, { detail: options })),
    verifyReceipt: async (receiptNumber, signature, signal) => {
      const payload = await track("verify_receipt", () => post("/api/tools/verify_receipt", { receiptNumber, signature }, signal));
      return payload.verification;
    },
  };

  useEffect(() => {
    if (webmcpMode) document.title = "Woven WebMCP Workspace";
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (typeof context?.registerTool !== "function") return;
    const controller = new AbortController();
    setWebMcpStatus("registering");
    setWebMcpError(null);
    void registerWebMcpTools(context, siteToolAdapter, controller.signal)
      .then(() => setWebMcpStatus("ready"))
      .catch((caught) => {
        controller.abort();
        setWebMcpStatus("error");
        setWebMcpError(caught instanceof Error ? caught.message : "Site-tool registration failed.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    const finish = (outcome: { payload?: Payload; failure?: unknown }) => {
      const id = ++callId.current;
      setCalls((current) => [...current, { id, name: "start_mission", status: outcome.payload ? "done" : "error" }]);
      if (!outcome.payload) {
        setError(outcome.failure instanceof Error ? outcome.failure.message : "Demo failed to start.");
        setPhase("failed");
        return false;
      }
      setView(outcome.payload.view!);
      setPhase("ready");
      return true;
    };
    const startWork = () =>
      post(webmcpMode ? "/api/missions/start" : "/api/demo/start", { request: activeRequest, sourceMode })
        .then((payload) => ({ payload }))
        .catch((failure: unknown) => ({ failure }));

    const run = async () => {
      if (instant) {
        setPhase("sent");
        if (!finish(await startWork())) return;
        setNarration(sourceMode === "live"
          ? "Woven checked both dedicated storefronts and returned only complete, compatible live carts. Payment remains on the selected merchant site."
          : narrationText);
        setShowWidget(true);
        return;
      }
      await sleep(700);
      await typeInComposer(activeRequest, isCancelled);
      if (cancelled) return;
      setPhase("sent");
      await sleep(500);
      // Play the staged activity while the real tool call runs underneath.
      let work: Promise<{ payload?: Payload; failure?: unknown }> | null = null;
      for (let index = 0; index < activityStages.length; index++) {
        if (cancelled) return;
        setStage(index);
        if (index === 2) work = startWork();
        await sleep(950);
      }
      const outcome = await (work || startWork());
      if (cancelled) return;
      setStage(-1);
      if (!finish(outcome)) return;
      await sleep(300);
      await streamText(narrationText, setNarration, isCancelled);
      if (cancelled) return;
      await sleep(350);
      setShowWidget(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [instant]);

  const switchSourceMode = async (nextMode: "demo" | "live") => {
    if (!webmcpMode || nextMode === sourceMode) return;
    setSourceMode(nextMode);
    setPhase("sent");
    setShowWidget(false);
    setError(null);
    setNarration("");
    setCalls([]);
    try {
      const request = nextMode === "live" ? liveCanonicalRequest : canonicalRequest;
      const payload = await track("start_mission", () => post("/api/missions/start", { request, sourceMode: nextMode }));
      if (!payload.view) throw new Error("Woven did not return a mission.");
      setView(payload.view);
      setNarration(nextMode === "live"
        ? "Woven checked both dedicated storefronts and returned only complete, compatible live carts. Payment remains on the selected merchant site."
        : narrationText);
      setShowWidget(true);
      setPhase("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not switch commerce sources.");
      setPhase("failed");
    }
  };

  // Closing beat: once the simulated payment confirms, the user says thanks and the host signs off.
  const order = view?.order;
  useEffect(() => {
    if (order?.status !== "confirmed" || epilogueStarted.current) return;
    epilogueStarted.current = true;
    let cancelled = false;
    const isCancelled = () => cancelled;
    const reply =
      `You’re all set — receipt ${order.receiptNumber} is saved and the kit is being packed at ${order.pickupLocation}. ` +
      "That was the only charge, and it was simulated. Have a great first camp 🏕️";
    const run = async () => {
      if (instant) {
        setThanks(true);
        setFarewell(reply);
        setEpilogueDone(true);
        return;
      }
      await sleep(1500);
      await typeInComposer(thanksMessage, isCancelled);
      if (cancelled) return;
      setThanks(true);
      scrollToEnd();
      await sleep(650);
      await streamText(reply, setFarewell, isCancelled);
      if (cancelled) return;
      setEpilogueDone(true);
      scrollToEnd();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [order?.status, instant]);

  useEffect(() => {
    if (view?.identity.status !== "verified" || identityReplyStarted.current) return;
    identityReplyStarted.current = true;
    let cancelled = false;
    const run = async () => {
      await sleep(650);
      await streamText(identityReplyText, setIdentityReply, () => cancelled);
      if (!cancelled) scrollToEnd();
    };
    void run();
    return () => { cancelled = true; };
  }, [view?.identity.status]);

  useEffect(() => {
    if (!loop || !showWidget) return;
    const fade = window.setTimeout(() => setResetting(true), 32_000);
    const replay = window.setTimeout(() => window.location.reload(), 32_700);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(replay);
    };
  }, [loop, showWidget]);

  const startCall = calls[0];
  const laterCalls = calls.slice(1).slice(-8);

  return (
    <div className={cn("flex h-dvh flex-col bg-background transition-opacity duration-700 motion-reduce:transition-none", resetting && "opacity-0")}>
      <header className="flex h-12 flex-none items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">{webmcpMode ? "Woven WebMCP Workspace" : "Woven Demo Host"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.1em]">
            {webmcpMode && sourceMode === "live" ? "Live stores" : "Simulated"}
          </Badge>
          {webmcpMode && (
            <Badge variant="outline" className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] sm:inline-flex">
              <Globe2 className="size-3" />
              {webMcpStatus === "ready" ? `${WEBMCP_TOOL_NAMES.length} site tools` : webMcpStatus}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {webmcpMode && (
            <div className="mr-1 flex rounded-lg border bg-muted p-0.5" aria-label="Commerce source">
              {(["live", "demo"] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize", sourceMode === mode && "bg-background shadow-xs")}
                  aria-pressed={sourceMode === mode}
                  onClick={() => void switchSourceMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <a href="/install" target="_blank" rel="noreferrer">
              How to install <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <a href="/merchant" target="_blank" rel="noreferrer">
              Merchant desk <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon-sm" title="Replay demo" onClick={() => window.location.reload()}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </header>

      <div ref={threadRef} data-thread className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-8">
          {phase === "typing" ? (
            <div className="flex h-full min-h-[40vh] items-center justify-center">
              <h1 className="text-2xl font-semibold tracking-tight text-center">What do you need?</h1>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-6">
                  {activeRequest}
                </div>
              </div>

              {stage >= 0 && (
                <div className="mt-6 flex items-center gap-2.5 text-[15px]">
                  <Loader2 className="size-3.5 flex-none animate-spin text-muted-foreground" />
                  <span className="shimmer-text">{activityStages[Math.min(stage, activityStages.length - 1)]}</span>
                </div>
              )}

              {stage < 0 && startCall && (
                <div className="rise-in mt-6">
                  <ToolChip call={startCall} />
                </div>
              )}

              {phase === "failed" && (
                <div className="mt-4 text-[15px] leading-7">
                  <p>I couldn’t reach the Woven backend: {error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                    <RotateCcw className="size-3.5" /> Retry
                  </Button>
                </div>
              )}

              {phase === "ready" && view && (
                <>
                  {webmcpMode && (
                    <div
                      data-webmcp-status={webMcpStatus}
                      className="mb-5 flex items-start gap-3 rounded-xl border bg-background p-4 text-sm"
                    >
                      <Globe2 className="mt-0.5 size-4 flex-none" />
                      <div>
                        <strong>
                          {webMcpStatus === "ready"
                            ? `${WEBMCP_TOOL_NAMES.length} WebMCP site tools are ready`
                            : webMcpStatus === "registering"
                              ? "Registering WebMCP site tools…"
                              : webMcpStatus === "error"
                                ? "WebMCP registration failed"
                                : "Open this page in ChatGPT or WebMCP-enabled Chrome"}
                        </strong>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {webMcpError || "The agent can build, compare, select, swap, refresh, and verify on this shared page. Identity and exact purchase confirmation stay human-only."}
                        </p>
                      </div>
                    </div>
                  )}
                  {narration && <p className="mt-4 text-[15px] leading-7">{narration}</p>}
                  {showWidget && (
                    <div className="rise-in mt-6">
                      <Woven
                        view={view}
                        setView={setView}
                        nonce={nonce}
                        invoke={invoke}
                        autoplay={loop}
                        openUrl={(url) => {
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                      />
                    </div>
                  )}
                  {laterCalls.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="microlabel text-muted-foreground">{webmcpMode ? "Shared WebMCP activity" : "Live MCP calls"}</span>
                      {laterCalls.map((call) => <ToolChip key={call.id} call={call} />)}
                    </div>
                  )}
                  {identityReply && <p className="rise-in mt-5 text-[15px] leading-7">{identityReply}</p>}
                  {thanks && (
                    <div className="rise-in mt-8 flex justify-end">
                      <div className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-6">
                        {thanksMessage}
                      </div>
                    </div>
                  )}
                  {farewell && <p className="mt-5 text-[15px] leading-7">{farewell}</p>}
                  {epilogueDone && (
                    <div className="rise-in mt-6">
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RotateCcw className="size-3.5" /> Replay the demo
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-none px-4 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3 rounded-[28px] border bg-background px-5 py-3 shadow-sm">
            <div className="min-h-6 flex-1 text-[15px]">
              {typed ? (
                <span>
                  {typed}
                  <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground" />
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {phase === "typing"
                    ? "Message the demo host…"
                    : epilogueDone
                      ? "All wrapped up — replay from the header anytime."
                      : webmcpMode
                        ? "Ask ChatGPT or Codex to use Woven's site tools…"
                        : "Your request is running above…"}
                </span>
              )}
            </div>
            <button
              className={cn(
                "grid size-8 flex-none cursor-pointer place-items-center rounded-full transition-colors",
                typed ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
              )}
              title="Send"
              onClick={() => {
                skipTyping.current = true;
              }}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {webmcpMode
              ? sourceMode === "live"
                ? "WebMCP and the human share this page — live catalog facts, human-only identity and checkout, payment on the merchant site."
                : "WebMCP demo sources are simulated — same server rules, human-only confirmation, no live charge."
              : "Simulated rehearsal of the ChatGPT/Codex MCP experience — same server, real tool calls, no live charge."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ToolChip({ call }: { call: ToolCall }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 py-1.5 pl-2.5 pr-3">
      <Terminal className="size-3 text-muted-foreground" />
      <code className="font-mono text-[11px]">{call.name}</code>
      {call.status === "running" && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
      {call.status === "done" && <Check className="size-3 text-emerald-600" />}
      {call.status === "error" && <TriangleAlert className="size-3 text-destructive" />}
    </div>
  );
}

async function post(url: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<Payload> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const payload = await response.json() as Payload;
  if (!response.ok || payload.error) {
    throw new WovenError(payload.error?.code || "REQUEST_FAILED", payload.error?.message || "Request failed.", Boolean(payload.error?.retryable));
  }
  return payload;
}

interface WovenProps {
  view: MissionView;
  setView: (view: MissionView) => void;
  nonce: string | null;
  invoke: Invoke;
  openUrl: (url: string) => void | Promise<void>;
  autoplay?: boolean;
}

function Woven(props: WovenProps) {
  return props.view.mission.engine === "open-world"
    ? <OpenWorldWoven {...props} />
    : <CampingWoven {...props} />;
}

function OpenWorldWoven({ view, setView, nonce, invoke, openUrl }: WovenProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const liveMode = view.mission.sourceMode === "live";
  const activeCart = view.carts.find((cart) => cart.id === view.selectedCartId) || view.carts[0] || null;
  const preview = view.preview?.status === "pending" && view.preview.mandate.cartId === activeCart?.id ? view.preview : undefined;
  const externalPreview = view.externalCheckout?.status === "pending" && view.externalCheckout.cartId === activeCart?.id
    ? view.externalCheckout
    : undefined;
  const sources = new Map((view.sources || []).map((source) => [source.id, source]));

  const act = async (label: string, name: string, arguments_: Record<string, unknown>) => {
    setBusy(label);
    setError(null);
    try {
      const payload = await invoke(name, arguments_);
      if (payload.view) setView(payload.view);
      return payload;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const beginIdentity = async () => {
    const payload = await act("identity", "start_demo_identity", { missionId: view.mission.id });
    const authorizationUrl = payload?._meta?.authorizationUrl;
    if (typeof authorizationUrl === "string") await openUrl(authorizationUrl);
    else if (payload) setError("The demo identity link is missing. Try again.");
  };
  const checkIdentity = async () => {
    const payload = await act("refresh", "build_carts", { missionId: view.mission.id });
    if (payload?.view?.identity.status !== "verified") await beginIdentity();
  };
  const review = async () => {
    if (!activeCart) return;
    if (view.identity.status !== "verified") {
      void beginIdentity();
      return;
    }
    const payload = await act("preview", "create_checkout_preview", { missionId: view.mission.id, cartId: activeCart.id });
    if (liveMode && payload) {
      const privateUrl = payload._meta?.checkoutUrl;
      if (typeof privateUrl === "string") setCheckoutUrl(privateUrl);
      else setError("The merchant checkout link is missing. Revalidate the cart again.");
    }
  };
  const confirm = () => {
    if (!preview || !nonce) {
      setError("Create a fresh checkout preview before confirming.");
      return;
    }
    void act("confirm", "confirm_purchase", {
      previewId: preview.id,
      mandateHash: preview.mandateHash,
      confirmationNonce: nonce,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-2xl border bg-background shadow-sm">
      <header className="bg-zinc-950 px-6 py-8 text-white sm:px-10">
        <div className="flex flex-wrap items-center gap-2.5"><WovenMark className="size-5" /><strong>Woven</strong><Badge variant="outline" className="border-white/25 font-mono text-[9px] uppercase text-white/70">{liveMode ? "Live commerce" : "Open-world POC"}</Badge>{liveMode && <Badge variant="outline" className="border-emerald-400/40 font-mono text-[9px] uppercase text-emerald-200">Merchant checkout</Badge>}</div>
        <h1 className="mt-8 max-w-2xl text-3xl font-semibold tracking-tight">{view.mission.openWorld?.spec.goal || "Complete cart research"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">“{view.mission.request}”</p>
        <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          <Constraint label="Budget" value={formatMoney(view.mission.budgetCents)} />
          <Constraint label="Market" value="Singapore" />
          <Constraint label="Pickup" value={view.mission.pickupDate} />
          <Constraint label="Source" value={liveMode ? "Live stores" : `${view.agentEvents?.filter((event) => event.node === "verify").length || 1} pass${view.agentEvents?.filter((event) => event.node === "verify").length === 1 ? "" : "es"}`} />
        </div>
      </header>

      {liveMode && (
        <section className="border-b bg-muted/30 px-6 py-5 sm:px-10" aria-labelledby="source-status-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="microlabel text-muted-foreground">Live source health</span>
              <h2 id="source-status-heading" className="mt-1 text-base font-semibold">Platform verification status</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(view.connectorStatuses || []).map((status) => (
                <Badge key={status.platform} variant={status.status === "healthy" ? "secondary" : "outline"} className="gap-1.5 font-mono text-[9px] uppercase">
                  <span className={cn("size-1.5 rounded-full", status.status === "healthy" ? "bg-emerald-600" : status.status === "failed" ? "bg-amber-600" : "bg-zinc-400")} />
                  {status.platform} · {status.status}
                </Badge>
              ))}
            </div>
          </div>
          {(view.connectorStatuses || []).some((status) => status.status !== "healthy") && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {(view.connectorStatuses || []).filter((status) => status.status !== "healthy").map((status) => <li key={status.platform}>{status.platform}: {status.message}</li>)}
            </ul>
          )}
        </section>
      )}

      <section className="px-6 py-8 sm:px-10" aria-labelledby="requirements-heading">
        <Kicker number="01" label="Structured mission" />
        <h2 id="requirements-heading" className="mt-3 text-xl font-semibold">Requirements and evidence</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(view.requirements || []).map((requirement) => {
            const evidence = activeCart?.evidence?.find((check) => check.id === `requirement:${requirement.id}`)
              || view.evidenceChecks?.find((check) => check.id === `requirement:${requirement.id}`);
            return <article key={requirement.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><strong className="text-sm">{requirement.quantity > 1 ? `${requirement.quantity} × ` : ""}{requirement.label}</strong><Badge variant={evidence?.status === "verified" ? "secondary" : "outline"} className="font-mono text-[9px] uppercase">{evidence?.status || "missing"}</Badge></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{evidence?.detail || requirement.searchQuery}</p></article>;
          })}
        </div>
      </section>

      {view.carts.length > 0 && (
        <section className="border-t px-6 py-8 sm:px-10" aria-labelledby="connected-heading">
          <Kicker number="02" label="Connected catalog" />
          <h2 id="connected-heading" className="mt-3 text-xl font-semibold">Verified one-location carts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Only current connected-catalog facts can unlock checkout. Live carts never mix platforms.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.carts.map((cart) => <article key={cart.id} className={cn("rounded-xl border p-5", activeCart?.id === cart.id && "border-zinc-950 ring-1 ring-zinc-950")}><div className="flex items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5"><Badge className="font-mono text-[9px] uppercase">{cart.badge}</Badge>{liveMode && <Badge variant="outline" className="font-mono text-[9px] uppercase">{cart.platform}</Badge>}</div><span className="text-xs text-emerald-700"><Check className="mr-1 inline size-3" />Verified</span></div><h3 className="mt-4 font-semibold">{cart.merchantName}</h3><p className="text-xs text-muted-foreground">{cart.locationName} · ready ~{cart.pickupMinutes} min</p>{liveMode && <p className="mt-1 text-[11px] text-muted-foreground">Verified {formatTime(cart.lastVerifiedAt || cart.inventoryCheckedAt)}</p>}<div className="mt-4 divide-y rounded-lg border">{cart.lines.map((line) => <div key={line.offerId} className="flex items-start justify-between gap-3 px-3 py-2.5 text-xs"><span>{line.quantity > 1 ? `${line.quantity} × ` : ""}{line.name}</span><strong>{formatMoney(line.priceCents * line.quantity)}</strong></div>)}</div><div className="mt-4 flex items-end justify-between"><span className="text-xs text-muted-foreground">Exact total</span><strong className="text-xl">{formatMoney(cart.totalCents)}</strong></div>{liveMode && cart.sourceUrl && <Button asChild variant="ghost" size="sm" className="mt-2 w-full"><a href={cart.sourceUrl} rel="noreferrer" onClick={(event) => { event.preventDefault(); void openUrl(cart.sourceUrl!); }}>View merchant catalog <ArrowUpRight className="size-3.5" /></a></Button>}<Button className="mt-2 w-full" variant={activeCart?.id === cart.id ? "secondary" : "default"} disabled={busy !== null} onClick={() => { setCheckoutUrl(null); void act("select", "select_cart", { missionId: view.mission.id, cartId: cart.id }); }}>{activeCart?.id === cart.id ? "Selected" : "Select cart"}</Button></article>)}
          </div>
        </section>
      )}

      {(view.researchLeads?.length || 0) > 0 && (
        <section className="border-t bg-muted/30 px-6 py-8 sm:px-10" aria-labelledby="research-heading">
          <Kicker number={view.carts.length ? "03" : "02"} label="Web research only" />
          <h2 id="research-heading" className="mt-3 text-xl font-semibold">Cited leads—not checkout carts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Price, stock, and compatibility are not verified. These results cannot be selected or purchased.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">{view.researchLeads!.map((lead) => <article key={lead.id} className="rounded-xl border bg-background p-5"><Badge variant="outline" className="font-mono text-[9px] uppercase">Research only</Badge><h3 className="mt-3 font-semibold">{lead.title}</h3><p className="mt-1 text-xs text-muted-foreground">{lead.merchantName}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lead.summary}</p>{lead.estimatedTotalCents !== undefined && <p className="mt-3 text-xs"><strong>Unverified estimate:</strong> {formatMoney(lead.estimatedTotalCents)}</p>}<div className="mt-4 flex flex-wrap gap-2">{lead.sourceIds.flatMap((id) => { const source = sources.get(id); return source?.url ? [<Button key={id} asChild variant="outline" size="sm"><a href={source.url} rel="noreferrer" onClick={(event) => { event.preventDefault(); void openUrl(source.url!); }}>{source.title}<ArrowUpRight className="size-3" /></a></Button>] : []; })}</div></article>)}</div>
        </section>
      )}

      {activeCart?.checkoutEligible === true && !view.order && (
        <section className="border-t px-6 py-8 sm:px-10">
          <Kicker number={view.researchLeads?.length ? "04" : "03"} label="Existing checkout boundary" />
          <div className="mt-5 grid gap-5 rounded-xl border p-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-lg font-semibold">{preview || externalPreview ? "Review exact terms" : view.identity.status === "verified" ? "Ready for exact review" : "Verify demo identity first"}</h2><p className="mt-1 text-sm text-muted-foreground">{liveMode ? "Every selected variant is revalidated before Woven creates a private handoff. Payment occurs on the merchant site." : "Price and stock are rebuilt from SQLite before preview and confirmation. Payment remains simulated."}</p>{preview && <dl className="mt-4"><MandateRow label="Merchant" value={preview.mandate.merchantName} /><MandateRow label="Pickup" value={preview.mandate.pickupLocation} /><MandateRow label="Authorized total" value={formatMoney(preview.mandate.amountCents)} /></dl>}{externalPreview && <dl className="mt-4"><MandateRow label="Merchant" value={externalPreview.merchantName} /><MandateRow label="Platform" value={externalPreview.platform === "shopify" ? "Shopify" : "WooCommerce"} /><MandateRow label="Exact total" value={formatMoney(externalPreview.amountCents)} /><MandateRow label="Handoff expires" value={formatTime(externalPreview.expiresAt)} /></dl>}</div>{externalPreview ? <div className="min-w-48"><Button className="w-full" disabled={busy !== null || !checkoutUrl} onClick={() => checkoutUrl && void openUrl(checkoutUrl)}>{checkoutUrl ? `Continue at ${externalPreview.platform === "shopify" ? "Shopify" : "WooCommerce"}` : "Recreate handoff"}<ArrowUpRight className="size-3.5" /></Button><p className="mt-2 max-w-52 text-center text-[11px] leading-relaxed text-muted-foreground">Payment occurs on the merchant site. Woven has not placed an order.</p>{!checkoutUrl && <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => void review()}>Revalidate again</Button>}</div> : preview ? <Button disabled={busy !== null || !nonce} onClick={confirm}>{busy === "confirm" ? "Authorizing…" : `Confirm ${formatMoney(preview.mandate.amountCents)}`}</Button> : view.identity.status === "pending" ? <Button disabled={busy !== null} onClick={() => void checkIdentity()}>{busy ? "Checking…" : "I verified · check status"}</Button> : <Button disabled={busy !== null} onClick={() => void review()}>{busy ? "Working…" : view.identity.status === "verified" ? liveMode ? `Review & continue at ${activeCart.platform === "shopify" ? "Shopify" : "WooCommerce"}` : "Review checkout" : "Verify demo identity"}</Button>}</div>
        </section>
      )}

      {view.order && <OrderResult view={view} />}
      {error && <div className="m-4 rounded-lg bg-destructive px-4 py-3 text-sm text-white" role="alert">{error}</div>}
      <footer className="microlabel flex flex-col gap-1 border-t bg-muted/40 px-6 py-4 text-muted-foreground sm:flex-row sm:justify-between sm:px-10"><span>Woven / {liveMode ? "Cross-platform live commerce" : "Open-world cart POC"}</span><span>{liveMode ? "Merchant-owned checkout · Woven never handles payment credentials" : "Web is research-only · checkout stays fail-closed"}</span></footer>
    </main>
  );
}

function CampingWoven({
  view,
  setView,
  nonce,
  invoke,
  openUrl,
  autoplay = false,
}: WovenProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const savedPreferences = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("woven-choice-preferences") || "null") as { priority: RankingPriority; area: PickupArea } | null; }
    catch { return null; }
  }, []);
  const [priority, setPriority] = useState<RankingPriority>(autoplay ? "balanced" : savedPreferences?.priority || "balanced");
  const [area, setArea] = useState<PickupArea>(autoplay ? "Any" : savedPreferences?.area || "Any");
  const [remember, setRemember] = useState(!autoplay && Boolean(savedPreferences));
  const [choiceTab, setChoiceTab] = useState<"choices" | "compare">("choices");
  const [recovery, setRecovery] = useState<string | null>(null);
  const choiceDialog = useRef<HTMLDialogElement>(null);
  const swapDialog = useRef<HTMLDialogElement>(null);
  const proofSection = useRef<HTMLElement>(null);
  const identitySection = useRef<HTMLElement>(null);
  const openedMission = useRef<string | null>(null);
  const autoplayStarted = useRef(false);
  const rankedCarts = useMemo(() => rankCarts(view.carts, priority, area), [view.carts, priority, area]);
  const activeCart = useMemo(
    () => view.carts.find((cart) => cart.id === view.selectedCartId) || view.carts[0] || null,
    [view],
  );
  const openChoiceCenter = () => {
    if (!choiceDialog.current?.open) choiceDialog.current?.showModal();
  };

  useEffect(() => {
    const handleCompare = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      if (["balanced", "value", "speed", "weather"].includes(String(detail.priority))) {
        setPriority(detail.priority as RankingPriority);
      }
      if (["Any", "Central", "East", "North"].includes(String(detail.area))) {
        setArea(detail.area as PickupArea);
      }
      setChoiceTab("compare");
      openChoiceCenter();
    };
    window.addEventListener(WEBMCP_COMPARE_EVENT, handleCompare);
    return () => window.removeEventListener(WEBMCP_COMPARE_EVENT, handleCompare);
  }, []);

  useEffect(() => {
    if (view.order || openedMission.current === view.mission.id) return;
    openedMission.current = view.mission.id;
    openChoiceCenter();
  }, [view.mission.id, view.order]);

  useEffect(() => {
    if (remember && !autoplay) localStorage.setItem("woven-choice-preferences", JSON.stringify({ priority, area }));
  }, [priority, area, remember, autoplay]);

  const act = async (label: string, name: string, arguments_: Record<string, unknown>) => {
    setBusy(label);
    setError(null);
    try {
      const payload = await invoke(name, arguments_);
      if (payload.view) setView(payload.view);
      return payload;
    } catch (caught) {
      if (caught instanceof WovenError && caught.retryable && (label === "preview" || label === "confirm")) {
        try {
          const refreshed = await invoke("build_carts", { missionId: view.mission.id });
          if (refreshed.view) setView(refreshed.view);
          setRecovery(`${caught.message} Woven refreshed current price and stock.`);
          openChoiceCenter();
        } catch {
          setError(caught.message);
        }
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      }
      return null;
    } finally {
      setBusy(null);
    }
  };

  const preview = view.preview?.status === "pending" && view.preview.mandate.cartId === activeCart?.id
    ? view.preview
    : undefined;
  const confirm = () => {
    if (!preview || !nonce) {
      setError("The private confirmation token is missing. Create a fresh checkout preview.");
      return;
    }
    void act("confirm", "confirm_purchase", {
      previewId: preview.id,
      mandateHash: preview.mandateHash,
      confirmationNonce: nonce,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  const beginIdentity = async () => {
    setBusy("identity");
    setError(null);
    try {
      const payload = await invoke("start_demo_identity", { missionId: view.mission.id });
      if (payload.view) setView(payload.view);
      const authorizationUrl = payload._meta?.authorizationUrl;
      if (typeof authorizationUrl !== "string") throw new Error("The demo identity link is missing. Try again.");
      await openUrl(authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start demo identity verification.");
    } finally {
      setBusy(null);
    }
  };

  const completeAutoplayIdentity = async () => {
    setBusy("identity");
    setError(null);
    try {
      const started = await invoke("start_demo_identity", { missionId: view.mission.id });
      if (started.view) setView(started.view);
      const authorizationUrl = new URL(String(started._meta?.authorizationUrl || ""), window.location.origin);
      const requestId = authorizationUrl.searchParams.get("request_id");
      const state = authorizationUrl.searchParams.get("state");
      if (authorizationUrl.pathname !== "/identity" || !requestId || !state) {
        throw new Error("The demo identity request is invalid.");
      }
      const response = await fetch("/api/demo-identity/authorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId, state }),
      });
      const authorized = await response.json() as { redirectUrl?: string; error?: { message?: string } };
      if (!response.ok || !authorized.redirectUrl) {
        throw new Error(authorized.error?.message || "Demo identity verification failed.");
      }
      const callback = new URL(authorized.redirectUrl, window.location.origin);
      if (callback.pathname !== "/auth/demo/callback") throw new Error("The demo identity callback is invalid.");
      const completed = await fetch(`${callback.pathname}${callback.search}`, { redirect: "follow" });
      if (!completed.ok || new URL(completed.url).searchParams.get("complete") !== "1") {
        throw new Error("Demo identity verification did not complete.");
      }
      const refreshed = await invoke("build_carts", { missionId: view.mission.id });
      if (refreshed.view) setView(refreshed.view);
      if (refreshed.view?.identity.status !== "verified") throw new Error("Demo identity verification did not complete.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the demo identity.");
    } finally {
      setBusy(null);
    }
  };

  const checkIdentity = async () => {
    const payload = await act("identity-check", "build_carts", { missionId: view.mission.id });
    if (payload && payload.view?.identity.status !== "verified") await beginIdentity();
  };

  const reviewCheckout = () => {
    if (!activeCart) return;
    if (view.identity.status !== "verified") {
      setCheckoutRequested(true);
      return;
    }
    void act("preview", "create_checkout_preview", { missionId: view.mission.id, cartId: activeCart.id });
  };

  const chooseCart = async (cartId: string) => {
    setCheckoutRequested(false);
    if (await act("select", "select_cart", { missionId: view.mission.id, cartId })) choiceDialog.current?.close();
  };

  const swapItem = async (offerId: string) => {
    if (!activeCart) return;
    if (await act("swap", "swap_cart_item", { missionId: view.mission.id, cartId: activeCart.id, offerId })) swapDialog.current?.close();
  };

  const rememberPreferences = (checked: boolean) => {
    setRemember(checked);
    if (!checked) localStorage.removeItem("woven-choice-preferences");
  };

  useEffect(() => {
    if (!autoplay || autoplayStarted.current) return;
    autoplayStarted.current = true;
    let cancelled = false;
    const focus = (element: HTMLElement | null) => element?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    const autoplaySteps: Array<[number, () => void]> = [
      [2_500, () => setChoiceTab("compare")],
      [3_000, () => setPriority("weather")],
      [3_000, () => setChoiceTab("choices")],
      [2_500, () => { choiceDialog.current?.close(); focus(proofSection.current); }],
      [3_500, () => swapDialog.current?.showModal()],
      [2_500, () => swapDialog.current?.close()],
      [500, () => setCheckoutRequested(true)],
      [500, () => focus(identitySection.current)],
      [1_500, () => void completeAutoplayIdentity()],
    ];
    void (async () => {
      for (const [delay, step] of autoplaySteps) {
        await sleep(delay);
        if (cancelled) return;
        step();
      }
    })();
    return () => { cancelled = true; };
  }, [autoplay, view.mission.id]);

  return (
    <main className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-2xl border bg-background shadow-sm">
      <ChoiceCenter
        dialogRef={choiceDialog}
        carts={rankedCarts}
        allCarts={view.carts}
        selectedCartId={activeCart?.id || null}
        priority={priority}
        area={area}
        remember={remember}
        tab={choiceTab}
        busy={busy}
        recovery={recovery}
        onPriority={setPriority}
        onArea={setArea}
        onRemember={rememberPreferences}
        onTab={setChoiceTab}
        onSelect={(cartId) => void chooseCart(cartId)}
      />
      <SwapDialog dialogRef={swapDialog} alternatives={activeCart?.alternatives || []} busy={busy} onSwap={(offerId) => void swapItem(offerId)} />
      <header className="relative overflow-hidden bg-zinc-950 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div
          className="absolute -top-32 right-[-10%] h-72 w-[480px] rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-white/15 bg-white/10">
              <WovenMark className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Woven</span>
            <Badge variant="outline" className="border-white/25 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70">
              Prototype
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] text-white/60" aria-label="Camping brief">
            <CloudRain className="size-3.5 text-white/80" />
            <span>RAINY WEEKEND · 2 CAMPERS · 1 CAR</span>
          </div>
        </div>

        <h1 className="relative mt-10 max-w-xl text-3xl font-semibold leading-[1.08] tracking-tight sm:text-[40px]">
          Everything you need.
          <br />
          Woven into one choice.
        </h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-white/60">“{view.mission.request}”</p>

        <div className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          <Constraint label="Budget" value={formatMoney(view.mission.budgetCents)} />
          <Constraint label="Pickup" value="Today" />
          <Constraint label="Campers" value={String(view.mission.campers)} />
          <Constraint label="Packed gear" value={`≤ ${view.mission.maxPackedLiters} L`} />
        </div>

        <button
          className="relative mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
          onClick={() => setAssumptionsOpen((open) => !open)}
          aria-expanded={assumptionsOpen}
        >
          Assumptions & boundaries
          <ChevronDown className={cn("size-3.5 transition-transform", assumptionsOpen && "rotate-180")} />
        </button>
        {assumptionsOpen && (
          <ul className="relative mt-3 list-disc space-y-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-xs leading-relaxed text-white/60">
            {view.mission.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        )}
      </header>

      <section className="px-6 py-8 sm:px-10" aria-labelledby="results-heading">
        <Kicker number="01" label={`${view.carts.length} complete options`} />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="results-heading" className="text-xl font-semibold tracking-tight">Five ways it comes together</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every option is one complete cart from one pickup location.</p>
          </div>
          <Button variant="outline" size="sm" onClick={openChoiceCenter}>
            <GitCompareArrows className="size-3.5" /> Compare all choices
          </Button>
        </div>

        {view.carts.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {rankedCarts.slice(0, 3).map((cart, index) => (
              <CartCard
                key={cart.id}
                cart={cart}
                index={index}
                active={cart.id === activeCart?.id}
                onSelect={() => {
                  void chooseCart(cart.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
            <TriangleAlert className="mx-auto size-6 text-amber-600" />
            <h3 className="mt-3 text-base font-semibold tracking-tight">No complete kit right now</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Relax one hard constraint or ask the merchant to restore inventory.
            </p>
          </div>
        )}
      </section>

      {activeCart && (
        <section ref={proofSection} className="border-t px-6 py-8 sm:px-10">
          <Kicker number="02" label="Every thread checked" />
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Nothing left to connect</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Woven checks the whole setup — not isolated products or sponsored links.
              </p>
              <div className="mt-5 divide-y rounded-xl border">
                {activeCart.lines.map((line) => (
                  <div className="flex items-start gap-3 p-4" key={line.offerId}>
                    <span className="grid size-9 flex-none place-items-center rounded-md border bg-muted/50">
                      {categoryIcon(line.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-sm font-medium">
                        {line.quantity > 1 ? `${line.quantity} × ` : ""}{line.name}
                      </strong>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{line.compatibility}</p>
                    </div>
                    <Check className="mt-1 size-4 flex-none text-emerald-600" />
                  </div>
                ))}
              </div>
              {activeCart.alternatives.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => swapDialog.current?.showModal()}>
                  Swap a merchant-approved item · {activeCart.alternatives.length}
                </Button>
              )}
            </div>
            <aside className="flex flex-col self-start rounded-xl bg-zinc-950 p-6 text-white">
              <span className="microlabel text-white/40">Selected pickup</span>
              <Store className="mt-4 size-5 text-white/80" />
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{activeCart.merchantName}</h3>
              <p className="text-sm text-white/60">{activeCart.locationName}</p>
              <span className="mt-3 flex items-center gap-2 text-xs text-white/50">
                <MapPin className="size-3.5 flex-none" />{activeCart.address}
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
                <Clock3 className="size-3.5 flex-none" />Ready in ~{activeCart.pickupMinutes} min
              </span>
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10">
                <PickupStat label="Ready about" value={formatReadyTime(activeCart)} />
                <PickupStat label="Leave by" value={formatLeaveTime(activeCart)} />
                <PickupStat label="Travel" value={`~${activeCart.transitMinutes} min`} />
                <PickupStat label="Closes" value={activeCart.closesAt} />
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-white/50">Total</span>
                <strong className="text-2xl font-semibold tracking-tight">{formatMoney(activeCart.totalCents)}</strong>
              </div>
              <Button
                variant="inverted"
                className="mt-4 w-full"
                disabled={busy !== null}
                onClick={reviewCheckout}
              >
                {busy === "preview" ? "Revalidating…" : "Review checkout"}
              </Button>
              <small className="mt-3 text-center text-[11px] leading-snug text-white/40">
                No purchase yet. Stock and price are rechecked first.
              </small>
            </aside>
          </div>
        </section>
      )}

      {activeCart && checkoutRequested && !preview && !view.order && (
        <section ref={identitySection} className="border-t px-6 py-8 sm:px-10" aria-labelledby="identity-heading">
          <Kicker number="03" label="Verify who is approving" />
          <div className="mt-5 grid overflow-hidden rounded-xl border border-blue-200 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <Badge variant="visa" className="font-mono text-[10px] uppercase tracking-[0.1em]">
                <Fingerprint className="size-3.5" /> Demo identity · Simulated
              </Badge>
              <h2 id="identity-heading" className="mt-4 text-xl font-semibold tracking-tight">
                {view.identity.status === "verified" ? "Identity verified" : "Connect your demo identity"}
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {view.identity.status === "verified"
                  ? `${view.identity.displayLabel} is connected for this mission. Authentication is complete; purchase confirmation is still separate.`
                  : "Woven opens a provider-style demo page, then enforces the short-lived result on the server before checkout."}
              </p>
              <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
                <strong className="block text-foreground">DEMO ONLY</strong>
                No Visa account, password, card number, or payment credential is requested or accessed.
              </div>
            </div>
            <div className="flex flex-col justify-center border-t bg-blue-50/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <ShieldCheck className="size-7 text-blue-700" />
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                {view.identity.status === "verified" ? view.identity.displayLabel : "One protected handoff"}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {view.identity.status === "pending"
                  ? "Complete the open demo page, return here, then check the server result."
                  : view.identity.status === "verified"
                    ? `Verified until ${formatTime(view.identity.expiresAt!)}.`
                    : "The request uses state, PKCE, an allowlisted callback, and a single-use authorization code."}
              </p>
              {view.identity.status === "verified" ? (
                <Button className="mt-4 w-full" disabled={busy !== null} onClick={reviewCheckout}>
                  {busy === "preview" ? "Revalidating…" : "Review exact terms"}
                </Button>
              ) : view.identity.status === "pending" ? (
                <Button
                  className="mt-4 w-full"
                  disabled={busy !== null}
                  onClick={() => void checkIdentity()}
                >
                  {busy ? "Verifying…" : "I’ve verified · check status"}
                </Button>
              ) : (
                <Button className="mt-4 w-full" disabled={busy !== null} onClick={() => void beginIdentity()}>
                  {busy === "identity" ? "Verifying…" : "Verify demo identity"}
                </Button>
              )}
              <small className="mt-3 text-center text-[11px] text-muted-foreground">
                Identity does not authorize the purchase
              </small>
            </div>
          </div>
        </section>
      )}

      {preview && !view.order && (
        <section className="border-t px-6 py-8 sm:px-10" aria-labelledby="checkout-heading">
          <Kicker number="04" label="The consent boundary" />
          <div className="mt-5 grid overflow-hidden rounded-xl border lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <Badge variant="visa" className="font-mono text-[10px] uppercase tracking-[0.1em]">
                <CreditCard className="size-3.5" /> Visa authorization · Simulated
              </Badge>
              <h2 id="checkout-heading" className="mt-4 text-xl font-semibold tracking-tight">
                Review the exact terms
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                This one click authorizes only this merchant, cart version, and total. It expires at {formatTime(preview.expiresAt)}.
              </p>
              <dl className="mt-5">
                <MandateRow label="Demo identity" value={`${view.identity.displayLabel || "Verified demo user"} · verified`} />
                <MandateRow label="Merchant" value={preview.mandate.merchantName} />
                <MandateRow label="Pickup" value={preview.mandate.pickupLocation} />
                <MandateRow
                  label="Items"
                  value={`${preview.mandate.lines.reduce((sum, line) => sum + line.quantity, 0)} units / ${preview.mandate.lines.length} products`}
                />
                <div className="flex items-end justify-between gap-6 pt-4">
                  <dt className="text-sm text-muted-foreground">Authorized total</dt>
                  <dd className="m-0 text-2xl font-semibold tracking-tight">{formatMoney(preview.mandate.amountCents)}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col justify-center border-t bg-muted/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <ShieldCheck className="size-7" />
              <h3 className="mt-3 text-base font-semibold tracking-tight">Your yes is the final thread.</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                No card credentials enter Woven. The demo returns a simulated network authorization.
              </p>
              <Button className="mt-4 w-full" disabled={busy !== null || !nonce} onClick={confirm}>
                {busy === "confirm" ? "Authorizing…" : `Confirm ${formatMoney(preview.mandate.amountCents)}`}
              </Button>
              <small className="mt-3 text-center text-[11px] text-muted-foreground">
                Explicit confirmation required · no background charge
              </small>
            </div>
          </div>
        </section>
      )}

      {view.order && <OrderResult view={view} />}
      {error && (
        <div
          className="sticky bottom-4 z-10 mx-auto mb-4 flex w-fit max-w-[calc(100%-3rem)] items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-xs font-medium text-white shadow-lg"
          role="alert"
        >
          <TriangleAlert className="size-4 flex-none" />{error}
        </div>
      )}

      <footer className="microlabel flex flex-col gap-1 border-t bg-muted/40 px-6 py-4 text-muted-foreground sm:flex-row sm:justify-between sm:px-10">
        <span>Woven / Agentic commerce prototype</span>
        <span>Simulated payments · seeded merchants · no live charge</span>
      </footer>
    </main>
  );
}

function ChoiceCenter({
  dialogRef,
  carts,
  allCarts,
  selectedCartId,
  priority,
  area,
  remember,
  tab,
  busy,
  recovery,
  onPriority,
  onArea,
  onRemember,
  onTab,
  onSelect,
}: {
  dialogRef: { current: HTMLDialogElement | null };
  carts: RankedCart[];
  allCarts: RankedCart[];
  selectedCartId: string | null;
  priority: RankingPriority;
  area: PickupArea;
  remember: boolean;
  tab: "choices" | "compare";
  busy: string | null;
  recovery: string | null;
  onPriority: (priority: RankingPriority) => void;
  onArea: (area: PickupArea) => void;
  onRemember: (remember: boolean) => void;
  onTab: (tab: "choices" | "compare") => void;
  onSelect: (cartId: string) => void;
}) {
  const priorities: Array<[RankingPriority, string]> = [
    ["balanced", "Balanced"],
    ["value", "Lowest total"],
    ["speed", "Soonest pickup"],
    ["weather", "Most rainproof"],
  ];
  return (
    <dialog ref={dialogRef} aria-labelledby="choice-center-title" className="choice-dialog m-auto max-h-[92dvh] w-[min(960px,calc(100%-1.5rem))] overflow-hidden rounded-2xl border bg-background p-0 text-foreground shadow-2xl">
      <div className="flex max-h-[92dvh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <span className="microlabel text-muted-foreground">Woven decision workspace</span>
            <h2 id="choice-center-title" className="mt-1 text-xl font-semibold tracking-tight">Choice Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">Compare five complete carts, tune priorities, then choose one.</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close Choice Center" onClick={() => dialogRef.current?.close()}><X className="size-4" /></Button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {recovery && (
            <div className="mb-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <PackageSearch className="mt-0.5 size-5 flex-none" />
              <div><strong className="block text-sm">Fresh alternatives ready</strong><p className="mt-0.5 text-xs leading-relaxed">{recovery}</p></div>
            </div>
          )}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2"><Settings2 className="size-4" /><strong className="text-sm">What matters most?</strong></div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {priorities.map(([id, label]) => (
                <button key={id} className={cn("cursor-pointer rounded-lg border bg-background px-3 py-2.5 text-left text-xs font-medium hover:bg-accent", priority === id && "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-950")} onClick={() => onPriority(id)} aria-pressed={priority === id}>{label}</button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs"><Navigation className="size-3.5" /> Preferred pickup area
                <select className="rounded-md border bg-background px-2 py-1.5" value={area} onChange={(event) => onArea(event.target.value as PickupArea)}>
                  <option>Any</option><option>Central</option><option>East</option><option>North</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={remember} onChange={(event) => onRemember(event.target.checked)} />Remember on this device</label>
            </div>
          </div>
          <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Choice Center views">
            <button role="tab" aria-selected={tab === "choices"} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium", tab === "choices" && "bg-background shadow-xs")} onClick={() => onTab("choices")}>Choices</button>
            <button role="tab" aria-selected={tab === "compare"} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium", tab === "compare" && "bg-background shadow-xs")} onClick={() => onTab("compare")}><GitCompareArrows className="size-3.5" /> Compare carts</button>
          </div>
          {tab === "choices" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carts.map((cart, index) => (
                <article key={cart.id} className={cn("flex flex-col rounded-xl border p-4", selectedCartId === cart.id && "border-zinc-950 ring-1 ring-zinc-950")}>
                  <div className="flex flex-wrap gap-1">{cartTraits(cart, allCarts).map((trait, traitIndex) => <Badge key={trait} variant={traitIndex === 0 ? "default" : "secondary"} className="font-mono text-[9px] uppercase">{trait}</Badge>)}</div>
                  <span className="mt-4 font-mono text-[10px] text-muted-foreground">OPTION {String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 text-base font-semibold">{cart.merchantName}</h3>
                  <p className="text-xs text-muted-foreground">{cart.locationName} · {cart.area}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border text-center">
                    <ChoiceMetric label="Total" value={formatMoney(cart.totalCents)} />
                    <ChoiceMetric label="Ready" value={`~${cart.pickupMinutes}m`} />
                    <ChoiceMetric label="Rainfly" value={`${cartWaterproof(cart).toLocaleString()}mm`} />
                  </dl>
                  <ul className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">{cart.checks.map((check) => <li key={check} className="flex gap-1.5"><Check className="mt-0.5 size-3 flex-none text-emerald-600" />{check}</li>)}</ul>
                  <Button className="mt-4 w-full" variant={selectedCartId === cart.id ? "secondary" : "default"} disabled={busy !== null} onClick={() => onSelect(cart.id)}>{selectedCartId === cart.id ? "Selected" : `Choose ${cart.merchantName}`}<ArrowRight className="size-3.5" /></Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead><tr className="bg-muted/60 text-left"><th className="p-3 text-xs font-medium text-muted-foreground">Complete cart</th>{carts.map((cart) => <th key={cart.id} className="p-3"><strong className="block">{cart.merchantName}</strong><small className="font-normal text-muted-foreground">{cart.locationName}</small></th>)}</tr></thead>
                <tbody>{[
                  ["Recognition", (cart: RankedCart) => cartTraits(cart, allCarts).join(" · ")],
                  ["Full kit", (cart: RankedCart) => `${cart.lines.length} products / ${cart.lines.reduce((sum, line) => sum + line.quantity, 0)} units`],
                  ["Total", (cart: RankedCart) => formatMoney(cart.totalCents)],
                  ["Pickup ready", (cart: RankedCart) => `${formatReadyTime(cart)} · ~${cart.pickupMinutes} min`],
                  ["Travel", (cart: RankedCart) => `${cart.area} · ~${cart.transitMinutes} min`],
                  ["Rainfly", (cart: RankedCart) => `${cartWaterproof(cart).toLocaleString()} mm`],
                  ["Swaps", (cart: RankedCart) => `${cart.alternatives.length} approved`],
                ].map(([label, value]) => <tr key={String(label)} className="border-t"><th className="p-3 text-left text-xs font-medium text-muted-foreground">{String(label)}</th>{carts.map((cart) => <td key={cart.id} className="p-3 text-xs">{(value as (cart: RankedCart) => string)(cart)}</td>)}</tr>)}
                  <tr className="border-t"><th className="p-3" />{carts.map((cart) => <td key={cart.id} className="p-3"><Button size="sm" className="w-full" variant={selectedCartId === cart.id ? "secondary" : "default"} disabled={busy !== null} onClick={() => onSelect(cart.id)}>{selectedCartId === cart.id ? "Selected" : "Choose"}</Button></td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

function SwapDialog({ dialogRef, alternatives, busy, onSwap }: { dialogRef: { current: HTMLDialogElement | null }; alternatives: CartAlternative[]; busy: string | null; onSwap: (offerId: string) => void }) {
  return (
    <dialog ref={dialogRef} aria-labelledby="swap-dialog-title" className="choice-dialog m-auto w-[min(560px,calc(100%-1.5rem))] rounded-2xl border bg-background p-0 text-foreground shadow-2xl">
      <header className="flex items-start justify-between border-b px-5 py-4"><div><span className="microlabel text-muted-foreground">Compatibility preserved</span><h2 id="swap-dialog-title" className="mt-1 text-lg font-semibold">Swap item</h2><p className="mt-1 text-xs text-muted-foreground">Only active merchant-approved alternatives are shown.</p></div><Button variant="ghost" size="icon-sm" aria-label="Close swap dialog" onClick={() => dialogRef.current?.close()}><X className="size-4" /></Button></header>
      <div className="space-y-3 p-5">{alternatives.map((alternative) => (
        <article key={alternative.offerId} className="rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3"><div><Badge variant="secondary" className="font-mono text-[9px] uppercase">Merchant approved</Badge><h3 className="mt-2 text-sm font-semibold">{alternative.name}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alternative.compatibility}</p></div><strong className="text-sm">{alternative.deltaCents === 0 ? "Same price" : `${alternative.deltaCents > 0 ? "+" : "−"}${formatMoney(Math.abs(alternative.deltaCents))}`}</strong></div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3"><span className="text-xs text-muted-foreground">New total · {formatMoney(alternative.totalCents)} · {alternative.stock} in stock</span><Button size="sm" disabled={busy !== null} onClick={() => onSwap(alternative.offerId)}>{busy === "swap" ? "Swapping…" : "Use this item"}</Button></div>
        </article>
      ))}{!alternatives.length && <p className="py-6 text-center text-sm text-muted-foreground">No approved alternative is currently available.</p>}</div>
    </dialog>
  );
}

function ChoiceMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-background p-2"><dt className="microlabel text-muted-foreground">{label}</dt><dd className="mt-1 text-xs font-semibold">{value}</dd></div>;
}

function PickupStat({ label, value }: { label: string; value: string }) {
  return <div className="bg-zinc-950 p-2.5"><span className="microlabel block text-white/35">{label}</span><strong className="mt-1 block text-xs text-white/80">{value}</strong></div>;
}

function CartCard({ cart, index, active, onSelect }: { cart: RankedCart; index: number; active: boolean; onSelect: () => void }) {
  return (
    <button
      className={cn(
        "group flex min-w-0 cursor-pointer flex-col rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:border-zinc-400 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        active && "border-zinc-950 ring-1 ring-zinc-950 hover:border-zinc-950",
      )}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between">
        <Badge variant={index === 0 ? "default" : "secondary"} className="font-mono text-[10px] uppercase tracking-[0.08em]">
          {cart.badge}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{cart.merchantName}</h3>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3 flex-none" /> {cart.locationName}
      </p>
      <div className="mt-4 space-y-2 border-t pt-3.5">
        {cart.lines.map((line) => (
          <span key={line.offerId} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex-none [&>svg]:size-3.5">{categoryIcon(line.category)}</span>
            <em className="truncate not-italic">{line.quantity > 1 ? `${line.quantity} × ` : ""}{line.name}</em>
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2 border-t pt-3.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3 flex-none" />~{cart.pickupMinutes} min
        </span>
        <strong className="text-lg font-semibold tracking-tight">{formatMoney(cart.totalCents)}</strong>
      </div>
      <span className="mt-3 flex items-center justify-between text-xs font-medium">
        {active ? "Viewing kit" : "View this kit"}
        {active
          ? <Check className="size-3.5" />
          : <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />}
      </span>
    </button>
  );
}

function OrderResult({ view }: { view: MissionView }) {
  const order = view.order!;
  const success = order.status === "confirmed";
  return (
    <section className="border-t px-6 py-8 sm:px-10">
      <div
        className={cn(
          "grid items-center gap-5 rounded-xl border p-6 sm:grid-cols-[48px_minmax(0,1fr)_auto]",
          success ? "border-emerald-200 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60",
        )}
      >
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full text-white",
            success ? "bg-emerald-600" : "bg-amber-500",
          )}
        >
          {success ? <Check className="size-6" /> : <TriangleAlert className="size-5" />}
        </span>
        <div>
          <span className="microlabel text-muted-foreground">Simulated Visa result</span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {success
              ? "Kit reserved. Everything aligned."
              : order.status === "authorization_declined"
                ? "Authorization declined"
                : "Order failed · reversal started"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {success
              ? `Pickup at ${order.pickupLocation}. Show receipt ${order.receiptNumber}.`
              : "No successful charge was completed. Use the merchant desk to restore the normal scenario."}
          </p>
        </div>
        <dl className="min-w-44 text-xs">
          <div className="flex justify-between gap-6 border-b border-foreground/10 py-1.5">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="m-0 font-mono">{order.id}</dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-foreground/10 py-1.5">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="m-0 font-mono">{formatMoney(order.amountCents)}</dd>
          </div>
          <div className="flex justify-between gap-6 py-1.5">
            <dt className="text-muted-foreground">Authorization</dt>
            <dd className="m-0 font-mono">{order.authorizationCode || "DECLINED"}</dd>
          </div>
        </dl>
      </div>
      {order.receipt && (
        <div className="mt-4 overflow-hidden rounded-xl border">
          <header className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3"><BadgeCheck className="size-5 text-emerald-400" /><div><span className="microlabel text-white/45">Signed receipt</span><h3 className="text-sm font-semibold">{order.receipt.receiptNumber}</h3></div></div>
            <Badge variant="outline" className="border-emerald-400/40 font-mono text-[9px] uppercase text-emerald-300">{view.receiptVerification?.valid ? "Signature valid" : "Verification failed"}</Badge>
          </header>
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
            <div><p className="text-sm leading-relaxed">“{order.receipt.request}”</p><div className="mt-4 divide-y rounded-lg border">{order.receipt.lines.map((line) => <div key={line.offerId} className="flex justify-between gap-4 px-3 py-2 text-xs"><span>{line.quantity > 1 ? `${line.quantity} × ` : ""}{line.name}</span><strong>{formatMoney(line.priceCents * line.quantity)}</strong></div>)}</div></div>
            <dl className="text-xs"><MandateRow label="Merchant" value={order.receipt.merchantName} /><MandateRow label="Pickup" value={order.receipt.pickupLocation} /><MandateRow label="Payment" value="Simulated" /><MandateRow label="Signed" value={new Date(order.receipt.createdAt).toLocaleString()} /><div className="pt-3"><dt className="text-muted-foreground">Server signature</dt><dd className="mt-1 break-all font-mono text-[10px]">{order.receipt.signature}</dd></div></dl>
          </div>
        </div>
      )}
    </section>
  );
}

function Kicker({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="microlabel text-foreground">{number}</span>
      <Separator className="w-8 flex-none" />
      <span className="microlabel text-muted-foreground">{label}</span>
    </div>
  );
}

function MandateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 text-right font-medium">{value}</dd>
    </div>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/90 px-4 py-3">
      <span className="microlabel block text-white/40">{label}</span>
      <strong className="mt-1 block text-sm font-medium text-white">{value}</strong>
    </div>
  );
}

function Loading({ message }: { message: string }) {
  return (
    <main className="mx-auto grid min-h-[280px] w-full max-w-[1040px] place-items-center content-center gap-2 rounded-2xl border bg-background p-10 text-center shadow-sm">
      <span className="grid size-9 place-items-center rounded-lg bg-zinc-950">
        <WovenMark className="size-5" />
      </span>
      <h1 className="mt-2 text-sm font-semibold tracking-tight">Woven</h1>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <i className="block h-full w-1/2 animate-pulse rounded-full bg-zinc-950" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

function ConnectionError({ message }: { message: string }) {
  return (
    <main className="mx-auto grid min-h-[280px] w-full max-w-[1040px] place-items-center content-center gap-2 rounded-2xl border bg-background p-10 text-center shadow-sm">
      <TriangleAlert className="size-8 text-destructive" />
      <h1 className="mt-2 text-lg font-semibold tracking-tight">Connection interrupted</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

function categoryIcon(category: Category) {
  if (category === "tent") return <TentTree className="size-4" />;
  if (category === "sleeping_bag") return <BedSingle className="size-4" />;
  if (category === "sleeping_mat") return <Layers3 className="size-4" />;
  if (category === "lantern") return <Lamp className="size-4" />;
  if (category === "first_aid") return <BriefcaseMedical className="size-4" />;
  return <PackageSearch className="size-4" />;
}

function formatMoney(cents: number) {
  return `S$${(cents / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function cartWaterproof(cart: RankedCart) {
  return Number(cart.lines.find((line) => line.category === "tent")?.name.match(/([\d,]+)\s*mm/i)?.[1]?.replaceAll(",", "") || 0);
}

function rankCarts(carts: RankedCart[], priority: RankingPriority, area: PickupArea) {
  return carts.toSorted((a, b) => {
    const areaDifference = area === "Any" ? 0 : Number(b.area === area) - Number(a.area === area);
    if (areaDifference) return areaDifference;
    if (priority === "value") return a.totalCents - b.totalCents;
    if (priority === "speed") return a.pickupMinutes - b.pickupMinutes;
    if (priority === "weather") return cartWaterproof(b) - cartWaterproof(a);
    return b.score - a.score;
  });
}

function cartTraits(cart: RankedCart, carts: RankedCart[]) {
  const traits = [cart.badge === "CUSTOM" ? "Custom" : cart.badge.replace("BEST ", "Best ").toLowerCase()];
  if (cart.totalCents === Math.min(...carts.map((candidate) => candidate.totalCents))) traits.push("Lowest total");
  if (cart.pickupMinutes === Math.min(...carts.map((candidate) => candidate.pickupMinutes))) traits.push("Soonest pickup");
  if (cartWaterproof(cart) === Math.max(...carts.map(cartWaterproof))) traits.push("Most rainproof");
  return [...new Set(traits)];
}

function formatReadyTime(cart: RankedCart) {
  return formatTime(new Date(new Date(cart.inventoryCheckedAt).getTime() + cart.pickupMinutes * 60_000).toISOString());
}

function formatLeaveTime(cart: RankedCart) {
  const readyAt = new Date(cart.inventoryCheckedAt).getTime() + cart.pickupMinutes * 60_000;
  return formatTime(new Date(readyAt - cart.transitMinutes * 60_000).toISOString());
}

const root = document.getElementById("root");
if (root) createRoot(root).render(root.dataset.surface === "demo" ? <StandaloneDemo /> : <HostedWidget />);
