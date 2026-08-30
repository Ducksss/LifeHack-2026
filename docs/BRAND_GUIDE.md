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

The web surfaces (`/demo`, `/identity`, `/merchant`, and the MCP widget) are built with
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

The `/identity` simulator uses a denser Waypoint Blue treatment with a yellow
security accent to signal an external-provider handoff. It must always retain
the **Identity simulator · Demo only** header and the explicit no-Visa-account,
no-card-details boundary.

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
| Results | Five ways it comes together. |
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
| `assets/{icon,logo}.png` | Packaged Codex plugin composer icon and light/dark-safe wordmark |
| `assets/screenshot-*.png` | Packaged plugin details-page gallery copied from verified product evidence |
| `docs/assets/brand/woven-mark.svg` | Square avatar and app icon |
| `docs/assets/brand/woven-wordmark.svg` | Horizontal wordmark and promise |
| `docs/assets/brand/woven-hero-flightpath.png` | Text-free campaign hero |
| `docs/assets/brand/woven-cover.{png,svg}` | Product statement beside the working buyer UI |
| `docs/assets/brand/concepts/*.png` | Archived identity explorations; not production marks |
| `docs/assets/devpost/cover.png` | Devpost gallery cover and 16:9 campaign artwork |
| `output/devpost/woven-thumbnail-3x2.png` | Devpost-only 3:2 thumbnail derived from the official cover without cropping its claims |
| `docs/assets/devpost/cover.html` | Editable cover source; render at 1600 × 900 with Playwright |
| `docs/assets/devpost/architecture.{png,svg}` | Concise system-story slide |
| `docs/assets/devpost/woven-user-flow.png` | Superseded by `woven-how-it-works.png`; kept for the editorial deck variant |
| `docs/assets/devpost/woven-trust-boundary.png` | Human authorization and simulator boundary |
| `docs/assets/devpost/woven-architecture.png` | Superseded by `woven-system-architecture.png`; kept for the editorial deck variant |
| `docs/assets/devpost/woven-how-it-works.png` | Six-step ask→confirm→collect flow drawn in the shipped product UI style |
| `docs/assets/devpost/woven-system-architecture.png` | Surfaces → one service → trust boundary diagram in the shipped product UI style |
| `docs/assets/devpost/woven-under-the-hood.png` | Deep-dive sequence: the model's tool call to receipt, with real payloads and gates |
| `docs/assets/devpost/src/*.html` | Editable sources for the three product-style explainers; render at 1600 × 900 (see file comments) |
| `docs/assets/devpost/src/_frame-template.html` | Copyable branded shell for new 1600 × 900 HTML frames; render with `npm run frame:render -- <source.html>` |
| `docs/Woven-Devpost-Visuals.pptx` | Presentation-ready source deck for the three slides |
| `docs/assets/screenshots/*.png` | Verified product gallery |
| `docs/assets/screenshots/demo-identity.png` | Verified `/identity` simulator evidence |
| `docs/assets/slides/*.png` | Text-free editorial backgrounds for friction, the complete kit, and explicit human confirmation |
| `docs/assets/demo/*.{png,svg}` | Numbered 16:9 stage fallback sequence and closing card built from verified product screens |
| `docs/assets/marketing/woven-demo-loop.gif` | Animated ~33s loop of the real `/demo` flow for README, Devpost, and social posts |
| `docs/assets/marketing/woven-how-it-works-square.png` | 1080 × 1080 four-step how-it-works card for feeds |
| `docs/assets/marketing/woven-how-it-works-story.png` | 1080 × 1920 four-step how-it-works card for stories |
| `script.md` | Authoritative three-minute narration and language guardrails |
| `docs/Woven-Hackathon-Pitch.pptx` | Judge deck with the camping mission and working simulated identity handoff |
| `video/WovenJudgeVideo.tsx` | Three-minute Remotion judge-video source using the same brand tokens and verified evidence |
| `video/Woven-Judge-Video.srt` | Sidecar captions for the judge-video master |
| `public/woven-video/` | Replaceable ElevenLabs AI narration and ambient audio for the Remotion composition |
| `output/Woven-Judge-Video.mp4` | Generated local master; ignored by Git and uploaded only after final review |

All Devpost gallery images are 1600 × 900. Upload them uncropped in the order
listed in `docs/DEVPOST_SUBMISSION.md`; the separate 1500 × 1000 thumbnail is
only for Devpost's project-card field.

The demo fallback PNGs are also 1600 × 900. Their editable SVG sources reference
the canonical logo and raw product screenshots, so update the source screenshots
first whenever the buyer or merchant UI changes, then re-render each SVG to PNG.
The marketing cards embed a live portrait capture of `/demo` and the current
gallery screenshots; regenerate them after any visible UI change. The animated
loop is recorded from the real `/demo` sequence at 1280 × 800 and assembled with
ffmpeg at 8 fps, 960px wide. Use `/demo?loop=true` for unattended live display;
it shows the server-enforced simulated identity success and host acknowledgement,
then fades back to the start without depicting an automatic purchase.

## Campaign image brief

The hero artwork uses a right-heavy, text-free editorial still life: a compact
rainproof tent, two rolled sleeping bags, two mats, a lantern, and a first-aid
kit arranged beside a wet forest campsite. A Signal Lime guyline forms a loose
route through the gear, with Route Ink and Route Mist details. The quiet left
side is intentionally reserved for copy. Keep
people, logos, shopping-cart icons, AI sparkles, and purple gradients out of this
system.

## Slide asset pack

The optional editorial backgrounds in `docs/assets/slides/` are composed for a
left-aligned title and copy block. Use them uncropped or crop only from the outer
right edge so the negative-space rhythm remains intact.

| Asset | Best fit | Meaning |
| --- | --- | --- |
| `woven-friction.png` | Slide 2 | Tangled, incompatible choices make the user rebuild the cart |
| `woven-complete-kit.png` | Slides 3–4 | One calm, complete camping kit resolves the whole request |
| `woven-human-confirmation.png` | Slides 5 or 7 | The route remains incomplete until the person makes the final connection |

These are editorial metaphors, not product evidence. Keep the verified buyer,
checkout, receipt, and merchant screenshots wherever the deck makes a live
product claim.
