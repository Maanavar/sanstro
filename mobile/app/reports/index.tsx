import React from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { PPU_REPORT_PRODUCTS, PPU_PORUTHAM_PRODUCTS, PPU_TOPUP_PRODUCTS } from "@vinaadi/shared/constants/tiers";

type AnyProduct = {
  rcProductId: string;
  priceINR: number;
  label: { ta: string; en: string };
  description: { ta: string; en: string };
  pages?: number;
  questions?: number;
};

const SECTIONS: { titleEn: string; titleTa: string; items: AnyProduct[] }[] = [
  {
    titleEn: "Jadhagam Reports",
    titleTa: "ஜாதக அறிக்கைகள்",
    items: Object.values(PPU_REPORT_PRODUCTS) as AnyProduct[],
  },
  {
    titleEn: "Porutham Reports",
    titleTa: "பொருத்த அறிக்கைகள்",
    items: Object.values(PPU_PORUTHAM_PRODUCTS) as AnyProduct[],
  },
  {
    titleEn: "Ask Vinaadi Top-up",
    titleTa: "கேள்வி பேக்",
    items: Object.values(PPU_TOPUP_PRODUCTS) as AnyProduct[],
  },
];

export default function ReportsScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backText, isTamil ? TamilType.caption : EnType.caption]}>
            ← {isTamil ? "திரும்பு" : "Back"}
          </Text>
        </TouchableOpacity>

        {/* Heading */}
        <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
          {isTamil ? "அறிக்கைகளை வாங்கு" : "Buy Reports"}
        </Text>
        <Text style={[styles.sub, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "ஒவ்வொரு வாங்குதலும் ஒரு முறை மட்டுமே — மாத சந்தா தேவையில்லை."
            : "One-time purchase — no subscription required."}
        </Text>

        {/* Coming soon notice */}
        <View style={styles.noticeBanner}>
          <Text style={[styles.noticeText, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            {isTamil
              ? "💳 கட்டண செயல்முறை விரைவில் இயக்கப்படும்."
              : "💳 Payment processing coming soon."}
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.titleEn} style={styles.section}>
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? section.titleTa : section.titleEn}
            </Text>
            {section.items.map((product) => (
              <View key={product.rcProductId} style={styles.productCard}>
                <View style={styles.productTop}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, isTamil ? TamilType.body : EnType.body]}>
                      {isTamil ? product.label.ta : product.label.en}
                    </Text>
                    {product.pages != null && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{product.pages} {isTamil ? "பக்கம்" : "pages"}</Text>
                      </View>
                    )}
                    {product.questions != null && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{product.questions} {isTamil ? "கேள்விகள்" : "questions"}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.price}>₹{product.priceINR}</Text>
                </View>
                <Text style={[styles.productDesc, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? product.description.ta : product.description.en}
                </Text>
                <TouchableOpacity
                  style={styles.buyBtnDisabled}
                  disabled
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyBtnText}>
                    {isTamil ? "விரைவில் வருகிறது" : "Coming Soon"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        {/* Premium CTA */}
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => router.push("/premium")}
          activeOpacity={0.85}
        >
          <Text style={[styles.premiumTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "பிரீமியத்தில் மாதம் 5 அறிக்கைகள் இலவசம்" : "Premium includes 5 reports/month"}
          </Text>
          <Text style={[styles.premiumSub, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "₹149/மாதம் — 7 நாள் இலவச சோதனை →" : "₹149/month — 7-day free trial →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingHorizontal: S.base, paddingTop: S.base, paddingBottom: S.xxl },
  backRow: { marginBottom: S.base },
  backText: { color: C.textSecond },
  heading: { color: C.textPrimary, marginBottom: S.sm },
  sub: { color: C.textTertiary, marginBottom: S.base },
  noticeBanner: {
    backgroundColor: C.cautionLight,
    borderRadius: RADIUS.card,
    padding: S.md,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.gold,
  },
  noticeText: { color: C.textPrimary },
  section: { marginBottom: S.xl },
  sectionTitle: { color: C.textPrimary, marginBottom: S.md },
  productCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.divider,
    gap: S.sm,
  },
  productTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  productInfo: { flex: 1, gap: S.xs },
  productName: { color: C.textPrimary },
  badge: {
    backgroundColor: C.cautionLight,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textSecond },
  price: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: C.saffron },
  productDesc: { color: C.textSecond },
  buyBtnDisabled: {
    backgroundColor: C.divider,
    borderRadius: RADIUS.button,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textTertiary },
  premiumBanner: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    borderWidth: 1,
    borderColor: C.gold,
    gap: S.xs,
  },
  premiumTitle: { color: C.textPrimary },
  premiumSub: { color: C.saffron },
});
