import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

const TEMPLES = [
  {
    num: "1",
    element: { ta: "மண் (பிருத்வி)", en: "Earth (Prithvi)" },
    name: { ta: "ஏகாம்பரேஸ்வரர்", en: "Ekambareswarar" },
    place: { ta: "காஞ்சிபுரம்", en: "Kanchipuram" },
    power: { ta: "ஆதாரம் & நிலைத்தன்மை", en: "Grounding & stability" },
  },
  {
    num: "2",
    element: { ta: "நீர் (அப்பு)", en: "Water (Appu)" },
    name: { ta: "ஜம்புகேஸ்வரர்", en: "Jambukeswarar" },
    place: { ta: "திருவானைக்காவல்", en: "Thiruvanaikaval" },
    power: { ta: "சுத்திகரணம் & ஓட்டம்", en: "Purification & flow" },
  },
  {
    num: "3",
    element: { ta: "நெருப்பு (தேஜஸ்)", en: "Fire (Tejas)" },
    name: { ta: "அருணாசலேஸ்வரர்", en: "Arunachaleswarar" },
    place: { ta: "திருவண்ணாமலை", en: "Thiruvannamalai" },
    power: { ta: "நெருப்பு சக்தி & தீவிரம்", en: "Fire energy & intensity" },
  },
  {
    num: "4",
    element: { ta: "காற்று (வாயு)", en: "Wind (Vayu)" },
    name: { ta: "ஸ்ரீகாளஹஸ்தீஸ்வரர்", en: "Srikalahasteeswara" },
    place: { ta: "ஸ்ரீகாளஹஸ்தி", en: "Srikalahasti" },
    power: { ta: "ஆற்றல் & சுவாசம்", en: "Vital force & breath" },
  },
  {
    num: "5",
    element: { ta: "ஆகாயம் (அகாஸ்)", en: "Space (Akash)" },
    name: { ta: "நடராஜர்", en: "Nataraja" },
    place: { ta: "சிதம்பரம்", en: "Chidambaram" },
    power: { ta: "விமோசனம் & மன தெளிவு", en: "Liberation & mind clarity" },
  },
];

const FAQ = [
  {
    q: { ta: "பரிகாரம் வேலை செய்ய ஐந்து கோயில்களும் தரிசிக்க வேண்டுமா?", en: "Do I have to visit all five temples?" },
    a: { ta: "இல்லை. ஒன்று அல்லது இரண்டு தரிசிப்பதும் அர்த்தமுள்ளது. முழு சுற்று நலனை பெருக்குகிறது, ஆனால் தேவையில்லை.", en: "No. Even visiting one or two has its own significance. The full circuit amplifies benefit but is not required." },
  },
  {
    q: { ta: "சனி தசையில் வருவது ஏன் முக்கியம்?", en: "Why visit during Saturn's dasa?" },
    a: { ta: "சனி சக்தி மண் & காற்று பூதங்களுடன் தொடர்புடையது. சனி தசையில் காஞ்சிபுரம் & ஸ்ரீகாளஹஸ்தி தரிசிப்பது குறிப்பாக பலன் தரும்.", en: "Saturn's energy connects to Earth & Air elements. Kanchipuram and Srikalahasti are especially powerful during Sani dasa." },
  },
  {
    q: { ta: "முழு சுற்று எவ்வளவு நேரம் ஆகும்?", en: "How long does the full circuit take?" },
    a: { ta: "பெரும்பாலும் 3–5 நாட்கள். காஞ்சிபுரம் & திருவானைக்காவல் அருகில் உள்ளன; திருவண்ணாமலை & சிதம்பரம் மற்றொரு குழு; ஸ்ரீகாளஹஸ்தி ஆந்திரத்தில்.", en: "Usually 3–5 days. Kanchipuram & Thiruvanaikaval are near each other; Thiruvannamalai & Chidambaram are a cluster; Srikalahasti is in Andhra Pradesh." },
  },
];

export default function PanchaBhootaScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, T.heading]}>
          {isTamil ? "பஞ்ச பூத ஸ்தலங்கள்" : "Pancha Bhoota Sthalams"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={[styles.eyebrow, T.caption]}>
            {isTamil ? "கோயில் வழிகாட்டி" : "Temple Guide"}
          </Text>
          <Text style={[styles.heroTitle, T.display]}>
            {isTamil ? "சிவனின் ஐம்பூத கோயில்கள்" : "The Five Element Temples of Shiva"}
          </Text>
          <Text style={[styles.heroBody, T.body]}>
            {isTamil
              ? "ஐந்து பண்டைய சிவன் கோயில்கள், ஒவ்வொன்றும் ஒரு பூதத்தை குறிக்கும் — மண், நீர், நெருப்பு, காற்று, ஆகாயம். பூத சுத்திகரணம் & கிரக நல்லிணக்கத்திற்கான மிக ஆழமான யாத்திரை சுற்று."
              : "Five ancient Shiva temples, each enshrining one element — Earth, Water, Fire, Wind, Space. The most profound pilgrimage circuit for elemental purification and planetary harmony."}
          </Text>
        </View>

        {/* Temple list */}
        <Text style={[styles.sectionTitle, T.subheading]}>
          {isTamil ? "ஐந்து கோயில்களும் அவற்றின் பூதங்களும்" : "The Five Temples and Their Elements"}
        </Text>
        {TEMPLES.map((temple) => (
          <View key={temple.num} style={styles.templeCard}>
            <View style={styles.templeBadge}>
              <Text style={styles.templeBadgeText}>{temple.num}</Text>
            </View>
            <View style={styles.templeBody}>
              <Text style={[styles.templeElement, T.caption]}>{isTamil ? temple.element.ta : temple.element.en}</Text>
              <Text style={[styles.templeName, T.subheading]}>{isTamil ? temple.name.ta : temple.name.en}</Text>
              <Text style={[styles.templePlace, T.bodySmall]}>{isTamil ? temple.place.ta : temple.place.en}</Text>
              <Text style={[styles.templePower, T.bodySmall]}>{isTamil ? temple.power.ta : temple.power.en}</Text>
            </View>
          </View>
        ))}

        {/* Mantra */}
        <View style={styles.mantraCard}>
          <Text style={[styles.mantraLabel, T.caption]}>
            {isTamil ? "பஞ்சாக்ஷர மந்திரம்" : "Panchakshara Mantra"}
          </Text>
          <Text style={[styles.mantraText, T.display]}>
            {isTamil ? "ஓம் நமஃ சிவாய" : "Om Namah Shivaaya"}
          </Text>
          <Text style={[styles.mantraMeaning, T.body]}>
            {isTamil
              ? "ந (மண்), ம (நீர்), சி (நெருப்பு), வ (காற்று), ய (ஆகாயம்) — ஐம்பூதங்களை குறியாக்கும் மந்திரம்."
              : "Na (earth), Ma (water), Shi (fire), Va (wind), Ya (space) — the mantra encoding the five elements."}
          </Text>
        </View>

        {/* When to visit */}
        <View style={styles.whenCard}>
          <Text style={[styles.sectionTitle, T.subheading]}>
            {isTamil ? "சுற்றை எப்போது செய்வது" : "When to Do the Circuit"}
          </Text>
          <Text style={[styles.whenBody, T.body]}>
            {isTamil
              ? "சனி அல்லது ராகு தசை காலங்கள் மிகவும் பரிந்துரைக்கப்படும் நேரங்கள். கார்த்திகை மாதம் திருவண்ணாமலையில் குறிப்பாக சக்திவாய்ந்தது. பாரம்பரிய வரிசை: காஞ்சிபுரம் → திருவானைக்காவல் → திருவண்ணாமலை → ஸ்ரீகாளஹஸ்தி → சிதம்பரம்."
              : "Saturn and Rahu dasa periods are most recommended. Karthigai month is especially powerful at Thiruvannamalai. Traditional order: Kanchipuram → Thiruvanaikaval → Thiruvannamalai → Srikalahasti → Chidambaram."}
          </Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, T.subheading]}>
          {isTamil ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently Asked Questions"}
        </Text>
        {FAQ.map((item, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={[styles.faqQ, T.subheading]}>
              {isTamil ? item.q.ta : item.q.en}
            </Text>
            <Text style={[styles.faqA, T.body]}>
              {isTamil ? item.a.ta : item.a.en}
            </Text>
          </View>
        ))}

        <View style={styles.faithNote}>
          <Text style={[styles.faithText, T.caption]}>
            {isTamil
              ? "ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை அமைப்பு. கோயில் தரிசனம் தனிப்பட்ட நம்பிக்கையை பொறுத்தது."
              : "Astrology is a traditional belief system. Temple visits are a matter of personal faith."}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
      backgroundColor: C.goldLight,
    },
    backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    headerTitle: { flex: 1, color: C.textPrimary },
    scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
    heroCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.base, gap: S.sm, borderWidth: 1, borderColor: C.divider,
    },
    eyebrow: { color: C.gold, textTransform: "uppercase" },
    heroTitle: { color: C.textPrimary },
    heroBody: { color: C.textSecond },
    sectionTitle: { color: C.textPrimary, marginTop: S.sm },
    templeCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.md, flexDirection: "row", gap: S.md, alignItems: "flex-start",
      borderWidth: 1, borderColor: C.divider,
    },
    templeBadge: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: C.goldLight,
      alignItems: "center", justifyContent: "center",
    },
    templeBadgeText: { fontFamily: "Inter_800ExtraBold", fontSize: 14, color: C.gold },
    templeBody: { flex: 1, gap: 2 },
    templeElement: { color: C.gold, textTransform: "uppercase" },
    templeName: { color: C.textPrimary },
    templePlace: { color: C.textSecond },
    templePower: { color: C.saffron, marginTop: 2 },
    mantraCard: {
      backgroundColor: C.darkBg, borderRadius: RADIUS.card,
      padding: S.lg, gap: S.sm, alignItems: "center",
    },
    mantraLabel: { color: C.gold, textTransform: "uppercase" },
    mantraText: { color: C.surface, textAlign: "center" },
    mantraMeaning: { color: C.indigoText, textAlign: "center" },
    whenCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.base, gap: S.sm, borderWidth: 1, borderColor: C.divider,
    },
    whenBody: { color: C.textSecond },
    faqCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.md, gap: S.xs, borderWidth: 1, borderColor: C.divider,
    },
    faqQ: { color: C.textPrimary },
    faqA: { color: C.textSecond },
    faithNote: {
      backgroundColor: C.surfaceAlt, borderRadius: RADIUS.card,
      padding: S.md, borderLeftWidth: 3, borderLeftColor: C.divider,
    },
    faithText: { color: C.textTertiary },
  });
}
