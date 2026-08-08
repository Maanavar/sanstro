"use client";

import { tPlanetLord, type Lang } from "@/lib/i18n";
import { getAshtottariDasha } from "@vinaadi/shared/api/ashtottariDasha";
import { useApiQuery } from "@/hooks/useApiQuery";
import { SecondaryDashaPanel } from "./dashboard-secondary-dasha-panel";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

// Ashtottari Dasha — 108-year secondary/comparison dasha, 8 lords, no Ketu.
// See app/calculations/ashtottari_dasha.py for the documented Ardra-adi
// (B.V. Raman / Jataka Parijata) nakshatra-lord convention this project uses.
//
// The local nine-row label map is gone. It said "சுக்ரன்" for Venus where the
// rest of the app says "சுக்கிரன்", as did three sibling panels — each copy was
// internally consistent, which is exactly why no test saw it and why the fix is
// deleting the copies rather than correcting them. `tPlanetLord` is canonical.
function lordName(lord: string, isTamil: boolean): string {
  return tPlanetLord(lord, isTamil ? "ta" : "en");
}

// Applies / Does not apply / Needs review — informational, never hides the
// timeline (parity with the conditional-dasha selector). See app/calculations/
// ashtottari_dasha.py for the classical rule and why it is disclosed, not gated.
function StatusChip({ applicable, lang }: { applicable: boolean | null; lang: Lang }) {
  const isTamil = lang === "ta";
  const config =
    applicable === true
      ? { label: isTamil ? "பொருந்தும்" : "Applies", bg: "var(--color-high-bg)", fg: "var(--color-high)", bd: "var(--color-high-border)" }
      : applicable === false
        ? { label: isTamil ? "பொருந்தாது" : "Does not apply", bg: "var(--color-surface-soft)", fg: "var(--color-muted)", bd: "var(--color-border)" }
        : { label: isTamil ? "மதிப்பாய்வு தேவை" : "Needs review", bg: "var(--color-high-bg)", fg: "var(--color-text-strong)", bd: "var(--color-high-border)" };
  return (
    <span
      style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "var(--space-1) var(--space-2)",
        borderRadius: "var(--radius-pill)",
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

type Props = {
  lang: Lang;
  chartId: string;
};

export function AshtottariDashaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const { data, state, refetch } = useApiQuery({
    key: ["ashtottari-dasha", chartId],
    queryFn: () => getAshtottariDasha(chartId).then((res) => res.data),
    enabled: !!chartId,
  });

  const applicability = data?.applicability;

  return (
    <SecondaryDashaPanel
      lang={lang}
      glossaryTerm="ashtottariDasha"
      title={{ ta: "அஷ்டோத்தரி தசை — 108 ஆண்டு சுழற்சி", en: "Ashtottari Dasha — 108-Year Cycle" }}
      // Experimental caveat, consistent with the other secondary engines (UX #40).
      caveat={{
        ta: " · சோதனை நிலை — காட்சிக்கு மட்டும், மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை",
        en: " · Experimental — display only, not used in any scoring path",
      }}
      error={{ ta: "அஷ்டோத்தரி தசையை ஏற்ற முடியவில்லை.", en: "Could not load Ashtottari Dasha." }}
      state={state}
      onRetry={refetch}
      header={
        applicability ? (
          <Card
            variant="soft"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Kicker color="var(--color-faint)" style={{ letterSpacing: "0.06em" }}>
                {isTamil ? "பாரம்பரிய பொருத்தம்" : "Classical applicability"}
              </Kicker>
              <StatusChip applicable={applicability.applicable} lang={lang} />
            </span>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
              {isTamil ? applicability.ruleTa : applicability.ruleEn}
              {applicability.reason ? ` · ${applicability.reason}` : ""}
            </p>
            {applicability.pakshaSupports !== null && (
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {isTamil ? "இரண்டாம்நிலை (பக்ஷம்/பகல்-இரவு): " : "Secondary (paksha / day-night): "}
                {applicability.pakshaSupports ? (isTamil ? "ஆதரிக்கிறது" : "supports") : (isTamil ? "பூர்த்தியாகவில்லை" : "not met")}
                {applicability.pakshaReason ? ` · ${applicability.pakshaReason}` : ""}
                {applicability.isDayBirthApproximate ? (isTamil ? " (தோராயம்)" : " (approx.)") : ""}
                {/* Honesty on the tradition choice: paksha is disclosed as supportive, */}
                {/* not a gate. When unmet, say so plainly — some lineages require it. */}
                {!applicability.pakshaSupports && (
                  <span>
                    {isTamil
                      ? " — சில பாரம்பரியங்களில் இது கட்டாய இணை-நிபந்தனை; இங்கு ஆதரவாக மட்டுமே கருதப்படுகிறது, மேலே உள்ள முடிவை மாற்றாது."
                      : " — some traditions require this as a co-condition; this reading treats it as supportive only, so it does not change the verdict above."}
                  </span>
                )}
              </p>
            )}
          </Card>
        ) : null
      }
      current={
        data && {
          mahadasha: {
            name: lordName(data.current.mahadasha.lord, isTamil),
            startDate: data.current.mahadasha.startDate,
            endDate: data.current.mahadasha.endDate,
          },
          antardasha: {
            name: lordName(data.current.antardasha.lord, isTamil),
            startDate: data.current.antardasha.startDate,
            endDate: data.current.antardasha.endDate,
          },
        }
      }
      periods={data?.mahadashas.map((period, index) => ({
        key: `${period.startDate}-${index}`,
        name: lordName(period.lord, isTamil),
        years: period.years,
        startDate: period.startDate,
        isCurrent: period.startDate === data.current.mahadasha.startDate,
      }))}
    />
  );
}
