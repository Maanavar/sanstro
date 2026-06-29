/**
 * E-07 — Guest jadhagam teaser.
 * Shown after rasi-picker for unauthenticated guests.
 * Displays Moon sign + nakshatra only; overlays a registration CTA.
 * No premium chart calculation is triggered.
 */
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/lib/analytics";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";

const RASI_NAMES: Record<string, { ta: string; en: string }> = {
  mesham:     { ta: "மேஷம்",     en: "Mesha"      },
  rishabam:   { ta: "ரிஷபம்",    en: "Rishabam"   },
  mithunam:   { ta: "மிதுனம்",   en: "Mithunam"   },
  katakam:    { ta: "கடகம்",     en: "Kadagam"    },
  simham:     { ta: "சிம்மம்",   en: "Simham"     },
  kanni:      { ta: "கன்னி",     en: "Kanni"      },
  thulam:     { ta: "துலாம்",    en: "Thulam"     },
  viruchigam: { ta: "விருச்சிகம்", en: "Viruchigam" },
  dhanusu:    { ta: "தனுசு",     en: "Dhanusu"    },
  makaram:    { ta: "மகரம்",     en: "Makaram"    },
  kumbam:     { ta: "கும்பம்",   en: "Kumbam"     },
  meenam:     { ta: "மீனம்",     en: "Meenam"     },
};

const NAKSHATRA_NAMES: Record<string, { ta: string; en: string }> = {
  ashwini:       { ta: "அஸ்வினி",         en: "Ashwini"       },
  bharani:       { ta: "பரணி",            en: "Bharani"       },
  karthigai:     { ta: "கார்த்திகை",       en: "Karthigai"     },
  rohini:        { ta: "ரோகிணி",          en: "Rohini"        },
  mirugaseeridam:{ ta: "மிருகசீரிடம்",    en: "Mirugaseeridam"},
  thiruvadhirai: { ta: "திருவாதிரை",      en: "Thiruvadhirai" },
  punarpoosam:   { ta: "புனர்பூசம்",      en: "Punarpoosam"   },
  poosam:        { ta: "பூசம்",           en: "Poosam"        },
  ayilyam:       { ta: "ஆயில்யம்",        en: "Ayilyam"       },
  magam:         { ta: "மகம்",            en: "Magam"         },
  pooram:        { ta: "பூரம்",           en: "Pooram"        },
  uthiram:       { ta: "உத்திரம்",        en: "Uthiram"       },
  hastham:       { ta: "ஹஸ்தம்",          en: "Hastham"       },
  chittirai:     { ta: "சித்திரை",        en: "Chittirai"     },
  swathi:        { ta: "சுவாதி",          en: "Swathi"        },
  visakam:       { ta: "விசாகம்",          en: "Visakam"       },
  anusham:       { ta: "அனுஷம்",          en: "Anusham"       },
  kettai:        { ta: "கேட்டை",          en: "Kettai"        },
  moolam:        { ta: "மூலம்",           en: "Moolam"        },
  pooradam:      { ta: "பூராடம்",         en: "Pooradam"      },
  uthiradam:     { ta: "உத்திராடம்",      en: "Uthiradam"     },
  thiruvonam:    { ta: "திருவோணம்",       en: "Thiruvonam"    },
  avittam:       { ta: "அவிட்டம்",        en: "Avittam"       },
  sadayam:       { ta: "சதயம்",           en: "Sadayam"       },
  poorattathi:   { ta: "பூரட்டாதி",       en: "Poorattathi"   },
  uthirattathi:  { ta: "உத்திரட்டாதி",    en: "Uthirattathi"  },
  revathi:       { ta: "ரேவதி",           en: "Revathi"       },
};

const RASI_TO_NUMBER: Record<string, number> = {
  mesham: 1,
  rishabam: 2,
  mithunam: 3,
  katakam: 4,
  simham: 5,
  kanni: 6,
  thulam: 7,
  viruchigam: 8,
  dhanusu: 9,
  makaram: 10,
  kumbam: 11,
  meenam: 12,
};

const RASI_CELLS: { rasi: number; row: number; col: number }[] = [
  { rasi: 1, row: 0, col: 1 },
  { rasi: 2, row: 0, col: 2 },
  { rasi: 3, row: 0, col: 3 },
  { rasi: 4, row: 1, col: 3 },
  { rasi: 5, row: 2, col: 3 },
  { rasi: 6, row: 3, col: 3 },
  { rasi: 7, row: 3, col: 2 },
  { rasi: 8, row: 3, col: 1 },
  { rasi: 9, row: 3, col: 0 },
  { rasi: 10, row: 2, col: 0 },
  { rasi: 11, row: 1, col: 0 },
  { rasi: 12, row: 0, col: 0 },
];

const TEASER_GRID = Array.from({ length: 4 }, (_, row) =>
  Array.from({ length: 4 }, (_, col) => RASI_CELLS.find((cell) => cell.row === row && cell.col === col)?.rasi ?? null),
);

const RASI_SHORT_EN = ["", "Me", "Ri", "Mi", "Ka", "Si", "Kn", "Th", "Vi", "Dh", "Ma", "Ku", "Mn"];

export default function JadhagamTeaserScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { rasi, nakshatra } = useLocalSearchParams<{ rasi?: string; nakshatra?: string }>();

  const rasiNames = rasi ? (RASI_NAMES[rasi] ?? { ta: rasi, en: rasi }) : { ta: "—", en: "—" };
  const nakshatraNames = (nakshatra && NAKSHATRA_NAMES[nakshatra]) ?? null;
  const moonRasiNumber = rasi ? RASI_TO_NUMBER[rasi] : undefined;
  const moonReveal = useRef(new Animated.Value(0)).current;
  const moonAnimatedStyle = useMemo(
    () => ({
      opacity: moonReveal,
      transform: [
        {
          scale: moonReveal.interpolate({
            inputRange: [0, 1],
            outputRange: [0.94, 1],
          }),
        },
      ],
    }),
    [moonReveal],
  );

  useEffect(() => {
    moonReveal.setValue(0);
    Animated.spring(moonReveal, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [moonReveal, moonRasiNumber]);

  useEffect(() => {
    trackEvent("jadhagam_teaser_shown", { rasi: rasi ?? "unknown" });
  }, [rasi]);

  function handleRegister() {
    trackEvent("register_from_teaser", { source: "jadhagam_teaser" });
    router.push("/(auth)/register");
  }

  function handleSkip() {
    router.replace("/(tabs)/today");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <ThirukanithamBadge />
          <Text style={[styles.headerTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "உங்கள் ஜாதகம் பார்க்கவும்" : "Peek at your Jadhagam"}
          </Text>
        </View>

        {/* Moon sign card */}
        <View style={styles.rasiCard}>
          <Text style={[styles.rasiLabel, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "ஜன்ம ராசி (சந்திர ராசி)" : "Birth Rasi (Moon sign)"}
          </Text>
          <Text style={[styles.rasiValue, isTamil ? TamilType.display : EnType.display]}>
            {isTamil ? rasiNames.ta : rasiNames.en}
          </Text>
          {nakshatraNames && (
            <Text style={[styles.nakshatraValue, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? `நட்சத்திரம்: ${nakshatraNames.ta}` : `Nakshatra: ${nakshatraNames.en}`}
            </Text>
          )}
        </View>

        {/* Blurred chart teaser */}
        <View style={styles.teaserCard}>
          <Text style={[styles.teaserTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "ரோஜா சக்கரம்" : "Rasi Chart"}
          </Text>
          <View
            style={styles.chartPreview}
            accessibilityLabel={
              isTamil
                ? `Moon rasi preview chart, ${rasiNames.en} highlighted`
                : `Moon rasi preview chart, ${rasiNames.en} highlighted`
            }
          >
            {TEASER_GRID.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.chartRow}>
                {row.map((cell, colIdx) => {
                  if (cell === null) {
                    return <View key={`center-${rowIdx}-${colIdx}`} style={[styles.chartCell, styles.centerCell]} />;
                  }

                  const isMoonCell = cell === moonRasiNumber;
                  const content = (
                    <>
                      <Text style={[styles.chartRasiLabel, isMoonCell && styles.moonRasiLabel]}>{RASI_SHORT_EN[cell]}</Text>
                      {isMoonCell ? (
                        <>
                          <Text style={styles.moonTag}>Moon</Text>
                          <Text style={[styles.moonHint, isTamil ? TamilType.caption : EnType.caption]} numberOfLines={1}>
                            {rasiNames.en}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.lockedGlyph}>..</Text>
                          <Text style={styles.lockedLine}>--</Text>
                        </>
                      )}
                    </>
                  );

                  if (isMoonCell) {
                    return (
                      <Animated.View key={cell} style={[styles.chartCell, styles.moonChartCell, moonAnimatedStyle]}>
                        {content}
                      </Animated.View>
                    );
                  }

                  return (
                    <View key={cell} style={[styles.chartCell, styles.lockedChartCell]}>
                      {content}
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={styles.centerLabel} pointerEvents="none">
              <Text style={styles.centerLabelText}>Vinaadi AI</Text>
            </View>
          </View>
          {/* Overlay CTA */}
          <View style={styles.overlayBox}>
            <Text style={[styles.overlayTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil
                ? "முழுமையான ஜாதகம் பெறுங்கள்"
                : "See your full Jadhagam"}
            </Text>
            <Text style={[styles.overlaySub, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil
                ? "லக்னம், கிரக நிலைகள், தசை, யோகம் — அனைத்தும் திருக்கணித துல்லியத்தில்."
                : "Lagna, planetary positions, dasha, and yogas — all calculated with Thirukanitham precision."}
            </Text>
            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85}>
              <Text style={styles.registerBtnText}>
                {isTamil ? "பதிவு செய்து பார்க்கவும் →" : "Register to see your Jadhagam →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* What you unlock */}
        <View style={styles.unlockSection}>
          <Text style={[styles.unlockTitle, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            {isTamil ? "பதிவிடுவதால் கிடைப்பவை:" : "What you unlock:"}
          </Text>
          {[
            isTamil ? "ரோஜா சக்கரம் + நவாம்சம் (D9)" : "Rasi chart + Navamsa (D9)",
            isTamil ? "தசை காலக்கோடு — தாதி மற்றும் புக்தி" : "Dasha timeline — Maha & Antar Dasha",
            isTamil ? "யோக கண்டறிதல் (கஜகேசரி, ராஜயோகம்...)" : "Yoga detection (Gaja Kesari, Raja Yoga…)",
            isTamil ? "தினசரி வழிகாட்டல் — உங்கள் ஜாதகத்தை அடிப்படையாக கொண்டு" : "Daily guidance based on your chart",
          ].map((item, i) => (
            <View key={i} style={styles.unlockRow}>
              <Text style={styles.unlockCheck}>✓</Text>
              <Text style={[styles.unlockText, isTamil ? TamilType.caption : EnType.caption]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={[styles.skipText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "பின்னர் — இன்றைய வழிகாட்டலுக்கு செல்" : "Maybe later — go to today's guidance"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { padding: S.base, paddingBottom: S.xxl, gap: S.base },
  header: { flexDirection: "row", alignItems: "center", gap: S.sm, marginBottom: S.sm },
  headerTitle: { color: C.textPrimary, flex: 1 },
  rasiCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold, padding: S.base, gap: 4,
  },
  rasiLabel: { color: C.textSecond },
  rasiValue: { color: C.textPrimary, fontSize: 28, lineHeight: 36 },
  nakshatraValue: { color: C.textSecond, marginTop: 4 },
  teaserCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.divider, padding: S.base, gap: S.sm,
    overflow: "hidden",
  },
  teaserTitle: { color: C.textPrimary },
  chartPreview: {
    position: "relative",
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: C.parchment,
  },
  chartRow: { flexDirection: "row" },
  chartCell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.divider,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: C.surfaceAlt,
  },
  centerCell: { backgroundColor: C.parchment },
  lockedChartCell: { opacity: 0.34 },
  chartRasiLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    lineHeight: 12,
    color: C.textTertiary,
  },
  lockedGlyph: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    lineHeight: 18,
    color: C.textSecond,
  },
  lockedLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 12,
    color: C.textTertiary,
  },
  moonChartCell: {
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: C.cautionLight,
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  moonRasiLabel: { color: C.saffron },
  moonTag: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 17,
    color: C.textPrimary,
  },
  moonHint: {
    color: C.textSecond,
    maxWidth: "100%",
    textAlign: "center",
  },
  centerLabel: {
    position: "absolute",
    left: "25%",
    top: "25%",
    width: "50%",
    height: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: C.gold,
  },
  overlayBox: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold,
    padding: S.base, gap: S.sm, alignItems: "center",
    shadowColor: C.deepIndigo, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  overlayTitle: { color: C.textPrimary, textAlign: "center" },
  overlaySub: { color: C.textSecond, textAlign: "center", lineHeight: 20 },
  registerBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    paddingVertical: 14, paddingHorizontal: S.xl,
    alignSelf: "stretch", alignItems: "center",
  },
  registerBtnText: {
    fontFamily: "NotoSansTamil_700Bold", fontSize: 15, lineHeight: 22, color: C.surface,
  },
  unlockSection: { gap: S.xs },
  unlockTitle: { color: C.textSecond, marginBottom: 4 },
  unlockRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  unlockCheck: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.green, minWidth: 16 },
  unlockText: { color: C.textPrimary, flex: 1, lineHeight: 18 },
  skipBtn: { alignItems: "center", paddingVertical: S.sm },
  skipText: { color: C.textTertiary, textDecorationLine: "underline" },
});
