import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        cli: resolve(__dirname, "src/cli.ts")
      },
      formats: ["es"]
    },
    rollupOptions: {
      external: ["@qrcl/core", "node:fs", "node:path", "node:url"],
      output: {
        entryFileNames: "[name].js",
        banner: (chunk) => (chunk.name === "cli" ? "#!/usr/bin/env node" : "")
      }
    }
  },
  plugins: [
    dts({
      entryRoot: "src",
      include: ["src"],
      outDir: "dist"
    })
  ]
});
