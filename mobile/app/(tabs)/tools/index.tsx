import React, { useMemo, useState } from "react";
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Heart, Clock, Star, FileText, Layers, Sparkles, MapPin, HelpCircle, Lock, BookOpen, Check,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring, staggerInterval, duration } from "@/theme/motion";

type ToolDef = {
  Icon: LucideIcon;
  key: string;
  route?: string;
  locked?: boolean;
  nameEn: string;
  nameTa: string;
  descEn: string;
  descTa: string;
};

type ToolGroup = {
  labelEn: string;
  labelTa: string;
  tools: ToolDef[];
};

const GROUPS: ToolGroup[] = [
  {
    labelEn: "Your Chart",
    labelTa: "உங்கள் ஜாதகம்",
    tools: [
      {
        Icon: FileText, key: "jadhagam", locked: true,
        nameEn: "Birth Chart",   nameTa: "ஜாதகம்",
        descEn: "Full natal chart", descTa: "ஜாதக விவரங்கள்",
      },
      {
        Icon: Layers, key: "dosham", route: "/(tabs)/tools/dosham",
        nameEn: "Dosha Check",  nameTa: "தோஷ ஆய்வு",
        descEn: "Mangal, Kala Sarpa, Pitru", descTa: "மங்கல, கால சர்ப, பித்ரு",
      },
      {
        Icon: Sparkles, key: "yogam", route: "/(tabs)/tools/yogam",
        nameEn: "Yoga Analysis", nameTa: "யோக ஆய்வு",
        descEn: "Raja, Dhana & Mahapurusha", descTa: "ராஜ யோகம், தன யோகம்",
      },
      {
        Icon: MapPin, key: "pariharam", route: "/(tabs)/tools/pariharam",
        nameEn: "Remedies",     nameTa: "பரிகாரம்",
        descEn: "Temples, mantras & gemstones", descTa: "கோயில், மந்திரம், கல்லு",
      },
    ],
  },
  {
    labelEn: "Nakshatra & Matching",
    labelTa: "நட்சத்திரம் & பொருத்தம்",
    tools: [
      {
        Icon: Star, key: "natchathiram", route: "/(tabs)/tools/natchathiram",
        nameEn: "Nakshatra",     nameTa: "நட்சத்திரம்",
        descEn: "Traits, deity & padas", descTa: "பண்புகள், தெய்வம், பாதங்கள்",
      },
      {
        Icon: Heart, key: "porutham", route: "/(tabs)/tools/porutham",
        nameEn: "Compatibility", nameTa: "பொருத்தம்",
        descEn: "10-point marriage matching", descTa: "10 பொருத்தம் சரிபார்க்க",
      },
    ],
  },
  {
    labelEn: "Timing & Horary",
    labelTa: "நேரம் & பிரச்னம்",
    tools: [
      {
        Icon: Clock, key: "muhurta", route: "/(tabs)/tools/muhurta",
        nameEn: "Muhurta",  nameTa: "முகூர்த்தம்",
        descEn: "Auspicious time for events", descTa: "சுபமான நேரம் தேர்வு",
      },
      {
        Icon: HelpCircle, key: "prashan", route: "/(tabs)/tools/prashan",
        nameEn: "Horary",   nameTa: "பிரச்னம்",
        descEn: "Ask and get an instant reading", descTa: "கேள்வி கேட்டு உடனடி பதில்",
      },
    ],
  },
];

function chunkPairs(tools: ToolDef[]): [ToolDef, ToolDef | null][] {
  const pairs: [ToolDef, ToolDef | null][] = [];
  for (let i = 0; i < tools.length; i += 2) {
    pairs.push([tools[i]!, tools[i + 1] ?? null]);
  }
  return pairs;
}

type TileProps = {
  tool: ToolDef;
  isTamil: boolean;
  isGuestLocked: boolean;
  onPress: () => void;
};

function ToolTile({ tool, isTamil, isGuestLocked, onPress }: TileProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { Icon } = tool;
  return (
    <TouchableOpacity
      style={[styles.tile, isGuestLocked && styles.tileLocked]}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityLabel={`${isTamil ? tool.nameTa : tool.nameEn}${isGuestLocked ? ", கணக்கு தேவை" : ""}`}
      accessibilityRole="button"
    >
      <View style={styles.tileIconRow}>
        <View style={[styles.tileIconWell, isGuestLocked && styles.tileIconWellLocked]}>
          <Icon size={22} color={isGuestLocked ? C.textTertiary : C.goldOnLight} strokeWidth={1.5} />
        </View>
        {isGuestLocked && (
          <View style={styles.lockBadge}>
            <Lock size={12} color={C.textTertiary} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.tileName,
          { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" },
        ]}
        numberOfLines={1}
      >
        {isTamil ? tool.nameTa : tool.nameEn}
      </Text>
      <Text
        style={[styles.tileDesc, isTamil ? TamilType.caption : EnType.caption]}
        numberOfLines={2}
      >
        {isTamil ? tool.descTa : tool.descEn}
      </Text>
    </TouchableOpacity>
  );
}

export default function ToolsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t, strings, lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [showGate, setShowGate] = useState(false);

  function handleTap(tool: ToolDef) {
    if (tool.locked && tier === "guest") {
      setShowGate(true);
      return;
    }
    if (tool.route) router.push(tool.route as Parameters<typeof router.push>[0]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
        <View style={styles.headerText}>
          <Text style={[styles.title, isTamil ? TamilType.heading : EnType.heading]}>
            {t(strings.tools.title)}
          </Text>
          <Text style={[styles.subtitle, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "8 à®œà¯‹à®¤à®¿à®Ÿ à®•à®°à¯à®µà®¿à®•à®³à¯" : "8 Jyotish tools, grouped by job"}
          </Text>
        </View>
        <View style={styles.toolCountPill}>
          <Sparkles size={15} color={C.goldOnLight} strokeWidth={1.5} />
          <Text style={styles.toolCountText}>8</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {GROUPS.map((group, groupIdx) => (
          <Animated.View key={group.labelEn} style={styles.group} entering={FadeInDown.delay(entranceDelay.supporting + groupIdx * staggerInterval).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
            <Text style={styles.groupLabel}>
              {isTamil ? group.labelTa : group.labelEn}
            </Text>
            {chunkPairs(group.tools).map(([a, b], rowIdx) => (
              <View key={rowIdx} style={styles.tileRow}>
                <ToolTile
                  tool={a}
                  isTamil={isTamil}
                  isGuestLocked={!!(a.locked && tier === "guest")}
                  onPress={() => handleTap(a)}
                />
                {b ? (
                  <ToolTile
                    tool={b}
                    isTamil={isTamil}
                    isGuestLocked={!!(b.locked && tier === "guest")}
                    onPress={() => handleTap(b)}
                  />
                ) : (
                  <View style={styles.tileSpacer} />
                )}
              </View>
            ))}
          </Animated.View>
        ))}

        {tier === "guest" && (
          <Animated.View entering={FadeIn.delay(entranceDelay.tertiary).duration(duration.medium)}>
          <TouchableOpacity style={styles.guestBanner} onPress={() => setShowGate(true)}>
            <Text style={[
              styles.guestBannerText,
              { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" },
            ]}>
              {isTamil
                ? "உங்கள் ஜாதகம் 60 வினாடியில் பெறுங்கள் →"
                : "Get your birth chart in 60 seconds →"}
            </Text>
          </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <Modal visible={showGate} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowGate(false)}
          activeOpacity={1}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetIconWrap}>
              <BookOpen size={56} color={C.saffron} strokeWidth={1.5} />
            </View>
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
                <Check size={16} color={C.green} strokeWidth={1.5} style={styles.bulletCheck} />
                <Text style={[styles.bulletText, {
                  fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular",
                }]}>
                  {pt}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.sheetCta}
              onPress={() => { setShowGate(false); router.push("/(auth)/register"); }}
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

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    marginHorizontal: S.lg,
    marginTop: S.lg,
    marginBottom: S.md,
    padding: S.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: C.parchmentDeep,
    borderWidth: 1,
    borderColor: C.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: S.md,
  },
  headerText: { flex: 1, gap: S.xs },
  title: { color: C.textPrimary },
  subtitle: { color: C.textTertiary },
  toolCountPill: {
    minWidth: 52,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: C.goldLight,
    borderWidth: 1,
    borderColor: C.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: S.xs,
  },
  toolCountText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: C.goldOnLight },
  scroll: { paddingHorizontal: S.lg, paddingBottom: S.xl, gap: S.xl },

  group: { gap: S.sm },
  groupLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0,
    textTransform: "uppercase",
    color: C.textTertiary,
    marginBottom: S.xs,
  },
  tileRow:    { flexDirection: "row", gap: S.sm },
  tileSpacer: { flex: 1 },

  tile: {
    flex: 1,
    minHeight: 146,
    backgroundColor: C.parchmentDeep,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.md,
    gap: S.sm,
  },
  tileLocked: { opacity: 0.58 },
  tileIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: S.xs,
  },
  tileIconWell: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: C.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconWellLocked: { backgroundColor: C.surfaceRaised },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: C.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  tileName: {
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
  },
  tileDesc: { color: C.textTertiary },

  guestBanner: {
    backgroundColor: C.goldLight,
    borderRadius: RADIUS.md,
    padding: S.lg,
    alignItems: "center",
  },
  guestBannerText: { fontSize: 14, lineHeight: 22, color: C.goldOnLight },

  overlay: { flex: 1, backgroundColor: C.deepIndigo, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.parchmentDeep,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: S.lg,
    paddingBottom: S.xl,
    gap: S.md,
  },
  handle:        { width: 40, height: 4, backgroundColor: C.divider, borderRadius: 2, alignSelf: "center" },
  sheetIconWrap: { alignItems: "center", paddingVertical: S.sm },
  sheetHeading:  { color: C.textPrimary, textAlign: "center" },
  sheetBody:     { color: C.textSecond, textAlign: "center" },
  bulletRow:     { flexDirection: "row", alignItems: "flex-start", gap: S.sm },
  bulletCheck: { marginTop: 3 },
  bulletText:    { fontSize: 14, lineHeight: 22, color: C.textPrimary, flex: 1 },
  sheetCta: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  sheetCtaText: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 24, color: C.parchment },
  later:        { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary, textAlign: "center" },
  });
}
