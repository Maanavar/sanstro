import React, { useEffect, useMemo, useState } from "react";
import {
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
import * as Haptics from "expo-haptics";
import { BookOpen } from "lucide-react-native";
import { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/context/ToastContext";
import { ChipStrip } from "@/components/ChipStrip";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionLabel } from "@/components/SectionLabel";
import {
  loadQuickJournalEntries,
  saveQuickJournalEntry,
  syncQuickJournalEntries,
  type QuickJournalEntry,
} from "@/features/journal/journalStore";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { entranceDelay, spring } from "@/theme/motion";

const MOMENTS = [
  { key: "win",       label: "Big win",    labelTa: "வெற்றி" },
  { key: "hard_day",  label: "Hard day",   labelTa: "கஷ்டமான நாள்" },
  { key: "decision",  label: "Decision",   labelTa: "முடிவு" },
  { key: "milestone", label: "Milestone",  labelTa: "மைல்கல்" },
  { key: "quiet",     label: "Nothing yet",labelTa: "அமைதியான நாள்" },
];

const AREAS = [
  { key: "career",   label: "Career",   labelTa: "தொழில்" },
  { key: "love",     label: "Love",     labelTa: "அன்பு" },
  { key: "health",   label: "Health",   labelTa: "உடல்நலம்" },
  { key: "money",    label: "Money",    labelTa: "பணம்" },
  { key: "family",   label: "Family",   labelTa: "குடும்பம்" },
  { key: "spiritual",label: "Spiritual",labelTa: "ஆன்மீகம்" },
  { key: "general",  label: "General",  labelTa: "பொது" },
];

function recentDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const { showSuccess, showError } = useToast();
  const isTamil = lang === "ta";

  const [moment, setMoment] = useState(MOMENTS[0].key);
  const [area, setArea] = useState(AREAS[0].key);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [chartId, setChartId] = useState<string | null>(null);
  const [entries, setEntries] = useState<QuickJournalEntry[]>([]);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
    loadQuickJournalEntries().then(setEntries);
  }, [tier]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const entry: QuickJournalEntry = {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        moment,
        area,
        note: note.trim(),
        chartId,
        dailyScore: null,
        dashaContext: null,
        activeTransit: null,
      };
      const next = await saveQuickJournalEntry(entry);
      if (tier !== "guest" && chartId) void syncQuickJournalEntries(chartId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEntries(next);
      setNote("");
      showSuccess(isTamil ? "தருணம் பதிவு செய்யப்பட்டது" : "Moment logged");
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(isTamil ? "தருணம் சேமிக்க முடியவில்லை" : "Could not save moment");
    } finally {
      setSaving(false);
    }
  }

  const days = recentDays(35);
  const counts = new Map<string, number>();
  entries.forEach((e) => counts.set(dayKey(e.createdAt), (counts.get(dayKey(e.createdAt)) ?? 0) + 1));
  const maxCount = Math.max(1, ...Array.from(counts.values()));
  const recent = entries.slice(0, 12);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Journal"
            titleTa="குறிப்பேடு"
            subtitle={
              entries.length === 0
                ? "Log life moments, see your rhythm"
                : `${entries.length} moment${entries.length === 1 ? "" : "s"} logged`
            }
            subtitleTa={
              entries.length === 0
                ? "தருணங்கள் பதிவு செய்யுங்கள்"
                : `${entries.length} தருணங்கள் பதிவு`
            }
            isTamil={isTamil}
            entering={
              FadeInDown
                .delay(entranceDelay.hero)
                .springify()
                .stiffness(spring.default.stiffness)
                .damping(spring.default.damping)
            }
            badge={
              <View style={styles.iconWell}>
                <BookOpen size={22} color={C.goldOnLight} strokeWidth={1.5} />
              </View>
            }
          />

          {/* Quick entry */}
          <View style={styles.entryCard}>
            <Text style={styles.cardTitle}>
              {isTamil ? "தருணம் பதிவு செய்" : "Log a moment"}
            </Text>

            <Text style={styles.stepLabel}>
              {isTamil ? "என்ன நடந்தது?" : "What happened?"}
            </Text>
            <ChipStrip
              items={MOMENTS}
              selected={moment}
              onSelect={setMoment}
              isTamil={isTamil}
              layout="wrap"
            />

            <Text style={[styles.stepLabel, { marginTop: S.md }]}>
              {isTamil ? "எந்த துறை?" : "Which area?"}
            </Text>
            <ChipStrip
              items={AREAS}
              selected={area}
              onSelect={setArea}
              isTamil={isTamil}
              layout="wrap"
            />

            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={200}
              multiline
              placeholder={
                isTamil ? "கூடுதல் குறிப்பு (விரும்பினால்)…" : "Optional note…"
              }
              placeholderTextColor={C.textTertiary}
              style={styles.noteInput}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {saving
                  ? (isTamil ? "சேமிக்கிறது…" : "Saving…")
                  : (isTamil ? "சேமி" : "Save moment")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* History — only shown once there are entries */}
          {entries.length > 0 && (
            <View style={styles.historyCard}>
              <SectionLabel
                labelEn="Journal rhythm"
                labelTa="தருண வரலாறு"
                isTamil={isTamil}
              />

              {/* 35-day heatmap */}
              <View style={styles.heatGrid}>
                {days.map((day) => {
                  const count = counts.get(day) ?? 0;
                  const opacity = count === 0
                    ? 0.14
                    : 0.28 + (count / maxCount) * 0.62;
                  return (
                    <View
                      key={day}
                      style={[styles.heatCell, { backgroundColor: C.saffron, opacity }]}
                    />
                  );
                })}
              </View>

              {/* Recent entries */}
              <View style={styles.recentList}>
                {recent.map((e) => (
                  <View key={e.id} style={styles.recentRow}>
                    <Text style={styles.recentDate}>{fmt(e.createdAt)}</Text>
                    <Text style={styles.recentArea}>{e.area}</Text>
                    <Text style={styles.recentNote} numberOfLines={1}>
                      {e.note.trim() || e.moment.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.parchment },
    content: { paddingBottom: S.xl * 2, gap: S.md },

    iconWell: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: C.goldLight,
      alignItems: "center",
      justifyContent: "center",
    },

    entryCard: {
      marginHorizontal: S.lg,
      backgroundColor: C.parchmentDeep,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: C.divider,
      padding: S.lg,
      gap: S.sm,
    },
    cardTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      lineHeight: 22,
      color: C.textPrimary,
      marginBottom: S.xs,
    },
    stepLabel: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      lineHeight: 18,
      color: C.textSecond,
    },
    noteInput: {
      minHeight: 80,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: C.divider,
      backgroundColor: C.surface,
      padding: S.md,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      lineHeight: 20,
      color: C.textPrimary,
      textAlignVertical: "top",
      marginTop: S.sm,
    },
    saveBtn: {
      height: 48,
      borderRadius: RADIUS.md,
      backgroundColor: C.saffron,
      alignItems: "center",
      justifyContent: "center",
      marginTop: S.xs,
    },
    saveBtnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 15,
      lineHeight: 20,
      color: C.parchment,
    },

    historyCard: {
      marginHorizontal: S.lg,
      backgroundColor: C.surfaceAlt,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: C.divider,
      padding: S.lg,
      gap: S.sm,
    },
    heatGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: S.xs,
    },
    heatCell: { width: 13, height: 13, borderRadius: 3 },
    recentList: {
      gap: S.xs,
      marginTop: S.sm,
      borderTopWidth: 1,
      borderTopColor: C.divider,
      paddingTop: S.sm,
    },
    recentRow: { flexDirection: "row", gap: S.sm, alignItems: "center" },
    recentDate: {
      width: 56,
      fontFamily: "Inter_600SemiBold",
      fontSize: 11,
      color: C.textTertiary,
    },
    recentArea: {
      width: 60,
      fontFamily: "Inter_700Bold",
      fontSize: 11,
      color: C.saffron,
      textTransform: "uppercase",
    },
    recentNote: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
      color: C.textPrimary,
    },
  });
}
