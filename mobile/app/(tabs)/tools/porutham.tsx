import React, { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { NAKSHATRA_LIST, rasiDisplayName, type ShashtashtakaNote } from "@vinaadi/shared";
import { nakshatraPadaGroups } from "@vinaadi/shared/nakshatraRasi";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPorutham } from "@/api/tools";

function NakshatraPicker({ label, value, onChange, isTamil }: {
  label: string;
  value: number | null;
  onChange: (n: number) => void;
  isTamil: boolean;
}) {
  return (
    <View style={styles.pickerWrap}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {NAKSHATRA_LIST.map((n) => {
          const sel = value === n.number;
          return (
            <TouchableOpacity
              key={n.number}
              style={[styles.nChip, sel && styles.nChipSel]}
              onPress={() => { Haptics.selectionAsync(); onChange(n.number); }}
            >
              <Text style={[styles.nChipText, sel && styles.nChipTextSel]}>
                {isTamil ? n.name.ta : n.name.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Asked only for the nine stars that straddle two rasis. The Rasi kuta and the
 * 6/8 note are judged on the Moon sign, which the star alone does not fix for
 * these — and the backend's default (the majority half) is a guess that flips
 * the 6/8 answer for 144 of the 405 pairings involving a split star.
 */
function PadaGroupPicker({ nakshatra, value, onChange, lang }: {
  nakshatra: number;
  value: number | null;
  onChange: (pada: number) => void;
  lang: "ta" | "en";
}) {
  const groups = nakshatraPadaGroups(nakshatra);
  if (groups.length < 2) return null;
  const isTamil = lang === "ta";
  const star = NAKSHATRA_LIST.find((n) => n.number === nakshatra);
  const starName = star ? (isTamil ? star.name.ta : star.name.en) : "";
  return (
    <View style={styles.padaWrap}>
      <Text style={styles.padaPrompt}>
        {isTamil
          ? `${starName} இரண்டு ராசிகளில் வருகிறது — உங்கள் ராசி எது?`
          : `${starName} spans two rasis — which is yours?`}
      </Text>
      <View style={styles.padaRow}>
        {groups.map((g) => {
          const sel = value !== null && g.padas.includes(value);
          const range = g.padas.length === 1
            ? `${g.padas[0]}`
            : `${g.padas[0]}–${g.padas[g.padas.length - 1]}`;
          return (
            <TouchableOpacity
              key={g.rasi}
              style={[styles.nChip, sel && styles.nChipSel]}
              onPress={() => { Haptics.selectionAsync(); onChange(g.padas[0]); }}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
            >
              <Text style={[styles.nChipText, sel && styles.nChipTextSel]}>
                {rasiDisplayName(g.rasi, lang)} · {isTamil ? `பாதம் ${range}` : `pada ${range}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/**
 * ஷஷ்டாஷ்டகம் (6/8) — F-POR-02, ruled 2026-10-13. A disclosure, never a
 * verdict: it is outside totalScore, the band label and the Rajju/Vedha veto,
 * so it takes the caution tint (never the alert colour the vetoes use) and
 * carries no score or pass/fail word. The wording is the server's — the
 * astrologer's text, pinned by tests/test_shashtashtaka.py — never a local copy.
 * Mobile twin of web/components/shashtashtaka-note.tsx.
 */
function ShashtashtakaNoteCard({ note, isTamil }: {
  note: ShashtashtakaNote | null | undefined;
  isTamil: boolean;
}) {
  if (!note?.present) return null;
  return (
    <View style={styles.sixEightCard}>
      <Text style={[styles.sixEightLabel, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
        {isTamil ? note.label.ta : note.label.en}
      </Text>
      <Text style={[styles.sixEightBody, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
        {isTamil ? note.note.ta : note.note.en}
      </Text>
    </View>
  );
}

function needsPada(nakshatra: number | null): boolean {
  return nakshatra !== null && nakshatraPadaGroups(nakshatra).length > 1;
}

export default function PoruthamScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  const [boyN, setBoyN] = useState<number | null>(null);
  const [girlN, setGirlN] = useState<number | null>(null);
  const [boyPada, setBoyPada] = useState<number | null>(null);
  const [girlPada, setGirlPada] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  // A split star is not ready until its half is chosen; a whole star needs no pada.
  const ready =
    boyN !== null && girlN !== null
    && (!needsPada(boyN) || boyPada !== null)
    && (!needsPada(girlN) || girlPada !== null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["porutham", boyN, girlN, boyPada, girlPada],
    queryFn: () => getPorutham({
      boyNakshatraNumber: boyN!,
      girlNakshatraNumber: girlN!,
      boyPada: boyPada ?? undefined,
      girlPada: girlPada ?? undefined,
    }),
    enabled: submitted && ready,
    staleTime: 0,
  });

  function handleCheck() {
    if (!ready) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(true);
    sheetRef.current?.expand();
  }

  const result = data?.data;

  if (result && result.totalScore >= 8) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const scoreColor = result
    ? result.totalScore >= 8 ? C.saffron : result.totalScore >= 5 ? C.amber : C.maroon
    : C.saffron;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "திருமண பொருத்தம்" : "Marriage Matching"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.formSub, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? "திருக்கணிதம் முறையில் 10 பொருத்தங்கள்" : "10-point match by Thirukanitham"}
        </Text>

        <View style={styles.formCols}>
          <View style={styles.colLabel}>
            <View style={[styles.colChip, { backgroundColor: C.skyBlue }]}>
              <Text style={styles.colChipText}>{isTamil ? "மாப்பிள்ளை" : "Boy"}</Text>
            </View>
          </View>
          <View style={styles.colLabel}>
            <View style={[styles.colChip, { backgroundColor: C.maroon }]}>
              <Text style={styles.colChipText}>{isTamil ? "மணமகள்" : "Girl"}</Text>
            </View>
          </View>
        </View>

        <NakshatraPicker
          label={isTamil ? "மாப்பிள்ளை நட்சத்திரம்" : "Boy's Nakshatra"}
          value={boyN}
          onChange={(n) => { setBoyN(n); setBoyPada(null); }}
          isTamil={isTamil}
        />
        {boyN !== null ? (
          <PadaGroupPicker nakshatra={boyN} value={boyPada} onChange={setBoyPada} lang={lang} />
        ) : null}
        <NakshatraPicker
          label={isTamil ? "மணமகள் நட்சத்திரம்" : "Girl's Nakshatra"}
          value={girlN}
          onChange={(n) => { setGirlN(n); setGirlPada(null); }}
          isTamil={isTamil}
        />
        {girlN !== null ? (
          <PadaGroupPicker nakshatra={girlN} value={girlPada} onChange={setGirlPada} lang={lang} />
        ) : null}

        <TouchableOpacity
          style={[styles.cta, !ready && styles.ctaDisabled]}
          onPress={handleCheck}
          disabled={!ready}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isTamil ? "பொருத்தம் கணக்கிட" : "Check Compatibility"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
          {isLoading ? (
            <>
              <SkeletonCard height={120} />
              <SkeletonCard height={80} />
            </>
          ) : isError ? (
            <ErrorCard onRetry={refetch} />
          ) : result ? (
            <>
              <View style={[styles.scoreHero, { backgroundColor: scoreColor }]}>
                <Text style={styles.scoreNum}>{result.totalScore} / {result.maxScore}</Text>
                <Text style={styles.scoreLabel}>
                  {isTamil ? result.summary.ta : result.summary.en}
                </Text>
              </View>

              {/* Beside the verdict, never part of it — same place as the web calculator. */}
              <ShashtashtakaNoteCard note={result.shashtashtaka} isTamil={isTamil} />

              {result.kutas.map((k) => (
                <View key={k.name} style={styles.kutaRow}>
                  <View style={styles.kutaLeft}>
                    <Text style={[styles.kutaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                      {isTamil ? k.nameTa : k.name}
                    </Text>
                    <Text style={styles.kutaScore}>{k.score}/{k.maxScore}</Text>
                  </View>
                  <View style={[
                    styles.kutaChip,
                    { backgroundColor: k.grade === "UTTAMA" ? C.greenLight : k.grade === "MADHYAMA" ? C.cautionLight : C.alertLight },
                  ]}>
                    <Text style={[
                      styles.kutaChipText,
                      { color: k.grade === "UTTAMA" ? C.green : k.grade === "MADHYAMA" ? C.caution : C.alert },
                    ]}>
                      {k.grade === "MADHYAMA"
                        ? (isTamil ? "மத்யமம்" : "Madhyama")
                        : k.passed ? (isTamil ? "பொருந்தும்" : "Match") : (isTamil ? "பொருந்தாது" : "No match")}
                    </Text>
                  </View>
                </View>
              ))}
              {/* The gloss travels with the word: a bare Sanskrit grade strands
                  a non-astrologer reader exactly as badly as an unexplained
                  Fail. The load-bearing clause is "not a failure". */}
              {result.kutas.some((k) => k.grade === "MADHYAMA") ? (
                <Text style={styles.kutaGloss}>
                  {isTamil
                    ? "மத்யமம் — இந்தப் பொருத்தத்தில் நடுத்தர நிலை. பரவாயில்லை, ஆனால் உயர்ந்தது அல்ல. இது தோல்வி அல்ல, மிதமான பொருத்தமே."
                    : "Madhyama — a middling result on this porutham. Acceptable, but not the strongest grade. It counts as a soft pass, not a failure."}
                </Text>
              ) : null}
            </>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  kutaGloss: { fontFamily: "Inter_400Regular", marginTop: S.sm, color: C.textSecond, fontSize: 12, lineHeight: 18 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.md },
  formSub: { color: C.textSecond },
  formCols: { flexDirection: "row", gap: S.sm },
  colLabel: { flex: 1 },
  colChip: { borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: S.xs, alignSelf: "flex-start" },
  colChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.surface },
  pickerWrap: { gap: S.xs },
  pickerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSecond },
  pickerRow: {},
  nChip: {
    paddingHorizontal: S.md, paddingVertical: S.xs,
    borderRadius: RADIUS.chip, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.divider, marginRight: S.sm,
  },
  nChipSel: { backgroundColor: C.saffron, borderColor: C.saffron },
  nChipText: { fontFamily: "NotoSansTamil_400Regular", fontSize: 12, lineHeight: 18, color: C.textPrimary },
  nChipTextSel: { color: C.surface },
  padaWrap: { gap: S.xs },
  padaPrompt: { fontFamily: "NotoSansTamil_400Regular", fontSize: 12, lineHeight: 18, color: C.textSecond },
  padaRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  sixEightCard: {
    backgroundColor: C.cautionLight, borderColor: C.caution, borderWidth: 1,
    borderRadius: RADIUS.card, padding: S.md, gap: 4,
  },
  sixEightLabel: { fontSize: 14, lineHeight: 20, color: C.textPrimary },
  sixEightBody: { fontSize: 13, lineHeight: 20, color: C.textPrimary },
  cta: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  sheetBg: { backgroundColor: C.parchment },
  sheetHandle: { backgroundColor: C.divider, width: 40 },
  sheetScroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  scoreHero: {
    borderRadius: RADIUS.card, padding: S.xl,
    alignItems: "center", gap: S.sm, marginBottom: S.sm,
  },
  scoreNum: { fontFamily: "Inter_800ExtraBold", fontSize: 48, color: C.surface, lineHeight: 56 },
  scoreLabel: { fontFamily: "NotoSansTamil_700Bold", fontSize: 18, lineHeight: 26, color: C.surface, textAlign: "center" },
  kutaRow: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  kutaLeft: { flex: 1, gap: 2 },
  kutaName: { fontSize: 14, lineHeight: 20, color: C.textPrimary },
  kutaScore: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  kutaChip: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 4 },
  kutaChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
