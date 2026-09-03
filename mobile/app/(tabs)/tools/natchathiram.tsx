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
import { NAKSHATRA_LIST } from "@vinaadi/shared";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

const PAGE_SIZE = 9;
type NakshatraItem = (typeof NAKSHATRA_LIST)[number];

function chunkStars(stars: NakshatraItem[]) {
  const pages: NakshatraItem[][] = [];
  for (let i = 0; i < stars.length; i += PAGE_SIZE) {
    pages.push(stars.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

export default function NatchathiramScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const pagerRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const pageWidth = Math.max(300, width - S.base * 2);
  const pages = useMemo(() => chunkStars(NAKSHATRA_LIST), []);
  const [pageIndex, setPageIndex] = useState(0);

  function handleTap(nk: NakshatraItem) {
    Haptics.selectionAsync();
    router.push(`/(tabs)/tools/natchathiram/${nk.number}` as any);
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
        <Text style={[styles.hint, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? "ஒரு நட்சத்திரத்தை தேர்ந்தெடுக்கவும்" : "Tap a star to see its full profile"}
        </Text>

        {/* Star Browser */}
        <View style={styles.browserHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
              {isTamil ? "நட்சத்திர தேர்வு" : "Star Browser"}
            </Text>
            <Text style={[styles.browserMeta, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? `27 நட்சத்திரங்கள்` : "All 27 Nakshatras"}
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
              {page.map((nk) => (
                <TouchableOpacity
                  key={nk.number}
                  style={styles.starTile}
                  onPress={() => handleTap(nk)}
                  activeOpacity={0.78}
                >
                  <Text style={styles.starNumber}>
                    {String(nk.number).padStart(2, "0")}
                  </Text>
                  <Text
                    style={[
                      styles.starName,
                      { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" },
                    ]}
                    numberOfLines={2}
                  >
                    {isTamil ? nk.name.ta : nk.name.en}
                  </Text>
                  <Text style={styles.starChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotRow}>
          {pages.map((_, index) => (
            <View key={index} style={[styles.dot, index === pageIndex && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
    headerTitle: { color: C.textPrimary },
    scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
    hint: { color: C.textTertiary },
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
    starNumber: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.textTertiary },
    starName: { fontSize: 12, lineHeight: 16, color: C.textPrimary, flex: 1 },
    starChevron: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.textTertiary, alignSelf: "flex-end" },
    dotRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: -S.xs },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.divider },
    dotActive: { width: 18, backgroundColor: C.saffron },
  });
}
