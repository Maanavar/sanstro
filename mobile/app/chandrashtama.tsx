import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

const AVOID = {
  ta: [
    "முக்கியமான ஒப்பந்தங்கள் கையெழுத்திட வேண்டாம்",
    "புதிய தொழில் / வியாபார முயற்சி தொடங்க வேண்டாம்",
    "அதிக பண பரிவர்த்தனை தவிர்க்கவும்",
    "தேவையற்ற சர்ச்சைகளில் ஈடுபட வேண்டாம்",
  ],
  en: [
    "Don't sign important contracts or agreements",
    "Don't launch a new business or major venture",
    "Avoid large financial transactions or loans",
    "Don't get drawn into unnecessary arguments",
  ],
};

const CAN_DO = {
  ta: [
    "ஆன்மீக நடைமுறைகள் — தியானம், ஜபம், பூஜை",
    "குடும்பத்தினருடன் அமைதியாக நேரம் செலவிடுங்கள்",
    "ஓய்வு எடுங்கள் — வலிமை திரட்டும் காலம்",
    "ஆலய தரிசனம், தர்மம் செய்வது நல்லது",
  ],
  en: [
    "Spiritual practice — meditation, japa, puja",
    "Spend quiet time with family and loved ones",
    "Rest and restore — build inner reserves",
    "Temple visit and charitable giving are beneficial",
  ],
};

export default function ChandrashtamaScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "சந்திராஷ்டமம்" : "Chandrashtama"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Alert hero */}
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "இன்று முதல் 2½ நாட்கள்" : "For the next 2½ days"}
            </Text>
            <Text style={[styles.alertSub, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil
                ? "நிலவு உங்கள் ராசியிலிருந்து 8ஆம் இடத்தில் உள்ளது — கவனம் தேவை."
                : "The Moon is in the 8th position from your rasi. Proceed with care."}
            </Text>
          </View>
        </View>

        {/* What to avoid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "என்ன தவிர்க்க வேண்டும்?" : "What to avoid?"}
          </Text>
          <View style={styles.bulletList}>
            {(isTamil ? AVOID.ta : AVOID.en).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletIcon, { color: C.alert }]}>✕</Text>
                <Text style={[styles.bulletText, isTamil ? TamilType.body : EnType.body]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* What you can do */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "என்ன செய்யலாம்?" : "What you CAN do"}
          </Text>
          <View style={styles.bulletList}>
            {(isTamil ? CAN_DO.ta : CAN_DO.en).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletIcon, { color: C.green }]}>✓</Text>
                <Text style={[styles.bulletText, isTamil ? TamilType.body : EnType.body]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pariharam link */}
        <View style={styles.parikaraCard}>
          <Text style={[styles.parikaraQuestion, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? "ஏதாவது பரிகாரம் உதவுமா?" : "Looking for remedies?"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.parikaraLink}>
              {isTamil ? "பரிகாரம் பற்றி அறிய →" : "Learn about pariharam →"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Framing note */}
        <View style={styles.toneNote}>
          <Text style={[styles.toneText, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "சந்திராஷ்டமம் 'கெட்ட நாள்' அல்ல — இது கவனமாக செயல்பட வேண்டிய காலம். சரியாக திட்டமிட்டால் நன்மை பெறலாம்."
              : "Chandrashtama is not a 'bad day' — it's a time for awareness and care. With right planning, you can still thrive."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
    backgroundColor: "#FFF9F0",
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
  alertCard: {
    backgroundColor: "#FFF3E0", borderRadius: RADIUS.card,
    borderLeftWidth: 4, borderLeftColor: C.caution,
    padding: S.base, flexDirection: "row", gap: S.md, alignItems: "flex-start",
  },
  alertIcon: { fontSize: 28 },
  alertTitle: { color: C.caution, marginBottom: 4 },
  alertSub: { color: C.textSecond },
  section: { gap: S.sm },
  sectionTitle: { color: C.textPrimary },
  bulletList: { gap: S.sm },
  bulletRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  bulletIcon: { fontFamily: "Inter_700Bold", fontSize: 14, width: 20, marginTop: 2 },
  bulletText: { color: C.textPrimary, flex: 1 },
  parikaraCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, gap: S.sm, borderWidth: 1, borderColor: C.divider,
  },
  parikaraQuestion: { color: C.textPrimary },
  parikaraLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.saffron },
  toneNote: {
    backgroundColor: "#EFF8F0", borderRadius: RADIUS.card,
    padding: S.md, borderLeftWidth: 3, borderLeftColor: C.green,
  },
  toneText: { color: C.textSecond },
});
