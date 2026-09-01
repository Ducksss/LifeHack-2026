import type { MissionInput, MissionView } from "../src/domain";

type JsonSchema = Record<string, unknown> & { additionalProperties: false };

export interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
}

export interface WebMcpContext {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
}

export interface WebMcpAdapter {
  getView: () => MissionView | null;
  startMission: (input: MissionInput, signal: AbortSignal) => Promise<MissionView>;
  invoke: (
    name: "select_cart" | "swap_cart_item" | "build_carts",
    arguments_: Record<string, unknown>,
    signal: AbortSignal,
  ) => Promise<MissionView>;
  compare: (options: { priority?: "balanced" | "value" | "speed" | "weather"; area?: "Any" | "Central" | "East" | "North" }) => void;
  verifyReceipt: (receiptNumber: string, signature: string, signal: AbortSignal) => Promise<unknown>;
}

export const WEBMCP_TOOL_NAMES = [
  "start_mission",
  "get_mission",
  "compare_carts",
  "select_cart",
  "swap_cart_item",
  "refresh_carts",
  "verify_receipt",
] as const;

export const WEBMCP_COMPARE_EVENT = "woven:webmcp:compare";

const emptySchema: JsonSchema = { type: "object", properties: {}, additionalProperties: false };

function currentView(adapter: WebMcpAdapter): MissionView {
  const view = adapter.getView();
  if (!view) throw new Error("Woven is still loading the mission. Retry in a moment.");
  return view;
}

function result(message: string, view: MissionView, extra: Record<string, unknown> = {}) {
  return { message, view, ...extra };
}

export function createWebMcpTools(adapter: WebMcpAdapter): WebMcpTool[] {
  return [
    {
      name: "start_mission",
      title: "Start a Woven mission",
      description: "Create a complete, compatible shopping mission on the open Woven page. This changes the visible mission but cannot verify identity, create a checkout mandate, or confirm a purchase.",
      inputSchema: {
        type: "object",
        properties: {
          request: { type: "string", minLength: 1, maxLength: 1_000, description: "What the person needs, including hard constraints." },
          budgetCents: { type: "integer", minimum: 1_000, maximum: 100_000, description: "Optional maximum budget in SGD cents." },
          campers: { type: "integer", minimum: 1, maximum: 6, description: "Optional camper count for camping missions." },
          pickupDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Optional pickup date in YYYY-MM-DD format." },
          sourceMode: { type: "string", enum: ["demo", "live"], description: "Use live storefronts or the seeded demo catalog." },
        },
        required: ["request"],
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const view = await adapter.startMission(input as unknown as MissionInput, signal);
        return result(`Created mission ${view.mission.id} with ${view.carts.length} complete cart choices.`, view);
      },
    },
    {
      name: "get_mission",
      title: "Inspect the current mission",
      description: "Read the current Woven mission, carts, evidence, selection, identity status, and order status from the same page the person is viewing.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const view = currentView(adapter);
        return result(`Mission ${view.mission.id} currently has ${view.carts.length} cart choices.`, view);
      },
    },
    {
      name: "compare_carts",
      title: "Compare carts on the page",
      description: "Open Woven's visible Choice Center and optionally rerank complete carts by priority or pickup area. This changes only the shared page view.",
      inputSchema: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["balanced", "value", "speed", "weather"] },
          area: { type: "string", enum: ["Any", "Central", "East", "North"] },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input) => {
        const view = currentView(adapter);
        adapter.compare(input as Parameters<WebMcpAdapter["compare"]>[0]);
        return result("Opened the Choice Center on the shared page.", view, { applied: input });
      },
    },
    {
      name: "select_cart",
      title: "Select a cart",
      description: "Select one complete cart in the current Woven mission and update the shared page. Selection is not identity verification or purchase authorization.",
      inputSchema: {
        type: "object",
        properties: { cartId: { type: "string", minLength: 5, maxLength: 80 } },
        required: ["cartId"],
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const current = currentView(adapter);
        const cartId = String(input.cartId || "");
        if (!current.carts.some((cart) => cart.id === cartId)) throw new Error("Choose a cartId from the current mission.");
        const view = await adapter.invoke("select_cart", { missionId: current.mission.id, cartId }, signal);
        return result(`Selected cart ${cartId}. The person must still complete identity and approve exact checkout terms.`, view);
      },
    },
    {
      name: "swap_cart_item",
      title: "Apply an approved alternative",
      description: "Replace one item in the selected cart with a current merchant-approved compatible alternative and update the shared page. This cannot add arbitrary products.",
      inputSchema: {
        type: "object",
        properties: { offerId: { type: "string", minLength: 5, maxLength: 120 } },
        required: ["offerId"],
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const current = currentView(adapter);
        const cart = current.carts.find(({ id }) => id === current.selectedCartId);
        if (!cart) throw new Error("Select a cart before applying an alternative.");
        const offerId = String(input.offerId || "");
        if (!cart.alternatives.some((alternative) => alternative.offerId === offerId)) {
          throw new Error("Choose an offerId from the selected cart's approved alternatives.");
        }
        const view = await adapter.invoke("swap_cart_item", { missionId: current.mission.id, cartId: cart.id, offerId }, signal);
        return result(`Applied approved alternative ${offerId} to cart ${cart.id}.`, view);
      },
    },
    {
      name: "refresh_carts",
      title: "Refresh price and stock",
      description: "Re-read the current mission after Woven revalidates its server-owned cart state. This does not create checkout terms or authorize a purchase.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (_input, { signal }) => {
        const current = currentView(adapter);
        const view = await adapter.invoke("build_carts", { missionId: current.mission.id }, signal);
        return result(`Refreshed ${view.carts.length} cart choices for mission ${view.mission.id}.`, view);
      },
    },
    {
      name: "verify_receipt",
      title: "Verify the current receipt",
      description: "Verify the server signature on the current mission's simulated receipt. This reads an existing result and cannot create an order.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async (_input, { signal }) => {
        const view = currentView(adapter);
        const receipt = view.order?.receipt;
        if (!receipt) throw new Error("The current mission does not have a receipt to verify.");
        const verification = await adapter.verifyReceipt(receipt.receiptNumber, receipt.signature, signal);
        return { message: `Verified receipt ${receipt.receiptNumber}.`, verification };
      },
    },
  ];
}

export async function registerWebMcpTools(context: WebMcpContext, adapter: WebMcpAdapter, signal: AbortSignal) {
  for (const tool of createWebMcpTools(adapter)) await context.registerTool(tool, { signal });
}
