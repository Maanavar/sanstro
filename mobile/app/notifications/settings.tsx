import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getNotificationPreferences, updateNotificationPreferences } from "@/api/notifications";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import type { NotificationPreferenceData } from "@vinaadi/shared";

export default function NotificationSettingsScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: getNotificationPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const prefs: NotificationPreferenceData | undefined = data?.data;

  const [morningEnabled, setMorningEnabled] = useState(false);
  const [morningTime, setMorningTime] = useState("06:00");
  const [dashaAlert, setDashaAlert] = useState(true);
  const [piranthaNaal, setPiranthaNaal] = useState(true);

  useEffect(() => {
    if (!prefs) return;
    setMorningEnabled(prefs.morningAlertEnabled ?? false);
    setMorningTime(prefs.morningAlertTime ?? "06:00");
    setDashaAlert(prefs.dashaAlertEnabled ?? true);
    setPiranthaNaal(prefs.piranthaNaalAlertEnabled ?? true);
  }, [prefs]);

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });

  function save(patch: Partial<NotificationPreferenceData>) {
    mutation.mutate({
      morningAlertEnabled: morningEnabled,
      morningAlertTime: morningTime,
      dashaAlertEnabled: dashaAlert,
      piranthaNaalAlertEnabled: piranthaNaal,
      ...patch,
    });
  }

  const MORNING_TIMES = ["05:30", "06:00", "06:30", "07:00", "07:30"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "அறிவிப்பு அமைப்புகள்" : "Notification Settings"}
        </Text>
      </View>

      {isLoading && (
        <View style={{ padding: S.base, gap: S.sm }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={72} />
        </View>
      )}
      {isError && <ErrorCard onRetry={refetch} />}

      {!isLoading && !isError && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Morning push big card */}
          <View style={styles.morningCard}>
            <View style={styles.morningRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.morningTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "காலை வழிகாட்டுதல்" : "Morning Guidance"}
                </Text>
                <Text style={[styles.morningSub, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil
                    ? "இன்றைய நிலை + சிறந்த நேரங்கள் காலையிலேயே கிடைக்கும்"
                    : "Daily score + best windows delivered each morning"}
                </Text>
              </View>
              <Switch
                value={morningEnabled}
                onValueChange={(v) => { setMorningEnabled(v); save({ morningAlertEnabled: v }); }}
                trackColor={{ false: C.divider, true: C.saffron }}
                thumbColor={C.surface}
              />
            </View>

            {morningEnabled && (
              <View style={styles.timeSection}>
                <Text style={[styles.timeLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "அனுப்பும் நேரம்" : "Send at"}
                </Text>
                <View style={styles.timeChips}>
                  {MORNING_TIMES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeChip, morningTime === t && styles.timeChipActive]}
                      onPress={() => { setMorningTime(t); save({ morningAlertTime: t }); }}
                    >
                      <Text style={[styles.timeChipText, morningTime === t && styles.timeChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Individual toggles */}
          <Text style={[styles.sectionLabel, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "தனிப்பட்ட எச்சரிக்கைகள்" : "Specific Alerts"}
          </Text>

          {[
            {
              key: "dasha",
              ta: "தசா மாற்ற எச்சரிக்கை",
              en: "Dasha Change Alert",
              subTa: "தசா / அந்தர் தசா மாறும்போது",
              subEn: "When your Dasha or Antardasha changes",
              val: dashaAlert,
              set: (v: boolean) => { setDashaAlert(v); save({ dashaAlertEnabled: v }); },
            },
            {
              key: "piranthanaal",
              ta: "பிறந்தநாள் நினைவூட்டல்",
              en: "Birthday Reminder",
              subTa: "தமிழ் பிறந்தநாள் (நட்சத்திர நாள்) முன்",
              subEn: "Before Tamil birthday (nakshatra day)",
              val: piranthaNaal,
              set: (v: boolean) => { setPiranthaNaal(v); save({ piranthaNaalAlertEnabled: v }); },
            },
          ].map((item) => (
            <View key={item.key} style={styles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.toggleTitle, {
                  fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold",
                  fontSize: 14, lineHeight: 20, color: C.textPrimary,
                }]}>
                  {isTamil ? item.ta : item.en}
                </Text>
                <Text style={[styles.toggleSub, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? item.subTa : item.subEn}
                </Text>
              </View>
              <Switch
                value={item.val}
                onValueChange={item.set}
                trackColor={{ false: C.divider, true: C.saffron }}
                thumbColor={C.surface}
              />
            </View>
          ))}

          {mutation.isError && (
            <Text style={styles.errorText}>
              {isTamil ? "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Failed to save. Please try again."}
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { flex: 1, color: C.textPrimary },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  morningCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, gap: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  morningRow: { flexDirection: "row", alignItems: "center", gap: S.md },
  morningTitle: { color: C.textPrimary, marginBottom: 2 },
  morningSub: { color: C.textSecond },
  timeSection: { gap: S.sm },
  timeLabel: { color: C.textTertiary },
  timeChips: { flexDirection: "row", gap: S.sm, flexWrap: "wrap" },
  timeChip: {
    paddingHorizontal: S.md, paddingVertical: 6, borderRadius: RADIUS.chip,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.parchment,
  },
  timeChipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  timeChipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecond },
  timeChipTextActive: { color: C.surface, fontFamily: "Inter_700Bold" },
  sectionLabel: {
    color: C.textTertiary, paddingHorizontal: S.xs, textTransform: "uppercase", letterSpacing: 0.6,
  },
  toggleRow: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center", gap: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  toggleTitle: {},
  toggleSub: { color: C.textSecond },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.alert, textAlign: "center" },
});
