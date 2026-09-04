import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialToolResult, inlineWidgetAssets, WIDGET_REFRESH_META, WIDGET_URI } from "../src/widget.js";

test("guided browser demo and hosted MCP App use explicit entry points", () => {
  const demoHtml = readFileSync("web/demo.html", "utf8");
  const demo = readFileSync("web/demo.tsx", "utf8");
  const storefront = readFileSync("web/storefront.tsx", "utf8");
  assert.match(demoHtml, /src="\/demo\.tsx"/);
  assert.match(demoHtml, /Woven — Chat to Browser Demo/);
  assert.match(readFileSync("web/widget.html", "utf8"), /data-surface="hosted"/);
  assert.match(demo, /\/webmcp\?guided=demo/);
  assert.match(demo, /Woven Demo Host/);
  assert.match(demo, /demo-laptop/);
  assert.match(demo, /demo-browser-takeover/);
  assert.match(demo, /Browser control returned to chat/);
  assert.match(demo, /WebMCP rehearsal active/);
  assert.match(demo, /does not register site tools/);
  assert.match(demo, /Open real WebMCP storefront/);
  assert.match(demo, /Official testing guide/);
  assert.match(demo, /Next beat/);
  assert.match(demo, /Identity and checkout remain yours/);
  assert.match(demo, /window\.location\.host/);
  assert.match(demo, /Simulated/);
  assert.match(demo, /\.get\("loop"\) === "true"/);
  assert.match(demo, /postMessage/);
  assert.doesNotMatch(demo, /registerWebMcpTools|start_demo_identity|create_checkout_preview|confirm_purchase/);
  assert.match(storefront, /window\.self !== window\.top/);
  assert.match(storefront, /type WebMcpConnectionState = "rehearsal" \| "unsupported" \| "registering" \| "connected" \| "failed"/);
  assert.match(storefront, /registerWebMcpTools\(context, adapter, controller\.signal\)[\s\S]*?\.then\(\(\) => setWebMcpConnection\("connected"\)\)/);
  assert.match(storefront, /WebMCP active · 7 tools/);
  assert.match(storefront, /Storefront-only mode in this browser/);
  assert.match(storefront, /supported test paths/);
  const testing = readFileSync("web/webmcp-testing.ts", "utf8");
  assert.match(testing, /ChatGPT in-app browser/);
  assert.match(testing, /WebMCP works out of the box/);
  assert.match(testing, /experimental flag or origin trial/);
  assert.match(testing, /https:\/\/openai\.com\/webmcp-challenge\//);
});

test("guided demo selects a cart and stops at the human-only handoff", () => {
  const storefront = readFileSync("web/storefront.tsx", "utf8");
  const guidedFlow = storefront.match(/if \(!guidedDemo[\s\S]*?\n  }, \[guidedDemo, invokeTool, startMission\]\)/)?.[0];

  assert.ok(guidedFlow);
  assert.match(guidedFlow, /startMission/);
  assert.match(guidedFlow, /scrollToId\("complete-kits"\)/);
  assert.match(guidedFlow, /setGuidedAction\("compare_carts"\)/);
  assert.match(guidedFlow, /setGuidedAction\("selecting"\)/);
  assert.match(guidedFlow, /setGuidedAction\("select_cart"\)/);
  assert.match(guidedFlow, /invokeTool\("select_cart"/);
  assert.match(guidedFlow, /postStage\("selected"\)/);
  assert.match(guidedFlow, /scrollToHandoff\(\)/);
  assert.match(guidedFlow, /postStage\("handoff"\)/);
  assert.match(guidedFlow, /postStage\("complete"\)/);
  assert.doesNotMatch(guidedFlow, /setTimeout|pause\(/);
  assert.doesNotMatch(guidedFlow, /start_demo_identity|create_checkout_preview|confirm_purchase/);
});

test("hosted widget assets are self-contained", () => {
  const html = '<script type="module" src="/assets/widget.js"></script><link rel="stylesheet" href="/assets/widget.css">';
  const assets: Record<string, string> = {
    "assets/widget.js": 'console.log("</script>")',
    "assets/widget.css": 'main::after{content:"</style>"}',
  };
  const inlined = inlineWidgetAssets(html, (path) => assets[path]!);

  assert.doesNotMatch(inlined, /(?:src|href)=["']\/assets\//);
  assert.match(inlined, /<script type="module">console\.log\("<\\\/script>"\)<\/script>/);
  assert.match(inlined, /<style>main::after\{content:"<\\\/style>"\}<\/style>/);
});

test("hosted widget hydrates from ChatGPT's initial tool snapshot", () => {
  assert.deepEqual(
    initialToolResult({
      toolOutput: { view: { mission: { id: "mission-1" } } },
      toolResponseMetadata: { confirmationNonce: "nonce-1" },
    }),
    {
      structuredContent: { view: { mission: { id: "mission-1" } } },
      _meta: { confirmationNonce: "nonce-1" },
    },
  );
  assert.equal(initialToolResult({}), null);
});

test("cart refresh updates the current widget without remount metadata", () => {
  assert.equal(WIDGET_URI, "ui://woven/mission-v4.html");
  assert.deepEqual(WIDGET_REFRESH_META, { "openai/widgetAccessible": true });
});

test("WebMCP defaults visibly to live sources while the guided demo is explicit showcase data", () => {
  const storefront = readFileSync("web/storefront.tsx", "utf8");
  const demo = readFileSync("web/demo.tsx", "utf8");
  const server = readFileSync("src/server.ts", "utf8");
  assert.match(storefront, /return sessionStorage\.getItem\("woven-storefront-source"\) === "demo" \? "demo" : "live"/);
  assert.match(storefront, /guided["']\) === "demo"\) return "demo"/);
  assert.match(storefront, /Connected stores/);
  assert.match(storefront, /Payment occurs on the merchant site/);
  assert.match(storefront, /const startMission[\s\S]*?syncSourceMode\(mode\)[\s\S]*?setRequest\(input\.request\)/);
  assert.match(demo, /Showcase data/);
  assert.match(server, /app\.post\("\/api\/demo\/start"[^]*sourceMode: "demo"/);
  assert.match(server, /sourceMode: z\.enum\(\["demo", "live"\]\)\.default\("demo"\)/);
});
