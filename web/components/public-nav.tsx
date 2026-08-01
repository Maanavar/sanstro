"use client";

import { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { LangToggle, useLang } from "@/components/lang-toggle";
import { SiteSearch } from "@/components/site-search";
import { NAV, mt } from "@/lib/marketing-i18n";
import { LATEST_MUHURTHAM_NAAL_YEAR } from "@/lib/muhurtham-naal";
import "./public-nav.css";

// MKT-06 — a plain disclosure (not a `role="menu"`), so aria-expanded reflects
// the real open state and it works by keyboard (Tab/Enter/Escape) and on touch,
// not only CSS :hover. Opens on hover, focus, or click; closes on Escape, blur
// out of the group, or a second click.
function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="cl-nav-dropdown"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <button
        type="button"
        className="cl-nav__link cl-nav-dropdown__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="cl-nav-dropdown__chevron">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="cl-nav-dropdown__menu" id={menuId} data-open={open}>
        <div className="cl-nav-dropdown__menu-inner">{children}</div>
      </div>
    </div>
  );
}

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang] = useLang();
  const calendarYear = new Date().getFullYear();

  function closeMobileMenu() { setMobileOpen(false); }

  const FEATURES = [
    { href: "/features/daily-guidance",       label: mt(NAV.feat_daily,          lang) },
    { href: "/features/family-planning",      label: mt(NAV.feat_family,         lang) },
    { href: "/family",                         label: mt(NAV.feat_family_vault,   lang), desc: mt(NAV.feat_family_vault_desc, lang) },
    { href: "/features/chart-guidance",       label: mt(NAV.feat_chart,          lang) },
    { href: "/features/timing-and-decisions", label: mt(NAV.feat_timing,         lang) },
  ];

  const TOOLS = [
    { href: "/tools/marriage-porutham-calculator", label: mt(NAV.tool_porutham, lang), desc: mt(NAV.tool_porutham_desc, lang) },
    { href: "/tools/jadhagam-generator",           label: mt(NAV.tool_jad,      lang), desc: mt(NAV.tool_jad_desc,      lang) },
    { href: "/tools/daily-panchangam-planner",     label: mt(NAV.tool_panch,    lang), desc: mt(NAV.tool_panch_desc,    lang) },
    { href: "/muhurtham-naal",                     label: `${lang === "en" ? "Muhurtham Naal" : "முகூர்த்த நாள்"} ${LATEST_MUHURTHAM_NAAL_YEAR}`, desc: lang === "en" ? "Verified Tamil wedding dates" : "சரிபார்த்த திருமண நாட்கள்" },
    { href: "/tamil-calendar",                     label: `${lang === "en" ? "Tamil Calendar" : "தமிழ் நாட்காட்டி"} ${calendarYear}`, desc: lang === "en" ? "Pournami, Amavasai, Pradosham dates" : "பௌர்ணமி, அமாவாசை, பிரதோஷ நாட்கள்" },
    { href: "/tools/birth-time-rectification",     label: mt(NAV.tool_btr,      lang), desc: mt(NAV.tool_btr_desc,      lang) },
    { href: "/tools/indraiya-rasipalan",           label: mt(NAV.tool_rasipalan, lang), desc: mt(NAV.tool_rasipalan_desc, lang) },
    { href: "/tools/numerology-calculator",        label: mt(NAV.tool_numerology, lang), desc: mt(NAV.tool_numerology_desc, lang) },
    { href: "/tools/baby-name-finder",             label: mt(NAV.tool_baby_names, lang), desc: mt(NAV.tool_baby_names_desc, lang) },
  ];

  const GUIDE = [
    { href: "/dosham",    label: mt(NAV.guide_dosham,    lang), desc: mt(NAV.guide_dosham_desc,    lang) },
    { href: "/yogam",     label: mt(NAV.guide_yogam,     lang), desc: mt(NAV.guide_yogam_desc,     lang) },
    { href: "/pariharam", label: mt(NAV.guide_pariharam, lang), desc: mt(NAV.guide_pariharam_desc, lang) },
    { href: "/temples",   label: mt(NAV.guide_temples,   lang), desc: mt(NAV.guide_temples_desc,   lang) },
  ];

  return (
    <header className="cl-nav">
        <div className="cl-nav__inner">
          <Link href="/" className="cl-nav__brand" aria-label={mt(NAV.home, lang)}>
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt="" aria-hidden
              width={28} height={28}
              className="cl-nav__symbol" priority
            />
            <div className="cl-nav__brand-text">
              <span className="cl-nav__wordmark">Vinaadi</span>
              <span className="cl-nav__tagline">
                {lang === "en" ? "Thirukanitham-precise astrology" : "திருக்கணித ஜோதிடம்"}
              </span>
            </div>
          </Link>

          <nav className="cl-nav__links" aria-label={lang === "en" ? "Primary navigation" : "முதன்மை வழிசெலுத்தல்"}>
            <Dropdown label={mt(NAV.features, lang)}>
              {FEATURES.map((f) => (
                <Link key={f.href} href={f.href} className="cl-nav-dropdown__item">
                  <span className="cl-nav-dropdown__item-label">{f.label}</span>
                </Link>
              ))}
            </Dropdown>

            <Dropdown label={mt(NAV.tools, lang)}>
              {TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="cl-nav-dropdown__item">
                  <span className="cl-nav-dropdown__item-label">{t.label}</span>
                  <span className="cl-nav-dropdown__item-desc">{t.desc}</span>
                </Link>
              ))}
            </Dropdown>

            <Dropdown label={mt(NAV.guide, lang)}>
              {GUIDE.map((g) => (
                <Link key={g.href} href={g.href} className="cl-nav-dropdown__item">
                  <span className="cl-nav-dropdown__item-label">{g.label}</span>
                  <span className="cl-nav-dropdown__item-desc">{g.desc}</span>
                </Link>
              ))}
            </Dropdown>

            <Link href="/natchathiram" className="cl-nav__link">{lang === "en" ? "Natchathirams" : "நட்சத்திரங்கள்"}</Link>
            <Link href="/pricing" className="cl-nav__link">{lang === "en" ? "Pricing" : "விலை"}</Link>
            <Link href="/learn/what-is-thirukanitham" className="cl-nav__link">{mt(NAV.learn, lang)}</Link>
            <Link href="/trust/methodology" className="cl-nav__link">{mt(NAV.method, lang)}</Link>

            <LangToggle />

            <Link href="/login" className="cl-nav__signin" onClick={closeMobileMenu}>
              {mt(NAV.sign_in, lang)}
            </Link>
          </nav>

          <div className="cl-nav__actions">
            <SiteSearch />
            <button
              type="button"
              className="cl-nav__menu-btn"
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-nav"
              aria-label={mobileOpen ? mt(NAV.close_menu, lang) : mt(NAV.open_menu, lang)}
              onClick={() => setMobileOpen((o) => !o)}
            >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              {mobileOpen ? (
                <>
                  <path d="M4 4l10 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M14 4L4 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M3 5.25h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M3 9h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M3 12.75h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </>
              )}
            </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="cl-nav__mobile" id="public-mobile-nav">
            <div className="cl-nav__mobile-inner">
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{mt(NAV.features, lang)}</p>
                {FEATURES.map((f) => (
                  <Link key={f.href} href={f.href} className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                    <span>{f.label}</span>
                    <span>{lang === "en" ? "Feature" : "அம்சம்"}</span>
                  </Link>
                ))}
              </div>
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{mt(NAV.tools, lang)}</p>
                {TOOLS.map((t) => (
                  <Link key={t.href} href={t.href} className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                    <span>{t.label}</span>
                    <span>{t.desc}</span>
                  </Link>
                ))}
              </div>
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{mt(NAV.guide, lang)}</p>
                {GUIDE.map((g) => (
                  <Link key={g.href} href={g.href} className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                    <span>{g.label}</span>
                    <span>{g.desc}</span>
                  </Link>
                ))}
              </div>
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{lang === "en" ? "Natchathirams" : "நட்சத்திரங்கள்"}</p>
                <Link href="/natchathiram" className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                  <span>{lang === "en" ? "27 Natchathirams" : "27 நட்சத்திரங்கள்"}</span>
                  <span>{lang === "en" ? "Nakshathiram guide" : "குண நலன்கள் & பலன்கள்"}</span>
                </Link>
              </div>
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{lang === "en" ? "Pricing" : "விலை"}</p>
                <Link href="/pricing" className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                  <span>{lang === "en" ? "Guest, free, and premium" : "விருந்தினர், இலவசம், பிரீமியம்"}</span>
                  <span>{lang === "en" ? "Plans and access" : "திட்டங்கள் மற்றும் அணுகல்"}</span>
                </Link>
              </div>
              <div className="cl-nav__mobile-group">
                <p className="cl-nav__mobile-label">{mt(NAV.learn, lang)}</p>
                <Link href="/learn/what-is-thirukanitham" className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                  <span>{mt(NAV.learn, lang)}</span>
                  <span>{lang === "en" ? "Concepts and guides" : "கருத்துகளும் வழிகாட்டிகளும்"}</span>
                </Link>
                <Link href="/trust/methodology" className="cl-nav__mobile-link" onClick={closeMobileMenu}>
                  <span>{mt(NAV.method, lang)}</span>
                  <span>{lang === "en" ? "How Vinaadi works" : "விநாடி எப்படி வேலை செய்கிறது"}</span>
                </Link>
              </div>
              <div className="cl-nav__mobile-group">
                <LangToggle />
              </div>
            </div>
          </div>
        )}
    </header>
  );
}
