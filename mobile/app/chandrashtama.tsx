import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { ErrorCard } from "@/components/ErrorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { getDailyGuidance } from "@/api/guidance";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { DailyGuidanceData } from "@vinaadi/shared";

const AVOID = {
  ta: [
    "à®®à¯à®•à¯à®•à®¿à®¯à®®à®¾à®© à®’à®ªà¯à®ªà®¨à¯à®¤à®™à¯à®•à®³à¯ à®•à¯ˆà®¯à¯†à®´à¯à®¤à¯à®¤à®¿à®Ÿ à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯",
    "à®ªà¯à®¤à®¿à®¯ à®¤à¯Šà®´à®¿à®²à¯ / à®µà®¿à®¯à®¾à®ªà®¾à®° à®®à¯à®¯à®±à¯à®šà®¿ à®¤à¯Šà®Ÿà®™à¯à®• à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯",
    "à®…à®¤à®¿à®• à®ªà®£ à®ªà®°à®¿à®µà®°à¯à®¤à¯à®¤à®©à¯ˆ à®¤à®µà®¿à®°à¯à®•à¯à®•à®µà¯à®®à¯",
    "à®¤à¯‡à®µà¯ˆà®¯à®±à¯à®± à®šà®°à¯à®šà¯à®šà¯ˆà®•à®³à®¿à®²à¯ à®ˆà®Ÿà¯à®ªà®Ÿ à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯",
  ],
  en: [
    "Don't sign important contracts or agreements",
    "Don't launch a new business or major venture",
    "Avoid large financial transactions or loans",
    "Don't get drawn into unnecessary arguments",
  ],
};

type ChandrashtamaGuidance = DailyGuidanceData & {
  isChandrashtama?: boolean;
  is_chandrashtama?: boolean;
  chandrashtamaEnds?: string | null;
  chandrashtama_ends?: string | null;
  chandrashtamaDescriptionTa?: string | null;
  chandrashtamaDescriptionEn?: string | null;
  chandrashtama_description_ta?: string | null;
  chandrashtama_description_en?: string | null;
  nextChandrashtamaBegins?: string | null;
  next_chandrashtama_begins?: string | null;
};

const CAN_DO = {
  ta: [
    "à®†à®©à¯à®®à¯€à®• à®¨à®Ÿà¯ˆà®®à¯à®±à¯ˆà®•à®³à¯ â€” à®¤à®¿à®¯à®¾à®©à®®à¯, à®œà®ªà®®à¯, à®ªà¯‚à®œà¯ˆ",
    "à®•à¯à®Ÿà¯à®®à¯à®ªà®¤à¯à®¤à®¿à®©à®°à¯à®Ÿà®©à¯ à®…à®®à¯ˆà®¤à®¿à®¯à®¾à®• à®¨à¯‡à®°à®®à¯ à®šà¯†à®²à®µà®¿à®Ÿà¯à®™à¯à®•à®³à¯",
    "à®“à®¯à¯à®µà¯ à®Žà®Ÿà¯à®™à¯à®•à®³à¯ â€” à®µà®²à®¿à®®à¯ˆ à®¤à®¿à®°à®Ÿà¯à®Ÿà¯à®®à¯ à®•à®¾à®²à®®à¯",
    "à®†à®²à®¯ à®¤à®°à®¿à®šà®©à®®à¯, à®¤à®°à¯à®®à®®à¯ à®šà¯†à®¯à¯à®µà®¤à¯ à®¨à®²à¯à®²à®¤à¯",
  ],
  en: [
    "Spiritual practice â€” meditation, japa, puja",
    "Spend quiet time with family and loved ones",
    "Rest and restore â€” build inner reserves",
    "Temple visit and charitable giving are beneficial",
  ],
};

export default function ChandrashtamaScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [primaryChartId, setPrimaryChartId] = useState<string | null>(null);

  useEffect(() => {
    getPrimaryChartId().then(setPrimaryChartId);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["daily-guidance", primaryChartId, todayStr, "chandrashtama"],
    queryFn: () => getDailyGuidance(primaryChartId!, todayStr),
    enabled: !!primaryChartId,
    staleTime: 1000 * 60 * 30,
  });

  const guidance = data?.data as ChandrashtamaGuidance | undefined;
  const isActive = Boolean(guidance?.isChandrashtama ?? guidance?.is_chandrashtama);
  const endDate = guidance?.chandrashtamaEnds ?? guidance?.chandrashtama_ends ?? null;
  const nextBegins = guidance?.nextChandrashtamaBegins ?? guidance?.next_chandrashtama_begins ?? null;
  const dynamicDescription = isTamil
    ? guidance?.chandrashtamaDescriptionTa ?? guidance?.chandrashtama_description_ta
    : guidance?.chandrashtamaDescriptionEn ?? guidance?.chandrashtama_description_en;
  const fallbackDescription = guidance
    ? (isTamil ? guidance.cautionSuggestion?.ta ?? guidance.text?.ta : guidance.cautionSuggestion?.en ?? guidance.text?.en)
    : null;
  const statusTitle = !primaryChartId
    ? (isTamil ? "à®¤à®©à®¿à®ªà¯à®ªà®Ÿà¯à®Ÿ à®¨à®¿à®²à¯ˆà®•à¯à®•à¯ à®œà®¾à®¤à®•à®®à¯ à®¤à¯‡à®µà¯ˆ" : "Personal chart needed")
    : isActive
      ? (isTamil ? "à®šà®¨à¯à®¤à®¿à®°à®¾à®·à¯à®Ÿà®®à®®à¯ à®šà¯†à®¯à®²à®¿à®²à¯ à®‰à®³à¯à®³à®¤à¯" : "Chandrashtama is active")
      : (isTamil ? "à®šà®¨à¯à®¤à®¿à®°à®¾à®·à¯à®Ÿà®®à®®à¯ à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®‡à®²à¯à®²à¯ˆ" : "No active Chandrashtama");
  const statusSub = !primaryChartId
    ? (isTamil ? "à®‰à®™à¯à®•à®³à¯ à®œà®¾à®¤à®•à®¤à¯à®¤à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à®¿à®¯ à®ªà®¿à®±à®•à¯ à®¤à®©à®¿à®ªà¯à®ªà®Ÿà¯à®Ÿ à®šà®¨à¯à®¤à®¿à®°à®¾à®·à¯à®Ÿà®®à®®à¯ à®¨à®¿à®²à¯ˆ à®‡à®™à¯à®•à¯‡ à®¤à¯†à®°à®¿à®¯à¯à®®à¯." : "Create your birth chart to see your personal Chandrashtama status here.")
    : isActive
      ? (endDate
        ? `${isTamil ? "à®®à¯à®Ÿà®¿à®¯à¯à®®à¯ à®¨à¯‡à®°à®®à¯: " : "Ends: "}${new Date(endDate).toLocaleString("en-IN")}`
        : (isTamil ? "à®‡à®©à¯à®±à¯ à®•à¯‚à®Ÿà¯à®¤à®²à¯ à®•à®µà®©à®®à¯ à®¤à¯‡à®µà¯ˆ." : "Extra care is advised today."))
      : (nextBegins
        ? `${isTamil ? "à®…à®Ÿà¯à®¤à¯à®¤ à®¤à¯Šà®Ÿà®•à¯à®•à®®à¯: " : "Next begins: "}${new Date(nextBegins).toLocaleString("en-IN")}`
        : (isTamil ? "à®‡à®©à¯à®±à¯ˆà®¯ à®¨à®¿à®²à¯ˆ à®šà®¾à®¤à®¾à®°à®£à®®à®¾à®• à®‰à®³à¯à®³à®¤à¯." : "Today's status looks normal."));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>â†</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "à®šà®¨à¯à®¤à®¿à®°à®¾à®·à¯à®Ÿà®®à®®à¯" : "Chandrashtama"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
      >
        {/* Alert hero */}
        <View style={[styles.alertCard, !primaryChartId && styles.infoCard, primaryChartId && !isActive && styles.safeCard]}>
          <Text style={[styles.alertIcon, { color: !primaryChartId ? C.skyBlue : isActive ? C.caution : C.green }]}>
            {!primaryChartId ? "i" : isActive ? "!" : "OK"}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: !primaryChartId ? C.skyBlue : isActive ? C.caution : C.green }, isTamil ? TamilType.subheading : EnType.subheading]}>
              {statusTitle}
            </Text>
            <Text style={[styles.alertSub, isTamil ? TamilType.caption : EnType.caption]}>
              {statusSub}
            </Text>
          </View>
        </View>

        {isLoading && <SkeletonCard height={88} />}
        {isError && <ErrorCard onRetry={refetch} />}
        {(dynamicDescription || fallbackDescription) && (
          <View style={styles.dynamicCard}>
            <Text style={[styles.dynamicText, isTamil ? TamilType.body : EnType.body]}>
              {dynamicDescription ?? fallbackDescription}
            </Text>
          </View>
        )}

        {/* What to avoid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "à®Žà®©à¯à®© à®¤à®µà®¿à®°à¯à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯?" : "What to avoid?"}
          </Text>
          <View style={styles.bulletList}>
            {(isTamil ? AVOID.ta : AVOID.en).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletIcon, { color: C.alert }]}>âœ•</Text>
                <Text style={[styles.bulletText, isTamil ? TamilType.body : EnType.body]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* What you can do */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "à®Žà®©à¯à®© à®šà¯†à®¯à¯à®¯à®²à®¾à®®à¯?" : "What you CAN do"}
          </Text>
          <View style={styles.bulletList}>
            {(isTamil ? CAN_DO.ta : CAN_DO.en).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletIcon, { color: C.green }]}>âœ“</Text>
                <Text style={[styles.bulletText, isTamil ? TamilType.body : EnType.body]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pariharam link */}
        <View style={styles.parikaraCard}>
          <Text style={[styles.parikaraQuestion, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? "à®à®¤à®¾à®µà®¤à¯ à®ªà®°à®¿à®•à®¾à®°à®®à¯ à®‰à®¤à®µà¯à®®à®¾?" : "Looking for remedies?"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.parikaraLink}>
              {isTamil ? "à®ªà®°à®¿à®•à®¾à®°à®®à¯ à®ªà®±à¯à®±à®¿ à®…à®±à®¿à®¯ â†’" : "Learn about pariharam â†’"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Framing note */}
        <View style={styles.toneNote}>
          <Text style={[styles.toneText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "à®šà®¨à¯à®¤à®¿à®°à®¾à®·à¯à®Ÿà®®à®®à¯ 'à®•à¯†à®Ÿà¯à®Ÿ à®¨à®¾à®³à¯' à®…à®²à¯à®² â€” à®‡à®¤à¯ à®•à®µà®©à®®à®¾à®• à®šà¯†à®¯à®²à¯à®ªà®Ÿ à®µà¯‡à®£à¯à®Ÿà®¿à®¯ à®•à®¾à®²à®®à¯. à®šà®°à®¿à®¯à®¾à®• à®¤à®¿à®Ÿà¯à®Ÿà®®à®¿à®Ÿà¯à®Ÿà®¾à®²à¯ à®¨à®©à¯à®®à¯ˆ à®ªà¯†à®±à®²à®¾à®®à¯."
              : "Chandrashtama is not a 'bad day' â€” it's a time for awareness and care. With right planning, you can still thrive."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
    backgroundColor: "#FFF9F0",
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
  alertCard: {
    backgroundColor: "#FFF3E0", borderRadius: RADIUS.card,
    borderLeftWidth: 4, borderLeftColor: C.caution,
    padding: S.base, flexDirection: "row", gap: S.md, alignItems: "flex-start",
  },
  alertIcon: { fontFamily: "Inter_800ExtraBold", fontSize: 22, minWidth: 30, textAlign: "center" },
  alertTitle: { marginBottom: 4 },
  alertSub: { color: C.textSecond },
  infoCard: { backgroundColor: "#EEF4FF", borderLeftColor: C.skyBlue },
  safeCard: { backgroundColor: "#EFF8F0", borderLeftColor: C.green },
  dynamicCard: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, borderWidth: 1, borderColor: C.divider },
  dynamicText: { color: C.textPrimary },
  section: { gap: S.sm },
  sectionTitle: { color: C.textPrimary },
  bulletList: { gap: S.sm },
  bulletRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  bulletIcon: { fontFamily: "Inter_700Bold", fontSize: 14, width: 20, marginTop: 2 },
  bulletText: { color: C.textPrimary, flex: 1 },
  parikaraCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, gap: S.sm, borderWidth: 1, borderColor: C.divider,
  },
  parikaraQuestion: { color: C.textPrimary },
  parikaraLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.saffron },
  toneNote: {
    backgroundColor: "#EFF8F0", borderRadius: RADIUS.card,
    padding: S.md, borderLeftWidth: 3, borderLeftColor: C.green,
  },
  toneText: { color: C.textSecond },
});
