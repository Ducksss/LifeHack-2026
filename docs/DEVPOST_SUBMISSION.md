# Woven — Devpost submission kit

This document is field-ready. Replace only the bracketed launch details before
publishing; the product claims below match the working repository.

## Listing basics

**Project name:** Woven

**Tagline:** Everything works together.

**Stage line:** Ask once. Review once. Confirm once.

**One-line description:** Woven turns one shopping request into a complete,
compatible, pickup-ready cart—and keeps the final purchase behind the user's
explicit confirmation.

**Short description:** Woven is an MCP App for mission-based shopping. Give it a
brief—two first-time campers, a rainy weekend, one car boot, S$300, pickup
today—and it returns five complete carts instead of loose product links. Every
choice comes from one merchant and pickup point, covers all seven required
units, and proves that weather, quantity, packed volume, stock, timing, and
budget constraints work together. Woven rechecks the cart before checkout,
shows the exact terms, and waits for one explicit confirmation. Inventory and
the Visa authorization are clearly simulated; no card data enters the system
and no live charge occurs.

The pitch includes a working, server-enforced connector-style demo identity
check. It is visibly simulated—not Visa login, KYC, or production identity
verification—and remains separate from final purchase confirmation. See
[`../script.md`](../script.md) for the authoritative narration and boundaries.

**Repository:** https://github.com/Ducksss/LifeHack-2026

**Live demo:** https://visa-woven.vercel.app/demo

**Demo video:** https://youtu.be/FrppMZYmLeg

**Local master:** `output/Woven-Judge-Video.mp4` (3:00, 1600×900, H.264/AAC,
ElevenLabs AI narration). Sidecar captions: `video/Woven-Judge-Video.srt`.

**Project brief PDF:** `output/pdf/Woven-Project-Brief.pdf` (one-page A4,
current camping mission and implemented demo identity boundary).

**Team members:**

- Chai Pin Zheng — Product Engineer
- Ho Boon How — Product Engineer

## Submission story

### Inspiration

We did not start by asking how AI could recommend more products. We started by
asking why buying still falls apart after the recommendation.

Imagine planning a first camping trip for two on a rainy weekend. Finding a
tent is easy. Making sure it protects two people, pairing it with two sleeping
bags and two mats, adding weather-safe lighting and first aid, fitting everything
into one car boot, staying under S$300, checking today's stock, and collecting it
all from one place is not. That is no longer a search problem. It is a systems
problem.

The request already begins naturally in ChatGPT or Codex, so we built Woven as
an MCP App instead of another destination the user has to learn. The name comes
from the product itself: Woven brings intent, compatibility, budget, inventory,
pickup, identity, and consent together—but leaves the final thread to the human.

### What it does

The user asks:

> I need a complete rainy-weekend camping kit for 2 first-time campers. Keep it
> under S$300, fit it in one car boot, and make it pickup-ready today.

**Ask once.** Woven filters incomplete or unavailable combinations and opens a
Choice Center with five complete carts. Each choice comes from one merchant and
one pickup point. The user can compare full-cart totals, optimize for value,
weather protection, pickup speed, or area, inspect the pickup plan, and use only
merchant-approved compatible substitutions.

**Review once.** Woven proves that the selected kit covers the tent, two sleeping
bags, two sleeping mats, lantern, first-aid supplies, rain protection, packed
volume, stock, pickup deadline, and budget. Before checkout it enforces a clearly
labeled demo identity handoff and revalidates price and inventory.

**Confirm once.** Woven presents one exact, ten-minute checkout mandate bound to
the verified demo session, merchant, items, cart version, pickup point, and total.
Only a direct user action can confirm it. A successful simulated Visa
authorization returns a signed, server-verifiable pickup receipt.

The Merchant Desk makes the safety model testable. Judges can change inventory,
raise a price, approve or disable a substitution, trigger a decline, force a
post-authorization merchant failure and reversal, import a CSV, or inspect every
step in the audit trail without changing code.

### How we built it

Woven is a TypeScript and React MCP App with nine tools over HTTP and stdio. The
same repository includes a clearly labeled simulated chat host for stage-safe
rehearsals. Both surfaces call the same domain logic; the browser demo is not a
separate mock of the product.

One Node.js and Express service hosts the MCP transports, React widget, merchant
APIs, domain rules, and Node SQLite state. We kept it as one service so cart
revalidation, inventory mutation, order creation, and audit writes can share one
transaction boundary. The public HTTPS demo runs through Vercel's Express
preset; its seeded SQLite state is temporary and may reset on a cold start or
redeployment.

The commerce engine enumerates complete one-merchant carts, rejects options that
violate capacity, waterproofing, per-camper quantity, packed volume, lighting,
first-aid, stock, pickup, or budget rules, then ranks the surviving carts.
Checkout creates a ten-minute mandate hash bound to the exact cart version and
total. Its one-time nonce reaches the widget through private MCP metadata, never
model-visible content. Confirmation uses constant-time comparison, atomic
inventory and order writes, and an idempotency key so retries cannot create a
second order.

The demo identity handoff uses an allowlisted callback, random `state`, PKCE, a
hashed single-use authorization code, and a 15-minute opaque server session.
Checkout fails closed when that session is missing, expired, reused, or replaced;
identity secrets never enter MCP arguments or model-visible content.

Payment is isolated behind one simulated Visa adapter. That seam lets the
prototype demonstrate approval, decline, merchant failure, and reversal
semantics without collecting payment credentials or implying a live Visa
integration.

### Challenges we ran into

**Defining “complete” precisely.** A rainproof tent is still the wrong answer if
one camper has no sleeping bag, the lantern cannot handle rain, or the kit does
not fit the car. We modelled the mission as hard constraints over the complete
cart and made every pass/fail decision visible in the interface.

**Preventing a stale cart from becoming a charge.** Price and inventory may
change after a recommendation. Woven revalidates before preview and again during
the atomic confirmation transaction. If anything changed, the exact mandate is
invalidated instead of silently updating the amount.

**Keeping recommendation separate from authorization.** A conversational model
can assemble and rank the cart, but it must not inherit permission to buy. We
kept the one-time confirmation nonce outside model-visible data and made the
exact, expiring purchase a separate user-controlled state.

**Being honest without weakening the demo.** Merchant inventory, identity, and
Visa authorization are simulated, but the cart engine, server enforcement,
transactions, failure paths, MCP calls, and receipt verification are real. The
browser rehearsal labels itself **Simulated** on screen and uses the same backend
instead of impersonating ChatGPT or hiding prototype boundaries.

### Accomplishments that we're proud of

- One natural-language request reliably produces five complete, one-location
  carts for the canonical seven-unit camping mission.
- The selected TrailHaus kit proves every hard constraint at **89 L** and
  **S$231.00**, comfortably inside the 120 L and S$300 limits.
- The working MCP App includes nine tools, a React Choice Center, HTTP and stdio
  transports, a public HTTPS demo, and local Codex plugin packaging.
- Identity and purchase consent are separate server-enforced gates; neither
  their secrets nor payment credentials enter model-visible content.
- Price changes, stockouts, duplicate confirmation, authorization decline,
  post-authorization failure, and reversal are all demonstrable paths—not slides.
- Simulated receipts are signed on the server and independently verifiable
  through an MCP tool.
- The Merchant Desk controls inventory, substitutions, scenarios, CSV exchange,
  orders, and audit history in real time.
- Automated checks cover domain rules, security boundaries, transactions,
  failures, idempotency, CSV behavior, builds, and types.

### What we learned

The interesting unit in agentic commerce is not the recommendation. It is the
mandate: which merchant, which items, which version, what total, until when, and
who explicitly approved it. Making that state precise improved the product more
than making the model sound more confident ever could.

We also learned that MCP Apps fit this interaction unusually well. The model can
coordinate intent and tools, while the embedded interface keeps comparison,
proof, identity status, exact terms, and the final confirmation visible and
structured. The best agentic flow did not remove the human—it gave the human a
better decision to make.

### What's next

The next milestone is a shareable ChatGPT connection, followed by real merchant
catalog, stock, pickup, and fulfilment APIs. After product approval, sandbox
credentials, and security review, Visa Intelligent Commerce can replace only the
isolated identity and payment simulator seams.

From there, the same complete-mission model can extend to meal kits, event
equipment, gifts, repair parts, and other purchases where compatibility matters
more than another page of links. We want to measure whether users complete carts
faster, recover cleanly from stale terms, and trust the exact confirmation step.

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
| 2 | `docs/assets/screenshots/buyer-overview.png` | Born inside the chat | One message becomes a live MCP app: a visible `start_mission` call, then five complete choices. |
| 3 | `docs/assets/devpost/woven-how-it-works.png` | One request to pickup | Six steps on one thread carry the request from intent to complete cart, exact confirmation, and receipt. |
| 4 | `docs/assets/screenshots/demo-identity.png` | Identity and authorization stay separate | The working simulator proves the person, returns one-time proof, and still cannot authorize the purchase. |
| 5 | `docs/assets/screenshots/checkout-confirmation.png` | The human stays in control | Merchant, pickup, cart version, and total are bound to one expiring confirmation. |
| 6 | `docs/assets/devpost/woven-trust-boundary.png` | Recommendation is not permission | The model recommends, Woven binds the terms, and only a direct user click can confirm. |
| 7 | `docs/assets/screenshots/order-success.png` | From mission to pickup receipt | A successful simulated Visa result reserves the kit and returns a pickup-ready receipt. |
| 8 | `docs/assets/screenshots/merchant-dashboard.png` | Trust you can test live | Change inventory or trigger decline/reversal scenarios while the audit trail updates. |
| 9 | `docs/assets/devpost/woven-system-architecture.png` | One service, one source of truth | Every surface shares the same commerce rules, SQLite transactions, and one payment adapter seam. |
| 10 | `docs/assets/devpost/woven-under-the-hood.png` | What actually happens | The request traced from the model's `start_mission` call through app-only tools, the hidden nonce, and the checkout guard to the receipt. |

Use `output/devpost/woven-thumbnail-3x2.png` for Devpost's 3:2 thumbnail field
and keep `cover.png` as the first gallery image. Keep the raw product screenshots
uncropped so judges can inspect the visible prototype boundaries.

## Three-minute judge demo

[`script.md`](../script.md) is the authoritative word-for-word stage script. The
short run of show is below so the Devpost assets and recording stay aligned.

**0:00–0:12 — Open with the unfinished shopping problem**

“We already ask ChatGPT what to buy. But actually buying still means opening
tabs, checking compatibility, finding stock, and rebuilding everything at
checkout. We built Woven to finish that process.”

**0:12–0:30 — Make the problem concrete**

Explain that two first-time campers need one complete rain-ready gear kit, under
budget, compact enough for one car, available today, from one pickup location—not
five unrelated links.

**0:30–0:48 — Introduce Woven**

“Woven returns a complete cart, not another list: one merchant, everything
compatible, under budget, pickup today.”

**0:48–1:30 — Ask once**

Run the canonical prompt in ChatGPT/Codex or open `/demo`, where the simulated
chat host types the canonical request and plays the `start_mission` activity live. Point
out the five complete one-merchant carts. Compare them, select TrailHaus, and show the two-person
quantity proof, rain ratings, 89 L packed volume, demo stock, pickup location,
and S$231.00 total.

**1:30–2:15 — Verify, review, and confirm**

Click **Review checkout**, then **Verify demo identity**. On `/identity`, read the
**DEMO ONLY** boundary and click **Continue as Chai**. Return, check the server
result, and click **Review exact terms**. Read the merchant, items, pickup,
expiry, and S$231.00 total. Pause, then click **Confirm S$231.00** and show the
simulated Visa result and receipt.

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
voice is AI-generated with ElevenLabs and should be disclosed wherever the
upload platform asks.

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

The current build enforces a simulated connector-style account handoff before
checkout. It uses state, PKCE, a single-use code, and a short-lived server
session, but it is not KYC or production identity verification and collects no
Visa password, card details, or payment credentials.

**Is the identity screen “Visa OAuth”?**

No. That would imply a real Visa identity provider. The accurate term is a
server-enforced demo identity handoff, visibly labeled as simulated.

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
- [x] Add the public HTTPS demo URL
- [x] Render the three-minute local demo master
- [x] Upload the demo master and add its public URL
- [x] Render the current project-description PDF
- [ ] Upload the project-description PDF if the post-event submission form still exposes that field
- [x] Add team member names
- [x] Add roles for Chai Pin Zheng and Ho Boon How
- [ ] Confirm the event's rules for using “Visa” in tags and screenshots
- [ ] Verify the repository visibility required by the hackathon
- [ ] Test every public link in a logged-out browser
- [ ] Upload the ten gallery files in the order above
- [ ] Reset the demo database to the normal scenario before judging
