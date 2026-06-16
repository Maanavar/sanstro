"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/components/lang-toggle";
import { FOOTER, mt } from "@/lib/marketing-i18n";

export function PublicFooter() {
  const [lang] = useLang();
  const featureLinks = [
    { href: "/features/daily-guidance", label: mt(FOOTER.feat_daily, lang) },
    { href: "/features/family-planning", label: mt(FOOTER.feat_family, lang) },
    { href: "/features/chart-guidance", label: mt(FOOTER.feat_chart, lang) },
    { href: "/features/timing-and-decisions", label: mt(FOOTER.feat_timing, lang) },
  ];
  const toolLinks = [
    { href: "/tools/marriage-porutham-calculator", label: mt(FOOTER.tool_porutham, lang) },
    { href: "/tools/jadhagam-generator", label: mt(FOOTER.tool_jad, lang) },
    { href: "/tools/daily-panchangam-planner", label: mt(FOOTER.tool_panch, lang) },
    { href: "/tools/birth-time-rectification", label: mt(FOOTER.tool_btr, lang) },
    { href: "/tools/indraiya-rasipalan", label: mt(FOOTER.tool_rasipalan, lang) },
  ];
  const learnLinks = [
    { href: "/learn/what-is-porutham", label: mt(FOOTER.learn_porutham, lang) },
    { href: "/learn/what-is-thirukanitham", label: mt(FOOTER.learn_thiruk, lang) },
    { href: "/learn/what-is-chandrashtama", label: mt(FOOTER.learn_chandra, lang) },
    { href: "/learn/how-to-read-a-jadhagam", label: mt(FOOTER.learn_jad, lang) },
    { href: "/learn/why-birth-time-matters", label: mt(FOOTER.learn_birth, lang) },
  ];
  const guideLinks = [
    { href: "/dosham", label: mt(FOOTER.guide_dosham, lang) },
    { href: "/yogam", label: mt(FOOTER.guide_yogam, lang) },
    { href: "/pariharam", label: mt(FOOTER.guide_pariharam, lang) },
    { href: "/temples", label: mt(FOOTER.guide_temples, lang) },
  ];
  const companyLinks = [
    { href: "/trust/about-vinaadi", label: mt(FOOTER.about, lang) },
    { href: "/trust/methodology", label: mt(FOOTER.methodology, lang) },
    { href: "/privacy", label: mt(FOOTER.privacy, lang) },
    { href: "/terms", label: mt(FOOTER.terms, lang) },
  ];
  const linkGroups = [
    { heading: mt(FOOTER.col_features, lang), links: featureLinks },
    { heading: mt(FOOTER.col_tools, lang), links: toolLinks },
    { heading: mt(FOOTER.col_learn, lang), links: learnLinks },
    { heading: mt(FOOTER.col_guide, lang), links: guideLinks },
  ];

  return (
    <footer className="cl-footer" lang={lang}>
      <div className="cl-container cl-footer__inner">
        <div className="cl-footer__brand">
          <div className="cl-footer__brand-lockup">
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt=""
              aria-hidden
              width={512}
              height={512}
              className="cl-footer__symbol"
            />
            <div className="cl-footer__brand-copy">
              <span className="cl-footer__wordmark">Vinaadi</span>
              <p className="cl-footer__tagline">{mt(FOOTER.tagline, lang)}</p>
            </div>
          </div>

          <div className="cl-footer__company">
            <p className="cl-footer__col-head">{mt(FOOTER.col_company, lang)}</p>
            <div className="cl-footer__company-links">
              {companyLinks.map((link) => (
                <Link key={link.href} href={link.href} className="cl-footer__link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="cl-footer__links">
          {linkGroups.map((group) => (
            <nav
              key={group.heading}
              className="cl-footer__col"
              aria-label={group.heading}
            >
              <p className="cl-footer__col-head">{group.heading}</p>
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="cl-footer__link">
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="cl-footer__bottom">
        <div className="cl-container cl-footer__bottom-inner">
          <div className="cl-footer__legal">
            <Link href="/beta" className="cl-footer__beta">
              {mt(FOOTER.beta_line, lang)}
            </Link>
            <p className="cl-footer__disclaimer">{mt(FOOTER.disclaimer, lang)}</p>
          </div>
          <p className="cl-footer__copy">
            {mt(FOOTER.copyright, lang).replace("{year}", String(new Date().getFullYear()))}
          </p>
        </div>
      </div>
    </footer>
  );
}
