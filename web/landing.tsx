import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WovenMark } from "./woven-mark";
import buyerShot from "../docs/assets/screenshots/buyer-overview.png";
import checkoutShot from "../docs/assets/screenshots/checkout-confirmation.png";
import merchantShot from "../docs/assets/screenshots/merchant-dashboard.png";
import orderShot from "../docs/assets/screenshots/order-success.png";
import "./styles.css";

const steps = [
  {
    icon: <MessageSquare className="size-5" />,
    title: "Ask once",
    body: "One request in ChatGPT or Codex — devices, destination, budget, pickup — becomes a mission the model hands to Woven's MCP tools.",
  },
  {
    icon: <ListChecks className="size-5" />,
    title: "Review once",
    body: "Three complete carts from one pickup location each, every thread checked for compatibility, live demo stock, and budget.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Confirm once",
    body: "An exact, expiring mandate binds merchant, cart version, and total. Nothing moves until you click confirm.",
  },
];

const trustPoints = [
  ["No credentials, ever", "No card numbers, CVVs, or wallet tokens enter Woven."],
  ["Rechecked twice", "Price and stock are revalidated before preview and again at confirmation."],
  ["Exact, expiring mandate", "Merchant, cart version, and total are bound to one ten-minute confirmation."],
  ["One click, one charge", "Confirmation is idempotent — duplicates can never double-spend stock."],
  ["Declines stay clean", "A declined authorization creates no merchant order."],
  ["Failures reverse", "Merchant failure after authorization automatically enters reversal."],
] as const;

const tools = [
  "start_mission",
  "build_carts",
  "select_cart",
  "create_checkout_preview",
  "confirm_purchase",
  "get_order_status",
];

function Landing() {
  return (
    <div className="bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a className="flex items-center gap-2.5" href="/">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-950">
              <WovenMark className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Woven</span>
            <Badge variant="outline" className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:inline-flex">
              Prototype
            </Badge>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#how">How it works</a>
            <a className="transition-colors hover:text-foreground" href="#product">Product</a>
            <a className="transition-colors hover:text-foreground" href="#trust">Trust</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <a href="/merchant">Merchant desk</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/demo">Run the demo <ArrowRight className="size-3.5" /></a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="absolute -top-24 left-[-10%] h-80 w-[420px] rounded-full bg-lime-400/15 blur-3xl" aria-hidden />
        <div className="absolute right-[-10%] top-16 h-96 w-[520px] rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />

        <svg
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-full w-full lg:block"
          viewBox="0 0 1440 800"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="thread" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#b7f522" />
              <stop offset="1" stopColor="#1545e8" />
            </linearGradient>
          </defs>
          <path
            className="thread-draw"
            d="M-40 620 C 240 620 240 380 460 380 C 660 380 620 560 830 560 C 1060 560 1020 300 1250 300 L 1480 300"
            stroke="url(#thread)"
            strokeOpacity="0.5"
            strokeWidth="2"
            pathLength="1"
          />
          <circle cx="120" cy="620" r="4" fill="#b7f522" className="rise-in [animation-delay:300ms]" />
          <circle cx="1250" cy="300" r="5" fill="#1545e8" stroke="#fcfaf5" strokeWidth="2" className="rise-in [animation-delay:2400ms]" />
        </svg>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pt-28">
          <div className="max-w-2xl">
            <div className="rise-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
              LifeHack 2026 · Agentic commerce · Simulated payments
            </div>
            <h1 className="rise-in mt-6 text-4xl font-semibold leading-[1.05] tracking-tight [animation-delay:120ms] sm:text-6xl">
              Everything you need.
              <br />
              Woven into one choice.
            </h1>
            <p className="rise-in mt-5 max-w-xl text-base leading-relaxed text-white/60 [animation-delay:240ms] sm:text-lg">
              One request inside ChatGPT or Codex becomes complete, compatible, in-stock carts
              from a single pickup location — and nothing is charged until you confirm the
              exact terms.
            </p>
            <div className="rise-in mt-8 flex flex-wrap items-center gap-3 [animation-delay:360ms]">
              <Button variant="inverted" size="lg" asChild>
                <a href="/demo">Run the live demo <ArrowRight className="size-4" /></a>
              </Button>
              <Button size="lg" className="border border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <p className="rise-in mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 [animation-delay:480ms]">
              Ask once · Review once · Confirm once
            </p>
          </div>

          <div className="rise-in relative mt-14 [animation-delay:600ms]">
            <div className="rounded-2xl bg-gradient-to-b from-white/25 via-white/10 to-transparent p-px shadow-[0_40px_120px_-20px_rgba(21,69,232,0.35)]">
              <Window src={buyerShot} alt="Woven buyer experience: one request becomes three complete, compatible carts" url="woven.demo/buyer" eager />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Kicker>How it works</Kicker>
        <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Three moves. One complete kit.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-zinc-950 text-white">{step.icon}</span>
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="border-t bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <Kicker>The product</Kicker>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Every thread checked. Nothing left to connect.
          </h2>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
            <Feature
              title="Review the exact terms"
              body="Before anything is authorized, Woven rechecks price and stock, then binds merchant, pickup, items, and total into one expiring mandate. The Visa authorization is simulated and says so on every surface."
              shot={checkoutShot}
              alt="Woven checkout mandate with the exact merchant, pickup, items, and total"
              url="woven.demo/checkout"
            />
            <Feature
              title="Your yes is the final thread"
              body="A separate, explicit click consumes a private one-time token the model never sees. Success returns a pickup-ready receipt — declines and reversals stay just as visible."
              shot={orderShot}
              alt="Simulated Visa result with pickup receipt and live MCP tool calls"
              url="woven.demo/receipt"
            />
          </div>
          <div className="mt-10">
            <Feature
              wide
              title="Trust you can test live"
              body="The merchant desk flips the demo between normal, stockout, price-change, decline, and reversal scenarios while the audit trail updates — so judges can break it on stage and watch it fail safely."
              shot={merchantShot}
              alt="Woven merchant desk with demo scenarios, inventory, and audit trail"
              url="woven.demo/merchant"
            />
          </div>
        </div>
      </section>

      <section id="trust" className="bg-zinc-950 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Kicker dark>Trust boundaries</Kicker>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                Nothing moves until you confirm.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                The AI recommends. Only you can authorize. These boundaries hold on every
                surface — widget, browser demo, and merchant desk.
              </p>
            </div>
            <Badge variant="visa" className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]">
              Visa authorization · Simulated
            </Badge>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map(([title, body]) => (
              <div key={title} className="bg-zinc-950/90 p-5">
                <div className="flex items-center gap-2">
                  <Check className="size-4 flex-none text-lime-300" />
                  <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/55">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="microlabel mr-1 text-white/40">MCP tools</span>
            {tools.map((tool, index) => (
              <span key={tool} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-1 pl-2.5 pr-3">
                  <Terminal className="size-3 text-white/50" />
                  <code className="font-mono text-[11px] text-white/80">{tool}</code>
                </span>
                {index < tools.length - 1 && <ArrowRight className="size-3 text-white/30" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-24 text-center sm:px-6">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-zinc-950">
          <WovenMark className="size-7" />
        </span>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">See it weave.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The browser demo drives the same server and the same MCP tools as the ChatGPT
          experience — simulated payments, no live charge.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <a href="/demo">Run the live demo <ArrowRight className="size-4" /></a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="https://github.com/Ducksss/LifeHack-2026" target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-muted/40">
        <div className="microlabel mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Woven / LifeHack 2026 prototype</span>
          <span className="flex gap-4">
            <a className="transition-colors hover:text-foreground" href="/demo">Demo</a>
            <a className="transition-colors hover:text-foreground" href="/merchant">Merchant desk</a>
            <a className="transition-colors hover:text-foreground" href="/healthz">Status</a>
          </span>
          <span>Simulated payments · seeded merchants · no live charge</span>
        </div>
      </footer>
    </div>
  );
}

function Window({ src, alt, url, eager = false, className }: { src: string; alt: string; url: string; eager?: boolean; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-[15px] border bg-card", className)}>
      <div className="flex items-center gap-3 border-b bg-muted/60 px-4 py-2.5">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-zinc-300" />
          <i className="size-2.5 rounded-full bg-zinc-300" />
          <i className="size-2.5 rounded-full bg-zinc-300" />
        </span>
        <span className="rounded-md bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">{url}</span>
      </div>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="block w-full" />
    </figure>
  );
}

function Feature({ title, body, shot, alt, url, wide = false }: { title: string; body: string; shot: string; alt: string; url: string; wide?: boolean }) {
  return (
    <div className={cn(wide && "grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]")}>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className={cn("mt-5 rounded-2xl bg-gradient-to-b from-zinc-200 to-transparent p-px", wide && "lg:mt-0")}>
        <Window src={shot} alt={alt} url={url} />
      </div>
    </div>
  );
}

function Kicker({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span className={cn("microlabel", dark ? "text-white/40" : "text-muted-foreground")}>{children}</span>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Landing />);
