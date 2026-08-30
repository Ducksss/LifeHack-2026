# Woven AI handover

**Last updated:** 30 August 2026

**Repository:** `Ducksss/LifeHack-2026`

**Product:** Woven

**Current phase:** Working, submission-ready prototype with a verified public
browser deployment; ChatGPT connection and Devpost publishing remain outstanding.

**Repository synchronization:** The primary checkout should be clean and aligned
with `origin/main` after handoff. Worktree paths and counts are ephemeral; always
rediscover them with `git worktree list` instead of copying a fixed inventory or
commit hash into documentation.

## Read this first

`AGENTS.md` is the canonical execution contract for every coding agent. This file
owns current product and repository state. `docs/PRD.md` owns implemented
requirements, `docs/architecture.md` owns system contracts, and `script.md` owns
the spoken demo. If a pitch artifact describes planned behavior that the code and
PRD do not implement, it is not a product claim.

Woven is an agentic-commerce MCP App for ChatGPT and Codex. It turns a
constrained shopping request into complete, compatible, in-stock carts from one
pickup location, explains why each cart works, and requires the user to confirm
the exact merchant, cart, and amount before a **simulated** Visa authorization.

The repository name is `LifeHack-2026`; the user-facing product name is
`Woven`. Do not rename the product to LifeHack.

The product promise is:

> Everything works together.

The explanatory line is: “Everything you need, woven into one choice.” The name
expresses the product mechanism: Woven combines separate threads—intent,
compatibility, budget, inventory, pickup, and consent—into one complete cart.

The current three-minute stage line is:

> Ask once. Review once. Confirm once.

`script.md` at the repository root is the authoritative narration. It includes a
target connector-style identity scene, but that scene is explicitly **not live**
until the server enforces identity before checkout.

## Why this direction was chosen

The project began with a broader idea: a Visa-powered extension that could layer
merchant recommendations over existing search and authorize payment after user
confirmation. The direction was narrowed to Woven because it produces a
stronger, more defensible demo:

- it begins inside a workflow the user already uses—ChatGPT or Codex;
- it solves the complete mission instead of inserting another product ad;
- it demonstrates compatibility, stock, pickup, budget, and trust in one flow;
- it has a visible human authorization boundary; and
- judges can test success and failure paths live.

The primary artifact is therefore an actual MCP App/plugin, not a speculative
browser extension. The browser UI at `/demo` is a reliable stage rehearsal of
that experience: a clearly labeled simulated chat host (marked “Simulated” in
its header and footer) that types the canonical request, plays a staged
`start_mission` activity, renders the real widget inline, surfaces every MCP
tool call live, and closes with a scripted thank-you after a confirmed
simulated payment. It drives the same backend behavior and never impersonates a
real host.

## Canonical demo story

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and
> AirPods under S$150, with pickup today.

Within three minutes, the audience should see:

1. the mission become three ranked, one-merchant carts;
2. proof that the charger, cables, adapter, destination, stock, pickup, and budget
   constraints are all satisfied;
3. a price/stock recheck and ten-minute checkout mandate;
4. one explicit click confirming the exact merchant, cart version, and total;
5. a clearly simulated Visa result and pickup receipt; and
6. a merchant-controlled stale price, stockout, decline, or reversal scenario.

The judge deck now follows this as a seven-slide main story with four Q&A
backups. Its identity step is labeled **planned**; the speaker notes route the
live demo through the implemented review-and-confirm flow only.

## Current product state

| Area | Status | Notes |
| --- | --- | --- |
| Buyer MCP App | Complete | React widget using an explicit hosted entry point and the MCP Apps bridge |
| Local plugin packaging | Complete | Repo marketplace, branded install-page assets, cache-safe stdio launcher, real Codex CLI install, fresh-host six-tool smoke test, and verified guide |
| Browser fallback | Complete | `/demo`; simulated chat-host rehearsal, same domain behavior over HTTP (`?instant` skips animations) |
| Install guide page | Complete | `/install`; Woven-branded guide styled after the ChatGPT Plugins tab (clearly labeled preview, three install paths, verification checklist); linked from the landing page and demo host headers |
| Merchant desk | Complete | `/merchant`; inventory, scenarios, orders, audit, reset |
| Cart engine | Complete for canonical mission | Four required categories; one location per cart |
| Checkout safety | Complete for prototype | Expiry, hash, private nonce, exact terms, idempotency |
| Demo identity check | Planned, not implemented | Target is a simulated connector-style flow; never call it Visa OAuth, KYC, or a real Visa login |
| Visa rail | Simulated only | Approval, decline, failure, and reversal semantics |
| Automated verification | Green | Nine tests, TypeScript/build gate, GitHub CI |
| README and gallery | Complete | Best-README structure and eight 1600×900 Devpost assets |
| Stage fallback assets | Complete | Five numbered 1600×900 frames with editable SVG sources and explicit simulator boundaries |
| Judge pitch deck | Complete | Seven-slide story plus six backups; presenter notes and source blocks included |
| Judge demo video | Complete locally | Three-minute Remotion master with synthetic narration and sidecar captions; public upload URL remains outstanding |
| Agent context | Current | `AGENTS.md` is canonical; Claude and Copilot use thin pointers to it |
| Devpost copy | Draft complete | Field-ready copy and demo script exist |
| Public HTTPS deployment | Complete for the demo | <https://woven-pi.vercel.app> (canonical — `BASE_URL` points here, verified through `/mcp` widget assets; <https://visa-woven.vercel.app> serves the same deployment). Vercel Express preset; SQLite uses temporary `/tmp` state and may reset on cold start or redeploy — reset the demo right before presenting |
| Devpost submission | Text ready — media blocked | Draft story includes the current simulated-host UI and planned identity boundary; 13 technology tags, repository, Visa prize and Digital Payments are saved; uploads and submission remain outstanding |
| Real merchant/Visa integrations | Not started | Explicitly outside current prototype scope |

## Product vocabulary

- **Mission:** the user's desired outcome plus hard constraints.
- **Cart:** a complete set of compatible offers from one merchant pickup location.
- **Compatibility proof:** the explanation for why every component satisfies the
  devices and destination.
- **Checkout preview / mandate:** exact merchant, items, amount, cart version, and
  expiry presented before authorization.
- **Explicit confirmation:** the separate direct user action that consumes the
  private one-time nonce.
- **Visa simulator:** the current payment adapter. It never contacts Visa and never
  receives card credentials.
- **Merchant desk:** the operator surface used to control demo data and failures.

## Architecture at a glance

```text
User mission
    ↓
ChatGPT or Codex MCP host
    ↓
Woven tools + React MCP App
    ↓
Domain rules → Node SQLite state → simulated Visa adapter
    ↑
Merchant desk: inventory, prices, scenarios, orders, audit
```

Woven deliberately remains one deployable Node.js service. HTTP MCP, stdio
MCP, the browser fallback, and the merchant desk all route through the same store
and domain rules. Do not split it into services without a measured reason.

### Source map

| Path | Responsibility |
| --- | --- |
| `AGENTS.md` | Canonical agent execution rules, source ordering, invariants, and definition of done |
| `CLAUDE.md` | Claude pointer to the canonical agent contract |
| `.github/copilot-instructions.md` | GitHub Copilot pointer to the canonical agent contract |
| `src/domain.ts` | Types, seed catalog, mission creation, compatibility, cart ranking, preview construction |
| `src/store.ts` | SQLite schema/state, transactions, confirmation, idempotency, scenarios, CSV and audit |
| `src/payment.ts` | Simulated authorization adapter and the future real-payment replacement seam |
| `src/server.ts` | MCP tools/transports, HTTP APIs, static UI, validation and process startup |
| `web/widget.tsx` | Buyer MCP App plus the simulated chat-host rehearsal (`/demo`) |
| `web/landing.tsx` | Marketing landing page served at `/` |
| `web/merchant.tsx` | Merchant operations desk |
| `web/install.tsx` | In-product install guide (`/install`) styled after the ChatGPT Plugins tab |
| `web/woven-mark.tsx` | Shared Flightpath brand mark: one route from request to verified destination |
| `web/components/ui/` | Vendored shadcn/ui primitives (button, card, badge, table, input, separator, skeleton) |
| `web/lib/utils.ts` | `cn` class-merge helper for shadcn components |
| `web/styles.css` | Tailwind v4 entry: shadcn design tokens, Geist fonts, shared animations |
| `test/domain.test.ts` | Mission, compatibility and ranking behavior |
| `test/store.test.ts` | Confirmation, security, failures, inventory and CSV behavior |
| `.codex-plugin/plugin.json` | Codex plugin metadata |
| `assets/` | Packaged plugin icon, wordmark, and verified install-page screenshots |
| `.mcp.json` | Local stdio MCP launch configuration |
| `.agents/plugins/marketplace.json` | Repository marketplace entry for local plugin installation |
| `docs/INSTALLATION.md` | Canonical Codex/ChatGPT installation steps and expected results |
| `docs/PRD.md` | Binding implemented product requirements |
| `docs/architecture.md` | Detailed tool contract, state machine and trust boundaries |
| `docs/DEVPOST_SUBMISSION.md` | Paste-ready Devpost story, captions, pitch and demo script |
| `docs/BRAND_GUIDE.md` | Naming, visual tokens, asset inventory and campaign prompt |
| `docs/Woven-Hackathon-Pitch.pptx` | Thirteen-slide judge deck (7 story + 6 backup); the identity scene is explicitly labeled as planned, not live |
| `video/WovenJudgeVideo.tsx` | Three-minute Remotion judge composition using the authoritative script and verified product frames |
| `video/voiceover.ts` | Timed narration transcript; display copy preserves the authoritative wording |
| `video/Woven-Judge-Video.srt` | Sidecar captions for the three-minute master |
| `public/woven-video/` | Synthetic narration and ambient audio consumed by the composition |
| `docs/Woven-Devpost-Visuals.pptx` | Editable three-slide source deck for user flow, architecture, and trust visuals |
| `docs/assets/brand/woven-cover.{png,svg}` | Product-led repository/social cover using the working buyer UI |
| `docs/assets/devpost/woven-{user-flow,architecture,trust-boundary}.png` | Verified 1600×900 submission visuals |
| `docs/assets/demo/*.{png,svg}` | Numbered 1600×900 stage fallback sequence and recording close card |
| `script.md` | Authoritative three-minute narration, stage cues, fallback, judge Q&A, and identity implementation gate |

## Interfaces and runtime

### MCP tools

| Tool | Caller | Purpose |
| --- | --- | --- |
| `start_mission` | Model and app | Create the mission and initial carts |
| `build_carts` | Model and app | Recompute carts from current stock/prices |
| `select_cart` | App only | Persist the chosen cart |
| `create_checkout_preview` | App only | Revalidate and create an exact mandate |
| `confirm_purchase` | App only | Consume confirmation and execute the simulator outcome |
| `get_order_status` | Model | Read the latest public mission/order state |

The one-time confirmation nonce is returned in MCP result `_meta`, never in
model-visible `structuredContent`.

### HTTP surfaces

| Surface | Default URL |
| --- | --- |
| Landing page | `http://localhost:8787/` |
| Buyer fallback | `http://localhost:8787/demo` |
| Merchant desk | `http://localhost:8787/merchant` |
| Install guide | `http://localhost:8787/install` |
| MCP endpoint | `http://localhost:8787/mcp` |
| Health check | `http://localhost:8787/healthz` |

### Configuration

| Variable | Default | Constraint |
| --- | --- | --- |
| `PORT` | `8787` | Codex stdio config uses `8788` to avoid collisions |
| `BASE_URL` | `http://localhost:8787` | Must be the public HTTPS origin for ChatGPT |
| `WOVEN_DB` | `./data/woven.db` | Local demo state; ignored by Git |
| `PAYMENT_MODE` | `simulated` | Every other value fails closed |

## Non-negotiable trust boundaries

Preserve these across every change:

1. No PAN, CVV, wallet token, or payment credential may enter Woven.
2. The model never receives the confirmation nonce.
3. Recommendation is not authorization; confirmation requires a separate click.
4. Confirmation is bound to exact immutable terms and expires.
5. Price and stock are revalidated before preview and again on confirmation.
6. Inventory mutation and order creation remain atomic.
7. Duplicate confirmation remains idempotent and cannot decrement stock twice.
8. Declines create no confirmed merchant order.
9. Merchant failure after authorization enters reversal.
10. Every payment surface says simulated and no live charge.

The only safe real-payment replacement point is `authorizePayment` in
`src/payment.ts`. Do not implement it until the user identifies the exact Visa
product, supplies sandbox credentials through an approved secret mechanism, and
explicitly requests integration. Preserve the current result contract, timeout
handling, idempotency, audit, reversal, and confirmation UI.

## Local runbook

The complete host installation, expected outputs, and troubleshooting guide is
in `docs/INSTALLATION.md`.

```bash
npm ci
npm run check
npm start
```

Useful commands:

```bash
npm run dev          # Vite UI development server
npm run dev:server   # backend with restart-on-change
npm test             # eight domain/store tests
npm run build        # Vite production bundle + tsc --noEmit
npm run check        # test and build gate
npm run mcp          # stdio MCP transport
npm audit            # dependency audit
```

Reset stage data from the merchant desk or with:

```bash
curl -X POST http://localhost:8787/api/merchant/reset
```

The database and Playwright artifacts are intentionally ignored. Never commit
`data/`, `.playwright-cli/`, `.env`, secrets, logs, or built `dist/` output.

## Stage demo runbook

Use `script.md` for the exact three-minute narration. The steps below describe
the currently working product flow.

1. Run `npm run check`, then `npm start`.
2. Open `/merchant` and click **Reset demo data**.
3. Keep `/demo` and `/merchant` open in separate tabs (`/demo?instant` skips
   the intro animation if time is short).
4. Let `/demo` play: the canonical request types itself, the staged `start_mission`
   activity runs, and the widget renders three complete carts.
5. Select ByteRoute and show the compatibility proof.
6. Click **Review checkout** and emphasize the price/stock recheck.
7. Read the exact S$133 mandate, then click **Confirm**.
8. Show the simulated result, pickup receipt, and the scripted thank-you close.
9. If time permits, select **Price change** in `/merchant` and show stale-preview
   rejection.

Do not add the target identity scene to the live demo until checkout rejects a
missing or expired server-side identity session. A static login mock does not
qualify.

## Submission handover

The README, product-led cover, Woven brand system, user-flow slide,
authorization-boundary slide, architecture slide, product screenshots, numbered
stage fallback sequence, Devpost story, captions, judge Q&A, three-minute script,
and thirteen-slide pitch deck are complete. The main deck story is: friction →
complete cart → live request → human authorization → merchant control →
takeaway. The pitch deck includes identity only as the next integration.
Regenerate the identity and checkout evidence after identity is implemented
rather than presenting the current planned state as live.

The existing LifeHack Devpost draft is saved at
<https://devpost.com/software/woven-wzefyv>. Its rendered preview has been
verified with the project name, pitch, story, 13 technology tags, GitHub link,
`Visa best submission award`, and `Digital Payments`. It is not submitted.
The story was re-synced after the three-minute script became authoritative; the
connector-style identity check appears only as planned roadmap work.
Thumbnail/gallery uploads, the public demo video URL, and the required project
PDF remain empty. A local three-minute Remotion master is complete at
`output/Woven-Judge-Video.mp4`; generated `output/` artifacts remain ignored by
Git.

The verified public demo URL is <https://visa-woven.vercel.app/demo>.

Before publishing Devpost, a human must provide or confirm:

- public HTTPS demo URL (<https://woven-pi.vercel.app> is live; confirm it is the final one);
- demo video URL;
- team member names and roles;
- project-description PDF;
- whether the event permits `visa` as a public technology tag;
- required repository visibility; and
- final logged-out link checks.

Do not invent these fields. Use the checklist in `docs/DEVPOST_SUBMISSION.md`.

## Repository and worktree state

`main` is the only current product branch. Historical pre-Woven archive branches
exist only to preserve old experiments; they are not sources of truth and should
not be merged into `main` by default. Recover individual assets or patterns only
after translating them to Woven and rechecking every trust and transport
invariant. The Woven-branded shadcn interface and clearly labeled simulated
chat-host rehearsal are merged into `main`; `/demo`'s labeled chat-host behavior
is current product, not an archive. Before changing branches or worktrees,
inspect
`git worktree list` and preserve dirty state on a branch.

## Highest-value next work

Unless the user changes direction, prioritize in this order:

1. **Simulated identity check:** add the connector-style demo authorization flow,
   bind its opaque subject to checkout, reject missing/expired/mismatched
   sessions, and keep final purchase confirmation separate.
2. **Real ChatGPT connection:** connect the deployed `/mcp` endpoint in Developer
   Mode and verify the widget, private metadata, CSP and tool calls.
3. **Demo video upload:** review the local three-minute master, upload it, and add
   the public URL to Devpost.
4. **Devpost publication:** add human/team details, upload the eight gallery assets,
   add links and publish only with explicit user authorization.
5. **Post-hackathon validation:** interview merchants/users before generalizing the
   mission engine or adding production integrations.

## Do not expand by default

These ideas are intentionally deferred, not forgotten:

- Google search result injection or a Chrome extension;
- scraping merchants or presenting seeded stock as live;
- production user accounts, onboarding, refunds, disputes or fulfilment; the
  scoped simulated identity check above is the only planned exception;
- broad multi-category optimization or a solver;
- extra services, queues, caches or databases;
- live Visa calls without the exact approved product and credentials.

The existing four-part charging mission and direct cart enumeration are deliberate
demo constraints. Generalize only when the user explicitly chooses broader scope
or evidence shows the current ceiling matters.

## Definition of done for future changes

A future AI should not call work complete until it has:

1. inspected the working tree and preserved unrelated changes;
2. traced the request through the relevant public flow and shared domain seam;
3. preserved every applicable trust boundary above;
4. added the smallest reliable check for changed non-trivial behavior;
5. run focused checks and `npm run check` with fresh passing evidence;
6. visually verified affected buyer/merchant UI at desktop and mobile sizes when
   UI changes;
7. updated README, script, PRD, architecture, Devpost copy, brand guide,
   `AGENTS.md`, or this handover when their owned facts changed; and
8. reported anything still requiring human authority rather than guessing.

## Maintaining this handover

Update the date and affected sections whenever product direction, architecture,
deployment state, demo steps, external links, archive branches, or outstanding
work changes. Keep this file factual and current; use Git itself for commit and
worktree state instead of copying ephemeral hashes or paths here.
