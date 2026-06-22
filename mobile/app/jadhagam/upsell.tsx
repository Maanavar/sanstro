import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";

const PLANS = [
  {
    id: "5page",
    ta: "5 பக்க அறிக்கை",
    en: "5-Page Report",
    price: "₹99",
    features: {
      ta: ["ரோஜா + நவாம்சம் சக்கரங்கள்", "கிரக-கிரக விளக்கம்", "தசா பட்டியல்", "முக்கிய யோகங்கள்"],
      en: ["Rasi + Navamsa charts", "Planet-by-planet analysis", "Dasha period list", "Key yogas"],
    },
  },
  {
    id: "10page",
    ta: "10 பக்க அறிக்கை",
    en: "10-Page Report",
    price: "₹249",
    isBest: true,
    features: {
      ta: ["5 பக்கம் அனைத்தும்", "தொழில் வழிகாட்டுதல்", "திருமண நேரம்", "உடல்நல அலசல்", "பரிகார பரிந்துரைகள்"],
      en: ["Everything in 5-page", "Career guidance", "Marriage timing", "Health analysis", "Remedy suggestions"],
    },
  },
];

export default function JadhagamUpsellScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { chartId, limitReached } = useLocalSearchParams<{ chartId?: string; limitReached?: string }>();
  const isLimitReached = limitReached === "true";

  const [selectedPlan, setSelectedPlan] = useState("10page");

  function handlePurchase() {
    // RevenueCat purchase will be wired here in Phase B final
    Alert.alert(
      isTamil ? "விரைவில் வருகிறது" : "Coming Soon",
      isTamil
        ? "கொள்முதல் ஒருங்கிணைப்பு விரைவில் கிடைக்கும்."
        : "Purchase integration will be available soon."
    );
  }

  const selected = PLANS.find((p) => p.id === selectedPlan);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "விரிவான ஜாதக அறிக்கை" : "Detailed Jadhagam Report"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Daily limit reached notice */}
        {isLimitReached && (
          <View style={styles.limitCard}>
            <Text style={styles.limitIcon}>⏳</Text>
            <Text style={[styles.limitTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "இன்று 3 ஜாதகங்கள் உருவாக்கினீர்கள்!" : "You've created 3 charts today!"}
            </Text>
            <Text style={[styles.limitSub, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil
                ? "நாளை நள்ளிரவுக்குப் பிறகு மீண்டும் இலவசமாக கிடைக்கும்."
                : "Free charts reset after midnight IST. Come back tomorrow."}
            </Text>
          </View>
        )}

        {/* Plan selector */}
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.85}
          >
            {plan.isBest && (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>{isTamil ? "சிறந்தது" : "Best Value"}</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={[styles.planName, {
                fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
              }]}>
                {isTamil ? plan.ta : plan.en}
              </Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            {(isTamil ? plan.features.ta : plan.features.en).map((feat, i) => (
              <View key={i} style={styles.featRow}>
                <Text style={[styles.featCheck, { color: selectedPlan === plan.id ? C.saffron : C.green }]}>✓</Text>
                <Text style={[styles.featText, isTamil ? TamilType.caption : EnType.caption]}>{feat}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}

        {/* Trust strip */}
        <View style={styles.trustStrip}>
          <ThirukanithamBadge />
          <Text style={[styles.trustText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "திருக்கணித முறையில் கணக்கிடப்பட்டது. எந்த அனுமானமும் இல்லை."
              : "Computed by Thirukanitham. Zero guesswork."}
          </Text>
        </View>

        {/* Purchase CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handlePurchase} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>
            {isTamil ? `இப்போது வாங்கு — ${selected?.price}` : `Buy Now — ${selected?.price}`}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.delivery, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? "10 நிமிடத்தில் PDF ready. Email-ல் வரும்." : "PDF ready in 10 minutes. Sent to your email."}
        </Text>

        <View style={styles.paymentMethods}>
          {["Google Pay", "UPI", "Card"].map((m) => (
            <View key={m} style={styles.payBadge}>
              <Text style={styles.payBadgeText}>{m}</Text>
            </View>
          ))}
        </View>

        {isLimitReached && (
          <TouchableOpacity style={styles.laterBtn} onPress={() => router.back()}>
            <Text style={styles.laterText}>
              {isTamil ? "சரி, நாளை வருகிறேன்" : "OK, I'll return tomorrow"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary, flex: 1 },
  scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
  limitCard: {
    backgroundColor: "#FEF5EC", borderRadius: RADIUS.card,
    padding: S.base, alignItems: "center", gap: S.sm,
    borderWidth: 1, borderColor: C.amber,
  },
  limitIcon: { fontSize: 36 },
  limitTitle: { color: C.textPrimary, textAlign: "center" },
  limitSub: { color: C.textSecond, textAlign: "center" },
  planCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1.5, borderColor: C.divider,
    padding: S.base, gap: S.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  planCardSelected: { borderColor: C.gold, backgroundColor: "#FFFDF5" },
  bestBadge: {
    backgroundColor: C.gold, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 3, alignSelf: "flex-start",
  },
  bestBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.surface },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { fontSize: 16, lineHeight: 22, color: C.textPrimary, flex: 1 },
  planPrice: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: C.saffron },
  featRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  featCheck: { fontFamily: "Inter_700Bold", fontSize: 12, width: 16, marginTop: 1 },
  featText: { color: C.textSecond, flex: 1 },
  trustStrip: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    backgroundColor: "#FFFBEA", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold, padding: S.md,
  },
  trustText: { flex: 1, color: C.textSecond },
  ctaBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  ctaBtnText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  delivery: { textAlign: "center", color: C.textTertiary },
  paymentMethods: { flexDirection: "row", gap: S.sm, justifyContent: "center" },
  payBadge: {
    paddingHorizontal: S.sm, paddingVertical: 4,
    borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
  },
  payBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  laterBtn: { alignItems: "center", paddingVertical: S.sm },
  laterText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary },
});
