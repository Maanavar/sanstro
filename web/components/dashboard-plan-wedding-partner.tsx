"use client";

import { useEffect, useState } from "react";

import { listBirthProfiles } from "@vinaadi/shared/api";

import type { Lang } from "@/lib/i18n";
import type { NaalCouple, WeddingRole } from "@/lib/muhurtham-naal";
import type { BirthProfileResponse } from "@/lib/types";
import { NovaSelect } from "./nova-select";
import type { NovaSelectOption } from "./nova-select";
import { Card } from "./ui";
import { FieldShell } from "./ui/field";
import { Segmented } from "./ui/segmented";

/**
 * "Whose charts decide a wedding date?" — asked once for the whole Plan →
 * Muhurta panel, and read by both the detailed search (weddings only) and the
 * published Muhurtham Naal list.
 *
 * A wedding date has always had two charts. Chandrashtama and Tara Bala are
 * per-person gates, so a date read against one chart can be Naidhana for the
 * other and still be printed as recommended. The Muhurta Finder in Tools fixed
 * that for typed-in details on 2026-09-12; this is the signed-in half, where the
 * partner is a chart the user has already saved. Scoring is identical — the
 * weaker side governs each check — see docs/MUHURTA_COUPLE_SIGNED_IN_2026-09-15.md.
 *
 * Asked here rather than inside each surface: two copies of the same radio group
 * on one page would be two controls bound to one answer, and a reader changing
 * one would not expect the other to move.
 */

export type WeddingChoice = {
  mode: "solo" | "couple";
  /** What the chart the panel is open on is. The partner takes the complement. */
  subjectRole: WeddingRole;
  partnerChartId: string;
};

export const INITIAL_WEDDING_CHOICE: WeddingChoice = { mode: "solo", subjectRole: "PERSON", partnerChartId: "" };

const ROLE_COPY: Record<WeddingRole, { en: string; ta: string }> = {
  BRIDE: { en: "Bride", ta: "மணமகள்" },
  GROOM: { en: "Groom", ta: "மணமகன்" },
  PERSON: { en: "Not specified", ta: "குறிப்பிடவில்லை" },
};

const RELATIONSHIP_COPY: Partial<Record<BirthProfileResponse["relationshipToOwner"], { en: string; ta: string }>> = {
  self: { en: "your profile", ta: "உங்கள் சுயவிவரம்" },
  spouse: { en: "spouse", ta: "வாழ்க்கைத் துணை" },
  child: { en: "child", ta: "குழந்தை" },
  parent: { en: "parent", ta: "பெற்றோர்" },
  sibling: { en: "sibling", ta: "உடன்பிறப்பு" },
  grandparent: { en: "grandparent", ta: "தாத்தா / பாட்டி" },
};

/** A role preselected from the saved profile's own gender, never guessed beyond it.
 *  The role is scoring-relevant — Ch. XIV p.79's Jupiter rule is read from the
 *  bride's chart — so an unknown gender stays "Not specified", which keeps that
 *  rule silent rather than applying it to the wrong chart. */
export function defaultRoleFor(profile: Pick<BirthProfileResponse, "genderForTraditionalRules"> | null | undefined): WeddingRole {
  const gender = (profile?.genderForTraditionalRules ?? "").trim().toLowerCase();
  if (gender === "female") return "BRIDE";
  if (gender === "male") return "GROOM";
  return "PERSON";
}

/** Saved charts that can be the other half of a couple with `activeChartId`.
 *
 *  A spouse sorts first; the rest keep the API's newest-first order. A profile
 *  with no chart is dropped — the API no longer calculates one without a birth
 *  time. A chart whose profile has no birth time (legacy rows from before that
 *  rule) stays in the list but disabled, with the reason in its label: hiding it
 *  would leave a reader looking for a chart they know they saved. */
export function partnerOptions(
  profiles: BirthProfileResponse[],
  activeChartId: string | null,
  lang: Lang,
): NovaSelectOption[] {
  return profiles
    .filter((profile) => profile.chartId && profile.chartId !== activeChartId)
    .map((profile, index) => ({ profile, index }))
    .sort((a, b) => {
      const spouse = Number(b.profile.relationshipToOwner === "spouse") - Number(a.profile.relationshipToOwner === "spouse");
      return spouse !== 0 ? spouse : a.index - b.index;
    })
    .map(({ profile }) => {
      const relation = RELATIONSHIP_COPY[profile.relationshipToOwner];
      const parts = [profile.displayName, relation ? relation[lang] : null].filter(Boolean);
      const timed = Boolean(profile.birthTimeLocal);
      const untimed = lang === "ta" ? " — பிறந்த நேரம் சேமிக்கப்படவில்லை" : " — no birth time saved";
      return {
        value: profile.chartId as string,
        label: `${parts.join(" · ")}${timed ? "" : untimed}`,
        disabled: !timed,
      };
    });
}

/** The partner to preselect: the one timed spouse, and only when there is exactly one. */
export function suggestedPartner(profiles: BirthProfileResponse[], activeChartId: string | null): string {
  const spouses = profiles.filter(
    (profile) => profile.relationshipToOwner === "spouse" && profile.chartId && profile.chartId !== activeChartId && profile.birthTimeLocal,
  );
  return spouses.length === 1 ? (spouses[0].chartId as string) : "";
}

/** What is actually sent. Null — one chart — until the couple is complete: a
 *  couple chosen with no partner, or with an untimed first chart the backend
 *  would refuse, must read as one chart, and the surfaces say so. */
export function coupleFromChoice(choice: WeddingChoice, activeChartTimed: boolean): NaalCouple | null {
  if (choice.mode !== "couple" || !choice.partnerChartId || !activeChartTimed) return null;
  return { partnerChartId: choice.partnerChartId, subjectRole: choice.subjectRole };
}

/** The couple parameters for the quick month date scan, and nothing otherwise.
 *
 *  Keyed on the scan's own `marriage` activity, not on the muhurta activity it
 *  hands off to: the panel also maps family harmony and child birth onto the
 *  wedding muhurta, and neither is a rite elected on two charts. The scan has
 *  no role-dependent rule, so a solo role is not sent. */
export function scanWeddingParams(
  scanActivity: string,
  couple: NaalCouple | null,
): { partnerChartId?: string; subjectRole?: WeddingRole } {
  if (scanActivity !== "marriage" || !couple) return {};
  return { partnerChartId: couple.partnerChartId, subjectRole: couple.subjectRole };
}

export function useSavedProfiles(): { profiles: BirthProfileResponse[] | null; failed: boolean } {
  const [profiles, setProfiles] = useState<BirthProfileResponse[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // `listBirthProfiles` calls `getApiClient()`, which throws synchronously when
    // the client is not initialised; starting from a resolved promise puts that
    // throw on the rejection path (same pattern as the picker's Tamil months).
    Promise.resolve()
      .then(() => listBirthProfiles())
      .then((response) => { if (!cancelled) setProfiles(response.data ?? []); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);
  return { profiles, failed };
}

const noteStyle = { margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 } as const;

export function WeddingPartnerControl({
  lang,
  chartId,
  profiles,
  failed,
  value,
  onChange,
}: {
  lang: Lang;
  chartId: string | null;
  profiles: BirthProfileResponse[] | null;
  failed: boolean;
  value: WeddingChoice;
  onChange: (next: WeddingChoice) => void;
}) {
  const options = profiles ? partnerOptions(profiles, chartId, lang) : [];
  const activeProfile = profiles?.find((profile) => profile.chartId === chartId) ?? null;
  const activeUntimed = Boolean(activeProfile && !activeProfile.birthTimeLocal);
  const couple = value.mode === "couple";
  const roleLabel = lang === "ta" ? "இந்த ஜாதகம் யாருடையது?" : "This chart is the";

  return (
    <Card variant="soft" compact>
      <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
        {lang === "ta" ? "திருமண நாட்கள் · யாருடைய ஜாதகம்" : "Wedding dates · whose charts"}
      </p>
      <p style={{ ...noteStyle, marginBottom: "12px" }}>
        {lang === "ta"
          ? "திருமணத்திற்கு — கீழே உள்ள விரைவு தேதி தேடல், விரிவான தேடல், வெளியிடப்பட்ட முகூர்த்த நாட்கள் மூன்றுக்கும் இது பொருந்தும்."
          : "Applies to a wedding in all three below: the quick date scan, the detailed search and the published muhurtham dates."}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "10px" }}>
        <FieldShell label={lang === "ta" ? "எந்த ஜாதகத்தை வைத்துச் சரிபார்க்க" : "Check the dates against"} style={{ flex: "0 1 auto" }}>
          <Segmented<WeddingChoice["mode"]>
            value={value.mode}
            onChange={(mode) => onChange({ ...value, mode })}
            ariaLabel={lang === "ta" ? "எந்த ஜாதகத்தை வைத்துச் சரிபார்க்க" : "Check the dates against"}
            options={[
              { key: "solo", label: lang === "ta" ? "இந்த ஜாதகம் மட்டும்" : "This chart only" },
              { key: "couple", label: lang === "ta" ? "மணமகள் & மணமகன்" : "Bride and groom" },
            ]}
          />
        </FieldShell>

        <FieldShell label={roleLabel} style={{ flex: "0 1 auto" }}>
          <Segmented<WeddingRole>
            value={value.subjectRole}
            onChange={(subjectRole) => onChange({ ...value, subjectRole })}
            ariaLabel={roleLabel}
            options={(["BRIDE", "GROOM", "PERSON"] as const).map((role) => ({ key: role, label: ROLE_COPY[role][lang] }))}
          />
        </FieldShell>

        {couple && options.length > 0 && (
          <FieldShell label={lang === "ta" ? "இணையரின் சேமித்த ஜாதகம்" : "Partner's saved chart"} style={{ flex: "1 1 240px" }}>
            <NovaSelect
              value={value.partnerChartId}
              onChange={(partnerChartId) => onChange({ ...value, partnerChartId })}
              placeholder={lang === "ta" ? "-- இணையரைத் தேர்ந்தெடுக்கவும் --" : "-- Choose your partner's chart --"}
              ariaLabel={lang === "ta" ? "இணையரின் சேமித்த ஜாதகம்" : "Partner's saved chart"}
              options={options}
            />
          </FieldShell>
        )}
      </div>

      {couple && failed && (
        <p role="alert" style={{ ...noteStyle, color: "var(--color-low)" }}>
          {lang === "ta" ? "சேமித்த ஜாதகங்களைப் பெற முடியவில்லை — இப்போதைக்கு இந்த ஜாதகம் மட்டுமே சரிபார்க்கப்படும்." : "Your saved charts could not be loaded — only this chart is being checked for now."}
        </p>
      )}
      {couple && profiles && options.length === 0 && (
        <p style={noteStyle}>
          {lang === "ta"
            ? "வேறு சேமித்த ஜாதகம் இல்லை. இருவருக்கும் நாட்களைச் சரிபார்க்க, குடும்பம் & ஜாதகங்கள் பகுதியில் இணையரின் பிறப்பு விவரங்களைச் சேர்க்கவும்."
            : "No other saved chart yet. Add your partner's birth details under Family & Charts to check dates for both of you."}
        </p>
      )}
      {couple && activeUntimed && (
        <p style={{ ...noteStyle, color: "var(--color-mid-text)" }}>
          {lang === "ta"
            ? "இந்த ஜாதகம் பிறந்த நேரம் இல்லாமல் சேமிக்கப்பட்டுள்ளது, எனவே இணையருடன் சேர்த்துச் சரிபார்க்க முடியாது. குடும்பம் & ஜாதகங்கள் பகுதியில் பிறந்த நேரத்தைச் சேர்க்கவும்."
            : "This chart was saved without a birth time, so it cannot be checked as half of a couple. Add the birth time under Family & Charts."}
        </p>
      )}
      <p style={noteStyle}>
        {couple
          ? (lang === "ta"
            ? "இரு ஜாதகங்களும் சரிபார்க்கப்படும். இருவரில் ஒருவருக்குச் சந்திராஷ்டமம் அல்லது கெட்ட தாரா பலம் இருந்தால் அந்நாள் பரிந்துரைக்கப்படாது — இருவரில் பலவீனமான நிலையே முகூர்த்தத்தை முடிவு செய்யும்."
            : "Both charts are checked. Chandrashtama or an adverse Tara Bala on either side keeps a day off the recommended list — a wedding date is only as good as its harder half.")
          : (lang === "ta"
            ? "இந்த ஜாதகம் மட்டுமே சரிபார்க்கப்படும். திருமணத்திற்கு மற்றவரின் சந்திராஷ்டமமும் தாரா பலமும் இதில் கணக்கிடப்படாது."
            : "Only this chart is checked. For a wedding, the other person's Chandrashtama and Tara Bala are not weighed at all.")}
      </p>
      {couple && (
        <p style={{ ...noteStyle, marginTop: "6px" }}>
          {lang === "ta"
            ? "இரு ஜாதகங்களில் பார்க்கப்படுவது திருமணம் மட்டுமே. மற்ற சடங்குகள் யாருக்காக நடக்கிறதோ அவரின் ஜாதகத்தில் பார்க்கப்படும் — அதற்கு அந்த ஜாதகத்தைத் திறக்கவும்."
            : "Only a wedding is read on two charts. Every other rite is checked on the chart of the person it is for — open that chart to plan it."}
        </p>
      )}
    </Card>
  );
}
