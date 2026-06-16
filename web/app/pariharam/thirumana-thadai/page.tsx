import type { Metadata } from "next";
import { PARIHARAM_MARRIAGE_FAQ } from "@/lib/marketing-i18n";
import { ThirumanaThadaiContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Pariharam for Delayed Marriage (Thirumana Thadai) — Reasons, Remedies & Slokam | Vinaadi",
  description:
    "Why marriage gets delayed in astrology — the 7th house, Venus, Jupiter, Sevvai dosham and Rahu-Ketu — and the step-by-step pariharam: Katyayani slokam, fasts, and temple worship at Thirumananjeri.",
  keywords: [
    "thirumana thadai pariharam",
    "delayed marriage remedy",
    "marriage delay astrology",
    "pariharam for marriage",
    "katyayani mantra marriage",
    "thirumananjeri temple",
    "7th house marriage delay",
    "திருமணத் தடை பரிகாரம்",
    "திருமண தாமதம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/thirumana-thadai" },
  openGraph: {
    title: "Pariharam for Delayed Marriage (Thirumana Thadai) — Reasons, Remedies & Slokam",
    description:
      "The astrological reasons for marriage delay and the traditional step-by-step pariharam with the Katyayani slokam.",
    url: "https://vinaadi.com/pariharam/thirumana-thadai",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pariharam for Delayed Marriage — Reasons & Remedies",
    description: "Why marriage gets delayed, and the devotional pariharam handed down for it.",
  },
};

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Pariharam for delayed marriage (Thirumana thadai)",
  description:
    "Traditional devotional remedy practised for a timely, harmonious marriage when the chart shows delay.",
  step: [
    { "@type": "HowToStep", name: "Worship Goddess Katyayani / Swayamvara Parvati", text: "Pray to the form of the Goddess who blesses a good marriage, lighting a ghee lamp before Her image each Friday." },
    { "@type": "HowToStep", name: "Chant the marriage slokam 108 times", text: "Recite the Katyayani mantra 108 times daily with a steady mind, ideally before a lit lamp." },
    { "@type": "HowToStep", name: "Worship at Lord Shiva–Parvati temples", text: "Visit temples where the Lord and Goddess are worshipped together; Thirumananjeri near Mayiladuthurai is the traditional marriage-blessing temple." },
    { "@type": "HowToStep", name: "Strengthen Venus & Jupiter", text: "Donate white items on Fridays (Venus) and turmeric/yellow items on Thursdays (Jupiter), and keep those days disciplined." },
  ],
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_MARRIAGE_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function ThirumanaThadaiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <ThirumanaThadaiContent />
    </>
  );
}
