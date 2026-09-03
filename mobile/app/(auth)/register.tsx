import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Link } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { register, login } from "@/api/auth";
import { setTokens } from "@/lib/secureStore";
import { ApiError } from "@/api/client";

export default function RegisterScreen() {
  const { t, strings, lang } = useI18n();
  const { setSession } = useSession();
  const isTamil = lang === "ta";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // DPDP Act 2023 §6. Starts false, always — a pre-ticked box is not a consent
  // action the user performed.
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError(isTamil ? "மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை." : "Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError(isTamil ? "கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்." : "Password must be at least 8 characters.");
      return;
    }
    if (!consentGiven) {
      setError(
        isTamil
          ? "கணக்கை உருவாக்க தனியுரிமைக் கொள்கையை ஏற்கவும்."
          : "Please accept the privacy policy to create your account."
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // `undefined` for displayName: this screen collects none, and the backend
      // has no such column. Consent is the fourth argument.
      await register(trimmedEmail, password, undefined, consentGiven);
      const loginRes = await login(trimmedEmail, password);
      await setTokens({ accessToken: loginRes.accessToken, refreshToken: loginRes.refreshToken });
      setSession(
        { userId: loginRes.user.userId, email: loginRes.user.email, displayName: loginRes.user.displayName },
        "registered"
      );
      router.replace("/(onboarding)/birth-details");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          isTamil
            ? "இந்த மின்னஞ்சலுடன் ஒரு கணக்கு ஏற்கனவே உள்ளது."
            : "An account with this email already exists."
        );
      } else {
        setError(t(strings.common.error));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.back}
          >
            <Text style={styles.backText}>← {t(strings.common.back)}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, isTamil ? TamilType.display : EnType.display]}>
            {t(strings.auth.register_title)}
          </Text>
          <Text style={[styles.sub, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "இலவசம் · விரைவானது · உங்கள் தரவு பாதுகாப்பானது"
              : "Free · Fast · Your data stays private"}
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.auth.email)}
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={C.textTertiary}
            />

            <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.auth.password)}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="••••••••"
              placeholderTextColor={C.textTertiary}
            />

            {/* Consent. React Native has no native checkbox, so this is a
                Pressable that declares itself as one: `accessibilityRole` and
                `accessibilityState` are what make TalkBack and VoiceOver
                announce it as a checkbox and read its checked state. Without
                them it is an unlabelled button, which is not a control anyone
                could be said to have knowingly ticked.
                The row is 44px tall to clear the touch-target audit
                (scripts/audit-touch-targets.mjs). */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => { setConsentGiven((v) => !v); setError(null); }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentGiven }}
              accessibilityLabel={
                isTamil
                  ? "தனியுரிமைக் கொள்கையை ஏற்கிறேன்"
                  : "I accept the privacy policy"
              }
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
                {consentGiven && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={[styles.consentText, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil
                  ? "தனியுரிமைக் கொள்கையை ஏற்கிறேன். எனது பிறப்பு விவரங்கள் எனது பலன்களை உருவாக்கப் பயன்படுத்தப்படுவதற்கு சம்மதிக்கிறேன்."
                  : "I accept the Privacy Policy, and consent to my birth details being used to generate my readings."}
              </Text>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "…" : t(strings.auth.btn_register)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.auth.have_account)}{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, isTamil ? TamilType.caption : EnType.caption]}>
                  {t(strings.auth.btn_login)}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.privacyNote}>
            {isTamil ? "தனியுரிமை கொள்கை" : "Privacy Policy"} · {isTamil ? "பயன்பாட்டு விதிகள்" : "Terms of Use"}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: S.base, paddingTop: S.xl, paddingBottom: S.xxl },
  back: { marginBottom: S.xl },
  backText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecond },
  title: { color: C.textPrimary, marginBottom: S.sm },
  sub: { color: C.textTertiary, marginBottom: S.xl },
  form: { gap: S.sm },
  label: { color: C.textSecond, marginBottom: 4 },
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
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: S.sm,
    // 44 is the audited minimum touch target; the text usually makes the row
    // taller than this, and minHeight guarantees it when it does not.
    minHeight: 44,
    paddingVertical: S.xs,
    marginBottom: S.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: C.textTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: C.saffron, borderColor: C.saffron },
  checkboxTick: { color: C.surface, fontSize: 14, lineHeight: 18, fontFamily: "Inter_400Regular" },
  consentText: { flex: 1, color: C.textSecond },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.alert, marginBottom: S.sm },
  primaryBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  link: { color: C.saffron },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: S.xl, alignItems: "center" },
  footerText: { color: C.textSecond },
  privacyNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
    textAlign: "center",
    marginTop: S.base,
  },
});
