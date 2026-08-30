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

## Current product versus target storyboard

| Capability | Status | May be demonstrated as live? |
| --- | --- | --- |
| MCP App/plugin in ChatGPT or Codex | Working | Yes |
| Browser fallback using the same backend | Working | Yes |
| Complete one-merchant carts | Working | Yes |
| Compatibility, budget, stock, and pickup proof | Working with seeded demo data | Yes, call the data seeded |
| Exact expiring checkout preview | Working | Yes |
| Separate direct user confirmation | Working | Yes |
| Simulated Visa approval, decline, and reversal | Working | Yes, always say simulated |
| Merchant inventory, scenarios, orders, and audit | Working | Yes |
| Connector-style identity verification | **Planned, not implemented** | **No** |
| Live Visa authorization or partnership | Not implemented | No |

Until the identity feature is implemented and tested, use the working checkout
block below. After implementation, replace it with the target identity block;
never pretend that a static screen verifies a user.

## Stage setup

Before judges arrive:

1. Run `npm run check`.
2. Start Woven with `npm start`.
3. Open `http://localhost:8787/merchant` and select **Reset demo data**.
4. Keep the MCP App or `http://localhost:8787/demo` ready in the foreground.
5. Keep `/merchant` open in a second tab with the scenario set to **Normal**.
6. Confirm that ByteRoute totals **S$133.00** for the canonical request.
7. Rehearse the happy path once, then reset the data again.

Use the real MCP App when the host and network are dependable. Use `/demo` as the
stage fallback; it clearly labels itself **Simulated**, rehearses the same
backend, and surfaces each tool call without presenting itself as real ChatGPT.

## Visual system and screen choreography

The seven main slides are signposts, not teleprompters. Keep the deck full-screen
and use hard cuts between slides and product screens; do not add decorative
animations. Judges should always be looking at one of three things: the problem,
working product evidence, or the conclusion.

| Beat | Primary screen | What the judge must notice |
| --- | --- | --- |
| Slides 1–3 | Full-screen deck | The problem, complete-cart promise, and concrete S$133 proof |
| Slide 4 → buyer demo | Prompt slide, then MCP App or `/demo` | One natural-language request becomes three complete carts |
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
- Use verified product screenshots for product claims. Editorial charging-kit
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
- Right 35%: the complete charging-kit hero image, showing the charger, cables,
  adapter, phone, and laptop connected by the Signal Lime route.
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

> Compare products · Check compatibility · Find one store · Rebuild checkout

**Layout and what to show**

- Runway Paper background.
- Left 42%: the title, with **Rebuild the cart at checkout** in Alert Clay as the
  consequence.
- Right 50%: three numbered horizontal steps—**Compare products**, **Check
  compatibility**, **Find one store**—ending at a lime rule that visually stops
  before checkout.
- Do not show logos or generic search screenshots. The incomplete process is the
  visual.

**Presenter cue:** Point once down the three steps as you say “works together,
fits your budget, is available today.”

**Say**

> “Imagine flying tonight and needing a charger for three devices. Search can
> recommend individual products, but it does not guarantee that everything works
> together, fits your budget, is available today, and can be collected from one
> place.”

### 0:30–0:48 — Slide 3: Woven returns a complete cart, not another list

**Visible copy**

> One merchant · Everything compatible · Under budget · Pickup today

**Layout and what to show**

- Runway Paper background with the claim across the top.
- Left 28%: three oversized proof points stacked vertically—**1 merchant and
  pickup point**, **4 compatible components**, **S$133 under budget**.
- Right 62%: a large verified buyer-results screenshot showing the three complete
  carts. Crop closely enough that the cards and total are legible.
- Signal Lime marks completeness; Alert Clay may emphasize the S$133 total.

**Presenter cue:** Point in order to **1**, **4**, then **S$133**. End by moving
your hand toward the product screenshot and say, “Let me show you.”

**Say**

> “Woven understands the complete request, eliminates incompatible combinations,
> and creates ready-to-buy carts. Every cart comes from one merchant and one
> location, with an explanation of why every component works.”

**Transition**

> “Let me show you.”

### 0:48–1:30 — Slide 4 → live buyer demo: ask once

**Slide 4 layout and what to show**

- Route Ink full-bleed background.
- Left 68%: the canonical request as one large quotation.
- Right 24%: a thin constraint rail listing **Tokyo**, **MacBook + iPhone +
  AirPods**, **S$150 hard cap**, and **Pickup today**.
- Bottom-left: **3 complete carts. 1 natural sentence.** in Signal Lime.
- Keep this slide up only long enough for the judges to read the request, then
  cut directly to the live buyer surface.

**Live screen sequence**

Enter or reveal the canonical request. In `/demo`, let the simulated host type it
and show the staged `start_mission` activity before the real widget appears:

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and
> AirPods under S$150, with pickup today.

Then:

1. Show the host header so the environment is honest: real ChatGPT/Codex when
   connected, or the clearly labeled **Simulated** host in `/demo`.
2. Let the `start_mission` tool call appear; do not narrate the protocol details.
3. When the widget loads, pause on the three ranked one-merchant carts.
4. Select **ByteRoute**.
5. Point to the charger wattage and voltage, both cables, Japan adapter, pickup
   location, seeded demo stock, and **S$133.00** total.

**Screen priority:** Keep the widget large enough that the product names,
compatibility proof, pickup location, and total are readable. Browser chrome and
developer tools are never part of the shot.

**Fallback frame:** `docs/assets/demo/01-ask-once.png`.

**Say**

> “Woven returned three complete options—not loose product links. This S$133 cart
> includes the charger, both required cables, and the Japan adapter. Everything
> is compatible, under budget, available in our demo inventory, and ready at one
> pickup location.”

Do not explain the ranking algorithm unless a judge asks. The visible result is
the proof.

### 1:30–2:15 — Slide 5 → live checkout: the user controls authorization

**Slide 5 layout and what to show**

- Runway Paper background.
- Left 35%: **The AI recommends. The user authorizes.** with **Identity is the
  next integration** in Alert Clay.
- Right 57%: a three-step vertical path—**Verify identity** labeled **PLANNED**,
  then **Review exact terms** and **Confirm once** labeled **WORKING**.
- Keep the planned label visible. Never animate the identity step into a
  completed state.
- Use this slide as a five-second trust-boundary bridge, then cut back to the
  selected ByteRoute cart in the live buyer surface.

#### Working checkout block — use now

1. Click **Review checkout**.
2. Let the preview load without moving the cursor.
3. Point to the exact merchant, four items, pickup location, total, and expiry—in
   that order.
4. Rest the cursor beside, not on, **Confirm S$133.00** while explaining that the
   AI cannot approve the purchase.
5. Pause for one beat, click **Confirm S$133.00**, and show the blue simulated
   Visa result and pickup receipt.

**What must remain visible:** the full amount on the confirmation button, the
expiry, the **simulated** payment label, and the receipt state after the click.

**Fallback frames:** `docs/assets/demo/02-review-once.png` followed by
`docs/assets/demo/03-confirm-once.png`.

**Say**

> “Woven rechecks the price and stock, then creates an exact ten-minute checkout
> preview. The AI recommended this cart, but it cannot approve it. The user sees
> the merchant, every item, the pickup location, and the S$133 total before one
> direct confirmation.”
>
> “Only after that click does Woven produce a simulated Visa authorization and
> pickup receipt. No card details enter Woven, and no live charge occurs.”

#### Target identity block — use only after implementation

This replaces the working checkout block; it is not an extra slide.

1. Click **Review checkout**.
2. Woven displays **Verify demo identity**.
3. Open the connector-style page with this exact boundary:

   > Connect your demo identity  
   > **DEMO ONLY — No Visa account or card details are accessed.**  
   > Continue as Chai

4. Click **Continue** and return to Woven with **Identity verified**.
5. Show the exact merchant, items, pickup location, total, and expiry.
6. Pause before clicking **Confirm S$133.00**.
7. Confirm and show the simulated result and receipt.

**Say**

> “Before checkout, Woven verifies who is approving the purchase through a
> connector-style demo identity flow. It never asks for a Visa password, card
> number, or payment credentials.”
>
> “Woven then rechecks price and stock and presents the exact merchant, products,
> and total. The AI cannot approve this screen—the user must click confirm.”
>
> “Only after that confirmation does Woven produce a simulated Visa authorization
> and pickup receipt. No real charge occurs.”

Authentication and purchase confirmation must remain two separate user actions.
Do not describe the planned flow as KYC, a real Visa login, or Visa OAuth.

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
  point to **Normal**, the ByteRoute stock row, the confirmed order, and the audit
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
  states. Keep **Identity planned** and **Visa authorization simulated** visible
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
> “This prototype uses seeded inventory and a simulated Visa authorization; no
> live charge occurs. Our next trust step is the connector-style demo identity
> check.”
>
> “Woven makes shopping through AI simple enough to use—and controlled enough to
> trust.”

After the identity flow is implemented, replace that sentence with: “This
prototype uses seeded inventory, a simulated identity check, and a simulated
Visa authorization; no live charge occurs.”

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
labeled simulated host that rehearses the same backend, surfaces the tool calls,
and never presents itself as a real ChatGPT session.

**Why not build another shopping app?**

The user has already explained the request in ChatGPT. Woven adds complete-cart
reasoning, merchant tools, and a controlled checkout without making them repeat
the work elsewhere.

**Does Woven verify identity today?**

Not yet. The working prototype verifies an exact, expiring purchase confirmation.
The next planned trust step is a simulated connector-style account check that
must be enforced by the server before checkout and remain separate from final
confirmation.

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
- “complete cart”
- “simulated Visa authorization”
- “seeded demo inventory”
- “direct user confirmation”
- “simulated connector-style identity check” when discussing the roadmap

Never say:

- “Visa OAuth”
- “Visa login”
- “Visa partnership”
- “live inventory”
- “real payment” or “charged”
- “identity verified” until the server-enforced identity flow exists
- “autonomous purchase” when a human confirmation is required

## Maintenance rule

When the identity flow becomes real, update all of the following in the same
change:

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
