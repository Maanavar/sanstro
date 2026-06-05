"use client";

import Link from "next/link";
import { useLang } from "@/components/lang-toggle";
import { FOOTER, mt } from "@/lib/marketing-i18n";

export function PublicFooter() {
  const [lang] = useLang();

  return (
    <footer className="cl-footer">
      <div className="cl-container cl-footer__inner">
        <div className="cl-footer__brand">
          <span className="cl-footer__wordmark">Vinaadi</span>
          <p className="cl-footer__tagline">{mt(FOOTER.tagline, lang)}</p>
        </div>
        <div className="cl-footer__links">
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">{mt(FOOTER.col_features, lang)}</p>
            <Link href="/features/daily-guidance"        className="cl-footer__link">{mt(FOOTER.feat_daily,  lang)}</Link>
            <Link href="/features/family-planning"       className="cl-footer__link">{mt(FOOTER.feat_family, lang)}</Link>
            <Link href="/features/chart-guidance"        className="cl-footer__link">{mt(FOOTER.feat_chart,  lang)}</Link>
            <Link href="/features/timing-and-decisions"  className="cl-footer__link">{mt(FOOTER.feat_timing, lang)}</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">{mt(FOOTER.col_tools, lang)}</p>
            <Link href="/tools/marriage-porutham-calculator" className="cl-footer__link">{mt(FOOTER.tool_porutham, lang)}</Link>
            <Link href="/tools/jadhagam-generator"           className="cl-footer__link">{mt(FOOTER.tool_jad,      lang)}</Link>
            <Link href="/tools/daily-panchangam-planner"     className="cl-footer__link">{mt(FOOTER.tool_panch,    lang)}</Link>
            <Link href="/tools/birth-time-rectification"     className="cl-footer__link">{mt(FOOTER.tool_btr,      lang)}</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">{mt(FOOTER.col_learn, lang)}</p>
            <Link href="/learn/what-is-porutham"       className="cl-footer__link">{mt(FOOTER.learn_porutham, lang)}</Link>
            <Link href="/learn/what-is-thirukanitham"  className="cl-footer__link">{mt(FOOTER.learn_thiruk,   lang)}</Link>
            <Link href="/learn/what-is-chandrashtama"  className="cl-footer__link">{mt(FOOTER.learn_chandra,  lang)}</Link>
            <Link href="/learn/how-to-read-a-jadhagam" className="cl-footer__link">{mt(FOOTER.learn_jad,      lang)}</Link>
            <Link href="/learn/why-birth-time-matters" className="cl-footer__link">{mt(FOOTER.learn_birth,    lang)}</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">{mt(FOOTER.col_company, lang)}</p>
            <Link href="/trust/about-vinaadi" className="cl-footer__link">{mt(FOOTER.about,       lang)}</Link>
            <Link href="/trust/methodology"   className="cl-footer__link">{mt(FOOTER.methodology,  lang)}</Link>
            <Link href="/privacy"             className="cl-footer__link">{mt(FOOTER.privacy,      lang)}</Link>
            <Link href="/terms"               className="cl-footer__link">{mt(FOOTER.terms,        lang)}</Link>
          </div>
        </div>
      </div>
      <div className="cl-footer__bottom">
        <div className="cl-container cl-footer__bottom-inner">
          <p className="cl-footer__disclaimer">{mt(FOOTER.disclaimer, lang)}</p>
          <p className="cl-footer__copy">
            {mt(FOOTER.copyright, lang).replace("{year}", String(new Date().getFullYear()))}
          </p>
        </div>
      </div>
    </footer>
  );
}
