# UX Contract

## Product context

- Audience: Singapore buyers, judges, and developers evaluating a bounded commerce agent.
- Primary jobs: compare complete carts, understand evidence/source health, verify identity, and continue to an exact merchant-owned checkout.
- Target market(s): Singapore.
- Active locales: English (`en-SG` behavior), SGD, Asia/Singapore time.
- Language/content register and native-review policy: concise product English; merchant content stays verbatim; product owner reviews launch copy.
- Timezone/calendar policy: pickup dates and verification times use Asia/Singapore.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Trust and confirmation | `docs/PRD.md` | Product contract | 2026-09-01 |
| State and evidence lifecycle | `docs/architecture.md` | Architecture contract | 2026-09-01 |
| External readiness | `docs/HANDOVER.md` | Operational handover | 2026-09-01 |
| Payment boundary | `src/payment.ts`, `docs/PRD.md` | Code + product contract | 2026-09-01 |
| Brand and claims | `docs/BRAND_GUIDE.md` | Brand guide | 2026-09-01 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`.
- Token ownership model: existing runtime is canonical; `DESIGN.md` mirrors it.
- Runtime design-system/token source: `web/styles.css`, `web/components/ui`, Tailwind v4.
- Mapping/export/adapters: CSS variables through `@theme inline`.
- Token drift gate: TypeScript build, focused browser snapshots, and `npm run check`.
- Supported themes: light only.
- Design-context owner/review policy: Woven product owner; update when shared visual or behavioral rules change.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Cart selection | Buyer app | `web/widget.tsx` | demo / live | component + browser flow |
| Source mode | WebMCP host header | `web/widget.tsx` | live / demo | browser + tool test |
| Select | Native element | `web/widget.tsx` | pickup area | keyboard + browser |
| Dialog | Native `dialog` | `web/widget.tsx` | choice / approved swap | keyboard + browser |
| Status badges | Shared Badge | `web/components/ui/badge.tsx` | source / platform / evidence | component + visual |
| Error alert | Buyer/host workflow | `web/widget.tsx` | retryable / terminal | failure-path test |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | labeled | surface shift | visible ring | pressed contrast | muted, same size | stable label swap | nearby alert |
| Icon button | accessible name | surface shift | visible ring | pressed | muted | spinner where applicable | nearby alert |
| Cart card | bordered | n/a | action focus | border + ring | action disabled | action label | source status |
| Source toggle | two choices | surface shift | visible ring | `aria-pressed` + surface | n/a | host activity | host error + alternate mode |
| Dialog | closed | n/a | first task control | modal | n/a | contained actions | content preserved |

## Dataset navigation

- Admin tables: merchant surface remains the canonical dense table.
- Exploratory lists: buyer carts are capped at five; live success targets one complete cart per platform.
- URL state: source mode is intentionally session-local; checkout URLs are never stored in the URL or shareable state.
- Page size: bounded by orchestration/cart caps; no pagination.
- Empty/no-results/error/loading treatment: explicit no-complete-cart, connector status, retryable error, and stable loader.
- Back/scroll restoration: merchant handoff opens externally; returning preserves the Woven mission in memory.
- Selection scope: one current cart per mission; a changed live version clears selection and pending handoff.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Start live mission | page/tool | source activity | cart results | platform status + carts | retry or demo toggle | results | `docs/PRD.md` |
| Select cart | card action | disabled peers | selected card | border/ring + exact summary | refresh | selected action | `docs/PRD.md` |
| Verify identity | app-only action | button label | same mission | verified identity copy | restart handoff | exact review | `docs/architecture.md` |
| Create live handoff | exact review | “Revalidating…” | consent block | exact terms + merchant button | refreshed carts/new review | handoff button | `docs/architecture.md` |
| Continue at merchant | destination button | host navigation | merchant site | destination named before click | recreate expired handoff | external page | `docs/PRD.md` |
| Confirm demo purchase | explicit demo action | “Authorizing…” | receipt | simulated status | fresh preview | result | `docs/PRD.md` |

## Navigation and responsive behavior

- Route document title policy: product + surface; WebMCP sets “Woven WebMCP Workspace”.
- Route error / 403 page behavior: inline safe error; no authorization details.
- Breadcrumb/tab/route-state policy: source toggle is header-owned; Choice Center tabs are dialog-owned.
- Sidebar/drawer/bottom-sheet transformation: none; cards stack on mobile and dialogs remain viewport-bounded.
- Responsive table strategy: comparison scrolls horizontally; cards stack.
- Truncation/full-value access: product names wrap; secrets are never rendered.
- Focus restoration and sticky-obstruction policy: native dialog restores focus; sticky alerts do not cover final controls.

## Overlays and feedback

- Dialog primitive: native `dialog` with explicit heading and close button.
- Destructive confirmation levels: only demo purchase confirmation is destructive; merchant checkout remains an external continuation.
- Toast placement/duration/deduplication: no transient toast system; workflow errors persist inline/sticky.
- Alert/banner scope and persistence: connector status belongs to the mission; action failure belongs to the active app.
- Tooltip delay/dismissal: native title only for nonessential utilities; essential explanation is visible text.
- Unsaved-changes behavior: not applicable.
- Layer/z-index contract: dialog backdrop > sticky workflow alert > page content.

## Async and resilience

- Mutation default: pessimistic.
- Idempotency and duplicate-submit policy: merchant cart creation receives an idempotency key; demo confirmation remains idempotent; buttons disable while pending.
- Auto-save/draft recovery: mission snapshots persist server-side; no user-authored draft.
- Offline/read-stale/write behavior: fail closed; never substitute demo data in live mode.
- Retry/backoff/timeout behavior: two discovery passes inside 25 seconds; one-platform degradation returns healthy verified carts; total failure is retryable.
- Version conflict and multi-tab behavior: price, stock, or variant change invalidates selection and pending handoff.
- Session expiry/re-authentication: identity and checkout handoffs expire independently and require fresh human review.
- Long-running progress and return path: host activity text then a retryable error or result.
- Stale-request cancellation/invalidation and pending-state ownership: AbortSignal reaches connectors; server owns snapshot and preview invalidation.
- Dialog/form preservation and retry after mutation failure: cart choice stays visible unless its version changes.

## Validation

- Schema/validation layer: Zod at MCP/HTTP/tool boundaries plus connector normalization and deterministic cart verification.
- Trigger timing: input on submit; platform facts on discovery and again before handoff.
- Error summary/inline policy: safe code/message; no raw provider payload or secret.
- Server error mapping: domain errors preserve retryable status.
- Sensitive-value handling: checkout URL only in private app metadata; signatures/tokens never enter model-visible output.
- Duplicate-submit prevention and submit recovery: disabled pending action plus idempotency/replay controls.

## Permission and clipboard

- Permission UI strategy: identity/preview/purchase tools are app-only and absent from WebMCP.
- Clipboard copy policy: no secret copy controls.
- Disabled-state explanation: visible adjacent copy for identity, expiry, source health, and missing private handoff.

## Verification

- Required static commands: `npm run test`, `npm run build`, `npm run check`.
- Browser/device/locale/theme matrix: `/demo` and `/webmcp` at 1440×900 and 390×844; hosted MCP App in ChatGPT and Codex; English/light theme.
- Accessibility checks: keyboard source toggle, dialog navigation/close, focus-visible, named icon actions, error live semantics, reduced motion.
- Native-language/domain review and target-user evidence: English product-owner review; Singapore contract evidence in PRD.
- Component-state/visual regression coverage: loading, live healthy/degraded, empty, stale, identity pending/verified, exact external handoff, demo receipt.
- Canonical sibling flow used for comparison: `/demo?instant`.
- Project audit command/result: recorded in final handover after browser verification.
- Failure-path evidence: connector fixtures and handoff security tests.
