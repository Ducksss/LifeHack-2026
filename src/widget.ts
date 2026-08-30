export const WIDGET_URI = "ui://woven/mission-v3.html";
export const WIDGET_REFRESH_META = { "openai/widgetAccessible": true } as const;

const localAsset = (url: string) => {
  const path = url.replace(/^\.?\//, "");
  return path.startsWith("assets/") ? path : null;
};

const escapeClosingTag = (source: string, tag: "script" | "style") =>
  source.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

export function inlineWidgetAssets(html: string, readAsset: (path: string) => string): string {
  return html
    .replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (tag, url: string) => {
      const path = localAsset(url);
      return path ? `<script type="module">${escapeClosingTag(readAsset(path), "script")}</script>` : tag;
    })
    .replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (tag, url: string) => {
      const path = localAsset(url);
      return path ? `<style>${escapeClosingTag(readAsset(path), "style")}</style>` : tag;
    });
}

export function initialToolResult(host: unknown) {
  if (!host || typeof host !== "object") return null;
  const { toolOutput, toolResponseMetadata } = host as Record<string, unknown>;
  if (!toolOutput || typeof toolOutput !== "object") return null;
  return {
    structuredContent: toolOutput,
    ...(toolResponseMetadata && typeof toolResponseMetadata === "object"
      ? { _meta: toolResponseMetadata as Record<string, unknown> }
      : {}),
  };
}
