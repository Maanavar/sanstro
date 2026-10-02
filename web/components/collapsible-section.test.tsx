/**
 * Component tests for CollapsibleSection.
 *
 * These require jsdom + @testing-library/react. Run after:
 *   cd web && npm install
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CollapsibleSection } from "./collapsible-section";

describe("CollapsibleSection", () => {
  it("starts collapsed by default", () => {
    render(
      <CollapsibleSection title="My section">
        <p>Hidden content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("starts open when defaultOpen=true", () => {
    render(
      <CollapsibleSection title="Open section" defaultOpen>
        <p>Visible content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("Visible content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles open on button click", () => {
    render(
      <CollapsibleSection title="Toggle me">
        <p>Toggle content</p>
      </CollapsibleSection>,
    );
    const trigger = screen.getByRole("button");
    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText("Toggle content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);
    // DXA-15 keeps an already-open body mounted so its close animation can run.
    expect(screen.getByText("Toggle content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("takes focusable content out of the tab order while collapsed", () => {
    render(
      <CollapsibleSection title="Focusable content">
        <a href="/example">Hidden link</a>
      </CollapsibleSection>,
    );
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    const body = screen.getByText("Hidden link").closest(".collapsible__body");
    expect(body).toHaveAttribute("inert");
    expect(body).toHaveAttribute("aria-hidden", "true");
  });

  it("restores focusable content after an open-close-open round trip", () => {
    render(
      <CollapsibleSection title="Round trip">
        <a href="/example">Reachable link</a>
      </CollapsibleSection>,
    );
    const trigger = screen.getByRole("button");

    fireEvent.click(trigger);
    let body = screen.getByRole("link", { name: "Reachable link" }).closest(".collapsible__body");
    expect(body).not.toHaveAttribute("inert");
    expect(body).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    body = screen.getByRole("link", { name: "Reachable link" }).closest(".collapsible__body");
    expect(body).not.toHaveAttribute("inert");
    expect(body).toHaveAttribute("aria-hidden", "false");
  });

  it("renders the title in the button", () => {
    render(
      <CollapsibleSection title="Section heading">
        <span>body</span>
      </CollapsibleSection>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Section heading");
  });
});
