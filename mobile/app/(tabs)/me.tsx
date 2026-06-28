import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  RefreshControl, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { ChevronRight, Gift, Clock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, TamilFont, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { loadGuestPrefs, saveGuestPrefs } from "@/features/guest/guestStore";
import { logout } from "@/api/auth";
import { clearTokens } from "@/lib/secureStore";
import { clearUserPrefs, getPrimaryChartId } from "@/lib/userPrefs";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring, staggerInterval, duration } from "@/theme/motion";

const RASI_NAMES: Record<string, { ta: string; en: string }> = {
  mesham: { ta: "à®®à¯‡à®·à®®à¯", en: "Aries" },
  rishabam: { ta: "à®°à®¿à®·à®ªà®®à¯", en: "Taurus" },
  mithunam: { ta: "à®®à®¿à®¤à¯à®©à®®à¯", en: "Gemini" },
  katakam: { ta: "à®•à®Ÿà®•à®®à¯", en: "Cancer" },
  simham: { ta: "à®šà®¿à®®à¯à®®à®®à¯", en: "Leo" },
  kanni: { ta: "à®•à®©à¯à®©à®¿", en: "Virgo" },
  thulam: { ta: "à®¤à¯à®²à®¾à®®à¯", en: "Libra" },
  viruchigam: { ta: "à®µà®¿à®°à¯à®šà¯à®šà®¿à®•à®®à¯", en: "Scorpio" },
  dhanusu: { ta: "à®¤à®©à¯à®šà¯", en: "Sagittarius" },
  makaram: { ta: "à®®à®•à®°à®®à¯", en: "Capricorn" },
  kumbam: { ta: "à®•à¯à®®à¯à®ªà®®à¯", en: "Aquarius" },
  meenam: { ta: "à®®à¯€à®©à®®à¯", en: "Pisces" },
};

export default function MeScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t, strings, lang, setLang } = useI18n();
  const { tier, user, clearSession } = useSession();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;

  const [rasi, setRasi] = useState<string | null>(null);
  const [pushOptedIn, setPushOptedIn] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [primaryChartId, setPrimaryChartId_] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function applyPrefs() {
    const [p, chartId] = await Promise.all([loadGuestPrefs(), getPrimaryChartId()]);
    setRasi(p.rasi);
    setPushOptedIn(p.pushOptedIn);
    setCity(p.city);
    setPrimaryChartId_(chartId);
  }

  useEffect(() => { void applyPrefs(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await applyPrefs();
    setRefreshing(false);
  }

  async function togglePush(val: boolean) {
    Haptics.selectionAsync();
    setPushOptedIn(val);
    await saveGuestPrefs({ pushOptedIn: val });
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      await clearTokens();
    }
    await clearUserPrefs();
    clearSession();
    router.replace("/(tabs)/today");
  }

  const rasiLabel = rasi
    ? (isTamil ? (RASI_NAMES[rasi]?.ta ?? rasi) : (RASI_NAMES[rasi]?.en ?? rasi))
    : (isTamil ? "à®¤à¯‡à®°à¯à®µà¯ à®šà¯†à®¯à¯à®¯à®µà®¿à®²à¯à®²à¯ˆ" : "Not selected");

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
        <Text style={[styles.title, isTamil ? TamilType.heading : EnType.heading]}>
          {t(strings.me.title_guest)}
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.saffron} />}
      >
        {/* Rasi identity card */}
        <Animated.View style={styles.rasiCard} entering={FadeInDown.delay(entranceDelay.supporting).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
          <Text style={styles.rasiSymbol}>â­</Text>
          <View style={styles.rasiInfo}>
            <Text style={[styles.rasiLabel, { fontFamily: T.subheading.fontFamily }]}>
              {isTamil ? `à®‰à®™à¯à®•à®³à¯ à®°à®¾à®šà®¿: ${rasiLabel}` : `Your Rasi: ${rasiLabel}`}
            </Text>
            {city && (
              <Text style={[styles.rasiCity, isTamil ? TamilType.caption : EnType.caption]}>
                {city}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push("/(onboarding)/rasi-picker")}>
            <Text style={styles.changeLink}>{isTamil ? "à®®à®¾à®±à¯à®±" : "Change"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Settings menu */}
        <Animated.View style={styles.menuSection} entering={FadeInDown.delay(entranceDelay.supporting + staggerInterval).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
          {/* Notifications */}
          <View style={styles.menuRow}>
            <Text style={styles.menuIcon}>ðŸ””</Text>
            <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
              {t(strings.me.push_label)}
            </Text>
            <Switch
              value={pushOptedIn}
              onValueChange={togglePush}
              trackColor={{ false: C.divider, true: C.saffron }}
              thumbColor={C.surface}
            />
          </View>
          <View style={styles.divider} />

          {/* Language */}
          <View style={styles.menuRow}>
            <Text style={styles.menuIcon}>ðŸŒ</Text>
            <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
              {t(strings.me.language_label)}
            </Text>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langChip, lang === "ta" && styles.langChipActive]}
                onPress={() => { Haptics.selectionAsync(); setLang("ta"); }}
              >
                <Text style={[styles.langChipText, lang === "ta" && styles.langChipTextActive]}>à®¤à®®à®¿à®´à¯</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langChip, lang === "en" && styles.langChipActive]}
                onPress={() => { Haptics.selectionAsync(); setLang("en"); }}
              >
                <Text style={[styles.langChipText, lang === "en" && styles.langChipTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />

          {/* City */}
          {city && (
            <>
              <View style={styles.menuRow}>
                <Text style={styles.menuIcon}>ðŸ“</Text>
                <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                  {isTamil ? "à®¨à®•à®°à®®à¯" : "City"}
                </Text>
                <Text style={styles.menuValue}>{city}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Privacy */}
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/privacy" as any)}>
            <Text style={styles.menuIcon}>ðŸ”’</Text>
            <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
              {isTamil ? "à®¤à®©à®¿à®¯à¯à®°à®¿à®®à¯ˆ" : "Privacy Policy"}
            </Text>
            <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Terms */}
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/terms" as any)}>
            <Text style={styles.menuIcon}>ðŸ“‹</Text>
            <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
              {isTamil ? "à®ªà®¯à®©à¯à®ªà®¾à®Ÿà¯à®Ÿà¯ à®µà®¿à®¤à®¿à®•à®³à¯" : "Terms of Use"}
            </Text>
            <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        </Animated.View>

        {/* Registered: User identity card */}
        {tier !== "guest" && user && (
          <Animated.View style={styles.identityCard} entering={FadeIn.delay(entranceDelay.tertiary).duration(duration.medium)}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(user.displayName ?? user.email ?? "V").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {user.displayName && (
                <Text style={[styles.identityName, { fontFamily: T.subheading.fontFamily }]}>
                  {user.displayName}
                </Text>
              )}
              <Text style={styles.identityEmail}>{user.email}</Text>
            </View>
          </Animated.View>
        )}

        {/* Registered: Guidance links section */}
        {tier !== "guest" && (
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionHeader}>
              {isTamil ? "à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà¯à®¤à®²à¯" : "Guidance"}
            </Text>
            {primaryChartId && (
              <>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => router.push({ pathname: "/jadhagam/[id]", params: { id: primaryChartId } })}
                >
                  <Text style={styles.menuIcon}>ðŸ”¯</Text>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {isTamil ? "à®Žà®©à¯ à®œà®¾à®¤à®•à®®à¯" : "My Jadhagam"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/wrapped" as Href)}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Gift size={20} color={C.gold} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {isTamil ? "Annual Wrapped" : "Annual Wrapped"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => router.push(`/rectification?chartId=${encodeURIComponent(primaryChartId)}` as Href)}
                >
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Clock size={20} color={C.gold} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {isTamil ? "Birth Time Rectification" : "Birth Time Rectification"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/dasha" as Href)}>
                  <Text style={styles.menuIcon}>ðŸª</Text>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {isTamil ? "à®¤à®šà®¾ à®•à®¾à®²à®µà®°à®¿à®šà¯ˆ" : "Dasha Timeline"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/varshaphala" as Href)}>
                  <Text style={styles.menuIcon}>ðŸ“…</Text>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {isTamil ? "à®µà®°à¯à®·à®ªà®²" : "Annual Prediction"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/profile-manager" as Href)}>
                  <Text style={styles.menuIcon}>👤</Text>
                  <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                    {"Manage Birth Profiles"}
                  </Text>
                  <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/transits" as Href)}>
              <Text style={styles.menuIcon}>ðŸŒ™</Text>
              <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                {isTamil ? "à®ªà¯†à®¯à®°à¯à®šà¯à®šà®¿ / à®•à¯‹à®šà¯à®šà®¾à®°à®®à¯" : "Upcoming Transits"}
              </Text>
              <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/notifications/inbox")}>
              <Text style={styles.menuIcon}>ðŸ””</Text>
              <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                {isTamil ? "à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯" : "Notification Inbox"}
              </Text>
              <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push("/notifications/settings")}>
              <Text style={styles.menuIcon}>âš™ï¸</Text>
              <Text style={[styles.menuLabel, { fontFamily: T.body.fontFamily }]}>
                {isTamil ? "à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯ à®…à®®à¯ˆà®ªà¯à®ªà¯à®•à®³à¯" : "Notification Settings"}
              </Text>
              <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* Registered non-premium: upgrade strip */}
        {tier === "registered" && (
          <TouchableOpacity style={styles.upgradeStrip} onPress={() => router.push("/premium")} activeOpacity={0.85}>
            <Text style={[styles.upgradeText, { fontFamily: T.subheading.fontFamily }]}>
              {isTamil ? "âœ¨ Premium-à®•à¯à®•à¯ à®®à¯‡à®®à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®™à¯à®•à®³à¯" : "âœ¨ Upgrade to Premium"}
            </Text>
            <Text style={styles.upgradeArrow}>â€º</Text>
          </TouchableOpacity>
        )}

        {/* Account CTA (guest only) */}
        {tier === "guest" && (
          <View style={styles.accountCta}>
            <Text style={[styles.accountCtaHeading, { fontFamily: T.subheading.fontFamily }]}>
              {isTamil ? "à®‰à®™à¯à®•à®³à¯ à®œà®¾à®¤à®•à®®à¯ à®‡à®²à®µà®šà®®à®¾à®• à®‰à®°à¯à®µà®¾à®•à¯à®•à¯à®™à¯à®•à®³à¯" : "Create your birth chart â€” free"}
            </Text>
            <Text style={[styles.accountCtaDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.me.create_account_desc)}
            </Text>
            <TouchableOpacity
              style={styles.accountCtaBtn}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.accountCtaBtnText}>
                {t(strings.me.create_account)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign out (registered only) */}
        {tier !== "guest" && (
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>{t(strings.me.logout)}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  title: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.base },

  rasiCard: {
    backgroundColor: C.goldMethodLight,
    borderRadius: RADIUS.card,
    padding: S.base,
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
  },
  rasiSymbol: { fontSize: 40 },
  rasiInfo: { flex: 1 },
  rasiLabel: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
  rasiCity: { color: C.textSecond, marginTop: 2 },
  changeLink: { fontFamily: EnFont.SemiBold, fontSize: 13, color: C.saffron },

  menuSection: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    paddingHorizontal: S.base,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: S.md,
    gap: S.md,
    minHeight: 52,
  },
  menuIcon: { fontSize: 20, width: 28, textAlign: "center" },
  menuLabel: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textPrimary },
  menuValue: { fontFamily: EnFont.Regular, fontSize: 13, color: C.textSecond },
  menuArrow: { fontFamily: EnFont.Bold, fontSize: 18, color: C.textTertiary },
  divider: { height: 1, backgroundColor: C.divider },

  langToggle: { flexDirection: "row", gap: S.xs },
  langChip: {
    paddingHorizontal: S.sm, paddingVertical: 4,
    borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.divider,
  },
  langChipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  langChipText: { fontFamily: EnFont.SemiBold, fontSize: 12, color: C.textPrimary },
  langChipTextActive: { color: C.surface },

  accountCta: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.saffron,
    padding: S.base,
    gap: S.sm,
  },
  accountCtaHeading: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
  accountCtaDesc: { color: C.textSecond },
  accountCtaBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.xs,
  },
  accountCtaBtnText: { fontFamily: TamilFont.Bold, fontSize: 15, lineHeight: 22, color: C.surface },

  signOutBtn: { alignItems: "center", paddingVertical: S.sm },
  signOutText: { fontFamily: EnFont.SemiBold, fontSize: 15, color: C.alert },

  identityCard: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center", gap: S.md,
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.saffron, alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontFamily: EnFont.ExtraBold, fontSize: 22, color: C.surface },
  identityName: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
  identityEmail: { fontFamily: EnFont.Regular, fontSize: 13, color: C.textSecond, marginTop: 1 },

  menuSectionHeader: {
    fontFamily: EnFont.SemiBold, fontSize: 12, color: C.textTertiary,
    textTransform: "uppercase", letterSpacing: 0.6,
    paddingTop: S.md, paddingHorizontal: S.base,
  },

  upgradeStrip: {
    backgroundColor: C.saffron, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center",
  },
  upgradeText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.surface },
  upgradeArrow: { fontFamily: EnFont.Bold, fontSize: 22, color: C.surface },
  });
}
