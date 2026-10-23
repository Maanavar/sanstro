import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const AUXILIARY_ROUTES = [
  "app/(marketing)/notifications/layout.tsx",
  "app/dashboard/glossary/page.tsx",
  "app/dashboard/reports/page.tsx",
];

describe("authenticated auxiliary-page shell", () => {
  it.each(AUXILIARY_ROUTES)("keeps %s inside dashboard chrome", (path) => {
    const source = readFileSync(path, "utf8");

    expect(source).toContain("DashboardAuxiliaryShell");
  });

  it("owns the real dashboard header and footer in one place", () => {
    const source = readFileSync("components/dashboard-auxiliary-shell.tsx", "utf8");

    expect(source).toContain("<DashboardHero");
    expect(source).toContain("<DashboardFooter");
    expect(source).toContain("activeTab={null}");
  });

  it("does not bring the retired Inbox mini-header back", () => {
    const source = readFileSync("app/(marketing)/notifications/page.tsx", "utf8");

    expect(source).not.toContain("cl-inbox-bar");
  });
});
