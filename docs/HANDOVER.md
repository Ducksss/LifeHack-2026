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

`script.md` at the repository root is the authoritative narration. Its
connector-style demo identity scene is live: the server now rejects checkout
until the short-lived identity handoff succeeds.

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

> I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it
> under S$300, fit it in one car boot, and make it pickup-ready today.

Within three minutes, the audience should see:

1. the mission open five ranked, one-merchant carts in the Choice Center;
2. the user compare full carts, rerank them, choose a pickup area, and optionally
   use a merchant-approved compatible substitution;
3. proof that the tent, two sleeping bags, two sleeping mats, lantern, first-aid
   supplies, rain protection, packed volume, stock, pickup, and budget constraints
   are all satisfied;
4. a clearly labeled, server-enforced demo identity handoff;
5. a price/stock recheck and ten-minute checkout mandate bound to that session;
6. one explicit click confirming the exact merchant, cart version, and total;
7. a clearly simulated Visa result and signed receipt; and
8. merchant-controlled alternatives plus stale price, stockout, decline, and reversal scenarios.

The judge deck follows this as a ten-slide camping story.
Its identity step is implemented and must remain labeled simulated.

## Current product state

| Area | Status | Notes |
| --- | --- | --- |
| Buyer MCP App | Complete | React widget using a self-contained hosted entry point, first-result snapshot fallback, and the MCP Apps bridge |
| Local plugin packaging | Complete | v0.2.2 repo marketplace package with a fresh widget resource URI, in-place identity status refresh, branded install-page assets, cache-safe stdio launcher, real Codex CLI install, nine-tool smoke test, and verified guide |
| Browser fallback | Complete | `/demo`; simulated chat-host rehearsal, same domain behavior over HTTP (`?instant` skips animations) |
| Demo identity page | Complete | `/identity`; working provider-style handoff with a prominent simulator boundary and no credential fields |
| Install guide page | Complete | `/install`; Woven-branded guide styled after the ChatGPT Plugins tab (clearly labeled preview, three install paths, verification checklist); linked from the landing page and demo host headers |
| Merchant desk | Complete | `/merchant`; inventory, approved alternatives, scenarios, orders, audit, reset |
| Cart engine | Complete for canonical mission | Five gear categories, seven required units, five one-location choices, merchant-approved substitutions |
| Checkout safety | Complete for prototype | Identity-session binding, expiry, hash, private nonce, exact terms, idempotency, signed receipt verification |
| Demo identity check | Complete for prototype | Server-enforced state + PKCE + allowlisted callback + one-time code + 15-minute session; never call it Visa OAuth, KYC, or a real Visa login |
| Visa rail | Simulated only | Approval, decline, failure, and reversal semantics |
| Automated verification | Green | Fifteen tests, TypeScript/build gate, GitHub CI |
| README and gallery | Complete | Best-README structure and nine 1600×900 Devpost assets |
| Stage fallback assets | Complete | Five numbered 1600×900 frames with editable SVG sources and explicit simulator boundaries |
| Judge pitch deck | Complete | Ten-slide camping story; presenter notes and source blocks included |
| Judge demo video | Complete locally | Three-minute Remotion master with ElevenLabs AI narration and sidecar captions; public upload URL remains outstanding |
| Agent context | Current | `AGENTS.md` is canonical; Claude and Copilot use thin pointers to it |
| Devpost copy | Draft complete | Field-ready copy and demo script exist |
| Public HTTPS deployment | Complete for the demo | <https://woven-pi.vercel.app> (canonical — `BASE_URL` points here, verified through `/mcp` widget assets; <https://visa-woven.vercel.app> serves the same deployment). Vercel Express preset; SQLite uses temporary `/tmp` state and may reset on cold start or redeploy — reset the demo right before presenting |
| Devpost submission | Text ready — media blocked | Draft story includes the working simulated-host and identity boundaries; 13 technology tags, repository, Visa prize and Digital Payments are saved; uploads and submission remain outstanding |
| Real merchant/Visa integrations | Credential-blocked | Visa Intelligent Commerce is the selected real path; VTS, VIC, Token Requestor, MLE, and Visa Payment Passkey credentials are required |

## Product vocabulary

- **Mission:** the user's desired outcome plus hard constraints such as camper
  count, weather, packed volume, budget, stock, and pickup.
- **Cart:** a complete set of compatible offers from one merchant pickup location.
- **Completeness proof:** the explanation for why every component and quantity
  satisfies the weather, capacity, sleep, packed-volume, and safety brief.
- **Checkout preview / mandate:** exact merchant, items, amount, cart version, and
  expiry presented before authorization.
- **Demo identity:** a simulated provider handoff that creates a short-lived,
  opaque server session; it is not Visa login, KYC, or purchase consent.
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
| `docs/Woven-Hackathon-Pitch.pptx` | Judge deck with the camping mission and working simulated identity handoff |
| `video/WovenJudgeVideo.tsx` | Three-minute Remotion judge composition using the authoritative script and verified product frames |
| `video/voiceover.ts` | Timed narration transcript; display copy preserves the authoritative wording |
| `video/Woven-Judge-Video.srt` | Sidecar captions for the three-minute master |
| `public/woven-video/` | ElevenLabs AI narration and ambient audio consumed by the composition |
| `docs/Woven-Devpost-Visuals.pptx` | Editable three-slide source deck for user flow, architecture, and trust visuals |
| `docs/assets/brand/woven-cover.{png,svg}` | Product-led repository/social cover using the working buyer UI |
| `docs/assets/devpost/woven-{user-flow,architecture,trust-boundary}.png` | Verified 1600×900 submission visuals |
| `docs/assets/demo/*.{png,svg}` | Numbered 1600×900 stage fallback sequence and recording close card |
| `script.md` | Authoritative three-minute narration, stage cues, fallback, judge Q&A, and demo identity boundary |

## Interfaces and runtime

### MCP tools

| Tool | Caller | Purpose |
| --- | --- | --- |
| `start_mission` | Model and app | Create the mission and initial carts |
| `build_carts` | Model and app | Recompute carts from current stock/prices |
| `select_cart` | App only | Persist the chosen cart |
| `swap_cart_item` | App only | Apply an active merchant-approved compatible substitution |
| `start_demo_identity` | App only | Start the simulated identity handoff |
| `create_checkout_preview` | App only | Require demo identity, revalidate, and create an exact mandate |
| `confirm_purchase` | App only | Consume confirmation and execute the simulator outcome |
| `get_order_status` | Model | Read the latest public mission/order state |
| `verify_receipt` | Model and app | Verify a simulated receipt's server signature |

The one-time confirmation nonce and identity authorization URL are returned in
MCP result `_meta`, never in model-visible `structuredContent`.

### HTTP surfaces

| Surface | Default URL |
| --- | --- |
| Landing page | `http://localhost:8787/` |
| Buyer fallback | `http://localhost:8787/demo` |
| Demo identity connector | `http://localhost:8787/identity` |
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
   activity runs, and the Choice Center opens with five complete carts.
5. Compare the carts, show a priority/area rerank, then choose TrailHaus.
6. Show the two-person, rain-rating, quantity, car-boot, pickup-plan, and approved-swap proof.
7. Click **Review checkout**, then **Verify demo identity**.
8. On `/identity`, read the **DEMO ONLY** boundary and click **Continue as Chai**.
9. Return to Woven, check the session, and review the price/stock recheck.
10. Read the exact mandate, then click **Confirm**.
11. Show the simulated result, valid receipt signature, and scripted thank-you close.
12. If time permits, select **Price change** in `/merchant` and show stale-preview
   rejection.

## Submission handover

The README, product-led cover, Woven brand system, user-flow slide,
authorization-boundary slide, architecture slide, product screenshots, numbered
stage fallback sequence, Devpost story, captions, judge Q&A, three-minute script,
and ten-slide pitch deck are complete. The deck story is: friction →
complete cart → live request → human authorization → merchant control →
takeaway. The identity scene is now working and must be described as a simulated,
server-enforced POC rather than a Visa identity product.

The existing LifeHack Devpost draft is saved at
<https://devpost.com/software/woven-wzefyv>. Its rendered preview has been
verified with the project name, pitch, story, 13 technology tags, GitHub link,
`Visa best submission award`, and `Digital Payments`. It is not submitted.
The story was re-synced after the connector-style demo identity check became a
working, server-enforced feature.
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

1. **Deploy and verify identity publicly:** redeploy the current build, exercise
   `/identity` through the public MCP app, and verify private metadata and CSP.
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
- production user accounts, onboarding, refunds, disputes or fulfilment;
- broad multi-category optimization or a solver;
- extra services, queues, caches or databases;
- live Visa calls without the exact approved product and credentials.

The existing five-category camping mission and direct cart enumeration are deliberate
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
