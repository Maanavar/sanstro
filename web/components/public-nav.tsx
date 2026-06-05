"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LangToggle, useLang } from "@/components/lang-toggle";
import { NAV, mt } from "@/lib/marketing-i18n";

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cl-nav-dropdown">
      <button type="button" className="cl-nav__link cl-nav-dropdown__trigger" aria-haspopup="true">
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="cl-nav-dropdown__chevron">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="cl-nav-dropdown__menu" role="menu">
        <div className="cl-nav-dropdown__menu-inner">{children}</div>
      </div>
    </div>
  );
}

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang] = useLang();

  function closeMobileMenu() { setMobileOpen(false); }

  const FEATURES = [
    { href: "/features/daily-guidance",     label: mt(NAV.feat_daily,   lang) },
    { href: "/features/family-planning",    label: mt(NAV.feat_family,  lang) },
    { href: "/features/chart-guidance",     label: mt(NAV.feat_chart,   lang) },
    { href: "/features/timing-and-decisions", label: mt(NAV.feat_timing, lang) },
  ];

  const TOOLS = [
    { href: "/tools/marriage-porutham-calculator", label: mt(NAV.tool_porutham, lang), desc: mt(NAV.tool_porutham_desc, lang) },
    { href: "/tools/jadhagam-generator",           label: mt(NAV.tool_jad,      lang), desc: mt(NAV.tool_jad_desc,      lang) },
    { href: "/tools/daily-panchangam-planner",     label: mt(NAV.tool_panch,    lang), desc: mt(NAV.tool_panch_desc,    lang) },
    { href: "/tools/birth-time-rectification",     label: mt(NAV.tool_btr,      lang), desc: mt(NAV.tool_btr_desc,      lang) },
  ];

  return (
    <>
      <style>{`
        .cl-nav-dropdown { position: relative; }
        .cl-nav-dropdown__trigger {
          background: none; border: none; cursor: pointer;
          font-family: inherit;
          display: inline-flex; align-items: center; gap: 5px; padding: 0;
        }
        .cl-nav-dropdown__chevron { transition: transform 150ms ease; opacity: 0.6; }
        .cl-nav-dropdown__menu {
          position: absolute; top: 100%; left: 50%;
          transform: translateX(-50%); padding-top: 12px;
          min-width: 240px; z-index: 200;
          opacity: 0; pointer-events: none; visibility: hidden;
          transition: opacity 120ms ease, visibility 120ms ease;
        }
        .cl-nav-dropdown__menu-inner {
          background: var(--cl-surface); border: 1px solid var(--cl-border);
          border-radius: 14px; box-shadow: 0 8px 32px var(--cl-shadow);
          padding: 8px; display: flex; flex-direction: column; gap: 2px;
        }
        .cl-nav-dropdown:hover .cl-nav-dropdown__menu,
        .cl-nav-dropdown:focus-within .cl-nav-dropdown__menu {
          opacity: 1; pointer-events: auto; visibility: visible;
        }
        .cl-nav-dropdown:hover .cl-nav-dropdown__chevron { transform: rotate(180deg); }
        .cl-nav-dropdown__item {
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 12px; border-radius: 10px;
          text-decoration: none; transition: background 120ms ease;
        }
        .cl-nav-dropdown__item:hover { background: var(--cl-bg-2); }
        .cl-nav-dropdown__item-label { font-size: 0.88rem; font-weight: 600; color: var(--cl-ink); line-height: 1.2; }
        .cl-nav-dropdown__item-desc  { font-size: 0.75rem; color: var(--cl-muted); line-height: 1.3; }
        .cl-nav__menu-btn {
          display: none; min-width: 44px; min-height: 44px;
          border-radius: 999px; border: 1.5px solid var(--cl-border);
          background: var(--cl-surface); color: var(--cl-ink);
          cursor: pointer; align-items: center; justify-content: center;
        }
        .cl-nav__mobile { display: none; }
        @media (max-width: 720px) {
          .cl-nav__menu-btn { display: inline-flex; }
          .cl-nav-dropdown__menu { left: auto; right: 0; transform: none; }
          .cl-nav__mobile {
            display: block; border-top: 1px solid var(--cl-border);
            background: rgba(244, 238, 226, 0.98);
          }
          .cl-nav__mobile-inner {
            width: min(1200px, calc(100% - 40px)); margin: 0 auto;
            padding: 16px 0 18px; display: grid; gap: 14px;
          }
          .cl-nav__mobile-group { display: grid; gap: 8px; }
          .cl-nav__mobile-label {
            margin: 0; font-size: 0.68rem; font-weight: 700;
            letter-spacing: 0.14em; text-transform: uppercase; color: var(--cl-muted);
          }
          .cl-nav__mobile-link {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding: 12px 14px; border-radius: 12px;
            background: var(--cl-surface); border: 1px solid var(--cl-border);
            color: var(--cl-ink); font-size: 0.9rem; font-weight: 500; text-decoration: none;
          }
          .cl-nav__mobile-link span:last-child { color: var(--cl-muted); font-size: 0.78rem; font-weight: 400; }
        }
      `}</style>

      <header className="cl-nav">
        <div className="cl-nav__inner">
          <Link href="/" className="cl-nav__brand" aria-label={mt(NAV.home, lang)}>
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt="" aria-hidden
              width={512} height={512}
              className="cl-nav__symbol" priority
            />
            <span className="cl-nav__wordmark">Vinaadi</span>
          </Link>

          <nav className="cl-nav__links" aria-label={lang === "en" ? "Primary navigation" : "முதன்மை வழிசெலுத்தல்"}>
            <Dropdown label={mt(NAV.features, lang)}>
              {FEATURES.map((f) => (
                <Link key={f.href} href={f.href} className="cl-nav-dropdown__item" role="menuitem">
                  <span className="cl-nav-dropdown__item-label">{f.label}</span>
                </Link>
              ))}
            </Dropdown>

            <Dropdown label={mt(NAV.tools, lang)}>
              {TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="cl-nav-dropdown__item" role="menuitem">
                  <span className="cl-nav-dropdown__item-label">{t.label}</span>
                  <span className="cl-nav-dropdown__item-desc">{t.desc}</span>
                </Link>
              ))}
            </Dropdown>

            <Link href="/learn/what-is-thirukanitham" className="cl-nav__link">{mt(NAV.learn, lang)}</Link>
            <Link href="/trust/methodology" className="cl-nav__link">{mt(NAV.method, lang)}</Link>

            <LangToggle />

            <Link href="/login" className="cl-nav__signin" onClick={closeMobileMenu}>
              {mt(NAV.sign_in, lang)}
            </Link>
          </nav>

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
    </>
  );
}
