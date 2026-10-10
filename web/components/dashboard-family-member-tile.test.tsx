/**
 * The member tile's Edit affordance.
 *
 * Why this file exists: the tile is itself a `<button>` (Pressable), so the
 * obvious implementation — dropping an Edit button into the card's header row —
 * produces a button inside a button. That is invalid HTML, no TypeScript or
 * ESLint rule here catches it, and browsers resolve it inconsistently: the inner
 * control is dropped from the accessibility tree, or its click activates the
 * outer card instead. The failure is that Edit selects the member rather than
 * editing them, which reads as "the button does nothing".
 *
 * So the structural invariant is pinned directly, not just the behaviour.
 *
 * BLIND SPOT, recorded deliberately: jsdom has no layout, so nothing here can
 * see that the absolutely-positioned button clears the score ring, that its
 * 30x30 hit area survives at 375px, or that its focus ring is visible. Those
 * need a real browser.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HyMemberSelectorCard } from "./dashboard-family-charts-hybrid";
import type { FamilyAggregateMember } from "@/lib/types";

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, whileTap: _w, transition: _t, ...props }: any) => <button {...props}>{children}</button>,
    a: ({ children, whileTap: _w, transition: _t, ...props }: any) => <a {...props}>{children}</a>,
  },
}));

function member(overrides: Partial<FamilyAggregateMember> = {}): FamilyAggregateMember {
  return {
    familyMemberId: "member-1",
    birthProfileId: "bp-1",
    chartId: "chart-1",
    displayName: "Test Subject",
    individualScore: 62,
    label: "BALANCED",
    memberWeight: 1,
    activeCycleTags: [],
    ...overrides,
  } as unknown as FamilyAggregateMember;
}

function renderTile(props: Partial<Parameters<typeof HyMemberSelectorCard>[0]> = {}) {
  const onOpen = vi.fn();
  const onEdit = vi.fn();
  render(
    <HyMemberSelectorCard
      lang="en"
      member={member()}
      todayItem={undefined}
      memberChart={undefined}
      relationLabel="Spouse"
      isSelf={false}
      isActive={false}
      careReason={null}
      saniCycles={[]}
      onOpen={onOpen}
      onEdit={onEdit}
      {...props}
    />,
  );
  return { onOpen, onEdit };
}

describe("member tile edit affordance", () => {
  it("names the member it edits", () => {
    renderTile();
    expect(screen.getByRole("button", { name: /Edit Test Subject's details/i })).toBeTruthy();
  });

  it("is not nested inside the card's own button", () => {
    renderTile();
    const edit = screen.getByRole("button", { name: /Edit Test Subject's details/i });
    // From `parentElement`, not from `edit`. `Element.closest()` starts at the
    // element itself, so `edit.closest("button") === edit` holds whether or not
    // the button is nested — a check that cannot fail. Walking up from the
    // parent is the version that discriminates: here it reaches the wrapper
    // <div> and stops, and if the button were moved back inside the card it
    // would reach the card's own <button>.
    expect(edit.parentElement?.closest("button")).toBeNull();
  });

  it("edits without also selecting the member", () => {
    const { onOpen, onEdit } = renderTile();
    fireEvent.click(screen.getByRole("button", { name: /Edit Test Subject's details/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders no edit control when the caller supplies no target", () => {
    // What a member whose chart is still loading gets, and what the owner's own
    // synthesised row would get if its routing were ever removed — better than
    // a control that opens an empty form or silently does nothing.
    renderTile({ onEdit: undefined });
    expect(screen.queryByRole("button", { name: /Edit/i })).toBeNull();
  });
});
