import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardToolsTabNova, type DashboardToolsTabNovaProps } from "./dashboard-tools-tab-nova";
import type { Lang } from "@/lib/i18n";

/**
 * DXA-09's bilingual echo, held in BOTH languages.
 *
 * The browser harness (`web/scripts/ux-audit-core.mjs`) greps the rendered pane
 * for Tamil script, which catches the English-mode half of this defect and
 * nothing else: it pins the audit account to `lang: "en"`, so it has never once
 * rendered this tab in Tamil. The Tamil half is the worse of the two — the
 * kicker read "கருவிகள் · கருவிகள்", the same word twice, which is exactly the
 * shape the owner flagged on the Family member kicker ("ஜாதகம் · ஜாதகம்").
 *
 * So both directions are asserted here, where the language is an input.
 */
const TAMIL_SCRIPT = /[஀-௿]/;

function renderTools(lang: Lang) {
  const props: DashboardToolsTabNovaProps = {
    lang,
    activeTool: null,
    needsProfile: false,
    onOpenTool: () => {},
    onCloseTool: () => {},
    showPorutham: false,
    showChartGenerate: false,
    showWrapped: false,
    showRetrospective: false,
    showRasipalan: false,
    showActivityTiming: false,
    showVarshaphala: false,
    showSynastry: false,
    showNumerology: false,
    showBabyNames: false,
    varshaphalaData: null,
    varshaphalaLoading: false,
    onLoadVarshaphala: () => {},
    personalChartId: "chart-audit-sample",
    selectedDate: "2026-09-18",
    onDateChange: () => {},
    familyMembersForPorutham: [],
    numerologyMembers: [],
    ownerChart: null,
    synastryMemberCharts: [],
    synastryMemberOptions: [],
    relationshipAlerts: [],
    relationshipAlertsLoading: false,
    onGoToPlan: () => {},
    onGoToCalendar: () => {},
    onOpenAskVinaadi: () => {},
  };
  return render(<DashboardToolsTabNova {...props} />);
}

describe("Tools tab renders the active language only (DXA-09)", () => {
  it("prints no Tamil anywhere in English mode", () => {
    const { container } = renderTools("en");

    const tamil = (container.textContent ?? "").match(new RegExp(TAMIL_SCRIPT, "g")) ?? [];
    expect(tamil).toEqual([]);
    expect(screen.getByText("Tools")).toBeTruthy();
  });

  it("does not echo the same Tamil word beside itself in Tamil mode", () => {
    const { container } = renderTools("ta");

    // The page kicker is the word on its own, not "கருவிகள் · கருவிகள்".
    const kicker = container.querySelector(".ui-kicker");
    expect(kicker?.textContent?.trim()).toBe("கருவிகள்");

    // The hero tool still renders (so the assertion below is not passing on a
    // blank tree), and the gloss that used to sit beside its "Most used"
    // kicker — a second Tamil name for the tool titled right underneath — is
    // gone.
    expect(screen.getByText("பொருத்தம் ஓட்டு")).toBeTruthy();
    expect(screen.queryByText("திருமணப் பொருத்தம்")).toBeNull();
  });
});
