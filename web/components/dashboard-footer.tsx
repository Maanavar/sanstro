"use client";

import { LocalizedLink as Link } from "@/components/localized-link";
import { dashboardPath, type Tab } from "@/lib/dashboard-tabs";
import type { Lang } from "@/lib/i18n";

import { DashboardFooterMorningGuidance } from "./dashboard-footer-morning-nova";

type DashboardFooterProps = {
  lang: Lang;
  onTabChange?: (tab: Tab) => void;
  onOpenNotificationSettings?: () => void;
};

type FooterLink =
  | { en: string; ta: string; tab: Tab; href?: undefined }
  | { en: string; ta: string; href: string; tab?: undefined };

const COLUMNS: Array<{
  head: { en: string; ta: string };
  links: FooterLink[];
}> = [
  {
    head: { en: "Understand", ta: "ஆராயுங்கள்" },
    links: [
      { tab: "personal", ta: "இன்று", en: "Today" },
      { tab: "calendar", ta: "நாட்காட்டி", en: "Calendar" },
      { tab: "life-areas", ta: "வாழ்க்கைத் துறைகள்", en: "Life Areas" },
      { href: "/dashboard/glossary", ta: "சொற்களஞ்சியம்", en: "Glossary" },
    ],
  },
  {
    head: { en: "Personal", ta: "தனிப்பட்ட" },
    links: [
      { tab: "family", ta: "குடும்பம் & ஜாதகம்", en: "Family & Charts" },
      { tab: "journal", ta: "குறிப்பேடு", en: "Journal" },
      { tab: "settings", ta: "அமைப்புகள்", en: "Settings" },
    ],
  },
];

export function DashboardFooter({
  lang,
  onTabChange,
  onOpenNotificationSettings,
}: DashboardFooterProps) {
  return (
    <footer className="cd-footer">
      <div className="cd-footer__inner">
        <p className="nova-footer__legal">
          {lang === "ta"
            ? "ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை அமைப்பு — அறிவியல் உண்மை அல்ல. மருத்துவ, சட்ட, நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகுங்கள்."
            : "Astrology is a traditional belief system, not a scientific fact. For medical, legal, or financial decisions, consult a qualified professional."}
        </p>

        <div className="cd-footer__divider" />

        <div className="nova-footer__grid">
          <div className="nova-footer__brand">
            <p className="cd-footer__wordmark">Vinaadi</p>
            <p className="nova-footer__tagline">
              {lang === "ta"
                ? "ஜோதிட வழிகாட்டல் — தினமும் சூரிய உதயத்திற்கு முன்."
                : "Jothidam guidance, every morning before sunrise."}
            </p>
          </div>

          <nav
            className="nova-footer__nav"
            aria-label={lang === "ta" ? "அடிக்குறிப்பு வழிசெலுத்தல்" : "Footer navigation"}
          >
            {COLUMNS.map((column) => (
              <div key={column.head.en} className="nova-footer__nav-col">
                <h2 className="nova-footer__nav-head">
                  {lang === "ta" ? column.head.ta : column.head.en}
                </h2>
                <div className="nova-footer__nav-links">
                  {column.links.map((link) => {
                    const label = lang === "ta" ? link.ta : link.en;
                    if (link.href !== undefined) {
                      return (
                        <Link key={link.href} href={link.href} className="nova-footer__nav-link">
                          {label}
                        </Link>
                      );
                    }
                    if (onTabChange) {
                      return (
                        <button
                          key={link.tab}
                          type="button"
                          className="nova-footer__nav-link"
                          onClick={() => onTabChange(link.tab)}
                        >
                          {label}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={link.tab}
                        href={dashboardPath(link.tab)}
                        className="nova-footer__nav-link"
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="nova-footer__quick">
            <h2 className="nova-footer__nav-head">
              {lang === "ta" ? "விரைவு அமைப்பு" : "Quick setting"}
            </h2>
            <DashboardFooterMorningGuidance
              lang={lang}
              onOpenSettings={onOpenNotificationSettings}
            />
          </div>
        </div>

        <div className="cd-footer__divider" />

        <div className="cd-footer__bottom">
          <p className="cd-footer__copy">© {new Date().getFullYear()} Vinaadi</p>
        </div>
      </div>
    </footer>
  );
}
