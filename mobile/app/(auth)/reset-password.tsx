import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { confirmPasswordReset } from "@/api/auth";
import { ApiError } from "@/api/client";

/**
 * Reached via the emailed reset link (vinaadi://reset-password?token=...).
 * Until Universal Links / App Links are configured for the web reset URL,
 * users tapping the emailed link land on the web /login?resetToken=... page
 * instead — that flow is fully functional too. This screen exists so the
 * app has a native equivalent once deep-link domain association is set up,
 * and so it can be opened directly today via the custom URL scheme.
 */
export default function ResetPasswordScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!token) {
      setError(isTamil ? "இணைப்பு தவறானது அல்லது காலாவதியானது." : "This reset link is invalid or has expired.");
      return;
    }
    if (password.length < 8) {
      setError(isTamil ? "கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்." : "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError(isTamil ? "கடவுச்சொற்கள் பொருந்தவில்லை." : "Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.getUserMessage()
          : (isTamil ? "இணைப்பு தவறானது அல்லது காலாவதியானது." : "This reset link is invalid or has expired.")
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <Text style={styles.checkEmoji}>✅</Text>
          <Text style={[styles.heading, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "கடவுச்சொல் புதுப்பிக்கப்பட்டது" : "Password updated"}
          </Text>
          <Text style={[styles.body, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "உங்கள் புதிய கடவுச்சொல்லுடன் உள்நுழையவும்."
              : "Please sign in with your new password."}
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.backBtnText}>
              {isTamil ? "உள்நுழைவுக்கு திரும்பு" : "Back to Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
            {isTamil ? "புதிய கடவுச்சொல்" : "Set a new password"}
          </Text>
          <Text style={[styles.body, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "உங்கள் கணக்கிற்கு புதிய கடவுச்சொல்லை உள்ளிடவும்."
              : "Choose a new password for your account."}
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder={isTamil ? "புதிய கடவுச்சொல்" : "New password"}
            placeholderTextColor={C.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry
            autoComplete="new-password"
            placeholder={isTamil ? "கடவுச்சொல்லை உறுதிப்படுத்தவும்" : "Confirm new password"}
            placeholderTextColor={C.textTertiary}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "…" : (isTamil ? "கடவுச்சொல்லை புதுப்பி" : "Update Password")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: S.base, paddingTop: S.xl, paddingBottom: S.xxl },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: S.base, gap: S.base },
  back: { marginBottom: S.xl },
  backText: { fontFamily: "Inter_400Regular", fontSize: 20, color: C.textSecond },
  heading: { color: C.textPrimary, marginBottom: S.sm },
  body: { color: C.textSecond, marginBottom: S.xl },
  checkEmoji: { fontSize: 56, marginBottom: S.base },
  input: {
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.input,
    height: 48,
    paddingHorizontal: S.md,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: S.sm,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.alert, marginBottom: S.sm },
  primaryBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  backBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 48,
    paddingHorizontal: S.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.base,
  },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.surface },
});
