import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

// Static content map — extend as learn pages grow
export const LEARN_CONTENT: Record<string, {
  titleEn: string;
  titleTa: string;
  summaryEn: string;
  summaryTa: string;
  sectionsEn: { heading: string; body: string }[];
  sectionsTa: { heading: string; body: string }[];
  webPath?: string;
}> = {
  "what-is-thirukanitham": {
    titleEn: "What is Thirukanitham?",
    titleTa: "திருக்கணிதம் என்றால் என்ன?",
    summaryEn: "Thirukanitham is the astronomical calculation system used in Tamil Nadu for all astrological computations. Unlike some Western or North Indian systems, it calculates planetary positions based on actual observable positions in the sky.",
    summaryTa: "திருக்கணிதம் என்பது தமிழ்நாட்டில் அனைத்து ஜோதிட கணக்கீடுகளுக்கும் பயன்படுத்தப்படும் வானியல் கணக்கீட்டு முறையாகும். மேற்கத்திய அல்லது வட இந்திய முறைகளிலிருந்து வேறுபட்டு, இது வானத்தில் நிஜமாக தெரியும் கிரக நிலைகளை அடிப்படையாகக் கொண்டது.",
    sectionsEn: [
      {
        heading: "Astronomical precision",
        body: "Thirukanitham uses precise modern astronomical data. It corrects for ayanamsa (the precession of the equinoxes) using the KP or Lahiri reference — the same correction used in the Thirukanitha Panchangam published annually by Tamil Nadu government research bodies."
      },
      {
        heading: "Why it differs from some apps",
        body: "Most popular astrology apps use Drik or Vakya methods. Vakya uses pre-computed tables from ancient texts. Thirukanitham re-computes positions fresh for each date. For birth times after the mid-1900s, the difference can be 1-2 degrees — enough to change a nakshatra or dasha period."
      },
      {
        heading: "What Vinaadi uses",
        body: "Every calculation in Vinaadi — panchangam timings, dasha, transit, yogam, dosham — is computed using the Thirukanitham method with Swiss Ephemeris precision. Results carry the Thirukanitham badge to confirm this."
      }
    ],
    sectionsTa: [
      {
        heading: "வானியல் துல்லியம்",
        body: "திருக்கணிதம் நவீன வானியல் தரவை பயன்படுத்துகிறது. அயனாம்சா திருத்தத்திற்கு KP அல்லது லாஹிரி முறையை பின்பற்றுகிறது — தமிழ்நாடு அரசு வெளியிடும் திருக்கணித பஞ்சாங்கம் பயன்படுத்தும் அதே முறை."
      },
      {
        heading: "சில பயன்பாடுகளில் ஏன் வேறுபாடு இருக்கிறது",
        body: "பெரும்பாலான ஜோதிட பயன்பாடுகள் திரிக் அல்லது வாக்கிய முறையை பயன்படுத்துகின்றன. வாக்கியம் பழைய நூல்களில் இருந்து முன்கூட்டியே கணக்கிடப்பட்ட அட்டவணைகளை பயன்படுத்துகிறது. திருக்கணிதம் ஒவ்வொரு தேதிக்கும் புதிதாக கணக்கிடுகிறது."
      },
      {
        heading: "விநாடி என்ன பயன்படுத்துகிறது",
        body: "விநாடியில் உள்ள அனைத்து கணக்கீடுகளும் — பஞ்சாங்க நேரங்கள், தசா, கோச்சாரம், யோகம், தோஷம் — திருக்கணித முறையில் Swiss Ephemeris துல்லியத்துடன் கணக்கிடப்படுகின்றன."
      }
    ],
    webPath: "/learn/thirukanitham",
  },
  "why-birth-time-matters": {
    titleEn: "Why birth time matters",
    titleTa: "பிறந்த நேரம் ஏன் முக்கியம்?",
    summaryEn: "Even a 4-minute difference in birth time can shift your ascendant. A 15-minute difference can change your nakshatra. Getting birth time right is the single most important step in accurate chart calculation.",
    summaryTa: "பிறந்த நேரத்தில் 4 நிமிட வேறுபாடு கூட உங்கள் லக்னத்தை மாற்றலாம். 15 நிமிட வேறுபாடு நட்சத்திரத்தை மாற்றலாம். சரியான பிறந்த நேரம் என்பது துல்லியமான ஜாதக கணக்கீட்டிற்கு மிக முக்கியமான படியாகும்.",
    sectionsEn: [
      {
        heading: "Lagna shifts every 2 hours",
        body: "The ascendant (lagna) changes sign roughly every 2 hours. If your birth time is off by 2 hours, your entire chart wheel rotates — house placements change, and your dasha periods shift accordingly."
      },
      {
        heading: "Dasha timing precision",
        body: "The Vimshottari dasha system calculates the Moon's position at birth. A 1-nakshatra error (13°20' of arc) results in a dasha maha period shift of up to 6 years. This is why even the same person may see different dasha timelines across different apps — they started with different birth times."
      },
      {
        heading: "What to do if you don't know your time",
        body: "Use Vinaadi's Rectification tool. It uses major life events (marriage, career change, overseas move) to narrow down the likely birth time range, then confirms the best-fit lagna."
      }
    ],
    sectionsTa: [
      {
        heading: "லக்னம் ஒவ்வொரு 2 மணி நேரத்திலும் மாறுகிறது",
        body: "லக்னம் தோராயமாக ஒவ்வொரு 2 மணி நேரத்திலும் ராசியை மாற்றுகிறது. பிறந்த நேரத்தில் 2 மணி நேர வேறுபாடு இருந்தால், உங்கள் ஜாதக சக்கரம் முழுவதும் சுழலும்."
      },
      {
        heading: "தசா நேர துல்லியம்",
        body: "விம்சோத்தரி தசா முறை பிறப்பின் போது சந்திரனின் நிலையை கணக்கிடுகிறது. ஒரு நட்சத்திர பிழை 6 ஆண்டுகள் வரை மகா தசா காலத்தை மாற்றலாம்."
      },
      {
        heading: "நேரம் தெரியாவிட்டால் என்ன செய்வது",
        body: "விநாடியின் ரெக்டிஃபிகேஷன் கருவியை பயன்படுத்துங்கள். முக்கிய வாழ்க்கை நிகழ்வுகளை (திருமணம், தொழில் மாற்றம்) பயன்படுத்தி, சரியான பிறந்த நேரத்தை கண்டறியலாம்."
      }
    ],
    webPath: "/learn/birth-time",
  },
  "how-to-read-a-jadhagam": {
    titleEn: "How to read a Jadhagam",
    titleTa: "ஜாதகத்தை எப்படி படிப்பது?",
    summaryEn: "A Jadhagam (birth chart) is a map of the sky at the moment of birth. It shows which planets were in which signs, and how those placements translate to different areas of life.",
    summaryTa: "ஜாதகம் என்பது பிறப்பின் தருணத்தில் வானத்தின் வரைபடம். எந்த கிரகங்கள் எந்த ராசிகளில் இருந்தன என்று காட்டுகிறது.",
    sectionsEn: [
      {
        heading: "The 12 houses",
        body: "A chart has 12 houses (bhavams). House 1 is the lagna (ascendant) — the sign that was rising on the eastern horizon at birth. Each house governs a domain: 1=self, 2=wealth, 3=courage, 4=mother/home, 5=children/creativity, 6=health/enemies, 7=marriage/partnerships, 8=longevity/hidden things, 9=dharma/father, 10=career/status, 11=gains, 12=losses/liberation."
      },
      {
        heading: "How to find your lagna",
        body: "In the South Indian chart format used in Tamil astrology, the lagna is marked with a double line or a special mark in the cell. All other houses follow in a fixed grid — house 1 stays at the top-left corner of the grid, and the numbers increment clockwise."
      },
      {
        heading: "Reading planet placements",
        body: "Each cell in the grid shows which planets are in that house. A planet is said to be 'in' a house when it occupies that house number at birth. Strong planets (exalted, in own sign, or well-aspected) produce clear results. Weak or debilitated planets require more careful reading."
      }
    ],
    sectionsTa: [
      {
        heading: "12 பாவங்கள்",
        body: "ஜாதகத்தில் 12 பாவங்கள் (வீடுகள்) உள்ளன. 1ஆம் பாவம் லக்னம் — பிறந்த நேரத்தில் கிழக்கு திசையில் உதயமான ராசி. ஒவ்வொரு பாவமும் வாழ்க்கையின் ஒரு பகுதியை ஆட்சி செய்கிறது."
      },
      {
        heading: "உங்கள் லக்னத்தை எப்படி கண்டறிவது",
        body: "தமிழ் ஜோதிடத்தில் பயன்படுத்தப்படும் தென்னிந்திய ஜாதக வடிவத்தில், லக்னம் இரட்டை கோடு அல்லது சிறப்பு குறியீட்டால் காட்டப்படுகிறது."
      },
      {
        heading: "கிரக நிலைகளை படிப்பது",
        body: "ஒவ்வொரு கலத்திலும் எந்த கிரகங்கள் அந்த பாவத்தில் உள்ளன என்று காட்டப்படுகிறது. உச்சம் அல்லது சொந்த ராசியில் உள்ள கிரகங்கள் வலிமையானவை."
      }
    ],
    webPath: "/learn/jadhagam",
  },
  "what-is-chandrashtama": {
    titleEn: "What is Chandrashtama?",
    titleTa: "சந்திராஷ்டமம் என்றால் என்ன?",
    summaryEn: "Chandrashtama is the period when the transiting Moon is in the 8th house from your natal Moon sign. It lasts about 2.5 days every month and is considered a time for caution rather than initiation.",
    summaryTa: "சந்திராஷ்டமம் என்பது வலம் வரும் சந்திரன் உங்கள் ஜென்ம சந்திரனிலிருந்து 8ஆம் இடத்தில் இருக்கும் காலமாகும். ஒவ்வொரு மாதமும் சுமார் 2.5 நாட்கள் நீடிக்கும்.",
    sectionsEn: [
      {
        heading: "Why the 8th house",
        body: "In Vedic astrology, the 8th house is associated with obstacles, sudden changes, and hidden matters. When the Moon — which governs the mind and emotions — transits this house from your natal Moon, mental stress and confusion tend to increase."
      },
      {
        heading: "What to avoid",
        body: "Traditional guidance: avoid starting new ventures, signing contracts, travel for new purposes, and medical procedures during Chandrashtama. Important decisions made during this period often need to be revisited."
      },
      {
        heading: "What to do instead",
        body: "Use the period for reflection, rest, and completing existing tasks. Spiritual practice, meditation, and catching up on delayed work are all well-suited for this time."
      }
    ],
    sectionsTa: [
      {
        heading: "ஏன் 8ஆம் இடம்",
        body: "வேதிய ஜோதிடத்தில் 8ஆம் இடம் தடைகள், திடீர் மாற்றங்கள், மறைந்த விஷயங்களை குறிக்கிறது. சந்திரன் — மனம் மற்றும் உணர்வுகளை ஆட்சி செய்பவர் — இந்த இடத்தில் சஞ்சரிக்கும்போது மன அழுத்தம் அதிகரிக்கலாம்."
      },
      {
        heading: "என்ன தவிர்க்க வேண்டும்",
        body: "பாரம்பரிய வழிகாட்டுதல்: புதிய முயற்சிகளை தொடங்குவதை, ஒப்பந்தங்களில் கையெழுத்திடுவதை, மருத்துவ நடைமுறைகளை சந்திராஷ்டம காலத்தில் தவிர்க்கவும்."
      },
      {
        heading: "என்ன செய்யலாம்",
        body: "சிந்தனை, ஓய்வு, நிலுவையில் உள்ள வேலைகளை முடிக்க இந்த காலம் சரியானது. ஆன்மீக பயிற்சி மற்றும் தியானம் பொருத்தமானவை."
      }
    ],
    webPath: "/learn/chandrashtama",
  },
  "navagraha-temples": {
    titleEn: "Navagraha Temples of Tamil Nadu",
    titleTa: "தமிழ்நாட்டின் நவகிரக கோயில்கள்",
    summaryEn: "Each of the nine grahas has a dedicated temple in Tamil Nadu. Visiting the temple for your weak or afflicted planet is the traditional way to ease those difficulties.",
    summaryTa: "ஒன்பது கிரகங்களுக்கும் தமிழ்நாட்டில் தனித்தனி கோயில்கள் உள்ளன. பலவீனமான கிரகத்தின் கோயிலை தரிசிப்பது கிரக தோஷ நிவாரணத்தின் பாரம்பரிய வழியாகும்.",
    sectionsEn: [
      {
        heading: "The nine temples",
        body: "Sun — Suryanar Koil (near Kumbakonam). Moon — Thingalur (Thiruvarur district). Mars — Vaitheeswaran Koil (Sirkazhi). Mercury — Thiruvenkadu (Sirkazhi). Jupiter — Alangudi (Papanasam). Venus — Kanjanur (Thanjavur). Saturn — Thirunallar (Karaikal). Rahu — Thirunageswaram (Kumbakonam). Ketu — Keezhperumpallam (Nagapattinam).",
      },
      {
        heading: "Which planet to focus on",
        body: "Check your Jadhagam for planets that are debilitated (neecha), in the 6th, 8th, or 12th house, or closely conjunct Rahu or Ketu. These benefit most from a temple visit. Your Vinaadi chart highlights such placements.",
      },
      {
        heading: "When to visit",
        body: "Each planet has an associated day: Sun=Sunday, Moon=Monday, Mars=Tuesday, Mercury=Wednesday, Jupiter=Thursday, Venus=Friday, Saturn=Saturday. Visiting on the planet's own day during its hora is considered most auspicious.",
      },
    ],
    sectionsTa: [
      {
        heading: "ஒன்பது கோயில்கள்",
        body: "சூரியன் — சூரியனார் கோயில் (கும்பகோணம்). சந்திரன் — திங்களூர் (திருவாரூர்). செவ்வாய் — வைத்தீஸ்வரன் கோயில் (சீர்காழி). புதன் — திருவெண்காடு (சீர்காழி). குரு — ஆலங்குடி (பாபநாசம்). சுக்கிரன் — காஞ்சனூர் (தஞ்சாவூர்). சனி — திருநள்ளாறு (காரைக்கால்). ராகு — திருநாகேஸ்வரம் (கும்பகோணம்). கேது — கீழப்பெரும்பள்ளம் (நாகப்பட்டினம்).",
      },
      {
        heading: "எந்த கிரகத்தில் கவனம்",
        body: "உங்கள் ஜாதகத்தில் நீசம், 6-8-12 ஆம் பாவம், அல்லது ராகு-கேதுவுடன் சேர்ந்த கிரகங்களை கண்டறியுங்கள். இவை கோயில் தரிசனத்தால் அதிக பலன் பெறும்.",
      },
      {
        heading: "எப்போது தரிசிக்க வேண்டும்",
        body: "ஒவ்வொரு கிரகத்திற்கும் ஒரு நாள்: சூரியன்=ஞாயிறு, சந்திரன்=திங்கள், செவ்வாய்=செவ்வாய், புதன்=புதன், குரு=வியாழன், சுக்கிரன்=வெள்ளி, சனி=சனி. கிரகத்தின் நாளில் ஓரையில் தரிசிப்பது சுபமானது.",
      },
    ],
    webPath: "/temples",
  },
  "what-is-porutham": {
    titleEn: "What is Porutham?",
    titleTa: "பொருத்தம் என்றால் என்ன?",
    summaryEn: "Porutham is the Tamil system of marriage compatibility analysis. It checks 10 specific compatibilities between the bride and groom's birth stars (nakshatras) and Moon signs. A good porutham score indicates harmonious union across key life domains.",
    summaryTa: "பொருத்தம் என்பது திருமண இணக்கத்தை ஆராயும் தமிழ் முறை. மணமக்களின் நட்சத்திரங்கள் மற்றும் ராசிகளை ஒப்பிட்டு 10 குறிப்பிட்ட இணக்கங்களை சோதிக்கிறது."
    ,
    sectionsEn: [
      {
        heading: "The 10 porutham checks",
        body: "Dinam (daily harmony), Ganam (temperament), Mahendram (prosperity), Sthree Deergham (longevity), Yoni (physical compatibility), Rasi (Moon sign compatibility), Rasiyathipati (sign lord harmony), Vasyam (attraction), Rajju (longevity of marriage), Vedha (freedom from affliction). Each is weighted differently."
      },
      {
        heading: "Minimum for a match",
        body: "Traditional guidance requires at least 6 of 10 poruthams to be present for a match to be considered. Rajju and Mahendram are considered the most critical — many families require both to be present regardless of the total count."
      },
      {
        heading: "What Vinaadi checks",
        body: "Vinaadi's Porutham tool checks all 10 using Thirukanitham-precise star positions. It shows which are present, which are absent, and provides the overall compatibility score with a short explanation."
      }
    ],
    sectionsTa: [
      {
        heading: "10 பொருத்த சோதனைகள்",
        body: "தினம், கணம், மாஹேந்திரம், ஸ்திரீ தீர்க்கம், யோனி, ராசி, ராசியாதிபதி, வசியம், ராஜ்ஜு, வேதை — ஒவ்வொன்றும் வெவ்வேறு முக்கியத்துவம் கொண்டவை."
      },
      {
        heading: "குறைந்தபட்ச தேவை",
        body: "பாரம்பரிய வழிகாட்டுதல் படி, 10ல் குறைந்தது 6 பொருத்தங்கள் இருக்க வேண்டும். ராஜ்ஜு மற்றும் மாஹேந்திரம் மிக முக்கியமானவையாக கருதப்படுகின்றன."
      },
      {
        heading: "விநாடி என்ன சோதிக்கிறது",
        body: "விநாடியின் பொருத்தம் கருவி திருக்கணித முறையில் அனைத்து 10 பொருத்தங்களையும் சோதிக்கிறது மற்றும் ஒட்டுமொத்த இணக்க மதிப்பெண்ணை வழங்குகிறது."
      }
    ],
    webPath: "/learn/porutham",
  },
};

export default function LearnArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;

  const content = slug ? LEARN_CONTENT[slug] : undefined;

  if (!content) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Learn" isTamil={isTamil} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, type.body]}>Article not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title = isTamil ? content.titleTa : content.titleEn;
  const summary = isTamil ? content.summaryTa : content.summaryEn;
  const sections = isTamil ? content.sectionsTa : content.sectionsEn;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={title} isTamil={isTamil} />
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

        <TouchableOpacity
          style={styles.webLink}
          onPress={() => content.webPath && void Linking.openURL("https://vinaadi.com" + content.webPath)}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel={isTamil ? "முழு வழிகாட்டி" : "Full guide"}
        >
          <Text style={styles.webLinkLabel}>
            {isTamil ? "முழு வழிகாட்டி →" : "Full guide →"}
          </Text>
          <Text style={[styles.webLinkBody, type.bodySmall]}>
            {isTamil
              ? "விரிவான கட்டுரை vinaadi.com-ல் உள்ளது. தட்டினால் திறக்கும்."
              : "Detailed article available at vinaadi.com — tap to open."}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, isTamil }: { title: string; isTamil: boolean }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: S.base,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: S.sm,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 32 },
  headerTitle: { flex: 1, fontSize: 16, color: C.textPrimary, textAlign: "center" },
  content: { padding: S.lg, paddingBottom: S.xl * 2, gap: S.lg },
  hero: { gap: S.sm },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 0 },
  heroTitle: { color: C.textPrimary },
  heroSummary: { color: C.textSecond },
  divider: { height: 1, backgroundColor: C.divider },
  section: { gap: S.sm },
  sectionHeading: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.textPrimary },
  sectionBody: { color: C.textSecond },
  webLink: {
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.card, padding: S.md, gap: S.xs,
    borderWidth: 1, borderColor: C.divider,
  },
  webLinkLabel: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron },
  webLinkBody: { color: C.textSecond },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: S.md, padding: S.lg },
  notFoundText: { color: C.textSecond, textAlign: "center" },
  backBtn: { backgroundColor: C.saffron, borderRadius: RADIUS.button, paddingHorizontal: S.lg, paddingVertical: S.sm },
  backBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" },
});
