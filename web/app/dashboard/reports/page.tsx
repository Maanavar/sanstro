"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardAuxiliaryShell } from "@/components/dashboard-auxiliary-shell";
import { useLang } from "@/components/lang-toggle";
import { readErrorMessage } from "@/lib/api";
import {
  createReport,
  getReportAllowance,
  listBirthProfiles,
  listPaymentProducts,
  listReports,
  reportDownloadPath,
  REPORT_SKU,
  type KindAllowance,
  type PaymentProduct,
  type Report,
  type ReportKind,
} from "@vinaadi/shared/api";
import { TIER_LIMITS } from "@vinaadi/shared/constants";
import type { BirthProfileResponse } from "@/lib/types";
import { Button, Card, Field, Segmented, Select } from "@/components/ui";
import "@/components/reports-page.css";

/**
 * Reports — spend an included report or a bought credit on a document, then
 * download it (ARC-14).
 *
 * What this page used to be: a grid of hardcoded ₹ prices with a "Join
 * waitlist" button behind `POST /reports/purchase`, which stored nothing. Both
 * are gone. Buying now happens on /dashboard/upgrade, which is the one route
 * whose CSP allows Razorpay Checkout (lib/security-headers.ts `isCheckoutPath`)
 * and which already sells every active one-time SKU — so there is no second
 * payment path to keep correct, and none to widen the policy for.
 *
 * Prices are never written here. They are rows in `products` (D-08), read
 * through `listPaymentProducts()`; a report SKU that is not on sale yet simply
 * does not come back, and this page says so rather than offering a dead button.
 *
 * New Tamil, pending native review.
 */

const KINDS: ReportKind[] = ["jadhagam", "porutham"];

const KIND_LABEL: Record<ReportKind, { en: string; ta: string }> = {
  jadhagam: { en: "Jadhagam report", ta: "ஜாதக அறிக்கை" },
  porutham: { en: "Porutham report", ta: "பொருத்த அறிக்கை" },
};

type Outcome = { tone: "ok" | "error" | "info"; text: string } | null;

function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** A readable download name. The server also sends one in Content-Disposition;
 *  a blob download cannot read it, so the anchor needs its own. */
function fileName(report: Report): string {
  const stem = report.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return `${stem || report.kind}.pdf`;
}

export default function ReportsPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const L = useCallback((en: string, taText: string) => (ta ? taText : en), [ta]);

  const [kind, setKind] = useState<ReportKind>("jadhagam");
  const [allowance, setAllowance] = useState<KindAllowance[] | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [profiles, setProfiles] = useState<BirthProfileResponse[]>([]);
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [chartId, setChartId] = useState("");
  const [partnerChartId, setPartnerChartId] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  // Async outcomes are spoken, not just coloured (DASH-08).
  const [announcement, setAnnouncement] = useState("");

  const refresh = useCallback(async () => {
    const [allow, list] = await Promise.all([getReportAllowance(), listReports()]);
    setAllowance(allow.kinds);
    setReports(list);
  }, []);

  useEffect(() => {
    // The profile and product lists are context for the form, not the page
    // itself: a failure to price a SKU must not blank the reports someone
    // already owns, so they settle independently.
    void (async () => {
      try {
        const { data } = await listBirthProfiles();
        const usable = (data ?? []).filter((p) => p.chartId);
        setProfiles(usable);
        setChartId((current) => current || usable[0]?.chartId || "");
      } catch {
        setProfiles([]);
      }
      try {
        setProducts(await listPaymentProducts());
      } catch {
        setProducts([]);
      }
    })();
  }, []);

  useEffect(() => {
    refresh().catch((err: unknown) => setOutcome({ tone: "error", text: readErrorMessage(err) }));
  }, [refresh]);

  const current = useMemo(
    () => allowance?.find((a) => a.kind === kind) ?? null,
    [allowance, kind],
  );

  /** The SKU for this kind, only if it is actually on sale. */
  const sku = useMemo(
    () => products.find((p) => p.sku === REPORT_SKU[kind]) ?? null,
    [products, kind],
  );

  const partnerOptions = useMemo(
    () => profiles.filter((p) => p.chartId && p.chartId !== chartId),
    [profiles, chartId],
  );

  // Porutham needs a second, different chart. Reflected in the button's
  // disabled state rather than discovered as a 422 after a click.
  const needsPartner = kind === "porutham";
  const partnerReady = !needsPartner || Boolean(partnerChartId);
  const canSubmit = Boolean(chartId) && partnerReady && !busy && (current?.canCreate ?? false);

  async function create() {
    if (!canSubmit) return;
    setBusy(true);
    setOutcome(null);
    try {
      const { report } = await createReport({
        kind,
        chartId,
        ...(needsPartner ? { partnerChartId } : {}),
        lang: ta ? "ta" : "en",
      });
      const paid =
        report.source === "included"
          ? L("using this month's included report", "இந்த மாதத்தின் உள்ளடங்கிய அறிக்கையைப் பயன்படுத்தி")
          : L("using one report credit", "ஒரு அறிக்கை வரவைப் பயன்படுத்தி");
      const text = L(`Report ready, ${paid}.`, `அறிக்கை தயார், ${paid}.`);
      setOutcome({ tone: "ok", text });
      setAnnouncement(text);
      await refresh();
    } catch (err: unknown) {
      const text = readErrorMessage(err);
      setOutcome({ tone: "error", text });
      setAnnouncement(text);
    } finally {
      setBusy(false);
    }
  }

  async function download(report: Report) {
    const response = await fetch(`/api/backend/api/v1${reportDownloadPath(report.id)}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const text = L("Could not download that report.", "அந்த அறிக்கையைப் பதிவிறக்க முடியவில்லை.");
      setOutcome({ tone: "error", text });
      setAnnouncement(text);
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName(report);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function allowanceLine(a: KindAllowance): string {
    const parts: string[] = [];
    if (a.includedMonthly > 0) {
      parts.push(
        L(
          `${a.includedRemaining} of ${a.includedMonthly} included this month`,
          `இந்த மாதம் ${a.includedMonthly}-ல் ${a.includedRemaining} உள்ளடங்கியது`,
        ),
      );
    }
    if (a.credits > 0) {
      parts.push(L(`${a.credits} credit${a.credits === 1 ? "" : "s"}`, `${a.credits} வரவு`));
    }
    if (parts.length === 0) {
      return L("Nothing left to spend", "செலவழிக்க எதுவும் இல்லை");
    }
    return parts.join(L(" · ", " · "));
  }

  return (
    <DashboardAuxiliaryShell pageTitle={{ en: "Reports", ta: "அறிக்கைகள்" }}>
      <div className="rep-page">
        <p role="status" aria-live="polite" className="rep-sr-only">
          {announcement}
        </p>

        <div className="rep-wrap">
          <div>
            <h1 className="rep-title">{L("Reports", "அறிக்கைகள்")}</h1>
            <p className="rep-lead">
              {L(
                "A written reading, saved as a PDF you can download whenever you like. Once a report is made it never changes — it is the document you paid for.",
                "எழுதப்பட்ட பரிசீலனை, எப்போதும் பதிவிறக்கக்கூடிய PDF ஆகச் சேமிக்கப்படும். ஒருமுறை உருவாக்கியபின் அறிக்கை மாறாது — நீங்கள் பணம் செலுத்திய ஆவணம் அதுவே.",
              )}
            </p>
          </div>

          {/* ── Make one ─────────────────────────────────────────────── */}
          <Card as="section">
            <h2 className="rep-h2">{L("Make a report", "அறிக்கை உருவாக்கு")}</h2>

            <Segmented
              ariaLabel={L("Report type", "அறிக்கை வகை")}
              value={kind}
              onChange={(next) => {
                setKind(next);
                setOutcome(null);
              }}
              options={KINDS.map((k) => ({ key: k, label: ta ? KIND_LABEL[k].ta : KIND_LABEL[k].en }))}
            />

            <p className="rep-allowance">{current ? allowanceLine(current) : "…"}</p>

            {profiles.length === 0 ? (
              <p className="rep-note">
                {L(
                  "Add a birth profile first — a report is written from a saved chart.",
                  "முதலில் ஒரு பிறப்பு விவரத்தைச் சேர்க்கவும் — சேமித்த ஜாதகத்திலிருந்தே அறிக்கை எழுதப்படுகிறது.",
                )}{" "}
                <Link href="/dashboard" className="rep-link">
                  {L("Add a profile", "விவரம் சேர்")}
                </Link>
              </p>
            ) : (
              <div className="rep-form">
                <Field label={L("Chart", "ஜாதகம்")}>
                  <Select value={chartId} onChange={(e) => setChartId(e.target.value)}>
                    {profiles.map((p) => (
                      <option key={p.chartId} value={p.chartId ?? ""}>
                        {p.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>

                {needsPartner && (
                  <Field
                    label={L("Partner's chart", "துணையின் ஜாதகம்")}
                    helper={L("A porutham report compares two charts.", "பொருத்த அறிக்கை இரு ஜாதகங்களை ஒப்பிடுகிறது.")}
                  >
                    <Select
                      value={partnerChartId}
                      onChange={(e) => setPartnerChartId(e.target.value)}
                    >
                      <option value="">{L("Choose a chart", "ஜாதகம் தேர்ந்தெடு")}</option>
                      {partnerOptions.map((p) => (
                        <option key={p.chartId} value={p.chartId ?? ""}>
                          {p.displayName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                <Button variant="primary" disabled={!canSubmit} onClick={() => void create()}>
                  {busy
                    ? "…"
                    : current?.includedRemaining
                      ? L("Make it — included", "உருவாக்கு — உள்ளடங்கியது")
                      : L("Make it — 1 credit", "உருவாக்கு — 1 வரவு")}
                </Button>
              </div>
            )}

            {/* Nothing left to pay with. Say what it would cost and where, or
                say plainly that it is not on sale — never a dead button. */}
            {current && !current.canCreate && (
              <Card variant="mid" compact>
                {sku ? (
                  <p className="rep-note">
                    {L(
                      `You have used this month's allowance. Another one is ${rupees(sku.priceInrPaise)}.`,
                      `இந்த மாதத்தின் அளவை நீங்கள் பயன்படுத்திவிட்டீர்கள். மற்றொன்று ${rupees(sku.priceInrPaise)}.`,
                    )}{" "}
                    <Link href="/dashboard/upgrade" className="rep-link">
                      {L("Buy a report →", "அறிக்கை வாங்கு →")}
                    </Link>
                  </p>
                ) : (
                  <p className="rep-note">
                    {L(
                      `Individual reports are not on sale yet. Premium includes ${TIER_LIMITS.premium.detailedReportsMonthlyIncluded} jadhagam and ${TIER_LIMITS.premium.poruthamReportsMonthlyIncluded} porutham report each month.`,
                      `தனி அறிக்கைகள் இன்னும் விற்பனையில் இல்லை. பிரீமியத்தில் மாதம் ${TIER_LIMITS.premium.detailedReportsMonthlyIncluded} ஜாதக அறிக்கையும் ${TIER_LIMITS.premium.poruthamReportsMonthlyIncluded} பொருத்த அறிக்கையும் உள்ளடங்கும்.`,
                    )}{" "}
                    <Link href="/dashboard/upgrade" className="rep-link">
                      {L("View Premium →", "பிரீமியம் பார்க்க →")}
                    </Link>
                  </p>
                )}
              </Card>
            )}

            {outcome && (
              <p className="rep-outcome" data-tone={outcome.tone}>
                {outcome.text}
              </p>
            )}
          </Card>

          {/* ── What has been delivered ──────────────────────────────── */}
          <section>
            <h2 className="rep-h2">{L("Your reports", "உங்கள் அறிக்கைகள்")}</h2>
            {reports === null ? (
              <p className="rep-note">…</p>
            ) : reports.length === 0 ? (
              <Card variant="dashed">
                <p className="rep-note">
                  {L(
                    "No reports yet. Make one above and it will be saved here for good.",
                    "இன்னும் அறிக்கைகள் இல்லை. மேலே ஒன்றை உருவாக்கினால் இங்கே நிரந்தரமாகச் சேமிக்கப்படும்.",
                  )}
                </p>
              </Card>
            ) : (
              <ul className="rep-list">
                {reports.map((report) => (
                  <li key={report.id}>
                    <Card compact className="rep-row">
                      <div className="rep-row__text">
                        <span className="rep-row__title">{report.title}</span>
                        <span className="rep-row__meta">
                          {new Date(report.createdAt).toLocaleDateString(ta ? "ta-IN" : "en-IN")}
                          {" · "}
                          {ta ? KIND_LABEL[report.kind].ta : KIND_LABEL[report.kind].en}
                          {" · "}
                          {report.source === "included"
                            ? L("included", "உள்ளடங்கியது")
                            : L("credit", "வரவு")}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void download(report)}
                        aria-label={L(`Download ${report.title}`, `${report.title} பதிவிறக்கு`)}
                      >
                        {L("Download", "பதிவிறக்கு")}
                      </Button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardAuxiliaryShell>
  );
}
