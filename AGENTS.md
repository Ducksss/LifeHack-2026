# MissionCart agent instructions

This repository is the LifeHack 2026 submission workspace. The product is
**MissionCart**.

## Start here

Before changing the project, read these files in order:

1. `docs/HANDOVER.md` — current product context, decisions, status, and next work
2. `docs/PRD.md` — implemented product contract and acceptance criteria
3. `docs/architecture.md` — tool contracts, state machine, and trust boundaries
4. `README.md` — public-facing story, setup, and demo instructions

Inspect `git status` before editing and preserve unrelated user changes.

## Product invariants

- The primary experience is an MCP App inside ChatGPT or Codex.
- `/demo` is a stage-safe browser transport for the same backend, not a fake chat
  UI and not the primary product.
- Recommendations are complete, compatible carts from one merchant/location.
- The AI may recommend; only a direct user action may confirm exact terms.
- Every checkout must remain bound to merchant, cart version, amount, expiry,
  nonce, and idempotency key.
- Visa authorization is simulated. Never claim a live Visa integration,
  partnership, real inventory, or live charge.
- Never accept, store, log, or pass payment credentials through MCP arguments.
- Keep `PAYMENT_MODE` fail-closed outside `simulated` until a precise approved
  product, credentials, and security review exist.

## Working contract

- Prefer the existing one-service architecture and current domain seams.
- Keep the canonical Tokyo charging-kit mission working unless the user
  explicitly changes the product scope.
- Update `docs/HANDOVER.md` when a change alters product direction, architecture,
  external readiness, demo steps, or remaining work.
- Run `npm run check` before handing off any implementation change.
- Do not deploy, publish Devpost, expose the repository, integrate live payments,
  or push external changes unless the user requests that action.
