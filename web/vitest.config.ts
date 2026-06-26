import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    // Component tests (.test.tsx) use jsdom; pure logic tests (.test.ts) run in node.
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "hooks/**", "components/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "node_modules", ".next"],
      // Ratchet: bump thresholds after each batch of new component tests lands.
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 15,
        statements: 20,
      },
    },
  },
});
