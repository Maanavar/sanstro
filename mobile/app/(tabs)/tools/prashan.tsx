import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPrashan } from "@/api/tools";

function outcomeColor(o: "favorable" | "unfavorable" | "mixed"): string {
  if (o === "favorable") return C.green;
  if (o === "unfavorable") return C.alert;
  return C.amber;
}

function outcomeLabel(o: "favorable" | "unfavorable" | "mixed", isTamil: boolean): string {
  if (o === "favorable") return isTamil ? "சாதகம்" : "Favorable";
  if (o === "unfavorable") return isTamil ? "பாதகம்" : "Unfavorable";
  return isTamil ? "கலப்பு" : "Mixed";
}

export default function PrashanScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prashan", question, timestamp],
    queryFn: () => getPrashan({ question, timestamp }),
    enabled: submitted && question.trim().length > 3,
    staleTime: 0,
  });

  function handleAsk() {
    if (!question.trim() || question.trim().length < 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimestamp(new Date().toISOString());
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    setQuestion("");
    setTimestamp("");
  }

  const result = data?.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "பிரச்னம்" : "Horary (Prashan)"}
        </Text>
        {submitted && (
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>{isTamil ? "மீண்டும்" : "Reset"}</Text>
          </TouchableOpacity>
        )}
        {!submitted && <View style={{ width: 50 }} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.intro, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "உங்கள் மனதில் உள்ள கேள்வியை தமிழில் அல்லது ஆங்கிலத்தில் தெளிவாக கேட்கவும். இப்போதைய கிரக நிலை கொண்டு விடை காண்போம்."
              : "Ask any question clearly in your mind, then type it below. The current planetary position will be used to derive the answer."}
          </Text>

          <TextInput
            style={[styles.input, isTamil && { fontFamily: "NotoSansTamil_400Regular" }]}
            placeholder={isTamil ? "உங்கள் கேள்வியை இங்கே எழுதவும்…" : "Type your question here…"}
            placeholderTextColor={C.textTertiary}
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={4}
            maxLength={300}
            editable={!submitted}
          />

          {!submitted && (
            <TouchableOpacity
              style={[styles.cta, question.trim().length < 4 && styles.ctaDisabled]}
              onPress={handleAsk}
              disabled={question.trim().length < 4}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>
                {isTamil ? "விடை காண்க" : "Get Answer"}
              </Text>
            </TouchableOpacity>
          )}

          {isLoading && <SkeletonCard height={200} />}
          {isError && <ErrorCard onRetry={refetch} />}

          {result && (
            <>
              <View style={[styles.outcomeCard, { borderColor: outcomeColor(result.outcome) }]}>
                <View style={styles.outcomeRow}>
                  <Text style={[styles.lagnaText, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
                    {isTamil ? `லக்னம்: ${result.lagna_ta}` : `Lagna: ${result.lagna}`}
                  </Text>
                  <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor(result.outcome) + "22" }]}>
                    <Text style={[styles.outcomeBadgeText, { color: outcomeColor(result.outcome) }]}>
                      {outcomeLabel(result.outcome, isTamil)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.answerCard}>
                <Text style={[styles.answerText, isTamil ? TamilType.body : EnType.body]}>
                  {isTamil ? result.answer_ta : result.answer_en}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  resetText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  intro: { color: C.textSecond, lineHeight: 22 },
  input: {
    backgroundColor: C.surface, borderRadius: RADIUS.input,
    borderWidth: 1, borderColor: C.divider,
    padding: S.base, minHeight: 100, fontSize: 15, lineHeight: 22,
    color: C.textPrimary, textAlignVertical: "top",
  },
  cta: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  outcomeCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, borderWidth: 1.5,
  },
  outcomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lagnaText: { fontSize: 13, color: C.textSecond },
  outcomeBadge: { borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: 4 },
  outcomeBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  answerCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base,
    borderLeftWidth: 3, borderLeftColor: C.gold,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  answerText: { color: C.textPrimary, lineHeight: 24 },
});
