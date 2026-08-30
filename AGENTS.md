# Woven agent instructions

This repository is the LifeHack 2026 submission workspace. The user-facing
product is **Woven**; `LifeHack-2026` is only the repository name.

## Canonical context

Before changing the project, inspect `git status`, preserve unrelated user work,
and read these files in order:

1. `docs/HANDOVER.md` — current decisions, implementation status, external state,
   archived branches, and next work
2. `docs/PRD.md` — binding implemented product contract and acceptance criteria
3. `docs/architecture.md` — tool contracts, state machine, and trust boundaries
4. `README.md` — public story, setup, screenshots, and working demo instructions

Then route by task:

- Pitch, judging, recording, or demo: read `script.md`, then
  `docs/DEVPOST_SUBMISSION.md` and `docs/BRAND_GUIDE.md`.
- Plugin, ChatGPT, Codex, or local installation: read `docs/INSTALLATION.md`,
  `.codex-plugin/plugin.json`, `.mcp.json`, and
  `.agents/plugins/marketplace.json`.
- Branding, slides, or gallery assets: read `docs/BRAND_GUIDE.md`; the current
  judge deck is `docs/Woven-Hackathon-Pitch.pptx`.

When documentation conflicts, implemented behavior and tests win. Use this
precedence: code/tests and `docs/PRD.md` → `docs/architecture.md` →
`docs/HANDOVER.md` → public/pitch material. A storyboard never makes a planned
feature real.

## Current snapshot

- The working product is one Node.js service with a React MCP App, HTTP/stdio MCP
  transports, `/demo`, `/merchant`, `/install`, SQLite state, and a simulated
  Visa adapter.
- The canonical Tokyo charging-kit request produces complete, compatible,
  one-merchant carts and an exact, expiring confirmation.
- The connector-style demo identity check is **planned and not implemented**.
  Use the working checkout block in `script.md`; never show identity as live.
- The thirteen-slide judge deck contains a seven-slide main story and six backup
  slides. Its identity slide is explicitly labeled planned.
- Public HTTPS deployment, a shareable ChatGPT connection, real merchant/Visa
  integrations, the demo video, and final Devpost publication remain outstanding.

## Product and trust invariants

- The primary experience is an MCP App inside ChatGPT or Codex.
- `/demo` is a stage-safe rehearsal over the same backend: a clearly labeled
  simulated chat host (marked “Simulated” on screen) that surfaces real MCP tool
  calls. It never impersonates a real host and is not the primary product.
- Recommendations are complete, compatible carts from one merchant/location.
- The AI may recommend; only a direct user action may confirm exact terms.
- Every checkout remains bound to merchant, cart version, amount, expiry, nonce,
  and idempotency key.
- Price and stock are revalidated before preview and again on confirmation.
- Inventory mutation and order creation remain atomic; duplicate confirmation is
  idempotent; declines create no confirmed order; post-authorization merchant
  failure enters reversal.
- Visa authorization is simulated. Never claim a live Visa integration,
  partnership, real inventory, identity verification, or live charge.
- Never accept, store, log, or pass PAN, CVV, wallet tokens, passwords, or other
  payment/identity credentials through MCP arguments.
- Keep the model-visible result free of confirmation and identity secrets.
- Keep `PAYMENT_MODE` fail-closed outside `simulated` until a precise approved
  product, credentials, explicit user authorization, and security review exist.
- Authentication and transaction confirmation are separate trust gates. A static
  login mock does not satisfy identity verification.

## Architecture and scope

- Prefer the existing one-service architecture and current domain seams.
- Keep the canonical Tokyo charging-kit flow working unless the user explicitly
  changes product scope.
- Keep direct cart enumeration until catalog scale or richer substitution rules
  justify a solver.
- Replace real payment behavior only at `authorizePayment` in `src/payment.ts`.
- Do not add production accounts, onboarding, scraping, refunds, disputes,
  fulfilment, extra services, queues, caches, or databases without an explicit
  scope decision.

## Repository and worktree hygiene

- Run `git status` before editing. If multiple worktrees exist, also run
  `git worktree list` and inspect each affected checkout before switching or
  rebasing it.
- Preserve dirty worktrees on a branch before updating them. Never reset, clean,
  or overwrite another worktree's changes.
- Historical pre-Woven archive branches are not sources of truth. Do not merge
  them into `main` by default: they contain obsolete branding and pre-rename
  copy.
- The Woven shadcn interface and labeled simulated chat-host demo are already in
  `main`; historical source branches are not current product dependencies.
- Do not commit `data/`, `dist/`, `.env`, `.playwright-cli/`, secrets, logs, or
  local tool metadata unless the user explicitly requests it.
- Do not deploy, publish Devpost, change repository visibility, integrate live
  payments, push, or otherwise mutate external state unless the user requests
  that exact action.

## Documentation ownership

Update the smallest complete set whenever facts change:

- Product behavior or acceptance criteria: `docs/PRD.md`,
  `docs/architecture.md`, `docs/HANDOVER.md`, and affected README/script copy.
- Demo or pitch sequence: `script.md`, `docs/DEVPOST_SUBMISSION.md`,
  `docs/HANDOVER.md`, the judge deck, and affected screenshots/gallery assets.
- Brand language or assets: `docs/BRAND_GUIDE.md`, README hero/copy, plugin
  metadata, and submission captions.
- Installation, deployment, or external readiness: `docs/INSTALLATION.md`,
  `README.md`, and `docs/HANDOVER.md`.
- A change to these invariants or source-of-truth rules: update this file. Thin
  agent-specific bridge files should point here instead of duplicating policy.

## Definition of done

- Trace the real public flow and shared domain seam before editing.
- Add the smallest reliable check for changed non-trivial behavior.
- Run focused checks and `npm run check` before handoff.
- Visually verify changed buyer/merchant UI at desktop and mobile sizes.
- Render and inspect every changed slide; run overflow checks for PowerPoint.
- Keep README, script, PRD, architecture, Devpost copy, brand guide, and handover
  consistent with the implementation.
- Report anything that still needs human authority; never fill missing launch,
  team, credential, or compliance details by guessing.
