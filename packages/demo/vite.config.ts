import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@qr-cli/ink": resolve(__dirname, "../ink/src/index.ts"),
      "@qr-cli/renderer": resolve(__dirname, "../renderer/src/index.ts")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["cjs"],
      fileName: () => "index.cjs"
    },
    rollupOptions: {
      external: ["react", "ink"]
    }
  }
});
