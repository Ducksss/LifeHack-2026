import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FlaskConical,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { CatalogItem, MerchantAlternative, Order, Scenario } from "../src/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { WovenMark } from "./woven-mark";
import "./styles.css";

interface Dashboard {
  scenario: Scenario;
  catalog: CatalogItem[];
  alternatives: MerchantAlternative[];
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

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2.5 text-sm text-muted-foreground">
        <RefreshCw className="size-4 animate-spin" /> Opening merchant desk…
      </div>
    );
  }

  const available = data.catalog.filter((item) => item.stock > 0).length;
  const merchants = new Set(data.catalog.map((item) => item.merchantId)).size;
  const locations = new Set(data.catalog.map((item) => `${item.merchantId}:${item.locationId}`)).size;
  const activeAlternatives = data.alternatives.filter((alternative) => alternative.active).length;

  return (
    <main className="mx-auto w-full max-w-[1220px] px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-950">
            <WovenMark className="size-5" />
          </span>
          <div className="leading-tight">
            <strong className="block text-sm font-semibold tracking-tight">Woven</strong>
            <small className="microlabel text-muted-foreground">Merchant desk / demo control</small>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/demo" target="_blank" rel="noreferrer">
              Open buyer demo <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button variant="outline" size="icon-sm" title="Refresh" onClick={() => void load()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            disabled={busy !== null}
            onClick={() => window.confirm("Reset all local Woven demo data?") && void mutate("reset", "/api/merchant/reset")}
          >
            <RotateCcw className="size-3.5" /> {busy === "reset" ? "Resetting…" : "Reset demo"}
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Commerce simulation desk</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Change live demo conditions, update inventory, and inspect the authorization trail.
          </p>
        </div>
        <Badge variant="visa" className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]">
          <FlaskConical className="size-3.5" /> Simulated only
        </Badge>
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        <Stat label="Merchants" value={String(merchants)} note={`${locations} pickup locations`} />
        <Stat label="Catalog offers" value={String(data.catalog.length)} note={`${available} currently available`} />
        <Stat label="Orders" value={String(data.orders.length)} note="latest 20 retained" />
        <Stat label="Approved swaps" value={String(activeAlternatives)} note={`${data.alternatives.length} merchant rules`} accent />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="gap-4">
          <PanelHeading title="Demo scenario" note="Applies immediately to the next cart refresh or confirmation." />
          <CardContent>
            <div className="grid gap-2">
              {scenarios.map((scenario) => {
                const active = data.scenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[16px_1fr_auto] items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
                      active && "border-zinc-950 bg-muted/60 hover:bg-muted/60",
                    )}
                    disabled={busy !== null}
                    onClick={() => void mutate("scenario", "/api/merchant/scenario", { scenario: scenario.id })}
                  >
                    <span className={cn("grid size-4 place-items-center rounded-full border", active && "border-zinc-950")}>
                      {active && <i className="size-2 rounded-full bg-zinc-950" />}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-medium">{scenario.label}</strong>
                      <small className="block text-xs text-muted-foreground">{scenario.detail}</small>
                    </span>
                    {active && <Badge className="font-mono text-[10px] uppercase tracking-[0.08em]">Active</Badge>}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 flex-none" />
              <p className="text-xs leading-relaxed">
                Price and stock scenarios invalidate an existing preview. Payment failures apply after explicit confirmation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <PanelHeading title="Recent orders" note="Authorization and merchant outcome, newest first." />
          <CardContent>
            {data.orders.length ? (
              <div>
                {data.orders.map((order) => (
                  <article key={order.id} className="flex items-center gap-3 border-b py-3 last:border-0">
                    <span
                      className={cn(
                        "grid size-8 flex-none place-items-center rounded-full [&>svg]:size-4",
                        order.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                      )}
                    >
                      {order.status === "confirmed" ? <CheckCircle2 /> : order.status === "authorization_declined" ? <XCircle /> : <AlertTriangle />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-medium">{order.merchantName}</strong>
                      <small className="block font-mono text-[11px] text-muted-foreground">
                        {order.id} · {new Date(order.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                    <div className="text-right">
                      <strong className="block text-sm font-semibold">{formatMoney(order.amountCents)}</strong>
                      <small className="block text-[11px] text-muted-foreground">{order.status.replaceAll("_", " ")}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={<WalletCards />} title="No orders yet" note="Complete the buyer flow to see authorization outcomes here." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 gap-4">
        <PanelHeading title="Approved alternatives" note="Publish or withdraw compatible substitutions used inside complete Woven carts." />
        <CardContent>
          <div className="grid gap-2 lg:grid-cols-2">
            {data.alternatives.map((alternative) => (
              <article key={`${alternative.fromOfferId}:${alternative.toOfferId}`} className="flex items-center gap-3 rounded-lg border p-3.5">
                <span className={cn("grid size-8 flex-none place-items-center rounded-full", alternative.active ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground")}>
                  <ArrowRight className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-medium">{alternative.fromName}</strong>
                  <small className="block truncate text-xs text-muted-foreground">to {alternative.toName}</small>
                  <small className="mt-1 block font-mono text-[10px] text-muted-foreground">{alternative.merchantName} · {alternative.locationName}</small>
                </div>
                <button
                  className={cn(
                    "relative h-6 w-11 flex-none cursor-pointer rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    alternative.active ? "bg-zinc-950" : "bg-zinc-300",
                  )}
                  role="switch"
                  aria-checked={alternative.active}
                  aria-label={`${alternative.active ? "Withdraw" : "Publish"} ${alternative.toName}`}
                  disabled={busy !== null}
                  onClick={() => void mutate("alternative", "/api/merchant/alternative", {
                    fromOfferId: alternative.fromOfferId,
                    toOfferId: alternative.toOfferId,
                    active: !alternative.active,
                  })}
                >
                  <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", alternative.active ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Withdrawing a rule removes that swap from fresh buyer choices and invalidates any unconfirmed custom cart that depends on it.</p>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-4">
        <PanelHeading title="Inventory & price feed" note="Seeded offers across every merchant pickup location." />
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search SKU, product, merchant…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/api/merchant/catalog.csv"><Download className="size-3.5" /> Export CSV</a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={busy !== null}>
                <Upload className="size-3.5" /> Import updates
              </Button>
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void importCsv(event.target.files?.[0])}
              />
            </div>
          </div>
          <div className="mt-4 max-h-[410px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Offer / SKU</TableHead>
                  <TableHead className="text-xs">Merchant</TableHead>
                  <TableHead className="text-xs">Pickup location</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCatalog.map((item) => (
                  <TableRow key={item.offerId}>
                    <TableCell className="min-w-56">
                      <strong className="block text-sm font-medium">{item.name}</strong>
                      <small className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{item.sku}</small>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.merchantName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.locationName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.06em]">
                        {item.category.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatMoney(item.priceCents)}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", item.stock <= 1 && "text-red-600")}>
                        <i className={cn("size-1.5 rounded-full", item.stock <= 1 ? "bg-red-500" : "bg-emerald-500")} />
                        {item.stock}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-4">
        <PanelHeading title="Audit trail" note="No card data—only mission, preview, and result events." />
        <CardContent>
          <div>
            {data.audit.slice(0, 12).map((entry) => (
              <div key={entry.id} className="grid grid-cols-[40px_1fr_auto] items-center gap-2 border-b py-2 font-mono text-[11px] last:border-0">
                <span className="text-muted-foreground">{entry.id.toString().padStart(3, "0")}</span>
                <strong className="truncate font-medium">{entry.event}</strong>
                <small className="text-muted-foreground">{new Date(entry.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
            {!data.audit.length && (
              <EmptyState compact icon={<PackageCheck />} note="Events will appear as the demo runs." />
            )}
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className="fixed bottom-5 right-5 z-20 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white shadow-lg" role="status">
          {message}
        </div>
      )}

      <footer className="microlabel mt-8 flex flex-col gap-1 text-muted-foreground sm:flex-row sm:justify-between">
        <span>Woven / Merchant operations</span>
        <span>Local prototype · simulated Visa rail · {data.scenario} scenario</span>
      </footer>
    </main>
  );
}

function PanelHeading({ title, note }: { title: string; note: string }) {
  return (
    <CardHeader className="gap-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground">{note}</p>
    </CardHeader>
  );
}

function Stat({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <span className="microlabel text-muted-foreground">{label}</span>
      <strong className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight">
        {value}
        {accent && <i className="size-2 rounded-full bg-visa" />}
      </strong>
      <small className="mt-0.5 block text-xs text-muted-foreground">{note}</small>
    </div>
  );
}

function EmptyState({ icon, title, note, compact = false }: { icon: ReactNode; title?: string; note: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center content-center gap-1.5 rounded-lg border border-dashed p-6 text-center",
        compact ? "min-h-24 border-0" : "min-h-40",
      )}
    >
      <span className="text-muted-foreground [&>svg]:size-5">{icon}</span>
      {title && <strong className="text-sm font-semibold tracking-tight">{title}</strong>}
      <p className="max-w-72 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function formatMoney(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<MerchantDesk />);
