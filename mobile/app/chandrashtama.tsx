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
    "முக்கியமான ஒப்பந்தங்கள் கையெழுத்திட வேண்டாம்",
    "புதிய தொழில் / வியாபார முயற்சி தொடங்க வேண்டாம்",
    "அதிக பண பரிவர்த்தனை தவிர்க்கவும்",
    "தேவையற்ற சர்ச்சைகளில் ஈடுபட வேண்டாம்",
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
    "ஆன்மீக நடைமுறைகள் — தியானம், ஜபம், பூஜை",
    "குடும்பத்தினருடன் அமைதியாக நேரம் செலவிடுங்கள்",
    "ஓய்வு எடுங்கள் — வலிமை திரட்டும் காலம்",
    "ஆலய தரிசனம், தர்மம் செய்வது நல்லது",
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
    ? (isTamil ? "தனிப்பட்ட நிலைக்கு ஜாதகம் தேவை" : "Personal chart needed")
    : isActive
      ? (isTamil ? "சந்திராஷ்டமம் செயலில் உள்ளது" : "Chandrashtama is active")
      : (isTamil ? "சந்திராஷ்டமம் இப்போது இல்லை" : "No active Chandrashtama");
  const statusSub = !primaryChartId
    ? (isTamil ? "உங்கள் ஜாதகத்தை உருவாக்கிய பிறகு தனிப்பட்ட சந்திராஷ்டமம் நிலை இங்கே தெரியும்." : "Create your birth chart to see your personal Chandrashtama status here.")
    : isActive
      ? (endDate
        ? `${isTamil ? "முடியும் நேரம்: " : "Ends: "}${new Date(endDate).toLocaleString("en-IN")}`
        : (isTamil ? "இன்று கூடுதல் கவனம் தேவை." : "Extra care is advised today."))
      : (nextBegins
        ? `${isTamil ? "அடுத்த தொடக்கம்: " : "Next begins: "}${new Date(nextBegins).toLocaleString("en-IN")}`
        : (isTamil ? "இன்றைய நிலை சாதாரணமாக உள்ளது." : "Today's status looks normal."));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>â†</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "சந்திராஷ்டமம்" : "Chandrashtama"}
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
            {isTamil ? "என்ன தவிர்க்க வேண்டும்?" : "What to avoid?"}
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
            {isTamil ? "என்ன செய்யலாம்?" : "What you CAN do"}
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
            {isTamil ? "ஏதாவது பரிகாரம் உதவுமா?" : "Looking for remedies?"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.parikaraLink}>
              {isTamil ? "பரிகாரம் பற்றி அறிய →" : "Learn about pariharam →"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Framing note */}
        <View style={styles.toneNote}>
          <Text style={[styles.toneText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "சந்திராஷ்டமம் 'கெட்ட நாள்' அல்ல — இது கவனமாக செயல்பட வேண்டிய காலம். சரியாக திட்டமிட்டால் நன்மை பெறலாம்."
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
    backgroundColor: C.goldLight,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
  alertCard: {
    backgroundColor: C.cautionLight, borderRadius: RADIUS.card,
    borderLeftWidth: 4, borderLeftColor: C.caution,
    padding: S.base, flexDirection: "row", gap: S.md, alignItems: "flex-start",
  },
  alertIcon: { fontFamily: "Inter_800ExtraBold", fontSize: 22, minWidth: 30, textAlign: "center" },
  alertTitle: { marginBottom: 4 },
  alertSub: { color: C.textSecond },
  infoCard: { backgroundColor: C.skyBlueLight, borderLeftColor: C.skyBlue },
  safeCard: { backgroundColor: C.greenLight, borderLeftColor: C.green },
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
    backgroundColor: C.greenLight, borderRadius: RADIUS.card,
    padding: S.md, borderLeftWidth: 3, borderLeftColor: C.green,
  },
  toneText: { color: C.textSecond },
});
