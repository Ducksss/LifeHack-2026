<a id="readme-top"></a>

<div align="center">
  <img src="docs/assets/brand/missioncart-mark.svg" alt="MissionCart logo" width="112" height="112">

  <h1>MissionCart</h1>

  <p><strong>One mission. One compatible cart. One explicit confirmation.</strong></p>

  <p>
    An MCP commerce app for ChatGPT and Codex that turns a constrained shopping
    request into a complete, in-stock, one-merchant cart—then asks the user to
    confirm the exact mandate before a simulated Visa authorization.
  </p>

  <p>
    <a href="https://github.com/Ducksss/LifeHack-2026/actions/workflows/ci.yml"><img src="https://github.com/Ducksss/LifeHack-2026/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
    <img src="https://img.shields.io/badge/Node.js-%E2%89%A522.5-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22.5 or newer">
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9">
    <img src="https://img.shields.io/badge/MCP-App-c6f65b" alt="MCP App">
    <img src="https://img.shields.io/badge/payment-simulated-1d3fd4" alt="Simulated payment">
  </p>

  <p>
    <a href="#getting-started"><strong>Run the demo</strong></a>
    ·
    <a href="docs/PRD.md">Product requirements</a>
    ·
    <a href="docs/architecture.md">Technical architecture</a>
    ·
    <a href="docs/DEVPOST_SUBMISSION.md">Devpost submission kit</a>
    ·
    <a href="https://github.com/Ducksss/LifeHack-2026/issues">Report an issue</a>
  </p>
</div>

![MissionCart — one mission, one ready-to-go kit](docs/assets/devpost/cover.png)

> [!IMPORTANT]
> MissionCart is a hackathon prototype. Merchants, inventory, prices, and Visa
> authorization responses are seeded or simulated. It collects no card
> credentials and cannot make a live charge.

<details>
  <summary>Table of contents</summary>
  <ol>
    <li><a href="#about-the-project">About the project</a></li>
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#product-gallery">Product gallery</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#built-with">Built with</a></li>
    <li><a href="#getting-started">Getting started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#trust-and-safety">Trust and safety</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About the project

Shopping agents can suggest products, but a list of links is not a ready answer
when the user has a real mission: a hard budget, multiple devices, a departure
tonight, and pickup before the shops close.

MissionCart keeps the experience inside an existing AI workflow. The user asks
ChatGPT or Codex once; MissionCart returns complete carts from a single pickup
location, explains why every item works together, rechecks the commercial terms,
and requires a separate human click before authorization.

The canonical mission is deliberately concrete:

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and
> AirPods under S$150, with pickup today.

### Why it is different

| Typical product search | MissionCart |
| --- | --- |
| Ranks individual items | Ranks complete, compatible carts |
| Leaves stock and pickup implicit | Uses current demo stock and pickup timing |
| May mix merchants | Returns one pickup location per cart |
| Makes the user reconstruct compatibility | Shows a proof for every component |
| Blurs recommendation and purchase | Requires an exact, expiring confirmation |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## How it works

1. **Describe the mission.** The host calls `start_mission` with the user's
   budget, destination, devices, and pickup constraint.
2. **Build complete carts.** MissionCart rejects incompatible or unavailable
   offers, stays under budget, and ranks one-merchant options.
3. **Show the proof.** The MCP App widget explains charger wattage, voltage,
   cable connectors, adapter fit, live demo stock, total, and pickup time.
4. **Review exact terms.** The server rechecks price and stock and creates a
   ten-minute mandate bound to the merchant, cart version, and amount.
5. **Confirm once.** A private nonce, mandate hash, and idempotency key are
   verified before the simulated authorization and merchant order.

The AI recommends. The user chooses. MissionCart binds the exact terms.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Product gallery

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/buyer-overview.png" alt="MissionCart buyer experience showing the mission and three complete carts"></td>
    <td width="50%"><img src="docs/assets/screenshots/checkout-confirmation.png" alt="MissionCart exact checkout mandate and explicit confirm button"></td>
  </tr>
  <tr>
    <td><strong>Complete carts, not loose links.</strong><br>Three ranked options satisfy the whole mission.</td>
    <td><strong>A visible authorization boundary.</strong><br>The exact merchant, pickup, items, and total are bound before confirmation.</td>
  </tr>
  <tr>
    <td><img src="docs/assets/screenshots/order-success.png" alt="MissionCart simulated Visa result and pickup receipt"></td>
    <td><img src="docs/assets/screenshots/merchant-dashboard.png" alt="MissionCart merchant operations dashboard"></td>
  </tr>
  <tr>
    <td><strong>A pickup-ready result.</strong><br>The user receives a simulated authorization result and receipt.</td>
    <td><strong>A controllable live demo.</strong><br>Inventory, pricing, declines, order failures, and the audit trail are visible on stage.</td>
  </tr>
</table>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

![MissionCart system architecture](docs/assets/devpost/architecture.png)

MissionCart is one deployable Node.js service. The MCP transports, browser
fallback, and merchant desk all route through the same domain and persistence
functions. The real payment integration boundary is isolated in
`src/payment.ts`; the current adapter intentionally fails closed unless
`PAYMENT_MODE=simulated`.

Detailed tool contracts, state transitions, cart rules, and trust boundaries
are documented in [the architecture guide](docs/architecture.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built with

- [TypeScript](https://www.typescriptlang.org/) and [Node.js](https://nodejs.org/)
- [React](https://react.dev/) and [Vite](https://vite.dev/)
- [Model Context Protocol SDK](https://modelcontextprotocol.io/)
- [MCP Apps](https://github.com/modelcontextprotocol/ext-apps)
- [Express](https://expressjs.com/)
- Node's built-in [SQLite](https://nodejs.org/api/sqlite.html)
- [Zod](https://zod.dev/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting started

### Prerequisites

- Node.js 22.5 or newer
- npm

### Installation

```bash
git clone https://github.com/Ducksss/LifeHack-2026.git
cd LifeHack-2026
npm install
npm run check
npm start
```

Open the local surfaces:

| Surface | URL |
| --- | --- |
| Buyer fallback | <http://localhost:8787/demo> |
| Merchant desk | <http://localhost:8787/merchant> |
| MCP endpoint | <http://localhost:8787/mcp> |
| Health check | <http://localhost:8787/healthz> |

### Connect the ChatGPT app

ChatGPT requires a public HTTPS origin; it cannot reach localhost.

1. Deploy the service or expose port `8787` through an HTTPS tunnel.
2. Start MissionCart with `BASE_URL=https://your-public-origin.example` so the
   sandboxed widget receives the correct asset origin and CSP.
3. Enable Developer Mode in ChatGPT and create a personal app using
   `https://your-public-origin.example/mcp`.
4. Start a new chat, select MissionCart, and use the canonical mission.

Current OpenAI references: [plugin quickstart][openai-quickstart], [MCP server
guide][openai-mcp], [ChatGPT UI guide][openai-ui], and [connection
guide][openai-connect].

### Connect the Codex plugin

This repository is already a valid local Codex plugin package. Its `.mcp.json`
launches the server over stdio and serves widget assets on port `8788` to avoid
colliding with the standalone HTTP demo. Build the project, then install or load
the repository directory through the Codex plugin workflow.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### Happy-path demo

1. Open `/demo` and show the canonical mission and three ranked carts.
2. Select a kit and inspect its compatibility proof.
3. Click **Review checkout** to force a stock and price recheck.
4. Call out the exact, expiring mandate and click **Confirm S$133.00**.
5. Show the simulated Visa result and pickup receipt.

### Trust/failure demo

Use `/merchant` to select a scenario, then replay checkout:

- **Stockout** or **Price change** invalidates an old preview.
- **Auth decline** creates no merchant order.
- **Order failure** enters reversal after simulated authorization.
- **Reset demo data** restores stock and clears the local run.

### Catalog updates

The merchant desk exports and imports a deliberately small CSV contract:

```csv
offer_id,price_sgd,stock
byteroute-funan-br-gan65,69.00,4
```

Imports update only known offers and reject malformed prices, negative values,
and fractional stock. A demo upload cannot silently create incompatible SKUs.

### Commands

```bash
npm run dev          # Vite UI development server
npm run dev:server   # API/MCP server with restart-on-change
npm run build        # production bundle + TypeScript validation
npm test             # domain, security, idempotency, failure, and CSV checks
npm run check        # full test and build gate
npm run mcp          # stdio MCP transport used by the Codex plugin
```

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP server port |
| `BASE_URL` | `http://localhost:8787` | Public widget asset/CSP origin |
| `MISSIONCART_DB` | `./data/missioncart.db` | SQLite demo state |
| `PAYMENT_MODE` | `simulated` | Guardrail; every other value fails closed |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Trust and safety

- No PAN, CVV, wallet token, or payment credential is accepted or stored.
- The one-time confirmation nonce stays in MCP result `_meta`, private to the
  widget rather than visible to the model.
- Every preview is bound to the exact cart version, merchant, amount, and expiry.
- Price and stock are revalidated inside the same SQLite write transaction as
  order creation and inventory decrement.
- Duplicate confirmation returns the original result through idempotency.
- Simulated rail and merchant failures are visibly labeled and auditable.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing

```bash
npm run check
npm audit
```

The automated suite covers cart completeness and ranking, mandate integrity,
stale price/stock rejection, one-time nonce consumption, idempotent confirmation,
authorization decline, reversal, inventory updates, and CSV validation. CI runs
the full test and production-build gate on every push and pull request.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [x] Complete one-merchant cart construction and compatibility proof
- [x] ChatGPT/Codex MCP App widget plus HTTP rehearsal fallback
- [x] Exact, expiring, one-time checkout mandate
- [x] Merchant inventory, scenario controls, CSV update, and audit trail
- [x] Simulated authorization, decline, order failure, and reversal paths
- [x] End-to-end tests and submission-ready gallery
- [ ] Public HTTPS deployment and shareable ChatGPT app connection
- [ ] Real merchant inventory/fulfilment connectors
- [ ] Exact Visa sandbox product adapter after credentials and product approval
- [ ] Generalized missions beyond the Tokyo charging-kit vertical

See the [open issues](https://github.com/Ducksss/LifeHack-2026/issues) for scoped
work.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

This is currently a private hackathon repository. Collaborators should open an
issue describing the user-visible change, create a focused branch, run
`npm run check`, and submit a pull request with screenshots for UI changes.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

No open-source license has been granted. All rights are reserved by the project
contributors unless a license is added later.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Project repository: [Ducksss/LifeHack-2026](https://github.com/Ducksss/LifeHack-2026)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

- README organization was adapted to this project from the
  [Best README Template][best-readme-template].
- Devpost story and gallery sequencing were informed by
  [AquaWise's Devpost submission][aquawise-devpost].
- Product documentation: [PRD](docs/PRD.md), [architecture](docs/architecture.md),
  [Devpost kit](docs/DEVPOST_SUBMISSION.md), and [brand guide](docs/BRAND_GUIDE.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[aquawise-devpost]: https://devpost.com/software/aquawise
[best-readme-template]: https://github.com/othneildrew/Best-README-Template
[openai-connect]: https://developers.openai.com/plugins/deploy/connect-chatgpt
[openai-mcp]: https://developers.openai.com/plugins/build/mcp-server
[openai-quickstart]: https://developers.openai.com/plugins/quickstart
[openai-ui]: https://developers.openai.com/plugins/build/chatgpt-ui
