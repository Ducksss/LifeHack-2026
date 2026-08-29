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
stage fallback; it exercises the same backend and is not a fake ChatGPT UI.

## Three-minute run of show

### 0:00–0:12 — Slide 1: Shopping should start and finish with one request

**Visible copy**

> Shopping should start and finish with one request.  
> **Woven**  
> Everything works together.

**Say**

> “We already ask ChatGPT what to buy. But actually buying still means opening
> tabs, checking compatibility, finding stock, and rebuilding everything at
> checkout. We built Woven to finish that process.”

### 0:12–0:30 — Slide 2: Search gives links. Buying still takes work.

**Visible copy**

> Compare products · Check compatibility · Find one store · Rebuild checkout

**Say**

> “Imagine flying tonight and needing a charger for three devices. Search can
> recommend individual products, but it does not guarantee that everything works
> together, fits your budget, is available today, and can be collected from one
> place.”

### 0:30–0:48 — Slide 3: Woven returns a complete cart, not another list

**Visible copy**

> One merchant · Everything compatible · Under budget · Pickup today

**Say**

> “Woven understands the complete request, eliminates incompatible combinations,
> and creates ready-to-buy carts. Every cart comes from one merchant and one
> location, with an explanation of why every component works.”

**Transition**

> “Let me show you.”

### 0:48–1:30 — Live demo: ask once

Enter or reveal the canonical request:

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and
> AirPods under S$150, with pickup today.

Then:

1. Show the three ranked carts.
2. Select ByteRoute.
3. Point to the charger wattage and voltage, both cables, Japan adapter, pickup
   location, demo stock, and S$133 total.

**Say**

> “Woven returned three complete options—not loose product links. This S$133 cart
> includes the charger, both required cables, and the Japan adapter. Everything
> is compatible, under budget, available in our demo inventory, and ready at one
> pickup location.”

Do not explain the ranking algorithm unless a judge asks. The visible result is
the proof.

### 1:30–2:15 — Live demo: the user controls authorization

#### Working checkout block — use now

1. Click **Review checkout**.
2. Point to the exact merchant, items, pickup location, total, and expiry.
3. Pause before clicking **Confirm S$133.00**.
4. Confirm and show the simulated result and receipt.

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

### 2:15–2:35 — Slide 6: Merchants control what the AI can sell

Show the Merchant Desk with inventory, orders, scenario controls, and audit.

**Visible copy**

> Import inventory · Update price and availability · Receive exact orders · Audit
> every action

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
2. If the server itself is unavailable, use the buyer, checkout, receipt, and
   merchant screenshots in `docs/assets/screenshots/`.
3. Narrate only what the screenshots prove.
4. Never substitute a static identity mock and describe it as verification.

Recovery line:

> “This is our stage fallback over the same Woven backend. The primary product is
> the MCP App inside ChatGPT and Codex.”

## Judge answers

**Is this a browser extension?**

No. Woven is an MCP App/plugin inside ChatGPT or Codex. `/demo` is a browser
transport over the same backend for rehearsal and stage reliability.

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
