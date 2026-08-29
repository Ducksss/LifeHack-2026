import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Response } from "express";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  CANONICAL_REQUEST,
  DomainError,
  money,
  type MissionView,
  type Scenario,
} from "./domain.js";
import { MissionCartStore } from "./store.js";

const VERSION = "0.1.0";
const WIDGET_URI = "ui://missioncart/mission-v1.html";
const port = Number(process.env.PORT || 8787);
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, "");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "dist", "web");
const store = new MissionCartStore();

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
};

function widgetHtml(): string {
  const filename = path.join(webRoot, "widget.html");
  if (!existsSync(filename)) {
    throw new Error(`Widget not built at ${filename}. Run npm run build first.`);
  }
  return readFileSync(filename, "utf8")
    .replaceAll('="/assets/', `="${baseUrl}/assets/`)
    .replaceAll("='/assets/", `='${baseUrl}/assets/`);
}

function viewResult(view: MissionView, text: string, meta?: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text }],
    structuredContent: { view },
    ...(meta ? { _meta: meta } : {}),
  };
}

function errorResult(error: unknown): ToolResult {
  const safe = error instanceof DomainError
    ? error
    : error instanceof z.ZodError
      ? new DomainError("INVALID_INPUT", error.issues[0]?.message || "Invalid request.")
      : new DomainError("INTERNAL_ERROR", "MissionCart could not complete that action. Try again.", true);
  if (!(error instanceof DomainError) && !(error instanceof z.ZodError)) console.error(error);
  return {
    isError: true,
    content: [{ type: "text", text: `${safe.code}: ${safe.message}` }],
    structuredContent: {
      error: { code: safe.code, message: safe.message, retryable: safe.retryable },
    },
  };
}

function attempt(work: () => ToolResult): ToolResult {
  try {
    return work();
  } catch (error) {
    return errorResult(error);
  }
}

function createMcpServer(): McpServer {
  const server = new McpServer({ name: "missioncart", version: VERSION });

  registerAppTool(
    server,
    "start_mission",
    {
      title: "Build a MissionCart",
      description:
        "Use when a user asks to shop for a complete, compatible kit under constraints such as devices, destination, budget, availability, or pickup time. Returns ranked one-merchant carts in an interactive confirmation widget.",
      inputSchema: {
        request: z.string().min(1).max(1_000).describe("The user's complete shopping mission in natural language."),
        budgetCents: z.number().int().min(1_000).max(100_000).optional(),
        destination: z.string().min(2).max(100).optional(),
        pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Building compatible carts",
        "openai/toolInvocation/invoked": "Mission carts ready",
      },
    },
    async (input) =>
      attempt(() => {
        const view = store.startMission(input);
        const summary = view.carts.length
          ? `Built ${view.carts.length} compatible carts under ${money(view.mission.budgetCents)}. The top match is ${view.carts[0]!.merchantName} at ${money(view.carts[0]!.totalCents)}.`
          : "No complete cart currently satisfies every hard constraint.";
        return viewResult(view, summary);
      }),
  );

  registerAppTool(
    server,
    "build_carts",
    {
      title: "Refresh mission carts",
      description: "Refresh ranked carts for an existing MissionCart mission after price or inventory changes.",
      inputSchema: { missionId: z.string().min(5).max(80) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { resourceUri: WIDGET_URI }, "openai/outputTemplate": WIDGET_URI, "openai/widgetAccessible": true },
    },
    async ({ missionId }) =>
      attempt(() => {
        const view = store.view(missionId);
        return viewResult(view, `Refreshed ${view.carts.length} compatible carts.`);
      }),
  );

  registerAppTool(
    server,
    "select_cart",
    {
      title: "Select cart",
      description: "Select one ranked cart in the MissionCart widget. App-only.",
      inputSchema: { missionId: z.string().min(5).max(80), cartId: z.string().min(5).max(80) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ missionId, cartId }) =>
      attempt(() => viewResult(store.selectCart(missionId, cartId), "Cart selected.")),
  );

  registerAppTool(
    server,
    "create_checkout_preview",
    {
      title: "Review checkout",
      description: "Revalidate a selected cart and create an expiring checkout mandate. App-only.",
      inputSchema: { missionId: z.string().min(5).max(80), cartId: z.string().min(5).max(80) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ missionId, cartId }) =>
      attempt(() => {
        const { view, nonce } = store.checkoutPreview(missionId, cartId);
        return viewResult(
          view,
          "Checkout preview created. No purchase has occurred; the user must explicitly confirm the exact merchant and amount.",
          { confirmationNonce: nonce },
        );
      }),
  );

  registerAppTool(
    server,
    "confirm_purchase",
    {
      title: "Confirm simulated Visa purchase",
      description: "Execute an explicitly confirmed MissionCart checkout using the private one-time confirmation token. App-only.",
      inputSchema: {
        previewId: z.string().min(5).max(80),
        mandateHash: z.string().length(64),
        confirmationNonce: z.string().uuid(),
        idempotencyKey: z.string().min(8).max(128),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input) =>
      attempt(() => {
        const { view, order } = store.confirmPurchase(input);
        const text = order.status === "confirmed"
          ? `Simulated Visa authorization approved. Order ${order.id} is confirmed for ${money(order.amountCents)}.`
          : order.status === "authorization_declined"
            ? "Simulated Visa authorization was declined. No order was placed."
            : "The merchant order failed after simulated authorization; reversal is in progress.";
        return viewResult(view, text);
      }),
  );

  registerAppTool(
    server,
    "get_order_status",
    {
      title: "Get MissionCart order status",
      description: "Check the latest checkout or order status for an existing MissionCart mission.",
      inputSchema: { missionId: z.string().min(5).max(80) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ["model"] } },
    },
    async ({ missionId }) =>
      attempt(() => {
        const view = store.view(missionId);
        return viewResult(view, view.order ? `Latest order status: ${view.order.status}.` : "No order exists for this mission.");
      }),
  );

  registerAppResource(
    server,
    "MissionCart checkout widget",
    WIDGET_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Interactive ranked carts and explicit checkout confirmation.",
      _meta: { ui: { csp: { connectDomains: [baseUrl], resourceDomains: [baseUrl] } } },
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml(),
          _meta: {
            ui: {
              prefersBorder: false,
              csp: { connectDomains: [baseUrl], resourceDomains: [baseUrl] },
            },
            "openai/widgetDescription": "MissionCart ranks compatible pickup-ready kits and keeps checkout confirmation inside the widget.",
            "openai/widgetPrefersBorder": false,
          },
        },
      ],
    }),
  );

  return server;
}

const app = express();
const missionInputSchema = z.object({
  request: z.string().min(1).max(1_000).optional(),
  budgetCents: z.number().int().min(1_000).max(100_000).optional(),
  destination: z.string().min(2).max(100).optional(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
const cartActionSchema = z.object({
  missionId: z.string().min(5).max(80),
  cartId: z.string().min(5).max(80),
});
const confirmSchema = z.object({
  previewId: z.string().min(5).max(80),
  mandateHash: z.string().length(64),
  confirmationNonce: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(128),
});
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "256kb" }));
app.use("/assets", express.static(path.join(webRoot, "assets"), { immutable: true, maxAge: "1y" }));

app.get("/healthz", (_req, res) => res.json({ ok: true, service: "missioncart", version: VERSION, paymentMode: "simulated" }));
app.get("/favicon.ico", (_req, res) => res.sendStatus(204));
app.get("/", (_req, res) => res.redirect("/demo"));
app.get("/demo", (_req, res) => res.sendFile(path.join(webRoot, "widget.html")));
app.get("/merchant", (_req, res) => res.sendFile(path.join(webRoot, "merchant.html")));

app.post("/api/demo/start", (req, res) => api(res, () => {
  const input = missionInputSchema.parse(req.body);
  return { view: store.startMission({ ...input, request: input.request || CANONICAL_REQUEST }) };
}));
app.get("/api/missions/:missionId", (req, res) => api(res, () => ({ view: store.view(req.params.missionId) })));
app.post("/api/tools/select_cart", (req, res) => api(res, () => {
  const input = cartActionSchema.parse(req.body);
  return { view: store.selectCart(input.missionId, input.cartId) };
}));
app.post("/api/tools/create_checkout_preview", (req, res) =>
  api(res, () => {
    const input = cartActionSchema.parse(req.body);
    const result = store.checkoutPreview(input.missionId, input.cartId);
    return { view: result.view, _meta: { confirmationNonce: result.nonce } };
  }),
);
app.post("/api/tools/confirm_purchase", (req, res) => api(res, () => store.confirmPurchase(confirmSchema.parse(req.body))));
app.get("/api/merchant/dashboard", (_req, res) => api(res, () => store.dashboard()));
app.post("/api/merchant/scenario", (req, res) =>
  api(res, () => {
    const scenario = z.enum(["normal", "stockout", "price-change", "auth-decline", "order-fail"]).parse(req.body.scenario) as Scenario;
    store.setScenario(scenario);
    return store.dashboard();
  }),
);
app.post("/api/merchant/catalog", (req, res) => api(res, () => store.updateCatalogCsv(z.string().max(200_000).parse(req.body.csv))));
app.get("/api/merchant/catalog.csv", (_req, res) => {
  res.type("text/csv").attachment("missioncart-catalog.csv").send(store.catalogCsv());
});
app.post("/api/merchant/reset", (_req, res) => api(res, () => {
  store.reset();
  return store.dashboard();
}));

app.all("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error", error);
    if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
});

function api(res: Response, work: () => unknown): void {
  try {
    res.json(work());
  } catch (error) {
    const status = error instanceof DomainError ? 400 : error instanceof z.ZodError ? 422 : 500;
    const result = errorResult(error);
    res.status(status).json(result.structuredContent);
  }
}

const httpServer = app.listen(port, () => {
  console.error(`MissionCart ready: ${baseUrl}/mcp · ${baseUrl}/demo · ${baseUrl}/merchant`);
});

if (process.argv.includes("--stdio")) {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    httpServer.close(() => {
      store.close();
      process.exit(0);
    });
  });
}
