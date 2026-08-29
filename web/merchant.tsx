import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FlaskConical,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  Upload,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CatalogItem, Order, Scenario } from "../src/domain";
import "./styles.css";

interface Dashboard {
  scenario: Scenario;
  catalog: CatalogItem[];
  orders: Order[];
  audit: Array<{ id: number; event: string; detail: Record<string, unknown>; createdAt: string }>;
}

const scenarios: Array<{ id: Scenario; label: string; detail: string }> = [
  { id: "normal", label: "Normal", detail: "Approval and order succeed" },
  { id: "stockout", label: "Stockout", detail: "Top charger disappears" },
  { id: "price-change", label: "Price change", detail: "Top cart changes by S$10" },
  { id: "auth-decline", label: "Auth decline", detail: "Visa simulation declines" },
  { id: "order-fail", label: "Order failure", detail: "Authorization reverses" },
];

function MerchantDesk() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const response = await fetch("/api/merchant/dashboard");
    if (!response.ok) throw new Error("Could not load merchant data.");
    setData(await response.json() as Dashboard);
  };

  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);

  const mutate = async (label: string, url: string, body: Record<string, unknown> = {}) => {
    setBusy(label);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Update failed.");
      if (result.catalog) setData(result as Dashboard);
      else await load();
      setMessage(label === "csv" ? `Catalog updated: ${result.updated} offers.` : "Demo state updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  };

  const visibleCatalog = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    return needle
      ? data.catalog.filter((item) => `${item.name} ${item.sku} ${item.merchantName} ${item.locationName}`.toLowerCase().includes(needle))
      : data.catalog;
  }, [data, query]);

  const importCsv = async (file?: File) => {
    if (!file) return;
    await mutate("csv", "/api/merchant/catalog", { csv: await file.text() });
    if (fileInput.current) fileInput.current.value = "";
  };

  if (!data) return <div className="desk-loading"><RefreshCw className="spin" /> Opening merchant desk…</div>;

  const available = data.catalog.filter((item) => item.stock > 0).length;
  const merchants = new Set(data.catalog.map((item) => item.merchantId)).size;
  const locations = new Set(data.catalog.map((item) => `${item.merchantId}:${item.locationId}`)).size;

  return (
    <main className="merchant-shell">
      <header className="desk-header">
        <div className="desk-brand"><span className="brand-mark"><Store size={19} /></span><div><strong>MISSIONCART</strong><small>MERCHANT DESK / DEMO CONTROL</small></div></div>
        <div className="desk-actions">
          <a className="secondary-button" href="/demo" target="_blank" rel="noreferrer">Open buyer demo ↗</a>
          <button className="icon-button" title="Refresh" onClick={() => void load()}><RefreshCw size={17} /></button>
        </div>
      </header>

      <section className="desk-intro">
        <div><span className="eyebrow">OPERATIONS / SINGAPORE</span><h1>Commerce simulation desk</h1><p>Change live demo conditions, update inventory, and inspect the authorization trail.</p></div>
        <span className="simulation-seal"><FlaskConical size={18} /> SIMULATED ONLY</span>
      </section>

      <section className="stat-strip">
        <Stat label="MERCHANTS" value={String(merchants)} note={`${locations} pickup locations`} />
        <Stat label="CATALOG OFFERS" value={String(data.catalog.length)} note={`${available} currently available`} />
        <Stat label="ORDERS" value={String(data.orders.length)} note="latest 20 retained" />
        <Stat label="PAYMENT RAIL" value="VISA" note="simulated authorization" accent />
      </section>

      <div className="desk-grid">
        <section className="desk-panel scenario-panel">
          <PanelHeading number="01" title="Demo scenario" note="Applies immediately to the next cart refresh or confirmation." />
          <div className="scenario-list">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={data.scenario === scenario.id ? "active" : ""}
                disabled={busy !== null}
                onClick={() => void mutate("scenario", "/api/merchant/scenario", { scenario: scenario.id })}
              >
                <span className="scenario-radio">{data.scenario === scenario.id && <i />}</span>
                <span><strong>{scenario.label}</strong><small>{scenario.detail}</small></span>
                {data.scenario === scenario.id && <span className="active-tag">ACTIVE</span>}
              </button>
            ))}
          </div>
          <div className="scenario-note"><AlertTriangle size={17} /><p>Price and stock scenarios invalidate an existing preview. Payment failures apply after explicit confirmation.</p></div>
        </section>

        <section className="desk-panel orders-panel">
          <PanelHeading number="02" title="Recent orders" note="Authorization and merchant outcome, newest first." />
          {data.orders.length ? (
            <div className="order-list">
              {data.orders.map((order) => (
                <article key={order.id}>
                  <span className={`order-status ${order.status}`}>{order.status === "confirmed" ? <CheckCircle2 /> : order.status === "authorization_declined" ? <XCircle /> : <AlertTriangle />}</span>
                  <div><strong>{order.merchantName}</strong><small>{order.id} · {new Date(order.createdAt).toLocaleTimeString()}</small></div>
                  <div className="order-amount"><strong>{formatMoney(order.amountCents)}</strong><small>{order.status.replaceAll("_", " ")}</small></div>
                </article>
              ))}
            </div>
          ) : <div className="panel-empty"><WalletCards /><strong>No orders yet</strong><p>Complete the buyer flow to see authorization outcomes here.</p></div>}
        </section>
      </div>

      <section className="desk-panel catalog-panel">
        <PanelHeading number="03" title="Inventory & price feed" note="Seeded offers across every merchant pickup location." />
        <div className="catalog-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU, product, merchant…" /></label>
          <div>
            <a className="secondary-button" href="/api/merchant/catalog.csv"><Download size={15} /> Export CSV</a>
            <button className="secondary-button" onClick={() => fileInput.current?.click()} disabled={busy !== null}><Upload size={15} /> Import updates</button>
            <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event) => void importCsv(event.target.files?.[0])} />
          </div>
        </div>
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead><tr><th>Offer / SKU</th><th>Merchant</th><th>Pickup location</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
            <tbody>
              {visibleCatalog.map((item) => (
                <tr key={item.offerId}>
                  <td><strong>{item.name}</strong><small>{item.sku}</small></td>
                  <td>{item.merchantName}</td>
                  <td>{item.locationName}</td>
                  <td><span className="category-pill">{item.category.replace("_", " ")}</span></td>
                  <td className="mono">{formatMoney(item.priceCents)}</td>
                  <td><span className={`stock-count ${item.stock <= 1 ? "low" : ""}`}><i />{item.stock}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="desk-grid bottom-grid">
        <section className="desk-panel audit-panel">
          <PanelHeading number="04" title="Audit trail" note="No card data—only mission, preview, and result events." />
          <div className="audit-list">
            {data.audit.slice(0, 12).map((entry) => <div key={entry.id}><span>{entry.id.toString().padStart(3, "0")}</span><strong>{entry.event}</strong><small>{new Date(entry.createdAt).toLocaleTimeString()}</small></div>)}
            {!data.audit.length && <div className="panel-empty compact"><PackageCheck /><p>Events will appear as the demo runs.</p></div>}
          </div>
        </section>
        <section className="desk-panel reset-panel">
          <PanelHeading number="05" title="Reset the room" note="Restore seeded stock, normal scenario, and clear demo missions." />
          <RotateCcw size={34} />
          <h3>Clean slate for the next pitch</h3>
          <p>This clears only MissionCart’s local demo database. The source catalog is reseeded immediately.</p>
          <button
            className="danger-button"
            disabled={busy !== null}
            onClick={() => window.confirm("Reset all local MissionCart demo data?") && void mutate("reset", "/api/merchant/reset")}
          >{busy === "reset" ? "Resetting…" : "Reset demo data"}</button>
        </section>
      </div>

      {message && <div className="desk-message" role="status">{message}</div>}
      <footer className="desk-footer"><span>MISSIONCART / MERCHANT OPERATIONS</span><span>Local prototype · simulated Visa rail · {data.scenario} scenario</span></footer>
    </main>
  );
}

function PanelHeading({ number, title, note }: { number: string; title: string; note: string }) {
  return <div className="panel-heading"><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></div>;
}

function Stat({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return <div className={`desk-stat ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function formatMoney(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<MerchantDesk />);
