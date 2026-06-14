"use client";

import Link from "next/link";
import { useLang } from "@/components/lang-toggle";

type CtaVariant =
  | "dosham"
  | "sevvai-dosham"
  | "yogam"
  | "pariharam"
  | "marriage-pariharam"
  | "temple"
  | "thirunallar";

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
  secondaryHref: string;
  steps: [string, string, string];
};

const COPY: Record<CtaVariant, { en: Copy; ta: Copy }> = {
  dosham: {
    en: {
      eyebrow: "Match doshams with your chart",
      title: "Check which doshams actually apply to your Thirukanitham birth chart.",
      body: "Create a free Vinaadi account to save your birth details and read dosham results with Lagna, Moon, Venus, dasha, gochar, cancellations, and Tamil astrology context.",
      primary: "Create account and check my chart",
      secondary: "Generate a jadhagam first",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "Generate your Tamil D1 chart from birth date, time, and place.",
        "See dosham strength, cancellation factors, and timing relevance.",
        "Use saved charts for porutham, pariharam, and future guidance.",
      ],
    },
    ta: {
      eyebrow: "தோஷத்தை உங்கள் ஜாதகத்துடன் பாருங்கள்",
      title: "திருக்கணித ஜாதகத்தில் எந்த தோஷம் உண்மையில் பொருந்துகிறது என்பதை பாருங்கள்.",
      body: "பிறப்பு விவரங்களை சேமித்து, லக்னம், சந்திரன், சுக்கிரன், தசை, கோச்சாரம், தோஷ ரத்து, தமிழ் ஜோதிடப் பின்னணி ஆகியவற்றுடன் Vinaadi விளக்கத்தை பெறுங்கள்.",
      primary: "கணக்கு உருவாக்கி ஜாதகம் பார்க்க",
      secondary: "முதலில் ஜாதகம் உருவாக்கு",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "பிறந்த தேதி, நேரம், இடம் வைத்து தமிழ் D1 ஜாதகம் உருவாக்குங்கள்.",
        "தோஷ வலிமை, ரத்து காரணம், கால பலன் ஆகியவற்றை பாருங்கள்.",
        "பொருத்தம், பரிகாரம், எதிர்கால வழிகாட்டலுக்கு சேமித்த ஜாதகத்தை பயன்படுத்துங்கள்.",
      ],
    },
  },
  "sevvai-dosham": {
    en: {
      eyebrow: "Match it with your chart",
      title: "Now see whether Sevvai dosham is active, reduced, or balanced in your own birth chart.",
      body: "Create a free Vinaadi account to save your birth details, generate your chart, and get a plain-language explanation that considers Lagna, Moon, Venus, dasha, cancellations, remedies, and marriage matching context.",
      primary: "Create account and check my chart",
      secondary: "Try the chart tool first",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "Generate your D1 chart from birth date, time, and place.",
        "See the Sevvai dosham strength and cancellation factors clearly.",
        "Use saved charts for porutham, remedies, and future guidance.",
      ],
    },
    ta: {
      eyebrow: "உங்கள் ஜாதகத்துடன் பொருத்திப் பாருங்கள்",
      title: "செவ்வாய் தோஷம் உங்கள் ஜாதகத்தில் செயல்படுகிறதா, குறைகிறதா, சமநிலையிலா என்பதை பாருங்கள்.",
      body: "உங்கள் பிறப்பு விவரங்களை சேமித்து, ஜாதகத்தை உருவாக்கி, லக்னம், சந்திரன், சுக்கிரன், தசை, தோஷ ரத்து, பரிகாரம், திருமணப் பொருத்தம் ஆகியவற்றுடன் எளிய விளக்கத்தை பெறுங்கள்.",
      primary: "கணக்கு உருவாக்கி ஜாதகம் பார்க்க",
      secondary: "முதலில் ஜாதக கருவியை முயற்சி செய்",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "பிறந்த தேதி, நேரம், இடம் வைத்து D1 ஜாதகம் உருவாக்குங்கள்.",
        "செவ்வாய் தோஷ வலிமையும் ரத்து காரணங்களும் தெளிவாக தெரியும்.",
        "சேமித்த ஜாதகத்தால் பொருத்தம், பரிகாரம், எதிர்கால வழிகாட்டல் பார்க்கலாம்.",
      ],
    },
  },
  yogam: {
    en: {
      eyebrow: "Find yogams in your chart",
      title: "See which yogams are formed, strong, or waiting for the right dasha.",
      body: "Vinaadi reads yogams through a Thirukanitham chart, including house ownership, dignity, aspects, dasha activation, and practical life areas such as wealth, career, learning, and marriage.",
      primary: "Create account and find your yogams",
      secondary: "Explore doshams",
      secondaryHref: "/dosham",
      steps: [
        "Build your Lagna-based Tamil jadhagam.",
        "Identify yogams with strength, activation, and limiting factors.",
        "Track how yogams connect with dasha, gochar, and daily guidance.",
      ],
    },
    ta: {
      eyebrow: "உங்கள் ஜாதகத்தில் யோகங்கள்",
      title: "எந்த யோகங்கள் உருவாகியுள்ளன, வலிமையாக உள்ளன, தசையில் செயல்படுகின்றன என்பதை பாருங்கள்.",
      body: "திருக்கணித ஜாதகத்தின் பாவாதிபதி, கிரக பலம், பார்வை, தசை செயல்பாடு, செல்வம், தொழில், கல்வி, திருமணம் போன்ற வாழ்க்கை பகுதிகளுடன் Vinaadi யோகத்தை விளக்குகிறது.",
      primary: "கணக்கு உருவாக்கி யோகம் பார்க்க",
      secondary: "தோஷங்களை அறிய",
      secondaryHref: "/dosham",
      steps: [
        "லக்னத்தை அடிப்படையாகக் கொண்ட தமிழ் ஜாதகம் உருவாக்குங்கள்.",
        "யோக வலிமை, செயல்பாடு, குறைக்கும் காரணங்களை அறியுங்கள்.",
        "யோகம் தசை, கோச்சாரம், தினசரி வழிகாட்டலுடன் எப்படி இணைகிறது பாருங்கள்.",
      ],
    },
  },
  pariharam: {
    en: {
      eyebrow: "Choose pariharam by chart",
      title: "Use remedies that match the planet, house, and timing in your own jadhagam.",
      body: "Pariharam is most useful when it is connected to the active graha, bhava, dasha, and family context. Save your chart to get guidance that stays within Tamil astrology tradition.",
      primary: "Create account for personal pariharam",
      secondary: "Generate a jadhagam first",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "Save your birth chart and current life context.",
        "Connect remedies to graha, house, dasha, and dosham signals.",
        "Keep temple, slokam, and daily practice guidance in one place.",
      ],
    },
    ta: {
      eyebrow: "ஜாதகப்படி பரிகாரம்",
      title: "உங்கள் ஜாதகத்தில் உள்ள கிரகம், பாவம், காலத்துக்கு பொருந்தும் பரிகாரத்தை தேர்வு செய்யுங்கள்.",
      body: "செயல்படும் கிரகம், பாவம், தசை, குடும்ப சூழல் ஆகியவற்றுடன் இணைந்தால் பரிகாரம் பயனுள்ளதாக இருக்கும். தமிழ் ஜோதிட மரபுக்குள் விளக்கம் பெற ஜாதகத்தை சேமியுங்கள்.",
      primary: "கணக்கு உருவாக்கி பரிகாரம் பார்க்க",
      secondary: "முதலில் ஜாதகம் உருவாக்கு",
      secondaryHref: "/tools/jadhagam-generator",
      steps: [
        "உங்கள் பிறப்பு ஜாதகத்தையும் வாழ்க்கை சூழலையும் சேமியுங்கள்.",
        "கிரகம், பாவம், தசை, தோஷ அறிகுறிகளுடன் பரிகாரத்தை இணைக்குங்கள்.",
        "கோயில், ஸ்லோகம், தினசரி வழிபாடு வழிகாட்டலை ஒரே இடத்தில் வைத்துக் கொள்ளுங்கள்.",
      ],
    },
  },
  "marriage-pariharam": {
    en: {
      eyebrow: "Match marriage remedies with your chart",
      title: "See whether delay comes from the 7th house, Venus, Jupiter, Sevvai, or the running dasha.",
      body: "Create a free account to read marriage-delay signals in your Thirukanitham chart and keep pariharam, porutham, temple guidance, and timing support together.",
      primary: "Create account and check marriage timing",
      secondary: "Check porutham",
      secondaryHref: "/tools/marriage-porutham-calculator",
      steps: [
        "Read 7th house, 7th lord, Venus, Jupiter, and relevant doshams.",
        "Understand whether the running dasha supports marriage timing.",
        "Save remedies and compare charts when a match is being considered.",
      ],
    },
    ta: {
      eyebrow: "திருமண பரிகாரம் ஜாதகப்படி",
      title: "தாமதம் 7-ஆம் பாவமா, சுக்கிரனா, குருவா, செவ்வாயா, நடக்கும் தசையா என்பதை பாருங்கள்.",
      body: "திருக்கணித ஜாதகத்தில் திருமணத் தடை அறிகுறிகளை படித்து, பரிகாரம், பொருத்தம், கோயில் வழிகாட்டல், கால ஆதரவு ஆகியவற்றை ஒரே இடத்தில் வைத்துக் கொள்ளுங்கள்.",
      primary: "கணக்கு உருவாக்கி திருமண காலம் பார்க்க",
      secondary: "பொருத்தம் பார்க்க",
      secondaryHref: "/tools/marriage-porutham-calculator",
      steps: [
        "7-ஆம் பாவம், அதன் அதிபதி, சுக்கிரன், குரு, தொடர்புடைய தோஷங்களை படியுங்கள்.",
        "நடக்கும் தசை திருமணத்துக்கு ஆதரவு தருகிறதா என்பதை அறியுங்கள்.",
        "பரிகாரத்தை சேமித்து, பொருத்தம் பார்க்கும் போது ஜாதகங்களை ஒப்பிடுங்கள்.",
      ],
    },
  },
  temple: {
    en: {
      eyebrow: "Connect temples to your chart",
      title: "Find which graha temples matter most for your current dasha and transit phase.",
      body: "Temple guidance is clearer when it follows the chart. Vinaadi connects Navagraha temples, dosham relief, dasha periods, and Tamil panchangam timing from your saved birth details.",
      primary: "Create account for temple guidance",
      secondary: "Explore pariharam",
      secondaryHref: "/pariharam",
      steps: [
        "Save your Thirukanitham chart and active graha periods.",
        "Match temple guidance with dasha, gochar, and dosham signals.",
        "Use panchangam timing for practical visit and worship planning.",
      ],
    },
    ta: {
      eyebrow: "கோயில் வழிகாட்டல் ஜாதகப்படி",
      title: "உங்கள் நடக்கும் தசை, கோச்சார காலத்துக்கு எந்த கிரகக் கோயில் முக்கியம் என்பதை அறியுங்கள்.",
      body: "கோயில் வழிகாட்டல் ஜாதகத்துடன் சேர்ந்தால் தெளிவாக இருக்கும். நவகிரக கோயில், தோஷ நிவாரணம், தசை, தமிழ் பஞ்சாங்க நேரம் ஆகியவற்றை Vinaadi இணைக்கிறது.",
      primary: "கணக்கு உருவாக்கி கோயில் வழிகாட்டல் பெற",
      secondary: "பரிகாரம் பார்க்க",
      secondaryHref: "/pariharam",
      steps: [
        "திருக்கணித ஜாதகத்தையும் நடக்கும் கிரக காலத்தையும் சேமியுங்கள்.",
        "கோயில் வழிகாட்டலை தசை, கோச்சாரம், தோஷ அறிகுறிகளுடன் இணைக்குங்கள்.",
        "பயணம், வழிபாடு திட்டமிட தமிழ் பஞ்சாங்க நேரத்தை பயன்படுத்துங்கள்.",
      ],
    },
  },
  thirunallar: {
    en: {
      eyebrow: "Read Sani through your chart",
      title: "Before planning Thirunallar worship, see how Saturn is acting in your own chart.",
      body: "Vinaadi reads Sani through Moon rasi, Lagna, Saturn dasha, Sani peyarchi, Ashtama Sani, and Ezharai Sani context so temple guidance stays personal and grounded.",
      primary: "Create account and read my Sani phase",
      secondary: "Explore Sani guidance",
      secondaryHref: "/learn/what-is-chandrashtama",
      steps: [
        "Check Saturn from Lagna, Moon, and current transit.",
        "Understand dasha, Sani peyarchi, and sensitive timing.",
        "Keep temple, slokam, and panchangam guidance together.",
      ],
    },
    ta: {
      eyebrow: "சனி பலன் ஜாதகப்படி",
      title: "திருநள்ளாறு வழிபாட்டை திட்டமிடும் முன், சனி உங்கள் ஜாதகத்தில் எப்படி செயல்படுகிறது பாருங்கள்.",
      body: "சந்திர ராசி, லக்னம், சனி தசை, சனி பெயர்ச்சி, அஷ்டம சனி, ஏழரை சனி ஆகிய சூழலுடன் Vinaadi சனி வழிகாட்டலை தனிப்பட்ட முறையில் தருகிறது.",
      primary: "கணக்கு உருவாக்கி சனி காலம் பார்க்க",
      secondary: "சனி வழிகாட்டல் அறிய",
      secondaryHref: "/learn/what-is-chandrashtama",
      steps: [
        "லக்னம், சந்திரன், தற்போதைய கோச்சாரம் மூலம் சனியை பாருங்கள்.",
        "தசை, சனி பெயர்ச்சி, கவன நேரம் ஆகியவற்றை புரிந்துகொள்ளுங்கள்.",
        "கோயில், ஸ்லோகம், பஞ்சாங்க வழிகாட்டலை ஒரே இடத்தில் வைத்துக் கொள்ளுங்கள்.",
      ],
    },
  },
};

export function ContextualSignupCta({ variant }: { variant: CtaVariant }) {
  const [lang] = useLang();
  const c = COPY[variant][lang === "ta" ? "ta" : "en"];

  return (
    <section className="cl-band cl-band--signup">
      <div className="cl-container">
        <div className="cl-context-cta">
          <div className="cl-context-cta__copy">
            <p className="cl-context-cta__eyebrow">{c.eyebrow}</p>
            <h2 className="cl-context-cta__title">{c.title}</h2>
            <p className="cl-context-cta__body">{c.body}</p>
            <div className="cl-context-cta__actions">
              <Link href="/login?mode=signup" className="cl-btn cl-btn--solid">
                {c.primary}
              </Link>
              <Link href={c.secondaryHref} className="cl-btn cl-btn--ghost">
                {c.secondary}
              </Link>
            </div>
          </div>
          <div className="cl-context-cta__details" aria-label={c.eyebrow}>
            {c.steps.map((step, index) => (
              <div className="cl-context-cta__step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
