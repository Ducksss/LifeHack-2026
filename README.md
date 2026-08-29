# MissionCart

MissionCart turns a constrained shopping request into a compatible, in-stock, one-merchant cart and requires an explicit user click before a simulated Visa authorization.

The primary experience is a real MCP App widget for ChatGPT/Codex. `/demo` is the same UI with a browser transport for rehearsals, and `/merchant` controls inventory and failure scenarios.

> Prototype boundary: all merchants, stock, prices, and Visa authorization responses are seeded or simulated. No card credentials are collected and no live charge can occur.

## Run it

Requires Node.js 22.5 or newer.

```bash
npm install
npm run check
npm start
```

Open:

- Buyer fallback: <http://localhost:8787/demo>
- Merchant desk: <http://localhost:8787/merchant>
- MCP endpoint: <http://localhost:8787/mcp>
- Health check: <http://localhost:8787/healthz>

The canonical demo prompt is:

> I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and AirPods under S$150, with pickup today.

## Connect the actual ChatGPT plugin

ChatGPT needs a public HTTPS URL; localhost is intentionally not reachable from ChatGPT.

1. Expose port `8787` with your preferred HTTPS tunnel or deploy this service.
2. Set `BASE_URL=https://your-public-origin.example` and restart MissionCart. This lets the sandboxed widget load its compiled assets from the correct origin.
3. Enable Developer Mode in ChatGPT and create a personal plugin using `https://your-public-origin.example/mcp`.
4. Start a new chat, select MissionCart, and use the canonical prompt above.

See OpenAI’s current [plugin quickstart](https://developers.openai.com/plugins/quickstart), [MCP server guide](https://developers.openai.com/plugins/build/mcp-server), [ChatGPT UI guide](https://developers.openai.com/plugins/build/chatgpt-ui), and [connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

For Codex, this directory is already a valid local plugin package. Its `.mcp.json` launches the same server over stdio and serves widget assets on local port `8788` to avoid colliding with the standalone HTTP demo. Build it first, then install or load the directory through your Codex plugin workflow.

## Demo flow

1. ChatGPT calls `start_mission`; the widget renders three ranked carts.
2. Select a kit and inspect the compatibility proof.
3. Click **Review checkout**. The backend rechecks stock and price, then creates a ten-minute mandate.
4. Click **Confirm S$…**. The private one-time nonce, mandate hash, and idempotency key are verified before the simulated authorization.
5. Show the confirmed pickup receipt—or select a failure scenario in `/merchant` and replay the last two steps.

Recommended failure sequence:

- `Stockout` or `Price change`: an old checkout preview is rejected and must be rebuilt.
- `Auth decline`: no merchant order is created.
- `Order failure`: authorization succeeds but the simulated merchant outcome enters reversal.
- `Reset demo data`: restores seeded inventory and clears local missions/orders.

## Catalog updates

The merchant desk exports and imports update CSVs with this contract:

```csv
offer_id,price_sgd,stock
byteroute-funan-br-gan65,69.00,4
```

Imports only update known offers and reject negative, fractional-stock, or malformed values. This avoids a demo upload silently creating incompatible products.

## Commands

```bash
npm run dev          # Vite UI development server
npm run dev:server   # API/MCP server with restart-on-change
npm run build        # production widget bundle + TypeScript validation
npm test             # domain, security, idempotency, failure, and CSV checks
npm run check        # full test and build gate
npm run mcp          # stdio MCP transport used by the Codex plugin
```

## Configuration

Copy `.env.example` values into your environment as needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP server port |
| `BASE_URL` | `http://localhost:8787` | Public origin embedded in widget CSP/assets |
| `MISSIONCART_DB` | `./data/missioncart.db` | SQLite demo state |
| `PAYMENT_MODE` | `simulated` | Guardrail; other values fail closed |

Architecture and security details are in [docs/architecture.md](docs/architecture.md). The implemented product contract is in [docs/PRD.md](docs/PRD.md).
