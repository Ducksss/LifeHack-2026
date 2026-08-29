# MissionCart brand guide

## Brand idea

MissionCart should feel like an airport operations desk crossed with a trusted
commerce interface: urgent but calm, editorial but exact. The core line is:

> One mission. One compatible cart. One explicit confirmation.

Use “MissionCart” as one word with capital M and C. Describe the payment as a
“simulated Visa authorization,” never a live payment, official integration, or
partnership.

## Visual system

The product UI is built with Tailwind CSS and shadcn/ui in a Vercel/Linear-style
monochrome system: white surfaces, hairline neutral borders, near-black primary
actions, and one dark hero/ops surface. Tokens live as CSS variables in
`web/styles.css`; shadcn primitives live in `web/components/ui/`.

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#0A0A0A` (zinc-950) | Dark hero, primary buttons, headings |
| Surface | `#FFFFFF` | Cards and panels |
| Canvas | `#FAFAFA` (zinc-50) | Page background behind cards |
| Border | `#EBEBEB` (neutral) | Hairline card and table borders |
| Muted | `#8F8F8F` (neutral) | Supporting copy and labels |
| Visa Accent | `#1739C6` | Simulated payment boundary only |
| Success | emerald 500–600 | Stock dots, confirmed results |
| Warning / Danger | amber / red | Scenario notes, declines, reversals |

Type is Geist Sans for all interface copy and headings (semibold, tight
tracking) and Geist Mono for IDs, audit events, prices in tables, and uppercase
operational microlabels. Both are self-hosted through `@fontsource-variable`
packages so the MCP widget's same-origin CSP holds; never load fonts from a CDN.

## Asset inventory

| Asset | Purpose |
| --- | --- |
| `docs/assets/brand/missioncart-mark.svg` | Square avatar and icon |
| `docs/assets/brand/missioncart-wordmark.svg` | Light-background wordmark |
| `docs/assets/brand/missioncart-kit-concept.png` | Text-free campaign/hero art |
| `docs/assets/devpost/cover.png` | Primary Devpost thumbnail and social card |
| `docs/assets/devpost/cover.svg` | Editable cover source |
| `docs/assets/devpost/architecture.png` | Devpost system-story slide |
| `docs/assets/devpost/architecture.svg` | Editable architecture source |
| `docs/assets/screenshots/*.png` | Verified product gallery |

All Devpost gallery images are 1600 × 900. Upload them uncropped in the order
listed in `docs/DEVPOST_SUBMISSION.md`.

## Voice

- Lead with the outcome: ready-to-go kit, compatible cart, exact confirmation.
- Prefer precise verbs: ranks, verifies, binds, rechecks, confirms, reverses.
- Keep the user in control: “The AI recommends. The user chooses.”
- State prototype boundaries beside payment claims, not in distant fine print.
- Avoid generic AI language such as “revolutionary,” “seamless,” or “powered by
  cutting-edge technology.” Show the constraint or safeguard instead.

## Image-generation prompt

The campaign artwork was generated with this final prompt:

> Create a premium editorial product still-life for MissionCart, an AI
> travel-commerce assistant. Wide 16:9 landscape composition, designed as a clean
> website hero background with generous negative space on the left for future
> headline overlay (do not add any text). On the right: a neatly organized
> international charging kit for a traveler—compact matte dark-green 65W GaN wall
> charger, braided USB-C cable, USB-C to Lightning-style cable without visible
> logos, universal Japan travel plug adapter, slim phone and laptop
> silhouettes—arranged on top of a cream boarding-pass-inspired paper dossier.
> Include a subtle route line with two abstract waypoint dots, but no readable
> labels. Art direction: modern premium fintech meets airport operations desk,
> warm off-white paper, deep forest green, signal-lime details, tiny restrained
> cobalt-blue accent, soft directional morning light, tactile paper grain,
> high-end product photography, precise objects, calm trustworthy mood. No people,
> no hands, no trademarks, no brand logos, no readable text, no watermarks, no UI
> mockups. Suitable for a hackathon Devpost cover and GitHub README hero, polished
> commercial composition.
