import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  Linking,
  Platform,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { assertPurchaseReady } from "@/lib/purchaseIdentity";
import { getMySubscription } from "@/api/auth";
import { cancelSubscription, listPaymentProducts, type PaymentProduct } from "@/api/payments";
import { accountKey } from "@/lib/queryKeys";
import { OPEN_BETA } from "@vinaadi/shared/constants";
import { periodEndMeaning, subscriptionManageAction } from "@vinaadi/shared/subscriptionManage";
import { MANAGE_SUB_URL } from "@/lib/storeLinks";
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
  { ta: "வருடப்பலன் (எளிமைப்படுத்தப்பட்ட ஆண்டு ஜாதகம்), வர்கங்கள், ஒத்திசைவு பலகை", en: "Simplified Annual Chart (Varuda Palan), vargas, synastry panel" },
  { ta: "வார்ஷிக Wrapped சமூக பகிர்வு + பரிகாரங்கள்", en: "Annual Wrapped social share + remedy suggestions" },
];

type Plan = "monthly" | "annual";

/** ₹ from paise, the catalogue's unit (`products.price_inr_paise`). */
function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function catalogueSubscription(products: PaymentProduct[] | undefined, period: "month" | "year") {
  return (products ?? []).find((p) => p.kind === "subscription" && p.billingPeriod === period) ?? null;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function PremiumScreen() {
  const { showToast, showError } = useToast();
  const { lang } = useI18n();
  const { setSession, user, tier } = useSession();
  const isTamil = lang === "ta";
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [annualPkg, setAnnualPkg] = useState<PurchasesPackage | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const queryClient = useQueryClient();

  useEffect(() => {
    Purchases?.getOfferings()
      .then((offerings) => {
        const pkgs = offerings.current?.availablePackages ?? [];
        setMonthlyPkg(pkgs.find((p) => p.packageType === "MONTHLY") ?? null);
        setAnnualPkg(pkgs.find((p) => p.packageType === "ANNUAL") ?? null);
      })
      .catch(() => {
        // No offerings in dev/sandbox without RevenueCat keys — the catalogue
        // price below stands in.
      });
  }, []);

  // Same key as the Me tab, so cancelling here updates that screen's summary.
  const { data: subData } = useQuery({
    queryKey: accountKey("my-subscription"),
    queryFn: getMySubscription,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const sub = subData?.data ?? null;

  // Only to price the pills when the store has no offering (Expo Go, a build
  // without store keys, a region with no product). Never to *charge*: the app
  // buys through the store, never through Razorpay.
  const { data: products } = useQuery({
    queryKey: accountKey("payment-products"),
    queryFn: listPaymentProducts,
    enabled: !OPEN_BETA && tier !== "premium",
    staleTime: 60 * 60 * 1000,
  });

  /**
   * Take the tier from the SERVER, not from the store's reply.
   *
   * A04: both handlers used to call `setSession(user, "premium")` on a
   * successful store transaction, which records a local flag as if it were
   * backend access. The backend grants premium from its own subscription
   * projection, fed by the webhook, so the only honest source is the backend.
   *
   * The webhook can also land after the store replies. When it has not yet,
   * this leaves the tier as the server currently reports it — a bounded pending
   * state — rather than asserting premium the server does not agree with.
   */
  async function applyEntitlementFromServer() {
    if (!user) return;
    try {
      const info = await getMySubscription();
      // `{ success, data: SubscriptionInfo | null }` — `data` is null for an
      // account with no subscription row yet, which is exactly the
      // webhook-not-yet-arrived case.
      const serverTier = info.data?.tier;
      setSession(user, serverTier === "premium" ? "premium" : "registered");
      if (serverTier !== "premium") {
        showToast(
          isTamil
            ? "கொள்முதல் பெறப்பட்டது. சில நிமிடங்களில் Premium செயல்படும்."
            : "Purchase received. Premium will activate in a few minutes.",
          "success",
        );
      }
    } catch {
      // The purchase succeeded at the store; we simply cannot confirm the
      // backend's view yet. Claiming premium locally is what this replaces.
      showToast(
        isTamil
          ? "கொள்முதல் பெறப்பட்டது. நிலையை உறுதிப்படுத்த முடியவில்லை."
          : "Purchase received. Could not confirm status yet.",
        "success",
      );
    }
  }

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
      // A04: refuse unless the purchase SDK is bound to the signed-in account.
      // Without this the purchase went out under whatever identity the SDK
      // happened to hold — an anonymous id on a fresh launch, or the previous
      // account's after a switch — and the backend webhook cannot resolve
      // either to a user.
      if (!user) throw new Error("not signed in");
      await assertPurchaseReady(user.userId);

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active["premium"]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await applyEntitlementFromServer();
        router.replace("/(tabs)/today");
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        showError(err.message ?? (isTamil ? "கொள்முதல் தோல்வி" : "Purchase failed"));
      }
    }
  }

  /**
   * Stop renewing a subscription bought on the **web**. A store-bought one is
   * not cancellable here at all — `subscriptionManageAction` says which, and
   * the store branch opens the store's own subscriptions screen.
   */
  async function handleStopRenewing() {
    Haptics.selectionAsync();
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        isTamil ? "புதுப்பித்தலை நிறுத்தவா?" : "Stop renewing?",
        sub?.current_period_end
          ? isTamil
            ? `${dayLabel(sub.current_period_end)} வரை Premium தொடரும். அதன் பிறகு புதுப்பிக்கப்படாது.`
            : `Premium continues until ${dayLabel(sub.current_period_end)}. It will not renew after that.`
          : isTamil
            ? "செலுத்திய காலம் முடியும் வரை Premium தொடரும்."
            : "Premium continues to the end of the paid period.",
        [
          { text: isTamil ? "வேண்டாம்" : "Keep Premium", style: "cancel", onPress: () => resolve(false) },
          { text: isTamil ? "நிறுத்து" : "Stop renewing", style: "destructive", onPress: () => resolve(true) },
        ],
        { onDismiss: () => resolve(false) },
      );
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      const result = await cancelSubscription();
      await queryClient.invalidateQueries({ queryKey: accountKey("my-subscription") });
      showToast(
        result.currentPeriodEnd
          ? isTamil
            ? `புதுப்பித்தல் நிறுத்தப்பட்டது. ${dayLabel(result.currentPeriodEnd)} வரை Premium தொடரும்.`
            : `Renewal stopped. Premium continues until ${dayLabel(result.currentPeriodEnd)}.`
          : isTamil
            ? "புதுப்பித்தல் நிறுத்தப்பட்டது."
            : "Renewal stopped.",
        "success",
      );
    } catch (e: unknown) {
      showError(
        (e as { message?: string }).message ??
          (isTamil ? "புதுப்பித்தலை நிறுத்த முடியவில்லை." : "Could not stop the renewal."),
      );
    } finally {
      setCancelling(false);
    }
  }

  async function handleOpenStore() {
    Haptics.selectionAsync();
    await Linking.openURL(MANAGE_SUB_URL).catch(() => {
      showError(
        isTamil
          ? "கடையின் சந்தா பக்கத்தைத் திறக்க முடியவில்லை."
          : "Could not open the store's subscriptions page.",
      );
    });
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
      // Same gate as purchase. A restore under the wrong identity would attach
      // someone else's receipts to this session's view of the world.
      if (!user) throw new Error("not signed in");
      await assertPurchaseReady(user.userId);

      const ci = await Purchases.restorePurchases();
      if (ci.entitlements.active["premium"]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await applyEntitlementFromServer();
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

  // The store's price is the one that will actually be charged, so it wins;
  // the catalogue price only stands in when the store has no offering.
  const monthlyCatalogue = catalogueSubscription(products, "month");
  const annualCatalogue = catalogueSubscription(products, "year");
  const monthlyPrice =
    monthlyPkg?.product.priceString ?? (monthlyCatalogue ? rupees(monthlyCatalogue.priceInrPaise) : null);
  const annualPrice =
    annualPkg?.product.priceString ?? (annualCatalogue ? rupees(annualCatalogue.priceInrPaise) : null);

  // Was a hardcoded "44% off!" beside hardcoded prices. Derived now, and shown
  // only when both prices are known from the same source, so the badge cannot
  // claim a discount the user is not getting.
  const monthlyAmount = monthlyPkg?.product.price ?? (monthlyCatalogue ? monthlyCatalogue.priceInrPaise / 100 : null);
  const annualAmount = annualPkg?.product.price ?? (annualCatalogue ? annualCatalogue.priceInrPaise / 100 : null);
  const savingsPct =
    monthlyAmount && annualAmount && monthlyAmount > 0
      ? Math.round((1 - annualAmount / (monthlyAmount * 12)) * 100)
      : 0;

  const isPremium = tier === "premium";
  const manageAction = subscriptionManageAction(sub);
  const endMeaning = periodEndMeaning(sub);

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

        {/* One of three states: beta (nothing to sell), already a subscriber
            (manage it), or the plan selector. */}
        {OPEN_BETA ? (
          <View style={styles.noticeCard}>
            <Text style={[styles.noticeText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil
                ? "Vinaadi திறந்த பீட்டாவில் இருக்கும் வரை அனைத்து வசதிகளும் இலவசம். இப்போது வாங்க எதுவும் இல்லை."
                : "Every feature is free while Vinaadi is in open beta. Nothing to buy yet."}
            </Text>
          </View>
        ) : isPremium ? (
          <View style={styles.noticeCard}>
            <Text style={[styles.noticeTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "உங்களிடம் Premium உள்ளது." : "You have Premium."}
            </Text>
            {sub?.current_period_end && endMeaning !== "none" ? (
              <Text style={[styles.noticeText, isTamil ? TamilType.body : EnType.body]}>
                {endMeaning === "ends"
                  ? isTamil
                    ? `${dayLabel(sub.current_period_end)} அன்று முடிகிறது. புதுப்பிக்கப்படாது.`
                    : `Premium ends on ${dayLabel(sub.current_period_end)}. It will not renew.`
                  : isTamil
                    ? `${dayLabel(sub.current_period_end)} அன்று புதுப்பிக்கப்படும்.`
                    : `It renews on ${dayLabel(sub.current_period_end)}.`}
              </Text>
            ) : null}
            {manageAction === "store" ? (
              <>
                <Text style={[styles.noticeText, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil
                    ? "நீங்கள் செயலியில் சந்தா செலுத்தியதால், புதுப்பித்தலை கடையில் நிர்வகிக்க வேண்டும்."
                    : Platform.OS === "ios"
                      ? "You subscribed in the app, so renewal is managed in the App Store."
                      : "You subscribed in the app, so renewal is managed in Google Play."}
                </Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenStore} activeOpacity={0.85}>
                  <Text style={[styles.secondaryText, isTamil ? TamilType.body : EnType.body]}>
                    {isTamil ? "கடையில் சந்தாவை நிர்வகி" : "Manage in the store"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : manageAction === "cancel_in_app" ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, cancelling && styles.btnBusy]}
                onPress={handleStopRenewing}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryText, isTamil ? TamilType.body : EnType.body]}>
                  {cancelling
                    ? "…"
                    : isTamil
                      ? "புதுப்பித்தலை நிறுத்து"
                      : "Stop renewing"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
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
                  {monthlyPrice
                    ? isTamil ? `${monthlyPrice} / மாதம்` : `${monthlyPrice} / month`
                    : isTamil ? "மாதச் சந்தா" : "Monthly"}
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
                  {annualPrice
                    ? isTamil ? `${annualPrice} / ஆண்டு` : `${annualPrice} / year`
                    : isTamil ? "ஆண்டுச் சந்தா" : "Yearly"}
                </Text>
                {savingsPct >= 5 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      {isTamil ? `${savingsPct}% சேமிப்பு!` : `${savingsPct}% off!`}
                    </Text>
                  </View>
                )}
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
                ? "எந்த நேரத்திலும் ரத்து செய்யலாம். செலுத்திய காலம் முடியும் வரை Premium தொடரும்."
                : "Cancel any time; Premium continues to the end of the paid period."}
            </Text>
          </>
        )}

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
  noticeCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.base,
    gap: S.sm,
  },
  noticeTitle: { color: C.textPrimary },
  noticeText: { color: C.textSecond },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: RADIUS.button,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.base,
    marginTop: S.xs,
  },
  secondaryText: { color: C.textPrimary },
  btnBusy: { opacity: 0.6 },
  laterBtn: { alignItems: "center", paddingVertical: S.sm },
  laterText: { color: C.textTertiary },
  restoreBtn: { alignItems: "center", paddingVertical: S.xs },
  restoreText: { color: C.textTertiary, textDecorationLine: "underline" },
}); }
