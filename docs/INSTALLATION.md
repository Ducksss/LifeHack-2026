# Install and verify Woven

Woven can be run in three ways. Use the first path for the quickest real plugin
demo.

| Goal | Use | Requires public HTTPS? |
| --- | --- | --- |
| Install the local plugin in Codex | ChatGPT desktop app or Codex CLI | No |
| Use Woven inside a ChatGPT conversation | ChatGPT Developer Mode | Yes |
| Rehearse without a plugin host | Browser fallback at `/demo` | No |

> [!IMPORTANT]
> Woven is a local hackathon prototype. Its catalog, inventory, merchants, and
> Visa authorization are simulated. It never asks for payment credentials and
> cannot make a live charge.

## 1. Prepare the repository

### Requirements

- macOS with the ChatGPT desktop app for the recommended local workflow
- Node.js 22.5 or newer
- npm
- a ChatGPT account whose workspace permits plugins or Developer Mode

From the repository root:

```bash
node --version
npm ci
npm run check
```

Expected result:

- `node --version` reports `v22.5.0` or newer;
- `npm ci` exits successfully and creates `node_modules/`;
- `npm run check` ends with these key lines (durations and asset hashes vary):

  ```text
  # tests 9
  # pass 9
  # fail 0
  ✓ built in ...
  ```

The installable package is already defined by:

- `.codex-plugin/plugin.json` — Woven's identity and install-page copy;
- `.mcp.json` — the bundled stdio MCP server; and
- `.agents/plugins/marketplace.json` — the repository marketplace entry.

## 2. Recommended: install in Codex desktop

1. Open this repository as a Codex project in the ChatGPT desktop app.
2. Fully quit and reopen the app. The restart makes it reread the repository's
   marketplace file.
3. Open **Plugins**.
4. Select the **Woven Local** marketplace source.
5. Open **Woven**, then select the plus button to install it.
6. Start a **new Codex task** after installation.
7. Ask:

   > Build a Tokyo charging kit under S$150 for pickup today.

You do not need to run `npm start` for this path. The plugin host launches the
bundled stdio server itself and serves the widget on local port `8788`.

### Expected result

- **Woven** is shown as installed and enabled.
- The new task can access six Woven tools:
  `start_mission`, `build_carts`, `select_cart`,
  `create_checkout_preview`, `confirm_purchase`, and `get_order_status`.
- The prompt opens Woven's interactive widget with three complete carts:
  ByteRoute at S$133, Volt & Go at S$143, and City Mobile at S$102.
- ByteRoute is the **Best match** and City Mobile is the **Best value**.
- Selecting a cart changes no inventory and makes no purchase.
- **Review checkout** creates an exact ten-minute preview.
- Only the widget's separate **Confirm S$133.00** action can produce the clearly
  labeled simulated Visa result and pickup receipt.

### Codex CLI alternative

The CLI can register the same repository marketplace. Replace the example path
with the absolute path to your clone:

```bash
codex plugin marketplace add /absolute/path/to/LifeHack-2026
codex plugin marketplace list
codex plugin add woven@woven-local --json
codex plugin list --json
codex
```

The two JSON commands should report `woven-local` and an installed, enabled
`woven@woven-local`. Start a new session after installation before using it.
You can also install through `/plugins` by choosing **Woven Local** and
**Woven**.

Expected result: `codex plugin marketplace list` includes `woven-local` and the
absolute repository root, while `codex plugin list` reports Woven as installed
and enabled.

Plugins are not available in the Codex IDE extension. Use ChatGPT desktop or
Codex CLI.

## 3. Connect Woven to ChatGPT

ChatGPT cannot connect to `localhost`. The verified public deployment is:

- landing page: <https://visa-woven.vercel.app>
- buyer demo: <https://visa-woven.vercel.app/demo>
- merchant desk: <https://visa-woven.vercel.app/merchant>
- MCP endpoint: <https://visa-woven.vercel.app/mcp>
- health check: <https://visa-woven.vercel.app/healthz>

Vercel runs the repository as one Express function with
`BASE_URL=https://visa-woven.vercel.app`, `PAYMENT_MODE=simulated`, and
`WOVEN_DB=/tmp/woven.db`. The database is intentionally temporary demo state:
it may reset after a cold start or redeployment and must not be described as
durable inventory or order storage.

### Start and verify the server

For a separate self-hosted connection, set `BASE_URL` to the exact public origin
that forwards to local port `8787`:

```bash
BASE_URL=https://your-public-origin.example npm start
```

Expected startup line:

```text
Woven ready: https://your-public-origin.example/mcp · https://your-public-origin.example/demo · https://your-public-origin.example/merchant
```

Verify the deployed health endpoint:

```bash
curl https://visa-woven.vercel.app/healthz
```

Expected JSON:

```json
{"ok":true,"service":"woven","version":"0.1.2","paymentMode":"simulated"}
```

### Create the ChatGPT connection

1. In ChatGPT, open **Settings → Security and login** and enable
   **Developer mode**.
2. Open **Plugins** and select the plus button.
3. Create a plugin named **Woven** with this MCP endpoint:

   ```text
   https://visa-woven.vercel.app/mcp
   ```

4. Review the discovered tools and create the connection.
5. Under **Personal plugins**, open **Woven** and select the plus button to
   install it.
6. Start a new ChatGPT Work conversation, type `@`, select **Woven**, and send
   the canonical prompt above.

Expected result: ChatGPT discovers the same six tools and renders the same
three-cart widget and confirmation flow described in the Codex result. If the
server's tool metadata or UI changes, refresh the plugin connection before
retesting.

## 4. Browser-only rehearsal

This verifies the product without installing a plugin:

```bash
npm start
```

Expected output:

```text
Woven ready: http://localhost:8787/mcp · http://localhost:8787/demo · http://localhost:8787/merchant
```

Open:

- buyer fallback: <http://localhost:8787/demo>
- merchant desk: <http://localhost:8787/merchant>
- health check: <http://localhost:8787/healthz>

The browser fallback uses the same store, domain rules, and payment simulator as
the MCP App. It is a rehearsal transport, not the primary product.

## Troubleshooting

| Symptom | Fix | Expected recovery |
| --- | --- | --- |
| Woven Local is missing | Confirm `.agents/plugins/marketplace.json` exists, reopen this repository, then fully restart ChatGPT desktop | **Woven Local** appears under Plugins |
| Woven is installed but tools are missing | Start a new task/session; plugin changes are not injected into an already-running session | Six Woven tools become available |
| The bundled MCP server cannot launch | Run `npm ci`, remove and reinstall Woven, then start a new task | The bundled MCP server starts and exposes six tools |
| `codex --version` fails with a native-binary `ENOENT` error | Use ChatGPT desktop, or repair the CLI with OpenAI's official installer shown below | `codex --version` prints a version instead of an error |
| Port `8788` is already in use | Stop the other Woven/plugin process, then start a new task | The widget asset server binds to `8788` |
| `start_mission` succeeds but the widget area is blank | Reinstall Woven 0.1.2 or newer, then start a new task | Three interactive cart choices appear above the model response |
| ChatGPT cannot connect | Verify public HTTPS, include the `/mcp` path, set `BASE_URL` to the same origin, and retry | Tool discovery succeeds |
| The widget is stale after code changes | Run `npm run check`, reinstall the local plugin or refresh the ChatGPT connection, then start a new conversation | Updated tools and UI load |
| Developer Mode is absent | Check the ChatGPT account/workspace policy | The toggle appears after an admin permits it |

Official Codex CLI repair/install command for macOS and Linux:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
codex --version
```

On macOS, the ChatGPT desktop app also includes a working CLI that can be used
without downloading another copy:

```bash
/Applications/ChatGPT.app/Contents/Resources/codex --version
```

For low-level MCP debugging, run
`npx @modelcontextprotocol/inspector@latest` and connect it to Woven before
testing through ChatGPT.

## Official references

- [Package a local plugin](https://developers.openai.com/plugins/build/plugins)
- [Connect and test a plugin in ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt)
- [OpenAI plugin quickstart](https://developers.openai.com/plugins/quickstart)
- [Use plugins in ChatGPT and Codex](https://learn.chatgpt.com/docs/plugins)
- [Install Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
