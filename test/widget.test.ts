import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("browser demo and hosted MCP App use explicit entry points", () => {
  assert.match(readFileSync("web/demo.html", "utf8"), /data-surface="demo"/);
  assert.match(readFileSync("web/widget.html", "utf8"), /data-surface="hosted"/);
  assert.doesNotMatch(readFileSync("web/widget.tsx", "utf8"), /window\.self\s*===\s*window\.top/);
});
