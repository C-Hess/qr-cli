import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: ["qrcode-generator", "iconv-lite"]
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
