import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@qrcl/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@qrcl/cli": resolve(__dirname, "packages/cli/src/index.ts"),
      "@qrcl/ink-react": resolve(__dirname, "packages/ink-react/src/index.ts")
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
