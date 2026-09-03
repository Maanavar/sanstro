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
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { TIER_LIMITS } from "@vinaadi/shared";
import {
  getLifeEventLog,
  createLifeEventLogEntry,
  type LifeEventLogItem,
} from "@/api/lifeEventLog";

const EVENT_TYPES = [
  { id: "JOB_CHANGE",          en: "Job change",          ta: "வேலை மாற்றம்" },
  { id: "PROMOTION",           en: "Promotion",            ta: "பதோன்னதி" },
  { id: "DEMOTION",            en: "Demotion",             ta: "பதவி குறைப்பு" },
  { id: "JOB_LOSS",            en: "Job loss",             ta: "வேலை இழப்பு" },
  { id: "RELATIONSHIP_START",  en: "Relationship start",   ta: "உறவு தொடக்கம்" },
  { id: "RELATIONSHIP_END",    en: "Relationship end",     ta: "உறவு முடிவு" },
  { id: "MARRIAGE",            en: "Marriage",             ta: "திருமணம்" },
  { id: "DIVORCE",             en: "Divorce",              ta: "விவாகரத்து" },
  { id: "RELOCATION",          en: "Relocation",           ta: "இடமாற்றம்" },
  { id: "TRAVEL_ABROAD",       en: "Travel abroad",        ta: "வெளிநாட்டு பயணம்" },
  { id: "HEALTH_EVENT",        en: "Health event",         ta: "உடல்நல நிகழ்வு" },
  { id: "SURGERY",             en: "Surgery",              ta: "அறுவை சிகிச்சை" },
  { id: "RECOVERY",            en: "Recovery",             ta: "மீட்சி" },
  { id: "EXAM_RESULT",         en: "Exam result",          ta: "தேர்வு முடிவு" },
  { id: "EDUCATION_START",     en: "Education start",      ta: "கல்வி தொடக்கம்" },
  { id: "EDUCATION_END",       en: "Education end",        ta: "கல்வி நிறைவு" },
  { id: "FINANCIAL_MILESTONE", en: "Financial milestone",  ta: "நிதி மைல்கல்" },
  { id: "INVESTMENT",          en: "Investment",           ta: "முதலீடு" },
  { id: "PROPERTY_PURCHASE",   en: "Property purchase",    ta: "சொத்து வாங்குதல்" },
  { id: "DEBT",                en: "Debt",                 ta: "கடன்" },
  { id: "FAMILY_LOSS",         en: "Family loss",          ta: "குடும்ப இழப்பு" },
  { id: "BIRTH_OF_CHILD",      en: "Birth of child",       ta: "குழந்தை பிறப்பு" },
  { id: "BUSINESS_START",      en: "Business start",       ta: "தொழில் தொடக்கம்" },
  { id: "BUSINESS_END",        en: "Business end",         ta: "தொழில் முடிவு" },
  { id: "SPIRITUAL_EVENT",     en: "Spiritual event",      ta: "ஆன்மீக நிகழ்வு" },
  { id: "PILGRIMAGE",          en: "Pilgrimage",           ta: "தீர்த்த யாத்திரை" },
  { id: "LEGAL_MATTER",        en: "Legal matter",         ta: "சட்ட விஷயம்" },
  { id: "OTHER",               en: "Other",                ta: "மற்றவை" },
] as const;

const LOG_QUERY_KEY = (chartId: string) => ["life-event-log", chartId];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function LifeEventLogScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;
  const qc = useQueryClient();

  const [chartId, setChartId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0].id as string);
  const [eventDate, setEventDate] = useState(todayIso());
  const [description, setDescription] = useState("");

  React.useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  const logQuery = useQuery({
    queryKey: LOG_QUERY_KEY(chartId ?? ""),
    queryFn: () => getLifeEventLog(chartId as string),
    enabled: !!chartId && TIER_LIMITS[tier].lifeEventLogEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createLifeEventLogEntry(chartId as string, {
        eventType,
        eventDate,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOG_QUERY_KEY(chartId ?? "") });
      setModalOpen(false);
      setDescription("");
      setEventDate(todayIso());
      setEventType(EVENT_TYPES[0].id);
    },
  });

  const items = logQuery.data?.data ?? [];

  if (!TIER_LIMITS[tier].lifeEventLogEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.gatePanel}>
          <Text style={[styles.gateTitle, type.heading]}>
            {isTamil ? "பிரீமியம் அம்சம்" : "Premium feature"}
          </Text>
          <Text style={[styles.gateBody, type.body]}>
            {isTamil
              ? "வாழ்க்கை நிகழ்வுகளை பதிவு செய்து திருக்கணித தசா-கோட்சாரத்துடன் ஒப்பிட பிரீமியம் தேவை."
              : "Log life events and correlate them with your Thirukanitham dasha-transit patterns. Requires premium."}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/premium")}>
            <Text style={styles.primaryBtnText}>{isTamil ? "பிரீமியம் பெறுங்கள்" : "Upgrade to premium"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{isTamil ? "திரும்பு" : "Go back"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header isTamil={isTamil} action={
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.addBtnText}>{"+"}</Text>
        </TouchableOpacity>
      } />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={logQuery.isFetching} onRefresh={() => logQuery.refetch()} tintColor={C.gold} />
        }
      >
        {logQuery.isLoading ? (
          <>
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
          </>
        ) : logQuery.isError ? (
          <ErrorCard message={isTamil ? "நிகழ்வுகள் ஏற்றல் தோல்வி." : "Could not load events."} onRetry={logQuery.refetch} />
        ) : items.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={[styles.emptyTitle, type.heading]}>
              {isTamil ? "இதுவரை நிகழ்வுகள் இல்லை" : "No events logged yet"}
            </Text>
            <Text style={[styles.emptyBody, type.body]}>
              {isTamil
                ? "வாழ்க்கையில் முக்கிய நிகழ்வுகளை பதிவு செய்யுங்கள். திருக்கணிதம் அந்த நேரத்தில் எந்த தசை / கோட்சாரம் இருந்தது என்று காட்டும்."
                : "Log major life events and Thirukanitham will show which dasha and transits were active — revealing your personal planetary patterns."}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalOpen(true)}>
              <Text style={styles.primaryBtnText}>{isTamil ? "முதல் நிகழ்வை பதிவு செய்யுங்கள்" : "Log first event"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: S.sm }}>
            {items.map((item) => (
              <EventCard key={item.id} item={item} isTamil={isTamil} C={C} styles={styles} type={type} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add event modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isTamil ? "நிகழ்வை பதிவு செய்யுங்கள்" : "Log an event"}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Text style={styles.modalClose}>{"✕"}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, type.caption]}>
              {isTamil ? "நிகழ்வு வகை" : "Event type"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {EVENT_TYPES.map((et) => (
                <TouchableOpacity
                  key={et.id}
                  style={[styles.chip, eventType === et.id && styles.chipActive]}
                  onPress={() => setEventType(et.id)}
                >
                  <Text style={[styles.chipText, eventType === et.id && styles.chipTextActive]}>
                    {isTamil ? et.ta : et.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, type.caption]}>
              {isTamil ? "நிகழ்வு தேதி" : "Event date"}
            </Text>
            <TextInput
              style={styles.input}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.textTertiary}
              maxLength={10}
            />

            <Text style={[styles.fieldLabel, type.caption]}>
              {isTamil ? "குறிப்பு (விரும்பினால்)" : "Notes (optional)"}
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder={isTamil ? "சுருக்கமாக விவரிக்கவும்…" : "Brief description…"}
              placeholderTextColor={C.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {createMutation.isError && (
              <Text style={styles.errorText}>
                {isTamil ? "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்." : "Could not save. Please try again."}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, createMutation.isPending && styles.primaryBtnDisabled]}
              onPress={() => createMutation.mutate()}
              disabled={!eventType || !eventDate || createMutation.isPending}
            >
              <Text style={styles.primaryBtnText}>
                {createMutation.isPending
                  ? (isTamil ? "சேமிக்கிறது…" : "Saving…")
                  : (isTamil ? "சேமி" : "Save")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ isTamil, action }: { isTamil: boolean; action?: React.ReactNode }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon} accessibilityRole="button">
        <Text style={styles.backArrow}>{"←"}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{isTamil ? "வாழ்க்கை நிகழ்வு பதிவு" : "Life Event Log"}</Text>
        <Text style={styles.headerSub}>{isTamil ? "தசா-கோட்சார பொருத்தம்" : "Dasha-transit correlation"}</Text>
      </View>
      {action}
    </View>
  );
}

function EventCard({
  item,
  isTamil,
  C,
  styles,
  type,
}: {
  item: LifeEventLogItem;
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
  type: typeof TamilType | typeof EnType;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = EVENT_TYPES.find((e) => e.id === item.eventType)?.[isTamil ? "ta" : "en"] ?? item.eventType;

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => item.correlation && setExpanded((v) => !v)}
      activeOpacity={item.correlation ? 0.85 : 1}
    >
      <View style={styles.eventRow}>
        <View style={styles.eventMeta}>
          <Text style={[styles.eventType, type.caption]}>{label}</Text>
          <Text style={[styles.eventDate, type.caption]}>{fmt(item.eventDate)}</Text>
        </View>
        {item.correlation && (
          <Text style={styles.expandChevron}>{expanded ? "▲" : "▼"}</Text>
        )}
      </View>
      {item.description && (
        <Text style={[styles.eventDesc, type.body]}>{item.description}</Text>
      )}
      {expanded && item.correlation && (
        <View style={styles.correlationPanel}>
          <View style={styles.dashaRow}>
            <View style={styles.dashaChip}>
              <Text style={styles.dashaChipLabel}>{isTamil ? "மகாதசை" : "Maha"}</Text>
              <Text style={styles.dashaChipValue}>{item.correlation.mahaLord}</Text>
            </View>
            <View style={styles.dashaChip}>
              <Text style={styles.dashaChipLabel}>{isTamil ? "அந்தர்" : "Antar"}</Text>
              <Text style={styles.dashaChipValue}>{item.correlation.antarLord}</Text>
            </View>
          </View>
          <Text style={[styles.correlationNarrative, type.body]}>
            {isTamil ? item.correlation.narrative.ta : item.correlation.narrative.en}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: S.sm,
      paddingHorizontal: S.lg,
      paddingVertical: S.md,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    backIcon: { padding: S.xs },
    backArrow: { fontSize: 20, color: C.textSecond },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
    headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 1 },
    addBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnText: { fontSize: 22, color: C.parchment, fontWeight: "300", lineHeight: 26 },
    content: { padding: S.lg, gap: S.sm, paddingBottom: S.xl },
    gatePanel: { flex: 1, padding: S.lg, justifyContent: "center", gap: S.md },
    gateTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary },
    gateBody: { fontSize: 15, color: C.textSecond, lineHeight: 22 },
    primaryBtn: {
      backgroundColor: C.gold,
      borderRadius: RADIUS.chip,
      paddingVertical: S.sm,
      alignItems: "center",
      marginTop: S.xs,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { color: C.parchment, fontWeight: "700", fontSize: 15 },
    backBtn: { alignItems: "center", marginTop: S.xs },
    backBtnText: { color: C.textTertiary, fontSize: 14 },
    emptyPanel: { gap: S.sm, paddingVertical: S.md },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
    emptyBody: { fontSize: 14, color: C.textSecond, lineHeight: 21 },
    eventCard: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      padding: S.sm,
      gap: S.xs,
      borderWidth: 1,
      borderColor: C.divider,
    },
    eventRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    eventMeta: { flexDirection: "row", gap: S.sm, alignItems: "center" },
    eventType: { fontSize: 13, fontWeight: "700", color: C.gold },
    eventDate: { fontSize: 12, color: C.textTertiary },
    expandChevron: { fontSize: 11, color: C.textTertiary },
    eventDesc: { fontSize: 13, color: C.textPrimary },
    correlationPanel: {
      marginTop: S.xs,
      paddingTop: S.xs,
      borderTopWidth: 1,
      borderTopColor: C.divider,
      gap: S.xs,
    },
    dashaRow: { flexDirection: "row", gap: S.xs },
    dashaChip: {
      paddingHorizontal: S.sm,
      paddingVertical: 3,
      backgroundColor: C.divider,
      borderRadius: RADIUS.sm,
    },
    dashaChipLabel: { fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.4 },
    dashaChipValue: { fontSize: 12, fontWeight: "700", color: C.textPrimary },
    correlationNarrative: { fontSize: 13, color: C.textSecond, lineHeight: 20 },
    modalSafe: { flex: 1, backgroundColor: C.parchment },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: S.lg,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    modalTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
    modalClose: { fontSize: 18, color: C.textTertiary, padding: S.xs },
    modalContent: { padding: S.lg, gap: S.sm, paddingBottom: S.xl },
    fieldLabel: { fontSize: 11, fontWeight: "600", color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase" },
    input: {
      backgroundColor: C.parchment,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: C.divider,
      paddingHorizontal: S.sm,
      paddingVertical: S.xs,
      color: C.textPrimary,
      fontSize: 15,
    },
    textarea: { minHeight: 72, paddingTop: S.sm },
    chipRow: { gap: S.xs, paddingVertical: S.xs },
    chip: {
      paddingHorizontal: S.sm,
      paddingVertical: 5,
      borderRadius: RADIUS.chip,
      backgroundColor: C.parchment,
      borderWidth: 1,
      borderColor: C.divider,
    },
    chipActive: { backgroundColor: C.gold, borderColor: C.gold },
    chipText: { fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.parchment, fontWeight: "600" },
    errorText: { color: C.alert, fontSize: 13 },
  });
}
