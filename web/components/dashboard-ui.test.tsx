import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Surface } from "./dashboard-ui";

describe("Surface — non-collapsible (default)", () => {
  it("renders the title and body with no disclosure semantics", () => {
    render(
      <Surface title="Today's guidance">
        <p>body text</p>
      </Surface>,
    );
    expect(screen.getByText("body text")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Surface — collapsible", () => {
  it("starts closed, hides the body, and opens on click", () => {
    render(
      <Surface collapsible title="Today's guidance">
        <p>body text</p>
      </Surface>,
    );

    const trigger = screen.getByRole("button", { name: /today's guidance/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("body text")).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("body text")).toBeTruthy();

    fireEvent.click(trigger);
    expect(screen.queryByText("body text")).toBeNull();
  });

  it("honours defaultOpen", () => {
    render(
      <Surface collapsible defaultOpen title="Today's guidance">
        <p>body text</p>
      </Surface>,
    );
    expect(screen.getByText("body text")).toBeTruthy();
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  });

  // The summary is the whole reason a collapsed section is skippable rather
  // than merely hidden — it must be visible exactly while the body is not.
  it("shows the summary only while closed", () => {
    render(
      <Surface collapsible title="Today's guidance" summary={<span>72/100</span>}>
        <p>body text</p>
      </Surface>,
    );
    expect(screen.getByText("72/100")).toBeTruthy();

    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("72/100")).toBeNull();
  });
});
