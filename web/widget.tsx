import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import {
  BatteryCharging,
  Cable,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Category, MissionView, RankedCart } from "../src/domain";
import "./styles.css";
import { WovenMark } from "./woven-mark";

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

function StandaloneDemo() {
  const [view, setView] = useState<MissionView | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    post("/api/demo/start", { request: canonicalRequest })
      .then((payload) => setView(payload.view!))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Demo failed to start."));
  }, []);

  const invoke: Invoke = async (name, arguments_) => {
    const payload = await post(`/api/tools/${name}`, arguments_);
    if (payload.view) setView(payload.view);
    if (typeof payload._meta?.confirmationNonce === "string") setNonce(payload._meta.confirmationNonce);
    return payload;
  };

  if (error) return <ConnectionError message={error} />;
  if (!view) return <Loading message="Preparing the Tokyo mission…" />;
  return <Woven view={view} setView={setView} nonce={nonce} invoke={invoke} standalone />;
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
  standalone = false,
}: {
  view: MissionView;
  setView: (view: MissionView) => void;
  nonce: string | null;
  invoke: Invoke;
  standalone?: boolean;
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
    <main className="mission-shell">
      {standalone && (
        <div className="demo-ribbon">
          Browser fallback · the same server also runs as a real ChatGPT/Codex MCP app
          <a href="/merchant" target="_blank" rel="noreferrer">Merchant desk ↗</a>
        </div>
      )}

      <header className="mission-header">
        <div className="brand-lockup">
          <span className="brand-mark"><WovenMark /></span>
          <span>WOVEN</span>
          <span className="prototype-tag">PROTOTYPE</span>
        </div>
        <div className="route-line" aria-label="Travel route Singapore to Tokyo">
          <span>SIN</span><span className="route-rule"><Plane size={16} /></span><span>TYO</span>
        </div>
        <h1>Everything you need.<br /><em>Woven</em> into one choice.</h1>
        <p className="mission-request">“{view.mission.request}”</p>
        <div className="constraint-row">
          <Constraint label="BUDGET" value={formatMoney(view.mission.budgetCents)} />
          <Constraint label="PICKUP" value="Today" />
          <Constraint label="DESTINATION" value={view.mission.destination} />
          <Constraint label="DEVICES" value="3 verified" />
        </div>
        <button className="assumptions-toggle" onClick={() => setAssumptionsOpen((open) => !open)} aria-expanded={assumptionsOpen}>
          Assumptions & boundaries <ChevronDown size={15} className={assumptionsOpen ? "rotate" : ""} />
        </button>
        {assumptionsOpen && (
          <ul className="assumption-list">
            {view.mission.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        )}
      </header>

      <section className="results-section" aria-labelledby="results-heading">
        <div className="section-kicker"><span>01</span><div /><span>{view.carts.length} COMPLETE OPTIONS</span></div>
        <div className="section-title-row">
          <div>
            <h2 id="results-heading">Three ways it comes together</h2>
            <p>Every option is one complete cart from one pickup location.</p>
          </div>
          <span className="live-stock"><i /> LIVE DEMO STOCK</span>
        </div>

        {view.carts.length ? (
          <div className="cart-grid">
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
          <div className="empty-state"><TriangleAlert /><h3>No complete kit right now</h3><p>Relax one hard constraint or ask the merchant to restore inventory.</p></div>
        )}
      </section>

      {activeCart && (
        <section className="compatibility-section">
          <div className="section-kicker"><span>02</span><div /><span>EVERY THREAD CHECKED</span></div>
          <div className="proof-layout">
            <div>
              <h2>Nothing left to connect</h2>
              <p>Woven checks the whole setup—not isolated products or sponsored links.</p>
              <div className="proof-list">
                {activeCart.lines.map((line) => (
                  <div className="proof-row" key={line.offerId}>
                    <span className="proof-icon">{categoryIcon(line.category)}</span>
                    <div><strong>{line.name}</strong><p>{line.compatibility}</p></div>
                    <Check size={18} className="proof-check" />
                  </div>
                ))}
              </div>
            </div>
            <aside className="pickup-card">
              <span className="tiny-label">SELECTED PICKUP</span>
              <Store size={24} />
              <h3>{activeCart.merchantName}</h3>
              <p>{activeCart.locationName}</p>
              <span><MapPin size={14} />{activeCart.address}</span>
              <span><Clock3 size={14} />Ready in ~{activeCart.pickupMinutes} min</span>
              <div className="pickup-total"><span>Total</span><strong>{formatMoney(activeCart.totalCents)}</strong></div>
              <button
                className="primary-button"
                disabled={busy !== null}
                onClick={() => void act("preview", "create_checkout_preview", { missionId: view.mission.id, cartId: activeCart.id })}
              >
                {busy === "preview" ? "Revalidating…" : "Review checkout"}
              </button>
              <small>No purchase yet. Stock and price are rechecked first.</small>
            </aside>
          </div>
        </section>
      )}

      {preview && !view.order && (
        <section className="checkout-section" aria-labelledby="checkout-heading">
          <div className="section-kicker"><span>03</span><div /><span>THE CONSENT BOUNDARY</span></div>
          <div className="checkout-card">
            <div className="checkout-summary">
              <span className="visa-sim"><CreditCard size={17} /> VISA AUTHORIZATION · SIMULATED</span>
              <h2 id="checkout-heading">Review the exact terms</h2>
              <p>This one click authorizes only this merchant, cart version, and total. It expires at {formatTime(preview.expiresAt)}.</p>
              <dl>
                <div><dt>Merchant</dt><dd>{preview.mandate.merchantName}</dd></div>
                <div><dt>Pickup</dt><dd>{preview.mandate.pickupLocation}</dd></div>
                <div><dt>Items</dt><dd>{preview.mandate.lines.length}</dd></div>
                <div className="mandate-total"><dt>Authorized total</dt><dd>{formatMoney(preview.mandate.amountCents)}</dd></div>
              </dl>
            </div>
            <div className="confirmation-panel">
              <ShieldCheck size={34} />
              <h3>Your yes is the final thread.</h3>
              <p>No card credentials enter Woven. The demo returns a simulated network authorization.</p>
              <button className="confirm-button" disabled={busy !== null || !nonce} onClick={confirm}>
                {busy === "confirm" ? "Authorizing…" : `Confirm ${formatMoney(preview.mandate.amountCents)}`}
              </button>
              <small>Explicit confirmation required · no background charge</small>
            </div>
          </div>
        </section>
      )}

      {view.order && <OrderResult view={view} />}
      {error && <div className="error-toast" role="alert"><TriangleAlert size={17} />{error}</div>}

      <footer>
        <span>WOVEN / AGENTIC COMMERCE PROTOTYPE</span>
        <span>Simulated payments · seeded merchants · no live charge</span>
      </footer>
    </main>
  );
}

function CartCard({ cart, index, active, onSelect }: { cart: RankedCart; index: number; active: boolean; onSelect: () => void }) {
  return (
    <button className={`cart-card ${active ? "active" : ""}`} onClick={onSelect} aria-pressed={active}>
      <div className="cart-card-top">
        <span className={`rank-badge rank-${index}`}>{cart.badge}</span>
        <span className="cart-number">0{index + 1}</span>
      </div>
      <h3>{cart.merchantName}</h3>
      <p className="location"><MapPin size={14} /> {cart.locationName}</p>
      <div className="mini-lines">
        {cart.lines.map((line) => <span key={line.offerId}>{categoryIcon(line.category)}<em>{line.name}</em></span>)}
      </div>
      <div className="cart-meta">
        <span><Clock3 size={14} />~{cart.pickupMinutes} min</span>
        <strong>{formatMoney(cart.totalCents)}</strong>
      </div>
      <span className="card-action">{active ? "Viewing kit" : "View this kit"} <span>→</span></span>
    </button>
  );
}

function OrderResult({ view }: { view: MissionView }) {
  const order = view.order!;
  const success = order.status === "confirmed";
  return (
    <section className={`order-result ${success ? "success" : "warning"}`}>
      <span className="result-icon">{success ? <Check size={32} /> : <TriangleAlert size={30} />}</span>
      <div>
        <span className="tiny-label">SIMULATED VISA RESULT</span>
        <h2>{success ? "Kit reserved. Everything aligned." : order.status === "authorization_declined" ? "Authorization declined" : "Order failed · reversal started"}</h2>
        <p>{success ? `Pickup at ${order.pickupLocation}. Show receipt ${order.receiptNumber}.` : "No successful charge was completed. Use the merchant desk to restore the normal scenario."}</p>
      </div>
      <dl>
        <div><dt>Order</dt><dd>{order.id}</dd></div>
        <div><dt>Total</dt><dd>{formatMoney(order.amountCents)}</dd></div>
        <div><dt>Authorization</dt><dd>{order.authorizationCode || "DECLINED"}</dd></div>
      </dl>
    </section>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return <div className="constraint"><span>{label}</span><strong>{value}</strong></div>;
}

function Loading({ message }: { message: string }) {
  return <main className="loading-shell"><span className="brand-mark"><WovenMark /></span><h1>WOVEN</h1><div className="loading-rule"><i /></div><p>{message}</p></main>;
}

function ConnectionError({ message }: { message: string }) {
  return <main className="loading-shell error"><TriangleAlert size={34} /><h1>Mission interrupted</h1><p>{message}</p></main>;
}

function categoryIcon(category: Category) {
  if (category === "charger") return <BatteryCharging size={16} />;
  if (category === "adapter") return <Sparkles size={16} />;
  return <Cable size={16} />;
}

function formatMoney(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

const root = document.getElementById("root");
if (root) createRoot(root).render(window.self === window.top ? <StandaloneDemo /> : <HostedWidget />);
