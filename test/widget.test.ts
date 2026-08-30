import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialToolResult, inlineWidgetAssets, WIDGET_REFRESH_META, WIDGET_URI } from "../src/widget.js";

test("browser demo and hosted MCP App use explicit entry points", () => {
  assert.match(readFileSync("web/demo.html", "utf8"), /data-surface="demo"/);
  assert.match(readFileSync("web/widget.html", "utf8"), /data-surface="hosted"/);
  assert.doesNotMatch(readFileSync("web/widget.tsx", "utf8"), /window\.self\s*===\s*window\.top/);
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
  assert.equal(WIDGET_URI, "ui://woven/mission-v3.html");
  assert.deepEqual(WIDGET_REFRESH_META, { "openai/widgetAccessible": true });
});
