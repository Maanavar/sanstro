import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router, Link } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";

export default function LoginScreen() {
  const { t, strings, lang } = useI18n();
  const { setSession } = useSession();
  const isTamil = lang === "ta";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError(isTamil ? "மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை." : "Email and password are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await login(trimmedEmail, password);
      setSession(
        { userId: res.user.userId, email: res.user.email, displayName: res.user.displayName },
        "registered"
      );
      router.replace("/(tabs)/today");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(isTamil ? "மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு." : "Invalid email or password.");
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
            {t(strings.auth.login_title)}
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
              autoComplete="current-password"
              placeholder="••••••••"
              placeholderTextColor={C.textTertiary}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? t(strings.auth.btn_loading) : t(strings.auth.btn_login)}
              </Text>
            </TouchableOpacity>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.link, isTamil ? TamilType.caption : EnType.caption]}>
                  {t(strings.auth.forgot_password)}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.auth.no_account)}{" "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, isTamil ? TamilType.caption : EnType.caption]}>
                  {t(strings.auth.btn_register)}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  title: { color: C.textPrimary, marginBottom: S.xl },
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
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.alert,
    marginBottom: S.sm,
  },
  primaryBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 16,
    lineHeight: 24,
    color: C.surface,
  },
  link: { color: C.saffron },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: S.xl, alignItems: "center" },
  footerText: { color: C.textSecond },
});
