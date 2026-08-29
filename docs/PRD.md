# Woven implemented PRD

## Product statement

Woven is a personal commerce plugin that builds a complete kit around a user’s mission instead of returning a list of product links. It recommends merchant carts inside an existing ChatGPT/Codex workflow and crosses the purchase boundary only after the user confirms an exact mandate.

## Demo objective

Within three minutes, an audience should see:

1. A natural-language travel mission become three ranked, pickup-ready carts.
2. A visible proof that charger, cables, adapter, destination, stock, pickup, and budget all work together.
3. An exact checkout preview bound to the merchant, items, total, version, and expiry.
4. An explicit user confirmation produce a clearly simulated Visa authorization and pickup receipt.
5. A merchant operator force stock, price, authorization, and order failure paths without changing code.

The current build does not verify a user identity. The target storyboard adds a
simulated connector-style identity check before checkout, but it is not part of
the implemented acceptance contract below until the server enforces it.

## Primary persona

A time-constrained traveller who knows the outcome they need but does not want to evaluate individual product compatibility, merchant stock, pickup logistics, and checkout separately.

## Canonical story

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and AirPods under S$150, with pickup today.

Assumptions are explicit: MacBook Air uses USB-C PD; the demo iPhone and AirPods use Lightning; inventory and pickup times are seeded; every price is in SGD.

## Functional requirements

- Run as a current MCP App with a React widget in ChatGPT/Codex.
- Offer a browser fallback that uses the same backend rules.
- Seed at least three merchants and two locations per merchant.
- Apply hard compatibility, inventory, pickup, and budget constraints before ranking.
- Keep each recommended cart at one merchant/location.
- Show why every component is compatible.
- Revalidate immediately before preview and confirmation.
- Require a direct user click for confirmation.
- Bind confirmation to exact immutable terms with expiry and one-time nonce.
- Make order creation idempotent and inventory mutation atomic.
- Simulate approval, decline, merchant failure/reversal, stockout, and price change.
- Give the merchant console inventory CSV import/export, scenario controls, orders, audit, and reset.
- Never accept or persist payment credentials.

## Non-goals for this prototype

- General web search or Google result-page injection.
- Scraping live merchants or claiming real inventory.
- Real Visa authorization without an approved product, sandbox credentials, and compliance review.
- Production user accounts, merchant onboarding, fulfillment integrations,
  refunds, or disputes.
- Broad catalog optimization beyond the four-part charging mission.

## Planned identity extension — not implemented

The next trust step is a connector-style **demo identity** flow. It is account
authentication for the prototype, not KYC, a real Visa login, or a claim of a
Visa identity product.

Before the feature may be presented as working, it must:

- show a prominent “DEMO ONLY” boundary and collect no passwords, card details,
  or Visa credentials;
- use an opaque subject identifier and short-lived server-side session;
- use an allowlisted callback, `state`, PKCE, and a single-use authorization
  code;
- keep identity tokens out of MCP arguments and model-visible content;
- reject checkout when the identity is missing, expired, reused, or bound to a
  different session;
- bind the verified subject to the exact checkout preview; and
- preserve a separate direct confirmation for the exact merchant, items, amount,
  expiry, nonce, and idempotency key.

Static UI alone does not satisfy this extension. When implemented, promote these
requirements into the functional requirements and acceptance criteria and add
focused automated coverage.

## Acceptance criteria

- `npm run check` passes.
- `start_mission` returns at least two complete carts for the canonical request.
- Every returned cart is within S$150 and contains all four compatible categories.
- The checkout nonce never appears in public mission view data.
- A wrong nonce is rejected.
- A changed price or stock invalidates the old preview.
- Reusing an idempotency key returns the same order and decrements stock once.
- Decline and reversal scenarios create no confirmed receipt.
- `/demo`, `/merchant`, `/healthz`, and `/mcp` run from one process.
- Plugin manifests pass Codex plugin validation.
