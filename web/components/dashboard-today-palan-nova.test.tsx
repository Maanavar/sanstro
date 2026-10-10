import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { PersonalPalan, PalanPolarity } from "@/lib/types";
import { DashboardTodayPalanNova, type PalanMember } from "./dashboard-today-palan-nova";

const AREAS = [
  "CAREER", "BUSINESS", "MONEY", "FAMILY", "LOVE", "HEALTH",
  "EDUCATION", "TRAVEL", "DOCUMENTS", "FRIENDS", "COMMUNICATION", "MIND",
] as const;

function palan(tag: string, overall: PalanPolarity = "MIXED"): PersonalPalan {
  return {
    contentVersion: "test",
    reviewStatus: "OWNER_COMMISSIONED_DRAFT",
    overallPolarity: overall,
    overall: { ta: `${tag} மொத்தம்`, en: `${tag} overall` },
    areas: AREAS.map((area) => ({
      area,
      polarity: area === "HEALTH" ? "CAUTION" : "FAVOURABLE",
      text: { ta: `${tag} ${area} த`, en: `${tag} ${area} line` },
    })),
    advice: { ta: "அறிவுரை", en: `${tag} advice` },
    worship: { ta: "வழிபாடு வரி", en: `${tag} worship` },
    closing: { ta: "முடிவு வரி", en: `${tag} closing` },
    strength: { ta: "பலம்", en: "focus" },
    watch: { ta: "கவனம்", en: "sleep and rest" },
    opportunityArea: "CAREER",
    cautionArea: "HEALTH",
    bestWindow: { type: "PERSONAL_HORA", start: "13:42", end: "15:18", isPersonal: true },
    basis: {
      moonHouse: 11, tara: 6,
      taraName: { ta: "சாதனை", en: "Sadhana" },
      isChandrashtama: false,
      text: { ta: "அடிப்படை", en: `${tag} basis house 11` },
    },
  } as PersonalPalan;
}

const members: PalanMember[] = [
  { memberId: "me", displayName: "Synthetic Reader", palan: palan("SELF", "FAVOURABLE"), isSelf: true },
  { memberId: "m2", displayName: "Test Amma", palan: palan("AMMA", "CAUTION"), isSelf: false },
];

describe("DashboardTodayPalanNova", () => {
  it("leads with the reader's focus areas and keeps the rest one tap away", () => {
    render(<DashboardTodayPalanNova lang="en" members={members} focusArea="HEALTH" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("SELF HEALTH line");
    expect(items[1]).toHaveTextContent("SELF MIND line");

    fireEvent.click(screen.getByRole("button", { name: /9 more areas/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
  });

  it("shows the hero's window as the best part of the day in the reader's language", () => {
    const { rerender } = render(<DashboardTodayPalanNova lang="en" members={members} focusArea={null} />);
    expect(screen.getByText("1:42 pm–3:18 pm")).toBeInTheDocument();
    rerender(<DashboardTodayPalanNova lang="ta" members={members} focusArea={null} />);
    expect(screen.getByText("மதியம் 1:42 – மதியம் 3:18")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "இன்றைய பலன் · உங்கள் ஜாதகப்படி" })).toBeInTheDocument();
  });

  it("switches to a family member's own palan with neutral area order", () => {
    render(<DashboardTodayPalanNova lang="en" members={members} focusArea="HEALTH" />);
    const group = screen.getByRole("group", { name: "Whose palan" });
    fireEvent.click(within(group).getByRole("button", { name: "Test Amma" }));
    expect(screen.getByRole("heading", { name: "Test Amma · today" })).toBeInTheDocument();
    expect(screen.getByText("AMMA overall")).toBeInTheDocument();
    expect(screen.queryByText("SELF overall")).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("AMMA CAREER line");
    expect(items[1]).toHaveTextContent("AMMA MONEY line");
    expect(items[2]).toHaveTextContent("AMMA FAMILY line");
  });

  it("hides the member chips when only the reader has a palan", () => {
    render(<DashboardTodayPalanNova lang="en" members={[members[0]]} focusArea={null} />);
    expect(screen.queryByRole("group", { name: "Whose palan" })).not.toBeInTheDocument();
    expect(screen.getByText("SELF closing")).toBeInTheDocument();
  });

  it("names its basis only on request", () => {
    render(<DashboardTodayPalanNova lang="en" members={members} focusArea={null} />);
    expect(screen.queryByText("SELF basis house 11")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /What is this read from/ }));
    expect(screen.getByText("SELF basis house 11")).toBeInTheDocument();
  });
});

describe("DashboardTodayPalanNova — period layer", () => {
  function withPeriod(tag: string): PersonalPalan {
    const base = palan(tag);
    return {
      ...base,
      areas: base.areas.map((area) =>
        area.area === "COMMUNICATION"
          ? { ...area, periodNote: { ta: "ஏழரை சனி குறிப்பு", en: `${tag} sani note` } }
          : area,
      ),
      dashaAreas: ["COMMUNICATION", "TRAVEL"],
      period: {
        mahaLord: "SATURN", antarLord: "MERCURY", saniCycle: "EZHARAI_SANI_PHASE_3", kandakaHouse: null,
        guruHouse: 6, saturnHouse: 2, rahuHouse: 1, antarHouses: [3, 12],
        antarTransitHouse: 4, antarTransitSupportive: true,
        text: { ta: "தசை வரி", en: `${tag} dasha line` },
      },
    };
  }

  it("names the season through the localisers and shows each area's season clause", () => {
    const one = [{ memberId: "me", displayName: "Synthetic Reader", palan: withPeriod("SELF"), isSelf: true }];
    const { rerender } = render(<DashboardTodayPalanNova lang="en" members={one} focusArea={null} />);
    const season = screen.getByRole("region", { name: "This period" });
    expect(season).toHaveTextContent("Saturn dasa · Mercury bhukti");
    expect(season).toHaveTextContent("SELF dasha line");
    expect(season).toHaveTextContent("In focus this period: Communication, Travel & vehicle");
    expect(screen.getByText("SELF sani note")).toBeInTheDocument();

    rerender(<DashboardTodayPalanNova lang="ta" members={one} focusArea={null} />);
    const ta = screen.getByRole("region", { name: "இக்காலம்" });
    expect(ta).toHaveTextContent("ஏழரை சனி");
    expect(ta).not.toHaveTextContent(/EZHARAI|SATURN|MERCURY/);
  });

  it("leads with the bhukti's areas when there is no focus, and gives it the third slot when there is", () => {
    const self = { memberId: "me", displayName: "Synthetic Reader", palan: withPeriod("SELF"), isSelf: true };
    const { rerender } = render(<DashboardTodayPalanNova lang="en" members={[self]} focusArea={null} />);
    const areaList = () => screen.getAllByRole("list").find((list) => list.tagName === "UL" && within(list).queryAllByText(/line$/).length > 0)!;
    let items = within(areaList()).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("SELF COMMUNICATION line"),
      expect.stringContaining("SELF TRAVEL line"),
      expect.stringContaining("SELF CAREER line"),
    ]);
    rerender(<DashboardTodayPalanNova lang="en" members={[self]} focusArea="HEALTH" />);
    items = within(areaList()).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("SELF HEALTH line");
    expect(items[1]).toHaveTextContent("SELF MIND line");
    expect(items[2]).toHaveTextContent("SELF COMMUNICATION line");
  });
});

describe("DashboardTodayPalanNova — presenter mode", () => {
  const transcript = [
    { kind: "OVERALL", text: { ta: "மொத்தப் பலன் வரி.", en: "Overall line." } },
    { kind: "PERIOD", text: { ta: "காலம் வரி.", en: "Period line." } },
    { kind: "AREA", area: "CAREER", text: { ta: "வேலை வரி.", en: "Career line." } },
    { kind: "AREA", area: "MONEY", text: { ta: "பண வரி.", en: "Money line." } },
    { kind: "TIME", text: { ta: "நேர வரி.", en: "Time line." } },
    { kind: "ADVICE", text: { ta: "அறிவுரை வரி.", en: "Advice line." } },
    { kind: "WORSHIP", text: { ta: "வழிபாடு வரி.", en: "Worship line." } },
    { kind: "CLOSING", text: { ta: "முடிவு வரி.", en: "Closing line." } },
  ] as PersonalPalan["transcript"];
  const reader = (withTranscript: boolean): PalanMember[] => [{
    memberId: "me", displayName: "Synthetic Reader", isSelf: true,
    palan: { ...palan("SELF"), transcript: withTranscript ? transcript : [] },
  }];

  beforeEach(() => { try { localStorage.clear(); } catch { /* storage unavailable */ } });

  it("offers the presenter view only when the server sent a transcript", () => {
    render(<DashboardTodayPalanNova lang="en" members={reader(false)} focusArea={null} />);
    expect(screen.queryByRole("tab", { name: "Presenter style" })).not.toBeInTheDocument();
  });

  it("reads the whole palan in speaking order, greeting the person by first name", () => {
    const { container } = render(<DashboardTodayPalanNova lang="en" members={reader(true)} focusArea={null} />);
    // TV presenter: running paragraphs, no area headings or cue labels.
    expect(screen.queryByText("Career")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-palan-transcript] p").length).toBeLessThanOrEqual(4);
    // Presenter style is the default: no click needed.
    expect(screen.getByRole("tab", { name: "Presenter style" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Good day, Synthetic.")).toBeInTheDocument();
    const spoken = Array.from(container.querySelectorAll("[data-palan-transcript] [data-kind]")).map((node) => node.getAttribute("data-kind"));
    expect(spoken).toEqual(["OVERALL", "PERIOD", "AREA", "AREA", "TIME", "ADVICE", "WORSHIP", "CLOSING"]);
    // The by-area rows are not shown alongside it.
    expect(screen.queryByText("SELF CAREER line")).not.toBeInTheDocument();
    // Switching to By area is remembered, and switching back restores the script.
    fireEvent.click(screen.getByRole("tab", { name: "By area" }));
    expect(localStorage.getItem("vinaadi-palan-mode")).toBe("areas");
    expect(screen.getByText("SELF CAREER line")).toBeInTheDocument();
    expect(container.querySelector("[data-palan-transcript]")).toBeNull();
  });

  it("opens by area for a reader who chose it last time", () => {
    localStorage.setItem("vinaadi-palan-mode", "areas");
    const { container } = render(<DashboardTodayPalanNova lang="en" members={reader(true)} focusArea={null} />);
    expect(container.querySelector("[data-palan-transcript]")).toBeNull();
    expect(screen.getByRole("tab", { name: "By area" })).toHaveAttribute("aria-selected", "true");
  });

  it("speaks Tamil in Tamil by default", () => {
    const { container } = render(<DashboardTodayPalanNova lang="ta" members={reader(true)} focusArea={null} />);
    const block = container.querySelector("[data-palan-transcript]");
    expect(block).toHaveAttribute("lang", "ta");
    expect(block).toHaveTextContent("Synthetic, வணக்கம்!");
    expect(block).toHaveTextContent("வேலை வரி.");
    expect(block).not.toHaveTextContent(/Career line/);
  });
});

describe("DashboardTodayPalanNova — lucky aspects (R9)", () => {
  const withLucky = (direction: boolean): PalanMember[] => [{
    memberId: "me", displayName: "Synthetic Reader", isSelf: true,
    palan: {
      ...palan("SELF"),
      lucky: {
        graha: "JUPITER", source: "BEST_HORA",
        colour: { ta: "மஞ்சள்", en: "yellow" }, number: 3,
        direction: direction ? "NORTH_EAST" : null,
        directionName: direction ? { ta: "வடகிழக்கு", en: "north-east" } : null,
        soolam: "SOUTH", soolamName: { ta: "தெற்கு", en: "south" },
        text: { ta: "விதி வரி", en: "Rule line: Brihat Parashara Hora Shastra ch. 3." },
      },
    },
  }];

  it("shows colour, number and direction, names the soolam, and keeps the rule one tap away", () => {
    render(<DashboardTodayPalanNova lang="en" members={withLucky(true)} focusArea={null} />);
    expect(screen.getByText("Colour yellow · number 3 · direction north-east")).toBeInTheDocument();
    expect(screen.getByText("south")).toBeInTheDocument();
    expect(screen.getByText("Travel that way is best avoided")).toBeInTheDocument();
    expect(screen.queryByText(/Rule line/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Why these/ }));
    expect(screen.getByText(/Rule line/)).toBeInTheDocument();
  });

  it("drops the direction when the server withheld it, in Tamil too", () => {
    render(<DashboardTodayPalanNova lang="ta" members={withLucky(false)} focusArea={null} />);
    expect(screen.getByText("நிறம் மஞ்சள் · எண் 3")).toBeInTheDocument();
    expect(screen.getByText("தெற்கு")).toBeInTheDocument();
    expect(screen.getByText("அத்திசைப் பயணம் தவிர்ப்பது நல்லது")).toBeInTheDocument();
  });
});
