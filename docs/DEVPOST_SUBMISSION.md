# Woven — Devpost submission kit

This document is field-ready. Replace only the bracketed launch details before
publishing; the product claims below match the working repository.

## Listing basics

**Project name:** Woven

**Tagline:** Everything works together.

**Stage line:** Ask once. Review once. Confirm once.

**One-line description:** Woven turns one shopping request in ChatGPT or Codex
into a complete, compatible cart and waits for the user to approve the exact
purchase before a simulated Visa authorization.

**Short description:** Flying tonight and missing the right charging kit?
Woven works inside ChatGPT and Codex to rank complete carts by compatibility,
budget, stock, pickup time, and merchant—then binds the chosen merchant, cart,
and total to one visible confirmation. The prototype includes a merchant
operations desk, stale-cart protection, failure scenarios, an audit trail, and a
simulated Visa payment boundary. No card data enters the system and no live
charge occurs.

The target pitch also includes a simulated connector-style identity check. That
step is roadmap work and must not be submitted or demonstrated as working until
the server enforces it. See [`../script.md`](../script.md) for the authoritative
three-minute narration and truth boundaries.

**Repository:** https://github.com/Ducksss/LifeHack-2026

**Live demo:** https://visa-woven.vercel.app/demo

**Demo video:** `[ADD DEVPOST/YOUTUBE VIDEO URL]`

**Local master:** `output/Woven-Judge-Video.mp4` (3:00, 1600×900, H.264/AAC,
synthetic narration). Sidecar captions: `video/Woven-Judge-Video.srt`.

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
widget, and Node SQLite state. The same service is deployed through Vercel's
Express preset at a public HTTPS origin; its seeded demo database uses temporary
serverless storage and may reset after a cold start or redeployment.

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
- A verified public HTTPS landing page, buyer demo, merchant desk, health check,
  and six-tool MCP endpoint
- Complete carts with one merchant, hard budget, stock, pickup, and compatibility
- Exact, expiring, one-time mandates with idempotent confirmation
- Stale price/stock protection and atomic inventory/order writes
- Simulated approval, decline, merchant failure, and reversal paths
- A live merchant operations desk with CSV updates and audit events
- Automated coverage for domain, security, failure, idempotency, and CSV behavior
- A polished desktop and mobile experience, including a clearly labeled
  simulated chat host that rehearses the in-ChatGPT flow with live tool calls

### What we learned

Agentic commerce is less about letting an AI click faster and more about designing
better boundaries. Users need to understand why a cart is complete, what exact
terms are about to be authorized, and what changed if checkout must stop.

We also learned that MCP Apps are a strong fit for this interaction: the model can
coordinate intent and tools, while the embedded interface keeps the final choice
visible, structured, and explicitly human.

### What's next

1. Add a clearly labeled connector-style demo identity check that is enforced
   before checkout and remains separate from purchase confirmation.
2. Connect the deployed MCP endpoint in ChatGPT Developer Mode and publish the
   app.
3. Connect real merchant catalog, stock, pickup, and fulfilment APIs.
4. Choose the precise Visa sandbox product and replace only the isolated payment
   adapter after credentials, product approval, and security review.
5. Generalize the constraint model to medical travel kits, event equipment,
   gifts, repair parts, and other mission-bound purchases.
6. Measure cart completion, stale-checkout recovery, and user trust in the exact
   confirmation step.

## Built with

`typescript` · `react` · `node.js` · `express` · `sqlite` · `vite` ·
`tailwind-css` · `shadcn-ui` · `zod` · `model-context-protocol` · `mcp-apps` ·
`chatgpt` · `codex`

Add `visa` only if the event's naming policy permits prototype/simulator entries;
do not describe this build as an official Visa integration or partnership.

## Gallery upload order

All gallery assets are 1600 × 900 and live in the repository.

| Order | File | Devpost title | Caption |
| --- | --- | --- | --- |
| 1 | `docs/assets/devpost/cover.png` | Everything works together | Woven turns every constraint in one urgent request into a complete cart and an exact confirmation. |
| 2 | `docs/assets/screenshots/buyer-overview.png` | Born inside the chat | One message becomes a live MCP app: a visible `start_mission` call, then three complete one-merchant carts. |
| 3 | `docs/assets/devpost/woven-how-it-works.png` | One request to pickup | Six steps on one thread carry the request from intent to complete cart, exact confirmation, and receipt. |
| 4 | `docs/assets/screenshots/checkout-confirmation.png` | The human stays in control | Merchant, pickup, cart version, and total are bound to one expiring confirmation. |
| 5 | `docs/assets/devpost/woven-trust-boundary.png` | Recommendation is not permission | The model recommends, Woven binds the terms, and only a direct user click can confirm. |
| 6 | `docs/assets/screenshots/order-success.png` | From mission to pickup receipt | A successful simulated Visa result reserves the kit and returns a pickup-ready receipt. |
| 7 | `docs/assets/screenshots/merchant-dashboard.png` | Trust you can test live | Change inventory or trigger decline/reversal scenarios while the audit trail updates. |
| 8 | `docs/assets/devpost/woven-system-architecture.png` | One service, one source of truth | Every surface shares the same commerce rules, SQLite transactions, and one payment adapter seam. |
| 9 | `docs/assets/devpost/woven-under-the-hood.png` | What actually happens | The request traced from the model's `start_mission` call through app-only tools, the hidden nonce, and the checkout guard to the receipt. |

Use `cover.png` as the Devpost thumbnail. Keep the raw product screenshots
uncropped so judges can inspect the visible prototype boundaries.

## Three-minute judge demo

[`script.md`](../script.md) is the authoritative word-for-word stage script. The
short run of show is below so the Devpost assets and recording stay aligned.

**0:00–0:12 — Open with the unfinished shopping problem**

“We already ask ChatGPT what to buy. But actually buying still means opening
tabs, checking compatibility, finding stock, and rebuilding everything at
checkout. We built Woven to finish that process.”

**0:12–0:30 — Make the problem concrete**

Explain that a traveler needs one compatible kit, under budget, available today,
from one pickup location—not four unrelated links.

**0:30–0:48 — Introduce Woven**

“Woven returns a complete cart, not another list: one merchant, everything
compatible, under budget, pickup today.”

**0:48–1:30 — Ask once**

Run the canonical prompt in ChatGPT/Codex or open `/demo`, where the simulated
chat host types the canonical request and plays the `start_mission` activity live. Point
out the three complete one-merchant carts. Select ByteRoute and show the
compatibility proof, demo stock, pickup location, and S$133 total.

**1:30–2:15 — Review once and confirm once**

Click **Review checkout**. Say: “Woven rechecks price and stock now. The AI has
recommended; it still cannot authorize.” Read the exact merchant, items, pickup,
expiry, and S$133 total. Pause, then click **Confirm S$133.00** and show the
simulated Visa result and receipt.

The target storyboard inserts a simulated connector-style identity check before
the exact-cart review. Do not include it in a live recording until the product
actually blocks checkout for a missing or expired identity session.

**2:15–2:35 — Show merchant control**

Open `/merchant` and show inventory, scenario controls, orders, and audit events.
Explain that the values are seeded demo data and that price, stock, decline, and
reversal paths can be tested without changing code.

**2:35–3:00 — Close with why ChatGPT and why a plugin**

“ChatGPT is where the request already exists. Woven turns that conversation into
merchant actions and a reviewable checkout without asking the user to start
again. Ask once. Review once. Confirm once.”

### Recording and stage fallback assets

Use `docs/assets/devpost/cover.png` as the opening card. If a live capture fails,
the numbered `docs/assets/demo/01-ask-once.png` through
`04-merchant-control.png` sequence preserves the same truthful product story.
Finish with `docs/assets/demo/05-close.png`. Every frame is 1600 × 900 and keeps
the seeded-inventory and simulated-authorization boundaries visible.

The checked-in Remotion source at `video/WovenJudgeVideo.tsx` already composes
this truthful sequence into a three-minute local master. Preview it with
`npm run video:studio` and render it with `npm run video:render`. The bundled
voice is synthetic and should be disclosed wherever the upload platform asks.

## 30-second pitch

Search gives links; Woven gives you a complete cart. Inside ChatGPT or Codex, it
finds one compatible, in-stock kit from one pickup location, shows the exact
purchase, and waits for the user to confirm. Our working prototype includes
merchant controls, stale-cart protection, and clearly simulated Visa approval,
decline, and reversal paths.

## Judge Q&A

**Is this a browser extension?**

No. The primary experience is an MCP App rendered inside ChatGPT or Codex. The
browser route is a clearly labeled simulated chat host that rehearses the same
experience — same backend, real MCP tool calls shown live, no live charge.

**Does it make real Visa payments?**

No. The Visa rail is visibly simulated, no payment credentials are collected, and
the server fails closed outside simulated mode. The adapter boundary is ready for
the exact sandbox product once credentials and approval exist.

**Does Woven verify the user's identity?**

Not in the current build. The target design adds a simulated connector-style
account check before checkout, with no Visa password, card details, or KYC claim.
It becomes part of the live pitch only after the server blocks missing and
expired identity sessions.

**Is the identity screen “Visa OAuth”?**

No. That would imply a real Visa identity provider. The accurate term is a
simulated connector-style identity check, visibly labeled as a demo.

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

- [x] Save the project name, pitch, story, technology tags, and GitHub link
- [x] Select `Visa best submission award` and `Digital Payments`
- [ ] Add the public HTTPS demo URL
- [x] Render the three-minute local demo master
- [ ] Upload the demo master and add its public URL
- [ ] Upload the required project-description PDF
- [ ] Add team member names and roles without inventing missing details
- [ ] Confirm the event's rules for using “Visa” in tags and screenshots
- [ ] Verify the repository visibility required by the hackathon
- [ ] Test every public link in a logged-out browser
- [ ] Upload the eight gallery files in the order above
- [ ] Reset the demo database to the normal scenario before judging
