/**
 * What each consent purpose means, in the words every surface shows (admin spec
 * L2, D-10): the signup form, the consent panel and Settings read this one table,
 * so a purpose cannot be described one way where it is granted and another way
 * where it is withdrawn. Web and mobile both read it from here.
 *
 * New Tamil, pending native review.
 */
import type { OptionalConsents } from "./api/auth";

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
      en: "Optional. Morning nalla neram, dasa changes, your birth-star day, your Chandrashtamam the evening before, and notes on new features. Off until you switch it on.",
      ta: "விருப்பத்திற்குரியது. காலை நல்ல நேரம், தசை மாற்றம், உங்கள் பிறந்த நட்சத்திர நாள், முந்தைய மாலையே உங்கள் சந்திராஷ்டமம், புதிய வசதிகள் பற்றிய குறிப்புகள். நீங்கள் இயக்கும் வரை அணைந்தே இருக்கும்.",
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

/**
 * The DPDP §5 notice: what Vinaadi holds and where the rest is. Shown in full,
 * ahead of every choice, on web and mobile alike. It sat behind a "What Vinaadi
 * holds" fold-out for a day (audit U1); owner delegation 2026-11-03 put it back
 * in view, because the Rules ask for a notice understandable on its own and a
 * closed fold-out is a notice nobody reads.
 */
export const HELD_DATA_NOTICE: Bilingual = {
  en: "Vinaadi holds your email, the birth details you enter for yourself and your family, your questions to Ask Vinaadi, and your payment records. Our privacy notice lists each one, why we hold it, and how to withdraw consent, use your rights or complain.",
  ta: "உங்கள் மின்னஞ்சல், உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் நீங்கள் உள்ளிடும் பிறப்பு விவரங்கள், Ask Vinaadi-இடம் கேட்கும் கேள்விகள், கட்டணப் பதிவுகள் ஆகியவற்றை Vinaadi வைத்திருக்கிறது. ஒவ்வொன்றையும், அதை ஏன் வைத்திருக்கிறோம், ஒப்புதலைத் திரும்பப் பெறுவது, உங்கள் உரிமைகளைப் பயன்படுத்துவது, புகார் அளிப்பது எப்படி என்பதையும் எங்கள் தனியுரிமை அறிவிப்பு பட்டியலிடுகிறது.",
};

export const ADULT_DECLARATION: Bilingual = {
  en: "I am 18 or older.",
  ta: "எனக்கு 18 வயது அல்லது அதற்கு மேல்.",
};

export const CHANGE_LATER: Bilingual = {
  en: "You can change the optional ones any time in Settings.",
  ta: "விருப்பத்திற்குரியவற்றை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.",
};

export const NO_OPTIONAL_CONSENTS: OptionalConsents = { updates: false, analytics: false, askImprove: false };
