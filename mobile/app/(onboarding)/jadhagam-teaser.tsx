/**
 * E-07 — Guest jadhagam teaser.
 * Shown after rasi-picker for unauthenticated guests.
 * Displays Moon sign + nakshatra only; overlays a registration CTA.
 * No premium chart calculation is triggered.
 */
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

const BLURRED_HOUSES = [
  ["??", "—"],
  ["—", "??"],
  ["??", "—"],
  ["—", "??"],
  ["??", "—"],
  ["—", "??"],
];

export default function JadhagamTeaserScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { rasi, nakshatra } = useLocalSearchParams<{ rasi?: string; nakshatra?: string }>();

  const rasiNames = (rasi && RASI_NAMES[rasi]) ?? { ta: rasi ?? "—", en: rasi ?? "—" };
  const nakshatraNames = (nakshatra && NAKSHATRA_NAMES[nakshatra]) ?? null;

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
          <View style={styles.blurGrid}>
            {BLURRED_HOUSES.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.blurRow}>
                {row.map((cell, colIdx) => (
                  <View key={colIdx} style={styles.blurCell}>
                    <Text style={styles.blurText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
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
  blurGrid: { gap: 4, opacity: 0.25 },
  blurRow: { flexDirection: "row", gap: 4 },
  blurCell: {
    flex: 1, height: 44, backgroundColor: C.surfaceAlt,
    borderRadius: 6, alignItems: "center", justifyContent: "center",
  },
  blurText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
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
