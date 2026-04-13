import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@qr-cli/renderer": resolve(__dirname, "packages/renderer/src/index.ts"),
      "@qr-cli/cli": resolve(__dirname, "packages/cli/src/index.ts"),
      "@qr-cli/ink": resolve(__dirname, "packages/ink/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
    passWithNoTests: false,
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/cli.ts"]
    }
  }
});
