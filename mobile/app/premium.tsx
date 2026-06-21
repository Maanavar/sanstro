import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

const FEATURES = [
  { ta: "வரம்பற்ற ஜாதகங்கள் (நாளுக்கு 3 இலவசமான பதிலாக)", en: "Unlimited charts (vs 3/day free)" },
  { ta: "விளம்பரங்கள் இல்லை", en: "No ads" },
  { ta: "குடும்ப Vault — 5 சுயவிவரங்கள்", en: "Family Vault — 5 profiles" },
  { ta: "Ask Vinaadi AI உரையாடல்", en: "Ask Vinaadi AI chat" },
  { ta: "மாதம் 3 விரிவான அறிக்கைகள்", en: "3 detailed reports/month" },
  { ta: "தசா / காலவரிசை", en: "Dasha timeline" },
  { ta: "பரிகார பரிந்துரைகள்", en: "Remedy suggestions" },
];

type Plan = "monthly" | "annual";

export default function PremiumScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");

  function handleSubscribe() {
    // RevenueCat react-native-purchases will be wired here
    Alert.alert(
      isTamil ? "விரைவில் வருகிறது" : "Coming Soon",
      isTamil
        ? "Premium சந்தா ஒருங்கிணைப்பு விரைவில் கிடைக்கும்."
        : "Premium subscription integration will be available soon."
    );
  }

  const monthlyPrice = "₹149";
  const annualPrice = "₹999";

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark navy hero header */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.lotusIcon}>🪷</Text>
        <Text style={styles.heroTitle}>
          {isTamil ? "விநாடி AI Premium" : "Vinaadi AI Premium"}
        </Text>
        <Text style={[styles.heroSub, isTamil ? TamilType.body : EnType.body]}>
          {isTamil
            ? "வரம்பற்ற வழிகாட்டுதல். விளம்பரங்கள் இல்லை."
            : "Unlimited guidance. No ads."}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Feature list */}
        <View style={styles.featureCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text
                style={[
                  styles.featureText,
                  isTamil ? TamilType.body : EnType.body,
                ]}
              >
                {isTamil ? f.ta : f.en}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={[styles.planPill, selectedPlan === "monthly" && styles.planPillActive]}
            onPress={() => setSelectedPlan("monthly")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.planLabel,
                selectedPlan === "monthly" && styles.planLabelActive,
                isTamil ? { fontFamily: "NotoSansTamil_400Regular" } : { fontFamily: "Inter_400Regular" },
              ]}
            >
              {isTamil ? `${monthlyPrice} / மாதம்` : `${monthlyPrice} / month`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planPill, selectedPlan === "annual" && styles.planPillActive]}
            onPress={() => setSelectedPlan("annual")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.planLabel,
                selectedPlan === "annual" && styles.planLabelActive,
                isTamil ? { fontFamily: "NotoSansTamil_400Regular" } : { fontFamily: "Inter_400Regular" },
              ]}
            >
              {isTamil ? `${annualPrice} / ஆண்டு` : `${annualPrice} / year`}
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                {isTamil ? "48% சேமிப்பு!" : "48% off!"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleSubscribe} activeOpacity={0.85}>
          <Text style={[styles.ctaText, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "Premium தொடங்கு" : "Start Premium"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.trialNote, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "7 நாட்கள் இலவச சோதனை. எந்த நேரத்திலும் ரத்து செய்யலாம்."
            : "7-day free trial. Cancel anytime."}
        </Text>

        {/* Store requirement: close button must be visible */}
        <TouchableOpacity style={styles.laterBtn} onPress={() => router.back()}>
          <Text style={[styles.laterText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "பின்னர்" : "Maybe later"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.darkBg },
  hero: {
    backgroundColor: C.darkBg,
    alignItems: "center",
    paddingHorizontal: S.base,
    paddingTop: S.xl,
    paddingBottom: S.xl,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: S.md,
    right: S.base,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#FFFFFF" },
  lotusIcon: { fontSize: 48, marginBottom: S.md },
  heroTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: C.gold,
    textAlign: "center",
    marginBottom: S.sm,
  },
  heroSub: {
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
    lineHeight: 22,
  },
  scroll: {
    backgroundColor: C.parchment,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    padding: S.base,
    gap: S.base,
    paddingBottom: S.xxl + S.xxl,
  },
  featureCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  checkmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.green,
    width: 18,
    marginTop: 2,
  },
  featureText: { color: C.textPrimary, flex: 1 },
  planRow: {
    flexDirection: "row",
    gap: S.sm,
  },
  planPill: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: C.divider,
    backgroundColor: C.surface,
    padding: S.md,
    alignItems: "center",
    gap: S.xs,
  },
  planPillActive: {
    borderColor: C.gold,
    backgroundColor: "#FFFDF5",
  },
  planLabel: {
    fontSize: 14,
    color: C.textSecond,
    textAlign: "center",
  },
  planLabelActive: { color: C.textPrimary },
  savingsBadge: {
    backgroundColor: C.gold,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
  },
  savingsText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.surface },
  ctaBtn: {
    height: 52,
    borderRadius: RADIUS.button,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: C.textPrimary },
  trialNote: { textAlign: "center", color: C.textTertiary },
  laterBtn: { alignItems: "center", paddingVertical: S.sm },
  laterText: { color: C.textTertiary },
});
