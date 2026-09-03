import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, Sparkles, FolderOpen } from "lucide-react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { getDailyStatus, askVinaadi } from "@/api/askVinaadi";

const SUGGESTED_QUESTIONS = [
  { ta: "திருமணம் எப்போது?", en: "When will I get married?" },
  { ta: "தொழில் மாற்றம் சரியா?", en: "Is a career change right for me?" },
  { ta: "இந்த ஆண்டு எப்படி?", en: "How is this year for me?" },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  signals?: string[];
  confidence?: string;
  caveat?: string;
}

export default function AskVinaadiScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { tier } = useSession();
  const { chartId: _chartId } = useLocalSearchParams<{ chartId?: string }>();
  const chartId = Array.isArray(_chartId) ? _chartId[0] : _chartId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data: statusData } = useQuery({
    queryKey: ["ask-vinaadi-status"],
    queryFn: getDailyStatus,
    staleTime: 1000 * 60,
    enabled: tier !== "guest",
  });

  const questionsUsed = statusData?.questionsUsedToday ?? 0;
  const dailyLimit = statusData?.dailyLimit ?? 5;
  const chipsLeft = statusData?.chipsRemaining;
  const atLimit = questionsUsed >= dailyLimit;

  // Gate: guests and registered users without a chartId need to go create a chart first
  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            Ask Vinaadi
          </Text>
        </View>
        <View style={styles.gateContainer}>
          <Sparkles size={56} color={C.gold} strokeWidth={1} style={{ marginBottom: S.sm }} />
          <Text style={[styles.gateTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "கணக்கு தேவை" : "Account Required"}
          </Text>
          <Text style={[styles.gateSub, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "உங்கள் ஜாதகத்தின் அடிப்படையில் பதில்கள் பெற கணக்கு உருவாக்குங்கள்."
              : "Create an account and birth chart to get personalised chart-based answers."}
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeBtnText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "கணக்கு உருவாக்கு" : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!chartId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            Ask Vinaadi
          </Text>
        </View>
        <View style={styles.gateContainer}>
          <FolderOpen size={56} color={C.gold} strokeWidth={1} style={{ marginBottom: S.sm }} />
          <Text style={[styles.gateTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "ஜாதகம் தேவை" : "Chart Required"}
          </Text>
          <Text style={[styles.gateSub, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "Ask Vinaadi பயன்படுத்த ஜாதகம் தேவை. முதலில் ஜாதகம் உருவாக்குங்கள்."
              : "Ask Vinaadi needs your birth chart. Please create one first."}
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/(tabs)/tools")}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeBtnText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "ஜாதகம் உருவாக்கு →" : "Create Chart →"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function sendMessage(text: string, isChip = false) {
    const question = text.trim();
    if (!question || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await askVinaadi(chartId, question, lang, isChip);
      const d = res.data;
      const answerText = isTamil ? d.answer.ta : d.answer.en;
      const caveatText = d.caveat ? (isTamil ? d.caveat.ta : d.caveat.en) : undefined;

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: answerText,
        signals: d.signalsUsed,
        confidence: d.confidence,
        caveat: caveatText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const status = err instanceof Error && "status" in err ? (err as { status: number }).status : 0;
      let errText = isTamil ? "பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்." : "Something went wrong. Please try again.";
      if (status === 429) {
        errText = isTamil
          ? `இன்று ${dailyLimit} கேள்விகள் முடிந்தன. நாளை மீண்டும் கேளுங்கள்.`
          : `Daily limit of ${dailyLimit} questions reached. Come back tomorrow.`;
      }
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: errText,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            Ask Vinaadi
          </Text>
          <Text style={[styles.headerSub, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "உங்கள் ஜாதகத்தில் இருந்து பதில்கள்" : "Answers from your birth chart"}
          </Text>
        </View>
        {chipsLeft !== null && chipsLeft !== undefined && (
          <View style={styles.chipCountBadge}>
            <Text style={styles.chipCountText}>{chipsLeft}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>V</Text>
              <Text style={[styles.emptyChatText, isTamil ? TamilType.body : EnType.body]}>
                {isTamil
                  ? "உங்கள் ஜாதகத்தில் இருந்து கேள்விகளுக்கு திருக்கணித அடிப்படையில் பதில் கிடைக்கும்."
                  : "Get Thirukanitham-based answers to questions about your birth chart."}
              </Text>
            </View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === "assistant" && (
                <View style={styles.assistantAvatar}>
                  <Text style={styles.assistantAvatarText}>V</Text>
                </View>
              )}
              <View style={[styles.bubbleContent, msg.role === "user" ? styles.userBubbleContent : styles.assistantBubbleContent]}>
                <Text style={[styles.bubbleText, isTamil ? TamilType.body : EnType.body]}>
                  {msg.text}
                </Text>
                {msg.caveat && (
                  <View style={styles.caveatRow}>
                    <AlertTriangle size={12} color={C.caution} strokeWidth={1.5} />
                    <Text style={[styles.caveatText, isTamil ? TamilType.caption : EnType.caption]}>
                      {msg.caveat}
                    </Text>
                  </View>
                )}
                {msg.signals && msg.signals.length > 0 && (
                  <Text style={styles.signalsText} numberOfLines={2}>
                    {msg.signals.join(" · ")}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {isSending && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <View style={styles.assistantAvatar}>
                <Text style={styles.assistantAvatarText}>V</Text>
              </View>
              <View style={[styles.bubbleContent, styles.assistantBubbleContent]}>
                <ActivityIndicator size="small" color={C.saffron} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested chips — shown when chat is empty */}
        {messages.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestChip}
                onPress={() => sendMessage(isTamil ? q.ta : q.en, true)}
                disabled={atLimit}
                activeOpacity={0.85}
              >
                <Text style={[styles.suggestChipText, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? q.ta : q.en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={[styles.disclaimerText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "இது ஜாதக-அடிப்படையிலான வழிகாட்டுதல். இறுதி முடிவு உங்களுடையது."
              : "This is chart-based guidance. Final decisions are yours."}
          </Text>
        </View>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={[
              styles.textInput,
              isTamil ? TamilType.body : EnType.body,
              { color: C.textPrimary },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder={isTamil ? "கேளுங்கள்..." : "Ask something..."}
            placeholderTextColor={C.textTertiary}
            multiline
            maxLength={500}
            editable={!atLimit}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isSending || atLimit) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isSending || atLimit}
            activeOpacity={0.85}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>

        {atLimit && (
          <View style={styles.limitBar}>
            <Text style={[styles.limitBarText, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil
                ? `இன்று ${dailyLimit} கேள்விகள் முடிந்தன. நாளை மீண்டும் கேளுங்கள்.`
                : `Daily limit of ${dailyLimit} questions reached. Come back tomorrow.`}
            </Text>
            {tier !== "premium" && (
              <TouchableOpacity onPress={() => router.push("/premium")}>
                <Text style={styles.limitUpgradeText}>
                  {isTamil ? "Premium →" : "Premium →"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    backgroundColor: C.surface,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: { color: C.textPrimary },
  headerSub: { color: C.textTertiary },
  chipCountBadge: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.chip,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.xs,
  },
  chipCountText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.surface },
  chatArea: { flex: 1 },
  chatContent: {
    padding: S.base,
    gap: S.md,
    paddingBottom: S.base,
  },
  emptyChat: {
    alignItems: "center",
    paddingTop: S.xxl,
    gap: S.base,
    paddingHorizontal: S.xl,
  },
  emptyChatIcon: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 48,
    color: C.saffron,
    width: 72,
    height: 72,
    textAlign: "center",
    lineHeight: 72,
    backgroundColor: C.goldMethodLight,
    borderRadius: 36,
  },
  emptyChatText: { color: C.textSecond, textAlign: "center", lineHeight: 22 },
  bubble: { flexDirection: "row", gap: S.sm, alignItems: "flex-end" },
  userBubble: { justifyContent: "flex-end" },
  assistantBubble: { justifyContent: "flex-start" },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.saffron,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  assistantAvatarText: { fontFamily: "Inter_800ExtraBold", fontSize: 12, color: C.surface },
  bubbleContent: {
    maxWidth: "78%",
    borderRadius: 16,
    padding: S.md,
    gap: S.xs,
  },
  userBubbleContent: { backgroundColor: C.goldMethodLight, borderBottomRightRadius: 4 },
  assistantBubbleContent: { backgroundColor: C.surface, borderBottomLeftRadius: 4 },
  bubbleText: { color: C.textPrimary, lineHeight: 22 },
  caveatRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: S.xs, marginTop: S.xs },
  caveatText: { color: C.caution, lineHeight: 18, flex: 1 },
  signalsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textTertiary,
    lineHeight: 14,
    marginTop: S.xs,
  },
  chipsRow: {
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    gap: S.sm,
  },
  suggestChip: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
    borderColor: C.saffron,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
  },
  suggestChipText: { color: C.saffron },
  disclaimer: {
    backgroundColor: C.goldLight,
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  disclaimerText: { color: C.textTertiary, textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: S.sm,
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  textInput: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    maxHeight: 100,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.saffron,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: C.divider },
  sendBtnText: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.surface },
  limitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: S.sm,
    backgroundColor: C.goldMethodLight,
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.amber,
  },
  limitBarText: { color: C.caution, flex: 1 },
  limitUpgradeText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron },
  gateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
    gap: S.base,
  },
  gateTitle: { color: C.textPrimary, textAlign: "center" },
  gateSub: { color: C.textSecond, textAlign: "center", lineHeight: 22 },
  upgradeBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    marginTop: S.sm,
  },
  upgradeBtnText: { color: C.surface, fontFamily: "Inter_700Bold" },
  });
}
