import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { WovenMark } from "./woven-mark";
import "./styles.css";

interface IdentityRequest {
  requestId: string;
  clientName: string;
  displayLabel: string;
  expiresAt: string;
}

const params = new URLSearchParams(window.location.search);
const requestId = params.get("request_id");
const state = params.get("state");
const complete = params.has("complete");
const callbackError = params.get("error");

function IdentityPage() {
  const [request, setRequest] = useState<IdentityRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(callbackError);

  useEffect(() => {
    if (!requestId || !state || complete || callbackError) return;
    fetch(`/api/demo-identity/requests/${encodeURIComponent(requestId)}?state=${encodeURIComponent(state)}`)
      .then(async (response) => {
        const payload = await response.json() as { request?: IdentityRequest; error?: { message?: string } };
        if (!response.ok || !payload.request) throw new Error(payload.error?.message || "This demo request is unavailable.");
        setRequest(payload.request);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "This demo request is unavailable."));
  }, []);

  const authorize = async () => {
    if (!requestId || !state) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/demo-identity/authorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId, state }),
      });
      const payload = await response.json() as { redirectUrl?: string; error?: { message?: string } };
      if (!response.ok || !payload.redirectUrl) throw new Error(payload.error?.message || "Demo authorization failed.");
      window.location.assign(payload.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo authorization failed.");
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f3f6ff] text-[#07143a]">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(#1238910c_1px,transparent_1px),linear-gradient(90deg,#1238910c_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="pointer-events-none absolute -right-28 -top-28 size-[520px] rounded-full bg-[#1a4ed8]/10 blur-3xl" />

      <header className="relative flex h-16 items-center justify-between border-b border-[#123891]/10 px-5 sm:px-8">
        <a className="flex items-center gap-2.5" href="/">
          <span className="grid size-8 place-items-center rounded-lg bg-[#092d87]"><WovenMark className="size-5" /></span>
          <strong className="text-sm tracking-tight">Woven</strong>
        </a>
        <span className="rounded-full border border-[#123891]/15 bg-white/75 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#123891]">
          Identity simulator · Demo only
        </span>
      </header>

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:px-8">
        <section>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a4ed8]">Trust handoff / 01</span>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Prove the person.
            <br />
            <span className="text-[#1a4ed8]">Then bind the purchase.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#07143a]/65">
            This working simulator shows the handoff Woven needs from an identity provider before it creates an exact checkout mandate.
          </p>

          <ol className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ProtocolStep icon={<Fingerprint />} number="01" title="Verify on provider surface" copy="The provider owns identity and passkey UX." />
            <ProtocolStep icon={<KeyRound />} number="02" title="Return one-time proof" copy="State, PKCE, allowlisted callback, single-use code." />
            <ProtocolStep icon={<LockKeyhole />} number="03" title="Bind exact terms" copy="Woven binds the verified session to one cart preview." />
          </ol>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#123891]/15 bg-white shadow-[0_30px_90px_-38px_rgba(8,34,105,0.45)]">
          <div className="flex items-center justify-between bg-[#092d87] px-6 py-4 text-white sm:px-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#ffcf3f]" />
              <span className="text-sm font-semibold">Demo Identity Connector</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">Simulated</span>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-xl border border-[#e2b721]/35 bg-[#fff8d8] p-4 text-sm leading-6 text-[#5b4700]">
              <strong className="block font-semibold">DEMO ONLY</strong>
              No Visa account, card details, password, or payment credential is accessed.
            </div>

            {complete ? (
              <Result
                icon={<BadgeCheck />}
                title="Demo identity verified"
                copy="A short-lived server session is now bound to Woven. Close this tab and continue to the exact checkout review."
              />
            ) : error ? (
              <Result
                icon={<TriangleAlert />}
                title="Verification did not complete"
                copy={error}
                destructive
              />
            ) : !requestId || !state ? (
              <Result
                icon={<ArrowLeft />}
                title="Start from Woven checkout"
                copy="Select a cart, click Review checkout, then choose Verify demo identity. That creates a protected, expiring request for this page."
              />
            ) : !request ? (
              <div className="grid min-h-72 place-items-center text-center">
                <div>
                  <Loader2 className="mx-auto size-6 animate-spin text-[#1a4ed8]" />
                  <p className="mt-3 text-sm text-[#07143a]/55">Validating request…</p>
                </div>
              </div>
            ) : (
              <div className="pt-7">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4ed8]">{request.clientName} requests</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Connect your demo identity</h2>
                <p className="mt-2 text-sm leading-6 text-[#07143a]/60">
                  Confirm that a demo user is present. This does not authorize a purchase; Woven will still show the exact cart and require a separate confirmation.
                </p>

                <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#123891]/12 bg-[#f7f9ff] p-4">
                  <span className="grid size-11 flex-none place-items-center rounded-full bg-[#1a4ed8] text-sm font-semibold text-white">CP</span>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm">{request.displayLabel}</strong>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#07143a]/50">
                      <Clock3 className="size-3" /> Request expires at {formatTime(request.expiresAt)}
                    </span>
                  </div>
                  <Check className="size-4 text-[#1a4ed8]" />
                </div>

                <Button
                  className="mt-6 h-11 w-full bg-[#1a4ed8] text-white hover:bg-[#123891]"
                  disabled={busy}
                  onClick={() => void authorize()}
                >
                  {busy ? <><Loader2 className="animate-spin" /> Verifying…</> : <>Continue as Chai <ArrowRight /></>}
                </Button>
                <p className="mt-4 text-center text-[11px] leading-5 text-[#07143a]/45">
                  A production identity provider would replace this simulator only after product approval and security review.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProtocolStep({ icon, number, title, copy }: { icon: ReactNode; number: string; title: string; copy: string }) {
  return (
    <li className="grid grid-cols-[36px_1fr] gap-x-3 rounded-xl border border-[#123891]/10 bg-white/60 p-3.5 backdrop-blur-sm">
      <span className="row-span-2 grid size-9 place-items-center rounded-lg bg-[#e7edff] text-[#1a4ed8] [&>svg]:size-4">{icon}</span>
      <strong className="flex items-center justify-between text-sm"><span>{title}</span><em className="font-mono text-[9px] not-italic text-[#07143a]/30">{number}</em></strong>
      <span className="mt-0.5 text-xs leading-5 text-[#07143a]/50">{copy}</span>
    </li>
  );
}

function Result({ icon, title, copy, destructive = false }: { icon: ReactNode; title: string; copy: string; destructive?: boolean }) {
  return (
    <div className="grid min-h-72 place-items-center py-8 text-center">
      <div className="max-w-sm">
        <span className={`mx-auto grid size-14 place-items-center rounded-full [&>svg]:size-6 ${destructive ? "bg-red-50 text-red-600" : "bg-[#e7edff] text-[#1a4ed8]"}`}>{icon}</span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#07143a]/60">{copy}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.close()}>
          Close this tab
        </Button>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<IdentityPage />);
