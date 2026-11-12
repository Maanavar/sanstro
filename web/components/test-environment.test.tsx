/**
 * A gate on the test environment itself.
 *
 * On 2026-11-12 the suite was discovered to be running 658 of its 1929 tests
 * vacuously on Windows: `environmentMatchGlobs` is resolved against `root`,
 * which on Windows produces a backslash pattern that micromatch reads as
 * escape sequences, so it matched nothing and every `.test.tsx` silently fell
 * back to `environment: "node"`. Every component test died on `document is not
 * defined`. Linux resolves to forward slashes, so CI was green throughout —
 * the platform running the gate could not reproduce the failure.
 *
 * These three assertions each fail under a distinct regression, so a future
 * config change cannot quietly take the DOM away again:
 *
 * 1. `document` missing            -> the environment is not jsdom at all.
 * 2. a render throwing on hooks    -> jsdom is loaded but the module transform
 *                                     is "ssr", which is what a per-file
 *                                     environment docblock gives you while the
 *                                     config itself stays on node.
 *
 * NOTE: do not write the per-file environment pragma out in full anywhere in
 * this file, not even inside a comment. Vitest looks for it with a plain regex
 * over the whole file text and honours the first hit, so prose describing the
 * pragma silently becomes the pragma. That is how this very gate was failing
 * while the suite around it passed.
 * 3. a `.test.ts` without a DOM    -> see lib/test-environment.test.ts, which
 *                                     pins the same thing from the other
 *                                     extension.
 *
 * It lives in `components/` on purpose. The same file at the web package root
 * fails on the hook assertion: "react" resolves to a different copy from there
 * (the store carries both 19.1.0 and 19.2.7), and react-dom then sees a null
 * dispatcher. A gate has to sit in the same resolution context as the tests it
 * is guarding, or it tests its own directory instead.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CollapsibleSection } from "./collapsible-section";

describe("the test environment", () => {
  it("provides a DOM", () => {
    expect(typeof document).not.toBe("undefined");
    expect(document.documentElement).toBeTruthy();
  });

  it("renders a real component and runs its hooks", () => {
    // A component from the codebase, not one declared here: it must resolve
    // "react" the way every other component test does. `useState` is the
    // specific thing that dies under the "ssr" transform, with "Cannot read
    // properties of null (reading 'useState')".
    render(
      <CollapsibleSection title="Environment gate">
        <p>body</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Environment gate");
  });

  it("exposes a window with the APIs component tests rely on", () => {
    expect(typeof window).not.toBe("undefined");
    expect(typeof window.matchMedia === "function" || window.matchMedia === undefined).toBe(true);
    expect(typeof window.localStorage).toBe("object");
  });
});
