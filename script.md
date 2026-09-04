# Woven three-minute judge script

This is the authoritative pitch and live-demo narrative for Woven. Future agents
should update this file whenever the product, demo order, or truth boundary
changes. The existing PowerPoint is a visual aid; when it conflicts with this
file, this file wins.

## The story in one sentence

> Woven is a shopping app inside ChatGPT and Codex that turns one request into a
> complete, compatible cart—and waits for the user to approve the exact purchase
> before a simulated Visa authorization.

The audience should remember one sequence:

> **Ask once. Review once. Confirm once.**

## WebMCP Challenge recording cut

The challenge master is a separate 2:58 composition:
`output/Woven-WebMCP-Challenge.mp4`. It preserves the product truth boundaries
below, but uses a challenge-specific narration and puts the real `/webmcp`
page on screen by 0:12:

1. the browser discovers seven top-level site tools on the light fictional
   **Woven Trail Market** storefront;
2. `start_mission` changes the same page from idle to verified kits while the
   narration explains the full seven-tool surface;
3. the rainy-weekend brief and storefront show two complete one-store kits,
   including the canonical
   7 units, 5 categories, 89 L, and 3,000 mm proof;
4. the trust beat names identity, checkout terms, secrets, and purchase
   authorization as deliberately absent from WebMCP; and
5. a source-proof scene shows `document.modelContext`, closed schemas,
   annotations, and abort-bound cleanup before the final human-agent outcome.

Use configured connected stores for the recorded challenge run. If recording
locally without connector credentials, select **Showcase data** explicitly and
say that it is seeded; never imply a silent live fallback.

The challenge narration is generated with the local system TTS voice and the
sidecar captions are authored from the same source text. Do not use the older exact-3:00 judge video
for this challenge: the rules require a video shorter than three minutes and a
visible WebMCP demonstration.

## Current product versus target storyboard

| Capability | Status | May be demonstrated as live? |
| --- | --- | --- |
| MCP App/plugin in ChatGPT or Codex | Working | Yes |
| Bounded non-camping mission orchestration | Working, credential-dormant POC | Only in a configured technical walkthrough; not the canonical stage flow |
| Browser fallback using the same backend | Working | Yes |
| Complete one-merchant carts | Working | Yes |
| Compatibility, budget, stock, and pickup proof | Working with seeded demo data | Yes, call the data seeded |
| Exact expiring checkout preview | Working | Yes |
| Separate direct user confirmation | Working | Yes |
| Simulated Visa approval, decline, and reversal | Working | Yes, always say simulated |
| Merchant inventory, scenarios, orders, and audit | Working | Yes |
| Connector-style demo identity handoff | Working simulator | Yes, always say simulated |
| Live Visa authorization or partnership | Not implemented | No |

The identity screen is backed by a server-enforced session gate. Present it as a
working simulator, never as production identity verification, KYC, or a Visa login.

## Stage setup

Before judges arrive:

1. Run `npm run check`.
2. Start Woven with `npm start`.
3. Open `http://localhost:8787/merchant` and select **Reset demo data**.
4. Keep the MCP App or `http://localhost:8787/demo` ready in the foreground.
5. Keep `/merchant` open in a second tab with the scenario set to **Normal**.
6. Confirm that TrailHaus totals **S$231.00** for the canonical request.
7. Rehearse the happy path once, then reset the data again.

Use the real MCP App when the host and network are dependable. Use `/demo` as the
stage fallback; it preserves the original LifeHack `Woven Demo Host` shell and
clearly labels it **Simulated**,
lets the real Woven Trail Market storefront take over the framed presentation,
and rehearses the same backend without presenting itself as ChatGPT. For an
unattended visual loop, `/demo?loop=true` presents the full rehearsal inside an
unbranded laptop frame, waits for the real mission response, highlights the
safe browser actions, scrolls to the verified kits, adds TrailHaus, stops at the
human-only boundary, returns the result to chat, and then replays. It never
starts identity, creates exact checkout terms, or confirms a purchase.

The guided run is intentionally paced. Leave autoplay running for the clean
15–18 second story, or use **Pause**, **Next beat**, and **Replay** in the fixed
control rail. Pause affects only the explanatory holds after real states; the
mission or cart-selection request continues. The connection receipt must be
readable as **WebMCP rehearsal active** before the first site action begins. It
stays visible for 4.5 seconds, states that the embedded rehearsal does not
register tools, and links to the real top-level storefront. Actual WebMCP testing
uses ChatGPT's in-app browser or Google Chrome with WebMCP enabled through its
experimental flag or origin trial.

## Visual system and screen choreography

The seven main slides are signposts, not teleprompters. Keep the deck full-screen
and use hard cuts between slides and product screens; do not add decorative
animations. Judges should always be looking at one of three things: the problem,
working product evidence, or the conclusion.

| Beat | Primary screen | What the judge must notice |
| --- | --- | --- |
| Slides 1–3 | Full-screen deck | The problem, complete-cart promise, and concrete S$231.00 proof |
| Slide 4 → buyer demo | Prompt slide, then MCP App or `/demo` | One natural-language request becomes five complete carts |
| Slide 5 → checkout demo | Trust-boundary slide, then buyer checkout | The exact terms are visible and only the user can confirm |
| Slide 6 → Merchant Desk | Merchant-control slide, then `/merchant` if time permits | Stock, scenarios, orders, and audit are controllable |
| Slide 7 | Full-screen deck | Why the product belongs inside ChatGPT/Codex |

Deck rules:

- Use 16:9 throughout. Keep the Woven wordmark and slide number quiet at the
  edges; the main claim should dominate.
- Alternate Route Ink (`#0E4B3B`) statement slides with Runway Paper
  (`#F4EEE4`) evidence slides. Signal Lime highlights progress; Waypoint Blue is
  reserved for the simulated payment boundary.
- Use one large claim, one supporting composition, and no paragraphs on screen.
- Use verified product screenshots for product claims. Editorial camping
  imagery may introduce the story but must not substitute for product evidence.
- In the live browser, use a readable zoom level, close unrelated tabs and
  notifications, and keep the visible **Simulated** label when using `/demo`.
- Keep the cursor still while speaking. Move it only to point or perform the next
  action.

## Three-minute run of show

### 0:00–0:12 — Slide 1: Shopping should start and finish with one request

**Visible copy**

> Shopping should start and finish with one request.  
> **Woven**  
> Everything works together.

**Layout and what to show**

- Route Ink full-bleed background.
- Left 55%: the headline in two or three large lines, with the stage line
  **Ask once. Review once. Confirm once.** small at the bottom.
- Right 35%: the complete camping hero image, showing a rainproof tent, two
  sleeping bags, two mats, a lantern, and first-aid kit connected by the Signal
  Lime route.
- Show no interface yet. This slide establishes the human problem and the Woven
  name before demonstrating the product.

**Presenter cue:** Start with hands off the laptop. Advance only after “finish
that process.”

**Say**

> “We already ask ChatGPT what to buy. But actually buying still means opening
> tabs, checking compatibility, finding stock, and rebuilding everything at
> checkout. We built Woven to finish that process.”

### 0:12–0:30 — Slide 2: Search gives links. Buying still takes work.

**Visible copy**

> Size every item · Check rain ratings · Fit one car · Rebuild checkout

**Layout and what to show**

- Runway Paper background.
- Left 42%: the title, with **Rebuild the cart at checkout** in Alert Clay as the
  consequence.
- Right 50%: three numbered horizontal steps—**Size every item**, **Check rain
  ratings**, **Fit one car**—ending at a lime rule that visually stops
  before checkout.
- Do not show logos or generic search screenshots. The incomplete process is the
  visual.

**Presenter cue:** Point once down the three steps as you say “works together,
fits your budget, is available today.”

**Say**

> “Imagine planning a first camping trip for two on a rainy weekend. Search can
> recommend a tent, but it does not guarantee rainproof shelter, a complete sleep
> system for each person, lighting and first aid, one-car fit, budget, stock, and
> one pickup location.”

### 0:30–0:48 — Slide 3: Woven returns a complete cart, not another list

**Visible copy**

> One merchant · Seven required units · Rain-ready · One car boot

**Layout and what to show**

- Runway Paper background with the claim across the top.
- Left 28%: three oversized proof points stacked vertically—**1 merchant and
  pickup point**, **7 units across 5 gear categories**, **89 L and S$231.00
  within both hard limits**.
- Right 62%: a large verified buyer-results screenshot showing the five-choice
  modal. Crop closely enough that the choices and totals are legible.
- Signal Lime marks completeness; Alert Clay may emphasize the S$231.00 total.

**Presenter cue:** Point in order to **1**, **7**, then **S$231.00**. End by moving
your hand toward the product screenshot and say, “Let me show you.”

**Say**

> “Woven understands the complete request, eliminates incompatible combinations,
> and creates ready-to-buy carts. Every cart comes from one merchant and one
> location, with proof that every component and quantity fits the same trip.”

**Transition**

> “Let me show you.”

### 0:48–1:30 — Slide 4 → live buyer demo: ask once

**Slide 4 layout and what to show**

- Route Ink full-bleed background.
- Left 68%: the canonical request as one large quotation.
- Right 24%: a thin constraint rail listing **Rainy weekend**, **2 first-time
  campers**, **S$300 hard cap**, and **1 car boot**.
- Bottom-left: **5 complete choices. 1 natural sentence.** in Signal Lime.
- Keep this slide up only long enough for the judges to read the request, then
  cut directly to the live buyer surface.

**Live screen sequence**

Enter or reveal the canonical request. In `/demo`, submit it from the simulated
chat and let the storefront take over the presentation surface:

> I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it
> under S$300, fit it in one car boot, and make it pickup-ready today.

Then:

1. Show the host header so the environment is honest: real ChatGPT/Codex when
   connected, or the clearly labeled **Simulated** host in `/demo`.
2. In `/demo`, click **Send mission**. The tool card evaluates the request, then
   the browser takes over. Pause for the explicit **WebMCP rehearsal active**
   receipt: this embedded scene is the non-registering rehearsal; the direct
   `/webmcp` link is the actual seven-tool test surface, while identity,
   checkout terms, and purchase authorization are not shared. The real
   storefront pending state then waits for the shared-backend response; do not
   narrate protocol details.
3. Let the storefront reveal the best two of five complete candidates and scroll
   to the verified cards. In the MCP App, pause on the five-cart Choice Center.
4. Let `/demo` hold the comparison, move the visible agent cursor to TrailHaus,
   highlight the reversible `compare_carts` and `select_cart` actions, add
   TrailHaus, and stop at **Only you can continue** while the rail changes to
   **Human control required**. In the MCP App,
   select TrailHaus directly.
5. Let the browser return control to chat, then point to the pickup summary and the two-person
   tent and 3,000 mm rainfly, two sleeping bags, two
   mats, IPX4 lantern, first-aid coverage, 89 L packed volume, pickup location,
   seeded demo stock, and **S$231.00** total.

**Screen priority:** Keep the takeover or returned chat result large enough that
the product names, quantity proof, pickup location, and total are readable. The
framed browser chrome in `/demo` is intentional; developer tools and unrelated
browser chrome are never part of the shot.

**Fallback frame:** `docs/assets/screenshots/demo-guided-desktop.png`.

**Say**

> “Woven returned five complete candidates—not loose product links—and this
> storefront is showing the best two. This S$231.00
> cart includes a rainproof tent, a sleeping bag and mat for each camper, an
> IPX4 lantern, and water-resistant first aid. All seven required units fit one
> car boot, stay under budget, and are ready at one pickup location.”

Do not explain the ranking algorithm unless a judge asks. The visible result is
the proof.

### 1:30–2:15 — Slide 5 → live checkout: the user controls authorization

**Slide 5 layout and what to show**

- Runway Paper background.
- Left 35%: **The AI recommends. The user authorizes.** with **Two separate trust
  gates** in Alert Clay.
- Right 57%: a three-step vertical path—**Verify demo identity**, **Review exact
  terms**, and **Confirm once**, each labeled **WORKING · SIMULATED** where relevant.
- Use this slide as a five-second trust-boundary bridge, then cut back to the
  selected TrailHaus cart in the live buyer surface.

1. Click **Review checkout**.
2. Woven displays **Verify demo identity**.
3. Open the connector-style page with this exact boundary:

   > Connect your demo identity  
   > **DEMO ONLY — No Visa account or card details are accessed.**  
   > Continue as Chai

4. Click **Continue as Chai**, close the completed handoff tab, and select
   **I’ve verified · check status** in Woven.
5. Select **Review exact terms**, then show the exact merchant, five products,
   seven units, pickup location, total, and expiry.
6. Rest the cursor beside **Confirm S$231.00** and pause for one beat.
7. Confirm and show the blue simulated Visa result and valid signed receipt.

**What must remain visible:** **Demo only** on the identity page, the full amount
on the confirmation button, the expiry, the **simulated** payment label, and the
receipt state after the click.

**Fallback frames:** `docs/assets/demo/02-review-once.png` followed by
`docs/assets/demo/03-confirm-once.png`.

**Say**

> “Before checkout, Woven enforces a connector-style demo identity handoff. It
> never asks for a Visa password, card number, or payment credentials.”
>
> “Woven then rechecks price and stock and presents the exact merchant, products,
> and total. The AI cannot approve this screen—the user must click confirm.”
>
> “Only after that confirmation does Woven produce a simulated Visa authorization
> and a server-verifiable signed receipt. No real charge occurs.”

Demo authentication and purchase confirmation must remain two separate user
actions. Do not describe the flow as KYC, production identity verification, a
real Visa login, or Visa OAuth.

### 2:15–2:35 — Slide 6 → Merchant Desk: merchants control what the AI can sell

Show the Merchant Desk with inventory, orders, scenario controls, and audit.

**Visible copy**

> Import inventory · Update price and availability · Receive exact orders · Audit
> every action

**Layout and what to show**

- Route Ink full-bleed background.
- Left 28%: four short merchant actions stacked vertically—**Import validated
  inventory**, **Update availability in seconds**, **Receive exact confirmed
  orders**, **Inspect every action**.
- Right 62%: a large verified Merchant Desk screenshot with inventory, scenario
  controls, and recent activity visible.
- If the live tab is already prepared, cut to `/merchant` after two seconds and
  point to **Normal**, the TrailHaus stock row, the confirmed order, and the audit
  event. Otherwise remain on the verified screenshot; do not waste time loading.

**Fallback frame:** `docs/assets/demo/04-merchant-control.png`.

**Say**

> “On the merchant side, Woven already supports inventory import, price and stock
> controls, orders, and an audit trail. Merchants can simulate a price change,
> stockout, authorization decline, or reversal without changing code.”

Do not call the current CSV workflow a production merchant integration or claim
that Woven reads live merchant inventory.

### 2:35–3:00 — Slide 7: The checkout belongs where the request begins

**Visible copy**

> ChatGPT understands the request.  
> Woven builds the right cart.  
> The user controls authorization.

Close with:

> **Ask once. Review once. Confirm once.**

**Layout and what to show**

- Route Ink full-bleed background.
- Left 48%: the closing claim, then three short lines—**ChatGPT understands**,
  **Woven builds**, **The user controls authorization**.
- Right 42%: one verified composite showing the cart and exact confirmation
  states. Keep **Demo identity simulated** and **Visa authorization simulated** visible
  in the lower edge treatment.
- Signal Lime carries the eye from the request to the cart; Waypoint Blue marks
  only the simulated authorization result.
- Finish with **Ask once. Review once. Confirm once.** visible. Do not end on a
  generic thank-you slide.

**Presenter cue:** Return to center, stop touching the laptop, and deliver the
last sentence directly to the judges.

**Say**

> “Why ChatGPT? Because that is where the user’s request already exists. Why a
> plugin? Because Woven can turn that conversation into merchant actions and a
> reviewable checkout without asking the user to start again.”
>
> “This prototype uses seeded inventory, a server-enforced demo identity check,
> and a simulated Visa authorization. No live charge occurs.”
>
> “Woven makes shopping through AI simple enough to use—and controlled enough to
> trust.”

## If the live demo fails

1. Move immediately to `/demo`; do not debug on stage.
2. If the server itself is unavailable, show the numbered 16:9 fallback sequence:
   - `docs/assets/demo/01-ask-once.png`
   - `docs/assets/demo/02-review-once.png`
   - `docs/assets/demo/03-confirm-once.png`
   - `docs/assets/demo/04-merchant-control.png`
3. Use `docs/assets/demo/05-close.png` to finish if the slide deck is also
   unavailable.
4. Keep `docs/assets/screenshots/` as the uncropped source evidence behind these
   frames.
5. Narrate only what the screenshots prove.
6. Never substitute a static identity mock and describe it as verification.

Recovery line:

> “This is our stage fallback over the same Woven backend. The primary product is
> the MCP App inside ChatGPT and Codex.”

## Judge answers

**Is this a browser extension?**

No. Woven is an MCP App/plugin inside ChatGPT or Codex. `/demo` is a clearly
labeled simulated ChatGPT-style host that yields its screen to the real
storefront, receives the result back, rehearses the same backend, exposes no
site tools itself, and never presents itself as ChatGPT.

**Why not build another shopping app?**

The user has already explained the request in ChatGPT. Woven adds complete-cart
reasoning, merchant tools, and a controlled checkout without making them repeat
the work elsewhere.

**Is Woven just an MCP server?**

No. MCP is the interaction and tool-transport layer. Behind `start_mission`, the
Woven service routes the canonical camping request to its deterministic engine
and other categories to a bounded LangGraph.js workflow that interprets a
validated mission, discovers connected offers and cited research, composes and
verifies candidates, and stops after at most two passes. Deterministic server
rules—not MCP or the model—decide checkout eligibility.

**Does Woven verify identity today?**

Yes, through a simulated connector-style account check. The server validates
state, PKCE, an allowlisted callback, a single-use code, and a short-lived opaque
session before checkout. It is not Visa identity verification or KYC, and final
purchase confirmation remains separate.

**Does it make real Visa payments?**

No. The Visa response is visibly simulated, no payment credentials are accepted,
and the server fails closed outside simulated mode.

**What stops the AI from buying silently?**

Checkout tools are app-only, the confirmation secret is hidden from the model,
the terms expire, and only a direct user action can confirm the exact cart and
amount.

**What is real on the merchant side?**

The Merchant Desk, CSV inventory updates, scenario controls, order state, and
audit trail are working. The catalog and inventory values are seeded demo data,
not live merchant feeds.

## Language guardrails

Always say:

- “MCP App” or “plugin”
- “MCP interaction layer” and “bounded orchestration backend” when explaining architecture
- “complete cart”
- “simulated Visa authorization”
- “seeded demo inventory”
- “direct user confirmation”
- “server-enforced demo identity handoff”

Never say:

- “Visa OAuth”
- “Visa login”
- “Visa partnership”
- “live inventory”
- “real payment” or “charged”
- “production identity verified”
- “autonomous purchase” when a human confirmation is required
- “MCP does the reasoning” or “the model decides checkout eligibility”

## Maintenance rule

When the identity flow changes, update all of the following in the same change:

- `AGENTS.md`
- `README.md`
- `docs/PRD.md`
- `docs/architecture.md`
- `docs/HANDOVER.md`
- `docs/DEVPOST_SUBMISSION.md`
- this script
- the pitch deck and any screenshots that show checkout

Run `npm run check`, exercise the complete buyer flow, and verify that missing,
expired, reused, or mismatched identity sessions cannot reach confirmation.

When mission routing, orchestration, or evidence rules change, update
`AGENTS.md`, `README.md`, `docs/PRD.md`, `docs/architecture.md`,
`docs/HANDOVER.md`, `docs/INSTALLATION.md`, `docs/DEVPOST_SUBMISSION.md`, this
script, and the current architecture diagram source in the same change. Keep the
canonical stage flow deterministic unless the implemented demo itself changes.
