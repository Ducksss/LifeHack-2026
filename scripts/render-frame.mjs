import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error("Usage: npm run frame:render -- <source.html> [output.png]");
  process.exit(1);
}

const source = resolve(sourceArg);

if (!existsSync(source) || extname(source) !== ".html") {
  console.error(`HTML source not found: ${source}`);
  process.exit(1);
}

const sourceDir = dirname(source);
const outputDir = basename(sourceDir) === "src" ? dirname(sourceDir) : sourceDir;
const output = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(outputDir, `${basename(source, ".html")}.png`);
const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!existsSync(chrome)) {
  console.error("Chrome not found. Set CHROME_BIN to a Chrome or Chromium executable.");
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });

const result = spawnSync(chrome, [
  "--headless=new",
  "--hide-scrollbars",
  "--allow-file-access-from-files",
  "--force-device-scale-factor=1",
  "--window-size=1600,900",
  `--screenshot=${output}`,
  pathToFileURL(source).href,
], { stdio: "inherit" });

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Rendered ${output}`);
