import {
  AppWindow,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  Copy,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Puzzle,
  Search,
  Settings,
  ShieldCheck,
  SquareTerminal,
  Table2,
  Terminal,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WovenMark } from "./woven-mark";
import "./styles.css";

const canonicalPrompt = "Build a rainy-weekend camping kit for 2 under S$300, one car boot, pickup today.";

const toolNames = [
  "start_mission",
  "build_carts",
  "select_cart",
  "swap_cart_item",
  "start_demo_identity",
  "create_checkout_preview",
  "confirm_purchase",
  "get_order_status",
  "verify_receipt",
];

// Neutral stand-ins for the other installed plugins — never real product logos.
const placeholderTiles = [Mail, CalendarDays, FileText, MessageSquare, Table2, Camera];

const expectedCarts = [
  { merchant: "TrailHaus", total: "S$231.00", badge: "Best match" },
  { merchant: "CampWorks", total: "S$203.00", badge: "Best value" },
  { merchant: "Outpost Supply", total: "S$258.00", badge: null },
];

const quickFixes = [
  {
    symptom: "Woven Local is missing from Plugins",
    fix: "Confirm .agents/plugins/marketplace.json exists, reopen this repository, then fully restart the ChatGPT desktop app.",
  },
  {
    symptom: "Woven is installed but the tools are missing",
    fix: "Start a new task or conversation — plugin changes are not injected into an already-running session.",
  },
  {
    symptom: "The bundled MCP server cannot launch",
    fix: "Run npm ci and npm run build, remove and reinstall Woven, then start a new task. Port 8788 is used only for the demo identity handoff.",
  },
  {
    symptom: "ChatGPT cannot connect",
    fix: "Serve Woven over public HTTPS, include the /mcp path, and set BASE_URL to the exact same origin.",
  },
];

type PathId = "desktop" | "cli" | "chatgpt";

const paths: Array<{ id: PathId; icon: ReactNode; title: string; hint: string }> = [
  { id: "desktop", icon: <AppWindow className="size-4" />, title: "Codex desktop", hint: "ChatGPT desktop app · recommended" },
  { id: "cli", icon: <SquareTerminal className="size-4" />, title: "Codex CLI", hint: "Terminal install, same plugin" },
  { id: "chatgpt", icon: <Globe className="size-4" />, title: "ChatGPT", hint: "Developer Mode · needs public HTTPS" },
];

function InstallGuide() {
  const [path, setPath] = useState<PathId>("desktop");
  const [installed, setInstalled] = useState(false);
  const origin = useMemo(() => window.location.origin, []);
  const localOrigin = /localhost|127\.0\.0\.1/.test(origin);

  const scrollToPaths = () => document.getElementById("install-paths")?.scrollIntoView({ behavior: "smooth" });
  const installWoven = () => {
    setInstalled(true);
    // Let the tile land in the Installed row before moving on to the real steps.
    setTimeout(scrollToPaths, 900);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-zinc-950">
            <WovenMark className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Woven</span>
          <Badge variant="secondary" className="hidden font-mono text-[10px] uppercase tracking-[0.1em] sm:inline-flex">
            Install guide
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/demo" target="_blank" rel="noreferrer">
              Live rehearsal <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/merchant" target="_blank" rel="noreferrer">
              Merchant desk <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-4 pb-6 pt-8 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl bg-zinc-950 px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="hero-grid absolute inset-0" aria-hidden />
          <div className="absolute -top-32 right-[-10%] h-72 w-[480px] rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <Badge variant="outline" className="border-white/25 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70">
              Plugin · v0.2.1
            </Badge>
            <div
              className="flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] text-white/60"
              aria-label="From this repository into your chat host"
            >
              <span>REPO</span>
              <span className="h-px w-7 bg-white/25" />
              <Puzzle className="size-3.5 text-white/80" />
              <span className="h-px w-7 bg-white/25" />
              <span>HOST</span>
            </div>
          </div>

          <h1 className="relative mt-8 max-w-xl text-3xl font-semibold leading-[1.08] tracking-tight sm:text-[40px]">
            Install once.
            <br />
            Ask anywhere.
          </h1>
          <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
            Woven is an MCP App for ChatGPT and Codex. Install the local plugin in about two minutes, or connect it to
            ChatGPT over HTTPS — every path ends at the same nine tools and the same explicit confirmation.
          </p>

          <div className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
            <HeroStat label="Install paths" value="3" />
            <HeroStat label="MCP tools" value="9" />
            <HeroStat label="Setup time" value="~2 min" />
            <HeroStat label="Live charges" value="None · simulated" />
          </div>
        </section>

        <section className="mt-12" aria-labelledby="listing-heading">
          <Kicker number="01" label="The plugins tab" />
          <h2 id="listing-heading" className="mt-3 text-xl font-semibold tracking-tight">How Woven shows up</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A one-to-one preview of the Plugins tab in the ChatGPT desktop app — search, your installed plugins, then
            the Woven Local source with Woven ready to install. Installation happens inside your host, not on this page.
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border shadow-sm">
            <div className="grid grid-cols-[auto_1fr_auto] items-center border-b bg-muted/40 px-4 py-2.5">
              <span className="flex items-center gap-1.5" aria-hidden>
                <i className="size-2.5 rounded-full bg-zinc-300" />
                <i className="size-2.5 rounded-full bg-zinc-300" />
                <i className="size-2.5 rounded-full bg-zinc-300" />
              </span>
              <span className="microlabel text-center text-muted-foreground">Plugins · listing preview</span>
              <span className="w-12" aria-hidden />
            </div>
            <div className="p-5 sm:p-8">
              <h3 className="text-2xl font-semibold tracking-tight">Plugins</h3>
              <p className="mt-1 text-sm text-muted-foreground">Work with Codex across your favorite tools</p>

              <div aria-hidden className="mt-5 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                <Search className="size-4" /> Search plugins
              </div>

              <div className="mt-7 flex items-center justify-between">
                <h4 className="text-base font-semibold tracking-tight">Installed</h4>
                <Settings aria-hidden className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {installed && (
                  <span
                    className="rise-in grid size-10 place-items-center rounded-lg bg-zinc-950 ring-2 ring-zinc-950 ring-offset-2 ring-offset-background"
                    title="Woven — just installed"
                  >
                    <WovenMark className="size-6" />
                  </span>
                )}
                {placeholderTiles.map((Tile, index) => (
                  <span
                    key={index}
                    aria-hidden
                    className="grid size-10 place-items-center rounded-lg border bg-muted/50 text-muted-foreground/50"
                  >
                    <Tile className="size-4" />
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background">Woven Local</span>
                <span className="rounded-full border px-3.5 py-1.5 text-sm text-muted-foreground">Public</span>
                <span className="rounded-full border px-3.5 py-1.5 text-sm text-muted-foreground">Personal</span>
                <span className="microlabel ml-1 text-muted-foreground">marketplace source · this repository</span>
              </div>

              <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 flex-none place-items-center rounded-lg bg-zinc-950">
                    <WovenMark className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold tracking-tight">Woven</strong>
                    <p className="m-0 truncate text-sm text-muted-foreground">Everything works together.</p>
                  </div>
                  {installed ? (
                    <span className="inline-flex flex-none items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground">
                      <Check className="size-3.5 text-emerald-600" /> Installed
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-none rounded-full px-4" onClick={installWoven}>
                      <Plus className="size-3.5" /> Install
                    </Button>
                  )}
                  <MoreHorizontal aria-hidden className="size-4 flex-none text-muted-foreground/50" />
                </div>
              </div>

              <h4 className="mt-9 text-base font-semibold tracking-tight">Popular</h4>
              <div aria-hidden className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {[112, 84, 96, 72].map((width, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="size-11 flex-none rounded-lg bg-muted" />
                    <span className="min-w-0 flex-1 space-y-2">
                      <span className="block h-3 rounded bg-muted" style={{ width }} />
                      <span className="block h-2.5 w-3/5 rounded bg-muted/70" />
                    </span>
                    <span className="h-8 w-20 flex-none rounded-full bg-muted/60" />
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                In the real Plugins tab the plus button installs Woven. Here it just plays the moment — watch it land in
                Installed — then drops you at the real steps below. Directory listings are shown as neutral placeholders.
              </p>
            </div>
          </div>
        </section>

        <section id="install-paths" className="mt-14 scroll-mt-6" aria-labelledby="paths-heading">
          <Kicker number="02" label="Three ways in" />
          <h2 id="paths-heading" className="mt-3 text-xl font-semibold tracking-tight">Pick your host</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every path uses the same repository and ends at the same widget. Start with one verification pass from the
            repository root (Node.js 22.5 or newer):
          </p>

          <CodeBlock className="mt-4" label="one-time setup" lines={["node --version", "npm ci", "npm run check"]} />

          <div className="mt-6 grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Installation paths">
            {paths.map((option) => (
              <button
                key={option.id}
                role="tab"
                aria-selected={path === option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                  path === option.id && "border-zinc-950 ring-1 ring-zinc-950 hover:border-zinc-950",
                )}
                onClick={() => setPath(option.id)}
              >
                <span className="grid size-8 flex-none place-items-center rounded-md border bg-muted/50">{option.icon}</span>
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold tracking-tight">{option.title}</strong>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border p-5 sm:p-7" role="tabpanel">
            {path === "desktop" && (
              <ol className="m-0 list-none space-y-5 p-0">
                <Step number={1}>Open this repository as a Codex project in the ChatGPT desktop app.</Step>
                <Step number={2}>
                  Fully quit and reopen the app — the restart makes it reread the repository marketplace file.
                </Step>
                <Step number={3}>
                  Open <strong>Plugins</strong> and select the <strong>Woven Local</strong> marketplace source.
                </Step>
                <Step number={4}>
                  Open <strong>Woven</strong>, then select the plus button to install it — exactly like the preview above.
                </Step>
                <Step number={5}>
                  Start a <strong>new Codex task</strong> and ask:
                  <PromptLine />
                </Step>
                <li className="flex gap-3 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 flex-none" />
                  <span>
                    No <code className="font-mono">npm start</code> needed on this path. The plugin host launches the
                    bundled stdio server itself. The Choice Center is self-contained; port 8788 supports only the demo identity handoff.
                  </span>
                </li>
              </ol>
            )}

            {path === "cli" && (
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The CLI registers the same repository marketplace. Replace the example path with the absolute path to
                  your clone, then start a new session before using Woven.
                </p>
                <CodeBlock
                  className="mt-4"
                  label="codex cli"
                  lines={[
                    "codex plugin marketplace add /absolute/path/to/LifeHack-2026",
                    "codex plugin marketplace list",
                    "codex plugin add woven@woven-local --json",
                    "codex plugin list --json",
                    "codex",
                  ]}
                />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  The two JSON commands should report <code className="font-mono text-xs">woven-local</code> and an
                  installed, enabled <code className="font-mono text-xs">woven@woven-local</code>. You can also install
                  through <code className="font-mono text-xs">/plugins</code> by choosing <strong>Woven Local</strong> and{" "}
                  <strong>Woven</strong>.
                </p>
                <p className="mt-3 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                  Plugins are not available in the Codex IDE extension — use ChatGPT desktop or the Codex CLI.
                </p>
              </div>
            )}

            {path === "chatgpt" && (
              <ol className="m-0 list-none space-y-5 p-0">
                <Step number={1}>
                  Serve Woven from a public HTTPS origin. ChatGPT cannot reach localhost.
                  <CodeBlock className="mt-3" label="server" lines={["BASE_URL=https://your-public-origin.example npm start"]} />
                  {localOrigin && (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      This page is currently served from <code className="font-mono">{origin}</code>, which stays local —
                      use a tunnel or deployment for this path.
                    </span>
                  )}
                </Step>
                <Step number={2}>
                  Verify the public health endpoint returns{" "}
                  <code className="font-mono text-xs">{'{"ok":true,"service":"woven",…}'}</code>.
                  <CodeBlock className="mt-3" label="verify" lines={["curl https://your-public-origin.example/healthz"]} />
                </Step>
                <Step number={3}>
                  In ChatGPT, open <strong>Settings → Security and login</strong> and enable <strong>Developer mode</strong>.
                </Step>
                <Step number={4}>
                  Open <strong>Plugins</strong>, select the plus button, and create a plugin named <strong>Woven</strong>{" "}
                  with the MCP endpoint <code className="font-mono text-xs">https://your-public-origin.example/mcp</code>.
                </Step>
                <Step number={5}>
                  Review the discovered tools, create the connection, then install <strong>Woven</strong> under{" "}
                  <strong>Personal plugins</strong>.
                </Step>
                <Step number={6}>
                  Start a new conversation, type <code className="font-mono text-xs">@</code>, select <strong>Woven</strong>,
                  and send:
                  <PromptLine />
                </Step>
              </ol>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-4">
            <div className="flex items-start gap-3">
              <Play className="mt-0.5 size-4 flex-none text-muted-foreground" />
              <div>
                <strong className="block text-sm font-medium">No plugin host handy?</strong>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Run <code className="font-mono">npm start</code> and open the labeled rehearsal at{" "}
                  <code className="font-mono">/demo</code> — same store, same rules, nothing to install.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/demo" target="_blank" rel="noreferrer">
                Open the rehearsal <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="verify-heading">
          <Kicker number="03" label="Prove it works" />
          <h2 id="verify-heading" className="mt-3 text-xl font-semibold tracking-tight">What a good install looks like</h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul className="m-0 list-none space-y-0 divide-y rounded-xl border p-0">
              <Expectation>Woven is shown as installed and enabled in your host.</Expectation>
              <Expectation>
                A new task or conversation can call nine Woven tools:
                <span className="mt-2.5 flex flex-wrap gap-1.5">
                  {toolNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 py-1 pl-2 pr-2.5">
                      <Terminal className="size-3 text-muted-foreground" />
                      <code className="font-mono text-[11px]">{name}</code>
                    </span>
                  ))}
                </span>
              </Expectation>
              <Expectation>The Choice Center opens with five complete one-location carts for the first ask.</Expectation>
              <Expectation>Selecting a cart changes no inventory and makes no purchase.</Expectation>
              <Expectation>
                The server-enforced demo identity handoff comes first. Then <strong>Review checkout</strong> creates an
                exact ten-minute preview, and only the separate <strong>Confirm S$231.00</strong> action produces the
                clearly labeled simulated Visa result and pickup receipt.
              </Expectation>
            </ul>

            <aside className="flex flex-col self-start rounded-xl bg-zinc-950 p-6 text-white">
              <span className="microlabel text-white/40">First ask</span>
              <p className="mt-3 text-sm leading-relaxed text-white/85">“{canonicalPrompt}”</p>
              <CopyButton
                text={canonicalPrompt}
                className="mt-3 self-start border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                label="Copy prompt"
              />
              <div className="mt-5 border-t border-white/10 pt-4">
                <span className="microlabel text-white/40">Expected carts</span>
                <dl className="mt-2.5">
                  {expectedCarts.map((cart) => (
                    <div key={cart.merchant} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <dt className="flex items-center gap-2 text-white/70">
                        {cart.merchant}
                        {cart.badge && (
                          <span className="microlabel rounded bg-white/10 px-1.5 py-0.5 text-white/60">{cart.badge}</span>
                        )}
                      </dt>
                      <dd className="m-0 font-mono text-white/85">{cart.total}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <small className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-snug text-white/40">
                Simulated Visa authorization · seeded demo stock · no live charge
              </small>
            </aside>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="fixes-heading">
          <Kicker number="04" label="When it doesn't" />
          <h2 id="fixes-heading" className="mt-3 text-xl font-semibold tracking-tight">Quick fixes</h2>
          <div className="mt-5 divide-y rounded-xl border">
            {quickFixes.map((entry) => (
              <div key={entry.symptom} className="grid gap-1.5 p-4 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-6 sm:px-5">
                <strong className="text-sm font-medium">{entry.symptom}</strong>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">{entry.fix}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The full guide with expected outputs lives at <code className="font-mono">docs/INSTALLATION.md</code> in the
            repository.
          </p>
        </section>

        <footer className="microlabel mt-14 flex flex-col gap-1 border-t py-6 text-muted-foreground sm:flex-row sm:justify-between">
          <span>Woven / Agentic commerce prototype</span>
          <span>Simulated payments · seeded merchants · no live charge</span>
        </footer>
      </main>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/90 px-4 py-3">
      <span className="microlabel block text-white/40">{label}</span>
      <strong className="mt-1 block text-sm font-medium text-white">{value}</strong>
    </div>
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

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-6 flex-none place-items-center rounded-full border font-mono text-[11px]">{number}</span>
      <div className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed">{children}</div>
    </li>
  );
}

function Expectation({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 p-4 sm:px-5">
      <Check className="mt-0.5 size-4 flex-none text-emerald-600" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">{children}</div>
    </li>
  );
}

function PromptLine() {
  return (
    <span className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 py-2 pl-3 pr-2">
      <em className="min-w-0 flex-1 text-[13px] not-italic leading-relaxed">“{canonicalPrompt}”</em>
      <CopyButton text={canonicalPrompt} label="Copy" />
    </span>
  );
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Embedded webviews can deny the async Clipboard API; fall back to a selection copy.
    const scratch = document.createElement("textarea");
    scratch.value = value;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.opacity = "0";
    document.body.appendChild(scratch);
    scratch.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      scratch.remove();
    }
  }
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={() => {
        void copyText(text).then((done) => {
          if (!done) return;
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function CodeBlock({ lines, label, className }: { lines: string[]; label: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg bg-zinc-950", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="microlabel text-white/40">{label}</span>
        <CopyButton
          text={lines.join("\n")}
          label="Copy"
          className="border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="m-0 overflow-x-auto px-4 py-3">
        {lines.map((line) => (
          <code key={line} className="block font-mono text-xs leading-6 text-white/85">
            <span aria-hidden className="select-none text-white/30">$ </span>
            {line}
          </code>
        ))}
      </pre>
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<InstallGuide />);
