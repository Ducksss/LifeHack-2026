# Woven — Devpost submission kit

This document is field-ready. Replace only the bracketed launch details before
publishing; the product claims below match the working repository.

## Listing basics

**Project name:** Woven

**Tagline:** Everything works together.

**One-line description:** Woven turns a constrained shopping request in
ChatGPT or Codex into an in-stock, one-merchant cart and asks the user to confirm
the exact terms before a simulated Visa authorization.

**Short description:** Flying tonight and missing the right charging kit?
Woven works inside ChatGPT and Codex to rank complete carts by compatibility,
budget, stock, pickup time, and merchant—then binds the chosen merchant, cart, and
total to one visible confirmation. The prototype includes a merchant operations
desk, stale-cart protection, failure scenarios, an audit trail, and a simulated
Visa payment boundary. No card data enters the system and no live charge occurs.

**Repository:** https://github.com/Ducksss/LifeHack-2026

**Live demo:** `[ADD PUBLIC HTTPS DEMO URL]`

**Demo video:** `[ADD DEVPOST/YOUTUBE VIDEO URL]`

## Submission story

### Inspiration

Shopping agents are good at returning links, but urgent real-world missions are
systems problems. A traveler who leaves for Tokyo tonight does not need four
independent recommendations. They need one complete kit that works together, is
actually in stock, stays under budget, and can be collected on time.

We asked a second question: if the user already starts that mission in ChatGPT or
Codex, why force them into another destination app? Woven extends the
workflow they already use, while drawing a bright line between AI recommendation
and human authorization.

### What it does

The user describes a mission in natural language: destination, devices, budget,
and pickup deadline. Woven then:

1. filters incompatible and unavailable products;
2. assembles complete carts from one pickup location;
3. ranks the carts by mission fit, pickup speed, and budget headroom;
4. explains why every component works with the others;
5. rechecks price and stock before checkout;
6. presents an exact, expiring mandate for one explicit click; and
7. returns a simulated Visa result and pickup receipt.

The merchant desk makes the trust story visible. Judges can change stock, raise a
price, trigger an authorization decline, simulate an order failure and reversal,
import inventory updates, or inspect the audit trail in real time.

### How we built it

Woven is a TypeScript and React MCP App that runs in ChatGPT/Codex and also
ships with an HTTP browser fallback for reliable on-stage demos. One Node.js and
Express service hosts the MCP transports, domain logic, merchant APIs, compiled
widget, and Node SQLite state.

The commerce engine enumerates complete one-merchant carts, rejects options that
violate wattage, connector, voltage, destination, stock, pickup, or budget rules,
then ranks the surviving carts. Checkout creates a ten-minute mandate hash bound
to the exact cart version and total. A private nonce is delivered to the widget
through MCP metadata, and confirmation is guarded by constant-time comparison,
one-time consumption, and idempotency.

Payment is deliberately isolated behind a simulated Visa adapter. This lets the
prototype demonstrate authorization, decline, merchant failure, and reversal
semantics without collecting credentials or suggesting that a live network
integration exists.

### Challenges we ran into

**Keeping recommendation separate from authorization.** A conversational model
can help assemble the cart, but it should not silently inherit permission to buy.
We made confirmation a separate, exact, expiring UI state with private metadata.

**Preventing a stale cart from becoming a charge.** Price and inventory may
change between recommendation and checkout. Woven revalidates the cart and
the mandate inside the same database transaction that creates the order.

**Proving compatibility across the whole kit.** The correct charger is useless
with the wrong cable or destination adapter. We modelled the mission as a complete
constraint set and made every compatibility decision explainable in the UI.

**Making an MCP demo stage-safe.** The production story lives inside ChatGPT or
Codex, while the browser transport calls the same domain functions for rehearsals
when public networking or host configuration is unreliable.

### Accomplishments that we're proud of

- A working MCP App widget, HTTP MCP endpoint, and stdio Codex transport
- Complete carts with one merchant, hard budget, stock, pickup, and compatibility
- Exact, expiring, one-time mandates with idempotent confirmation
- Stale price/stock protection and atomic inventory/order writes
- Simulated approval, decline, merchant failure, and reversal paths
- A live merchant operations desk with CSV updates and audit events
- Automated coverage for domain, security, failure, idempotency, and CSV behavior
- A polished desktop and mobile product experience rather than a fake chat mockup

### What we learned

Agentic commerce is less about letting an AI click faster and more about designing
better boundaries. Users need to understand why a cart is complete, what exact
terms are about to be authorized, and what changed if checkout must stop.

We also learned that MCP Apps are a strong fit for this interaction: the model can
coordinate intent and tools, while the embedded interface keeps the final choice
visible, structured, and explicitly human.

### What's next

1. Deploy the service behind a stable public HTTPS origin and publish the app.
2. Connect real merchant catalog, stock, pickup, and fulfilment APIs.
3. Choose the precise Visa sandbox product and replace only the isolated payment
   adapter after credentials, product approval, and security review.
4. Generalize the constraint model to medical travel kits, event equipment,
   gifts, repair parts, and other mission-bound purchases.
5. Measure cart completion, stale-checkout recovery, and user trust in the exact
   confirmation step.

## Built with

`typescript` · `react` · `node.js` · `express` · `sqlite` · `vite` · `zod` ·
`model-context-protocol` · `mcp-apps` · `chatgpt` · `codex`

Add `visa` only if the event's naming policy permits prototype/simulator entries;
do not describe this build as an official Visa integration or partnership.

## Gallery upload order

All gallery assets are 1600 × 900 and live in the repository.

| Order | File | Devpost title | Caption |
| --- | --- | --- | --- |
| 1 | `docs/assets/devpost/cover.png` | Everything works together | Woven turns every constraint in one urgent request into a complete cart and an exact confirmation. |
| 2 | `docs/assets/screenshots/buyer-overview.png` | Complete carts, not loose links | Three one-merchant options satisfy the budget, compatibility, stock, and pickup constraints. |
| 3 | `docs/assets/devpost/woven-how-it-works.png` | From mission to ready for pickup | Five visible steps turn constraints into complete carts, proof, exact terms, and a receipt. |
| 4 | `docs/assets/screenshots/checkout-confirmation.png` | The human stays in control | Merchant, pickup, cart version, and total are bound to one expiring confirmation. |
| 5 | `docs/assets/devpost/woven-trust-boundary.png` | Recommendation is not permission | The model recommends, Woven binds the terms, and only a direct user click can confirm. |
| 6 | `docs/assets/screenshots/order-success.png` | From mission to pickup receipt | A successful simulated Visa result reserves the kit and returns a pickup-ready receipt. |
| 7 | `docs/assets/screenshots/merchant-dashboard.png` | Trust you can test live | Change inventory or trigger decline/reversal scenarios while the audit trail updates. |
| 8 | `docs/assets/devpost/woven-architecture.png` | One service, one source of truth | Every surface shares the same commerce rules, SQLite transactions, and simulated payment boundary. |

Use `cover.png` as the Devpost thumbnail. Keep the raw product screenshots
uncropped so judges can inspect the visible prototype boundaries.

## 90-second demo script

**0:00–0:10 — The problem**

“I fly to Tokyo tonight. I need four compatible things, under S$150, and I need
one place where I can collect them today. Search gives me links; Woven gives
me a mission-ready cart.”

**0:10–0:30 — Ask once**

Run the canonical prompt in ChatGPT/Codex or open `/demo`. Point out the three
complete one-merchant carts, prices, and pickup times.

**0:30–0:45 — Prove the kit**

Select ByteRoute. Show that the charger supports the laptop and Japanese voltage,
the cables match the assumed ports, and the adapter fits the destination.

**0:45–1:05 — Confirm exact terms**

Click **Review checkout**. Say: “Woven rechecks price and stock now. The AI
has recommended; it still cannot authorize.” Read the bound merchant and S$133
total, then click **Confirm**.

**1:05–1:15 — Complete the mission**

Show the simulated Visa result, receipt, and pickup location. “Everything the
traveler needs, woven into one choice.”

**1:15–1:30 — Prove the trust boundary**

Open `/merchant`, select **Price change**, and explain that an old preview is
rejected. Finish: “Existing AI workflow, complete commerce context, explicit human
control.”

## 30-second pitch

Woven is the missing transaction layer between AI recommendation and a
ready-to-collect order. Inside ChatGPT or Codex, it converts a natural-language
mission into complete one-merchant carts, proves that every item works together,
rechecks live commercial terms, and asks the user to confirm one exact mandate.
Our prototype includes a merchant control desk and a simulated Visa authorization
boundary, so judges can test approval, stale carts, declines, and reversals live.

## Judge Q&A

**Is this a browser extension?**

No. The primary experience is an MCP App rendered inside ChatGPT or Codex. The
browser route is a rehearsal fallback using the same backend, not a fake chat UI.

**Does it make real Visa payments?**

No. The Visa rail is visibly simulated, no payment credentials are collected, and
the server fails closed outside simulated mode. The adapter boundary is ready for
the exact sandbox product once credentials and approval exist.

**Why is this better than a standalone shopping app?**

It begins where the user already expresses intent. Woven adds structured
commerce, compatibility proof, and authorization without asking the user to
restart the workflow elsewhere.

**What is technically difficult here?**

The hard part is not rendering products. It is ensuring the cart remains complete
and commercially exact between recommendation and confirmation, while keeping the
authorization secret out of model-visible data and handling duplicate or failed
transactions safely.

## Before publishing

- [ ] Add the public HTTPS demo URL
- [ ] Record and upload the 90-second demo
- [ ] Add team member names and roles without inventing missing details
- [ ] Select the event's eligible categories and sponsor tracks
- [ ] Confirm the event's rules for using “Visa” in tags and screenshots
- [ ] Verify the repository visibility required by the hackathon
- [ ] Test every public link in a logged-out browser
- [ ] Upload the eight gallery files in the order above
- [ ] Reset the demo database to the normal scenario before judging
