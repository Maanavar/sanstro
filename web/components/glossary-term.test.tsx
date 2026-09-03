import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryTerm } from "./glossary-term";
import { GLOSSARY } from "@/lib/glossary";

/**
 * KEYBOARD REACH, and why it needed its own file.
 *
 * `GlossaryTerm` portals its panel to `<body>`. That fixed the clipping problem
 * (see the component's header and web/e2e/glossary-tooltip-mobile.spec.ts) and
 * created a quieter one: focus order follows DOM order, so the panel — and the
 * "See all terms" link inside it — sits after every other control on the
 * dashboard. Tabbing off an opened term went to the next thing on screen and
 * the link was never reached in practice. It looked, and tested, completely
 * fine: it is a real `<a href>` with the right target, and a mouse finds it
 * instantly. Only a keyboard shows the defect.
 *
 * WHY fireEvent AND NOT A REAL TAB. jsdom implements no sequential focus
 * navigation at all — pressing Tab moves nothing, so a "does Tab reach the
 * link" test would fail against a correct implementation and pass against a
 * broken one. What is testable, and what actually carries the fix, is the
 * component's own keydown contract: intercept Tab while open and place focus
 * deliberately. That is what these assert. The part jsdom cannot answer — where
 * the browser's own Tab goes after we hand focus back — is the one place the
 * component deliberately does NOT preventDefault, and it is called out there.
 */

function renderTerm() {
  const utils = render(
    <p>
      <GlossaryTerm term="rahuKalam" lang="en">Rahu Kalam</GlossaryTerm>
      <button type="button">after the term</button>
    </p>,
  );
  const trigger = screen.getByRole("button", { name: "Rahu Kalam" });
  return { ...utils, trigger };
}

const panel = () => document.querySelector<HTMLElement>("[data-glossary-panel]");

describe("GlossaryTerm — keyboard reach", () => {
  it("steps into the gloss on Tab, so 'See all terms' is reachable at all", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByRole("link", { name: /See all terms/i }));
  });

  it("comes back to the term on Shift+Tab rather than into the document's tail", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    const link = screen.getByRole("link", { name: /See all terms/i });
    link.focus();

    fireEvent.keyDown(link, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(trigger);
    // Shift+Tab is a move within the gloss, not a dismissal.
    expect(panel()).toBeInTheDocument();
  });

  it("closes and hands focus back to the term on a forward Tab out of the gloss", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    const link = screen.getByRole("link", { name: /See all terms/i });
    link.focus();

    fireEvent.keyDown(link, { key: "Tab" });

    // Focus lands on the term; the browser's own Tab then continues from there
    // to "after the term". jsdom cannot run that second half — see the header.
    expect(document.activeElement).toBe(trigger);
    expect(panel()).not.toBeInTheDocument();
  });

  it("returns focus to the term when Escape closes a gloss the reader is inside", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    screen.getByRole("link", { name: /See all terms/i }).focus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(panel()).not.toBeInTheDocument();
    // Without this the panel unmounts under the focused link and focus falls to
    // <body> — at the far end of the document, which is exactly where a
    // keyboard reader cannot afford to be dropped.
    expect(document.activeElement).toBe(trigger);
  });

  it("does not steal focus when Escape is pressed somewhere else on the page", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    const elsewhere = screen.getByRole("button", { name: "after the term" });
    elsewhere.focus();

    fireEvent.keyDown(document, { key: "Escape" });

    // The Escape listener is on the document so it works from anywhere, which
    // means it fires for readers who are nowhere near this term. Closing is
    // right; yanking them to it is not.
    expect(panel()).not.toBeInTheDocument();
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("GlossaryTerm — what the screen reader is told", () => {
  it("describes the term with the definition alone, never the link too", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);

    const describedBy = trigger.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const description = document.getElementById(describedBy!);

    // Pointed at the whole panel, this read "…the reason is shown on each row.
    // See all terms" as the description of every glossed term on the dashboard.
    expect(description).toHaveTextContent(GLOSSARY.rahuKalam.en);
    expect(description).not.toHaveTextContent(/See all terms/i);
  });

  it("is a disclosure, not a tooltip, because it holds a focusable link", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);

    // ARIA's `tooltip` is a description and may hold nothing focusable. The
    // panel holds a link the keyboard is now expected to reach, so the pairing
    // is the disclosure one: aria-expanded + aria-controls on the trigger.
    expect(panel()).toBeInTheDocument();
    expect(panel()).not.toHaveAttribute("role", "tooltip");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel()!.id);
  });

  it("drops the association again once closed, so nothing points at a gone panel", () => {
    const { trigger } = renderTerm();
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(panel()).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("aria-controls");
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });
});
