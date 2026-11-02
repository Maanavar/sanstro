/**
 * What each consent purpose means, in the words every surface shows (admin spec
 * L2, D-10): the signup form, the consent panel and Settings read this one table,
 * so a purpose cannot be described one way where it is granted and another way
 * where it is withdrawn.
 *
 * New Tamil, pending native review.
 */
import type { OptionalConsents } from "@vinaadi/shared/api";

type Bilingual = { en: string; ta: string };

export const SERVICE_PURPOSE: { title: Bilingual; desc: Bilingual } = {
  title: {
    en: "Use my details to provide the service",
    ta: "சேவைக்காக என் விவரங்களைப் பயன்படுத்துதல்",
  },
  desc: {
    en: "Required. Your birth details calculate your charts and readings; your email signs you in.",
    ta: "அவசியம். உங்கள் பிறப்பு விவரங்கள் ஜாதகத்தையும் பலன்களையும் கணிக்கவும், மின்னஞ்சல் உள்நுழையவும் பயன்படும்.",
  },
};

export const OPTIONAL_PURPOSES: ReadonlyArray<{ key: keyof OptionalConsents; title: Bilingual; desc: Bilingual }> = [
  {
    key: "updates",
    title: { en: "Updates and astro alerts", ta: "புதுப்பிப்புகளும் ஜோதிட அறிவிப்புகளும்" },
    desc: {
      en: "Optional. Morning nalla neram, dasa changes, your birth-star day and notes on new features. Off until you switch it on.",
      ta: "விருப்பத்திற்குரியது. காலை நல்ல நேரம், தசை மாற்றம், உங்கள் பிறந்த நட்சத்திர நாள், புதிய வசதிகள் பற்றிய குறிப்புகள். நீங்கள் இயக்கும் வரை அணைந்தே இருக்கும்.",
    },
  },
  {
    key: "analytics",
    title: { en: "Product analytics", ta: "தயாரிப்புப் பகுப்பாய்வு" },
    desc: {
      en: "Optional. Links how you use Vinaadi to your account so we can improve it. Without it, visits are counted anonymously.",
      ta: "விருப்பத்திற்குரியது. Vinaadi-ஐ மேம்படுத்த, நீங்கள் அதைப் பயன்படுத்தும் விதத்தை உங்கள் கணக்குடன் இணைக்கிறது. இது இல்லாமல் வருகைகள் அடையாளமின்றி மட்டுமே எண்ணப்படும்.",
    },
  },
  {
    key: "askImprove",
    title: { en: "Help improve Ask Vinaadi", ta: "Ask Vinaadi-ஐ மேம்படுத்த உதவுங்கள்" },
    desc: {
      en: "Optional. Our team may read your Ask Vinaadi questions and answers to make the answers better.",
      ta: "விருப்பத்திற்குரியது. பதில்களை மேம்படுத்த, உங்கள் Ask Vinaadi கேள்விகளையும் பதில்களையும் எங்கள் குழு படிக்கலாம்.",
    },
  },
];

export const ADULT_DECLARATION: Bilingual = {
  en: "I am 18 or older.",
  ta: "எனக்கு 18 வயது அல்லது அதற்கு மேல்.",
};

export const CHANGE_LATER: Bilingual = {
  en: "You can change the optional ones any time in Settings.",
  ta: "விருப்பத்திற்குரியவற்றை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.",
};

export const NO_OPTIONAL_CONSENTS: OptionalConsents = { updates: false, analytics: false, askImprove: false };
