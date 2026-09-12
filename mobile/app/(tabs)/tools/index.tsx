import React, { useMemo, useState } from "react";
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Heart, Clock, Star, FileText, Layers, Sparkles, MapPin, HelpCircle, Lock, BookOpen, Check,
  TrendingUp, SlidersHorizontal, Award, Users, Shuffle, CalendarDays, UserCheck, ShoppingCart,
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionLabel } from "@/components/SectionLabel";

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
    labelEn: "Matching & Nakshatra",
    labelTa: "பொருத்தம் & நட்சத்திரம்",
    tools: [
      {
        Icon: Heart, key: "porutham", route: "/(tabs)/tools/porutham",
        nameEn: "Compatibility", nameTa: "பொருத்தம்",
        descEn: "10-point marriage matching", descTa: "10 பொருத்தம் சரிபார்க்க",
      },
      {
        Icon: Star, key: "natchathiram", route: "/(tabs)/tools/natchathiram",
        nameEn: "Nakshatra",     nameTa: "நட்சத்திரம்",
        descEn: "Traits, deity & padas", descTa: "பண்புகள், தெய்வம், பாதங்கள்",
      },
      {
        Icon: UserCheck, key: "friendship", route: "/(tabs)/tools/friendship",
        nameEn: "Friendship Compat.", nameTa: "நட்பு பொருத்தம்",
        descEn: "Family vault profile matching", descTa: "குடும்ப உறுப்பினர் பொருத்தம்",
      },
    ],
  },
  {
    labelEn: "Your Chart",
    labelTa: "உங்கள் ஜாதகம்",
    tools: [
      {
        Icon: FileText, key: "jadhagam", route: "/(tabs)/tools/jadhagam",
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
    labelEn: "Calendar & Planning",
    labelTa: "நாட்காட்டி & திட்டமிடல்",
    tools: [
      {
        Icon: CalendarDays, key: "daily-panchangam", route: "/(tabs)/tools/daily-panchangam",
        nameEn: "Daily Panchangam", nameTa: "தினசரி பஞ்சாங்கம்",
        descEn: "Tithi, nakshatra & time windows", descTa: "திதி, நட்சத்திரம் & நேர சாளரங்கள்",
      },
      {
        Icon: CalendarDays, key: "muhurtham-naal", route: "/muhurtham-naal/index",
        nameEn: "Muhurtham Naal", nameTa: "முகூர்த்த நாட்கள்",
        descEn: "2027 auspicious wedding dates", descTa: "2027 திருமண சுப நாட்கள்",
      },
    ],
  },
  {
    labelEn: "Learn",
    labelTa: "கற்றுக்கொள்",
    tools: [
      {
        Icon: BookOpen, key: "nakshatra-list", route: "/learn/nakshatra-list",
        nameEn: "27 Nakshatras", nameTa: "27 நட்சத்திரங்கள்",
        descEn: "Browse all lunar mansions", descTa: "அனைத்து நட்சத்திரங்களும்",
      },
      {
        Icon: MapPin, key: "pancha-bhoota", route: "/temples/pancha-bhoota",
        nameEn: "Pancha Bhoota Sthalams", nameTa: "பஞ்ச பூத ஸ்தலங்கள்",
        descEn: "Five element temples of Shiva", descTa: "சிவனின் ஐம்பூத கோயில்கள்",
      },
      {
        Icon: MapPin, key: "arupadai-veedu", route: "/temples/arupadai-veedu",
        nameEn: "Arupadai Veedu", nameTa: "அறுபடை வீடு",
        descEn: "Six sacred Murugan abodes", descTa: "முருகன் ஆறு திருப்பதிகள்",
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
  {
    labelEn: "Advanced",
    labelTa: "மேம்பட்ட",
    tools: [
      {
        Icon: Shuffle, key: "dasha", route: "/dasha/index",
        nameEn: "Dasha",         nameTa: "தசா",
        descEn: "Your life-period timeline",     descTa: "தசா காலகட்ட அட்டவணை",
      },
      {
        Icon: TrendingUp, key: "varshaphala", route: "/varshaphala/index",
        nameEn: "Varshaphala",   nameTa: "வர்ஷபல",
        descEn: "Annual chart & predictions",    descTa: "ஆண்டு ஜாதக முன்னறிவிப்பு",
      },
      {
        Icon: SlidersHorizontal, key: "rectification", route: "/rectification/index",
        nameEn: "Rectification", nameTa: "பிறந்த நேர திருத்தம்",
        descEn: "Fine-tune your birth time",     descTa: "பிறந்த நேரம் சரிப்படுத்துதல்",
      },
      {
        Icon: Award, key: "wrapped", route: "/wrapped/index",
        nameEn: "Year Wrapped",  nameTa: "ஆண்டு சுருக்கம்",
        descEn: "Your cosmic year in review",    descTa: "உங்கள் ஜோதிட ஆண்டு பார்வை",
      },
      {
        Icon: Users, key: "family-vault", route: "/family-vault",
        nameEn: "Family Vault",  nameTa: "குடும்ப சேமிப்பு",
        descEn: "Charts for everyone you care about", descTa: "குடும்பத்தினர் ஜாதகங்கள்",
      },
      {
        Icon: ShoppingCart, key: "reports", route: "/reports/index",
        nameEn: "Buy Reports",   nameTa: "அறிக்கைகளை வாங்கு",
        descEn: "One-time jadhagam & porutham reports", descTa: "ஒரு முறை ஜாதக & பொருத்த அறிக்கை",
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
      <ScreenHeader
        title={t(strings.tools.title)}
        subtitle="16 Jyotish tools, grouped by job"
        subtitleTa="16 ஜோதிட கருவிகள்"
        isTamil={isTamil}
        entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        badge={
          <View style={styles.toolCountPill}>
            <Sparkles size={15} color={C.goldOnLight} strokeWidth={1.5} />
            <Text style={styles.toolCountText}>16</Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {GROUPS.map((group, groupIdx) => (
          <Animated.View key={group.labelEn} style={styles.group} entering={FadeInDown.delay(entranceDelay.supporting + groupIdx * staggerInterval).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
            <SectionLabel labelEn={group.labelEn} labelTa={group.labelTa} isTamil={isTamil} />
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
                ? "ஜாதகம், நட்சத்திரம், பஞ்சாங்கம் — 60 வினாடியில் →"
                : "Charts, nakshatras, panchangam — in 60 seconds →"}
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
  tileRow:    { flexDirection: "row", gap: S.sm },
  tileSpacer: { flex: 1 },

  tile: {
    flex: 1,
    minHeight: 150,
    backgroundColor: C.parchmentDeep,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.md,
    gap: S.sm,
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  tileLocked: { opacity: 0.5 },
  tileIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: S.xs,
  },
  tileIconWell: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: C.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconWellLocked: { backgroundColor: C.surfaceRaised },
  lockBadge: {
    width: 22,
    height: 22,
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
    borderRadius: RADIUS.lg,
    padding: S.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${C.gold}50`,
  },
  guestBannerText: { fontSize: 15, lineHeight: 22, color: C.goldOnLight },

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
