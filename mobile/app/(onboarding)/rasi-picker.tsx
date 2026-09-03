import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Image, StyleSheet, Text, TouchableOpacity, View, ScrollView,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { RASI_LIST, NAKSHATRA_LIST } from "@vinaadi/shared";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { saveGuestPrefs } from "@/features/guest/guestStore";
import { trackEvent } from "@/lib/analytics";

const RASI_IMAGES: Record<string, ImageSourcePropType> = {
  mesham:    require("../../assets/rasi/.avif"),
  rishabam:  require("../../assets/rasi/2Rishabham.avif"),
  mithunam:  require("../../assets/rasi/3Midhunam.avif"),
  katakam:   require("../../assets/rasi/4Kadagam.avif"),
  simham:    require("../../assets/rasi/5Simmam.avif"),
  kanni:     require("../../assets/rasi/6Kanni.avif"),
  thulam:    require("../../assets/rasi/7Thulam.avif"),
  viruchigam: require("../../assets/rasi/8Virichigam.avif"),
  dhanusu:   require("../../assets/rasi/9Dhanusu.avif"),
  makaram:   require("../../assets/rasi/10Magharam.avif"),
  kumbam:    require("../../assets/rasi/11Kumbham.avif"),
  meenam:    require("../../assets/rasi/12Meenam.avif"),
};

export default function RasiPickerScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [selectedRasi, setSelectedRasi] = useState<string | null>(null);
  const [selectedNakshatra, setSelectedNakshatra] = useState<string | null>(null);
  const [showNakshatra, setShowNakshatra] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!selectedRasi || saving) return;
    setSaving(true);
    await saveGuestPrefs({ rasi: selectedRasi, nakshatra: selectedNakshatra });
    trackEvent("onboarding_step_completed", { step: "rasi_picker", rasi: selectedRasi });
    router.replace({
      pathname: "/(onboarding)/jadhagam-teaser",
      params: { rasi: selectedRasi, nakshatra: selectedNakshatra ?? undefined },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
          {isTamil ? "உங்கள் ராசி எது?" : "What is your Rasi?"}
        </Text>
        <Text style={[styles.sub, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "ஒரு முறை தேர்ந்தெடுங்கள். எந்த நேரத்திலும் மாற்றலாம்."
            : "Pick once. Change anytime in Settings."}
        </Text>

        <View style={styles.grid}>
          {RASI_LIST.map((rasi) => {
            const selected = selectedRasi === rasi.slug;
            return (
              <TouchableOpacity
                key={rasi.slug}
                style={[styles.rasiCard, selected && styles.rasiCardSelected]}
                onPress={() => { Haptics.selectionAsync(); setSelectedRasi(rasi.slug); }}
                activeOpacity={0.8}
              >
                {selected && <Text style={styles.checkmark}>✓</Text>}
                <Image
                  source={RASI_IMAGES[rasi.slug]}
                  style={styles.rasiImage}
                  resizeMode="contain"
                />
                <Text style={[styles.rasiName, { fontFamily: "NotoSansTamil_700Bold" }]}>
                  {rasi.name.ta}
                </Text>
                <Text style={styles.rasiEn}>{rasi.name.en}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.nakshatraToggle}
          onPress={() => setShowNakshatra(!showNakshatra)}
        >
          <Text style={[styles.nakshatraToggleText, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            {isTamil ? "உங்கள் நட்சத்திரம்?" : "Your Nakshatra?"}{" "}
            {showNakshatra ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {showNakshatra && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nakshatraRow}>
            {NAKSHATRA_LIST.map((n) => {
              const sel = selectedNakshatra === n.slug;
              return (
                <TouchableOpacity
                  key={n.slug}
                  style={[styles.chip, sel && styles.chipSelected]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedNakshatra(sel ? null : n.slug); }}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                    {isTamil ? n.name.ta : n.name.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.continueBtn, !selectedRasi && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!selectedRasi || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {saving ? "…" : (isTamil ? "தொடரவும்" : "Continue")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingHorizontal: S.base, paddingTop: S.xl, paddingBottom: S.xxl },
  heading: { color: C.textPrimary, textAlign: "center", marginBottom: S.sm },
  sub: { color: C.textTertiary, textAlign: "center", marginBottom: S.xl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: S.sm,
    justifyContent: "center",
    marginBottom: S.base,
  },
  rasiCard: {
    width: 96,
    height: 116,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: S.sm,
    paddingVertical: S.sm,
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rasiCardSelected: {
    borderColor: C.saffron,
    backgroundColor: C.cautionLight,
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 6,
    color: C.saffron,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  rasiImage: { width: 60, height: 60, marginBottom: 4 },
  rasiName: { fontSize: 13, lineHeight: 18, color: C.textPrimary, textAlign: "center" },
  rasiEn: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textTertiary,
    textAlign: "center",
  },
  nakshatraToggle: { alignItems: "center", marginBottom: S.sm },
  nakshatraToggleText: { color: C.textSecond },
  nakshatraRow: { marginBottom: S.base },
  chip: {
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderRadius: RADIUS.chip,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    marginRight: S.sm,
  },
  chipSelected: { backgroundColor: C.saffron, borderColor: C.saffron },
  chipText: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: C.textPrimary,
  },
  chipTextSelected: { color: C.surface },
  continueBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.base,
  },
  btnDisabled: { opacity: 0.4 },
  continueBtnText: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 16,
    lineHeight: 24,
    color: C.surface,
  },
});
