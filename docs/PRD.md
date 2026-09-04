# Woven implemented PRD

## Product statement

Woven is a personal commerce system that builds a complete kit around a user’s
mission instead of returning a list of product links. Its primary experience is
an MCP App inside ChatGPT/Codex and the fictional Woven Trail Market storefront
in a WebMCP-enabled browser, while
its backend owns mission routing,
orchestration, deterministic commerce verification, persistence, and checkout.
It crosses the purchase boundary only after the user confirms an exact mandate.
The stage demo remains deterministic camping; an implemented bounded
orchestration POC demonstrates how the same trust boundary generalizes to other
retail categories.

## Demo objective

Within three minutes, an audience should see:

1. A person submit one natural-language camping mission in the clearly labeled original LifeHack `Woven Demo Host` conversation and see the Woven Trail Market browser take over the same presentation surface.
2. The browser explicitly announce **WebMCP rehearsal active**, disclose the seven reversible site actions and human-only boundary, then show truthful safe-site activity while the storefront waits for the real shared-backend response.
3. Highlighted reversible `compare_carts` and `select_cart` actions choose TrailHaus and reveal proof that rain protection, capacity, two sleep systems, packed volume, lighting, first aid, stock, pickup, and budget all work together.
4. The guided browser stop at a solid human-only handoff, return control to chat with an exact cart summary, and leave identity or checkout to a direct user action.
5. A direct user action enforce the simulated connector-style identity handoff before an exact checkout preview bound to that identity session, merchant, items,
   total, version, and expiry.
6. An explicit user confirmation produce a clearly simulated Visa authorization and signed, server-verifiable receipt.
7. The hosted MCP App independently retain its five-cart Choice Center, and a merchant operator control substitutions and force stock, price, authorization, and order failure paths without changing code.

The dedicated `/webmcp` showcase opens idle. A person or agent can start the same
mission from the Woven Trail Market page, watch truthful observable activity,
compare the best two complete one-store kits, and then hand off to direct
human-only identity and merchant controls. `/demo` is its stage-safe guided
rehearsal; the hosted MCP App remains the canonical five-cart in-chat surface.

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
- Expose a dedicated top-level `/webmcp` Woven Trail Market storefront with
  imperative WebMCP tools registered through `document.modelContext.registerTool`
  and removed through an abort-bound
  lifecycle.
- Keep Shop, Complete kits, Field guide, and Cart as working anchors. Human
  mission submission and agent `start_mission` invocation must drive the same
  visible mission state.
- Default each new browser session to connected-store mode. Seeded showcase data
  is a session-local explicit choice and must never be a silent live fallback.
- Model storefront activity as `idle`, `running`, `resolved`, `degraded`, or
  `error`; abort superseded work, ignore stale responses, and invalidate private
  handoff state on selection, swap, or refresh.
- While work is pending, display one truthful indeterminate operation and pending
  downstream checks. Reveal connector status, cart composition, evidence, and
  totals only from a returned `MissionView`; never simulate backend progress or
  expose model reasoning.
- Render the best two complete one-store kits with original fictional product
  cutouts, exact quantities and totals, pickup readiness, source platform,
  verification time, compatibility evidence, and deterministic cart metrics.
- Use a single translucent “Behind the cart” surface. On desktop it floats in a
  reserved column; on mobile it becomes a collapsible non-modal bottom sheet
  with no focus trap. Commerce results and human authorization surfaces remain
  solid and high contrast.
- Let WebMCP agents start or inspect missions, compare/select carts, apply only
  approved swaps, refresh current carts, and verify receipts; never expose demo
  identity, checkout-preview, or purchase-confirmation tools to the agent.
- Treat MCP as the interaction/tool transport, not the mission engine: the
  backend owns workflow routing, evidence classification, cart composition, and
  checkout eligibility.
- Preserve the clearly labeled original LifeHack `Woven Demo Host` shell at
  `/demo`; embed the real storefront entry, submit through the same mission backend, let the
  browser take over the presentation while safe WebMCP-equivalent actions are
  highlighted, scroll only after a returned result, select a cart through the
  existing reversible action, stop at the human-only handoff, and return the
  selected result to chat. The host document must not register WebMCP tools.
- Pace `/demo` as a five-beat presentation over real state: connection, returned
  kits, comparison, reversible choice, and human handoff. Provide keyboard-safe
  Pause/Resume, Next beat, and Replay controls. Pause may stop only presentation
  holds; it must not cancel or manufacture an in-flight backend result, and Next
  beat must remain unavailable during real network work.
- On a directly opened `/webmcp`, distinguish unsupported, registering,
  connected, and failed WebMCP states. Show “WebMCP active · 7 tools” only after
  all seven abort-bound registrations have resolved. The framed rehearsal must
  identify itself as a rehearsal rather than claim a live top-level connection.
- Make the testing path explicit in both browser surfaces: `/demo` must link to
  the real top-level `/webmcp` surface and identify that its embedded frame does
  not register tools; unsupported or failed `/webmcp` sessions must direct
  people to ChatGPT's in-app browser or Google Chrome with WebMCP enabled through
  its experimental flag or origin trial, with a link to the official guide.
- Let `/demo?loop=true` run an unattended, non-purchasing visual walkthrough of
  chat submission, browser takeover, real mission resolution, verified cart
  browsing, reversible cart selection, the human-only boundary, and the return
  to chat before replaying.
- Seed at least three merchants and two locations per merchant.
- Return five complete location choices for the canonical mission and open them
  in an accessible native dialog.
- Compare exact full-cart totals, pickup timing, travel area, rain protection,
  and available substitutions.
- Rerank locally by balanced score, value, pickup speed, weather protection, or
  preferred area; persist preferences only after explicit opt-in.
- Apply hard compatibility, inventory, pickup, and budget constraints before ranking.
- Keep each recommended cart at one merchant/location.
- Attach deterministic metrics to every ranked cart: unit count, category count,
  optional packed liters, and optional tent waterproof rating. Canonical
  connected carts report 7 units, 5 categories, 89 L, and 3,000 mm.
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
- Keep the canonical camping engine and exact five-cart MCP App result unchanged
  when OpenAI is unavailable; `/demo` rehearses the best-two storefront view of
  that same result, and non-camping missions fail with retryable
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
- `/webmcp` serves its dedicated storefront entry and registers exactly seven
  discoverable site tools with closed JSON schemas. Human submission and site
  tool invocation update the same visible results/activity state while identity,
  exact checkout, confirmation secrets, merchant continuation, and purchase
  authority remain human-only.
- Connected mode returns one healthy cart when one connector fails, with a
  warning. Total connector failure returns no fabricated cart and offers retry
  plus a manually selected showcase-data action.
- No activity step claims completed server work before a real response.
- The storefront displays the canonical cart proof as 7 units, 5 categories,
  89 L packed, and a 3,000 mm rainfly; it never repeats the illustrative 85 L.
- Model-visible mission and WebMCP results contain no checkout URL, identity
  authorization URL, confirmation nonce, or purchase secret.
- Every returned cart is within S$300 and contains a tent, two sleeping bags,
  two sleeping mats, a rain-ready lantern, and a first-aid kit from one pickup
  location.
- Every tent covers two campers with at least a 2,000 mm rainfly, every cart fits
  within the 120 L packed-gear allowance, and every required unit is in stock.
- The Choice Center opens automatically, supports keyboard dismissal, and can be reopened.
- `/demo` serves a separate guided-host entry, remains visibly labeled
  **Simulated**, embeds `/webmcp` in explicit **Showcase data** mode, and exposes
  no top-level WebMCP tools. It visibly transfers presentation control from chat
  to the browser and back, and never claims a completed step before the
  corresponding real response or reversible UI action.
- `/demo` keeps the activation boundary and each returned proof state readable
  through deterministic presentation holds, supports pause/manual advance, and
  retains the same semantic holds with animation removed in reduced-motion mode.
- The activation/testing receipt remains visible for 4.5 seconds by default,
  says that the embedded rehearsal does not register site tools, and provides
  working links to the direct storefront and official WebMCP testing guide.
- Storefront navigation, source choice, activity disclosure, cart choice, and
  mobile sheet work with a keyboard; reduced motion skips the gloss/reveal pass.
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
- `/demo?loop=true` shows the human-only boundary, returns the selected result to
  chat, then replays without starting identity, creating a checkout mandate,
  confirming a purchase, or mutating inventory.
