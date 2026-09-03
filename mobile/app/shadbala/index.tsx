import React from "react";
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
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { getShadbala, shadbalaKeys, type PlanetShadbala } from "@/api/shadbala";

const PLANET_LABELS: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
};

export default function ShadbalaScreen() {
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";

  const [chartId, setChartId] = React.useState<string | null>(null);
  React.useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: shadbalaKeys.chart(chartId ?? ""),
    queryFn: () => getShadbala(chartId as string),
    enabled: !!chartId && tier !== "guest",
    staleTime: 1000 * 60 * 60 * 24 * 30,
  });

  const payload = data?.data;
  const planets = payload?.planets ?? [];

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Sign in to view Shadbala</Text>
          <Text style={styles.emptyBody}>
            Classical six-fold planetary strength is calculated from your birth chart.
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
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{isTamil ? "ஷட்பலம்" : "Shadbala"}</Text>
          <Text style={styles.heroName}>{isTamil ? "கிரக பலம் (ரூபம்)" : "Planetary Strength (Rupas)"}</Text>
          <Text style={styles.heroPurpose}>
            {isTamil
              ? "ஆறு பகுதி கிரக பலம் — 60 விரூபம் = 1 ரூபம். (சோதனை நிலை)"
              : "Six-component classical strength — 60 Virupa = 1 Rupa. (Experimental)"}
          </Text>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.methodBadge, styles.expBadge]}>
              <Text style={[styles.methodBadgeText, styles.expBadgeText]}>
                {isTamil ? "சோதனை" : "Experimental"}
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <>
            <SkeletonCard height={60} />
            <SkeletonCard height={320} />
          </>
        ) : isError ? (
          <ErrorCard message="Could not load Shadbala." onRetry={refetch} />
        ) : planets.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No Shadbala data available</Text>
            <Text style={styles.emptyBody}>Ensure your chart has full planet positions.</Text>
          </View>
        ) : (
          <View style={styles.section}>
            {planets.map((p) => (
              <PlanetRow key={p.graha} p={p} isTamil={isTamil} />
            ))}
          </View>
        )}

        <ThirukanithamBadge style={styles.badge} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanetRow({ p, isTamil }: { p: PlanetShadbala; isTamil: boolean }) {
  const label = PLANET_LABELS[p.graha];
  const ratioPct = Math.min(100, Math.round(p.strengthRatio * 100));
  return (
    <View style={styles.planetCard}>
      <View style={styles.planetHeader}>
        <Text style={styles.planetName}>{isTamil ? label?.ta ?? p.graha : label?.en ?? p.graha}</Text>
        <View style={[styles.verdict, p.isStrong ? styles.verdictStrong : styles.verdictWeak]}>
          <Text style={[styles.verdictText, p.isStrong ? styles.verdictTextStrong : styles.verdictTextWeak]}>
            {p.isStrong ? (isTamil ? "பலம்" : "Strong") : (isTamil ? "பலவீனம்" : "Weak")}
          </Text>
        </View>
      </View>
      <View style={styles.rupaRow}>
        <Text style={styles.rupaValue}>{p.rupas.toFixed(2)}</Text>
        <Text style={styles.rupaReq}>{isTamil ? "தேவை" : "req"} {p.requiredRupas.toFixed(1)} {isTamil ? "ரூபம்" : "Rupas"}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${ratioPct}%` }, p.isStrong ? styles.barFillStrong : styles.barFillWeak]} />
      </View>
      <View style={styles.componentGrid}>
        {[
          ["Sthana", p.sthana],
          ["Dig", p.dig],
          ["Kala", p.kala],
          ["Chesta", p.chesta],
          ["Naisargika", p.naisargika],
          ["Drik", p.drik],
        ].map(([name, val]) => (
          <View key={name as string} style={styles.componentChip}>
            <Text style={styles.componentName}>{name}</Text>
            <Text style={styles.componentVal}>{(val as number).toFixed(0)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isTamil ? "ஷட்பலம்" : "Shadbala"}</Text>
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
  hero: { backgroundColor: C.darkBg, borderRadius: RADIUS.card, padding: S.lg, gap: S.xs },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase" },
  heroName: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: "#FFF" },
  heroPurpose: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.72)" },
  heroBadgeRow: { flexDirection: "row", marginTop: S.sm, gap: S.sm },
  methodBadge: { borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.gold, paddingHorizontal: S.sm, paddingVertical: 2 },
  methodBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold },
  expBadge: { borderColor: "rgba(255,255,255,0.5)" },
  expBadgeText: { color: "rgba(255,255,255,0.7)" },
  section: { gap: S.md },
  planetCard: { backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, gap: S.sm },
  planetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planetName: { fontFamily: "Inter_800ExtraBold", fontSize: 17, color: C.textPrimary },
  verdict: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2 },
  verdictStrong: { backgroundColor: "rgba(46,125,50,0.12)" },
  verdictWeak: { backgroundColor: "rgba(198,40,40,0.10)" },
  verdictText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  verdictTextStrong: { color: "#2E7D32" },
  verdictTextWeak: { color: "#C62828" },
  rupaRow: { flexDirection: "row", alignItems: "baseline", gap: S.sm },
  rupaValue: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: C.textPrimary },
  rupaReq: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  bar: { height: 6, borderRadius: 3, backgroundColor: C.surfaceAlt, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  barFillStrong: { backgroundColor: "#2E7D32" },
  barFillWeak: { backgroundColor: C.saffron },
  componentGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.xs, marginTop: S.xs },
  componentChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 3,
  },
  componentName: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecond },
  componentVal: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.textPrimary },
  badge: { marginTop: S.md },
  emptyPanel: { padding: S.xl, alignItems: "center", gap: S.md },
  emptyTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: C.textPrimary, textAlign: "center" },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: C.textSecond, textAlign: "center" },
  primaryBtn: { backgroundColor: C.darkBg, borderRadius: RADIUS.button, paddingHorizontal: S.lg, paddingVertical: S.md },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.gold },
});
