"use client";

/**
 * The marketing hero's right-hand panel: today's almanac, live, for a visitor
 * with no account.
 *
 * WHAT THIS REPLACED, AND WHY
 *
 * The hero card was a mock. `makeSample()` hardcoded `score: 64`,
 * `bestWindow: 11:53–12:41`, `holdWindow: 15:28–17:03`, a lagna, a dasha and a
 * transit line; the day-arc SVG drew two `<rect>`s at fixed x-coordinates that
 * corresponded to nothing. Only the star/tithi/yoga strip was real. A "Sample"
 * sticker made that honest, but it did not make it persuasive: the page's own
 * trust proof one section below reads *"Method, not marketing"*, and the single
 * largest object on the page was marketing.
 *
 * Everything here is computed by the engine for today and checkable, line by
 * line, against the printed almanac the reader already owns. That is the whole
 * argument. The information architecture is lifted from the dashboard's Today
 * hero, which the 2026-09-04 review found "structurally right":
 *
 *   - one promoted window, with the reason attached, chosen clear of the kalas;
 *   - the safety axis (Rahu Kalam) beside it, not competing with it;
 *   - the rival timing systems demoted behind a named disclosure that says what
 *     they are *for*;
 *   - live phase state on BOTH axes — a caution earns a countdown more than an
 *     invitation does (that review's finding 4).
 *
 * WHAT IS DELIBERATELY ABSENT: a score. The dashboard's dial reads a real
 * per-chart number; a guest has no chart, so any number here would be invented,
 * and inventing one is the exact failure this rewrite exists to remove. The
 * slot it would have occupied goes to the rasi strip, which buys a genuinely
 * personal reading for one tap and no account — the honest analogue.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRasiPalan, type RasiPalanData } from "@vinaadi/shared/api";
import { formatClockLabel } from "@/lib/format";
import { gowriCategoryLabel, gowriPurposeLabel } from "@/lib/gowri";
import { tNakshatra, tTithi, type Lang } from "@/lib/i18n";
import { moonPhaseFromTithi } from "@/lib/lunar";
import { limbNow } from "@/lib/panchangam-limb";
import { HOME, mt } from "@/lib/marketing-i18n";
import { MarketingIcon } from "@/components/marketing-icons";
import { RASI_LIST, useGuestStore, type GuestRasi } from "@/hooks/useGuestStore";
import { clearSegments } from "@/lib/today-windows";
import {
  GUEST_LOCATION,
  avoidPeriods,
  formatCountdown,
  headlineFestival,
  pickAvoidPeriod,
  pickGuestWindow,
  spanState,
} from "@/lib/public-today";
import type { PanchangamDailyResponseData } from "@/lib/types";

interface HomeTodayPanelProps {
  panchangam: PanchangamDailyResponseData | null;
  /** The fetch settled without data. Distinguished from "still loading" so the
   *  panel can say so instead of shimmering forever. */
  failed: boolean;
  lang: Lang;
  /** The visitor's day in the panchangam's zone (YYYY-MM-DD), lifted from the
   *  page so the panel and the fetch cannot disagree about which day it is. */
  dateLocal: string;
}

function span(text: string, value: string): string {
  return text.replace("%s", value);
}

/** English ordinal for the Moon's house (1st … 12th). Tamil takes the bare
 *  number, which is why this is applied at the call site and not baked into the
 *  string. */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** A crescent at label size: a disc with a second disc cut out of it, offset by
 *  how much of the Moon is dark and mirrored for the waxing fortnight. Drawn
 *  rather than typed — `🌘` is an emoji used as an icon, which the pre-delivery
 *  checklist bans and a screen reader reads aloud mid-sentence. */
function MoonGlyph({ fraction, waxing, size = 13 }: { fraction: number; waxing: boolean; size?: number }) {
  const r = size / 2;
  const offset = (waxing ? -1 : 1) * (1 - Math.min(1, Math.max(0, fraction))) * r * 1.6;
  const maskId = `cl-moon-${waxing ? "wax" : "wane"}-${Math.round(fraction * 100)}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" style={{ flex: "none" }}>
      <defs>
        <mask id={maskId}>
          <circle cx={r} cy={r} r={r} fill="#fff" />
          <circle cx={r + offset} cy={r} r={r} fill="#000" />
        </mask>
      </defs>
      <circle cx={r} cy={r} r={r} fill="currentColor" opacity={0.22} />
      <circle cx={r} cy={r} r={r} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/* ── head ─────────────────────────────────────────────────────────────────── */

function PanelHead({
  panchangam,
  lang,
  dateLocal,
  now,
}: {
  panchangam: PanchangamDailyResponseData | null;
  lang: Lang;
  dateLocal: string;
  now: Date;
}) {
  const locale = lang === "ta" ? "ta-IN" : "en-GB";
  // Two formatters joined by a comma rather than one three-part format: en-GB
  // renders {weekday, day, month} as "Friday 4 September", with no separator
  // between the weekday and the date, which reads as a run-on at display size.
  const at = new Date(`${dateLocal}T12:00:00`);
  const dateLabel = [
    new Intl.DateTimeFormat(locale, { weekday: "long" }).format(at),
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(at),
  ].join(", ");

  // `limbNow` is the shared promotion rule the dashboard ribbon uses: print the
  // limb actually running, not the one the day is named after. Printing the
  // sunrise value flat is how the old hero read "Swathi" all day on 2026-08-19
  // when Swathi held fifteen minutes of it.
  const nak = panchangam?.nakshatra ? limbNow(panchangam.nakshatra, { isToday: true, nowIso: now.toISOString() }) : null;
  const tithi = panchangam?.tithi ? limbNow(panchangam.tithi, { isToday: true, nowIso: now.toISOString() }) : null;
  const phase = panchangam ? moonPhaseFromTithi(panchangam.tithi.number, panchangam.tithi.paksha) : null;
  const festival = headlineFestival(panchangam?.festivals);
  const place = lang === "ta" ? GUEST_LOCATION.labelTa : GUEST_LOCATION.labelEn;

  return (
    <header className="cl-today__head">
      <div className="cl-today__eyebrow-row">
        <p className="cl-today__eyebrow">{span(mt(HOME.today_eyebrow, lang), place)}</p>
        <span className="cl-today__live">
          <span className="cl-today__live-dot" aria-hidden="true" />
          {mt(HOME.today_badge, lang)}
        </span>
      </div>
      <p className="cl-today__date" suppressHydrationWarning>
        {dateLabel}
        {panchangam?.tamilDate && (
          <> · <b>{lang === "ta" ? panchangam.tamilDate.ta : panchangam.tamilDate.en}</b></>
        )}
      </p>
      {panchangam && (
        <p className="cl-today__limbs">
          {nak && (
            <span className="cl-today__limb">
              <MarketingIcon name="star" size={13} />
              {mt(HOME.today_star, lang)} <b>{tNakshatra(nak.activeName, lang)}</b>
            </span>
          )}
          {tithi && (
            <span className="cl-today__limb">
              <MarketingIcon name="sparkle" size={13} />
              {mt(HOME.today_tithi, lang)} <b>{tTithi(tithi.activeName, lang)}</b>
            </span>
          )}
          {phase && (
            <span className="cl-today__limb">
              <MoonGlyph fraction={phase.fraction} waxing={phase.waxing} />
              {phase.waxing ? mt(HOME.today_waxing, lang) : mt(HOME.today_waning, lang)}
            </span>
          )}
          {festival && <span className="cl-today__festival">{festival.name}</span>}
        </p>
      )}
    </header>
  );
}

/* ── the two window cards ─────────────────────────────────────────────────── */

function BestWindowCard({
  panchangam,
  lang,
  dateLocal,
  now,
}: {
  panchangam: PanchangamDailyResponseData;
  lang: Lang;
  dateLocal: string;
  now: Date;
}) {
  const pick = pickGuestWindow(panchangam.kalam, { now, dateLocal, timeZone: GUEST_LOCATION.tz });
  if (!pick) return null;

  const { phase, remainingMs } = spanState(pick.slot, { now, dateLocal, timeZone: GUEST_LOCATION.tz });
  const kala = gowriCategoryLabel(pick.slot.name, lang);
  const purpose = gowriPurposeLabel(pick.slot.name, lang);

  let status: string | null = null;
  if (phase === "before" && remainingMs !== null) status = span(mt(HOME.today_starts_in, lang), formatCountdown(remainingMs, lang));
  else if (phase === "during" && remainingMs !== null) status = span(mt(HOME.today_on_now, lang), formatCountdown(remainingMs, lang));
  else if (phase === "after" || pick.hasPassed) status = mt(HOME.today_passed, lang);

  return (
    <div className="cl-today__window cl-today__window--best" data-phase={phase ?? "unknown"}>
      <div className="cl-today__window-top">
        <span className="cl-today__window-label">
          <MarketingIcon name="rising" size={14} />
          {pick.isNight ? mt(HOME.today_best_tonight, lang) : mt(HOME.today_best_label, lang)}
        </span>
        {status && (
          <span className="cl-today__window-status">
            {phase === "during" && <span className="cl-today__live-dot" aria-hidden="true" />}
            {status}
          </span>
        )}
      </div>
      <p className="cl-today__window-time">
        {formatClockLabel(pick.slot.start, lang)} – {formatClockLabel(pick.slot.end, lang)}
      </p>
      {/* A middle dot, not an em dash: every Gowri purpose string already
          contains one ("best overall — any important activity"), so joining
          with a second produced "Amirtham — best overall — any important
          activity" on the live page. */}
      <p className="cl-today__window-why">
        {kala && <><b>{kala}</b>{purpose ? ` · ${purpose}. ` : ". "}</>}
        {pick.collidesWithAvoid ? mt(HOME.today_not_clear, lang) : mt(HOME.today_clear_of, lang)}
      </p>
    </div>
  );
}

function AvoidWindowCard({
  panchangam,
  lang,
  dateLocal,
  now,
}: {
  panchangam: PanchangamDailyResponseData;
  lang: Lang;
  dateLocal: string;
  now: Date;
}) {
  // The next kala still ahead, not always Rahu Kalam — the safety axis has to
  // stay as actionable through the day as the opportunity axis beside it.
  const period = pickAvoidPeriod(panchangam.kalam, { now, dateLocal, timeZone: GUEST_LOCATION.tz });
  if (!period) return null;
  const name = mt(
    period.key === "yamagandam" ? HOME.today_yama : period.key === "kuligai" ? HOME.today_kuligai : HOME.today_rahu,
    lang,
  );
  const { phase, remainingMs } = spanState(period, { now, dateLocal, timeZone: GUEST_LOCATION.tz });

  let status: string | null = null;
  if (phase === "before" && remainingMs !== null) status = span(mt(HOME.today_avoid_in, lang), formatCountdown(remainingMs, lang));
  else if (phase === "during" && remainingMs !== null) status = span(mt(HOME.today_avoid_inside, lang), formatCountdown(remainingMs, lang));
  else if (phase === "after") status = mt(HOME.today_avoid_over, lang);

  return (
    <div className="cl-today__window cl-today__window--avoid" data-phase={phase ?? "unknown"}>
      <div className="cl-today__window-top">
        <span className="cl-today__window-label">
          <MarketingIcon name="block" size={14} />
          {mt(HOME.today_avoid_label, lang)} · {name}
        </span>
        {status && (
          <span className="cl-today__window-status">
            {phase === "during" && <span className="cl-today__live-dot" aria-hidden="true" />}
            {status}
          </span>
        )}
      </div>
      <p className="cl-today__window-time">
        {formatClockLabel(period.start, lang)} – {formatClockLabel(period.end, lang)}
      </p>
    </div>
  );
}

/* ── the disclosure ───────────────────────────────────────────────────────── */

function OtherTimings({ panchangam, lang }: { panchangam: PanchangamDailyResponseData; lang: Lang }) {
  const { kalam, abhijit } = panchangam;
  const fmt = (s: { start: string; end: string }) => `${formatClockLabel(s.start, lang)} – ${formatClockLabel(s.end, lang)}`;

  const nallaNeram = (kalam.nallaNeram ?? []).filter((s) => s?.start && s?.end);

  // Finding 7 of the dashboard hero review, applied here before it can be
  // reported here: Abhijit is ~49 minutes fixed at solar noon and Rahu Kalam
  // clips it structurally on a large share of Fridays. Naming the clear part is
  // the only position consistent with the card two rows above, whose entire
  // argument is that its window is clear of the kalas.
  const abhijitClear = abhijit?.start && abhijit?.end
    ? clearSegments({ start: abhijit.start, end: abhijit.end }, avoidPeriods(kalam))
    : [];
  const abhijitClipped = Boolean(abhijit?.start) && abhijitClear.length > 0
    && !(abhijitClear.length === 1 && abhijitClear[0].start === abhijit.start && abhijitClear[0].end === abhijit.end);

  const rows: { key: string; label: string; value: string | null; note?: string | null }[] = [
    {
      key: "nalla",
      label: mt(HOME.today_nalla_neram, lang),
      value: nallaNeram.length > 0 ? nallaNeram.map(fmt).join("  ·  ") : null,
    },
    // All three kalas, always — including the one the avoid card above is
    // currently showing. The card promotes whichever is next, so listing only
    // the other two meant Rahu Kalam's times left the panel entirely once it
    // was past, and Rahu Kalam is the one of the three a reader who knows one
    // of them knows. The dashboard's disclosure repeats its avoid card the same
    // way, and the review named that structure as correct.
    { key: "rahu", label: mt(HOME.today_rahu, lang), value: kalam.rahuKalam ? fmt(kalam.rahuKalam) : null },
    { key: "yama", label: mt(HOME.today_yama, lang), value: kalam.yamagandam ? fmt(kalam.yamagandam) : null },
    { key: "kuligai", label: mt(HOME.today_kuligai, lang), value: kalam.kuligai ? fmt(kalam.kuligai) : null },
    {
      key: "abhijit",
      label: mt(HOME.today_abhijit, lang),
      value: abhijit?.start && abhijit?.end ? fmt(abhijit) : null,
      note: abhijit?.isRestrictedByWeekday
        ? mt(HOME.today_abhijit_wednesday, lang)
        : abhijitClear.length === 0 && abhijit?.start
          ? mt(HOME.today_abhijit_covered, lang)
          : abhijitClipped
            ? span(mt(HOME.today_abhijit_clipped, lang), abhijitClear.map(fmt).join(", "))
            : null,
    },
  ].filter((row) => row.value !== null);

  if (rows.length === 0) return null;

  return (
    <details className="cl-today__more">
      <summary className="cl-today__more-summary">
        <span>{mt(HOME.today_other_label, lang)}</span>
        <span className="cl-today__more-count">{rows.length}</span>
      </summary>
      <p className="cl-today__more-note">{mt(HOME.today_other_note, lang)}</p>
      <dl className="cl-today__rows">
        {rows.map((row) => (
          <div key={row.key} className="cl-today__row">
            <dt className="cl-today__row-label">{row.label}</dt>
            <dd className="cl-today__row-value">
              {row.value}
              {row.note && <span className="cl-today__row-note">{row.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/* ── the rasi strip ───────────────────────────────────────────────────────── */

function RasiStrip({ lang, dateLocal }: { lang: Lang; dateLocal: string }) {
  const { selectedRasi, setRasi } = useGuestStore();
  const [picking, setPicking] = useState(false);
  const [palan, setPalan] = useState<RasiPalanData | null>(null);
  const [loading, setLoading] = useState(false);

  const rasiId = selectedRasi?.id ?? null;
  useEffect(() => {
    if (rasiId === null) {
      setPalan(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // The typed shared wrapper, not a fresh direct fetch — `packages/shared`
    // is the forward path for any new endpoint consumption, and this one is
    // already there and already correct against the route decorator.
    getRasiPalan({
      rasi: String(rasiId),
      date: dateLocal,
      lat: GUEST_LOCATION.lat,
      lng: GUEST_LOCATION.lng,
      timezone: GUEST_LOCATION.tz,
    })
      .then((data) => { if (!cancelled) setPalan(data); })
      .catch(() => { if (!cancelled) setPalan(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rasiId, dateLocal]);

  function choose(rasi: GuestRasi) {
    setRasi(rasi.id);
    setPicking(false);
  }

  const showPicker = picking || !selectedRasi;

  return (
    <section className="cl-today__rasi" aria-label={mt(HOME.today_rasi_label, lang)}>
      {showPicker ? (
        <>
          <p className="cl-today__rasi-prompt">{mt(HOME.today_rasi_prompt, lang)}</p>
          <div className="cl-today__rasi-grid">
            {RASI_LIST.map((rasi) => (
              <button
                key={rasi.id}
                type="button"
                className="cl-today__rasi-chip"
                data-active={selectedRasi?.id === rasi.id}
                onClick={() => choose(rasi)}
              >
                {lang === "ta" ? rasi.ta : rasi.en}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="cl-today__rasi-head">
            <span className="cl-today__rasi-name">{lang === "ta" ? selectedRasi.ta : selectedRasi.en}</span>
            {palan && (
              <span className="cl-today__rasi-house">
                {span(mt(HOME.today_rasi_house, lang), lang === "ta" ? String(palan.moonHouse) : ordinal(palan.moonHouse))}
              </span>
            )}
            <button type="button" className="cl-today__rasi-change" onClick={() => setPicking(true)}>
              {mt(HOME.today_rasi_change, lang)}
            </button>
          </div>
          {loading && !palan && <p className="cl-today__rasi-body">{mt(HOME.today_rasi_loading, lang)}</p>}
          {/* `headline` is a one-word category ("Relationships", "Gains and
              success") and `body` is the actual reading. Printing the headline
              alone made the payoff for choosing a rasi a single noun — the
              reader taps and learns nothing. The headline earns its place as
              the kicker above the sentence, not instead of it. */}
          {palan && (
            <p className="cl-today__rasi-body" data-tone={palan.tone}>
              <b className="cl-today__rasi-verdict">{lang === "ta" ? palan.headline.ta : palan.headline.en}</b>
              {" — "}
              {lang === "ta" ? palan.body.ta : palan.body.en}
            </p>
          )}
          <Link href="/tools/indraiya-rasipalan" className="cl-today__rasi-link">
            {mt(HOME.today_rasi_more, lang)}
          </Link>
        </>
      )}
    </section>
  );
}

/* ── the panel ────────────────────────────────────────────────────────────── */

export function HomeTodayPanel({ panchangam, failed, lang, dateLocal }: HomeTodayPanelProps) {
  // One tick a minute drives both countdowns and the phase flips — the same
  // cadence the dashboard hero uses, and the reason neither surface re-renders
  // on an animation frame.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const place = lang === "ta" ? GUEST_LOCATION.labelTa : GUEST_LOCATION.labelEn;
  const footText = useMemo(() => span(mt(HOME.today_foot, lang), place), [lang, place]);

  return (
    <div className="cl-today">
      <PanelHead panchangam={panchangam} lang={lang} dateLocal={dateLocal} now={now} />

      {panchangam ? (
        <>
          <BestWindowCard panchangam={panchangam} lang={lang} dateLocal={dateLocal} now={now} />
          <AvoidWindowCard panchangam={panchangam} lang={lang} dateLocal={dateLocal} now={now} />
          <OtherTimings panchangam={panchangam} lang={lang} />
        </>
      ) : failed ? (
        <p className="cl-today__empty">{mt(HOME.today_unavailable, lang)}</p>
      ) : (
        // Skeleton, not a spinner: the panel's shape is the message, and a
        // shape that holds still while it fills does not shift the hero. The
        // shimmer is dropped under `prefers-reduced-motion` in CSS.
        //
        // The status line is a sibling of the hidden blocks, not a child —
        // `aria-hidden` on an ancestor hides its whole subtree, so nesting it
        // would have silenced the one part of this state a screen reader needs.
        <>
          <div className="cl-today__skeleton" aria-hidden="true">
            <div className="cl-today__skeleton-block cl-today__skeleton-block--tall" />
            <div className="cl-today__skeleton-block" />
            <div className="cl-today__skeleton-block cl-today__skeleton-block--short" />
          </div>
          <p className="cl-today__loading" role="status">{mt(HOME.today_loading, lang)}</p>
        </>
      )}

      <RasiStrip lang={lang} dateLocal={dateLocal} />

      <footer className="cl-today__foot">
        <span className="cl-today__foot-method">{footText}</span>
        <Link href="/panchangam/today" className="cl-today__foot-link">{mt(HOME.today_foot_link, lang)}</Link>
      </footer>
    </div>
  );
}
