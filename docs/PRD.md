# Woven implemented PRD

## Product statement

Woven is a personal commerce system that builds a complete kit around a user’s
mission instead of returning a list of product links. Its primary experience is
an MCP App inside ChatGPT/Codex and a WebMCP-enabled browser workspace, while
its backend owns mission routing,
orchestration, deterministic commerce verification, persistence, and checkout.
It crosses the purchase boundary only after the user confirms an exact mandate.
The stage demo remains deterministic camping; an implemented bounded
orchestration POC demonstrates how the same trust boundary generalizes to other
retail categories.

## Demo objective

Within three minutes, an audience should see:

1. A natural-language camping mission open five ranked, pickup-ready carts in a Choice Center.
2. The user compare full carts, rerank by priority or area, and optionally swap only merchant-approved compatible items.
3. A visible proof that rain protection, capacity, two sleep systems, packed volume, lighting, first aid, stock, pickup, and budget all work together.
4. A simulated connector-style identity handoff be enforced before checkout.
5. An exact checkout preview be bound to that identity session, merchant, items,
   total, version, and expiry.
6. An explicit user confirmation produce a clearly simulated Visa authorization and signed, server-verifiable receipt.
7. A merchant operator control substitutions and force stock, price, authorization, and order failure paths without changing code.

## Primary persona

A first-time camper who knows the trip they want but does not want to calculate quantities, compare weather ratings, check whether the gear fits one car, reconcile merchant stock, and rebuild checkout separately.

## Canonical story

> I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it
> under S$300, fit it in one car boot, and make it pickup-ready today.

Assumptions are explicit: the gear scope covers shelter, sleep, lighting, and
first aid; food, water, clothing, transport, and campsite booking are already
handled; 120 L is reserved in the car boot; inventory and pickup times are
seeded; every price is in SGD.

## Functional requirements

- Run as a current MCP App with a React widget in ChatGPT/Codex.
- Expose a top-level `/webmcp` workspace with imperative WebMCP tools registered
  through `document.modelContext.registerTool` (falling back to Chrome's early
  `navigator.modelContext`) and removed through an abort-bound lifecycle.
- Return compact, model-sized tool results that carry cart ids, human-readable
  totals, and the next human-only step; accept merchant, location, and item
  names as well as ids; and mirror every agent call in a visible shared
  activity rail beside the person's own actions.
- Let WebMCP agents start or inspect missions, compare/select carts, apply only
  approved swaps, refresh current carts, and verify receipts; never expose demo
  identity, checkout-preview, or purchase-confirmation tools to the agent.
- Treat MCP as the interaction/tool transport, not the mission engine: the
  backend owns workflow routing, evidence classification, cart composition, and
  checkout eligibility.
- Offer a browser fallback that uses the same backend rules.
- Let `/demo?loop=true` run an unattended, non-purchasing visual walkthrough of
  comparison, reranking, compatibility proof, approved swaps, the simulated
  identity success, and a host acknowledgement.
- Seed at least three merchants and two locations per merchant.
- Return five complete location choices for the canonical mission and open them
  in an accessible native dialog.
- Compare exact full-cart totals, pickup timing, travel area, rain protection,
  and available substitutions.
- Rerank locally by balanced score, value, pickup speed, weather protection, or
  preferred area; persist preferences only after explicit opt-in.
- Apply hard compatibility, inventory, pickup, and budget constraints before ranking.
- Keep each recommended cart at one merchant/location.
- Show why every component is compatible.
- Show a pickup plan with ready time, travel estimate, leave-by time, and store close.
- Permit only active merchant-approved substitutions, then revalidate the
  complete same-location cart under all hard constraints.
- Revalidate immediately before preview and confirmation.
- Require a server-enforced demo identity session before preview.
- Use an opaque subject, short-lived server session, allowlisted callback,
  `state`, PKCE, and a single-use authorization code.
- Keep identity secrets out of MCP arguments and model-visible content.
- Reject missing, expired, reused, or mismatched identity sessions.
- Refresh pending identity status inside the current widget and reopen the
  authorization handoff when verification is still incomplete.
- Bind the verified identity session to the exact checkout preview.
- Require a direct user click for confirmation.
- Bind confirmation to exact immutable terms with expiry and one-time nonce.
- Make order creation idempotent and inventory mutation atomic.
- Simulate approval, decline, merchant failure/reversal, stockout, and price change.
- Sign successful simulated receipts on the server and expose a verification tool.
- Give the merchant console inventory CSV import/export, substitution controls,
  scenario controls, orders, audit, and reset.
- Never accept or persist payment credentials.
- Route non-camping missions through a fixed, two-pass LangGraph.js workflow:
  interpret, connected and web discovery, normalize, compose, verify, optional
  retry, then persist.
- Keep graph edges and termination code-selected rather than model-selected; the
  model may produce a structured `MissionSpec` and cited research, but it cannot
  grant checkout eligibility.
- Validate a category-neutral `MissionSpec` with hard predicates, quantities,
  compatibility links, assumptions, SGD budget, Singapore market, and pickup date.
- Cap open-world work at two discovery passes, three web-search tool calls,
  eight connected offers per requirement, five final carts, and 25 seconds.
- Treat connected-catalog facts as the only checkout evidence. Web results are
  cited research leads and never gain select, identity, preview, or purchase controls.
- Rebuild every persisted connected cart from current SQLite price, stock,
  attributes, merchant, and location before preview and confirmation.
- Keep the canonical `/demo` sequence and exact five-cart result unchanged when
  OpenAI is unavailable; non-camping missions fail with retryable
  `AGENT_UNAVAILABLE` instead of fabricated results.

## Non-goals for this prototype

- Treating web search or a result-page injection as verified commerce data.
- Scraping live merchants or claiming real inventory.
- Real Visa authorization without an approved product, sandbox credentials, and compliance review.
- Production identity verification, user accounts, merchant onboarding, fulfillment integrations,
  refunds, or disputes.
- Production-scale multi-category optimization, scraping, or live merchant connectors.
- An unbounded autonomous agent, model-selected workflow, or MCP host model acting
  as Woven's checkout authority.

## Implemented demo identity extension

The connector-style **demo identity** flow is a prototype trust gate, not KYC,
production identity verification, a real Visa login, or a claim of a Visa
identity product. It:

- shows a prominent “DEMO ONLY” boundary and collects no passwords, card details,
  or Visa credentials;
- uses an opaque subject identifier and short-lived server-side session;
- uses an allowlisted callback, `state`, PKCE, and a single-use authorization
  code;
- keeps identity tokens out of MCP arguments and model-visible content;
- rejects checkout when the identity is missing, expired, reused, or bound to a
  different session;
- binds the verified subject to the exact checkout preview; and
- preserves a separate direct confirmation for the exact merchant, items, amount,
  expiry, nonce, and idempotency key.

The UI is backed by server-side enforcement. A static imitation alone does not
satisfy this contract.

## Acceptance criteria

- `npm run check` passes.
- `start_mission` returns five complete carts for the canonical request.
- The home-office fixture produces a complete, compatible, checkout-eligible
  connected cart; a web-only fixture produces cited research with checkout disabled.
- Every hard open-world requirement and compatibility link is `verified` before
  checkout eligibility becomes true; missing attributes and evidence fail closed.
- Open-world graph tests cover one retry, timeout, malformed structured output,
  rate limiting, untrusted web content, bounded ranking, and guaranteed termination.
- The MCP and browser transports enter the same server-owned mission router, and
  only the non-camping route enters the bounded LangGraph.js workflow.
- `/webmcp` registers exactly seven discoverable site tools with closed JSON
  schemas, updates the shared visible Choice Center, and preserves human-only
  identity and exact purchase confirmation.
- WebMCP results never include the confirmation nonce, identity session data,
  or receipt signatures; `select_cart` resolves merchant and location names and
  rejects ambiguous matches with the candidate cart ids; `refresh_carts`
  reports per-location price, stock, and rebuild changes; and every call is
  reported to the page as running, then done or failed.
- Every returned cart is within S$300 and contains a tent, two sleeping bags,
  two sleeping mats, a rain-ready lantern, and a first-aid kit from one pickup
  location.
- Every tent covers two campers with at least a 2,000 mm rainfly, every cart fits
  within the 120 L packed-gear allowance, and every required unit is in stock.
- The Choice Center opens automatically, supports keyboard dismissal, and can be reopened.
- Preference persistence is off by default and removable by clearing the opt-in checkbox.
- A withdrawn or invalid substitution cannot form a selectable custom cart.
- Checkout preview fails without a current verified demo identity session.
- Expired, reused, or replaced demo identity sessions cannot preview or confirm.
- Identity-session secrets never appear in model-visible mission or preview data.
- The checkout nonce never appears in public mission view data.
- Missing identity cannot create a checkout preview.
- A pending identity status click either renders the verified server state in
  the same widget or reopens the authorization handoff.
- Expired, reused, or replaced identity sessions cannot confirm a purchase.
- Identity session IDs and subjects never appear in the public mission view.
- A wrong nonce is rejected.
- A changed price or stock invalidates the old preview.
- Reusing an idempotency key returns the same order and decrements stock once.
- Decline and reversal scenarios create no confirmed receipt.
- A confirmed receipt verifies with its stored HMAC signature and rejects a
  modified signature.
- `/` (landing), `/demo`, `/webmcp`, `/identity`, `/merchant`, `/architecture`,
  `/healthz`, and `/mcp` run from one process.
- Plugin manifests pass Codex plugin validation.
- `/demo?loop=true` completes the server-enforced simulated identity handoff,
  then replays without creating a checkout mandate, confirming a purchase, or
  mutating inventory.
