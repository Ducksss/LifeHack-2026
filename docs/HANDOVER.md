# Woven AI handover

**Last updated:** 4 September 2026

**Repository:** `Ducksss/LifeHack-2026`

**Product:** Woven

**Current phase:** Working MCP App plus publicly verified Woven Trail Market
WebMCP showcase and guided `/demo` rehearsal. The WebMCP Challenge entry is
submitted with a public corrected demo video and captions. A real ChatGPT
connection and entrant-type/team reconciliation remain outstanding.

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

Woven is an agentic-commerce system whose primary interface is an MCP App for
ChatGPT and Codex, with the fictional Woven Trail Market WebMCP storefront at
`/webmcp`. MCP and WebMCP carry tool calls into the same mission backend; the
MCP App owns its Choice Center while the storefront owns inline two-kit results
and a truthful “Behind the cart” activity surface. A
separate server-owned mission layer routes work into either the deterministic
camping engine or a bounded LangGraph.js orchestration workflow. Both paths end
at the same deterministic commerce rules, SQLite state, identity gate, and exact
confirmation boundary. The credential-dormant open-world POC demonstrates
generic `MissionSpec` parsing, connected-catalog discovery, cited web research,
bounded cart composition, and fail-closed checkout.

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
the strongest cross-surface flow: the clearly labeled original LifeHack
`Woven Demo Host` conversation accepts the mission, yields its presentation surface to the real
Woven Trail Market entry, explicitly announces **WebMCP rehearsal active**,
holds five readable presentation beats, highlights reversible browser actions
with a visible agent cursor, waits for the shared backend, scrolls to the best
two verified kits, selects TrailHaus, stops
at the human-only boundary, and returns the exact result to chat. It uses
explicit showcase data, exposes no top-level WebMCP tools, drives the same
backend behavior, and never impersonates a real host.

## Canonical demo story

> I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it
> under S$300, fit it in one car boot, and make it pickup-ready today.

Within three minutes, the audience should see:

1. the mission leave the clearly labeled simulated chat and open Woven Trail Market in the browser-control surface;
2. the real response reveal the best two complete one-store carts and scroll to them while reversible actions are highlighted;
3. proof that the tent, two sleeping bags, two sleeping mats, lantern, first-aid
   supplies, rain protection, packed volume, stock, pickup, and budget constraints
   are all satisfied;
4. a reversible **Add kit to cart** action select TrailHaus, show the clearly
   labeled human-only identity boundary, and return the selection to chat;
5. a price/stock recheck and ten-minute checkout mandate bound to that session;
6. one explicit click confirming the exact merchant, cart version, and total;
7. a clearly simulated Visa result and signed receipt; and
8. merchant-controlled alternatives plus stale price, stockout, decline, and reversal scenarios.

The judge deck follows this as a ten-slide camping story.
Its identity step is implemented and must remain labeled simulated.

The separate WebMCP story opens the light storefront idle, defaults to connected
stores, and lets either the person or `start_mission` drive the same visible
state. Without configured connectors it fails closed and offers retry plus an
explicit **Showcase data** action. The storefront displays the best two complete
one-store kits and the canonical proof (7 units, 5 categories, 89 L, 3,000 mm),
then hands selection to a solid direct-human identity/merchant section.

## Current product state

| Area | Status | Notes |
| --- | --- | --- |
| Buyer MCP App | Complete | React widget using a self-contained hosted entry point, first-result snapshot fallback, and the MCP Apps bridge |
| Local plugin packaging | Complete | v0.3.0 repo marketplace package with a fresh widget resource URI, in-place identity status refresh, branded install-page assets, cache-safe stdio launcher, real Codex CLI install, nine-tool smoke test, and verified guide |
| Browser fallback | Complete | `/demo`; separate simulated chat entry staging a full browser takeover inside an unbranded laptop frame, explicit 4.5-second WebMCP rehearsal/testing receipt, direct-storefront and official-guide links, five-beat rail, Pause/Resume/Next/Replay, explicit showcase data, real mission response, guided scroll/select, visible human-only boundary, and return to chat (`?instant` auto-starts; `?loop=true` replays) |
| WebMCP storefront showcase | Complete locally | `/webmcp`; dedicated Woven Trail Market Vite entry, seven top-level site tools, truthful unsupported/registering/connected/failed status, supported-browser guidance when tools are unavailable, human/tool shared mission state, non-modal activity, two inline kits, explicit showcase fallback, abort/stale protection, and solid human-only handoff; verified in the real in-app browser at 1440×900 and 390×844 |
| Demo identity page | Complete | `/identity`; working provider-style handoff with a prominent simulator boundary and no credential fields |
| Install guide page | Complete | `/install`; Woven-branded guide styled after the ChatGPT Plugins tab (clearly labeled preview, three install paths, verification checklist); linked from the landing page and demo host headers |
| Merchant desk | Complete | `/merchant`; inventory, approved alternatives, scenarios, orders, audit, reset |
| MCP interaction layer | Complete | HTTP/stdio tools, MCP Apps bridge, app-only checkout actions, and private result metadata |
| Mission orchestration | POC complete | Server-owned router plus fixed LangGraph.js interpret → discover → normalize → compose → verify workflow; two passes, 25-second timeout, credential-dormant outside configured runs |
| Commerce verification | Complete for prototype | Deterministic five-cart camping plus typed connected offers, compatibility joins, bounded beam search, evidence checks, and research-only web leads |
| Checkout safety | Complete for prototype | Identity-session binding, expiry, hash, private nonce, exact terms, idempotency, signed receipt verification |
| Demo identity check | Complete for prototype | Server-enforced state + PKCE + allowlisted callback + one-time code + 15-minute session; never call it Visa OAuth, KYC, or a real Visa login |
| Visa rail | Simulated only | Approval, decline, failure, and reversal semantics |
| Automated verification | Green | 59 Node tests, TypeScript/build gate, focused storefront-state/metrics/demo-protocol/pacing tests, strict premium UI audit, design-context lint, and in-app browser verification; live agent evaluation remains opt-in and credential-dependent |
| README and gallery | Complete | Best-README structure, ten 1600×900 Devpost gallery assets, a separate 3:2 project thumbnail, and verified desktop/mobile WebMCP storefront plus guided-demo captures |
| Stage fallback assets | Complete | Five numbered 1600×900 frames with editable SVG sources and explicit simulator boundaries |
| Judge pitch deck | Complete | Ten-slide camping story; presenter notes and source blocks included |
| Judge demo video | Complete and uploaded | Three-minute Remotion master with ElevenLabs AI narration and sidecar captions; public video: <https://youtu.be/FrppMZYmLeg> |
| Agent context | Current | `AGENTS.md` is canonical; Claude and Copilot use thin pointers to it |
| Devpost copy | Draft complete | Field-ready copy and demo script exist |
| WebMCP challenge kit | Submitted | Public storefront, paste-ready story, 2:58 Remotion master, public YouTube upload, English captions, and Devpost embed are complete |
| Public HTTPS deployment | Complete for the demo | <https://visa-woven.vercel.app> (canonical — `BASE_URL` points here and the deployment is verified through `/mcp` widget assets). Vercel Express preset; SQLite uses temporary `/tmp` state and may reset on cold start or redeploy — reset the demo right before presenting |
| WebMCP Devpost submission | Submitted | Devpost shows `SUBMITTED` and `5/5 steps done`; the public page embeds <https://youtu.be/_v84xyD8CkM>. Administrative follow-up: resolve `Individual` versus the multi-person challenge team listing |
| Real merchant/Visa integrations | Credential-blocked | Visa Intelligent Commerce is the selected real path; VTS, VIC, Token Requestor, MLE, and Visa Payment Passkey credentials are required |

## Product vocabulary

- **Mission:** the user's desired outcome plus hard constraints such as camper
  count, weather, packed volume, budget, stock, and pickup.
- **MCP interaction layer:** the host/tool protocol and embedded UI boundary. It
  carries requests and results; it is not Woven's mission planner.
- **Woven Trail Market storefront:** the clearly fictional top-level `/webmcp`
  showcase that exposes seven reversible mission/cart tools, inline kit results,
  and observable activity while keeping identity and purchase human-only.
- **Mission orchestration:** the server-owned, code-routed workflow that turns a
  non-camping request into a validated `MissionSpec`, gathers connected offers
  and cited research, composes candidates, verifies them, and terminates within
  fixed bounds.
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
MCP tools + React App (interaction layer)
    ↓
Mission router
    ├─ canonical camping → deterministic cart engine
    └─ other retail → bounded LangGraph orchestration
                       ↓
       connected catalog + cited research-only web leads
    ↓
Deterministic verification → SQLite checkout state → simulated Visa adapter
    ↑
Merchant desk: inventory, prices, scenarios, orders, audit
```

Woven deliberately remains one deployable Node.js service. HTTP MCP, stdio
MCP, and the browser API are interfaces into that service. Mission routing,
bounded orchestration, deterministic verification, storage, checkout, and the
payment seam are distinct layers inside the process. Do not confuse MCP with the
whole backend or split these layers into services without a measured reason.

### Source map

| Path | Responsibility |
| --- | --- |
| `AGENTS.md` | Canonical agent execution rules, source ordering, invariants, and definition of done |
| `CLAUDE.md` | Claude pointer to the canonical agent contract |
| `.github/copilot-instructions.md` | GitHub Copilot pointer to the canonical agent contract |
| `src/domain.ts` | Types, seed catalog, mission creation, compatibility, cart ranking, preview construction |
| `src/open-world.ts` | Validated MissionSpec, connected adapter, bounded cart composer, fixed LangGraph workflow, and optional OpenAI Responses/web-search adapter |
| `src/store.ts` | SQLite schema/state, transactions, confirmation, idempotency, scenarios, CSV and audit |
| `src/payment.ts` | Simulated authorization adapter and the future real-payment replacement seam |
| `src/server.ts` | MCP tools/transports, HTTP APIs, static UI, validation and process startup |
| `web/widget.tsx` | Buyer MCP App hosted resource |
| `web/demo.tsx` | Guided `/demo` simulated chat, browser takeover, safe-action status, return-to-chat summary, human review, instant, and loop modes |
| `web/demo-pacing.ts` | Pure five-beat mapping, approved presentation holds, and real-network-stage classification |
| `web/demo-protocol.ts` | Validated same-origin start/control/stage message contract between the simulated host and framed storefront |
| `web/storefront.tsx` | Woven Trail Market `/webmcp` UI, human actions, source mode, responsive activity surface, and private handoff state |
| `web/storefront-state.ts` | Truthful idle/running/resolved/degraded/error derivation, exact tool list, abort/stale helpers, and activity proof |
| `web/webmcp.ts` | Seven browser-native site-tool contracts and abort-bound registration |
| `web/assets/storefront/*.webp` | Five original brand-neutral product cutouts generated for the fictional storefront |
| `web/landing.tsx` | Marketing landing page served at `/` |
| `web/merchant.tsx` | Merchant operations desk |
| `web/install.tsx` | In-product install guide (`/install`) styled after the ChatGPT Plugins tab |
| `web/architecture.html` | Interactive target-architecture explainer with credential-gated future Visa boundaries |
| `web/woven-mark.tsx` | Shared Flightpath brand mark: one route from request to verified destination |
| `web/components/ui/` | Vendored shadcn/ui primitives (button, card, badge, table, input, separator, skeleton) |
| `web/lib/utils.ts` | `cn` class-merge helper for shadcn components |
| `web/styles.css` | Tailwind v4 entry: shadcn design tokens, Geist fonts, shared animations |
| `test/domain.test.ts` | Mission, compatibility and ranking behavior |
| `test/storefront-state.test.ts` | Truthful progress, degradation/failure, abort/stale, refresh/swap, and private-handoff invalidation |
| `test/open-world.test.ts` | Generic validation/composition, workflow bounds/failures, provenance, persistence, and checkout revalidation |
| `test/store.test.ts` | Confirmation, security, failures, inventory and CSV behavior |
| `test/architecture.test.ts` | Architecture tracer autoplay, pause, and reduced-motion behavior |
| `.codex-plugin/plugin.json` | Codex plugin metadata |
| `assets/` | Packaged plugin icon, wordmark, and verified install-page screenshots |
| `.mcp.json` | Local stdio MCP launch configuration |
| `.agents/plugins/marketplace.json` | Repository marketplace entry for local plugin installation |
| `docs/INSTALLATION.md` | Canonical Codex/ChatGPT installation steps and expected results |
| `docs/PRD.md` | Binding implemented product requirements |
| `docs/architecture.md` | Detailed tool contract, state machine and trust boundaries |
| `docs/DEVPOST_SUBMISSION.md` | Paste-ready Devpost story, captions, pitch and demo script |
| `docs/WEBMCP_DEVPOST_SUBMISSION.md` | Paste-ready WebMCP Challenge story, tool evidence, run of show, and publication checklist |
| `docs/BRAND_GUIDE.md` | Naming, visual tokens, asset inventory and campaign prompt |
| `docs/Woven-Hackathon-Pitch.pptx` | Judge deck with the camping mission and working simulated identity handoff |
| `video/WovenJudgeVideo.tsx` | Three-minute Remotion judge composition using the authoritative script and verified product frames |
| `output/Woven-WebMCP-Challenge.mp4` | Generated 2:58 WebMCP challenge master; ignored by Git and uploaded publicly at <https://youtu.be/_v84xyD8CkM> |
| `video/voiceover.ts` | Timed narration transcript; display copy preserves the authoritative wording |
| `video/Woven-Judge-Video.srt` | Sidecar captions for the three-minute master |
| `video/Woven-WebMCP-Video.srt` | Retimed captions for the 2:58 challenge master |
| `public/woven-video/` | ElevenLabs AI narration and ambient audio consumed by the composition |
| `docs/Woven-Devpost-Visuals.pptx` | Editorial three-slide source deck; current product-style explainers use `docs/assets/devpost/src/*.html` |
| `docs/assets/brand/woven-cover.{png,svg}` | Product-led repository/social cover using the working buyer UI |
| `docs/assets/devpost/woven-{user-flow,architecture,trust-boundary}.png` | Verified 1600×900 submission visuals |
| `docs/assets/demo/*.{png,svg}` | Numbered 1600×900 stage fallback sequence and recording close card |
| `docs/assets/screenshots/demo-guided-{desktop,mobile}.png` | Verified guided `/demo` chat return at 1440×900 and browser-control handoff at 390×844 |
| `docs/assets/screenshots/demo-guided-browser-control.png` | Verified desktop browser-control stop at the human-only boundary |
| `script.md` | Authoritative three-minute narration, stage cues, fallback, judge Q&A, and demo identity boundary |

## Interfaces and runtime

### MCP tools

| Tool | Caller | Purpose |
| --- | --- | --- |
| `start_mission` | Model and app | Create deterministic camping carts or run the bounded non-camping POC |
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

### WebMCP site tools

`start_mission`, `get_mission`, `compare_carts`, `select_cart`,
`swap_cart_item`, `refresh_carts`, and `verify_receipt` are registered only in
the top-level `/webmcp` page. There is no identity, preview, confirmation, or
purchase tool. The page opens idle and defaults to connected stores. Seeded
showcase data runs only after the person selects it or the tool input explicitly
requests `sourceMode: "demo"`; live failure never falls back silently.

### HTTP surfaces

| Surface | Default URL |
| --- | --- |
| Landing page | `http://localhost:8787/` |
| Guided buyer rehearsal | `http://localhost:8787/demo` |
| Woven Trail Market WebMCP showcase | `http://localhost:8787/webmcp` |
| Demo identity connector | `http://localhost:8787/identity` |
| Merchant desk | `http://localhost:8787/merchant` |
| Install guide | `http://localhost:8787/install` |
| Target architecture | `http://localhost:8787/architecture` |
| MCP endpoint | `http://localhost:8787/mcp` |
| Health check | `http://localhost:8787/healthz` |

### Configuration

| Variable | Default | Constraint |
| --- | --- | --- |
| `PORT` | `8787` | Codex stdio config uses `8788` to avoid collisions |
| `BASE_URL` | `http://localhost:8787` | Must be the public HTTPS origin for ChatGPT |
| `WOVEN_DB` | `./data/woven.db` | Local demo state; ignored by Git |
| `PAYMENT_MODE` | `simulated` | Every other value fails closed |
| `OPENAI_API_KEY` | unset | Optional; enables the bounded non-camping orchestration POC. Camping, build, and CI do not require it |

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
npm test             # 33 domain, workflow, store, transport, and UI contract tests
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
3. Keep `/demo` and `/merchant` open in separate tabs (`/demo?instant` auto-starts
   the canonical rehearsal; `/demo?loop=true` replays chat submission, browser
   takeover, response, scroll, selection, the human boundary, and return to chat
   without starting identity or checkout).
4. Submit the mission in `/demo`; show the **Simulated** chat-host label as the
   real storefront takes over and waits for the shared-backend response.
5. Hold on the activation receipt: `/demo` is the non-registering rehearsal;
   actual tool discovery happens on the linked top-level `/webmcp` page in
   ChatGPT's in-app browser or WebMCP-enabled Chrome.
6. Let the browser highlight the safe compare/select actions, scroll to the two
   complete carts, add TrailHaus, and stop at **Only you can continue**.
7. Let control return to chat and show the 7-unit, 5-category, 89 L, 3,000 mm,
   pickup, and exact-total summary.
8. Click **Review in browser**, then directly click **Verify demo identity**.
9. On `/identity`, read the **DEMO ONLY** boundary and click **Continue as Chai**.
10. Return to Woven, check the session, and review the price/stock recheck.
11. Read the exact mandate, then click **Confirm**.
12. Show the simulated result, valid receipt signature, and scripted thank-you close.
13. If time permits, select **Price change** in `/merchant` and show stale-preview
   rejection.

## WebMCP showcase runbook

1. Run `npm run check`, start the service, and open `/webmcp` at 1440×900 in
   ChatGPT's in-app browser, or Google Chrome with WebMCP enabled through its
   experimental flag or origin trial.
2. Confirm the page title is **Woven Trail Market — WebMCP Showcase**, the page
   opens idle in **Connected stores**, and exactly seven site tools register.
3. Submit the hero request or call `start_mission`. Both paths must update the
   same activity surface and inline kit results.
4. In an unconfigured local environment, show the truthful total-failure state,
   then click **Use showcase data**. Do not claim this is a live connector result.
5. Show the best two kit cards and read the TrailHaus proof: 7 units, 5
   categories, 89 L packed, 3,000 mm rainfly, S$231.
6. Expand **View 7 WebMCP site tools and activity** and point out that identity,
   checkout, confirmation secrets, and purchase authority are absent.
7. Select a kit and show the separate solid human handoff. If the popup is
   blocked, the same direct action exposes an **Open verification page** fallback.
8. Repeat at 390×844. The activity surface must be a collapsible, non-modal
   bottom sheet with no focus trap; collapse it to keep the cart actionable.
9. Use `docs/assets/screenshots/webmcp-workspace-{ready,desktop,mobile,status}.png`
   as the verified recording/gallery references.

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
Thumbnail/gallery uploads and final publication remain outstanding. The public
demo video is available at <https://youtu.be/FrppMZYmLeg>. The three-minute
Remotion master is at `output/Woven-Judge-Video.mp4`, the current one-page brief
is at `output/pdf/Woven-Project-Brief.pdf`, and the Devpost-only thumbnail is at
`output/devpost/woven-thumbnail-3x2.png`; generated `output/` artifacts remain
ignored by Git.

The verified public demo URL is <https://visa-woven.vercel.app/demo>.

The WebMCP challenge route is live at
<https://visa-woven.vercel.app/webmcp>. The corrected 2:58 master is
`output/Woven-WebMCP-Challenge.mp4` and is public at
<https://youtu.be/_v84xyD8CkM>. YouTube reported no copyright or Community
Guidelines issues, the timed English captions are published, and the public
Devpost page embeds this video.

The WebMCP Challenge entry at <https://devpost.com/software/woven-wzefyv> is
submitted (`5/5 steps done`). Additional Info still says `Individual` while the
challenge's team-management page lists multiple people; confirm the intended
entrant type and representative authority before making any team changes.

The current WebMCP Challenge teammate listing on Devpost is:

- Chai Pin Zheng (`@Ducksss`)
- Krish Gupta (`@23guptakrish`)
- arav cabral (`@arav31`)

Before publishing Devpost, a human must provide or confirm:

- public HTTPS demo URL (<https://visa-woven.vercel.app> is live; confirm it is the final one);
- whether the post-event form still exposes a project-description PDF field;
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
guided storefront rehearsal are merged into `main`; `/demo`'s labeled simulated
host behavior is current product, not an archive. Before changing branches or worktrees,
inspect
`git worktree list` and preserve dirty state on a branch.

## Highest-value next work

Unless the user changes direction, prioritize in this order:

1. **WebMCP entrant reconciliation:** confirm whether the submitted entry should
   be `Individual` or `Team of Individuals`, verify representative authority,
   and update Devpost only with explicit human direction.
2. **Real ChatGPT connection:** connect the deployed `/mcp` endpoint in Developer
   Mode and verify the widget, private metadata, CSP and tool calls.
3. **Public orchestration smoke check:** with an intentionally supplied
   `OPENAI_API_KEY`, run one non-camping request against the deployed service and
   confirm connected carts remain distinct from research-only web leads.
4. **LifeHack Devpost publication:** upload the ten gallery assets, add the project PDF if
   the field still exists, complete logged-out link checks, and publish only with
   explicit user authorization.
5. **Post-hackathon validation:** interview merchants/users before treating the
   open-world POC as a production engine or adding production integrations.

## Do not expand by default

These ideas are intentionally deferred, not forgotten:

- Google search result injection or a Chrome extension;
- scraping merchants or presenting seeded stock as live;
- production user accounts, onboarding, refunds, disputes or fulfilment;
- production-scale multi-category optimization or a general solver beyond the
  implemented bounded POC;
- extra services, queues, caches or databases;
- live Visa calls without the exact approved product and credentials.

The five-category camping engine and exact guided `/demo` sequence remain deliberate
stage constraints. The open-world path is an implemented architecture POC: it
must stay bounded, web-research-only outside connected catalogs, credential
dormant in CI, and fail closed until real connectors and validation exist.

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
