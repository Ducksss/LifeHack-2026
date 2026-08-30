# Woven — WebMCP Challenge submission kit

This is paste-ready for the WebMCP Challenge. Do not publish until the authorized
production deployment, public video upload, and final logged-out checks are done.

## Listing basics

**Project name:** Woven

**Tagline:** Seven site tools. One complete choice. Human-only confirmation.

**One-line description:** Woven gives ChatGPT and Codex seven WebMCP tools that
turn one shopping mission into complete, compatible carts on a shared live page
without giving the agent purchase authority.

**Repository:** https://github.com/Ducksss/LifeHack-2026

**License:** MIT

**Working WebMCP URL after deployment:** https://visa-woven.vercel.app/webmcp

**Challenge video after upload:** [ADD PUBLIC YOUTUBE URL]

## Project description

Shopping agents can recommend individual products, but a real mission still
requires quantities, compatibility, budget, stock, pickup, and consent to work
together. Woven solves that complete problem.

On `/webmcp`, the browser exposes seven imperative site tools. An agent can start
or inspect a mission, open the shared cart comparison, select an offered cart,
apply only a merchant-approved compatible swap, refresh current price and stock,
and verify a simulated receipt. Those actions update the same visible React
workspace the person is using.

The canonical mission asks for a rainy-weekend camping kit for two first-time
campers under S$300 that fits one car boot and is pickup-ready today. Woven
returns five complete carts, each from one merchant and one location, and proves
that every quantity and component satisfies the brief.

The safety boundary is part of the WebMCP design: Woven does not register demo
identity, checkout preview, or purchase confirmation tools. The agent may
recommend and prepare; the person must verify identity, review exact terms, and
confirm in the visible interface. Inventory, merchants, identity, and Visa
authorization are clearly simulated. Woven collects no payment credentials and
cannot make a live charge.

## How WebMCP is used

| Site tool | What it does |
| --- | --- |
| `start_mission` | Runs Woven's shared server-owned mission router |
| `get_mission` | Reads the current public mission and cart state |
| `compare_carts` | Opens the shared Choice Center with a priority and pickup area |
| `select_cart` | Selects one currently offered cart |
| `swap_cart_item` | Applies one current merchant-approved alternative |
| `refresh_carts` | Rebuilds carts from current demo price and stock |
| `verify_receipt` | Verifies a signed simulated receipt |

The tools are registered in the top-level document with
`navigator.modelContext.registerTool`. Each has a closed JSON schema;
read-only tools carry read-only annotations; registration is tied to an
`AbortSignal`; and the page sends `Origin-Agent-Cluster: ?1` plus
`Permissions-Policy: tools=(self)`.

## What we built

- A real top-level WebMCP workspace with seven browser-discoverable tools.
- Shared agent/human state: tool calls open and reconfigure the visible Choice
  Center instead of returning a disconnected text answer.
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
surfaces use the same routing, validation, persistence, and cart rules.

## Accomplishments

- The in-app browser discovered all seven tools from the real local page.
- `compare_carts` opened the visible comparison dialog and applied agent-chosen
  ranking and area preferences.
- Selection, approved swapping, and refresh preserved shared mission state.
- Desktop and 390 px mobile layouts were visually verified with no console errors.
- Automated tests assert the exact tool surface, schemas, abort cleanup, shared
  UI event, security headers, and absence of identity or purchase tools.

## What we learned

WebMCP is strongest when the browser is not just another API client. The useful
part is shared context: the agent can act through structured tools while the
person sees the same state, comparisons, and safety boundary. Tool design also
becomes product design—omitting an irreversible tool can be as important as
implementing a useful one.

## Built with

TypeScript, React 19, Node.js, Express, WebMCP, MCP Apps, Model Context Protocol,
LangGraph.js, SQLite, Zod, Vite, Tailwind CSS, shadcn/ui, Remotion, and Playwright.

## Demo video run of show — 2:58

| Time | Evidence |
| --- | --- |
| 0:00–0:48 | Problem, complete-cart promise, and concrete constraints |
| 0:48–1:28 | Real `/webmcp` readiness card, discovered tools, and `compare_carts` changing the shared page |
| 1:28–2:13 | Human-only identity, exact review, confirmation, and simulated result |
| 2:13–2:33 | Merchant-controlled price, stock, decline, reversal, and audit |
| 2:33–2:58 | Why the interaction belongs in the AI workflow and the simulator boundary |

The narration is AI-generated. The video must remain below 3:00 after YouTube
processing and must show the live WebMCP page, not only slides.

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
