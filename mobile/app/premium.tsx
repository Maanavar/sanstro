import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "@/context/ToastContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
let Purchases: typeof import("react-native-purchases").default | null = null;
// A static import would run at module load and crash Expo Go, where the
// native bridge these JSI modules need does not exist. The require has to
// stay a require: that is the point, not an oversight.
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { Purchases = require("react-native-purchases").default; } catch { /* Expo Go */ }

const FEATURES = [
  { ta: "வரம்பற்ற ஜாதகங்கள் (3 இலவசத்திற்கு பதிலாக)", en: "Unlimited charts (vs 3 total free)" },
  { ta: "விளம்பரங்கள் இல்லை", en: "No ads" },
  { ta: "குடும்ப Vault — 5 சுயவிவரங்கள்", en: "Family Vault — 5 profiles" },
  { ta: "மாதம் 30 Ask Vinaadi கேள்விகள் + கூடுதல் பேக் கிடைக்கும்", en: "30 Ask Vinaadi questions/month + top-up available" },
  { ta: "மாதம் 5 விரிவான அறிக்கைகள் உட்பட", en: "5 detailed reports/month included" },
  { ta: "முழு தசா காலவரிசை (மகாதசா → பிரத்யந்தர்)", en: "Full dasha timeline (mahadasha → pratyantardasha)" },
  { ta: "வருஷபலன், வர்கங்கள், ஒத்திசைவு பலகை", en: "Varshaphala, vargas, synastry panel" },
  { ta: "வார்ஷிக Wrapped சமூக பகிர்வு + பரிகாரங்கள்", en: "Annual Wrapped social share + remedy suggestions" },
];

type Plan = "monthly" | "annual";

export default function PremiumScreen() {
  const { showToast, showError } = useToast();
  const { lang } = useI18n();
  const { setSession, user } = useSession();
  const isTamil = lang === "ta";
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [annualPkg, setAnnualPkg] = useState<PurchasesPackage | null>(null);
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  useEffect(() => {
    Purchases?.getOfferings()
      .then((offerings) => {
        const pkgs = offerings.current?.availablePackages ?? [];
        setMonthlyPkg(pkgs.find((p) => p.packageType === "MONTHLY") ?? null);
        setAnnualPkg(pkgs.find((p) => p.packageType === "ANNUAL") ?? null);
      })
      .catch(() => {
        // No offerings in dev/sandbox without RevenueCat keys — use fallback prices.
      });
  }, []);

  async function handleSubscribe() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const pkg = selectedPlan === "monthly" ? monthlyPkg : annualPkg;
    if (!Purchases || !pkg) {
      showToast(
        isTamil ? "Premium சந்தா விரைவில் கிடைக்கும்" : "Premium subscription coming soon",
        "success"
      );
      return;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active["premium"]) {
        if (user) {
          setSession(user, "premium");
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/today");
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        showError(err.message ?? (isTamil ? "கொள்முதல் தோல்வி" : "Purchase failed"));
      }
    }
  }

  async function handleRestore() {
    if (!Purchases) {
      showToast(
        isTamil ? "Premium subscription coming soon" : "Premium subscription coming soon",
        "error"
      );
      return;
    }
    try {
      const ci = await Purchases.restorePurchases();
      if (ci.entitlements.active["premium"]) {
        if (user) setSession(user, "premium");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/today");
      } else {
        showToast(
          isTamil ? "இந்த கணக்கில் Premium சந்தா இல்லை" : "No active Premium subscription found",
          "error"
        );
      }
    } catch {
      showError(isTamil ? "மீட்டெடுப்பு தோல்வி" : "Restore failed");
    }
  }

  const monthlyPrice = monthlyPkg?.product.priceString ?? "₹149";
  const annualPrice = annualPkg?.product.priceString ?? "₹999";

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark navy hero header */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.closeBtn}
          accessibilityLabel={isTamil ? "Close premium screen" : "Close premium screen"}
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
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan("monthly"); }}
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
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan("annual"); }}
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
                {isTamil ? "44% சேமிப்பு!" : "44% off!"}
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

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={[styles.restoreText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "கொள்முதல்களை மீட்டெடு" : "Restore Purchases"}
          </Text>
        </TouchableOpacity>

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

function makeStyles(C: ColorTokens) { return StyleSheet.create({
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.indigoText + "1F",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.indigoText },
  lotusIcon: { fontSize: 48, marginBottom: S.md },
  heroTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: C.gold,
    textAlign: "center",
    marginBottom: S.sm,
  },
  heroSub: {
    color: C.indigoText, opacity: 0.8,
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
    shadowColor: C.deepIndigo,
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
    backgroundColor: C.goldLight,
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
  restoreBtn: { alignItems: "center", paddingVertical: S.xs },
  restoreText: { color: C.textTertiary, textDecorationLine: "underline" },
}); }
