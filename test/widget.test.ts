import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("browser demo and hosted MCP App use explicit entry points", () => {
  assert.match(readFileSync("web/demo.html", "utf8"), /data-surface="demo"/);
  assert.match(readFileSync("web/widget.html", "utf8"), /data-surface="hosted"/);
  assert.doesNotMatch(readFileSync("web/widget.tsx", "utf8"), /window\.self\s*===\s*window\.top/);
});

test("buyer widget exposes choice, comparison, preference, recovery, swap, and receipt flows", () => {
  const widget = readFileSync("web/widget.tsx", "utf8");
  for (const marker of [
    "Choice Center",
    "Compare carts",
    "Spend less",
    "Pick up sooner",
    "Prioritize power",
    "Remember these preferences",
    "Swap item",
    "Fresh alternatives ready",
    "Verified receipt",
  ]) assert.match(widget, new RegExp(marker));
  assert.match(widget, /<dialog/);
  assert.match(widget, /localStorage/);
  assert.match(widget, /build_carts/);
});
