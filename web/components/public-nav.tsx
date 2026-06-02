"use client";

import Link from "next/link";
import Image from "next/image";

const TOOLS = [
  { href: "/tools/marriage-porutham-calculator", label: "Porutham Calculator", desc: "Marriage compatibility" },
  { href: "/tools/jadhagam-generator", label: "Jadhagam Generator", desc: "Tamil birth chart" },
  { href: "/tools/daily-panchangam-planner", label: "Panchangam Planner", desc: "Daily Tamil almanac" },
  { href: "/tools/birth-time-rectification", label: "Birth Time Rectification", desc: "Refine uncertain birth time" },
];

const FEATURES = [
  { href: "/features/daily-guidance", label: "Daily Guidance" },
  { href: "/features/family-planning", label: "Family Planning" },
  { href: "/features/chart-guidance", label: "Chart Guidance" },
  { href: "/features/timing-and-decisions", label: "Timing & Decisions" },
];

function Dropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cl-nav-dropdown">
      <button type="button" className="cl-nav__link cl-nav-dropdown__trigger" aria-haspopup="true">
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="cl-nav-dropdown__chevron">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="cl-nav-dropdown__menu" role="menu">
        <div className="cl-nav-dropdown__menu-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PublicNav() {
  return (
    <>
      <style>{`
        .cl-nav-dropdown {
          position: relative;
        }
        .cl-nav-dropdown__trigger {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0;
        }
        .cl-nav-dropdown__chevron {
          transition: transform 150ms ease;
          opacity: 0.6;
        }

        /* Menu is always in the DOM — hidden by default, shown on hover of the wrapper */
        .cl-nav-dropdown__menu {
          position: absolute;
          top: 100%;          /* flush against the trigger — no gap */
          left: 50%;
          transform: translateX(-50%);
          /* Invisible padding-top bridges the gap so mouse can travel to menu */
          padding-top: 12px;
          min-width: 240px;
          z-index: 200;
          /* Hidden by default */
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
          transition: opacity 120ms ease, visibility 120ms ease;
        }
        .cl-nav-dropdown__menu-inner {
          background: var(--cl-surface);
          border: 1px solid var(--cl-border);
          border-radius: 14px;
          box-shadow: 0 8px 32px var(--cl-shadow);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Show on hover of the outer wrapper */
        .cl-nav-dropdown:hover .cl-nav-dropdown__menu,
        .cl-nav-dropdown:focus-within .cl-nav-dropdown__menu {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        }
        .cl-nav-dropdown:hover .cl-nav-dropdown__chevron {
          transform: rotate(180deg);
        }

        .cl-nav-dropdown__item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 120ms ease;
        }
        .cl-nav-dropdown__item:hover {
          background: var(--cl-bg-2);
        }
        .cl-nav-dropdown__item-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--cl-ink);
          line-height: 1.2;
        }
        .cl-nav-dropdown__item-desc {
          font-size: 0.75rem;
          color: var(--cl-muted);
          line-height: 1.3;
        }
        @media (max-width: 720px) {
          .cl-nav-dropdown__menu {
            left: auto;
            right: 0;
            transform: none;
          }
        }
      `}</style>

      <header className="cl-nav">
        <div className="cl-nav__inner">
          <Link href="/" className="cl-nav__brand" aria-label="Vinaadi home">
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt=""
              aria-hidden
              width={512}
              height={512}
              className="cl-nav__symbol"
              priority
            />
            <span className="cl-nav__wordmark">Vinaadi</span>
          </Link>

          <nav className="cl-nav__links" aria-label="Primary navigation">

            {/* Features dropdown */}
            <Dropdown label="Features">
              {FEATURES.map((f) => (
                <Link key={f.href} href={f.href} className="cl-nav-dropdown__item" role="menuitem">
                  <span className="cl-nav-dropdown__item-label">{f.label}</span>
                </Link>
              ))}
            </Dropdown>

            {/* Tools dropdown */}
            <Dropdown label="Tools">
              {TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="cl-nav-dropdown__item" role="menuitem">
                  <span className="cl-nav-dropdown__item-label">{t.label}</span>
                  <span className="cl-nav-dropdown__item-desc">{t.desc}</span>
                </Link>
              ))}
            </Dropdown>

            <Link href="/learn/what-is-thirukanitham" className="cl-nav__link">Learn</Link>
            <Link href="/trust/methodology" className="cl-nav__link">Method</Link>
            <Link href="/login" className="cl-nav__signin">Sign in</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
