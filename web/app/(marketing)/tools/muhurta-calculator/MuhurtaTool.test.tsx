import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

const getPersonalizedMuhurta = vi.fn();

// Partial: `lib/api` calls `initApiClient` at import time, so replacing the
// whole module leaves the app's own client wiring undefined.
vi.mock("@vinaadi/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getPersonalizedMuhurta: (...args: unknown[]) => getPersonalizedMuhurta(...args),
}));

import { MuhurtaTool } from "./MuhurtaTool";

/**
 * A wedding has two subjects, and this tool asked for one.
 *
 * Chandrashtama and Tara Bala are per-person gates in Tamil practice, so a date
 * clean for the groom and Naidhana for the bride is not a wedding muhurtham —
 * it only looked like one, because the form could not express the second chart
 * and so the engine was never asked about it.
 *
 * What these assert is the *payload*, not the pixels. The failure this feature
 * fixes is silent: every screen still rendered, every number still looked
 * plausible, and the request simply carried one chart. So the tests watch what
 * leaves the form.
 *
 * `subjectRole` is load-bearing rather than decorative — Kalaprakasika Ch. XIV
 * p.79 counts Jupiter's transit from the BRIDE's Janma-Rasi, so the backend can
 * only apply that rule when the form says which chart is hers.
 */

function lastPayload() {
  return getPersonalizedMuhurta.mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

function fillPerson(block: HTMLElement, date: string, time: string) {
  fireEvent.change(within(block).getByLabelText("Birth date"), { target: { value: date } });
  fireEvent.change(within(block).getByLabelText("Birth time"), { target: { value: time } });
}

/** The two birth blocks, in DOM order. Each is its own `<fieldset>`. */
function birthBlocks(container: HTMLElement) {
  return Array.from(container.querySelectorAll("fieldset")).filter(
    (node) => within(node as HTMLElement).queryByLabelText("Birth date") !== null,
  ) as HTMLElement[];
}

/** Submits and lets the request's `finally` state update land inside `act`. */
async function submit(container: HTMLElement) {
  await act(async () => {
    fireEvent.submit(container.querySelector("form")!);
  });
}

beforeEach(() => {
  getPersonalizedMuhurta.mockReset();
  getPersonalizedMuhurta.mockResolvedValue({ success: true, data: { slots: [] } });
});

describe("MuhurtaTool — whose chart the wedding date is checked against", () => {
  it("asks for the bride and the groom by default, and sends both", async () => {
    // Two charts is the DEFAULT for a wedding, not an opt-in. A reader who does
    // not notice the toggle should get the correct reading, not the old one.
    const { container } = render(<MuhurtaTool />);
    const blocks = birthBlocks(container);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toHaveTextContent("Bride");
    expect(blocks[1]).toHaveTextContent("Groom");

    fillPerson(blocks[0], "1994-02-11", "07:40");
    fillPerson(blocks[1], "1991-09-03", "21:05");
    await submit(container);

    const payload = lastPayload();
    expect(payload.partner).toBeDefined();
    expect(payload.subjectRole).toBe("BRIDE");
    expect((payload.birth as Record<string, string>).birthDateLocal).toBe("1994-02-11");
    expect((payload.partner as Record<string, string>).birthDateLocal).toBe("1991-09-03");
  });

  it("lets the reader check one person only, and then sends no partner at all", async () => {
    // Omitted, not sent empty: the backend reads a present `partner` as a
    // request for couple mode, so a blank one would score a wedding against a
    // chart nobody entered.
    const { container } = render(<MuhurtaTool />);
    fireEvent.click(screen.getByLabelText("One person only"));

    expect(birthBlocks(container)).toHaveLength(1);
    fillPerson(birthBlocks(container)[0], "1994-02-11", "07:40");
    await submit(container);

    expect(lastPayload().partner).toBeUndefined();
  });

  it("asks who the single chart is, because one rule is counted from the bride", async () => {
    const { container } = render(<MuhurtaTool />);
    fireEvent.click(screen.getByLabelText("One person only"));

    // Offered, and answerable with "prefer not to say" — the backend keeps the
    // Jupiter rule silent rather than guessing when the role is unstated.
    fireEvent.click(screen.getByLabelText("Bride"));
    fillPerson(birthBlocks(container)[0], "1994-02-11", "07:40");
    await submit(container);
    expect(lastPayload().subjectRole).toBe("BRIDE");

    fireEvent.click(screen.getByLabelText("Prefer not to say"));
    await submit(container);
    expect(lastPayload().subjectRole).toBe("PERSON");
  });

  it("leaves every other event type exactly as it was", async () => {
    // The ask was scoped to weddings. A naming ceremony has one subject and must
    // not grow a second block or a role question.
    const { container } = render(<MuhurtaTool />);
    fireEvent.change(screen.getByLabelText("Event type"), { target: { value: "NAMING_CEREMONY" } });

    expect(birthBlocks(container)).toHaveLength(1);
    expect(screen.queryByLabelText("Bride and groom")).toBeNull();
    expect(screen.queryByLabelText("Prefer not to say")).toBeNull();

    fillPerson(birthBlocks(container)[0], "2026-01-09", "10:20");
    await submit(container);

    const payload = lastPayload();
    expect(payload.partner).toBeUndefined();
    expect(payload.subjectRole).toBe("PERSON");
  });

  it("keeps the two identical blocks tellable apart by their accessible names", () => {
    // "Birth date" now appears twice on one screen. Without the fieldset legend
    // a screen-reader user gets two identically-named controls and no way to
    // know which is the bride's — the axe gate in CI only checks contrast, so
    // this has to be asserted by hand.
    const { container } = render(<MuhurtaTool />);
    const [bride, groom] = birthBlocks(container);
    expect(bride.querySelector("legend")).toHaveTextContent("Bride");
    expect(groom.querySelector("legend")).toHaveTextContent("Groom");
    expect(screen.getAllByLabelText("Birth date")).toHaveLength(2);
  });

  it("shows the stood-down half of a couple reading, points and all", async () => {
    // The panel used to drop every `contribution === 0` factor. That is fine
    // while a factor is either scored or absent, and wrong the moment a couple
    // is on screen: the stood-down half carries exactly zero *by design* and is
    // the reading the reader most needs in order to see why a date lost.
    getPersonalizedMuhurta.mockResolvedValue({
      success: true,
      data: {
        slots: [{
          date: "2026-11-18",
          timeStart: "09:10",
          timeEnd: "10:20",
          score: 61.4,
          panchangamSupport: { en: "Sadayam, Dasami", ta: "சதயம், தசமி" },
          dashaSupport: null,
          horaSupport: null,
          cautions: [],
          factors: [
            {
              verdict: "PENALTY", contribution: -12,
              reason: { en: "Moon is 4th from the groom's birth sign.", ta: "மணமகன் ஜென்ம ராசிக்கு 4ல் சந்திரன்." },
            },
            {
              verdict: "BONUS", contribution: 0,
              reason: {
                en: "Moon is 10th from the bride's birth sign. Not counted in the couple's score.",
                ta: "மணமகள் ஜென்ம ராசிக்கு 10ல் சந்திரன். சேர்க்கப்படவில்லை.",
              },
            },
          ],
        }],
      },
    });

    const { container } = render(<MuhurtaTool />);
    const blocks = birthBlocks(container);
    fillPerson(blocks[0], "1994-02-11", "07:40");
    fillPerson(blocks[1], "1991-09-03", "21:05");
    await submit(container);

    expect(screen.getByText(/groom's birth sign/)).toBeTruthy();
    expect(screen.getByText(/bride's birth sign/)).toBeTruthy();
    // And the points are read out, not signalled by colour alone.
    expect(screen.getByText(/No points\./)).toBeTruthy();
    expect(screen.getByText(/-12 points\./)).toBeTruthy();
  });

  it("does not prefill a birth date for either person", () => {
    // It used to prefill one. With two blocks that becomes a hazard rather than
    // a convenience: a hurried reader could submit and be handed a confident
    // wedding muhurtham computed from two fictional charts.
    const { container } = render(<MuhurtaTool />);
    for (const block of birthBlocks(container)) {
      expect(within(block).getByLabelText("Birth date")).toHaveValue("");
      expect(within(block).getByLabelText("Birth time")).toHaveValue("");
    }
  });
});
