# Woven brand guide

## Brand idea

Woven turns separate threads—intent, compatibility, budget, inventory, pickup,
and consent—into one complete choice. It should feel calm under pressure:
editorial enough to be memorable, operational enough to be trusted.

**Product promise:** Everything works together.

**Explanatory line:** Everything you need, woven into one choice.

**Stage line:** Ask once. Review once. Confirm once.

**Trust line:** The AI recommends. Only you can authorize.

Use “Woven” with one capital W. It is a working hackathon identity, not a claim
of trademark clearance. Always call the payment result a “simulated Visa
authorization”; never imply a live payment, official integration, or partnership.

## Identity system

The Flightpath mark is one continuous route that forms a W. Signal Lime marks the
request's origin; Waypoint Blue marks the verified destination. The line between
them represents Woven resolving compatibility, budget, inventory, pickup, and
consent into one clear path. It replaces shopping-bag, wand, robot, and sparkle
symbols.

| Token | Hex | Use |
| --- | --- | --- |
| Route Ink | `#0E4B3B` | Primary backgrounds, route line, and text |
| Signal Lime | `#B7F522` | Origin, selections, confirmation, and progress |
| Route Mist | `#DCECE5` | Compatibility, completion, and supporting surfaces |
| Runway Paper | `#F4EEE4` | Editorial canvas |
| Warm White | `#FCFAF5` | Cards, route line, and logo ground |
| Waypoint Blue | `#1545E8` | Verified destination and simulated rail boundary |
| Field Grey | `#6D7974` | Supporting copy and dividers |
| Alert Clay | `#B64032` | Decline or invalidation states |

The table above governs marketing and campaign assets (covers, decks, social
cards). The shipped product UI uses its own system, below.

## Product UI system

The web surfaces (`/demo`, `/merchant`, and the MCP widget) are built with
Tailwind CSS and shadcn/ui in a Vercel/Linear-style monochrome system: white
cards, hairline neutral borders, near-black (`#0A0A0A`) primary actions, one
dark hero/ops surface, and Waypoint Blue reserved for the simulated payment
boundary. The Flightpath mark carries Signal Lime and Waypoint Blue into the UI
as its only decorative accents. Tokens live as CSS variables in
`web/styles.css`; shadcn primitives live in `web/components/ui/`.

Type is Geist Sans for interface copy and headings (semibold, tight tracking)
and Geist Mono for IDs, audit events, table prices, and uppercase operational
microlabels. Both are self-hosted through `@fontsource-variable` packages so the
MCP widget's same-origin CSP holds; never load fonts from a CDN.

## Logo rules

- Keep the route Warm White on Route Ink, with its Signal Lime origin and
  Waypoint Blue destination.
- Leave clear space equal to one route width around the mark.
- Use the supplied SVG; do not recreate it with a shopping cart or bag.
- Keep Waypoint Blue subordinate: one endpoint, never the entire route.
- Use the horizontal wordmark when the product promise needs to travel with it.

## Product language

| Moment | Preferred language |
| --- | --- |
| Hero | Everything you need. Woven into one choice. |
| Results | Three ways it comes together. |
| Compatibility | Every thread checked. Nothing left to connect. |
| Checkout | Review the exact terms. |
| Confirmation | Your yes is the final thread. |
| Trust | Nothing moves until you confirm. |

Lead with outcomes and precise verbs: builds, checks, binds, revalidates,
confirms, and reverses. Avoid generic AI claims such as “revolutionary,”
“seamless,” or “magic.” State prototype boundaries next to payment claims.

## Asset inventory

| Asset | Purpose |
| --- | --- |
| `docs/assets/brand/woven-mark.svg` | Square avatar and app icon |
| `docs/assets/brand/woven-wordmark.svg` | Horizontal wordmark and promise |
| `docs/assets/brand/woven-hero-flightpath.png` | Text-free campaign hero |
| `docs/assets/brand/woven-cover.{png,svg}` | Product statement beside the working buyer UI |
| `docs/assets/brand/concepts/*.png` | Archived identity explorations; not production marks |
| `docs/assets/devpost/cover.png` | Devpost thumbnail and gallery cover (product-led chat-host composition) |
| `docs/assets/devpost/cover.html` | Editable cover source; render at 1600 × 900 after refreshing `buyer-overview.png` |
| `docs/assets/devpost/architecture.{png,svg}` | Concise system-story slide |
| `docs/assets/devpost/woven-user-flow.png` | Six-step product flow with real product screens |
| `docs/assets/devpost/woven-trust-boundary.png` | Human authorization and simulator boundary |
| `docs/assets/devpost/woven-architecture.png` | Detailed technical architecture |
| `docs/Woven-Devpost-Visuals.pptx` | Presentation-ready source deck for the three slides |
| `docs/assets/screenshots/*.png` | Verified product gallery |
| `docs/assets/slides/*.png` | Text-free editorial backgrounds for friction, the complete kit, and explicit human confirmation |
| `docs/assets/demo/*.{png,svg}` | Numbered 16:9 stage fallback sequence and closing card built from verified product screens |
| `script.md` | Authoritative three-minute narration and language guardrails |
| `docs/Woven-Hackathon-Pitch.pptx` | Eleven-slide judge deck; the identity slide is explicitly labeled as planned |

All Devpost gallery images are 1600 × 900. Upload them uncropped in the order
listed in `docs/DEVPOST_SUBMISSION.md`.

The demo fallback PNGs are also 1600 × 900. Their editable SVG sources reference
the canonical logo and raw product screenshots, so update the source screenshots
first whenever the buyer or merchant UI changes.

## Campaign image brief

The hero artwork uses a right-heavy, text-free editorial still life: a GaN
charger, compatible cables, travel adapter, phone, and laptop on warm stone. A
Signal Lime cable forms a loose route through the objects, with Route Ink and
Route Mist details. The quiet left side is intentionally reserved for copy. Keep
people, logos, shopping-cart icons, AI sparkles, and purple gradients out of this
system.

## Slide asset pack

The optional editorial backgrounds in `docs/assets/slides/` are composed for a
left-aligned title and copy block. Use them uncropped or crop only from the outer
right edge so the negative-space rhythm remains intact.

| Asset | Best fit | Meaning |
| --- | --- | --- |
| `woven-friction.png` | Slide 2 | Tangled, incompatible choices make the user rebuild the cart |
| `woven-complete-kit.png` | Slides 3–4 | One calm, complete charging kit resolves the whole request |
| `woven-human-confirmation.png` | Slides 5 or 7 | The route remains incomplete until the person makes the final connection |

These are editorial metaphors, not product evidence. Keep the verified buyer,
checkout, receipt, and merchant screenshots wherever the deck makes a live
product claim.
