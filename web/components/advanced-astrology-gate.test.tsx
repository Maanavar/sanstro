import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { AdvancedAstrologyGate } from "./advanced-astrology-gate";

/**
 * The gate's blurb is a claim about what is inside it.
 *
 * Vargas and Shadbala originally rendered ungated above this component and were
 * then moved inside it wholesale, landing under copy that read "comparison /
 * experimental dasha systems — none feed your daily score". Neither is a dasha
 * system, and D9 is not experimental: the planet table prints each planet's D9
 * sign as a fact and treats Vargottama (same sign in D1 and D9) as a dignity
 * that "steadies how it behaves". The app contradicted itself two screens apart.
 *
 * Nothing could catch that structurally — the panels rendered, the toggle
 * worked, the types were satisfied. So these assert the words.
 *
 * THE GATE STARTS CLOSED, and `CollapsibleSection` does not mount its children
 * while closed. So every assertion about the blurb has to open it first — a
 * `queryByText(...).toBeNull()` on a shut gate passes for the wrong reason, and
 * the negative assertions below are the whole point of the file.
 */
type Kind = "experimental-dasha" | "classical-detail";

function openGate(kind: Kind, lang: "en" | "ta" = "en") {
  const utils = render(
    <AdvancedAstrologyGate lang={lang} mode="BEGINNER" kind={kind}>
      <p>panel contents</p>
    </AdvancedAstrologyGate>,
  );
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  return utils;
}

describe("AdvancedAstrologyGate", () => {
  it("only gates for BEGINNER", () => {
    render(
      <AdvancedAstrologyGate lang="en" mode="BALANCED">
        <p>panel contents</p>
      </AdvancedAstrologyGate>,
    );
    expect(screen.getByText("panel contents")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hides the panels behind a shut toggle for BEGINNER", () => {
    render(
      <AdvancedAstrologyGate lang="en" mode="BEGINNER">
        <p>panel contents</p>
      </AdvancedAstrologyGate>,
    );
    expect(screen.queryByText("panel contents")).toBeNull();
  });

  it("calls the alternate dasha panels experimental, because they are", () => {
    openGate("experimental-dasha");
    expect(screen.getByText("panel contents")).toBeInTheDocument();
    expect(screen.getByText(/experimental dasha systems/i)).toBeInTheDocument();
    expect(screen.getByText(/none feed your daily score/i)).toBeInTheDocument();
  });

  it("does NOT call vargas and shadbala experimental, or dasha systems", () => {
    openGate("classical-detail");
    // Guard that the gate really is open, so the three nulls below mean what
    // they say rather than "nothing rendered".
    expect(screen.getByText("panel contents")).toBeInTheDocument();
    expect(screen.queryByText(/experimental/i)).toBeNull();
    expect(screen.queryByText(/dasha system/i)).toBeNull();
    expect(screen.queryByText(/none feed your daily score/i)).toBeNull();
  });

  it("says classical detail is folded away for density, and is already in use", () => {
    openGate("classical-detail");
    expect(screen.getByText(/dense rather than because it is doubtful/i)).toBeInTheDocument();
    expect(screen.getByText(/already uses them/i)).toBeInTheDocument();
  });

  it("titles the two gates differently", () => {
    const dasha = render(
      <AdvancedAstrologyGate lang="en" mode="BEGINNER" kind="experimental-dasha">
        <p>a</p>
      </AdvancedAstrologyGate>,
    );
    expect(screen.getByText(/Other dasha systems/i)).toBeInTheDocument();
    dasha.unmount();

    render(
      <AdvancedAstrologyGate lang="en" mode="BEGINNER" kind="classical-detail">
        <p>a</p>
      </AdvancedAstrologyGate>,
    );
    expect(screen.getByText(/More chart detail/i)).toBeInTheDocument();
    expect(screen.queryByText(/dasha/i)).toBeNull();
  });

  it("defaults to the experimental copy, so an un-migrated call site is unchanged", () => {
    render(
      <AdvancedAstrologyGate lang="en" mode="BEGINNER">
        <p>panel contents</p>
      </AdvancedAstrologyGate>,
    );
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByText(/experimental dasha systems/i)).toBeInTheDocument();
  });

  it("carries both blurbs in Tamil", () => {
    const tamil = /[஀-௿]/;
    for (const kind of ["experimental-dasha", "classical-detail"] as const) {
      const { container, unmount } = openGate(kind, "ta");
      const text = container.textContent ?? "";
      expect(tamil.test(text), `${kind} title/blurb is not Tamil`).toBe(true);
      expect(/experimental|dasha system/i.test(text), `${kind} leaked English`).toBe(false);
      unmount();
    }
  });
});
