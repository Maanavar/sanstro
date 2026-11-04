import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircle2, Download, Mail, Trash2, ChevronRight } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { useMyConsents } from "@/hooks/useMyConsents";
import { useToast } from "@/context/ToastContext";
import { endSession } from "@/state/sessionTransition";
import { exportMyData, deleteAccount, resendVerificationEmail } from "@/api/auth";
import { ApiError } from "@/api/client";
import { shareJsonFile } from "@/lib/dataExport";

/**
 * Account & data (audit Part 3): the mobile home for the three DPDP / account
 * actions web already had — export (right of access), delete (erasure), and
 * email verification. The backend wrappers already exist in @/api/auth; this
 * screen is the surface that was missing on mobile. All new Tamil pending a
 * native review.
 */
export default function AccountScreen() {
  const C = useColors();
  const styles = makeStyles(C);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const { user, clearSession } = useSession();
  const { me } = useMyConsents();
  const { showSuccess, showError } = useToast();

  const [exporting, setExporting] = useState(false);
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const email = me?.email ?? user?.email ?? "";
  const verified = me?.emailVerified ?? false;

  async function handleExport() {
    if (exporting) return;
    Haptics.selectionAsync();
    setExporting(true);
    try {
      const data = await exportMyData();
      const stamp = new Date().toISOString().slice(0, 10);
      const shared = await shareJsonFile(`vinaadi-data-${stamp}.json`, data);
      if (shared) showSuccess(isTamil ? "உங்கள் தரவு ஏற்றுமதி செய்யப்பட்டது" : "Your data is ready to save");
    } catch {
      showError(isTamil ? "ஏற்றுமதி செய்ய முடியவில்லை" : "Could not export your data");
    } finally {
      setExporting(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    Haptics.selectionAsync();
    setResending(true);
    try {
      await resendVerificationEmail();
      showSuccess(isTamil ? `${email} க்குப் புதிய இணைப்பை அனுப்பியுள்ளோம்` : `We sent a new link to ${email}`);
    } catch {
      showError(isTamil ? "அனுப்ப முடியவில்லை. சிறிது நேரம் கழித்து முயலுங்கள்" : "Could not send. Try again shortly");
    } finally {
      setResending(false);
    }
  }

  function confirmDelete() {
    if (deleting) return;
    Haptics.selectionAsync();
    Alert.alert(
      isTamil ? "கணக்கை நீக்கவா?" : "Delete your account?",
      isTamil
        ? "உங்கள் ஜாதகங்கள், குடும்ப விவரங்கள், அறிவிப்புகள் உள்ளிட்ட அனைத்தும் நிரந்தரமாக அழிக்கப்படும். இதை மீட்டெடுக்க முடியாது."
        : "This permanently erases everything held for you — your charts, family details, and alerts. It cannot be undone.",
      [
        { text: isTamil ? "வேண்டாம்" : "Cancel", style: "cancel" },
        { text: isTamil ? "நிரந்தரமாக நீக்கு" : "Delete permanently", style: "destructive", onPress: () => void runDelete() },
      ],
    );
  }

  async function runDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      // Same teardown as sign-out: clear the cross-process query cache and the
      // persisted client before dropping the session, or the next account is
      // served this one's data from cache (see me.tsx handleSignOut).
      await endSession();
      clearSession();
      showSuccess(isTamil ? "உங்கள் கணக்கு நீக்கப்பட்டது" : "Your account has been deleted");
      router.replace("/(tabs)/today");
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        showError(isTamil
          ? "முதலில் Premium சந்தாவை ரத்துசெய்யவும், பிறகு கணக்கை நீக்கலாம்"
          : "Cancel your Premium subscription first, then delete the account");
      } else {
        showError(isTamil ? "கணக்கை நீக்க முடியவில்லை" : "Could not delete the account");
      }
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "கணக்கு & தரவு" : "Account & data"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Email + verification */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isTamil ? "மின்னஞ்சல்" : "Email"}</Text>
          <View style={styles.row}>
            <View style={styles.iconBox}><Mail size={20} color={C.textSecond} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { fontFamily: T.body.fontFamily }]} numberOfLines={1}>{email}</Text>
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily, color: verified ? C.textSecond : C.saffron }]}>
                {verified
                  ? (isTamil ? "உறுதிசெய்யப்பட்டது" : "Verified")
                  : (isTamil ? "இன்னும் உறுதிசெய்யப்படவில்லை" : "Not verified yet")}
              </Text>
            </View>
            {verified
              ? <CheckCircle2 size={20} color={C.green} strokeWidth={1.5} />
              : null}
          </View>
          {!verified && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handleResend} disabled={resending}>
                <View style={styles.iconBox} />
                <Text style={[styles.action, { fontFamily: T.body.fontFamily }]}>
                  {isTamil ? "உறுதிப்படுத்தும் இணைப்பை மீண்டும் அனுப்பு" : "Resend verification email"}
                </Text>
                {resending ? <ActivityIndicator size="small" color={C.saffron} /> : <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Your data */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isTamil ? "உங்கள் தரவு" : "Your data"}</Text>
          <TouchableOpacity style={styles.row} onPress={handleExport} disabled={exporting}>
            <View style={styles.iconBox}><Download size={20} color={C.textSecond} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { fontFamily: T.body.fontFamily }]}>
                {isTamil ? "என் தரவைப் பதிவிறக்கு" : "Download my data"}
              </Text>
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                {isTamil ? "உங்களைப் பற்றி சேமித்துள்ள அனைத்தும் JSON கோப்பாக" : "Everything we hold on you, as a JSON file"}
              </Text>
            </View>
            {exporting ? <ActivityIndicator size="small" color={C.saffron} /> : <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />}
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isTamil ? "கணக்கை நீக்கு" : "Delete account"}</Text>
          <TouchableOpacity style={styles.row} onPress={confirmDelete} disabled={deleting}>
            <View style={styles.iconBox}><Trash2 size={20} color={C.alert} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { fontFamily: T.body.fontFamily, color: C.alert }]}>
                {isTamil ? "கணக்கை நிரந்தரமாக நீக்கு" : "Delete my account"}
              </Text>
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                {isTamil ? "அனைத்தும் அழிக்கப்படும். மீட்க முடியாது." : "Erases everything held for you. This cannot be undone."}
              </Text>
            </View>
            {deleting ? <ActivityIndicator size="small" color={C.alert} /> : null}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    headerTitle: { flex: 1, color: C.textPrimary },
    scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
    section: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      paddingHorizontal: S.base, paddingBottom: S.xs, overflow: "hidden",
    },
    sectionHeader: {
      fontFamily: EnFont.SemiBold, fontSize: 12, color: C.textTertiary,
      textTransform: "uppercase", letterSpacing: 0.6, paddingTop: S.md, paddingBottom: S.xs,
    },
    row: { flexDirection: "row", alignItems: "center", gap: S.md, paddingVertical: S.md, minHeight: 52 },
    iconBox: { width: 28, alignItems: "center" },
    label: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    help: { fontSize: 13, color: C.textSecond, marginTop: 2 },
    action: { flex: 1, fontSize: 15, lineHeight: 22, color: C.saffron },
    divider: { height: 1, backgroundColor: C.divider },
  });
}
