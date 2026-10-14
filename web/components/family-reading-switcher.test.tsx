/**
 * The Family page's "Reading for" bar.
 *
 * Pinned here: who the bar says is being read, that a chip and the `[` / `]`
 * shortcut switch the member, that the shortcut stays quiet while the reader is
 * typing, that the section index jumps, and that a Tamil initial is a whole
 * letter (consonant + vowel sign), not half of one.
 *
 * BLIND SPOT, recorded deliberately: jsdom has no layout and no scrolling.
 * Nothing here can see that the bar actually sticks under the top bar (that
 * depends on `.cd-main-content` being `overflow-x: clip`, not `hidden`), that
 * a switch keeps the reader on the same section (the parent's anchor restore
 * measures real rects), that the scrollspy highlights the right section, or
 * that the chips scroll sideways at 375px. Those need a real browser.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { careReasonLabel } from "@/lib/family-flags";

import { FamilyReadingSwitcher, type SwitcherMember, type SwitcherSection } from "./family-reading-switcher";

const MEMBERS: SwitcherMember[] = [
  { id: "m-self", name: "Test Owner", isSelf: true, score: 70, careReason: null },
  { id: "m-2", name: "Sample Kin", isSelf: false, score: 40, careReason: "lowScore" },
  { id: "m-3", name: "கீர்த்தி", isSelf: false, score: 55, careReason: "chandrashtama" },
];

const SECTIONS: SwitcherSection[] = [
  { id: "hy-overview", label: "Overview" },
  { id: "hy-dashas", label: "Dashas" },
];

function renderBar(overrides: Partial<React.ComponentProps<typeof FamilyReadingSwitcher>> = {}) {
  const onSwitch = vi.fn();
  const onJump = vi.fn();
  const barRef = createRef<HTMLDivElement>();
  render(
    <FamilyReadingSwitcher
      lang="en"
      members={MEMBERS}
      activeId="m-2"
      onSwitch={onSwitch}
      sections={SECTIONS}
      onJump={onJump}
      barRef={barRef}
      {...overrides}
    />,
  );
  // jsdom gives every element a zero rect, which the shortcut's "is the bar on
  // screen" guard reads as off screen. Place it in the viewport.
  if (barRef.current) {
    barRef.current.getBoundingClientRect = () => ({ top: 60, bottom: 110, left: 0, right: 800, width: 800, height: 50, x: 0, y: 60, toJSON: () => ({}) });
  }
  return { onSwitch, onJump, barRef };
}

const sleepPast = (ms: number) => new Promise((r) => setTimeout(r, ms + 20));

describe("FamilyReadingSwitcher", () => {
  it("marks exactly the member being read as pressed", () => {
    renderBar();
    const pressed = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("Sample Kin");
  });

  it("switches on a chip, and does nothing on the active one", () => {
    const { onSwitch } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: /Test Owner/ }));
    expect(onSwitch).toHaveBeenCalledWith("m-self");
    fireEvent.click(screen.getByRole("button", { name: /Sample Kin/ }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("names the care reason in the chip's accessible name, not only in a coloured dot", () => {
    renderBar();
    // The avatar initial and the dot are aria-hidden; the reason is spoken text.
    expect(screen.getByRole("button", { name: `Sample Kin, ${careReasonLabel("lowScore", "en")}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test Owner, you" })).toBeInTheDocument();
  });

  it("steps through members with ] and [, wrapping at the ends", () => {
    const { onSwitch } = renderBar();
    fireEvent.keyDown(window, { key: "]" });
    expect(onSwitch).toHaveBeenLastCalledWith("m-3");
    fireEvent.keyDown(window, { key: "[" });
    expect(onSwitch).toHaveBeenLastCalledWith("m-self");
  });

  it("wraps from the last member to the first", () => {
    const { onSwitch } = renderBar({ activeId: "m-3" });
    fireEvent.keyDown(window, { key: "]" });
    expect(onSwitch).toHaveBeenLastCalledWith("m-self");
  });

  it("ignores the shortcut while the reader is typing, or with a modifier held", () => {
    const { onSwitch } = renderBar();
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "]" });
    fireEvent.keyDown(window, { key: "]", ctrlKey: true });
    expect(onSwitch).not.toHaveBeenCalled();
    input.remove();
  });

  it("ignores the shortcut while the bar is off screen (Family pane hidden behind another tab)", () => {
    const { onSwitch, barRef } = renderBar();
    barRef.current!.getBoundingClientRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.keyDown(window, { key: "]" });
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it("jumps to the section picked in the index", () => {
    const { onJump } = renderBar();
    fireEvent.change(screen.getByRole("combobox", { name: "Jump to section" }), { target: { value: "hy-dashas" } });
    expect(onJump).toHaveBeenCalledWith("hy-dashas");
  });

  it("uses a whole Tamil letter as the initial", () => {
    renderBar();
    const chip = screen.getByRole("button", { name: /கீர்த்தி/ });
    const avatar = chip.querySelector(".hy-switcher__avatar");
    // கீ is க + the vowel sign ீ; charAt(0) would print a bare க.
    expect(avatar?.textContent).toBe("கீ");
  });

  it("shows a plain name, and no chips, when there is only one person to read", () => {
    renderBar({ members: [MEMBERS[0]!], activeId: "m-self" });
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Test Owner")).toBeInTheDocument();
  });

  describe("tucking away on a phone", () => {
    // A stuck bar on a compact screen: matchMedia says < 1024px, and the
    // reading region's top is above the stick line.
    async function stuckCompactBar() {
      const realMatchMedia = window.matchMedia;
      window.matchMedia = ((query: string) => ({ matches: query.includes("max-width"), media: query })) as unknown as typeof window.matchMedia;
      const setup = renderBar();
      setup.barRef.current!.parentElement!.getBoundingClientRect = () => ({ top: -2000, bottom: 4000, left: 0, right: 390, width: 390, height: 6000, x: 0, y: -2000, toJSON: () => ({}) });
      // `byReader`: a wheel precedes the scroll, as for a real reader. Without
      // it the move stands in for scroll anchoring after a panel loads.
      const scrollTo = async (y: number, byReader = true) => {
        if (byReader) fireEvent.wheel(window, { deltaY: y - window.scrollY });
        Object.defineProperty(window, "scrollY", { value: y, configurable: true });
        fireEvent.scroll(window);
        await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });
      };
      await scrollTo(1000);
      const bar = () => document.querySelector(".hy-switcher")!;
      return { ...setup, scrollTo, bar, restore: () => { window.matchMedia = realMatchMedia; } };
    }

    it("slides away on scroll down and returns on scroll up", async () => {
      const { scrollTo, bar, restore } = await stuckCompactBar();
      await scrollTo(1200);
      expect(bar().getAttribute("data-tucked")).toBe("true");
      await scrollTo(1100);
      expect(bar().getAttribute("data-tucked")).toBe("false");
      restore();
    });

    it("ignores a page move the reader did not make (scroll anchoring after a load)", async () => {
      const { scrollTo, bar, restore } = await stuckCompactBar();
      await sleepPast(400);
      await scrollTo(1500, false);
      expect(bar().getAttribute("data-tucked")).toBe("false");
      restore();
    });

    it("stays put for the scroll a switch itself causes", async () => {
      const { scrollTo, bar, restore } = await stuckCompactBar();
      fireEvent.click(screen.getByRole("button", { name: /Test Owner/ }));
      // The parent's anchor restore scrolls the page down after a switch.
      await scrollTo(1600);
      expect(bar().getAttribute("data-tucked")).toBe("false");
      restore();
    });
  });

  it("speaks Tamil on the Tamil surface", () => {
    renderBar({ lang: "ta" });
    expect(screen.getByText("படிக்கிறது")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "பகுதிக்குச் செல்" })).toBeInTheDocument();
  });
});
