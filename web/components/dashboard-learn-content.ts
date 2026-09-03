import {
  LEARN_BIRTH,
  LEARN_CHANDRA,
  LEARN_JAD,
  LEARN_PORUTHAM,
  LEARN_THIRUK,
  LEARN_VEDIC_WESTERN,
} from "@/lib/marketing-i18n";

/**
 * Data-only mapping of the real, already-shipped `/learn/*` marketing
 * articles into a generic bilingual shape, reused by the in-app Learn
 * viewers (Nova's Explore tab + Classic's single-article modal) instead of
 * navigating out to the marketing site. Every string here is imported
 * directly from `web/lib/marketing-i18n.ts` — nothing is re-authored; only
 * each article's bespoke `xxx_h2`/`xxx_body` field pairs are collected into
 * a uniform `sections[]` array (the marketing objects don't share a common
 * schema, so this mapping has to be done by hand once per article).
 */

export type BiText = { en: string; ta: string };

export type LearnArticleContent = {
  slug: string;
  eyebrow: BiText;
  title: BiText;
  lead: BiText;
  sections: { heading: BiText; body: BiText }[];
};

export const LEARN_ARTICLES_CONTENT: LearnArticleContent[] = [
  {
    slug: "vedic-vs-western",
    eyebrow: LEARN_VEDIC_WESTERN.eyebrow,
    title: LEARN_VEDIC_WESTERN.h1,
    lead: LEARN_VEDIC_WESTERN.lead,
    sections: [
      { heading: LEARN_VEDIC_WESTERN.zodiac_h2, body: LEARN_VEDIC_WESTERN.zodiac_body },
      { heading: LEARN_VEDIC_WESTERN.lagna_h2, body: LEARN_VEDIC_WESTERN.lagna_body },
      { heading: LEARN_VEDIC_WESTERN.stars_h2, body: LEARN_VEDIC_WESTERN.stars_body },
      { heading: LEARN_VEDIC_WESTERN.dasha_h2, body: LEARN_VEDIC_WESTERN.dasha_body },
    ],
  },
  {
    slug: "what-is-thirukanitham",
    eyebrow: LEARN_THIRUK.eyebrow,
    title: LEARN_THIRUK.h1,
    lead: LEARN_THIRUK.lead,
    sections: [
      { heading: LEARN_THIRUK.meaning_h2, body: LEARN_THIRUK.meaning_body },
      { heading: LEARN_THIRUK.drik_h2, body: LEARN_THIRUK.drik_body },
      { heading: LEARN_THIRUK.ayanamsa_h2, body: LEARN_THIRUK.ayanamsa_body },
      { heading: LEARN_THIRUK.matters_h2, body: LEARN_THIRUK.matters_body },
      { heading: LEARN_THIRUK.how_h2, body: LEARN_THIRUK.how_body },
    ],
  },
  {
    slug: "how-to-read-a-jadhagam",
    eyebrow: LEARN_JAD.eyebrow,
    title: LEARN_JAD.h1,
    lead: LEARN_JAD.lead,
    sections: [
      { heading: LEARN_JAD.structure_h2, body: LEARN_JAD.structure_body },
      { heading: LEARN_JAD.lagna_h2, body: LEARN_JAD.lagna_body },
      { heading: LEARN_JAD.dasha_h2, body: LEARN_JAD.dasha_body },
    ],
  },
  {
    slug: "what-is-chandrashtama",
    eyebrow: LEARN_CHANDRA.eyebrow,
    title: LEARN_CHANDRA.h1,
    lead: LEARN_CHANDRA.lead,
    sections: [
      { heading: LEARN_CHANDRA.what_h2, body: LEARN_CHANDRA.what_body },
      { heading: LEARN_CHANDRA.calm_h2, body: LEARN_CHANDRA.calm_body },
    ],
  },
  {
    slug: "what-is-porutham",
    eyebrow: LEARN_PORUTHAM.eyebrow,
    title: LEARN_PORUTHAM.h1,
    lead: LEARN_PORUTHAM.lead,
    sections: [
      { heading: LEARN_PORUTHAM.meaning_h2, body: LEARN_PORUTHAM.meaning_body },
      { heading: LEARN_PORUTHAM.how_h2, body: LEARN_PORUTHAM.how_body },
      { heading: LEARN_PORUTHAM.critical_h2, body: LEARN_PORUTHAM.critical_body },
      { heading: LEARN_PORUTHAM.sevvai_h2, body: LEARN_PORUTHAM.sevvai_body },
      { heading: LEARN_PORUTHAM.count_h2, body: LEARN_PORUTHAM.count_body },
    ],
  },
  {
    slug: "why-birth-time-matters",
    eyebrow: LEARN_BIRTH.eyebrow,
    title: LEARN_BIRTH.h1,
    lead: LEARN_BIRTH.lead,
    sections: [
      { heading: LEARN_BIRTH.lagna_h2, body: LEARN_BIRTH.lagna_body },
      { heading: LEARN_BIRTH.dasha_h2, body: LEARN_BIRTH.dasha_body },
      { heading: LEARN_BIRTH.uncertain_h2, body: LEARN_BIRTH.uncertain_body },
    ],
  },
  // New Tamil, pending native review
  {
    slug: "what-is-a-dasha",
    eyebrow: { en: "Basics", ta: "அடிப்படை" },
    title: { en: "What is a Dasha?", ta: "தசை என்றால் என்ன?" },
    lead: { en: "A Dasha is a long life period in which one planet's themes are given special emphasis. It is a timing lens, not a fixed prediction.", ta: "தசை என்பது ஒரு கிரகத்தின் கருப்பொருள்களுக்கு முக்கியத்துவம் அளிக்கும் நீண்ட வாழ்க்கைக் காலம். இது நேரத்தைப் புரிந்துகொள்ளும் ஒரு முறை; உறுதியான கணிப்பு அல்ல." },
    sections: [
      { heading: { en: "Major and smaller periods", ta: "பெரிய மற்றும் சிறிய காலங்கள்" }, body: { en: "Vimshottari Dasha divides life into major periods, then sub-periods within them. The current pair helps explain which chart themes are louder now.", ta: "விம்சோத்தரி தசை வாழ்க்கையை பெரிய காலங்களாகவும், அவற்றுக்குள் சிறிய காலங்களாகவும் பிரிக்கிறது. நடப்பு இணைப்பு இப்போது எந்த ஜாதகக் கருப்பொருள்கள் வலுவாக உள்ளன என்பதைப் புரிய உதவுகிறது." } },
      { heading: { en: "Use it with the whole chart", ta: "முழு ஜாதகத்துடன் பாருங்கள்" }, body: { en: "A period does not work alone. The planet's placement, its houses, and current transits shape how its themes may be experienced.", ta: "ஒரு தசை தனியாகச் செயல்படாது. கிரகத்தின் நிலை, வீடுகள் மற்றும் நடப்பு கோச்சாரம் அதன் கருப்பொருள்கள் எப்படி வெளிப்படலாம் என்பதை வடிவமைக்கின்றன." } },
    ],
  },
  // New Tamil, pending native review
  {
    slug: "what-is-a-house",
    eyebrow: { en: "Basics", ta: "அடிப்படை" },
    title: { en: "What is a house?", ta: "வீடு என்றால் என்ன?" },
    lead: { en: "A house is one of twelve life areas in a birth chart, counted from your rising sign (Lagnam).", ta: "வீடு என்பது லக்னத்திலிருந்து எண்ணப்படும் ஜாதகத்தின் பன்னிரண்டு வாழ்க்கைப் பகுதிகளில் ஒன்று." },
    sections: [
      { heading: { en: "Life areas, not buildings", ta: "கட்டிடங்கள் அல்ல, வாழ்க்கைப் பகுதிகள்" }, body: { en: "For example, the fourth house relates to home and inner ease; the tenth relates to work and public responsibility. A planet in a house adds its own style to that area.", ta: "உதாரணமாக, நான்காம் வீடு வீடு மற்றும் மன அமைதியுடன் தொடர்புடையது; பத்தாம் வீடு வேலை மற்றும் பொது பொறுப்புடன் தொடர்புடையது. ஒரு கிரகம் அந்த வீட்டில் இருந்தால், அந்தப் பகுதிக்கு அதன் தன்மையைச் சேர்க்கிறது." } },
    ],
  },
  // New Tamil, pending native review
  {
    slug: "what-is-lagnam",
    eyebrow: { en: "Basics", ta: "அடிப்படை" },
    title: { en: "What is Lagnam?", ta: "லக்னம் என்றால் என்ன?" },
    lead: { en: "Lagnam is the sign rising in the east at your birth time. It sets the starting point for every house in your chart.", ta: "லக்னம் என்பது நீங்கள் பிறந்த நேரத்தில் கிழக்கில் உதயமான ராசி. உங்கள் ஜாதகத்தின் ஒவ்வொரு வீட்டிற்கும் இதுவே தொடக்கப் புள்ளி." },
    sections: [
      { heading: { en: "Why birth time matters", ta: "பிறந்த நேரம் ஏன் முக்கியம்" }, body: { en: "The rising sign changes through the day. That is why even a small uncertainty in birth time can change the houses and make a chart less precise.", ta: "உதய ராசி நாளில் மாறிக்கொண்டே இருக்கும். அதனால்தான் பிறந்த நேரத்தில் சிறிய நிச்சயமின்மையும் வீடுகளை மாற்றி ஜாதகத்தின் துல்லியத்தைக் குறைக்கலாம்." } },
    ],
  },
  // New Tamil, pending native review
  {
    slug: "what-does-the-daily-score-mean",
    eyebrow: { en: "Today", ta: "இன்று" },
    title: { en: "What does the daily score mean?", ta: "தினசரி மதிப்பெண் எதைக் குறிக்கிறது?" },
    lead: { en: "The daily score is a practical weather report for your chart: a summary of timing factors, not a measure of your worth or a guarantee of outcomes.", ta: "தினசரி மதிப்பெண் உங்கள் ஜாதகத்திற்கான நடைமுறை வானிலை அறிக்கை: நேரக் காரணிகளின் சுருக்கம்; உங்கள் மதிப்பு அல்லது முடிவுகளுக்கான உத்தரவாதம் அல்ல." },
    sections: [
      { heading: { en: "How to use it", ta: "எப்படி பயன்படுத்துவது" }, body: { en: "Use a lower score to slow down new starts and choose routine work where possible. Ongoing responsibilities still matter; the score is a prompt for care, not a reason to stop living your day.", ta: "குறைந்த மதிப்பெண் உள்ள நாளில் புதிய தொடக்கங்களை மெதுவாக்கி, முடிந்தால் வழக்கமான பணிகளைத் தேர்ந்தெடுங்கள். நடந்து கொண்டிருக்கும் பொறுப்புகள் தொடரும்; இது கவனத்திற்கான நினைவூட்டல், நாளை நிறுத்துவதற்கான காரணம் அல்ல." } },
    ],
  },
];

export function getLearnArticle(slug: string): LearnArticleContent | undefined {
  return LEARN_ARTICLES_CONTENT.find((a) => a.slug === slug);
}
