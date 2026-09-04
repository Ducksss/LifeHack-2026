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
  route: "oklch(0.205 0.028 154.3)"
  route-foreground: "oklch(0.985 0.005 145)"
  signal: "oklch(0.9 0.205 124.2)"
  storefront-mist: "oklch(0.976 0.007 141.5)"
  handoff: "oklch(0.53 0.244 263.8)"
typography:
  sans:
    fontFamily: '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
  mono:
    fontFamily: '"Geist Mono Variable", ui-monospace, "SF Mono", "Cascadia Mono", monospace'
rounded:
  DEFAULT: "0.625rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
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

Woven should feel like a well-prepared expedition table. The MCP App uses a dark briefing surface with neatly grouped evidence cards. `/webmcp` uses a true-white expedition storefront with generous editorial type, original outdoor product cutouts, and one glossy “Behind the cart” activity surface. `/demo` preserves the original LifeHack `Woven Demo Host` conversation shell, lets the storefront visibly take browser control for safe WebMCP actions, then returns the selected result to that same chat inside a restrained, unbranded premium-laptop silhouette.

### Product context and register

- **Audience and primary job:** Singapore buyers who need a complete compatible cart, and judges or developers verifying the trust boundary.
- **Target market(s) and evidence:** Singapore is binding in `docs/PRD.md` and the `MissionSpec` market/currency contract.
- **Locale(s) and language policy:** English UI, SGD amounts, Singapore dates/times. Product names remain merchant-authored.
- **Usage scene:** Desktop or mobile, inside ChatGPT/Codex or the browser workspace, with moderate density and a time-sensitive pickup decision.
- **Register:** Hybrid. The landing hero is brand-led; `/demo`, `/webmcp`, identity, merchant, and install surfaces are product-led.
- **Memorable signature:** A dark woven briefing header in the MCP App; a light fictional trail storefront with one floating proof surface in `/webmcp`; and a visible chat-to-browser-to-chat handoff staged inside a generic laptop frame in `/demo`.
- **Restraint:** Identity, totals, source health, failure recovery, and merchant checkout use standard controls and direct language.
- **Anti-references:** No neon crypto dashboard, stacked glassmorphism, marketplace ad wall, or invented ChatGPT sidebar chrome. The familiar LifeHack host stays explicitly labeled `Woven Demo Host` and `Simulated`; glass is reserved for the single storefront activity surface.
- **Token ownership/runtime mapping:** This file mirrors the canonical Tailwind v4 variables in `web/styles.css`; it does not generate runtime tokens. `npm run check` is the drift gate.

## Colors

The interface is primarily black, white, and zinc so evidence and totals carry the hierarchy. The light storefront adds `storefront-mist` for quiet catalog fields, `route` for the solid authorization section, `signal` for the small woven spark, and `handoff` blue for simulated identity. Emerald is reserved for verified/healthy state, amber for recoverable connector degradation, and red for actionable failure. Focus uses the runtime ring token. The current product supports a light theme only.

## Typography

Geist Variable carries prose, controls, and product names. Geist Mono is limited to micro-labels, tool names, compact status badges, and technical identifiers. Totals use tabular-feeling short numeric strings and never rely on color alone. Uppercase is limited to short micro-labels.

## Layout

Buyer content caps at 1040px (`65rem`) with 24–40px responsive section padding. The storefront uses a 1440px editorial frame and reserves 31rem for its desktop activity overlay without changing document order. The guided demo uses one full chat surface within a solid charcoal-and-silver laptop stage; its browser takeover replaces the conversation area rather than competing beside it, and the frame carries no third-party mark. A persistent opaque control rail names the rehearsal, current reversible action, and five-beat position; the explicit activation receipt occupies the browser content area rather than adding a modal. At mobile the hardware silhouette disappears and the browser takeover fills the viewport without trapping focus. Cards move from one column to two or three without changing task order. Product rails scroll horizontally on narrow screens. Tables may scroll when comparison semantics would be lost by stacking. Loading, error, and source-status blocks reserve stable space where practical.

## Elevation & Depth

Hierarchy comes from tonal surfaces and 1px borders. A small shadow distinguishes the embedded buyer app; dialogs use a stronger shadow and a dimmed backdrop. Storefront commerce cards remain solid and use restrained hover depth. The desktop demo device is an opaque presentation prop, not a glass application layer. The only translucent product layer is the fixed “Behind the cart” activity surface, with one gloss pass after a real result. Sticky navigation remains above page content; the non-modal activity surface remains below modal dialogs.

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

The MCP App Choice Center and swap chooser use native `dialog`, explicit headings, close controls, and bounded scrolling. The storefront activity surface is a collapsible `aside`, never a dialog and never a focus trap. On desktop it floats to the right without blocking the reserved content column. On mobile it becomes a bottom sheet, starts collapsed while idle, opens for real activity, and remains manually collapsible. During the guided demo it disappears only after cart selection so the solid human-only handoff owns the final frame. Errors stay near the active workflow and offer retry or an explicit showcase-data action when appropriate.

### Iconography

Lucide React is canonical. Use outline icons at `size-3` through `size-7`; decorative icons are hidden from accessibility APIs. Text labels remain mandatory for trust, money, source, and navigation actions.

### Motion

Feedback uses 140–300ms transitions; staged demo narration is the sole long-form motion. The demo browser takeover and return-to-chat transition communicate ownership changes, while storefront depth movement stays restrained, product cutouts resolve progressively, and the activity surface gets one 720ms gloss pass only after a real result. The guided host holds evaluation for 1.2s, the testing/activation explanation for 4.5s, returned results for 1.4s, comparison for 2.4s, target selection for 1.3s, selected state for 1.2s, and the human boundary for 2.5s. These are presentation holds after truthful events, never simulated backend progress. Pause stops only presentation timers; Next beat is disabled during real network work. `prefers-reduced-motion` removes movement and transitions but retains the semantic holds so every state remains understandable.

### Content and data visualization

Voice is direct, exact, and non-promotional. Say “verified”, “research only”, “simulated”, and “payment occurs on the merchant site” precisely. Format all money as SGD. Never claim external purchase completion.

## Do's and Don'ts

- **Do:** Put platform, verification time, exact total, and checkout boundary beside the selected cart.
- **Do:** Preserve the same cart ordering and action vocabulary across MCP App and WebMCP surfaces.
- **Do:** While pending, show one indeterminate operation and keep later checks pending; reveal evidence and totals only from the returned `MissionView`.
- **Do:** Keep the storefront’s Shop, Complete kits, Field guide, and Cart navigation functional.
- **Don't:** Treat connector failure as an empty success or silently fall back to seeded products.
- **Don't:** Expose checkout URLs, signatures, tokens, or identity protocol state in visible data tables or model-readable results.
- **Don't:** Put identity, checkout, confirmation, or merchant continuation controls inside the translucent activity surface.
