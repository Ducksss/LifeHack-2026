---
version: alpha
name: "Woven"
description: "A calm, evidence-first commerce workspace that turns a shopping brief into a small set of complete, trustworthy carts."
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "oklch(0.627 0.17 149.2)"
  warning: "oklch(0.666 0.157 58.3)"
  identity: "oklch(0.4 0.19 264.5)"
typography:
  sans:
    fontFamily: '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
  mono:
    fontFamily: '"Geist Mono Variable", ui-monospace, "SF Mono", "Cascadia Mono", monospace'
rounded:
  DEFAULT: "0.625rem"
  sm: "calc(0.625rem - 4px)"
  md: "calc(0.625rem - 2px)"
  lg: "0.625rem"
  xl: "calc(0.625rem + 4px)"
spacing:
  section-gap: "2rem"
  page-max: "65rem"
components:
  button: { }
  card: { }
  dialog: { }
  badge: { }
  table: { }
---

# Woven Design System

## Overview

### Creative North Star

Woven should feel like a well-prepared expedition table: a dark briefing surface, neatly grouped evidence cards, and one conspicuous final handoff. The weave mark and faint hero grid are the expressive signature; commerce controls remain familiar and quiet.

### Product context and register

- **Audience and primary job:** Singapore buyers who need a complete compatible cart, and judges or developers verifying the trust boundary.
- **Target market(s) and evidence:** Singapore is binding in `docs/PRD.md` and the `MissionSpec` market/currency contract.
- **Locale(s) and language policy:** English UI, SGD amounts, Singapore dates/times. Product names remain merchant-authored.
- **Usage scene:** Desktop or mobile, inside ChatGPT/Codex or the browser workspace, with moderate density and a time-sensitive pickup decision.
- **Register:** Hybrid. The landing hero is brand-led; `/demo`, `/webmcp`, identity, merchant, and install surfaces are product-led.
- **Memorable signature:** The dark woven briefing header followed by numbered proof sections.
- **Restraint:** Identity, totals, source health, failure recovery, and merchant checkout use standard controls and direct language.
- **Anti-references:** No neon crypto dashboard, glassmorphism stack, marketplace ad wall, or falsely native ChatGPT imitation.
- **Token ownership/runtime mapping:** This file mirrors the canonical Tailwind v4 variables in `web/styles.css`; it does not generate runtime tokens. `npm run check` is the drift gate.

## Colors

The interface is primarily black, white, and zinc so evidence and totals carry the hierarchy. Emerald is reserved for verified/healthy state, amber for recoverable connector degradation, red for actionable failure, and blue for the simulated identity boundary. Focus uses the runtime ring token. The current product supports a light theme only.

## Typography

Geist Variable carries prose, controls, and product names. Geist Mono is limited to micro-labels, tool names, compact status badges, and technical identifiers. Totals use tabular-feeling short numeric strings and never rely on color alone. Uppercase is limited to short micro-labels.

## Layout

Buyer content caps at 1040px (`65rem`) with 24–40px responsive section padding. Cards move from one column to two or three without changing task order. Tables may scroll horizontally when comparison semantics would be lost by stacking. Loading, error, and source-status blocks reserve stable space where practical.

## Elevation & Depth

Hierarchy comes from tonal surfaces and 1px borders. A small shadow distinguishes the embedded buyer app; dialogs use a stronger shadow and a dimmed backdrop. Cards do not receive decorative floating shadows. Sticky alerts remain below dialogs.

## Shapes

Controls use the shared 10px radius family; major app/dialog containers use 16px. Status dots are the only routine circles. Icons use Lucide’s outline language in 12–28px sizes.

## Components

### Foundational visual states

Default controls have a visible boundary; hover changes the surface; focus-visible uses the shared ring; pressed/selected state is expressed by both contrast and `aria-pressed`; disabled state preserves geometry; busy state swaps the label without resizing; success, warning, and error combine icon, text, and color. `Loader2` is the app-owned indeterminate indicator. Reduced motion collapses animation durations.

### Buttons and actions

Primary buttons advance selection, verification, or handoff. Outline buttons compare, refresh, or open supporting material. Ghost buttons are local utilities. The merchant handoff names its destination (“Continue at Shopify/WooCommerce”) and is never labeled as purchase completion. Icon-only buttons require an accessible name.

### Navigation and data display

The host header owns source mode. Numbered sections own buyer progression. Platform, verification, and health badges use text plus a status cue. Exact totals sit adjacent to the relevant cart or handoff. Merchant links open through the host API where available.

### Forms and overlays

The Choice Center and swap chooser use native `dialog`, explicit headings, close controls, and bounded scrolling. Native selects and checkboxes retain platform keyboard behavior. Errors remain near the active workflow and offer a retry when the server marks them retryable.

### Iconography

Lucide React is canonical. Use outline icons at `size-3` through `size-7`; decorative icons are hidden from accessibility APIs. Text labels remain mandatory for trust, money, source, and navigation actions.

### Motion

Feedback uses 160–300ms transitions; staged demo narration is the sole long-form motion. Motion communicates activity or content arrival and is interruptible. `prefers-reduced-motion` reduces every animation and transition.

### Content and data visualization

Voice is direct, exact, and non-promotional. Say “verified”, “research only”, “simulated”, and “payment occurs on the merchant site” precisely. Format all money as SGD. Never claim external purchase completion.

## Do's and Don'ts

- **Do:** Put platform, verification time, exact total, and checkout boundary beside the selected cart.
- **Do:** Preserve the same cart ordering and action vocabulary across MCP App and WebMCP surfaces.
- **Don't:** Treat connector failure as an empty success or silently fall back to seeded products.
- **Don't:** expose checkout URLs, signatures, tokens, or identity protocol state in visible data tables or model-readable results.
