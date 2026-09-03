import React, { useMemo, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPrimaryChartId } from "@/lib/userPrefs";
import {
  GOAL_TYPES,
  createGoal,
  deactivateGoal,
  goalsKeys,
  listGoals,
  type GoalData,
} from "@/api/goals";

const CURRENT_DASHA_AREAS: Record<string, string> = {
  career: "Career windows appear in dasha periods of Sun, Saturn, and 10th lord.",
  marriage: "Marriage timing aligns with Venus and 7th lord dashas.",
  education: "Mercury and Jupiter dashas support learning.",
  health: "Review 6th house lord dasha periods for health focus.",
  wealth: "Jupiter, Venus, and 2nd/11th lord dashas indicate accumulation periods.",
  family: "4th and 7th lord dashas shape family life.",
  spiritual: "Ketu and Jupiter dashas deepen spiritual inquiry.",
  property: "4th lord and Mars dashas are relevant for property.",
  travel: "12th lord and Rahu dashas often bring journeys.",
  general: "Each dasha brings its own flavour of events.",
};

export default function GoalsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { showError } = useToast();
  const confirm = useConfirm();
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;
  const qc = useQueryClient();

  const [chartId, setChartId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES[0].key as string);
  const [description, setDescription] = useState("");

  React.useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: goalsKeys.list(chartId ?? "", true),
    queryFn: () => listGoals(chartId as string, true),
    enabled: !!chartId && tier !== "guest",
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { chartId: string; goalType: string; description?: string }) =>
      createGoal(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: goalsKeys.list(chartId ?? "", true) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddOpen(false);
      setDescription("");
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(isTamil ? "இலக்கை சேமிக்க முடியவில்லை" : "Could not save goal. Please try again.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deactivateGoal,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: goalsKeys.list(chartId ?? "", true) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const goals = data?.data.goals ?? [];

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.emptyPanel}>
          <Text style={[styles.emptyTitle, type.heading]}>Sign in to set goals</Text>
          <Text style={[styles.emptyBody, type.body]}>
            Goals are linked to your birth chart and correlated with your dasha timeline.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.primaryBtnText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header isTamil={isTamil} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.gold} />}
      >
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>{isTamil ? "About goals" : "About goals"}</Text>
          <Text style={[styles.contextBody, type.body]}>
            {isTamil
              ? "உங்கள் தசா காலத்திற்கு ஏற்ப உங்கள் இலக்குகள் பரிசீலிக்கப்படுகின்றன."
              : "Your goals are reviewed against your current dasha period and life-area outlook to show alignment windows."}
          </Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonCard height={88} />
            <SkeletonCard height={88} />
          </>
        ) : isError ? (
          <ErrorCard message="Could not load goals." onRetry={refetch} />
        ) : goals.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={[styles.emptyTitle, type.heading]}>No active goals yet</Text>
            <Text style={[styles.emptyBody, type.body]}>
              {isTamil
                ? "ஒரு இலக்கை சேர்க்க + பட்டனை அழுத்துங்கள்."
                : "Tap + to add your first goal. Goals help Vinaadi surface the most relevant timing windows for you."}
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.goalId}
              goal={goal}
              isTamil={isTamil}
              onRemove={async () => {
                const ok = await confirm({
                  title: isTamil ? "இலக்கை நீக்கவா?" : "Remove goal?",
                  body: isTamil ? "இந்த இலக்கு செயலற்றதாக மாறும்." : "This will mark the goal as inactive.",
                  confirmLabel: isTamil ? "நீக்கு" : "Remove",
                  style: "destructive",
                });
                if (ok) removeMutation.mutate(goal.goalId);
              }}
            />
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAddOpen(true);
          }}
          accessibilityLabel="Add a goal"
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>{isTamil ? "+ இலக்கு சேர்க்க" : "+ Add a goal"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={() => setAddOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{isTamil ? "புதிய இலக்கு" : "New goal"}</Text>

            <Text style={styles.sheetLabel}>{isTamil ? "வகை" : "Category"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {GOAL_TYPES.map((gt) => (
                <TouchableOpacity
                  key={gt.key}
                  style={[styles.chip, selectedType === gt.key && styles.chipActive]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedType(gt.key); }}
                >
                  <Text style={[styles.chipText, selectedType === gt.key && styles.chipTextActive]}>
                    {isTamil ? gt.labelTa : gt.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sheetLabel}>{isTamil ? "விவரம் (optional)" : "Description (optional)"}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
              placeholder={isTamil ? "உங்கள் இலக்கை விவரிக்கவும்" : "Describe your goal"}
              placeholderTextColor={C.textTertiary}
              style={styles.input}
            />

            <View style={styles.contextHint}>
              <Text style={styles.contextHintText}>
                {CURRENT_DASHA_AREAS[selectedType] ?? ""}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
              disabled={createMutation.isPending}
              onPress={() => {
                if (!chartId) return;
                createMutation.mutate({
                  chartId,
                  goalType: selectedType,
                  description: description.trim() || undefined,
                });
              }}
            >
              <Text style={styles.saveBtnText}>
                {createMutation.isPending ? "Saving…" : (isTamil ? "சேமி" : "Save goal")}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isTamil ? "இலக்குகள்" : "Goals"}</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

function GoalCard({ goal, isTamil, onRemove }: { goal: GoalData; isTamil: boolean; onRemove: () => void }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const gt = GOAL_TYPES.find((g) => g.key === goal.goalType);
  const label = gt ? (isTamil ? gt.labelTa : gt.labelEn) : goal.goalType;
  const hint = CURRENT_DASHA_AREAS[goal.goalType] ?? "";
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalTop}>
        <View style={styles.goalTypeBadge}>
          <Text style={styles.goalTypeText}>{label}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
      {goal.description ? (
        <Text style={styles.goalDesc}>{goal.description}</Text>
      ) : null}
      <Text style={styles.goalHint}>{hint}</Text>
      <Text style={styles.goalDate}>
        Added {new Date(goal.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </Text>
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: S.base,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: S.sm,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 32 },
  headerTitle: { flex: 1, fontFamily: "Inter_800ExtraBold", fontSize: 20, color: C.textPrimary, textAlign: "center" },
  content: { padding: S.lg, paddingBottom: S.xl * 2, gap: S.md },
  contextCard: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.md,
    borderWidth: 1, borderColor: C.gold,
  },
  contextLabel: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 0, marginBottom: S.xs },
  contextBody: { color: C.textPrimary },
  emptyPanel: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.lg, gap: S.sm,
    borderWidth: 1, borderColor: C.divider,
  },
  emptyTitle: { color: C.textPrimary },
  emptyBody: { color: C.textSecond },
  primaryBtn: { alignSelf: "flex-start", marginTop: S.sm, backgroundColor: C.saffron, borderRadius: RADIUS.button, paddingHorizontal: S.lg, paddingVertical: S.sm },
  primaryBtnText: { color: C.indigoText, fontFamily: "Inter_700Bold", fontSize: 14 },
  goalCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: S.xs,
    borderWidth: 1, borderColor: C.divider,
  },
  goalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalTypeBadge: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 3 },
  goalTypeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textPrimary },
  removeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.caution },
  goalDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: C.textPrimary, marginTop: 2 },
  goalHint: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: C.textSecond, fontStyle: "italic" },
  goalDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, marginTop: 2 },
  addBtn: {
    borderRadius: RADIUS.button, borderWidth: 2, borderColor: C.saffron, borderStyle: "dashed",
    paddingVertical: S.md, alignItems: "center",
  },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.saffron },
  scrim: { flex: 1, backgroundColor: C.darkBg + "57", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: S.lg, gap: S.sm, maxHeight: "86%" },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 999, backgroundColor: C.gold, marginBottom: S.xs },
  sheetTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: C.textPrimary },
  sheetLabel: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.textSecond, marginTop: S.xs },
  chipRow: { gap: S.xs, paddingVertical: S.xs },
  chip: { borderRadius: RADIUS.chip, backgroundColor: C.surfaceAlt, paddingHorizontal: S.md, paddingVertical: S.xs, borderWidth: 1, borderColor: C.divider },
  chipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  chipText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textSecond },
  chipTextActive: { color: C.indigoText },
  input: { minHeight: 80, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, color: C.textPrimary, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  contextHint: { backgroundColor: C.goldMethodLight, borderRadius: RADIUS.chip, padding: S.sm },
  contextHintText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: C.textPrimary, fontStyle: "italic" },
  saveBtn: { borderRadius: RADIUS.button, backgroundColor: C.saffron, paddingVertical: S.sm, alignItems: "center", marginTop: S.xs },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: "Inter_800ExtraBold", fontSize: 14, color: C.indigoText },
  });
}
