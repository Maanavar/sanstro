import React, { useMemo } from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { PRIVACY_POLICY } from "@vinaadi/shared/data/legal";

export default function PrivacyPolicyScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "தனியுரிமைக் கொள்கை" : "Privacy Policy"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.lastUpdated, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? `கடைசியாக புதுப்பிக்கப்பட்டது: ${PRIVACY_POLICY.lastUpdated}` : `Last updated: ${PRIVACY_POLICY.lastUpdated}`}
        </Text>

        <View style={styles.introCard}>
          <Text style={[styles.introText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "Vinaadi AI உங்கள் தனியுரிமையை மதிக்கிறது. இந்த கொள்கை நாங்கள் எந்த தகவல்களை சேகரிக்கிறோம், அவற்றை எவ்வாறு பயன்படுத்துகிறோம், மற்றும் உங்கள் உரிமைகள் என்ன என்பதை விளக்குகிறது."
              : "Vinaadi AI respects your privacy. This policy explains what information we collect, how we use it, and what rights you have over your data."}
          </Text>
        </View>

        {PRIVACY_POLICY.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? section.heading.ta : section.heading.en}
            </Text>
            <Text style={[styles.sectionBody, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? section.body.ta : section.body.en}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={styles.termsLink} onPress={() => router.replace("/terms" as any)}>
          <Text style={styles.termsLinkText}>
            {isTamil ? "பயன்பாட்டு விதிமுறைகளை காண →" : "View Terms of Service →"}
          </Text>
        </TouchableOpacity>
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
    headerTitle: { color: C.textPrimary, flex: 1, textAlign: "center" },
    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },
    lastUpdated: { color: C.textTertiary },
    introCard: {
      backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.base,
      borderWidth: 1, borderColor: `${C.gold}40`,
    },
    introText: { color: C.textPrimary, lineHeight: 24 },
    section: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    },
    sectionHeading: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    sectionBody: { color: C.textSecond, lineHeight: 24 },
    termsLink: { alignItems: "center", paddingVertical: S.sm },
    termsLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.saffron },
  });
}
