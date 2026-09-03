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
    name: { ta: "திருப்பரங்குன்றம்", en: "Thiruparankundram" },
    district: { ta: "மதுரை", en: "Madurai" },
    quality: { ta: "மணமகன் — திருமண வாழ்த்து", en: "Bridegroom — marriage blessings" },
  },
  {
    num: "2",
    name: { ta: "திருச்செந்தூர்", en: "Thiruchendur" },
    district: { ta: "தூத்துக்குடி கரை", en: "Tuticorin coast" },
    quality: { ta: "போர்வீரன் — பாதுகாப்பு & வலிமை", en: "Warrior — protection & strength in adversity" },
  },
  {
    num: "3",
    name: { ta: "பழனி", en: "Palani" },
    district: { ta: "டிண்டுக்கல்", en: "Dindigul" },
    quality: { ta: "துறவி — அகங்காரம் கரைக்க, சனி/ராகு தடை கடக்க", en: "Renunciant — dissolve ego, overcome Saturn/Rahu blocks" },
  },
  {
    num: "4",
    name: { ta: "சுவாமிமலை", en: "Swamimalai" },
    district: { ta: "கும்பகோணம்", en: "Kumbakonam" },
    quality: { ta: "ஆசிரியன் — ஞானம் & குருவின் அருள்", en: "Teacher — wisdom & Jupiter's blessing" },
  },
  {
    num: "5",
    name: { ta: "பழமுதிர்ச்சோலை", en: "Pazhamudircholai" },
    district: { ta: "மதுரை மலைகள்", en: "Madurai hills" },
    quality: { ta: "வன தேவன் — அமைதி & குடும்ப நல்லிணக்கம்", en: "Forest lord — peace & family harmony" },
  },
  {
    num: "6",
    name: { ta: "திருத்தணி", en: "Thiruthani" },
    district: { ta: "திருவள்ளூர் மாவட்டம்", en: "Thiruvallur district" },
    quality: { ta: "ஓய்வு படை வீடு — தோல்விக்கு பின் தைரியம்", en: "Resting abode — courage after setback" },
  },
];

const FAQ = [
  {
    q: { ta: "யாத்திரை வேலை செய்ய ஆறு கோயில்களும் தரிசிக்க வேண்டுமா?", en: "Do I need to visit all six temples?" },
    a: { ta: "இல்லை. ஒவ்வொரு கோயிலும் தனக்கு நிறைவானது. முழு சுற்று ஒட்டுமொத்த அருளை சேர்க்கிறது, ஆனால் தனிப்பட்ட நலனுக்கு தேவையில்லை.", en: "No. Each temple is complete in itself. The full circuit adds cumulative grace, but is not required for individual benefit." },
  },
  {
    q: { ta: "செவ்வாய் தோஷத்திற்கு எந்த கோயில் சிறந்தது?", en: "Which temple is best for Sevvai dosham?" },
    a: { ta: "அறுபடை வீடுகளில் பழனி (அகங்காரம் சரணடைவதற்கு) & திருச்செந்தூர் (வலிமை & பாதுகாப்பிற்கு) செவ்வாய் குணத்திற்கு மிகவும் குறிப்பிட்டவை.", en: "Among the six, Palani (surrendering Mars pride) and Thiruchendur (strength & protection) are most specific to Sevvai dosham." },
  },
  {
    q: { ta: "பழனி கோயில் குறிப்பாக எதில் உதவுகிறது?", en: "What does Palani specifically help with?" },
    a: { ta: "அகங்காரம் & பற்றுதலின் கரைப்பு. சனி-ராகு தடைகள், கர்வத்தால் வரும் தடைகள், ஆழமான பணிவு & சரணடைதல் தேவைப்படும் நிலைமைகளுக்கு.", en: "Dissolving ego and attachment. Strongly visited for Saturn-Rahu obstacles, pride-driven blocks, and situations requiring deep humility and surrender." },
  },
  {
    q: { ta: "தரிசிக்க சிறந்த நேரம் எது?", en: "What is the best time to visit?" },
    a: { ta: "ஸ்கந்த சஷ்டி கார்த்திகை மாதத்தில் மிகவும் சக்திவாய்ந்தது. செவ்வாய்க்கிழமைகள் முருகனின் நாள். செவ்வாய் தோஷ பரிகாரத்திற்கு செவ்வாய் தசையில் செவ்வாய்க்கிழமை குறிப்பாக அர்த்தமுள்ளது.", en: "Skanda Sashti (Karthigai month) is most powerful. Tuesdays are Murugan's day. For Sevvai dosham, visit on a Tuesday during Mars dasa or antardasa." },
  },
];

export default function ArupadaiVeeduScreen() {
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
          {isTamil ? "அறுபடை வீடு" : "Arupadai Veedu"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={[styles.eyebrow, T.caption]}>
            {isTamil ? "கோயில் வழிகாட்டி · முருகன்" : "Temple Guide · Murugan"}
          </Text>
          <Text style={[styles.heroTitle, T.display]}>
            {isTamil ? "முருகப் பெருமானின் ஆறு திருப்பதிகள்" : "The Six Sacred Abodes of Lord Murugan"}
          </Text>
          <Text style={[styles.heroBody, T.body]}>
            {isTamil
              ? "தமிழ்நாட்டில் முருகப் பெருமானின் ஆறு மிகவும் புனிதமான திருப்பதிகள், ஒவ்வொன்றும் அவரது தெய்வீக இருப்பின் வேறுபட்ட குணத்தை குறிக்கின்றன."
              : "The six most sacred Murugan shrines in Tamil Nadu, each representing a different quality of his divine presence: warrior, teacher, bridegroom, wanderer, compassionate healer, and supreme grace."}
          </Text>
        </View>

        {/* For Sevvai dosham note */}
        <View style={styles.doshamNote}>
          <Text style={[styles.doshamText, T.body]}>
            {isTamil
              ? "செவ்வாய் தோஷம், வலுவான செவ்வாய் சக்தி மற்றும் தைரியம் & தெளிவு தேவைப்படும் வாழ்க்கை சவால்களுக்கான முதன்மையான பரிகாரம்."
              : "The primary remedy for Sevvai dosham, strong Mars energy, and life challenges requiring courage and clarity."}
          </Text>
        </View>

        {/* Temple list */}
        <Text style={[styles.sectionTitle, T.subheading]}>
          {isTamil ? "ஆறு திருப்பதிகள்" : "The Six Sacred Abodes"}
        </Text>
        {TEMPLES.map((temple) => (
          <View key={temple.num} style={styles.templeCard}>
            <View style={styles.templeBadge}>
              <Text style={styles.templeBadgeText}>{temple.num}</Text>
            </View>
            <View style={styles.templeBody}>
              <Text style={[styles.templeName, T.subheading]}>{isTamil ? temple.name.ta : temple.name.en}</Text>
              <Text style={[styles.templePlace, T.bodySmall]}>{isTamil ? temple.district.ta : temple.district.en}</Text>
              <Text style={[styles.templePower, T.bodySmall]}>{isTamil ? temple.quality.ta : temple.quality.en}</Text>
            </View>
          </View>
        ))}

        {/* Mantra */}
        <View style={styles.mantraCard}>
          <Text style={[styles.mantraLabel, T.caption]}>
            {isTamil ? "முருகன் மந்திரம் (ஷடக்ஷர)" : "Murugan Mantra (Shadakshara)"}
          </Text>
          <Text style={[styles.mantraText, T.display]}>
            {isTamil ? "ஓம் சரவணபவ" : "Om Saravanabhava"}
          </Text>
          <Text style={[styles.mantraMeaning, T.body]}>
            {isTamil
              ? "ஆறெழுத்து மந்திரம் — ஒவ்வொரு எழுத்தும் ஆறு படை வீடுகளில் ஒன்றை குறிப்பதாக சொல்லப்படுகிறது. செவ்வாய்க்கிழமைகளிலும் ஸ்கந்த சஷ்டியிலும் குறிப்பாக ஓதப்படுகிறது."
              : "The six-syllable mantra — each syllable said to correspond to one of the six abodes. Recited especially on Tuesdays and through Skanda Sashti."}
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
    doshamNote: {
      backgroundColor: C.cautionLight, borderRadius: RADIUS.card,
      padding: S.md, borderLeftWidth: 3, borderLeftColor: C.saffron,
    },
    doshamText: { color: C.textPrimary },
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
    templeName: { color: C.textPrimary },
    templePlace: { color: C.textTertiary },
    templePower: { color: C.saffron, marginTop: 2 },
    mantraCard: {
      backgroundColor: C.darkBg, borderRadius: RADIUS.card,
      padding: S.lg, gap: S.sm, alignItems: "center",
    },
    mantraLabel: { color: C.gold, textTransform: "uppercase" },
    mantraText: { color: C.surface, textAlign: "center" },
    mantraMeaning: { color: C.indigoText, textAlign: "center" },
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
