import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import {
  ArrowRight,
  ArrowDownUp,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  BatteryCharging,
  Cable,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  GitCompareArrows,
  Loader2,
  MapPin,
  Navigation,
  PackageSearch,
  Plane,
  Plug,
  Settings2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Store,
  Terminal,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { CartAlternative, Category, MissionView, RankedCart } from "../src/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WovenMark } from "./woven-mark";
import "./styles.css";

interface Payload {
  view?: MissionView;
  error?: { code: string; message: string; retryable: boolean };
  _meta?: Record<string, unknown>;
}

type Invoke = (name: string, arguments_: Record<string, unknown>) => Promise<Payload>;

type RankingPriority = "balanced" | "value" | "speed" | "power";
type PickupArea = "Any" | RankedCart["area"];

interface Preferences {
  priority: RankingPriority;
  area: PickupArea;
}

class WovenError extends Error {
  constructor(
    message: string,
    readonly code = "UNKNOWN",
    readonly retryable = false,
  ) {
    super(message);
  }
}

const preferenceKey = "woven.demo.preferences.v1";

const canonicalRequest =
  "I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and AirPods under S$150, with pickup today.";

function HostedWidget() {
  const [view, setView] = useState<MissionView | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const receive = (result: { structuredContent?: unknown; _meta?: Record<string, unknown>; isError?: boolean }) => {
    const payload = (result.structuredContent || {}) as Payload;
    if (payload.view) setView(payload.view);
    if (typeof result._meta?.confirmationNonce === "string") setNonce(result._meta.confirmationNonce);
    if (payload.error) throw new WovenError(payload.error.message, payload.error.code, payload.error.retryable);
    return { ...payload, _meta: result._meta };
  };

  const { app, error } = useApp({
    appInfo: { name: "Woven", version: "0.2.0" },
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
  return <Woven view={view} setView={setView} nonce={nonce} invoke={invoke} />;
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
  "Recalling device profile…",
  "Calling start_mission…",
  "Checking live stock across merchants…",
  "Weaving compatible carts…",
];

const narrationText =
  "Five complete carts fit your request — one pickup location each, every thread checked for compatibility, all under budget. Compare the choices below; nothing is charged without your explicit confirmation.";

const thanksMessage = "Perfect — that’s exactly what I needed. Thanks!";

function StandaloneDemo() {
  const instant = useMemo(() => new URLSearchParams(window.location.search).has("instant"), []);
  const [phase, setPhase] = useState<ChatPhase>("typing");
  const [typed, setTyped] = useState("");
  const [stage, setStage] = useState(-1);
  const [narration, setNarration] = useState("");
  const [showWidget, setShowWidget] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [farewell, setFarewell] = useState("");
  const [epilogueDone, setEpilogueDone] = useState(false);
  const [view, setView] = useState<MissionView | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const callId = useRef(0);
  const skipTyping = useRef(false);
  const epilogueStarted = useRef(false);
  const threadRef = useRef<HTMLDivElement>(null);

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
      post("/api/demo/start", { request: canonicalRequest })
        .then((payload) => ({ payload }))
        .catch((failure: unknown) => ({ failure }));

    const run = async () => {
      if (instant) {
        setPhase("sent");
        if (!finish(await startWork())) return;
        setNarration(narrationText);
        setShowWidget(true);
        return;
      }
      await sleep(700);
      await typeInComposer(canonicalRequest, isCancelled);
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

  // Closing beat: once the simulated payment confirms, the user says thanks and the host signs off.
  const order = view?.order;
  useEffect(() => {
    if (order?.status !== "confirmed" || epilogueStarted.current) return;
    epilogueStarted.current = true;
    let cancelled = false;
    const isCancelled = () => cancelled;
    const reply =
      `You’re all set — receipt ${order.receiptNumber} is saved and the kit is being packed at ${order.pickupLocation}. ` +
      "That was the only charge, and it was simulated. Safe travels to Tokyo ✈️";
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

  const invoke: Invoke = async (name, arguments_) => {
    const payload = await track(name, () => post(`/api/tools/${name}`, arguments_));
    if (payload.view) setView(payload.view);
    if (typeof payload._meta?.confirmationNonce === "string") setNonce(payload._meta.confirmationNonce);
    return payload;
  };

  const startCall = calls[0];
  const laterCalls = calls.slice(1).slice(-8);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 flex-none items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Woven Demo Host</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.1em]">Simulated</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/install" target="_blank" rel="noreferrer">
              How to install <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
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
                  {canonicalRequest}
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
                  {narration && <p className="mt-4 text-[15px] leading-7">{narration}</p>}
                  {showWidget && (
                    <div className="rise-in mt-6">
                      <Woven view={view} setView={setView} nonce={nonce} invoke={invoke} />
                    </div>
                  )}
                  {laterCalls.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="microlabel text-muted-foreground">Live MCP calls</span>
                      {laterCalls.map((call) => <ToolChip key={call.id} call={call} />)}
                    </div>
                  )}
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
            Simulated rehearsal of the ChatGPT/Codex MCP experience — same server, real tool calls, no live charge.
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

async function post(url: string, body: Record<string, unknown>): Promise<Payload> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as Payload;
  if (!response.ok || payload.error) {
    throw new WovenError(
      payload.error?.message || "Request failed.",
      payload.error?.code,
      payload.error?.retryable,
    );
  }
  return payload;
}

function loadPreferences(): Preferences | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(preferenceKey) || "null") as Preferences | null;
    const priorities: RankingPriority[] = ["balanced", "value", "speed", "power"];
    const areas: PickupArea[] = ["Any", "Central", "Airport", "East"];
    return parsed && priorities.includes(parsed.priority) && areas.includes(parsed.area) ? parsed : null;
  } catch {
    return null;
  }
}

function cartPower(cart: RankedCart): number {
  return Number(cart.lines.find((line) => line.category === "charger")?.name.match(/(\d+)W/)?.[1] || 0);
}

function rankChoices(carts: RankedCart[], priority: RankingPriority, area: PickupArea): RankedCart[] {
  return carts.toSorted((left, right) => {
    const areaDelta = area === "Any" ? 0 : Number(right.area === area) - Number(left.area === area);
    if (areaDelta) return areaDelta;
    if (priority === "value") return left.totalCents - right.totalCents || right.score - left.score;
    if (priority === "speed") return left.pickupMinutes - right.pickupMinutes || left.totalCents - right.totalCents;
    if (priority === "power") return cartPower(right) - cartPower(left) || right.score - left.score;
    return right.score - left.score || left.totalCents - right.totalCents;
  });
}

function cartTraits(cart: RankedCart, carts: RankedCart[]): string[] {
  const traits: string[] = [];
  if (cart.id === carts.toSorted((left, right) => right.score - left.score)[0]?.id) traits.push("Best match");
  if (cart.id === carts.toSorted((left, right) => left.totalCents - right.totalCents || right.score - left.score)[0]?.id) traits.push("Best value");
  if (cart.id === carts.toSorted((left, right) => left.pickupMinutes - right.pickupMinutes || right.score - left.score)[0]?.id) traits.push("Fastest pickup");
  if (cart.id === carts.toSorted((left, right) => cartPower(right) - cartPower(left) || right.score - left.score)[0]?.id) traits.push("Most powerful");
  return traits;
}

function Woven({
  view,
  setView,
  nonce,
  invoke,
}: {
  view: MissionView;
  setView: (view: MissionView) => void;
  nonce: string | null;
  invoke: Invoke;
}) {
  const saved = useMemo(loadPreferences, []);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(true);
  const [choiceTab, setChoiceTab] = useState<"choices" | "compare">("choices");
  const [swapCategory, setSwapCategory] = useState<Category | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [priority, setPriority] = useState<RankingPriority>(saved?.priority || "balanced");
  const [area, setArea] = useState<PickupArea>(saved?.area || "Any");
  const [rememberPreferences, setRememberPreferences] = useState(Boolean(saved));
  const choiceDialog = useRef<HTMLDialogElement>(null);
  const swapDialog = useRef<HTMLDialogElement>(null);
  const openedMission = useRef<string | null>(null);

  useEffect(() => {
    if (openedMission.current !== view.mission.id) {
      openedMission.current = view.mission.id;
      setChoiceOpen(true);
    }
  }, [view.mission.id]);

  useEffect(() => {
    const dialog = choiceDialog.current;
    if (!dialog) return;
    if (choiceOpen && !dialog.open) dialog.showModal();
    if (!choiceOpen && dialog.open) dialog.close();
  }, [choiceOpen]);

  useEffect(() => {
    const dialog = swapDialog.current;
    if (!dialog) return;
    if (swapOpen && !dialog.open) dialog.showModal();
    if (!swapOpen && dialog.open) dialog.close();
  }, [swapOpen]);

  useEffect(() => {
    try {
      if (rememberPreferences) localStorage.setItem(preferenceKey, JSON.stringify({ priority, area }));
      else localStorage.removeItem(preferenceKey);
    } catch {
      // Sandboxed hosts may disable storage; the current mission still uses the preferences.
    }
  }, [priority, area, rememberPreferences]);

  const rankedCarts = useMemo(() => rankChoices(view.carts, priority, area), [view.carts, priority, area]);
  const activeCart = useMemo(
    () => view.carts.find((cart) => cart.id === view.selectedCartId) || rankedCarts[0] || null,
    [rankedCarts, view.carts, view.selectedCartId],
  );
  const swapAlternatives = activeCart?.alternatives.filter((alternative) => alternative.category === swapCategory) || [];

  const act = async (label: string, name: string, arguments_: Record<string, unknown>) => {
    setBusy(label);
    setError(null);
    try {
      const payload = await invoke(name, arguments_);
      if (payload.view) setView(payload.view);
      return payload;
    } catch (caught) {
      if (caught instanceof WovenError && caught.retryable) {
        try {
          const fresh = await invoke("build_carts", { missionId: view.mission.id });
          if (fresh.view) setView(fresh.view);
          setRecovery("Fresh alternatives ready — stock or price changed, so Woven rebuilt every complete cart.");
          setChoiceTab("choices");
          setChoiceOpen(true);
          return fresh;
        } catch {
          // The original actionable failure is more useful than a secondary refresh error.
        }
      }
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const selectChoice = async (cartId: string) => {
    const result = await act("select", "select_cart", { missionId: view.mission.id, cartId });
    if (result) {
      setRecovery(null);
      setChoiceOpen(false);
    }
  };

  const swapItem = async (offerId: string) => {
    if (!activeCart) return;
    const result = await act("swap", "swap_cart_item", {
      missionId: view.mission.id,
      cartId: activeCart.id,
      offerId,
    });
    if (result) setSwapOpen(false);
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

  return (
    <main className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-2xl border bg-background shadow-sm">
      <ChoiceCenter
        ref={choiceDialog}
        carts={rankedCarts}
        allCarts={view.carts}
        selectedCartId={view.selectedCartId}
        priority={priority}
        area={area}
        remember={rememberPreferences}
        tab={choiceTab}
        busy={busy}
        recovery={recovery}
        onPriority={setPriority}
        onArea={setArea}
        onRemember={setRememberPreferences}
        onTab={setChoiceTab}
        onSelect={(cartId) => void selectChoice(cartId)}
        onClose={() => setChoiceOpen(false)}
      />
      <SwapDialog
        ref={swapDialog}
        alternatives={swapAlternatives}
        busy={busy}
        onSwap={(offerId) => void swapItem(offerId)}
        onClose={() => setSwapOpen(false)}
      />

      <header className="relative overflow-hidden bg-zinc-950 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="absolute -top-32 right-[-10%] h-72 w-[480px] rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-white/15 bg-white/10"><WovenMark className="size-5" /></span>
            <span className="text-sm font-semibold tracking-tight">Woven</span>
            <Badge variant="outline" className="border-white/25 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70">Prototype</Badge>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              onClick={() => setChoiceOpen(true)}
            >
              <Sparkles className="size-3.5" /> Choice Center
            </button>
            <div className="hidden items-center gap-2.5 font-mono text-xs tracking-[0.1em] text-white/60 sm:flex" aria-label="Travel route Singapore to Tokyo">
              <span>SIN</span><span className="h-px w-7 bg-white/25" /><Plane className="size-3.5 text-white/80" /><span className="h-px w-7 bg-white/25" /><span>TYO</span>
            </div>
          </div>
        </div>

        <h1 className="relative mt-10 max-w-xl text-3xl font-semibold leading-[1.08] tracking-tight sm:text-[40px]">
          Everything you need.<br />Woven into one choice.
        </h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-white/60">“{view.mission.request}”</p>
        <div className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          <Constraint label="Budget" value={formatMoney(view.mission.budgetCents)} />
          <Constraint label="Pickup" value="Today" />
          <Constraint label="Destination" value={view.mission.destination} />
          <Constraint label="Devices" value="3 verified" />
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
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="results-heading" className="text-xl font-semibold tracking-tight">Complete choices, ranked your way</h2>
            <p className="mt-1 text-sm text-muted-foreground">{priorityLabel(priority)} · {area === "Any" ? "any pickup area" : `${area} preferred`}.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="microlabel inline-flex items-center gap-1.5 text-muted-foreground"><i className="pulse-dot size-1.5 rounded-full bg-emerald-500" /> Live demo stock</span>
            <Button variant="outline" size="sm" onClick={() => setChoiceOpen(true)}><GitCompareArrows className="size-3.5" /> Compare</Button>
          </div>
        </div>

        {rankedCarts.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {rankedCarts.map((cart, index) => (
              <CartCard
                key={cart.id}
                cart={cart}
                index={index}
                active={cart.id === activeCart?.id}
                traits={cartTraits(cart, view.carts)}
                onSelect={() => void selectChoice(cart.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
            <TriangleAlert className="mx-auto size-6 text-amber-600" />
            <h3 className="mt-3 text-base font-semibold tracking-tight">No complete kit right now</h3>
            <p className="mt-1 text-sm text-muted-foreground">Woven can retry as soon as merchant stock changes.</p>
            <Button className="mt-4" variant="outline" onClick={() => void act("recover", "build_carts", { missionId: view.mission.id })}>
              <PackageSearch className="size-4" /> Find fresh alternatives
            </Button>
          </div>
        )}
      </section>

      {activeCart && (
        <section className="border-t px-6 py-8 sm:px-10">
          <Kicker number="02" label="Every thread checked" />
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Why this works</h2>
              <p className="mt-1 text-sm text-muted-foreground">Every item is checked as part of this exact kit.</p>
              <div className="mt-5 divide-y rounded-xl border">
                {activeCart.lines.map((line) => {
                  const alternatives = activeCart.alternatives.filter((alternative) => alternative.fromOfferId === line.offerId);
                  return (
                    <div className="flex items-start gap-3 p-4" key={line.offerId}>
                      <span className="grid size-9 flex-none place-items-center rounded-md border bg-muted/50">{categoryIcon(line.category)}</span>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm font-medium">{line.name}</strong>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{line.compatibility}</p>
                      </div>
                      {alternatives.length ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-none"
                          onClick={() => { setSwapCategory(line.category); setSwapOpen(true); }}
                        >
                          <ArrowDownUp className="size-3.5" /> Swap item
                        </Button>
                      ) : <Check className="mt-1 size-4 flex-none text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
              <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                {activeCart.checks.map((check) => <li key={check} className="flex gap-2 rounded-lg bg-muted/60 p-3"><Check className="mt-0.5 size-3.5 flex-none text-emerald-600" />{check}</li>)}
              </ul>
            </div>
            <aside className="flex flex-col self-start rounded-xl bg-zinc-950 p-6 text-white">
              <span className="microlabel text-white/40">Pickup planner</span>
              <Store className="mt-4 size-5 text-white/80" />
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{activeCart.merchantName}</h3>
              <p className="text-sm text-white/60">{activeCart.locationName}</p>
              <span className="mt-3 flex items-center gap-2 text-xs text-white/50"><MapPin className="size-3.5 flex-none" />{activeCart.address}</span>
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
                <PickupStat label="Ready" value={formatReadyTime(activeCart)} />
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
                onClick={() => void act("preview", "create_checkout_preview", { missionId: view.mission.id, cartId: activeCart.id })}
              >
                {busy === "preview" ? "Revalidating…" : "Review checkout"}
              </Button>
              <small className="mt-3 text-center text-[11px] leading-snug text-white/40">No purchase yet. Stock and price are rechecked first.</small>
            </aside>
          </div>
        </section>
      )}

      {preview && !view.order && (
        <section className="border-t px-6 py-8 sm:px-10" aria-labelledby="checkout-heading">
          <Kicker number="03" label="The consent boundary" />
          <div className="mt-5 grid overflow-hidden rounded-xl border lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <Badge variant="visa" className="font-mono text-[10px] uppercase tracking-[0.1em]"><CreditCard className="size-3.5" /> Visa authorization · Simulated</Badge>
              <h2 id="checkout-heading" className="mt-4 text-xl font-semibold tracking-tight">Review the exact terms</h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">This one click authorizes only this merchant, cart version, and total. It expires at {formatTime(preview.expiresAt)}.</p>
              <dl className="mt-5">
                <MandateRow label="Merchant" value={preview.mandate.merchantName} />
                <MandateRow label="Pickup" value={preview.mandate.pickupLocation} />
                <MandateRow label="Items" value={String(preview.mandate.lines.length)} />
                <div className="flex items-end justify-between gap-6 pt-4"><dt className="text-sm text-muted-foreground">Authorized total</dt><dd className="m-0 text-2xl font-semibold tracking-tight">{formatMoney(preview.mandate.amountCents)}</dd></div>
              </dl>
            </div>
            <div className="flex flex-col justify-center border-t bg-muted/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <ShieldCheck className="size-7" />
              <h3 className="mt-3 text-base font-semibold tracking-tight">Your yes is the final thread.</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">No card credentials enter Woven. The demo returns a simulated network authorization.</p>
              <Button className="mt-4 w-full" disabled={busy !== null || !nonce} onClick={confirm}>{busy === "confirm" ? "Authorizing…" : `Confirm ${formatMoney(preview.mandate.amountCents)}`}</Button>
              <small className="mt-3 text-center text-[11px] text-muted-foreground">Explicit confirmation required · no background charge</small>
            </div>
          </div>
        </section>
      )}

      {view.order && <OrderResult view={view} />}
      {error && <div className="sticky bottom-4 z-10 mx-auto mb-4 flex w-fit max-w-[calc(100%-3rem)] items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-xs font-medium text-white shadow-lg" role="alert"><TriangleAlert className="size-4 flex-none" />{error}</div>}
      <footer className="microlabel flex flex-col gap-1 border-t bg-muted/40 px-6 py-4 text-muted-foreground sm:flex-row sm:justify-between sm:px-10"><span>Woven / Agentic commerce prototype</span><span>Simulated payments · seeded merchants · no live charge</span></footer>
    </main>
  );
}

const ChoiceCenter = forwardRef<HTMLDialogElement, {
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
  onClose: () => void;
}>(function ChoiceCenter({ carts, allCarts, selectedCartId, priority, area, remember, tab, busy, recovery, onPriority, onArea, onRemember, onTab, onSelect, onClose }, ref) {
  const priorityOptions: Array<{ id: RankingPriority; label: string; icon: ReactNode }> = [
    { id: "balanced", label: "Best match", icon: <Sparkles /> },
    { id: "value", label: "Spend less", icon: <CircleDollarSign /> },
    { id: "speed", label: "Pick up sooner", icon: <Clock3 /> },
    { id: "power", label: "Prioritize power", icon: <Zap /> },
  ];
  return (
    <dialog ref={ref} aria-labelledby="choice-center-title" className="choice-dialog m-auto max-h-[92dvh] w-[min(960px,calc(100%-1.5rem))] overflow-hidden rounded-2xl border bg-background p-0 text-foreground shadow-2xl" onCancel={onClose} onClose={onClose}>
      <div className="flex max-h-[92dvh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div><span className="microlabel text-muted-foreground">Woven decision workspace</span><h2 id="choice-center-title" className="mt-1 text-xl font-semibold tracking-tight">Choice Center</h2><p className="mt-1 text-sm text-muted-foreground">Compare complete carts, tune priorities, then choose one.</p></div>
          <Button variant="ghost" size="icon-sm" aria-label="Close Choice Center" title="Close Choice Center" onClick={onClose}><X className="size-4" /></Button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {recovery && <div className="mb-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><PackageSearch className="mt-0.5 size-5 flex-none" /><div><strong className="block text-sm">Fresh alternatives ready</strong><p className="mt-0.5 text-xs leading-relaxed">{recovery}</p></div></div>}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2"><Settings2 className="size-4" /><strong className="text-sm">What matters most?</strong></div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {priorityOptions.map((option) => <button key={option.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-accent [&>svg]:size-4", priority === option.id && "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-950")} onClick={() => onPriority(option.id)} aria-pressed={priority === option.id}>{option.icon}{option.label}</button>)}
            </div>
            <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs"><Navigation className="size-3.5" /> Preferred pickup area<select className="rounded-md border bg-background px-2 py-1.5" value={area} onChange={(event) => onArea(event.target.value as PickupArea)}><option>Any</option><option>Central</option><option>Airport</option><option>East</option></select></label>
              <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={remember} onChange={(event) => onRemember(event.target.checked)} />Remember these preferences <span className="text-muted-foreground">on this device</span></label>
            </div>
          </div>
          <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1" role="tablist">
            <button role="tab" aria-selected={tab === "choices"} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium", tab === "choices" && "bg-background shadow-xs")} onClick={() => onTab("choices")}><Sparkles className="size-3.5" /> Choices</button>
            <button role="tab" aria-selected={tab === "compare"} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium", tab === "compare" && "bg-background shadow-xs")} onClick={() => onTab("compare")}><GitCompareArrows className="size-3.5" /> Compare carts</button>
          </div>
          {tab === "choices" ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {carts.map((cart, index) => <article key={cart.id} className={cn("flex flex-col rounded-xl border p-4", selectedCartId === cart.id && "border-zinc-950 ring-1 ring-zinc-950")}>
                <div className="flex flex-wrap gap-1">{cartTraits(cart, allCarts).map((trait, traitIndex) => <Badge key={trait} variant={traitIndex === 0 ? "default" : "secondary"} className="font-mono text-[9px] uppercase tracking-[0.06em]">{trait}</Badge>)}</div>
                <span className="mt-4 font-mono text-[10px] text-muted-foreground">OPTION 0{index + 1}</span><h3 className="mt-1 text-base font-semibold">{cart.merchantName}</h3><p className="text-xs text-muted-foreground">{cart.locationName} · {cart.area}</p>
                <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border text-center"><ChoiceMetric label="Total" value={formatMoney(cart.totalCents)} /><ChoiceMetric label="Ready" value={`~${cart.pickupMinutes}m`} /><ChoiceMetric label="Power" value={`${cartPower(cart)}W`} /></dl>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">{cart.checks.map((check) => <li key={check} className="flex gap-1.5"><Check className="mt-0.5 size-3 flex-none text-emerald-600" />{check}</li>)}</ul>
                <Button className="mt-4 w-full" variant={selectedCartId === cart.id ? "secondary" : "default"} disabled={busy !== null} onClick={() => onSelect(cart.id)}>{busy === "select" ? "Selecting…" : selectedCartId === cart.id ? "Selected" : `Choose ${cart.merchantName}`}<ArrowRight className="size-3.5" /></Button>
              </article>)}
            </div>
          ) : <CartComparison carts={carts} allCarts={allCarts} selectedCartId={selectedCartId} busy={busy} onSelect={onSelect} />}
        </div>
      </div>
    </dialog>
  );
});

const SwapDialog = forwardRef<HTMLDialogElement, { alternatives: CartAlternative[]; busy: string | null; onSwap: (offerId: string) => void; onClose: () => void }>(function SwapDialog({ alternatives, busy, onSwap, onClose }, ref) {
  return <dialog ref={ref} aria-labelledby="swap-dialog-title" className="choice-dialog m-auto w-[min(560px,calc(100%-1.5rem))] rounded-2xl border bg-background p-0 text-foreground shadow-2xl" onCancel={onClose} onClose={onClose}>
    <header className="flex items-start justify-between border-b px-5 py-4"><div><span className="microlabel text-muted-foreground">Compatibility preserved</span><h2 id="swap-dialog-title" className="mt-1 text-lg font-semibold">Swap item</h2><p className="mt-1 text-xs text-muted-foreground">Only active merchant-approved alternatives are shown.</p></div><Button variant="ghost" size="icon-sm" aria-label="Close swap dialog" onClick={onClose}><X className="size-4" /></Button></header>
    <div className="space-y-3 p-5">{alternatives.map((alternative) => <article key={alternative.offerId} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><Badge variant="secondary" className="font-mono text-[9px] uppercase">Merchant approved</Badge><h3 className="mt-2 text-sm font-semibold">{alternative.name}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alternative.compatibility}</p></div><strong className="text-sm">{alternative.deltaCents === 0 ? "Same price" : `${alternative.deltaCents > 0 ? "+" : "−"}${formatMoney(Math.abs(alternative.deltaCents))}`}</strong></div><div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">New cart total · {formatMoney(alternative.totalCents)} · {alternative.stock} in stock</span><Button size="sm" disabled={busy !== null} onClick={() => onSwap(alternative.offerId)}>{busy === "swap" ? "Swapping…" : "Use this item"}</Button></div></article>)}{!alternatives.length && <p className="py-6 text-center text-sm text-muted-foreground">No approved alternative is currently available.</p>}</div>
  </dialog>;
});

function CartComparison({ carts, allCarts, selectedCartId, busy, onSelect }: { carts: RankedCart[]; allCarts: RankedCart[]; selectedCartId: string | null; busy: string | null; onSelect: (cartId: string) => void }) {
  return <div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-muted/60 text-left"><th className="p-3 text-xs font-medium text-muted-foreground">Complete cart</th>{carts.map((cart) => <th key={cart.id} className="p-3"><strong className="block">{cart.merchantName}</strong><small className="font-normal text-muted-foreground">{cart.locationName}</small></th>)}</tr></thead><tbody>{[
    ["Recognition", (cart: RankedCart) => cartTraits(cart, allCarts).join(" · ")],
    ["Full kit", (cart: RankedCart) => `${cart.lines.length} compatible items`],
    ["Total", (cart: RankedCart) => formatMoney(cart.totalCents)],
    ["Pickup ready", (cart: RankedCart) => `${formatReadyTime(cart)} · ~${cart.pickupMinutes} min`],
    ["Travel", (cart: RankedCart) => `${cart.area} · ~${cart.transitMinutes} min`],
    ["Charger", (cart: RankedCart) => `${cartPower(cart)}W`],
    ["Swaps", (cart: RankedCart) => `${cart.alternatives.length} approved`],
  ].map(([label, value]) => <tr key={String(label)} className="border-t"><th className="p-3 text-left text-xs font-medium text-muted-foreground">{String(label)}</th>{carts.map((cart) => <td key={cart.id} className="p-3 text-xs">{(value as (cart: RankedCart) => string)(cart)}</td>)}</tr>)}<tr className="border-t"><th className="p-3" />{carts.map((cart) => <td key={cart.id} className="p-3"><Button size="sm" className="w-full" variant={selectedCartId === cart.id ? "secondary" : "default"} disabled={busy !== null} onClick={() => onSelect(cart.id)}>{selectedCartId === cart.id ? "Selected" : "Choose"}</Button></td>)}</tr></tbody></table></div>;
}

function ChoiceMetric({ label, value }: { label: string; value: string }) { return <div className="bg-background p-2"><span className="microlabel block text-muted-foreground">{label}</span><strong className="mt-1 block text-xs">{value}</strong></div>; }
function PickupStat({ label, value }: { label: string; value: string }) { return <div className="bg-zinc-950 p-2.5"><span className="microlabel block text-white/35">{label}</span><strong className="mt-1 block text-xs text-white/80">{value}</strong></div>; }

function CartCard({ cart, index, active, traits, onSelect }: { cart: RankedCart; index: number; active: boolean; traits: string[]; onSelect: () => void }) {
  return <button className={cn("group flex min-w-0 cursor-pointer flex-col rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:border-zinc-400 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none", active && "border-zinc-950 ring-1 ring-zinc-950 hover:border-zinc-950")} onClick={onSelect} aria-pressed={active}>
    <div className="flex items-center justify-between gap-2"><div className="flex flex-wrap gap-1">{traits.slice(0, 2).map((trait, traitIndex) => <Badge key={trait} variant={traitIndex === 0 ? "default" : "secondary"} className="font-mono text-[9px] uppercase tracking-[0.06em]">{trait}</Badge>)}</div><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></div>
    <h3 className="mt-4 text-base font-semibold tracking-tight">{cart.merchantName}</h3><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 flex-none" /> {cart.locationName}</p>
    <div className="mt-4 space-y-2 border-t pt-3.5">{cart.lines.map((line) => <span key={line.offerId} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="flex-none [&>svg]:size-3.5">{categoryIcon(line.category)}</span><em className="truncate not-italic">{line.name}</em></span>)}</div>
    <div className="mt-4 flex items-end justify-between gap-2 border-t pt-3.5"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3 flex-none" />~{cart.pickupMinutes} min</span><strong className="text-lg font-semibold tracking-tight">{formatMoney(cart.totalCents)}</strong></div>
    <span className="mt-3 flex items-center justify-between text-xs font-medium">{active ? "Viewing kit" : "View this kit"}{active ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />}</span>
  </button>;
}

function OrderResult({ view }: { view: MissionView }) {
  const order = view.order!;
  const success = order.status === "confirmed";
  return <section className="border-t px-6 py-8 sm:px-10">
    <div className={cn("grid items-center gap-5 rounded-xl border p-6 sm:grid-cols-[48px_minmax(0,1fr)_auto]", success ? "border-emerald-200 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60")}>
      <span className={cn("grid size-12 place-items-center rounded-full text-white", success ? "bg-emerald-600" : "bg-amber-500")}>{success ? <Check className="size-6" /> : <TriangleAlert className="size-5" />}</span>
      <div><span className="microlabel text-muted-foreground">Simulated Visa result</span><h2 className="mt-1 text-xl font-semibold tracking-tight">{success ? "Kit reserved. Everything aligned." : order.status === "authorization_declined" ? "Authorization declined" : "Order failed · reversal started"}</h2><p className="mt-1 text-sm text-muted-foreground">{success ? `Pickup at ${order.pickupLocation}. Show receipt ${order.receiptNumber}.` : "No successful charge was completed. Use the merchant desk to restore the normal scenario."}</p></div>
      <dl className="min-w-44 text-xs"><MandateRow label="Order" value={order.id} /><MandateRow label="Total" value={formatMoney(order.amountCents)} /><MandateRow label="Authorization" value={order.authorizationCode || "DECLINED"} /></dl>
    </div>
    {order.receipt && <div className="mt-4 overflow-hidden rounded-xl border"><header className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 px-5 py-4 text-white"><div className="flex items-center gap-3"><BadgeCheck className="size-5 text-emerald-400" /><div><span className="microlabel text-white/45">Verified receipt</span><h3 className="text-sm font-semibold">{order.receipt.receiptNumber}</h3></div></div><Badge variant="outline" className="border-emerald-400/40 font-mono text-[9px] uppercase text-emerald-300">{view.receiptVerification?.valid ? "Signature valid" : "Verification failed"}</Badge></header><div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]"><div><p className="text-sm leading-relaxed">“{order.receipt.request}”</p><div className="mt-4 divide-y rounded-lg border">{order.receipt.lines.map((line) => <div key={line.offerId} className="flex justify-between gap-4 px-3 py-2 text-xs"><span>{line.name}</span><strong>{formatMoney(line.priceCents)}</strong></div>)}</div></div><dl className="text-xs"><MandateRow label="Merchant" value={order.receipt.merchantName} /><MandateRow label="Pickup" value={order.receipt.pickupLocation} /><MandateRow label="Payment" value="Simulated" /><MandateRow label="Signed" value={new Date(order.receipt.createdAt).toLocaleString()} /><div className="pt-3"><dt className="text-muted-foreground">Server signature</dt><dd className="mt-1 break-all font-mono text-[10px]">{order.receipt.signature}</dd></div></dl></div></div>}
  </section>;
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
  if (category === "charger") return <BatteryCharging className="size-4" />;
  if (category === "adapter") return <Plug className="size-4" />;
  return <Cable className="size-4" />;
}

function formatMoney(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatReadyTime(cart: RankedCart) {
  return formatTime(new Date(new Date(cart.inventoryCheckedAt).getTime() + cart.pickupMinutes * 60_000).toISOString());
}

function formatLeaveTime(cart: RankedCart) {
  const readyAt = new Date(cart.inventoryCheckedAt).getTime() + cart.pickupMinutes * 60_000;
  return formatTime(new Date(readyAt - cart.transitMinutes * 60_000).toISOString());
}

function priorityLabel(priority: RankingPriority) {
  if (priority === "value") return "Lowest total first";
  if (priority === "speed") return "Soonest pickup first";
  if (priority === "power") return "Highest charger power first";
  return "Balanced recommendation";
}

const root = document.getElementById("root");
if (root) createRoot(root).render(root.dataset.surface === "demo" ? <StandaloneDemo /> : <HostedWidget />);
