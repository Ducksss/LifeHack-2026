import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: "web",
  build: {
    outDir: "../dist/web",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        widget: path.resolve("web/widget.html"),
        merchant: path.resolve("web/merchant.html"),
      },
    },
  },
});
