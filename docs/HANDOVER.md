# MissionCart AI handover

**Last updated:** 30 August 2026

**Repository:** `Ducksss/LifeHack-2026`

**Product:** MissionCart

**Current phase:** Working, submission-ready prototype; public deployment and
Devpost publishing are still outstanding.

## Read this first

MissionCart is an agentic-commerce MCP App for ChatGPT and Codex. It turns a
constrained shopping request into complete, compatible, in-stock carts from one
pickup location, explains why each cart works, and requires the user to confirm
the exact merchant, cart, and amount before a **simulated** Visa authorization.

The repository name is `LifeHack-2026`; the user-facing product name is
`MissionCart`. Do not rename the product to LifeHack.

The shortest correct product statement is:

> One mission. One compatible cart. One explicit confirmation.

## Why this direction was chosen

The project began with a broader idea: a Visa-powered extension that could layer
merchant recommendations over existing search and authorize payment after user
confirmation. The direction was narrowed to MissionCart because it produces a
stronger, more defensible demo:

- it begins inside a workflow the user already uses—ChatGPT or Codex;
- it solves the complete mission instead of inserting another product ad;
- it demonstrates compatibility, stock, pickup, budget, and trust in one flow;
- it has a visible human authorization boundary; and
- judges can test success and failure paths live.

The primary artifact is therefore an actual MCP App/plugin, not a speculative
browser extension. The browser UI at `/demo` exists only as a reliable rehearsal
and stage fallback using the same backend behavior.

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

## Current product state

| Area | Status | Notes |
| --- | --- | --- |
| Buyer MCP App | Complete | React widget using MCP Apps bridge |
| Browser fallback | Complete | `/demo`; same domain behavior over HTTP |
| Merchant desk | Complete | `/merchant`; inventory, scenarios, orders, audit, reset |
| Cart engine | Complete for canonical mission | Four required categories; one location per cart |
| Checkout safety | Complete for prototype | Expiry, hash, private nonce, exact terms, idempotency |
| Visa rail | Simulated only | Approval, decline, failure, and reversal semantics |
| Automated verification | Green | Eight tests, TypeScript/build gate, GitHub CI |
| README and gallery | Complete | Best-README structure and seven 1600×900 gallery assets |
| Devpost copy | Draft complete | Field-ready copy and demo script exist |
| Public HTTPS deployment | Not done | Required for a shareable ChatGPT connection |
| Devpost submission | Not published | Needs human/team and launch details |
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
MissionCart tools + React MCP App
    ↓
Domain rules → Node SQLite state → simulated Visa adapter
    ↑
Merchant desk: inventory, prices, scenarios, orders, audit
```

MissionCart deliberately remains one deployable Node.js service. HTTP MCP, stdio
MCP, the browser fallback, and the merchant desk all route through the same store
and domain rules. Do not split it into services without a measured reason.

### Source map

| Path | Responsibility |
| --- | --- |
| `src/domain.ts` | Types, seed catalog, mission creation, compatibility, cart ranking, preview construction |
| `src/store.ts` | SQLite schema/state, transactions, confirmation, idempotency, scenarios, CSV and audit |
| `src/payment.ts` | Simulated authorization adapter and the future real-payment replacement seam |
| `src/server.ts` | MCP tools/transports, HTTP APIs, static UI, validation and process startup |
| `web/widget.tsx` | Buyer MCP App and browser-fallback UI |
| `web/merchant.tsx` | Merchant operations desk |
| `web/styles.css` | Shared visual system and responsive layout |
| `test/domain.test.ts` | Mission, compatibility and ranking behavior |
| `test/store.test.ts` | Confirmation, security, failures, inventory and CSV behavior |
| `.codex-plugin/plugin.json` | Codex plugin metadata |
| `.mcp.json` | Local stdio MCP launch configuration |
| `docs/PRD.md` | Binding implemented product requirements |
| `docs/architecture.md` | Detailed tool contract, state machine and trust boundaries |
| `docs/DEVPOST_SUBMISSION.md` | Paste-ready Devpost story, captions, pitch and demo script |
| `docs/BRAND_GUIDE.md` | Naming, visual tokens, asset inventory and campaign prompt |

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
| Buyer fallback | `http://localhost:8787/demo` |
| Merchant desk | `http://localhost:8787/merchant` |
| MCP endpoint | `http://localhost:8787/mcp` |
| Health check | `http://localhost:8787/healthz` |

### Configuration

| Variable | Default | Constraint |
| --- | --- | --- |
| `PORT` | `8787` | Codex stdio config uses `8788` to avoid collisions |
| `BASE_URL` | `http://localhost:8787` | Must be the public HTTPS origin for ChatGPT |
| `MISSIONCART_DB` | `./data/missioncart.db` | Local demo state; ignored by Git |
| `PAYMENT_MODE` | `simulated` | Every other value fails closed |

## Non-negotiable trust boundaries

Preserve these across every change:

1. No PAN, CVV, wallet token, or payment credential may enter MissionCart.
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

```bash
npm install
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

1. Run `npm run check`, then `npm start`.
2. Open `/merchant` and click **Reset demo data**.
3. Keep `/demo` and `/merchant` open in separate tabs.
4. Run the canonical mission and explain the three complete carts.
5. Select ByteRoute and show the compatibility proof.
6. Click **Review checkout** and emphasize the price/stock recheck.
7. Read the exact S$133 mandate, then click **Confirm**.
8. Show the simulated result and pickup receipt.
9. If time permits, select **Price change** in `/merchant` and show stale-preview
   rejection.

The polished 90-second narration is in `docs/DEVPOST_SUBMISSION.md`.

## Submission handover

The README, brand system, cover, problem/benefit and buyer-journey slides,
architecture slide, product screenshots, Devpost story, captions, pitch, judge
Q&A, and recording script are complete in the repository.

Before publishing Devpost, a human must provide or confirm:

- public HTTPS demo URL;
- demo video URL;
- team member names and roles;
- eligible event categories and sponsor tracks;
- whether the event permits `visa` as a prototype tag;
- required repository visibility; and
- final logged-out link checks.

Do not invent these fields. Use the checklist in `docs/DEVPOST_SUBMISSION.md`.

## Highest-value next work

Unless the user changes direction, prioritize in this order:

1. **Public deployment:** deploy the single service behind HTTPS, set `BASE_URL`,
   preserve SQLite expectations or deliberately choose persistent storage, and
   verify `/healthz`, `/demo`, `/merchant`, and `/mcp`.
2. **Real ChatGPT connection:** connect the deployed `/mcp` endpoint in Developer
   Mode and verify the widget, private metadata, CSP and tool calls.
3. **Demo recording:** capture the 90-second happy path plus one stale-cart failure.
4. **Devpost publication:** add human/team details, upload the seven gallery assets,
   add links and publish only with explicit user authorization.
5. **Post-hackathon validation:** interview merchants/users before generalizing the
   mission engine or adding production integrations.

## Do not expand by default

These ideas are intentionally deferred, not forgotten:

- Google search result injection or a Chrome extension;
- scraping merchants or presenting seeded stock as live;
- user accounts, onboarding, refunds, disputes or production fulfilment;
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
7. updated README, PRD, architecture, Devpost copy, or this handover if their
   claims changed; and
8. reported anything still requiring human authority rather than guessing.

## Maintaining this handover

Update the date and affected sections whenever product direction, architecture,
deployment state, demo steps, external links, or outstanding work changes. Keep
this file factual and current; history belongs in Git, not in an ever-growing
chronology here.
