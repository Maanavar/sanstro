import React, { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { NAKSHATRA_LIST } from "@vinaadi/shared";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { getNatchathiram } from "@/api/tools";

const PAGE_SIZE = 9;
type NakshatraItem = (typeof NAKSHATRA_LIST)[number];

// Fixed Vedic attributes for all 27 nakshatras
interface NakAttr { planet: string; planetTa: string; guna: string; gunaTa: string; element: string; elementTa: string }
const NAK_ATTRS: Record<number, NakAttr> = {
  1:  { planet: "Ketu",    planetTa: "கேது",    guna: "Divine",    gunaTa: "தேவ",     element: "Earth", elementTa: "பூமி" },
  2:  { planet: "Venus",   planetTa: "சுக்கிரன்", guna: "Human",     gunaTa: "மனித",   element: "Earth", elementTa: "பூமி" },
  3:  { planet: "Sun",     planetTa: "சூரியன்", guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Fire",  elementTa: "நெருப்பு" },
  4:  { planet: "Moon",    planetTa: "சந்திரன்", guna: "Human",     gunaTa: "மனித",   element: "Earth", elementTa: "பூமி" },
  5:  { planet: "Mars",    planetTa: "செவ்வாய்", guna: "Divine",    gunaTa: "தேவ",     element: "Ether", elementTa: "ஆகாயம்" },
  6:  { planet: "Rahu",    planetTa: "ராகு",    guna: "Human",     gunaTa: "மனித",   element: "Water", elementTa: "நீர்" },
  7:  { planet: "Jupiter", planetTa: "குரு",    guna: "Divine",    gunaTa: "தேவ",     element: "Air",   elementTa: "காற்று" },
  8:  { planet: "Saturn",  planetTa: "சனி",     guna: "Divine",    gunaTa: "தேவ",     element: "Ether", elementTa: "ஆகாயம்" },
  9:  { planet: "Mercury", planetTa: "புதன்",   guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Water", elementTa: "நீர்" },
  10: { planet: "Ketu",    planetTa: "கேது",    guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Fire",  elementTa: "நெருப்பு" },
  11: { planet: "Venus",   planetTa: "சுக்கிரன்", guna: "Human",   gunaTa: "மனித",   element: "Fire",  elementTa: "நெருப்பு" },
  12: { planet: "Sun",     planetTa: "சூரியன்", guna: "Human",     gunaTa: "மனித",   element: "Fire",  elementTa: "நெருப்பு" },
  13: { planet: "Moon",    planetTa: "சந்திரன்", guna: "Divine",   gunaTa: "தேவ",     element: "Earth", elementTa: "பூமி" },
  14: { planet: "Mars",    planetTa: "செவ்வாய்", guna: "Rakshasa", gunaTa: "ராக்ஷஸ", element: "Air",   elementTa: "காற்று" },
  15: { planet: "Rahu",    planetTa: "ராகு",    guna: "Divine",    gunaTa: "தேவ",     element: "Air",   elementTa: "காற்று" },
  16: { planet: "Jupiter", planetTa: "குரு",    guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Air",   elementTa: "காற்று" },
  17: { planet: "Saturn",  planetTa: "சனி",     guna: "Divine",    gunaTa: "தேவ",     element: "Water", elementTa: "நீர்" },
  18: { planet: "Mercury", planetTa: "புதன்",   guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Water", elementTa: "நீர்" },
  19: { planet: "Ketu",    planetTa: "கேது",    guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Fire",  elementTa: "நெருப்பு" },
  20: { planet: "Venus",   planetTa: "சுக்கிரன்", guna: "Human",   gunaTa: "மனித",   element: "Water", elementTa: "நீர்" },
  21: { planet: "Sun",     planetTa: "சூரியன்", guna: "Human",     gunaTa: "மனித",   element: "Fire",  elementTa: "நெருப்பு" },
  22: { planet: "Moon",    planetTa: "சந்திரன்", guna: "Divine",   gunaTa: "தேவ",     element: "Ether", elementTa: "ஆகாயம்" },
  23: { planet: "Mars",    planetTa: "செவ்வாய்", guna: "Rakshasa", gunaTa: "ராக்ஷஸ", element: "Ether", elementTa: "ஆகாயம்" },
  24: { planet: "Rahu",    planetTa: "ராகு",    guna: "Rakshasa",  gunaTa: "ராக்ஷஸ", element: "Ether", elementTa: "ஆகாயம்" },
  25: { planet: "Jupiter", planetTa: "குரு",    guna: "Human",     gunaTa: "மனித",   element: "Ether", elementTa: "ஆகாயம்" },
  26: { planet: "Saturn",  planetTa: "சனி",     guna: "Human",     gunaTa: "மனித",   element: "Water", elementTa: "நீர்" },
  27: { planet: "Mercury", planetTa: "புதன்",   guna: "Divine",    gunaTa: "தேவ",     element: "Ether", elementTa: "ஆகாயம்" },
};

function chunkStars(stars: NakshatraItem[]) {
  const pages: NakshatraItem[][] = [];
  for (let i = 0; i < stars.length; i += PAGE_SIZE) {
    pages.push(stars.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

export default function NatchathiramScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const pagerRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const pageWidth = Math.max(300, width - S.base * 2);
  const pages = useMemo(() => chunkStars(NAKSHATRA_LIST), []);
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState(NAKSHATRA_LIST[0]?.number ?? 1);

  const selectedStar = useMemo(
    () => NAKSHATRA_LIST.find((nk) => nk.number === selected) ?? NAKSHATRA_LIST[0],
    [selected]
  );
  const attrs = NAK_ATTRS[selected] ?? NAK_ATTRS[1];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["natchathiram", selected],
    queryFn: () => getNatchathiram(selected),
    staleTime: 1000 * 60 * 60 * 24,
  });
  const n = data?.data;

  function handleSelect(nk: NakshatraItem) {
    Haptics.selectionAsync();
    setSelected(nk.number);
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(Math.max(0, Math.min(pages.length - 1, nextIndex)));
  }

  function goToPage(delta: number) {
    const nextIndex = Math.max(0, Math.min(pages.length - 1, pageIndex + delta));
    if (nextIndex === pageIndex) return;
    Haptics.selectionAsync();
    setPageIndex(nextIndex);
    pagerRef.current?.scrollTo({ x: nextIndex * pageWidth, animated: true });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "நட்சத்திர விவரங்கள்" : "Nakshatra Details"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Star Browser */}
        <View style={styles.browserHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
              {isTamil ? "நட்சத்திர தேர்வு" : "Star Browser"}
            </Text>
            <Text style={[styles.browserMeta, isTamil ? TamilType.caption : EnType.caption]} numberOfLines={1}>
              {selectedStar ? `${selectedStar.number}/27 · ${isTamil ? selectedStar.name.ta : selectedStar.name.en}` : "Select a star"}
            </Text>
          </View>
          <View style={styles.pagerButtons}>
            <TouchableOpacity
              style={[styles.pageButton, pageIndex === 0 && styles.pageButtonDisabled]}
              onPress={() => goToPage(-1)} disabled={pageIndex === 0} activeOpacity={0.8}
            >
              <Text style={[styles.pageButtonText, pageIndex === 0 && styles.pageButtonTextDisabled]}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageButton, pageIndex === pages.length - 1 && styles.pageButtonDisabled]}
              onPress={() => goToPage(1)} disabled={pageIndex === pages.length - 1} activeOpacity={0.8}
            >
              <Text style={[styles.pageButtonText, pageIndex === pages.length - 1 && styles.pageButtonTextDisabled]}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={pagerRef}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          decelerationRate="fast" snapToInterval={pageWidth} snapToAlignment="start"
          style={styles.pager}
        >
          {pages.map((page, index) => (
            <View key={index} style={[styles.starPage, { width: pageWidth }]}>
              {page.map((nk) => {
                const sel = selected === nk.number;
                return (
                  <TouchableOpacity
                    key={nk.number}
                    style={[styles.starTile, sel && styles.starTileSelected]}
                    onPress={() => handleSelect(nk)} activeOpacity={0.82}
                  >
                    <Text style={[styles.starNumber, sel && styles.starNumberSelected]}>
                      {String(nk.number).padStart(2, "0")}
                    </Text>
                    <Text
                      style={[
                        styles.starName, sel && styles.starNameSelected,
                        { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" },
                      ]}
                      numberOfLines={2}
                    >
                      {isTamil ? nk.name.ta : nk.name.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotRow}>
          {pages.map((_, index) => (
            <View key={index} style={[styles.dot, index === pageIndex && styles.dotActive]} />
          ))}
        </View>

        {isLoading && <SkeletonCard height={280} />}
        {isError && <ErrorCard onRetry={refetch} />}

        {n && (
          <>
            {/* Poster hero */}
            <View style={styles.posterCard}>
              <View style={styles.posterTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.posterNameTa, { fontFamily: "NotoSansTamil_700Bold" }]}>
                    {n.name_ta}
                  </Text>
                  <Text style={styles.posterNameEn}>{n.name_en}</Text>
                </View>
                <ThirukanithamBadge size="sm" />
              </View>

              <View style={styles.posterMeta}>
                <PosterMetaItem
                  icon="🌟"
                  label={isTamil ? "ஆட்சி கிரகம்" : "Ruling planet"}
                  value={isTamil ? attrs.planetTa : attrs.planet}
                />
                <PosterMetaItem
                  icon="🔷"
                  label={isTamil ? "குண வகை" : "Guna"}
                  value={isTamil ? attrs.gunaTa : attrs.guna}
                />
                <PosterMetaItem
                  icon="🌿"
                  label={isTamil ? "தத்துவம்" : "Element"}
                  value={isTamil ? attrs.elementTa : attrs.element}
                />
              </View>

              {(n.deity_en || n.symbol_en) && (
                <View style={styles.posterSecondary}>
                  {n.deity_en ? (
                    <View style={styles.posterSecondaryItem}>
                      <Text style={styles.posterSecondaryLabel}>{isTamil ? "தெய்வம்" : "Deity"}</Text>
                      <Text style={[styles.posterSecondaryValue, { fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold" }]}>
                        {isTamil ? n.deity_ta : n.deity_en}
                      </Text>
                    </View>
                  ) : null}
                  {n.symbol_en ? (
                    <View style={styles.posterSecondaryItem}>
                      <Text style={styles.posterSecondaryLabel}>{isTamil ? "சின்னம்" : "Symbol"}</Text>
                      <Text style={[styles.posterSecondaryValue, { fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold" }]}>
                        {isTamil ? n.symbol_ta : n.symbol_en}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* General description */}
            <Text style={[styles.generalText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? n.general_ta : n.general_en}
            </Text>

            {/* Compatible contexts section */}
            <View style={styles.contextsCard}>
              <Text style={[styles.contextsTitle, { fontFamily: "Inter_700Bold" }]}>
                {isTamil ? "பொருத்தமான சூழல்கள்" : "Compatible Contexts"}
              </Text>
              <ContextRow
                icon="💼"
                label={isTamil ? "தொழில்" : "Career"}
                value={isTamil
                  ? `${attrs.planet === "Jupiter" || attrs.planet === "Sun" ? "தலைமை, ஆசிரியர், ஆட்சி சார்ந்த பணிகள்" : attrs.planet === "Mercury" ? "தகவல், வணிகம், கணக்கு சார்ந்த பணிகள்" : attrs.planet === "Mars" ? "நிர்வாகம், தொழில்நுட்பம், போர் சார்ந்த பணிகள்" : "கலை, அழகியல், தொழில் சார்ந்த பணிகள்"}`
                  : `${attrs.planet === "Jupiter" || attrs.planet === "Sun" ? "Leadership, teaching, governance roles" : attrs.planet === "Mercury" ? "Communication, trade, analytics roles" : attrs.planet === "Mars" ? "Engineering, administration, defence roles" : "Creative, aesthetic, commercial roles"}`}
              />
              <ContextRow
                icon="💑"
                label={isTamil ? "திருமணம்" : "Marriage"}
                value={isTamil
                  ? `${attrs.guna === "Divine" ? "தேவ குண நட்சத்திரங்களுடன் சிறந்த பொருத்தம்" : attrs.guna === "Human" ? "மனித குண நட்சத்திரங்களுடன் நல்ல பொருத்தம்" : "பொருத்தம் கணிக்க ஜாதக ஆய்வு அவசியம்"}`
                  : `${attrs.guna === "Divine" ? "Strong match with other Deva guna stars" : attrs.guna === "Human" ? "Good match with Human guna stars" : "Chart analysis required for compatibility"}`}
              />
              <ContextRow
                icon="⏰"
                label={isTamil ? "சுப நேரம்" : "Auspicious timing"}
                value={isTamil
                  ? `${attrs.planet} தசை / அந்தர் தசையில் இந்த நட்சத்திர நாட்கள் மிகவும் சிறப்பானவை`
                  : `Days when the Moon is in this star are especially powerful during ${attrs.planet} dasha periods`}
              />
            </View>

            {/* Pada details */}
            {(n.pada_descriptions?.length ?? 0) > 0 && (
              <View style={styles.padaBlock}>
                <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "பாத விவரங்கள்" : "Pada Details"}
                </Text>
                {n.pada_descriptions.map((p) => (
                  <View key={p.pada} style={styles.padaRow}>
                    <View style={styles.padaNumBadge}>
                      <Text style={styles.padaNumText}>{p.pada}</Text>
                    </View>
                    <Text style={[styles.padaDesc, isTamil ? TamilType.body : EnType.body]}>
                      {isTamil ? p.desc_ta : p.desc_en}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Learn more link */}
            <TouchableOpacity
              style={styles.learnLink}
              onPress={() => router.push(`/learn/what-is-thirukanitham` as any)}
            >
              <Text style={styles.learnLinkText}>
                {isTamil ? "திருக்கணிதம் பற்றி மேலும் அறிக →" : "Learn about Thirukanitham →"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PosterMetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.posterMetaItem}>
      <Text style={styles.posterMetaIcon}>{icon}</Text>
      <Text style={styles.posterMetaLabel}>{label}</Text>
      <Text style={styles.posterMetaValue}>{value}</Text>
    </View>
  );
}

function ContextRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.contextRow}>
      <Text style={styles.contextIcon}>{icon}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.contextLabel}>{label}</Text>
        <Text style={styles.contextValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionLabel: { color: C.textSecond },
  browserHeader: { flexDirection: "row", alignItems: "center", gap: S.md },
  browserMeta: { color: C.textTertiary, marginTop: 2 },
  pagerButtons: { flexDirection: "row", gap: S.xs },
  pageButton: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider,
  },
  pageButtonDisabled: { opacity: 0.45 },
  pageButtonText: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: C.textPrimary },
  pageButtonTextDisabled: { color: C.textTertiary },
  pager: { marginHorizontal: -S.base, paddingLeft: S.base },
  starPage: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, paddingRight: S.base, paddingBottom: S.xs },
  starTile: {
    width: "31%", minHeight: 78, borderRadius: RADIUS.card, borderWidth: 1,
    borderColor: C.divider, backgroundColor: C.surface, padding: S.sm, justifyContent: "space-between",
  },
  starTileSelected: { backgroundColor: C.saffron, borderColor: C.saffron },
  starNumber: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.textTertiary },
  starNumberSelected: { color: C.surface },
  starName: { fontSize: 12, lineHeight: 16, color: C.textPrimary },
  starNameSelected: { color: C.surface },
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: -S.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.divider },
  dotActive: { width: 18, backgroundColor: C.saffron },

  // Poster hero
  posterCard: {
    backgroundColor: C.deepIndigo, borderRadius: RADIUS.card, padding: S.base, gap: S.md,
  },
  posterTop: { flexDirection: "row", alignItems: "flex-start", gap: S.sm },
  posterNameTa: { fontSize: 24, lineHeight: 34, color: C.gold },
  posterNameEn: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.indigoText, opacity: 0.7, marginTop: 2 },
  posterMeta: { flexDirection: "row", gap: S.sm },
  posterMetaItem: {
    flex: 1, alignItems: "center", gap: S.xs,
    backgroundColor: C.indigoSurface, borderRadius: RADIUS.card, padding: S.sm,
  },
  posterMetaIcon: { fontSize: 18 },
  posterMetaLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.indigoText, opacity: 0.6, textAlign: "center" },
  posterMetaValue: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.indigoText, textAlign: "center" },
  posterSecondary: { flexDirection: "row", gap: S.sm },
  posterSecondaryItem: { flex: 1, gap: 2 },
  posterSecondaryLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.indigoText, opacity: 0.55 },
  posterSecondaryValue: { fontSize: 13, color: C.indigoText },

  generalText: { color: C.textPrimary, lineHeight: 22 },

  contextsCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  contextsTitle: { fontSize: 15, color: C.textPrimary },
  contextRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  contextIcon: { fontSize: 18, width: 24 },
  contextLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary },
  contextValue: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textPrimary, lineHeight: 20 },

  padaBlock: { gap: S.sm },
  padaRow: {
    flexDirection: "row", alignItems: "flex-start", gap: S.sm,
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
  },
  padaNumBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.saffron + "22", alignItems: "center", justifyContent: "center",
  },
  padaNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.saffron },
  padaDesc: { flex: 1, color: C.textPrimary, lineHeight: 22 },

  learnLink: {
    alignSelf: "center", paddingVertical: S.md, paddingHorizontal: S.base,
  },
  learnLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.goldMethod },
});
