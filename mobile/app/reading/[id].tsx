/**
 * Chart reading — the Story view on mobile (FTR-20).
 *
 * Mobile had no reading surface: the web's Family & Charts §9 was the only
 * place the explanation payload was read as a story. This screen renders the
 * same five chapters from the same payload, and — the point of FTR-21 — the
 * same *selections*: which why-lines a planet shows, which yogas lead, what
 * goes in the care column all come from the server's `story` field, so web
 * and mobile cannot pick differently. Fixed copy (chapter titles, pillar and
 * house meanings, strength words) comes from `@vinaadi/shared/reading`.
 *
 * Text-first on purpose: the web's chart map, aspect arrows and dasha bars are
 * not ported in this pass (recorded in docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md).
 * Names render through localisers, never the payload's `*Name` fields
 * (CLAUDE.md "Display boundary"). New Tamil is pending native review.
 */
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { EnType, TamilType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getChartExplanation } from "@/api/charts";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { GRAHA_LABELS, type ChartExplanationData, type ChartExplanationPlanet } from "@vinaadi/shared";
import { tNakshatra } from "@vinaadi/shared/i18n/panchangam-names";
import { displayName, doshamStanding, natalStrengthWord, yogaStanding } from "@vinaadi/shared/yogaDisplay";
import { VERDICT_DOSHAMS, doshamVerdictLine } from "@vinaadi/shared/doshamReckoning";
import { gocharaGrade } from "@vinaadi/shared/api/transits";
import {
  CHAPTER_ORDER,
  CHAPTER_TITLES,
  PILLAR_MEANING,
  houseTheme,
  lagnaLordPlacement,
  rasiName,
  rasiNumberFromCode,
  strengthReassurance,
  strengthVerdict,
  type ChapterId,
} from "@vinaadi/shared/reading";

type Lang = "ta" | "en";
const GRAHA_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"];
const LEVEL_WORD: Record<string, { ta: string; en: string }> = {
  MAHADASHA: { ta: "தசை", en: "Dasa" },
  BHUKTI: { ta: "புக்தி", en: "Bhukti" },
  ANTARAM: { ta: "அந்தரம்", en: "Antaram" },
};

const pick = (text: { ta: string; en: string } | null | undefined, lang: Lang) => (text ? (lang === "ta" ? text.ta : text.en) : "");
const planetName = (graha: string, lang: Lang) => {
  const key = graha === "SANI" ? "SATURN" : graha === "GURU" ? "JUPITER" : graha;
  return pick(GRAHA_LABELS[key as keyof typeof GRAHA_LABELS], lang) || key;
};
const houseLabel = (house: number, lang: Lang) => (lang === "ta" ? `${house}-ஆம் வீடு` : `House ${house}`);

export default function ChartReadingScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang: rawLang } = useI18n();
  const lang: Lang = rawLang === "ta" ? "ta" : "en";
  const type = lang === "ta" ? TamilType : EnType;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chapter, setChapter] = useState<ChapterId>("who");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart-explanation", id],
    queryFn: () => getChartExplanation(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
  const reading = data?.data ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={lang === "ta" ? "பின் செல்" : "Back"}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, type.heading]} numberOfLines={1}>
          {lang === "ta" ? "உங்கள் ஜாதகம், உங்களுக்காக விளக்கம்" : "Your chart, read for you"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading && <SkeletonCard height={320} />}
        {isError && <ErrorCard onRetry={refetch} />}
        {reading && (
          <>
            {reading.story?.headline && <Text style={[styles.headline, type.subheading]}>{pick(reading.story.headline, lang)}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail} accessibilityRole="tablist">
              {CHAPTER_ORDER.map((idKey, index) => {
                const selected = idKey === chapter;
                return (
                  <TouchableOpacity
                    key={idKey}
                    onPress={() => setChapter(idKey)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {index + 1} · {pick(CHAPTER_TITLES[idKey], lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.section}>
              {chapter === "who" && <ChapterWho reading={reading} lang={lang} styles={styles} />}
              {chapter === "planets" && <ChapterPlanets reading={reading} lang={lang} styles={styles} />}
              {chapter === "now" && <ChapterNow reading={reading} lang={lang} styles={styles} />}
              {chapter === "gifts" && <ChapterGifts reading={reading} lang={lang} styles={styles} />}
              {chapter === "coming" && <ChapterComing reading={reading} lang={lang} styles={styles} />}
            </View>
            {CHAPTER_ORDER.indexOf(chapter) < CHAPTER_ORDER.length - 1 && (
              <TouchableOpacity
                style={styles.nextBtn}
                accessibilityRole="button"
                onPress={() => setChapter(CHAPTER_ORDER[CHAPTER_ORDER.indexOf(chapter) + 1])}
              >
                <Text style={styles.nextText}>
                  {lang === "ta" ? "அடுத்து" : "Next"}: {pick(CHAPTER_TITLES[CHAPTER_ORDER[CHAPTER_ORDER.indexOf(chapter) + 1]], lang)} →
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ChapterProps = { reading: ChartExplanationData; lang: Lang; styles: ReturnType<typeof makeStyles> };

function Card({ styles, children }: { styles: ChapterProps["styles"]; children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function ChapterWho({ reading, lang, styles }: ChapterProps) {
  const anyPlanet = reading.planets[0];
  const lagnaRasi = anyPlanet ? ((anyPlanet.rasi - anyPlanet.houseFromLagna + 12) % 12) + 1 : null;
  const moon = reading.planets.find((p) => p.graha === "MOON") ?? null;
  const lord = lagnaRasi ? lagnaLordPlacement(lagnaRasi, reading.planets) : null;
  const edge = reading.coreIdentity.lagnaEdgeNote;
  const pillars = [
    lagnaRasi && { key: "lagna", term: lang === "ta" ? "லக்னம்" : "Lagna", name: rasiName(lagnaRasi, lang), meaning: pick(PILLAR_MEANING.lagna, lang) },
    moon && { key: "rasi", term: lang === "ta" ? "ராசி (சந்திரன்)" : "Rasi (Moon sign)", name: rasiName(moon.rasi, lang), meaning: pick(PILLAR_MEANING.rasi, lang) },
    moon && {
      key: "star",
      term: lang === "ta" ? "நட்சத்திரம்" : "Birth star",
      name: `${tNakshatra(moon.nakshatraName, lang)} · ${lang === "ta" ? "பாதம்" : "pada"} ${moon.pada}`,
      meaning: pick(PILLAR_MEANING.star, lang),
    },
  ].filter(Boolean) as { key: string; term: string; name: string; meaning: string }[];
  return (
    <>
      {pillars.map((p) => (
        <Card key={p.key} styles={styles}>
          <Text style={styles.kicker}>{p.term}</Text>
          <Text style={styles.big}>{p.name}</Text>
          <Text style={styles.quiet}>{p.meaning}</Text>
        </Card>
      ))}
      {lord && (
        <Text style={styles.body}>
          {lang === "ta"
            ? `லக்னாதிபதி ${planetName(lord.lord, lang)} உங்கள் ${lord.house}-ஆம் வீட்டில் அமைந்துள்ளது — ${houseTheme(lord.house, lang)}. உங்கள் வாழ்க்கையின் கவனம் பெரும்பாலும் அங்கே திரும்பும்.`
            : `Your Lagna's ruling planet, ${planetName(lord.lord, lang)}, sits in your house ${lord.house} — ${houseTheme(lord.house, lang)}. Life's attention tends to turn there.`}
        </Text>
      )}
      {edge && <Text style={styles.quiet}>{pick(edge, lang)}</Text>}
    </>
  );
}

function PlanetRow({ planet, reading, lang, styles }: { planet: ChartExplanationPlanet } & ChapterProps) {
  const [open, setOpen] = useState(false);
  const picks = reading.story?.planets.find((p) => p.graha === planet.graha);
  const why = (picks?.whyFacetKeys ?? []).flatMap((key) => (planet.facets ?? []).filter((f) => f.key === key).slice(0, 1));
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      style={styles.planetRow}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.rowTop}>
        <Text style={styles.planetName}>{planetName(planet.graha, lang)}</Text>
        <Text style={styles.band}>{strengthVerdict(planet.strengthScore, lang)}</Text>
        {picks?.activeNow && <Text style={styles.activeBadge}>{lang === "ta" ? "இப்போது இயங்குகிறது" : "Active now"}</Text>}
      </View>
      <Text style={styles.quiet}>
        {houseLabel(planet.houseFromLagna, lang)} · {houseTheme(planet.houseFromLagna, lang)}
      </Text>
      {open && (
        <View style={styles.expand}>
          <Text style={styles.body}>{strengthReassurance(planet.strengthScore, lang)}</Text>
          {why.map((facet) => (
            <Text key={facet.key} style={styles.body}>
              <Text style={styles.bold}>{pick(facet.label, lang)}: </Text>
              {pick(facet.value, lang)}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChapterPlanets(props: ChapterProps) {
  const ordered = [...props.reading.planets]
    .filter((p) => GRAHA_ORDER.includes(p.graha))
    .sort((a, b) => GRAHA_ORDER.indexOf(a.graha) - GRAHA_ORDER.indexOf(b.graha));
  return (
    <View style={props.styles.list}>
      {ordered.map((planet) => (
        <PlanetRow key={planet.graha} planet={planet} {...props} />
      ))}
      <Text style={props.styles.quiet}>{props.lang === "ta" ? "ஒரு கிரகத்தைத் தொட்டால் ஏன் என்று தெரியும்." : "Tap a planet to see why."}</Text>
    </View>
  );
}

function ChapterNow({ reading, lang, styles }: ChapterProps) {
  const activation = reading.currentActivation;
  const yogas = reading.yogaDosham.yogas;
  const running = (reading.story?.topActiveYogas ?? []).map((name) => displayName(name, lang));
  return (
    <>
      <Card styles={styles}>
        <Text style={styles.kicker}>{lang === "ta" ? "உங்கள் தசைச் சங்கிலி — இன்று" : "Your dasa chain — today"}</Text>
        {activation.activeLords.map((lord) => (
          <Text key={`${lord.level}-${lord.lord}`} style={styles.body}>
            <Text style={styles.bold}>{pick(LEVEL_WORD[lord.level], lang) || lord.level} · {planetName(lord.lord, lang)}</Text>
            {lang === "ta" ? `  ${lord.endDate.slice(0, 10)} வரை` : `  until ${lord.endDate.slice(0, 10)}`}
          </Text>
        ))}
      </Card>
      {activation.transitSummary && <Text style={styles.body}>{pick(activation.transitSummary, lang)}</Text>}
      {running.length > 0 && yogas.length > 0 && (
        <Text style={styles.body}>
          {lang === "ta" ? "இந்தக் காலம் இயக்கும் யோகங்கள்: " : "Yogas this period switches on: "}
          {running.join(", ")}
        </Text>
      )}
    </>
  );
}

function ChapterGifts({ reading, lang, styles }: ChapterProps) {
  const summary = reading.summary;
  const { yogas, doshams } = reading.yogaDosham;
  const story = reading.story;
  const gifts = (story?.topNatalYogas ?? []).flatMap((name) => yogas.filter((y) => y.name === name).slice(0, 1));
  // Sevvai and Rahu–Ketu get their own card whenever present (mitigated
  // included), as on web; they leave the care list so each is said once.
  const marriage = doshams.filter((d) => d.isPresent && VERDICT_DOSHAMS.has(d.name));
  const cares = (story?.carePatterns ?? []).flatMap(({ name, kind }) => {
    if (kind === "DOSHAM" && VERDICT_DOSHAMS.has(name)) return [];
    if (kind === "DOSHAM") {
      const d = doshams.find((x) => x.name === name);
      return d ? [{ name: displayName(d.name, lang), label: doshamStanding(d, lang).label }] : [];
    }
    const y = yogas.find((x) => x.name === name);
    return y ? [{ name: displayName(y.name, lang), label: yogaStanding(y, lang).label }] : [];
  });
  return (
    <>
      <Card styles={styles}>
        <Text style={styles.kicker}>{lang === "ta" ? "உங்கள் பலம்" : "What your chart gives you"}</Text>
        {summary.strongestPlanet && (
          <Text style={styles.big}>
            {planetName(summary.strongestPlanet, lang)}
            {typeof summary.strongestPlanetScore === "number" ? ` · ${strengthVerdict(summary.strongestPlanetScore, lang)}` : ""}
          </Text>
        )}
        {summary.strongestPlanetCaveat && <Text style={styles.quiet}>{pick(summary.strongestPlanetCaveat, lang)}</Text>}
        {gifts.map((y) => (
          <Text key={y.name} style={styles.body}>
            {displayName(y.name, lang)} · {natalStrengthWord(y.strength, lang)}
          </Text>
        ))}
      </Card>
      <Card styles={styles}>
        <Text style={styles.kicker}>{lang === "ta" ? "கவனமாகக் கையாள வேண்டியவை" : "Handle with care"}</Text>
        {summary.weakestPlanet && (
          <>
            <Text style={styles.big}>{planetName(summary.weakestPlanet, lang)}</Text>
            {typeof summary.weakestPlanetScore === "number" && <Text style={styles.quiet}>{strengthReassurance(summary.weakestPlanetScore, lang)}</Text>}
          </>
        )}
        {cares.map((c) => (
          <Text key={c.name} style={styles.body}>
            {c.name} · {c.label}
          </Text>
        ))}
      </Card>
      {marriage.length > 0 && (
        <Card styles={styles}>
          <Text style={styles.kicker}>{lang === "ta" ? "திருமண தோஷங்கள்" : "Marriage doshams"}</Text>
          {marriage.map((d) => {
            const verdict = doshamVerdictLine(d, lang);
            return (
              <React.Fragment key={d.name}>
                <Text style={styles.body}>
                  {displayName(d.name, lang)} · {doshamStanding(d, lang).label}
                </Text>
                {verdict ? <Text style={styles.quiet}>{verdict}</Text> : null}
              </React.Fragment>
            );
          })}
        </Card>
      )}
    </>
  );
}

function ChapterComing({ reading, lang, styles }: ChapterProps) {
  const events = [...reading.peyarchi.events].sort((a, b) => a.eventDate.localeCompare(b.eventDate)).slice(0, 4);
  if (events.length === 0) {
    return <Text style={styles.quiet}>{lang === "ta" ? "அடுத்த சில மாதங்களில் பெரிய கிரகப் பெயர்ச்சி இல்லை." : "No big planet move in the coming window."}</Text>;
  }
  return (
    <>
      {events.map((e) => {
        const grade = gocharaGrade(e.planet, e.houseFromMoon);
        const word =
          grade === "SUPPORTIVE" ? (lang === "ta" ? "ஆதரவு" : "Supportive")
          : grade === "NEEDS_CARE" ? (lang === "ta" ? "கவனம் தேவை" : "Needs care")
          : grade === "MIXED" ? (lang === "ta" ? "கலந்த நிலை" : "Mixed")
          : null;
        return (
          <Card key={`${e.planet}-${e.eventDate}`} styles={styles}>
            <Text style={styles.kicker}>{e.eventDate.slice(0, 10)}</Text>
            <Text style={styles.big}>
              {planetName(e.planet, lang)}: {rasiName(rasiNumberFromCode(e.fromRasi), lang)} → {rasiName(rasiNumberFromCode(e.toRasi), lang)}
            </Text>
            <Text style={styles.quiet}>
              {lang === "ta" ? `ஜென்ம ராசியிலிருந்து ${e.houseFromMoon}-ஆம் இடம்` : `House ${e.houseFromMoon} from your Moon sign`}
              {word ? ` · ${word}` : ""}
            </Text>
            <Text style={styles.body}>{pick(e.explanation, lang)}</Text>
          </Card>
        );
      })}
    </>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.sm,
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    headerTitle: { color: C.textPrimary, flex: 1 },
    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },
    headline: { color: C.textPrimary },
    rail: { gap: S.sm, paddingRight: S.base },
    chip: {
      borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
      borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: S.sm, minHeight: 44, justifyContent: "center",
    },
    chipSelected: { backgroundColor: C.saffron, borderColor: C.saffron },
    chipText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.textPrimary },
    chipTextSelected: { color: C.surface },
    section: { gap: S.md },
    card: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.xs },
    kicker: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textTertiary },
    big: { fontFamily: "Inter_700Bold", fontSize: 17, lineHeight: 24, color: C.textPrimary },
    body: { fontSize: 14, lineHeight: 21, color: C.textPrimary },
    bold: { fontFamily: "Inter_700Bold" },
    quiet: { fontSize: 13, lineHeight: 19, color: C.textSecond },
    list: { gap: S.sm },
    planetRow: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: S.xs, minHeight: 44 },
    rowTop: { flexDirection: "row", alignItems: "center", gap: S.sm, flexWrap: "wrap" },
    planetName: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.textPrimary },
    band: { fontSize: 13, color: C.textSecond },
    activeBadge: {
      fontFamily: "Inter_700Bold", fontSize: 11, color: C.green,
      borderWidth: 1, borderColor: C.green, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2,
    },
    expand: { gap: S.xs, paddingTop: S.xs },
    nextBtn: {
      alignSelf: "flex-end", borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
      borderRadius: RADIUS.button, paddingHorizontal: S.base, paddingVertical: S.sm, minHeight: 44, justifyContent: "center",
    },
    nextText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textSecond },
  });
}
