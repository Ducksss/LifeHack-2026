import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("architecture tracer cycles every phase and can be paused", () => {
  const page = readFileSync("web/architecture.html", "utf8");
  assert.match(page, /data-loop aria-pressed=&quot;false&quot;/);
  assert.match(page, /activeIndex = \(activeIndex \+ 1\) % flowButtons\.length/);
  assert.match(page, /loopTimer \? stopLoop\(\) : startLoop\(\)/);
  assert.match(page, /prefers-reduced-motion: reduce/);
});

test("judges can reach the architecture explainer from the landing page", () => {
  const landing = readFileSync("web/landing.tsx", "utf8");
  assert.equal(landing.match(/href="\/architecture"/g)?.length, 2);
});

test("architecture keeps the global judge navigation", () => {
  const page = readFileSync("web/architecture.html", "utf8");
  assert.match(page, /<nav class="primary" aria-label="Primary navigation">/);
  assert.match(page, /href="\/architecture" aria-current="page"/);
  assert.match(page, /href="\/demo">Run the demo/);
  assert.match(page, /@media \(max-width: 767px\)/);
});
