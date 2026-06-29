import React, { useEffect, useRef, useState } from "react";
import {
  FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
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
import { MethodologyStrip } from "@/components/MethodologyStrip";
import {
  WhyThisResultSheet,
  type WhySheetHandle,
  type WhyItem,
} from "@/components/WhyThisResultSheet";
import { getUpcomingTransits, moonHouseImpact } from "@/api/transits";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { TransitItem } from "@/api/transits";

function impactColor(impact: "good" | "neutral" | "challenging"): string {
  if (impact === "good") return C.green;
  if (impact === "challenging") return C.alert;
  return C.textTertiary;
}

function impactLabel(impact: "good" | "neutral" | "challenging", isTamil: boolean): string {
  if (impact === "good") return isTamil ? "சாதகம்" : "Favorable";
  if (impact === "challenging") return isTamil ? "பாதகம்" : "Challenging";
  return isTamil ? "நடுத்தரம்" : "Neutral";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const MAJOR_PLANET_KEYS = ["SATURN", "JUPITER", "RAHU", "KETU"];

function isPeyarchi(item: TransitItem): boolean {
  return MAJOR_PLANET_KEYS.includes(item.planet);
}

function transitHowItems(item: TransitItem, rasi: string): WhyItem[] {
  const impact = moonHouseImpact(item.impactFromMoon);
  return [
    { label: "Your Rasi", value: rasi },
    { label: "Transit", value: `${item.labelEn} moves from ${item.fromRasi} to ${item.toRasi}` },
    { label: "Basis", value: "Impact is assessed from your natal Moon sign (Chandran's rasi) and Lagna, per Thirukanitham rules" },
    { label: "Impact rating", value: impactLabel(impact, false) },
    { label: "Method", value: "Thirukanitham — precision sunrise-adjusted chart positions" },
  ];
}

export default function TransitsScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [rasi, setRasi] = useState<string | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TransitItem | null>(null);
  const whyRef = useRef<WhySheetHandle>(null);

  useEffect(() => {
    loadGuestPrefs().then((p) => { if (p.rasi) setRasi(p.rasi); });
    getPrimaryChartId().then(setChartId);
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["transits-upcoming", chartId],
    queryFn: () => getUpcomingTransits(chartId!, 30),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 4,
  });

  const items: TransitItem[] = data?.data ?? [];
  const peyarchiItems = items.filter(isPeyarchi);
  const regularItems = items.filter((i) => !isPeyarchi(i));

  function openHow(item: TransitItem) {
    setSelectedItem(item);
    setTimeout(() => whyRef.current?.open(), 50);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "பெயர்ச்சி / கோச்சாரம்" : "Upcoming Transits"}
          </Text>
          {rasi && (
            <Text style={[styles.rasiLabel, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? `ராசி: ${rasi}` : `Rasi: ${rasi}`}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <MethodologyStrip city={rasi ?? undefined} />

      {!rasi && (
        <View style={styles.noRasiWrap}>
          <Text style={styles.noRasiIcon}>🪐</Text>
          <Text style={[styles.noRasiText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "பெயர்ச்சி காண முதலில் ராசியை அமைக்கவும்."
              : "Please set your Rasi in settings to view transits."}
          </Text>
          <TouchableOpacity style={styles.setRasiBtn} onPress={() => router.push("/(onboarding)/rasi-picker")}>
            <Text style={styles.setRasiBtnText}>{isTamil ? "ராசி அமை" : "Set Rasi"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && rasi && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={100} />
          <SkeletonCard height={100} />
        </View>
      )}
      {isError && <View style={{ padding: S.base }}><ErrorCard onRetry={refetch} /></View>}

      {!isLoading && !isError && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.peyarchiDateLocal}-${i}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            peyarchiItems.length > 0 ? (
              <View style={styles.peyarchiSection}>
                <Text style={[styles.peyarchiSectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "பெயர்ச்சி (முக்கிய கோட்கள்)" : "Peyarchi — Major Sign Changes"}
                </Text>
                {peyarchiItems.map((item, idx) => (
                  <PeyarchiCard
                    key={idx} item={item} isTamil={isTamil}
                    onHow={() => openHow(item)}
                  />
                ))}
                {regularItems.length > 0 && (
                  <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
                    {isTamil ? "சாதாரண கோச்சாரங்கள்" : "Regular Transits"}
                  </Text>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }: { item: TransitItem }) => {
            if (isPeyarchi(item)) return null;
            const impact = moonHouseImpact(item.impactFromMoon);
            const isExpanded = expanded === `${item.peyarchiDateLocal}-${item.planet}`;
            const days = daysUntil(item.peyarchiDateLocal);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setExpanded(isExpanded ? null : `${item.peyarchiDateLocal}-${item.planet}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.impactDot, { backgroundColor: impactColor(impact) }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.planetName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                      {isTamil ? item.labelTa : item.labelEn}
                    </Text>
                    <Text style={[styles.transitRoute, isTamil ? TamilType.caption : EnType.caption]}>
                      {`${item.fromRasi} → ${item.toRasi}`}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.transitDate}>{formatDate(item.peyarchiDateLocal)}</Text>
                    {days >= 0 && (
                      <Text style={styles.daysUntil}>
                        {days === 0
                          ? (isTamil ? "இன்று" : "Today")
                          : isTamil ? `${days} நாட்களில்` : `in ${days}d`}
                      </Text>
                    )}
                    <View style={[styles.impactBadge, { backgroundColor: impactColor(impact) + "22" }]}>
                      <Text style={[styles.impactBadgeText, { color: impactColor(impact) }]}>
                        {impactLabel(impact, isTamil)}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isExpanded && (
                  <Text style={[styles.summary, isTamil ? TamilType.caption : EnType.caption]} numberOfLines={2}>
                    {isTamil ? item.labelTa : item.labelEn}
                  </Text>
                )}

                {isExpanded && (
                  <>
                    <Text style={[styles.description, isTamil ? TamilType.body : EnType.body]}>
                      {isTamil
                        ? `${item.labelTa}: ${item.fromRasi} → ${item.toRasi}`
                        : `${item.labelEn}: ${item.fromRasi} → ${item.toRasi}`}
                    </Text>
                    <TouchableOpacity onPress={() => openHow(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.howLink}>
                        {isTamil ? "◉ எப்படி கணிக்கப்பட்டது?" : "◉ How was this calculated?"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <WhyThisResultSheet
        ref={whyRef}
        title={selectedItem ? `${selectedItem.labelEn} transit` : "How transits are calculated"}
        items={selectedItem && rasi ? transitHowItems(selectedItem, rasi) : []}
      />
    </SafeAreaView>
  );
}

function PeyarchiCard({ item, isTamil, onHow }: { item: TransitItem; isTamil: boolean; onHow: () => void }) {
  const impact = moonHouseImpact(item.impactFromMoon);
  const days = daysUntil(item.peyarchiDateLocal);
  return (
    <View style={styles.peyarchiCard}>
      <View style={styles.peyarchiStripe} />
      <View style={{ flex: 1, gap: S.xs }}>
        <View style={styles.peyarchiTop}>
          <Text style={[styles.peyarchiPlanet, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? item.labelTa : item.labelEn}
          </Text>
          <View style={styles.peyarchiLabel}>
            <Text style={styles.peyarchiLabelText}>{isTamil ? "பெயர்ச்சி" : "Peyarchi"}</Text>
          </View>
        </View>
        <Text style={[styles.peyarchiRoute, isTamil ? TamilType.caption : EnType.caption]}>
          {`${item.fromRasi} → ${item.toRasi}`}
        </Text>
        <View style={styles.peyarchiFooter}>
          <Text style={styles.peyarchiDate}>{formatDate(item.peyarchiDateLocal)}</Text>
          {days >= 0 && (
            <Text style={styles.peyarchiDays}>
              {days === 0 ? (isTamil ? "இன்று" : "Today") : isTamil ? `${days} நாட்களில்` : `in ${days} days`}
            </Text>
          )}
          <View style={[styles.impactBadge, { backgroundColor: impactColor(impact) + "22" }]}>
            <Text style={[styles.impactBadgeText, { color: impactColor(impact) }]}>
              {impactLabel(impact, isTamil)}
            </Text>
          </View>
          <TouchableOpacity onPress={onHow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.howLink}>{isTamil ? "எப்படி?" : "How?"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond },
  headerTitle: { color: C.textPrimary },
  rasiLabel: { color: C.textTertiary },
  list: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionLabel: { color: C.textPrimary, marginTop: S.xs },

  peyarchiSection: { gap: S.md },
  peyarchiSectionLabel: { color: C.textPrimary },
  peyarchiCard: {
    flexDirection: "row", backgroundColor: C.surface, borderRadius: RADIUS.card,
    overflow: "hidden", padding: S.base, gap: S.sm,
    borderWidth: 1, borderColor: C.gold + "55",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  peyarchiStripe: { width: 3, backgroundColor: C.gold, borderRadius: 2, alignSelf: "stretch" },
  peyarchiTop: { flexDirection: "row", alignItems: "center", gap: S.sm },
  peyarchiPlanet: { fontSize: 17, color: C.textPrimary },
  peyarchiLabel: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 2,
  },
  peyarchiLabelText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.goldMethod },
  peyarchiRoute: { color: C.textSecond },
  peyarchiFooter: { flexDirection: "row", alignItems: "center", gap: S.sm, flexWrap: "wrap" },
  peyarchiDate: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textPrimary },
  peyarchiDays: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },

  noRasiWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
  noRasiIcon: { fontSize: 48 },
  noRasiText: { color: C.textSecond, textAlign: "center" },
  setRasiBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    paddingHorizontal: S.xl, paddingVertical: S.md, marginTop: S.sm,
  },
  setRasiBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },

  card: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, gap: S.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  impactDot: { width: 10, height: 10, borderRadius: 5 },
  planetName: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
  transitRoute: { color: C.textSecond },
  transitDate: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textPrimary },
  daysUntil: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  impactBadge: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2 },
  impactBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  summary: { color: C.textSecond },
  description: { color: C.textPrimary, lineHeight: 22 },
  howLink: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.goldMethod },
});
