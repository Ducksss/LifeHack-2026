# Woven — WebMCP Challenge submission guide

This guide translates the live WebMCP Challenge page and official rules into a
submission plan for Woven. It was verified against Devpost on 1 September 2026.
The [official rules](https://webmcp.devpost.com/rules) and any later organizer
notices always prevail over this guide.

## Submission decision

Woven is a strong, eligible-looking fit for the challenge, but the submission is
not ready to send yet. The implementation, public repository, license, copy, and
live route exist. The remaining critical work is to verify the live tools in a
judge-equivalent browser, produce and publish a compliant public YouTube demo,
complete the entrant checks, and submit the Devpost form.

| Gate | Current Woven status | Required action |
| --- | --- | --- |
| WebMCP implementation | Ready | Seven top-level tools are implemented in `web/webmcp.ts` and registered from the visible page through `document.modelContext.registerTool` |
| Public live URL | Partly verified | `/webmcp` returns HTTP 200 with `Origin-Agent-Cluster: ?1`, `Permissions-Policy: tools=(self)`, and a bundle containing all seven tool names; still run a real tool-discovery and invocation test in ChatGPT's in-app browser or WebMCP-enabled Chrome |
| Public repository | Ready, canonical URL must remain consistent | Use `https://github.com/Ducksss/LifeHack-2026` unless the project owner explicitly changes the canonical submission repository; do not split judges between that repository and the duplicate `Woven-Commerce` remote |
| Open-source license | Ready | GitHub detects the MIT `LICENSE`; confirm it remains visible in the repository About area |
| Challenge-period provenance | Ready, subject to entrant attestation | The root commit is dated 29 August 2026 and the dedicated WebMCP commit is dated 31 August 2026, both after the challenge opened |
| Text description | Ready below | Paste the final copy and keep the simulator boundaries intact |
| Demo video | Not ready | Render or recover the final master, ensure it visibly demonstrates a real WebMCP tool call, clear all audio/trademark rights, upload it publicly to YouTube, and add the URL |
| Eligibility/team representative | Human check | Confirm age, residence, conflict, ownership, and the authorized representative before submitting |
| Devpost entry | Pending | Join the challenge, complete every required field, submit, and save proof of receipt before the deadline |

## Dates and operating window

The official rules are the source of truth. Devpost's schedule page displays a
12:00 PM start while the rules state 11:00 AM; that discrepancy does not affect
the closing deadline, and this guide follows the rules.

| Event | Pacific time | Singapore time |
| --- | --- | --- |
| Registration/submissions opened | 25 Aug 2026, 11:00 AM PDT | 26 Aug 2026, 2:00 AM SGT |
| **Submission deadline** | **3 Sep 2026, 1:00 PM PDT** | **4 Sep 2026, 4:00 AM SGT** |
| Judging begins | 4 Sep 2026, 10:00 AM PDT | 5 Sep 2026, 1:00 AM SGT |
| Judging ends; keep the project available through this time | 21 Sep 2026, 5:00 PM PDT | 22 Sep 2026, 8:00 AM SGT |
| Winners announced, approximately | 23 Sep 2026, 2:00 PM PDT | 24 Sep 2026, 5:00 AM SGT |

Submit well before 4:00 AM SGT. Devpost allows draft edits only before the
submission period closes. After the deadline, the portfolio copy may still be
editable, but the judged submission may not be changed except when the
organizers expressly allow a narrow correction.

## Eligibility and compliance gate

The entrant or every team member must complete this check. This guide does not
make a legal eligibility determination.

- [ ] Every entrant is at least the legal age of majority where they reside.
- [ ] Every entrant resides in an OpenAI API-supported country or territory and
  is not in an excluded jurisdiction listed by the rules.
- [ ] No entrant, household member, employer, or affiliate creates an excluded
  organizer, judge, sponsor, or other apparent conflict of interest.
- [ ] If entering as a team or organization, one eligible person is expressly
  authorized as its representative.
- [ ] Woven is the entrant's original work, the entrant owns the submission, and
  every included dependency, asset, dataset, API, and integration is used under
  appropriate terms.
- [ ] Woven was not developed with disqualifying financial or preferential
  support from the sponsor or administrator.
- [ ] All submission material is in English, or has a complete English
  translation.
- [ ] The demo video contains no unlicensed third-party trademarks, music,
  footage, images, or other copyrighted material. In particular, verify the
  right to use every Visa reference and the ElevenLabs-generated voice/ambient
  audio, or replace them with cleared generic material.
- [ ] No secrets, private credentials, payment data, personal information, or
  non-redistributable data appear in the public repository or media.

The official rules exclude, among other locations, Belarus, Brazil, China,
Crimea, Cuba, Donetsk, Hong Kong, Iran, North Korea, Luhansk, Quebec, Russia,
Syria, and Venezuela. Consult the current rules rather than treating this
summary as exhaustive.

## What Devpost requires

### 1. A working WebMCP web app

The app must be usable on its intended platform and behave as shown in the
description and video. Judges may use ChatGPT's in-app browser or Google Chrome
149 or later with `chrome://flags/#enable-webmcp-testing` enabled.

For Woven:

**Live URL:** https://visa-woven.vercel.app/webmcp

- [x] Public HTTPS route responds without login.
- [x] Required WebMCP security headers are present.
- [x] The deployed bundle contains all seven site-tool names.
- [ ] In ChatGPT's in-app browser, confirm all seven tools are discovered.
- [ ] Invoke `start_mission`, `compare_carts`, `select_cart`, and
  `refresh_carts` against the live route and confirm the visible page changes.
- [ ] Confirm that identity, checkout preview, confirmation nonce, and purchase
  authorization are not exposed as WebMCP tools.
- [ ] Repeat discovery and at least one tool call in Chrome 149+ with the flag
  enabled.
- [ ] Repeat the happy path in a logged-out/private session and on another
  network or machine.
- [ ] Leave the URL free and accessible through 21 September at 5:00 PM PDT.

Authentication is allowed, but judges must receive working credentials in the
submission form. Woven currently does not require judge credentials.

### 2. A text description

The description must answer all four organizer questions:

1. Why is this use case a strong fit for WebMCP?
2. How does it create a better user experience?
3. What can people and agents do together that was difficult or impossible
   before?
4. How was WebMCP implemented?

Paste-ready Woven copy appears later in this guide.

### 3. A public open-source repository

**Canonical submission repository:**
https://github.com/Ducksss/LifeHack-2026

The repository must include all source code, assets, and instructions needed to
run and evaluate the project. It must have an open-source license that Devpost
and GitHub can detect near the top of the repository page.

- [x] Repository is public.
- [x] MIT `LICENSE` exists and GitHub detects it.
- [x] Source, fixtures, tests, assets, installation, configuration, and run
  instructions are present.
- [x] WebMCP registration and tool code are public.
- [ ] Test a fresh clone using only the documented prerequisites:
  `npm ci`, `npm run check`, and `npm start`.
- [ ] Verify every README clone, issue, source, and submission link points to the
  one repository actually entered on Devpost.
- [ ] Confirm no required runtime asset is only present in an ignored local
  directory.

The example `search_products` snippet on Devpost illustrates the expected
WebMCP registration shape; it does not establish that Woven must expose a tool
with that exact name. Woven's actual implementation correctly registers its own
task-specific tools through `document.modelContext.registerTool`.

### 4. A public YouTube demo under three minutes

The submitted video must be publicly visible on YouTube, shorter than 3:00,
include audio, clearly show the project functioning, and explain both what was
built and how WebMCP is used. Judges do not have to watch after 3:00.

Current Woven source targets a 2:58 Remotion composition, but the rendered master
is not present in this checkout and no public challenge-video URL is recorded.
The current WebMCP scene transitions between screenshots. Treat that as a
storyboard, not sufficient final proof: the published cut should show a real
agent discovering the site tools and calling at least one of them while the
shared page visibly responds.

**Required video URL:** `[ADD PUBLIC YOUTUBE URL]`

Recommended 2:50 maximum final cut:

| Time | Evidence to show |
| --- | --- |
| 0:00–0:18 | The concrete problem: one rainy-weekend request still requires quantities, compatibility, stock, pickup, and budget work |
| 0:18–0:38 | Open the live `/webmcp` page in a supported agent browser and show the seven discovered tools |
| 0:38–1:10 | Have the agent call `start_mission`; show five complete one-merchant carts appear in the same visible page |
| 1:10–1:35 | Call `compare_carts` with a priority/area and show the Choice Center open and rerank |
| 1:35–1:55 | Call `select_cart` or an approved swap and show shared human/agent state |
| 1:55–2:20 | Explain that identity, exact checkout review, and purchase confirmation are deliberately human-only and absent from the tool surface |
| 2:20–2:38 | Show source code using `document.modelContext.registerTool`, closed schemas, annotations, and abort-bound cleanup |
| 2:38–2:50 | Close on the outcome, public URL, repository, and clearly simulated inventory/payment boundary |

Before upload:

- [ ] Render H.264/AAC and verify the actual duration with `ffprobe`; aim below
  2:55 to preserve margin after editing.
- [ ] Watch the entire exported file with sound.
- [ ] Keep tool names, the browser address, page response, and human-only
  boundary readable at 1080p.
- [ ] Use cleared voice, music, screenshots, marks, and product imagery.
- [ ] Upload to YouTube as **Public**, not Unlisted or Private.
- [ ] Enable captions or upload `video/Woven-WebMCP-Video.srt`.
- [ ] Open the YouTube URL while logged out and embed it in Devpost.

## Listing basics

**Project name:** Woven

**Tagline:** Seven site tools. One complete choice. Human-only confirmation.

**One-line description:** Woven gives agents seven WebMCP tools that turn one
shopping mission into complete, compatible carts on a shared live page without
giving the agent purchase authority.

**Live application:** https://visa-woven.vercel.app/webmcp

**Repository:** https://github.com/Ducksss/LifeHack-2026

**License:** MIT

**Demo video:** `[ADD PUBLIC YOUTUBE URL]`

**Suggested technologies:** WebMCP, TypeScript, React 19, Node.js, Express, MCP
Apps, Model Context Protocol, LangGraph.js, SQLite, Zod, Vite, Tailwind CSS,
shadcn/ui, Remotion, Playwright, Vercel

## Paste-ready required description

### Why Woven is a strong fit for WebMCP

Shopping agents can recommend individual products, but a real mission still
requires quantities, compatibility, budget, current stock, pickup, and consent
to work together. Woven turns that multi-step job into a structured
collaboration between an agent and the person already using the page.

On Woven's WebMCP workspace, the agent does not guess at buttons or scrape the
interface. Seven purpose-built site tools let it start or inspect a mission,
open the shared cart comparison, select an offered cart, apply only a
merchant-approved compatible alternative, refresh current price and stock, and
verify an existing simulated receipt.

### How it creates a better user experience

The canonical request asks for a rainy-weekend camping kit for two first-time
campers under S$300 that fits in one car boot and is pickup-ready today. Woven
returns five complete carts, each from one merchant and one pickup location,
and explains how every quantity and component satisfies the brief.

Agent calls update the same React workspace the person can see. When the agent
calls `compare_carts`, Woven opens and configures the visible Choice Center
rather than returning a disconnected text result. The person can review the
same carts, prices, stock, compatibility proof, alternatives, and selected
state. That removes repeated searching and cart reconstruction without hiding
the decision from the person.

### What people and agents can do together now

The agent can translate one outcome-oriented request into bounded, reversible
preparation work across product choice, constraints, current catalog facts, and
comparison. The person can inspect and steer that work in the same page, then
retain sole control of the irreversible step.

That boundary is intentional. Woven does not register identity verification,
checkout preview, confirmation secrets, or purchase authorization as WebMCP
tools. The agent may prepare and recommend; the person must complete the
clearly labeled demo identity handoff, review exact expiring terms, and directly
confirm. Inventory, identity, merchants, and payment authorization are
simulated, Woven accepts no card credentials, and it cannot make a live charge.

### How WebMCP was implemented

The top-level `/webmcp` document registers seven imperative tools through
`document.modelContext.registerTool`: `start_mission`, `get_mission`,
`compare_carts`, `select_cart`, `swap_cart_item`, `refresh_carts`, and
`verify_receipt`.

Each tool has a closed JSON schema. Read-only operations carry read-only
annotations, content-bearing results are marked untrusted where appropriate,
and every registration is attached to an `AbortSignal` so navigation removes
the page's tool surface. The server sends `Origin-Agent-Cluster: ?1` and
`Permissions-Policy: tools=(self)`.

WebMCP and the existing MCP App enter the same server-owned mission router,
deterministic commerce verifier, SQLite state, and checkout controls. The agent
cannot mark a cart checkout-eligible. Connected catalog facts may support a
cart; cited web research remains research-only. Price, stock, compatibility,
identity session, exact amount, nonce, expiry, and idempotency are revalidated
at the human confirmation boundary.

## Optional Devpost builder-story fields

Use these if the form exposes Devpost's standard narrative headings in addition
to the required challenge questions.

### Inspiration

Search gives links, but buying still takes work. A first-time camper has to size
the shelter, duplicate sleep gear, check rain ratings, fit everything into one
car, find one pickup location with stock, and rebuild the cart at checkout.
Woven was built around a simple product promise: everything works together.

### What it does

One natural-language mission becomes five ranked, complete, compatible carts.
The agent and person share a visible Choice Center, current selection,
merchant-approved alternatives, and refreshable catalog state. The agent can do
reversible preparation through WebMCP while identity and exact transaction
confirmation stay human-only.

### How we built it

Woven is one Node.js and TypeScript service with a React workspace, seven
top-level WebMCP site tools, HTTP and stdio MCP transports, deterministic cart
verification, bounded LangGraph.js orchestration for non-camping missions,
SQLite persistence, and a simulated payment adapter. Tests assert the exact
tool surface, schemas, cleanup lifecycle, shared UI behavior, security headers,
and absence of identity or purchase tools.

### Challenges

The hardest design decision was deciding what not to expose. Treating a tool
call as payment consent would erase the trust boundary. Woven exposes only
reversible preparation work and keeps identity, exact terms, secrets, and final
confirmation outside the agent's tool surface.

The second challenge was preserving one source of truth across WebMCP, the MCP
App, and the browser experience. All surfaces now share the same server routing,
validation, persistence, cart rules, and confirmation boundary.

### Accomplishments

- Seven browser-discoverable WebMCP tools over a complete product workflow.
- Tool calls update the visible human workspace instead of a parallel agent-only
  state.
- Five complete one-merchant carts with explicit budget, volume, weather,
  quantity, stock, and pickup proofs.
- Merchant-approved substitutions, refreshable facts, signed simulated
  receipts, and deterministic failure behavior.
- Human-only identity and purchase confirmation enforced by the server and
  omitted from WebMCP.
- Automated tests plus desktop and mobile verification.

### What we learned

WebMCP is strongest when the browser is not merely another API client. Its value
is shared context: the agent can act through precise tools while the person sees
and controls the same product state. Tool omission is also product design; the
absence of a purchase tool makes Woven's consent model clearer and safer.

## Challenge-period provenance

The rules allow a new project created during the submission period. If a project
predated the period, only the WebMCP extension is judged and the submission must
clearly distinguish the new work with dated evidence.

Current public Git history supports treating Woven as a new challenge-period
project:

- Challenge opened: 25 August 2026, 11:00 AM PDT.
- First repository commit: `0562eb3`, 29 August 2026, 10:59 PM SGT
  (29 August, 7:59 AM PDT).
- Dedicated WebMCP implementation: `4c862dd`, 31 August 2026, 1:38 AM SGT
  (30 August, 10:38 AM PDT).

**Evidence links:**

- [First Woven commit](https://github.com/Ducksss/LifeHack-2026/commit/0562eb39f7b968409f6a26b91a8de2667d6a0994)
- [Dedicated WebMCP commit](https://github.com/Ducksss/LifeHack-2026/commit/4c862dd64ce6c4026d6b013d8f19e0e52b52c62e)
- [Exact WebMCP change set](https://github.com/Ducksss/LifeHack-2026/compare/fb36bd6cf63d29564c3c22c8b0534af455d16c3b...4c862dd64ce6c4026d6b013d8f19e0e52b52c62e)

The entrant must confirm that Woven did not exist in an earlier private or
uncommitted form before relying on the new-project classification. If it did,
add this disclosure to the description:

> Woven began before the challenge as an MCP commerce prototype. During the
> submission period we meaningfully extended it with a top-level WebMCP
> workspace, seven imperative site tools, shared human-agent UI state,
> abort-bound registration, WebMCP security headers, tests, screenshots, and
> challenge media. The dated WebMCP commit and compare link isolate that work.

## Judging strategy

Stage one is pass/fail: Woven must visibly fit the human-and-agent open-web theme
and genuinely use WebMCP. Stage two scores four equally weighted criteria.
WebMCP Leverage is also the first tie-breaker.

| Criterion | Woven evidence | Make unmistakable in the entry |
| --- | --- | --- |
| WebMCP Leverage | Seven non-trivial tools; closed schemas; annotations; abort cleanup; shared UI effects; deliberately bounded authority | Show actual discovery and at least two live tool calls; link directly to `web/webmcp.ts` and `test/webmcp.test.ts`; explain why identity and purchase are absent |
| Execution | End-to-end mission, five carts, comparison, selection, approved swap, refresh, human confirmation boundary, merchant failure controls | Use the live deployment, one coherent run, readable state changes, and a fresh-clone check rather than feature enumeration |
| Potential Impact | First-time campers face a concrete multi-product compatibility, stock, pickup, budget, and consent problem | Lead with the user and measurable constraints; show how one request replaces repeated search and cart rebuilding |
| Creativity & Ambition | Complete-cart mission commerce plus a visible human-agent workspace and consent-aware tool surface | Contrast complete verified outcomes with product-link search; frame omission of irreversible tools as intentional interaction design |

Avoid spending scarce video time on the MCP App, LangGraph internals, Visa
roadmap, or merchant desk unless each directly supports a WebMCP judging point.
The challenge entry should make WebMCP—not the earlier pitch context—the hero.

## Prize reference

The top ten eligible submissions are listed as winners. Subject to verification
and the official rules, each winning submission is described as receiving:

- OpenAI: US$3,000 cash, an @OpenAIDevs spotlight, Codex Micro, swag for up to
  three team members, and one year of ChatGPT Pro for up to three members.
- Cloudflare: US$10,000 in credits.
- Vercel: US$300/month in platform credits plus US$50/month in Gateway credits
  for twelve months.
- Render: US$300 in credits.
- Netlify: US$500 cash.
- Shopify: US$250 in limited-edition gear per winning submission.
- Google Chrome: three months of Google AI Ultra per winning team member.

Prize delivery, substitutions, identity verification, tax, banking, and team
allocation rules apply. Do not make operating decisions based on the prize
summary without rechecking the official rules.

## Final execution order

### P0 — before polishing copy

- [ ] Confirm entrant eligibility, ownership, representative, and any prior
  private Woven history.
- [ ] Join the challenge from the correct Devpost account.
- [ ] Decide and lock the one canonical public repository URL.
- [ ] Run the live WebMCP discovery/call matrix in ChatGPT and Chrome.
- [ ] Capture a clean real-tool screen recording.

### P1 — required submission assets

- [ ] Replace or augment the screenshot-only WebMCP video scene with the real
  discovery and invocation footage.
- [ ] Clear third-party marks and audio, render under 3:00, and watch the export.
- [ ] Upload the demo publicly to YouTube and add the URL to this guide.
- [ ] Fresh-clone the public repository and run `npm ci`, `npm run check`, and
  `npm start`.
- [ ] Verify the live app, repository, license, and YouTube video while logged
  out.

### P2 — Devpost form and evidence

- [ ] Enter Woven's name, tagline, live URL, repository, video, technology list,
  and the four-part required description.
- [ ] Add the challenge-period commit and compare links.
- [ ] If the form supports testing instructions, use: “Open the live URL in
  ChatGPT's in-app browser, or Chrome 149+ with
  `chrome://flags/#enable-webmcp-testing`; no login is required.”
- [ ] Preview every link and image in the saved draft.
- [ ] Submit before 3 September 2026, 1:00 PM PDT / 4 September, 4:00 AM SGT.
- [ ] Save the submission confirmation page, email, and final public project URL.
- [ ] Keep the deployment and any credentials working through the judging end.

## Official references

- [Challenge overview](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
- [Schedule](https://webmcp.devpost.com/details/dates)
- [Challenge resources](https://webmcp.devpost.com/resources)
- [Organizer updates](https://webmcp.devpost.com/updates)
- [WebMCP specification source](https://github.com/webmachinelearning/webmcp)
- [Chrome WebMCP developer documentation](https://developer.chrome.com/docs/ai/webmcp)
- [WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps)

The Devpost plugin is optional and is not a source of truth. The submission can
be completed directly on the challenge website.
