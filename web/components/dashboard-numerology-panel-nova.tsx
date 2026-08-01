"use client";

import { useMemo, useState } from "react";

import type { Lang } from "@/lib/i18n";

import { NumerologyAlignmentSection } from "./dashboard-numerology-alignment-nova";
import { NumerologyCycleSection } from "./dashboard-numerology-cycle-nova";
import { NumerologyNamesSection } from "./dashboard-numerology-names-nova";
import { NovaSelect } from "./nova-select";
import { Card } from "./ui/card";
import { Segmented } from "./ui/segmented";

/**
 * The numerology tool (Phase 7), hosted in the Tools tab.
 *
 * ## Why Tools and not a tab of its own
 *
 * The IA spec (docs/dashboard-ia-audit-2026-07-22.md) resolved D2 as "keep one
 * tab, de-duplicate" and its guiding principle is *one artifact → exactly one
 * canonical home*. Tools already declares itself "calculators that know your
 * charts", which is precisely what chart-aware numerology is: an instrument
 * applied to a saved chart, not a new lens on the chart itself. Putting it here
 * costs no change to the `Tab` union, the localStorage restore allowlist, or the
 * `?tab=` sanitizers — all four of which have to move together.
 *
 * ## The three views, and why Dates is not one of them
 *
 * **Dates was cut on 2026-07-29** because both halves of it duplicated surfaces
 * this product already ships, and duplication was the whole of its content:
 *
 * - *Activity dates* re-ran the muhurta engine that the **Activity Timing**
 *   tool, two cards away in this same Tools tab, already runs — same
 *   `find_best_muhurta_slots`, same seven activities. Its own header copy
 *   admitted it: "the same slots the muhurta engine returned — nothing added,
 *   nothing removed."
 * - *Marriage naals* re-ran `match_muhurtham_naals`, which is the public
 *   `/muhurtham-naal/[year]` page.
 *
 * What numerology contributed to either was one bounded column (`adjustment`,
 * capped at ±8, and unable to lift a date the panchangam has flagged) — a
 * modifier on someone else's reading, not a reading of its own. That does not
 * earn a quarter of this tool's navigation. The favourable-numbers strip it
 * also carried was never unique to it; the alignment view already renders the
 * same numbers from `getFavourableNumbers`.
 *
 * The backend routes (`lucky-dates`, `marriage-dates`) are untouched and still
 * tested. Putting that column where the dates actually live means adding
 * numerology fields to `/api/v1/activity-timing` — a shared, non-numerology
 * route — and the public naal page is chart-less so it cannot carry a
 * chart-scoped number at all. Both are deliberately left undone rather than
 * half-done here.
 *
 * ## What is still deliberately missing
 *
 * **Peyar Porutham (NUM-34).** The numbers ship and every summary sentence is
 * withheld. The deciding instrument — Jathagam Porutham — already renders in
 * full on the Compatibility tool, so a numerology second opinion with its
 * reasoning removed would add tokens next to a complete reading. It gets built
 * when the corpus lands, rather than shipped as blank space now.
 *
 * Name correction is no longer on this list: it moved into the **Names** view
 * on 2026-07-29, once its legal warning was split off the corpus-wide review
 * gate that had been withholding every alternative.
 *
 * **Baby names (NUM-50/51/52) is deliberately NOT here.** It was a view on
 * this panel for one same-day iteration (2026-07-30) and was pulled back out:
 * the person it is for — a baby with no saved chart yet — cannot be reached
 * through a "Reading for" picker that only lists profiles that already exist.
 * It is its own Tools-tab card instead (`dashboard-tools-baby-names-nova.tsx`,
 * `activeTool === "babynames"`), taking raw birth details the same way
 * Jadhagam Generator does, with no dependency on this panel or its chart.
 *
 * ## Reading for a family member
 *
 * `members` carries every other vault member who already has a saved chart —
 * the same `MemberChart[]` the Compatibility tool reads, so no extra fetch is
 * added here. Ownership is enforced server-side (`_assert_chart_owner` in
 * `app/api/numerology.py` checks `profile.owner_user_id`, and a family
 * member's chart is owned by the vault owner too), so switching the selector
 * is purely a `chartId` swap — no new authorization path. Each section below
 * is remounted (`key={activeChartId}`) on switch so in-progress form state
 * (draft names, date ranges) never bleeds from one person's reading to
 * another's.
 */

export type NumerologyMemberOption = {
  memberId: string;
  displayName: string;
  chartId: string;
};

type Props = {
  lang: Lang;
  chartId: string;
  /** Other family members with a saved chart. Omit or pass `[]` for the
   *  solo case — the picker only renders when there is someone to switch to. */
  members?: NumerologyMemberOption[];
};

type NumerologyView = "alignment" | "cycle" | "names";

export function NumerologyPanel({ lang, chartId, members = [] }: Props) {
  const isTamil = lang === "ta";
  const [view, setView] = useState<NumerologyView>("alignment");

  const options = useMemo<NumerologyMemberOption[]>(
    () => [{ memberId: "owner", displayName: isTamil ? "நீங்கள்" : "You", chartId }, ...members],
    [chartId, members, isTamil],
  );
  const [selectedMemberId, setSelectedMemberId] = useState("owner");
  const activeChartId = options.find((o) => o.memberId === selectedMemberId)?.chartId ?? chartId;

  if (!chartId) {
    return (
      <Card variant="dashed">
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
          {isTamil
            ? "இந்தக் கருவிக்கு சேமிக்கப்பட்ட ஜாதகம் தேவை."
            : "This tool needs a saved chart."}
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--display-sm)",
            fontWeight: 600,
            color: "var(--color-text-strong)",
          }}
        >
          {isTamil ? "எண் கணிதம்" : "Numerology"}
        </h2>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.6, maxWidth: "62ch" }}>
          {isTamil
            ? "கல்தேய எண்கள், உங்கள் சொந்த ஜாதகத்திற்கு எதிராகப் படிக்கப்படுகின்றன. ஒரு எண் ஒருபோதும் ஒரு கிரகத்தை மீறாது — இங்குள்ள ஒவ்வொரு மதிப்பெண்ணும் கிரகத்தின் ஜாதகப் பங்கிலிருந்து வருகிறது."
            : "Chaldean numbers, read against your own jadhagam. A number never overrides a graha — every score here is a function of what that number's graha actually does in this chart."}
        </p>
      </div>

      {options.length > 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "320px" }}>
          <label
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              color: "var(--color-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {isTamil ? "யாருக்கான வாசிப்பு" : "Reading for"}
          </label>
          <NovaSelect
            value={selectedMemberId}
            onChange={setSelectedMemberId}
            ariaLabel={isTamil ? "யாருக்கான வாசிப்பு" : "Reading for"}
            options={options.map((o) => ({ value: o.memberId, label: o.displayName }))}
          />
        </div>
      )}

      <Segmented
        ariaLabel={isTamil ? "எண் கணிதப் பார்வைகள்" : "Numerology views"}
        value={view}
        onChange={setView}
        options={[
          { key: "alignment", label: isTamil ? "இணக்கம்" : "Alignment" },
          { key: "cycle", label: isTamil ? "சுழற்சி" : "Cycle" },
          { key: "names", label: isTamil ? "பெயர்கள்" : "Names" },
        ]}
      />

      {view === "alignment" ? <NumerologyAlignmentSection key={activeChartId} lang={lang} chartId={activeChartId} /> : null}
      {view === "cycle" ? <NumerologyCycleSection key={activeChartId} lang={lang} chartId={activeChartId} /> : null}
      {view === "names" ? <NumerologyNamesSection key={activeChartId} lang={lang} chartId={activeChartId} /> : null}
    </div>
  );
}
