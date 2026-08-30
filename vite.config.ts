import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const widget = mode === "widget";
  return {
    plugins: [react(), tailwindcss()],
    root: "web",
    resolve: {
      alias: {
        "@": path.resolve("web"),
      },
    },
    build: widget
      ? {
          outDir: "../dist/widget",
          emptyOutDir: true,
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          cssCodeSplit: false,
          rollupOptions: {
            input: path.resolve("web/widget.html"),
            output: { inlineDynamicImports: true },
          },
        }
      : {
          outDir: "../dist/web",
          emptyOutDir: true,
          rollupOptions: {
            input: {
              demo: path.resolve("web/demo.html"),
              widget: path.resolve("web/widget.html"),
              merchant: path.resolve("web/merchant.html"),
              install: path.resolve("web/install.html"),
              identity: path.resolve("web/identity.html"),
              landing: path.resolve("web/landing.html"),
            },
          },
        },
  };
});
