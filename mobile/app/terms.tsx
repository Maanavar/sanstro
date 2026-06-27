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
import { TERMS_OF_SERVICE } from "@vinaadi/shared/data/legal";

export default function TermsOfServiceScreen() {
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
          {isTamil ? "பயன்பாட்டு விதிமுறைகள்" : "Terms of Service"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.lastUpdated, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? `கடைசியாக புதுப்பிக்கப்பட்டது: ${TERMS_OF_SERVICE.lastUpdated}` : `Last updated: ${TERMS_OF_SERVICE.lastUpdated}`}
        </Text>

        <View style={styles.introCard}>
          <Text style={[styles.introText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "Vinaadi AI பயன்படுத்துவதன் மூலம் இந்த விதிமுறைகளை ஒப்புக்கொள்கிறீர்கள். தொடர்ந்து படிக்கவும்."
              : "By using Vinaadi AI, you agree to these Terms of Service. Please read them carefully."}
          </Text>
        </View>

        {TERMS_OF_SERVICE.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? section.heading.ta : section.heading.en}
            </Text>
            <Text style={[styles.sectionBody, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? section.body.ta : section.body.en}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={styles.privacyLink} onPress={() => router.replace("/privacy" as any)}>
          <Text style={styles.privacyLinkText}>
            {isTamil ? "தனியுரிமைக் கொள்கையை காண →" : "View Privacy Policy →"}
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
      backgroundColor: C.indigoSurface, borderRadius: RADIUS.card, padding: S.base,
    },
    introText: { color: C.surface, lineHeight: 24 },
    section: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    },
    sectionHeading: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    sectionBody: { color: C.textSecond, lineHeight: 24 },
    privacyLink: { alignItems: "center", paddingVertical: S.sm },
    privacyLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.saffron },
  });
}
