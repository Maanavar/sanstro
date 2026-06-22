import React, { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { NAKSHATRA_LIST } from "@vinaadi/shared";
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

export default function PoruthamScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  const [boyN, setBoyN] = useState<number | null>(null);
  const [girlN, setGirlN] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["porutham", boyN, girlN],
    queryFn: () => getPorutham({ boyNakshatraNumber: boyN!, girlNakshatraNumber: girlN! }),
    enabled: submitted && boyN !== null && girlN !== null,
    staleTime: 0,
  });

  function handleCheck() {
    if (!boyN || !girlN) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(true);
    sheetRef.current?.expand();
  }

  const result = data?.data;

  if (result && result.totalScore >= 8) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const scoreColor = result
    ? result.totalScore >= 8 ? C.saffron : result.totalScore >= 5 ? C.amber : "#8B1A3C"
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
          onChange={setBoyN}
          isTamil={isTamil}
        />
        <NakshatraPicker
          label={isTamil ? "மணமகள் நட்சத்திரம்" : "Girl's Nakshatra"}
          value={girlN}
          onChange={setGirlN}
          isTamil={isTamil}
        />

        <TouchableOpacity
          style={[styles.cta, (!boyN || !girlN) && styles.ctaDisabled]}
          onPress={handleCheck}
          disabled={!boyN || !girlN}
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
                    { backgroundColor: k.score === k.maxScore ? "#EBF5ED" : k.score === 0 ? "#FEF2F2" : "#FEF5EC" },
                  ]}>
                    <Text style={[
                      styles.kutaChipText,
                      { color: k.score === k.maxScore ? C.green : k.score === 0 ? C.alert : C.caution },
                    ]}>
                      {k.score === k.maxScore ? (isTamil ? "பொருந்தும்" : "Match") : k.score === 0 ? (isTamil ? "பொருந்தாது" : "No match") : (isTamil ? "நடுத்தரம்" : "Partial")}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
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
