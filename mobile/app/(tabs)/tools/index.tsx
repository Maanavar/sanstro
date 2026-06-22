import React, { useState } from "react";
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";

interface ToolCard {
  icon: string;
  key: string;
  route?: string;
  locked?: boolean;
}

const TOOLS: ToolCard[] = [
  { icon: "💍", key: "porutham",    route: "/(tabs)/tools/porutham" },
  { icon: "⏰", key: "muhurta",     route: "/(tabs)/tools/muhurta" },
  { icon: "⭐", key: "natchathiram", route: "/(tabs)/tools/natchathiram" },
  { icon: "📜", key: "jadhagam",    locked: true },
  { icon: "🔱", key: "dosham",      route: "/(tabs)/tools/dosham" },
  { icon: "🌟", key: "yogam",       route: "/(tabs)/tools/yogam" },
  { icon: "🛕", key: "pariharam",   route: "/(tabs)/tools/pariharam" },
  { icon: "🔮", key: "prashan",     route: "/(tabs)/tools/prashan" },
];

export default function ToolsScreen() {
  const { t, strings, lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [showGate, setShowGate] = useState(false);

  function handleToolTap(tool: ToolCard) {
    if (tool.locked && tier === "guest") {
      setShowGate(true);
      return;
    }
    if (tool.route) router.push(tool.route as Parameters<typeof router.push>[0]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isTamil ? TamilType.heading : EnType.heading]}>
          {t(strings.tools.title)}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Matching & Compatibility */}
        <Text style={styles.sectionLabel}>{isTamil ? "பொருத்தம் & இணக்கம்" : "Matching & Compatibility"}</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleToolTap(TOOLS[0])}
          activeOpacity={0.85}
        >
          <Text style={styles.cardIcon}>{TOOLS[0].icon}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {t(strings.tools.porutham_name)}
            </Text>
            <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.tools.porutham_desc)}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Auspicious Timing */}
        <Text style={styles.sectionLabel}>{isTamil ? "சிறந்த நேரம்" : "Auspicious Timing"}</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleToolTap(TOOLS[1])}
          activeOpacity={0.85}
        >
          <Text style={styles.cardIcon}>{TOOLS[1].icon}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {t(strings.tools.muhurta_name)}
            </Text>
            <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.tools.muhurta_desc)}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Nakshatra */}
        <Text style={styles.sectionLabel}>{isTamil ? "நட்சத்திரம்" : "Nakshatra"}</Text>
        <TouchableOpacity style={styles.card} onPress={() => handleToolTap(TOOLS[2])} activeOpacity={0.85}>
          <Text style={styles.cardIcon}>{TOOLS[2].icon}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? "நட்சத்திர விவரம்" : "Nakshatra Details"}
            </Text>
            <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "பண்புகள், தெய்வம், சின்னம், பாதங்கள்" : "Traits, deity, symbol & padas"}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Birth Chart */}
        <Text style={styles.sectionLabel}>{isTamil ? "ஜாதகம்" : "Birth Chart"}</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleToolTap(TOOLS[3])}
          activeOpacity={0.85}
        >
          <Text style={styles.cardIcon}>{TOOLS[3].icon}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {t(strings.tools.jadhagam_name)}
            </Text>
            <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {t(strings.tools.jadhagam_desc)}
            </Text>
          </View>
          {tier === "guest" ? (
            <View style={styles.lockBadge}><Text style={styles.lockText}>🔒</Text></View>
          ) : (
            <Text style={styles.arrow}>›</Text>
          )}
        </TouchableOpacity>

        {/* Chart Analysis */}
        <Text style={styles.sectionLabel}>{isTamil ? "ஜாதக ஆய்வு" : "Chart Analysis"}</Text>
        {[TOOLS[4], TOOLS[5], TOOLS[6]].map((tool, i) => {
          const labels: { ta: string; en: string; descTa: string; descEn: string }[] = [
            { ta: "தோஷ ஆய்வு", en: "Dosha Check", descTa: "மங்கல, கால சர்ப, பித்ரு தோஷம்", descEn: "Mangal, Kala Sarpa, Pitru doshas" },
            { ta: "யோக ஆய்வு", en: "Yoga Analysis", descTa: "ராஜ யோகம், தன யோகம் மேலும்", descEn: "Raja, Dhana & Pancha Mahapurusha yogas" },
            { ta: "பரிகார பரிந்துரை", en: "Remedies", descTa: "கோயில், மந்திரம், கல்லு, நிறம்", descEn: "Temples, mantras, stones & colours" },
          ];
          const lbl = labels[i];
          return (
            <TouchableOpacity key={tool.key} style={styles.card} onPress={() => handleToolTap(tool)} activeOpacity={0.85}>
              <Text style={styles.cardIcon}>{tool.icon}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                  {isTamil ? lbl.ta : lbl.en}
                </Text>
                <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? lbl.descTa : lbl.descEn}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}

        {/* Horary */}
        <Text style={styles.sectionLabel}>{isTamil ? "பிரச்னம்" : "Horary"}</Text>
        <TouchableOpacity style={styles.card} onPress={() => handleToolTap(TOOLS[7])} activeOpacity={0.85}>
          <Text style={styles.cardIcon}>{TOOLS[7].icon}</Text>
          <View style={styles.cardText}>
            <Text style={[styles.cardName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? "பிரச்னம் (ஹோரர்)" : "Prashan (Horary)"}
            </Text>
            <Text style={[styles.cardDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "கேள்வி கேட்டு உடனடி பதில் பெறுங்கள்" : "Ask a question, get an instant reading"}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Guest banner */}
        {tier === "guest" && (
          <TouchableOpacity style={styles.guestBanner} onPress={() => setShowGate(true)}>
            <Text style={[styles.guestBannerText, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil
                ? "உங்கள் ஜாதகம் 60 வினாடியில் பெறுங்கள் →"
                : "Get your birth chart in 60 seconds →"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Jadhagam Signup Gate (Screen 13) */}
      <Modal visible={showGate} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setShowGate(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetEmoji}>📜</Text>
            <Text style={[styles.sheetHeading, isTamil ? TamilType.display : EnType.display]}>
              {isTamil ? "உங்கள் ஜாதகம் இலவசமாக" : "Your Jadhagam — Free"}
            </Text>
            <Text style={[styles.sheetBody, isTamil ? TamilType.body : EnType.body]}>
              {isTamil
                ? "பிறந்த நேரம் கொடுத்தால், ஒரு-பக்க ஜாதகம் உடனே தயார்."
                : "Give your birth time and get a 1-page jadhagam instantly — free."}
            </Text>
            {[
              isTamil ? "திருக்கணித முறையில் கணக்கிடப்பட்டது" : "Calculated by Thirukanitham method",
              isTamil ? "உங்கள் தரவு பாதுகாப்பானது" : "Your data stays private",
              isTamil ? "கணக்கு இலவசம்" : "Account is free",
            ].map((pt) => (
              <View key={pt} style={styles.bulletRow}>
                <Text style={styles.bulletCheck}>✓</Text>
                <Text style={[styles.bulletText, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
                  {pt}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.sheetCta}
              onPress={() => {
                setShowGate(false);
                router.push("/(auth)/register");
              }}
            >
              <Text style={styles.sheetCtaText}>
                {isTamil ? "கணக்கு உருவாக்கு & ஜாதகம் பெறு" : "Create Account & Get Jadhagam"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowGate(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.later}>{isTamil ? "பின்னர்" : "Maybe later"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  title: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.sm },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: S.sm,
    marginBottom: S.xs,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardIcon: { fontSize: 32 },
  cardText: { flex: 1 },
  cardName: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
  cardDesc: { color: C.textSecond, marginTop: 2 },
  arrow: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.textTertiary },
  lockBadge: {
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.chip,
    padding: S.xs,
  },
  lockText: { fontSize: 16 },
  guestBanner: {
    backgroundColor: "rgba(139,26,60,0.08)",
    borderRadius: RADIUS.card,
    padding: S.base,
    marginTop: S.base,
    alignItems: "center",
  },
  guestBannerText: { fontSize: 14, lineHeight: 22, color: C.maroon },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    padding: S.base,
    paddingBottom: S.xxl,
    gap: S.md,
  },
  handle: { width: 40, height: 4, backgroundColor: C.divider, borderRadius: 2, alignSelf: "center" },
  sheetEmoji: { fontSize: 56, textAlign: "center" },
  sheetHeading: { color: C.textPrimary, textAlign: "center" },
  sheetBody: { color: C.textSecond, textAlign: "center" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: S.sm },
  bulletCheck: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.green, marginTop: 2 },
  bulletText: { fontSize: 14, lineHeight: 22, color: C.textPrimary, flex: 1 },
  sheetCta: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  sheetCtaText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  later: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary, textAlign: "center" },
});
