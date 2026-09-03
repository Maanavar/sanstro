import React, { useEffect, useMemo, useState } from "react";
import { Lock, MapPin, Sparkles, Palette, Gem } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { MethodologyStrip } from "@/components/MethodologyStrip";
import { getPariharam } from "@/api/tools";
import type { RemedyItem } from "@/api/tools";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { GRAHA_LABELS, type GrahaName } from "@vinaadi/shared/constants";

/**
 * The backend's remedy plan (GET /charts/{id}/remedy-plan) is organised by
 * *planet* in priority order — current mahadasha lord first, then the weakest
 * benefic, then any planet carrying an active dosham — not by dosha. Each row
 * carries the classical remedy set for that planet.
 */
type RemedyCategory = "temple" | "mantra" | "gemstone" | "daanam" | "fasting";

const CATEGORY_META: Record<
  RemedyCategory,
  { Icon: LucideIcon; labelEn: string; labelTa: string; whenEn: string; whenTa: string }
> = {
  temple: {
    Icon: MapPin,
    labelEn: "Temple & Deity",
    labelTa: "கோயில் & தெய்வம்",
    whenEn: "Visit on this planet's weekday",
    whenTa: "இந்த கிரகத்தின் வாரத்தில் வருகை தரவும்",
  },
  mantra: {
    Icon: Sparkles,
    labelEn: "Mantra",
    labelTa: "மந்திரம்",
    whenEn: "Recite daily at sunrise or sunset",
    whenTa: "தினமும் சூரிய உதயம் அல்லது அஸ்தமனத்தில் சொல்லவும்",
  },
  gemstone: {
    Icon: Gem,
    labelEn: "Gemstone",
    labelTa: "கல்",
    whenEn: "Only when prescribed — set in the stated metal, on the stated finger",
    whenTa: "பரிந்துரைக்கப்பட்டால் மட்டும் — குறிப்பிட்ட உலோகத்தில், குறிப்பிட்ட விரலில்",
  },
  daanam: {
    Icon: Palette,
    labelEn: "Daanam (giving)",
    labelTa: "தானம்",
    whenEn: "Offer on this planet's weekday",
    whenTa: "இந்த கிரகத்தின் வாரத்தில் வழங்கவும்",
  },
  fasting: {
    Icon: Sparkles,
    labelEn: "Fasting",
    labelTa: "விரதம்",
    whenEn: "Optional — never at the cost of your health",
    whenTa: "விருப்பத்திற்குரியது — உடல்நலனை பாதிக்கும் வகையில் வேண்டாம்",
  },
};

/** Reads the row's value for a category, honouring the gemstone prescription. */
function categoryValue(item: RemedyItem, cat: RemedyCategory, isTamil: boolean): string | null {
  switch (cat) {
    case "temple":
      return isTamil ? item.temple_ta : item.temple_en;
    case "mantra":
      return isTamil ? item.mantra_full_ta : item.mantra_seed;
    case "gemstone":
      // A gemstone is deliberately withheld for some functional natures — the
      // backend nulls it rather than recommending one. Don't invent a fallback.
      if (!item.is_gemstone_prescribed) return null;
      return isTamil ? item.gemstone_ta : item.gemstone_en;
    case "daanam":
      return isTamil ? item.daanam_items_ta : item.daanam_items_en;
    case "fasting":
      return isTamil ? item.fasting_rule_ta : item.fasting_rule_en;
  }
}

export default function PariharamScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pariharam", chartId],
    queryFn: () => getPariharam(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const items: RemedyItem[] = data?.data?.items ?? [];
  const disclaimer = data?.data?.disclaimer;

  function toggleCompleted(key: string) {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (tier === "guest" || (!chartId && !isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginBtnText}>{isTamil ? "உள்நுழைக" : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header isTamil={isTamil} />
      <MethodologyStrip />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && <><SkeletonCard height={160} /><SkeletonCard height={160} /></>}
        {isError && <ErrorCard onRetry={refetch} />}

        {items.map((item) => {
          const planetKey = item.planet;
          const planetLabel = GRAHA_LABELS[planetKey as GrahaName];
          return (
            <View key={planetKey} style={styles.doshaSection}>
              <View style={styles.doshaHeader}>
                <Text style={[styles.doshaTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                  {planetLabel ? (isTamil ? planetLabel.ta : planetLabel.en) : planetKey}
                </Text>
                <Text style={[styles.doshaSubtitle, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil
                    ? `முன்னுரிமை ${item.priority} · ${isTamil ? item.reason_ta : item.reason_en}`
                    : `Priority ${item.priority} · ${item.reason_en}`}
                </Text>
              </View>

              {(["temple", "mantra", "gemstone", "daanam", "fasting"] as RemedyCategory[]).map((cat) => {
                const value = categoryValue(item, cat, isTamil);
                if (!value) return null;
                const meta = CATEGORY_META[cat];
                const cardKey = `${planetKey}:${cat}`;
                const isDone = completed[cardKey] ?? false;

                return (
                  <View key={cat} style={[styles.remedyCard, isDone && styles.remedyCardDone]}>
                    <View style={styles.remedyCardTop}>
                      <View style={styles.remedyIconWrap}>
                        <meta.Icon size={20} color={C.gold} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.remedyCategoryLabel}>
                          {isTamil ? meta.labelTa : meta.labelEn}
                        </Text>
                        <Text style={[styles.remedyValue, isTamil ? TamilType.body : EnType.body, isDone && styles.remedyValueDone]}>
                          {value}
                        </Text>
                        {cat === "gemstone" && (item.metal || item.finger) ? (
                          <Text style={styles.remedyCategoryLabel}>
                            {[item.metal, item.finger].filter(Boolean).join(" · ")}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleCompleted(cardKey)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.doneBtn, isDone && styles.doneBtnActive]}
                      >
                        <Text style={[styles.doneBtnText, isDone && styles.doneBtnTextActive]}>
                          {isDone ? "✓" : "○"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.whenRow}>
                      <Text style={styles.whenLabel}>
                        {isTamil ? "எப்போது" : "When"}
                      </Text>
                      <Text style={[styles.whenValue, isTamil ? TamilType.caption : EnType.caption]}>
                        {isTamil ? meta.whenTa : meta.whenEn}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* The backend attaches these to every remedy response on purpose — a
            remedy must never read as a health instruction or a guarantee. */}
        {disclaimer && (
          <View style={styles.disclaimerCard}>
            <Text style={[styles.disclaimerText, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? disclaimer.fasting_caution_ta : disclaimer.fasting_caution_en}
            </Text>
            <Text style={[styles.disclaimerText, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? disclaimer.guarantee_note_ta : disclaimer.guarantee_note_en}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "பரிகார பரிந்துரை" : "Remedies"}
      </Text>
      <View style={{ width: 40 }} />
    </View>
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
  scroll: { padding: S.base, gap: S.xl, paddingBottom: S.xxl },

  doshaSection: { gap: S.md },
  doshaHeader: { gap: 2 },
  doshaTitle: { fontSize: 17, lineHeight: 24, color: C.saffron },
  doshaSubtitle: { color: C.textTertiary },

  disclaimerCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
    borderWidth: 1, borderColor: C.divider, gap: S.sm, marginTop: S.sm,
  },
  disclaimerText: { color: C.textTertiary, lineHeight: 18 },

  remedyCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  remedyCardDone: { opacity: 0.6, borderWidth: 1, borderColor: C.green + "55" },
  remedyCardTop: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  remedyIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.parchmentDeep, alignItems: "center", justifyContent: "center",
  },
  remedyCategoryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  remedyValue: { color: C.textPrimary, lineHeight: 22, flex: 1 },
  remedyValueDone: { textDecorationLine: "line-through", color: C.textTertiary },

  doneBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.divider,
    alignItems: "center", justifyContent: "center",
  },
  doneBtnActive: { backgroundColor: C.green, borderColor: C.green },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textTertiary },
  doneBtnTextActive: { color: C.surface },

  whenRow: {
    flexDirection: "row", gap: S.sm, alignItems: "flex-start",
    paddingTop: S.xs, borderTopWidth: 1, borderTopColor: C.divider,
  },
  whenLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textTertiary, minWidth: 40, marginTop: 2 },
  whenValue: { flex: 1, color: C.textSecond, lineHeight: 18 },

  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
  guestTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
  loginBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    paddingHorizontal: S.xl, paddingVertical: S.md, marginTop: S.sm,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },
  });
}
