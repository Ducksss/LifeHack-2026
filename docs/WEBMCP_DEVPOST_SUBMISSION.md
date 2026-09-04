# Woven — WebMCP Challenge submission kit

This is paste-ready for the WebMCP Challenge. Do not publish until the authorized
production deployment, public video upload, and final logged-out checks are done.

## Listing basics

**Project name:** Woven

**Tagline:** Seven site tools. One complete choice. Human-only confirmation.

**One-line description:** Woven gives the ChatGPT desktop browser and Codex seven
WebMCP site tools that turn one shopping mission into complete, compatible carts
on a page the agent and the person share, without giving the agent purchase
authority.

**Repository:** https://github.com/Ducksss/LifeHack-2026

**License:** MIT

**Working WebMCP URL after deployment:** https://visa-woven.vercel.app/webmcp

**Challenge video after upload:** [ADD PUBLIC YOUTUBE URL]

## Project description

Shopping agents can recommend individual products, but a real mission still
requires quantities, compatibility, budget, stock, pickup, and consent to work
together. Woven solves that complete problem.

On `/webmcp`, the page registers seven imperative site tools. An agent can start
or read a mission, open the shared cart comparison and rerank it, select a cart
by merchant and location name, apply only a merchant-approved compatible swap
by item name, refresh current price and stock and hear exactly what changed, and
verify a simulated receipt. Every call changes the same visible React workspace
the person is using, and every call is mirrored in a shared activity rail next
to the person's own clicks, so both sides always see the same carts.

The canonical mission asks for a rainy-weekend camping kit for two first-time
campers under S$300 that fits one car boot and is pickup-ready today. Woven
returns five complete carts, each from one merchant and one location, and proves
that every quantity and component satisfies the brief.

The safety boundary is part of the WebMCP design: Woven does not register demo
identity, checkout preview, or purchase confirmation tools, and the page says so
in a human-only panel. The agent may recommend and prepare; the person must
verify identity, review exact terms, and confirm in the visible interface.
Inventory, merchants, identity, and Visa authorization are clearly simulated.
Woven collects no payment credentials and cannot make a live charge.

## How WebMCP is used

| Site tool | What it does | Agent input |
| --- | --- | --- |
| `start_mission` | Runs Woven's shared server-owned mission router | Plain-language request, optional budget, campers, pickup date |
| `get_mission` | Reads the mission, every cart, the selected cart's items and approved swaps, identity status, and the next human-only step | None |
| `compare_carts` | Opens the shared Choice Center, reranks it, and returns the same ranked order the person sees | Priority (balanced, value, speed, weather) and pickup area |
| `select_cart` | Selects one currently offered cart | A `cartId`, or a merchant name plus optional location |
| `swap_cart_item` | Applies one current merchant-approved alternative | An `offerId`, or the alternative's item name |
| `refresh_carts` | Rebuilds carts from current demo price and stock and lists per-location changes | None |
| `verify_receipt` | Verifies a signed simulated receipt after the person confirmed | None |

The tools are registered in the top-level document with
`document.modelContext.registerTool`, with a fallback to Chrome's early-preview
`navigator.modelContext` so one build works in the ChatGPT desktop browser and
in Chrome's origin trial. Each tool has a closed JSON schema; read-only tools
carry `readOnlyHint`; tools that return page data carry `untrustedContentHint`;
registration is tied to an `AbortSignal`; and the page sends
`Origin-Agent-Cluster: ?1` plus `Permissions-Policy: tools=(self)`.

Results are designed for the model, not dumped from the UI: compact JSON with
cart ids, human-readable totals, rain ratings, pickup times, approved swaps, and
a `nextSteps` line that names the human-only step. Errors are self-correcting,
for example an ambiguous merchant name returns the candidate locations and ids.
No result ever carries the confirmation nonce, identity session, or receipt
signature.

## What we built

- A real top-level WebMCP workspace with seven browser-discoverable tools and a
  visible panel that lists them, marks the read-only ones, and names the three
  human-only actions that deliberately have no tool.
- Shared agent/human state: tool calls open and reconfigure the visible Choice
  Center, select and swap on the page, and appear in one activity rail labelled
  Agent, You, or Page.
- Copyable prompts on the page so a judge in the ChatGPT desktop browser can
  exercise the tools in seconds.
- Natural-language arguments (merchant, location, item name) resolved strictly in
  code, with descriptive errors that list valid choices.
- A deterministic complete-cart engine for the canonical camping mission.
- A bounded LangGraph.js route for credential-enabled non-camping missions that
  treats web research as research-only and fails closed without verified offers.
- Server-enforced identity, exact mandate, nonce, idempotency, inventory, and
  signed-receipt controls behind a human-only confirmation boundary.
- HTTP and stdio MCP App transports, `/demo`, `/merchant`, and `/webmcp` in one
  Node.js service with SQLite state and a simulated Visa adapter.

## Challenges

The hardest design decision was deciding what not to expose. A naive commerce
integration would register a purchase tool and treat an agent call as consent.
Woven instead exposes the reversible preparation work and keeps identity and the
exact transaction outside the model's tool surface.

The second challenge was preserving one source of truth across MCP, WebMCP, and
the browser rehearsal. We extracted the shared mission entry point so all three
surfaces use the same routing, validation, persistence, and cart rules, and the
ranking used by `compare_carts` is the same function that sorts the visible
Choice Center.

## Accomplishments

- The page registered all seven tools through its real `document.modelContext`
  registration path (exercised locally with a spec-shaped shim) and
  `compare_carts` opened the visible comparison with the agent's ranking and
  area applied.
- `select_cart` by merchant and location, `swap_cart_item` by item name, and
  `refresh_carts` preserved shared mission state, and the activity rail showed
  each agent call beside the person's own actions.
- Desktop and 390 px mobile layouts were visually verified with no console errors.
- Automated tests assert the exact tool surface, closed schemas, read-only
  annotations, compact secret-free results, natural-language resolution and
  ambiguity errors, change reporting, activity reporting, context resolution,
  abort cleanup, security headers, and the absence of identity or purchase tools.

## What we learned

WebMCP is strongest when the browser is not just another API client. The useful
part is shared context: the agent can act through structured tools while the
person sees the same state, comparisons, and safety boundary. Tool design also
becomes product design: omitting an irreversible tool can be as important as
implementing a useful one, and a result the model can reason about matters more
than a result that mirrors the whole UI.

## Built with

TypeScript, React 19, Node.js, Express, WebMCP, MCP Apps, Model Context Protocol,
LangGraph.js, SQLite, Zod, Vite, Tailwind CSS, shadcn/ui, Remotion, and Playwright.

## Demo video run of show — 2:58

| Time | Evidence |
| --- | --- |
| 0:00–0:48 | Problem, complete-cart promise, and concrete constraints |
| 0:48–1:28 | Real `/webmcp` workspace, discovered tools, and `compare_carts` changing the shared page |
| 1:28–2:13 | Human-only identity, exact review, confirmation, and simulated result |
| 2:13–2:33 | Merchant-controlled price, stock, decline, reversal, and audit |
| 2:33–2:58 | Why the interaction belongs in the AI workflow and the simulator boundary |

The narration is AI-generated. The video must remain below 3:00 after YouTube
processing and must show the live WebMCP page, not only slides. The 2:58 master
was rendered from the earlier readiness-card layout; the current workspace
panel, activity rail, and prompts are shown in the screenshots and the live page.

## Final submission checklist

- [x] Public GitHub repository and MIT license
- [x] Working local WebMCP page and seven discoverable site tools
- [x] Automated tests, production build, desktop/mobile browser verification
- [x] 2:58 local challenge master with audio and visible WebMCP evidence
- [ ] Deploy this exact build and verify `/webmcp` over public HTTPS
- [ ] Upload the 2:58 master to YouTube and add the public URL above
- [ ] Test the live URL and video while logged out
- [ ] Paste the final description and technology list into Devpost
- [ ] Submit before 3 September 2026, 1:00 PM PDT
