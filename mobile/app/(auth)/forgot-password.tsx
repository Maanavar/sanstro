import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { apiPost } from "@/api/client";

export default function ForgotPasswordScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(isTamil ? "மின்னஞ்சல் தேவை." : "Email is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/reset-password/request", { email: trimmed });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <Text style={styles.checkEmoji}>✉️</Text>
          <Text style={[styles.heading, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "மின்னஞ்சல் அனுப்பப்பட்டது" : "Email sent"}
          </Text>
          <Text style={[styles.body, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "கடவுச்சொல் மீட்டமைக்க உங்கள் மின்னஞ்சலை சரிபாருங்கள்."
              : "Check your email for a password reset link."}
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
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
            {isTamil ? "கடவுச்சொல் மீட்க" : "Reset Password"}
          </Text>
          <Text style={[styles.body, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "உங்கள் மின்னஞ்சல் கொடுங்கள். மீட்க இணைப்பு அனுப்புகிறோம்."
              : "Enter your email and we'll send a reset link."}
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

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "…" : (isTamil ? "மின்னஞ்சல் அனுப்பு" : "Send Reset Email")}
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
