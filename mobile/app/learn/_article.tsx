import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { LEARN_CONTENT } from "./[slug]";

export function LearnArticle({ slug }: { slug: keyof typeof LEARN_CONTENT }) {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const content = LEARN_CONTENT[slug];
  const type = isTamil ? TamilType : EnType;
  const title = isTamil ? content.titleTa : content.titleEn;
  const summary = isTamil ? content.summaryTa : content.summaryEn;
  const sections = isTamil ? content.sectionsTa : content.sectionsEn;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{isTamil ? "கற்றுக்கொள்ளுங்கள்" : "Learn"}</Text>
          <Text style={[styles.heroTitle, type.display]}>{title}</Text>
          <Text style={[styles.heroSummary, type.body]}>{summary}</Text>
        </View>
        <View style={styles.divider} />
        {sections.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionHeading}>{sec.heading}</Text>
            <Text style={[styles.sectionBody, type.body]}>{sec.body}</Text>
          </View>
        ))}
        <View style={styles.webLink}>
          <Text style={styles.webLinkLabel}>{isTamil ? "முழு வழிகாட்டி" : "Full guide"}</Text>
          <Text style={[styles.webLinkBody, type.bodySmall]}>
            {isTamil ? "இந்த தலைப்பில் விரிவான கட்டுரை எங்கள் இணையதளத்தில் உள்ளது." : "A detailed article is available on vinaadi.app."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: S.base, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: S.sm },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 32 },
  headerTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 16, color: C.textPrimary, textAlign: "center" },
  content: { padding: S.lg, paddingBottom: S.xl * 2, gap: S.lg },
  hero: { gap: S.sm },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase" },
  heroTitle: { color: C.textPrimary },
  heroSummary: { color: C.textSecond },
  divider: { height: 1, backgroundColor: C.divider },
  section: { gap: S.sm },
  sectionHeading: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.textPrimary },
  sectionBody: { color: C.textSecond },
  webLink: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.card, padding: S.md, gap: S.xs, borderWidth: 1, borderColor: C.divider },
  webLinkLabel: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron },
  webLinkBody: { color: C.textSecond },
});
