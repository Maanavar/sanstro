import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { getVargas, vargaKeys, type VargaData } from "@/api/vargas";

const PLANET_LABELS: Record<string, { en: string; ta: string }> = {
  Sun:     { en: "Sun",     ta: "சூரியன்" },
  Moon:    { en: "Moon",    ta: "சந்திரன்" },
  Mars:    { en: "Mars",    ta: "செவ்வாய்" },
  Mercury: { en: "Mercury", ta: "புதன்" },
  Jupiter: { en: "Jupiter", ta: "குரு" },
  Venus:   { en: "Venus",   ta: "சுக்ரன்" },
  Saturn:  { en: "Saturn",  ta: "சனி" },
  Rahu:    { en: "Rahu",    ta: "ராகு" },
  Ketu:    { en: "Ketu",    ta: "கேது" },
};

const VARGA_CONTEXT: Record<string, { en: string; ta: string }> = {
  D1:  { en: "Overall chart — all life domains.", ta: "ஒட்டுமொத்த வாழ்க்கை." },
  D9:  { en: "Marriage, dharma, and spiritual strength.", ta: "திருமணம், தர்மம், ஆன்மீக வலிமை." },
  D10: { en: "Career, profession, and public status.", ta: "தொழில் மற்றும் சமூக அந்தஸ்து." },
  D2:  { en: "Wealth and income.", ta: "செல்வம் மற்றும் வருமானம்." },
  D3:  { en: "Siblings, courage, and communication.", ta: "உடன்பிறப்புகள் மற்றும் தைரியம்." },
  D7:  { en: "Children and progeny.", ta: "குழந்தைகள் மற்றும் சந்தானம்." },
  D12: { en: "Parents and ancestry.", ta: "பெற்றோர் மற்றும் மூதாதையர்." },
  D27: { en: "Strengths, weaknesses, and general well-being.", ta: "பலம், பலவீனம், பொது நலம்." },
  D40: { en: "Auspicious and inauspicious effects inherited maternally.", ta: "தாய்வழி பரம்பரை பலன்கள்." },
  D45: { en: "Character and general life conduct.", ta: "பண்பு மற்றும் வாழ்க்கை நடத்தை." },
  D60: { en: "Fine-grained overall karma — most sensitive to exact birth time.", ta: "நுண்ணிய ஒட்டுமொத்த கர்மா — பிறந்த நேரத்தில் மிகவும் உணர்திறன்." },
};

export default function VargasScreen() {
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;

  const [chartId, setChartId] = React.useState<string | null>(null);
  const [selectedVarga, setSelectedVarga] = useState<string>("D9");

  React.useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: vargaKeys.chart(chartId ?? ""),
    queryFn: () => getVargas(chartId as string),
    enabled: !!chartId && tier !== "guest",
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days — same as jadhagam
  });

  const vargas = data?.data.vargas ?? [];
  const activeVarga = vargas.find((v) => v.name === selectedVarga) ?? vargas[0];

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.emptyPanel}>
          <Text style={[styles.emptyTitle, type.heading]}>Sign in to view divisional charts</Text>
          <Text style={[styles.emptyBody, type.body]}>
            Varga charts are calculated from your birth chart and reveal depth in specific life domains.
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
        {/* Varga selector tabs */}
        {vargas.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {vargas.map((v) => (
              <TouchableOpacity
                key={v.name}
                style={[styles.tab, selectedVarga === v.name && styles.tabActive]}
                onPress={() => setSelectedVarga(v.name)}
              >
                <Text style={[styles.tabName, selectedVarga === v.name && styles.tabNameActive]}>{v.name}</Text>
                <Text style={[styles.tabLabel, selectedVarga === v.name && styles.tabLabelActive]}>
                  {isTamil ? v.labelTa : v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {isLoading ? (
          <>
            <SkeletonCard height={60} />
            <SkeletonCard height={320} />
          </>
        ) : isError ? (
          <ErrorCard message="Could not load divisional charts." onRetry={refetch} />
        ) : !activeVarga ? (
          <View style={styles.emptyPanel}>
            <Text style={[styles.emptyTitle, type.heading]}>No varga data available</Text>
            <Text style={[styles.emptyBody, type.body]}>
              Ensure your chart has been calculated with the full divisional chart set.
            </Text>
          </View>
        ) : (
          <VargaDetail varga={activeVarga} isTamil={isTamil} />
        )}

        <ThirukanithamBadge style={styles.badge} />
      </ScrollView>
    </SafeAreaView>
  );
}

function VargaDetail({ varga, isTamil }: { varga: VargaData; isTamil: boolean }) {
  const context = VARGA_CONTEXT[varga.name];
  const planets = Object.entries(varga.positions).sort((a, b) => a[1] - b[1]);

  return (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>{isTamil ? "பிரிவு ஜாதகம்" : "Divisional Chart"}</Text>
        <Text style={styles.heroName}>{varga.name} — {isTamil ? varga.labelTa : varga.label}</Text>
        {context && (
          <Text style={styles.heroPurpose}>{isTamil ? context.ta : context.en}</Text>
        )}
        <View style={styles.heroBadgeRow}>
          <View style={styles.methodBadge}>
            <Text style={styles.methodBadgeText}>Thirukanitham</Text>
          </View>
          {varga.reliability === "LOW" && (
            <View style={[styles.methodBadge, styles.lowReliabilityBadge]}>
              <Text style={[styles.methodBadgeText, styles.lowReliabilityBadgeText]}>
                {isTamil ? "பிறந்த நேரம் துல்லியமாக இல்லை" : "Needs exact birth time"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Planet-to-house grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isTamil ? "கிரக நிலைகள்" : "Planet positions"}</Text>
        <View style={styles.positionGrid}>
          {planets.map(([planet, house]) => {
            const p = PLANET_LABELS[planet];
            return (
              <View key={planet} style={styles.positionRow}>
                <Text style={styles.positionPlanet}>{isTamil ? (p?.ta ?? planet) : (p?.en ?? planet)}</Text>
                <View style={styles.positionBar}>
                  <View style={[styles.positionFill, { width: `${(house / 12) * 100}%` }]} />
                </View>
                <Text style={styles.positionHouse}>{isTamil ? `வீடு ${house}` : `House ${house}`}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* How this chart is used */}
      <View style={styles.whyCard}>
        <Text style={styles.whyTitle}>{isTamil ? "இந்த ஜாதகம் எதற்காக?" : "How this chart is used"}</Text>
        <Text style={styles.whyBody}>
          {isTamil
            ? `${varga.name} (${varga.labelTa}) ஜாதகம் ${context?.ta ?? ""} ஐ ஆராய Thirukanitham முறையில் பயன்படுத்தப்படுகிறது. ராசி ஜாதகத்தில் காணும் கிரகங்களின் வலிமை, இந்த பிரிவு ஜாதகத்தில் உறுதி செய்யப்படுகிறது.`
            : `The ${varga.name} (${varga.label}) chart is used in Thirukanitham to assess ${context?.en ?? ""} The strength of planets seen in the Rasi chart is confirmed or qualified here.`}
        </Text>
      </View>
    </>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isTamil ? "பிரிவு ஜாதகங்கள்" : "Divisional Charts"}</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: S.base,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: S.sm,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 32 },
  headerTitle: { flex: 1, fontFamily: "Inter_800ExtraBold", fontSize: 20, color: C.textPrimary, textAlign: "center" },
  content: { padding: S.lg, paddingBottom: S.xl * 2, gap: S.md },
  tabRow: { gap: S.sm, paddingBottom: S.xs },
  tab: {
    borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider,
    backgroundColor: C.surface, paddingHorizontal: S.md, paddingVertical: S.sm,
    alignItems: "center", minWidth: 80,
  },
  tabActive: { backgroundColor: C.darkBg, borderColor: C.darkBg },
  tabName: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: C.textPrimary },
  tabNameActive: { color: C.gold },
  tabLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textTertiary, marginTop: 2 },
  tabLabelActive: { color: "rgba(255,255,255,0.6)" },
  hero: { backgroundColor: C.darkBg, borderRadius: RADIUS.card, padding: S.lg, gap: S.xs },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 0 },
  heroName: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: "#FFF" },
  heroPurpose: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.72)" },
  heroBadgeRow: { flexDirection: "row", marginTop: S.sm, gap: S.sm },
  methodBadge: { borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.gold, paddingHorizontal: S.sm, paddingVertical: 2 },
  methodBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold },
  lowReliabilityBadge: { borderColor: "rgba(255,255,255,0.5)" },
  lowReliabilityBadgeText: { color: "rgba(255,255,255,0.8)" },
  section: { backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, gap: S.sm },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.textPrimary },
  positionGrid: { gap: S.sm },
  positionRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  positionPlanet: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textPrimary, width: 72 },
  positionBar: { flex: 1, height: 6, borderRadius: 999, backgroundColor: C.surfaceAlt, overflow: "hidden" },
  positionFill: { height: 6, borderRadius: 999, backgroundColor: C.gold },
  positionHouse: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textSecond, width: 56, textAlign: "right" },
  whyCard: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.md, gap: S.xs,
    borderWidth: 1, borderColor: C.gold,
  },
  whyTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.goldMethod },
  whyBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, color: C.textPrimary },
  emptyPanel: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.lg, gap: S.sm,
    borderWidth: 1, borderColor: C.divider,
  },
  emptyTitle: { color: C.textPrimary },
  emptyBody: { color: C.textSecond },
  primaryBtn: { alignSelf: "flex-start", marginTop: S.sm, backgroundColor: C.saffron, borderRadius: RADIUS.button, paddingHorizontal: S.lg, paddingVertical: S.sm },
  primaryBtnText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  badge: { alignSelf: "center", marginTop: S.md },
});
