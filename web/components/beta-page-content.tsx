"use client";

import Link from "next/link";
import { useLang } from "@/components/lang-toggle";
import { BETA, mt } from "@/lib/marketing-i18n";

export function BetaPageContent() {
  const [lang] = useLang();

  const sections = [
    { h: BETA.page_free_h, b: BETA.page_free_b },
    { h: BETA.page_feedback_h, b: BETA.page_feedback_b },
    { h: BETA.page_data_h, b: BETA.page_data_b },
  ];

  return (
    <main>
      <section className="cl-trust-hero">
        <div className="cl-container">
          <p className="cl-eyebrow">{mt(BETA.page_eyebrow, lang)}</p>
          <h1 className="cl-trust-h1">{mt(BETA.page_title, lang)}</h1>
          <p className="cl-trust-sub">{mt(BETA.page_sub, lang)}</p>
        </div>
      </section>

      <section className="cl-trust-body">
        <div className="cl-container cl-trust-prose">
          {sections.map((sec, i) => (
            <div key={i}>
              <h2>{mt(sec.h, lang)}</h2>
              <p>{mt(sec.b, lang)}</p>
            </div>
          ))}

          <h2>{mt(BETA.page_coming_h, lang)}</h2>
          <ul>
            <li>{mt(BETA.page_coming_1, lang)}</li>
            <li>{mt(BETA.page_coming_2, lang)}</li>
            <li>{mt(BETA.page_coming_3, lang)}</li>
          </ul>

          <h2>{mt(BETA.page_cta_h, lang)}</h2>
          <p>{mt(BETA.page_cta_b, lang)}</p>

          <div className="cl-trust-links">
            <Link href="/dashboard" className="cl-trust-link">{mt(BETA.page_cta_btn, lang)}</Link>
            <Link href="/privacy" className="cl-trust-link">{mt({ en: "Privacy Policy →", ta: "தனியுரிமைக் கொள்கை →" }, lang)}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
