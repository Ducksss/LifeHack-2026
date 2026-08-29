import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BatteryCharging,
  Cable,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Plane,
  Plug,
  RotateCcw,
  ShieldCheck,
  Store,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Category, MissionView, RankedCart } from "../src/domain";
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
    if (payload.error) throw new Error(payload.error.message);
    return { ...payload, _meta: result._meta };
  };

  const { app, error } = useApp({
    appInfo: { name: "Woven", version: "0.1.0" },
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
  "Retrieving mission context…",
  "Recalling device profile…",
  "Calling start_mission…",
  "Checking live stock across merchants…",
  "Finalising compatible carts…",
];

const narrationText =
  "Three complete carts fit the mission — one pickup location each, every component verified compatible, all under budget. Review the kit below; nothing is charged without your explicit confirmation.";

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
              <h1 className="text-2xl font-semibold tracking-tight text-center">What’s the mission?</h1>
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
                      ? "Mission complete — replay from the header anytime."
                      : "The mission is running above…"}
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
  if (!response.ok || payload.error) throw new Error(payload.error?.message || "Request failed.");
  return payload;
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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const activeCart = useMemo(
    () => view.carts.find((cart) => cart.id === view.selectedCartId) || view.carts[0] || null,
    [view],
  );

  const act = async (label: string, name: string, arguments_: Record<string, unknown>) => {
    setBusy(label);
    setError(null);
    try {
      const payload = await invoke(name, arguments_);
      if (payload.view) setView(payload.view);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
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

  return (
    <main className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-2xl border bg-background shadow-sm">
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
          <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] text-white/60" aria-label="Travel route Singapore to Tokyo">
            <span>SIN</span>
            <span className="h-px w-7 bg-white/25" />
            <Plane className="size-3.5 text-white/80" />
            <span className="h-px w-7 bg-white/25" />
            <span>TYO</span>
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
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="results-heading" className="text-xl font-semibold tracking-tight">Three ways it comes together</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every option is one complete cart from one pickup location.</p>
          </div>
          <span className="microlabel inline-flex items-center gap-1.5 text-muted-foreground">
            <i className="pulse-dot size-1.5 rounded-full bg-emerald-500" /> Live demo stock
          </span>
        </div>

        {view.carts.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {view.carts.map((cart, index) => (
              <CartCard
                key={cart.id}
                cart={cart}
                index={index}
                active={cart.id === activeCart?.id}
                onSelect={() => void act("select", "select_cart", { missionId: view.mission.id, cartId: cart.id })}
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
        <section className="border-t px-6 py-8 sm:px-10">
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
                      <strong className="block text-sm font-medium">{line.name}</strong>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{line.compatibility}</p>
                    </div>
                    <Check className="mt-1 size-4 flex-none text-emerald-600" />
                  </div>
                ))}
              </div>
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
              <small className="mt-3 text-center text-[11px] leading-snug text-white/40">
                No purchase yet. Stock and price are rechecked first.
              </small>
            </aside>
          </div>
        </section>
      )}

      {preview && !view.order && (
        <section className="border-t px-6 py-8 sm:px-10" aria-labelledby="checkout-heading">
          <Kicker number="03" label="The consent boundary" />
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
                <MandateRow label="Merchant" value={preview.mandate.merchantName} />
                <MandateRow label="Pickup" value={preview.mandate.pickupLocation} />
                <MandateRow label="Items" value={String(preview.mandate.lines.length)} />
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
            <em className="truncate not-italic">{line.name}</em>
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
      <h1 className="mt-2 text-lg font-semibold tracking-tight">Mission interrupted</h1>
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

const root = document.getElementById("root");
if (root) createRoot(root).render(window.self === window.top ? <StandaloneDemo /> : <HostedWidget />);
