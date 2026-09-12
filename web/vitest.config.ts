import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      // Next resolves `@vinaadi/shared/*` through tsconfig `paths`; Vite does
      // not read those, so it falls back to the package's `exports` map — which
      // has drifted and is missing several subpaths that are imported for real
      // (oneMinuteReading, streak, shadbala, snapshot, …). Point at the source
      // the same way tsconfig does, so a component test can mock a shared API
      // wrapper without the resolve failing before the suite starts.
      "@vinaadi/shared": path.resolve(import.meta.dirname, "../packages/shared/src"),
    },
  },
  test: {
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    // Run every worker in UTC, the zone GitHub's runners are in.
    //
    // The date helpers in lib/tz.ts fall back to the *runner's* local zone when
    // a component is handed no `timeZone` prop, which is the correct product
    // behavior and a silent trapdoor for tests: three Today-tab cases asserting
    // a live "you are inside this window now" state passed on an IST laptop and
    // failed on CI, five and a half hours apart, with a diff that pointed at
    // the component. A test that depends on the zone should now depend on a
    // zone it states, and one that forgets to state it fails the same way
    // everywhere rather than only where nobody is looking.
    env: { TZ: "UTC" },
    // Component tests (.test.tsx) use jsdom; pure logic tests (.test.ts) run in node.
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
    // Vitest's 5s default is tuned for small units. Several of these tests mount
    // a real dashboard tab — the Today tab's first test measures ~3.4s on its
    // own, because it pays this file's module import on top of rendering the
    // whole tree in jsdom. That leaves under 2s of headroom, so the suite went
    // red under load while every test passed in isolation.
    //
    // Raised because of HOW it failed, not just that it did. A test that times
    // out mid-render never reaches testing-library's cleanup, so its DOM is
    // still mounted when the next test renders — and the next test fails with
    // "found multiple elements", which reads exactly like a duplicate-render
    // bug in the component. One slow test therefore produced two failures, only
    // one of them real, and pointed the second at innocent code. A timeout here
    // should mean "this hung", so it has to sit clear of what merely renders
    // slowly.
    testTimeout: 15000,
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
