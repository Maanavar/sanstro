"use client";

import { useState } from "react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { useLang } from "@/components/lang-context";
import { OPEN_BETA, SUBSCRIPTION_PLANS } from "@vinaadi/shared/constants";

/** ₹ with Indian digit grouping; "Free" for zero (MKT-14). */
function formatINR(amount: number, free = "Free"): string {
  if (amount <= 0) return free;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const cardBase: React.CSSProperties = {
  background: "var(--cl-surface)",
  border: "1px solid var(--cl-border)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--cl-muted)",
  fontWeight: 700,
};

export function PricingPlans() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [lang] = useLang();
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);
  const free = L("Free", "இலவசம்");

  const monthly = SUBSCRIPTION_PLANS.monthly;
  const annual = SUBSCRIPTION_PLANS.annual;
  const premiumPlan = billing === "monthly" ? monthly : annual;
  const monthlyEquivalent = Math.round(annual.priceINR / 12);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Billing toggle */}
      <div
        role="group"
        aria-label={L("Billing period", "கட்டணக் காலம்")}
        style={{
          display: "inline-flex",
          alignSelf: "start",
          gap: "4px",
          padding: "4px",
          borderRadius: "999px",
          background: "var(--cl-bg-2)",
          border: "1px solid var(--cl-border)",
        }}
      >
        {(["monthly", "annual"] as const).map((option) => {
          const active = billing === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setBilling(option)}
              style={{
                minHeight: "36px",
                padding: "0 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.85rem",
                background: active ? "var(--cl-ink)" : "transparent",
                color: active ? "var(--cl-bg)" : "var(--cl-muted)",
                transition: "background 150ms ease, color 150ms ease",
              }}
            >
              {option === "monthly" ? L("Monthly", "மாதந்தோறும்") : L("Annual", "ஆண்டுதோறும்")}
              {option === "annual" && annual.savingsPercent ? (
                <span style={{ marginLeft: "6px", fontSize: "0.72rem", opacity: 0.85 }}>
                  {L(`save ${annual.savingsPercent}%`, `${annual.savingsPercent}% சேமிப்பு`)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Guest */}
        <div style={cardBase}>
          <p style={eyebrowStyle}>{L("Guest", "விருந்தினர்")}</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>{L("Free to explore", "ஆராய இலவசம்")}</h2>
          <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.6 }}>
            {L("See today's public value before creating an account.", "கணக்கு உருவாக்கும் முன் இன்றைய பொதுப் பலன்களைப் பாருங்கள்.")}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(0, free)}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Link href="/tools/indraiya-rasipalan" className="cl-btn cl-btn--ghost" style={{ width: "100%" }}>
              {L("Try guest mode", "விருந்தினராக முயலுங்கள்")}
            </Link>
          </div>
        </div>

        {/* Registered */}
        <div style={cardBase}>
          <p style={eyebrowStyle}>{L("Registered", "பதிவுசெய்தவர்")}</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>{L("Free account", "இலவசக் கணக்கு")}</h2>
          <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.6 }}>
            {L("Unlock saved charts, journal tracking, and current dasha context.", "சேமித்த ஜாதகங்கள், நாட்குறிப்புக் கண்காணிப்பு, நடப்பு தசைச் சூழலைத் திறக்கவும்.")}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(0, free)}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Link href="/login" className="cl-btn cl-btn--solid" style={{ width: "100%" }}>
              {L("Create free account", "இலவசக் கணக்கை உருவாக்குங்கள்")}
            </Link>
          </div>
        </div>

        {/* Premium */}
        <div
          style={{
            ...cardBase,
            position: "relative",
            background: "var(--cl-brand-tint)",
            border: "1.5px solid var(--cl-accent)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "-12px",
              left: "24px",
              padding: "3px 12px",
              borderRadius: "999px",
              background: "var(--cl-accent)",
              color: "var(--cl-surface)",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {L("Recommended", "பரிந்துரை")}
          </span>
          <p style={{ ...eyebrowStyle, color: "var(--cl-accent)" }}>{L("Premium", "பிரீமியம்")}</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>{L("Full depth", "முழு ஆழம்")}</h2>
          <p style={{ margin: 0, color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
            {L("For families who want unlimited chart work, richer timing tools, and deeper reports.", "வரம்பற்ற ஜாதகப் பணி, செழுமையான நேரக் கருவிகள், ஆழமான அறிக்கைகளை விரும்பும் குடும்பங்களுக்கு.")}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(premiumPlan.priceINR, free)}
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--cl-muted)" }}>
              {billing === "monthly" ? L(" / month", " / மாதம்") : L(" / year", " / ஆண்டு")}
            </span>
          </p>
          <p style={{ margin: 0, color: "var(--cl-muted)", fontSize: "0.9rem", minHeight: "1.2em" }}>
            {billing === "annual"
              ? L(`≈ ${formatINR(monthlyEquivalent)} / month, billed annually`, `≈ ${formatINR(monthlyEquivalent)} / மாதம், ஆண்டுக்கொருமுறை வசூல்`)
              : L("Switch to annual to save", "சேமிக்க ஆண்டுத் திட்டத்துக்கு மாறுங்கள்")}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            {OPEN_BETA ? (
              <>
                {/* No trial to start: the beta already unlocks all of this. */}
                <Link href="/login" className="cl-btn cl-btn--solid" style={{ width: "100%" }}>
                  {L("Free during the beta", "பீட்டாவில் இலவசம்")}
                </Link>
                <p style={{ margin: "8px 0 0", color: "var(--cl-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                  {L("Included with a free account while the beta runs. Price after launch.", "பீட்டா நடக்கும் வரை இலவசக் கணக்குடன் உள்ளடங்கும். அறிமுகத்திற்குப் பிறகு இதுவே விலை.")}
                </p>
              </>
            ) : (
              <>
                <Link href="/login" className="cl-btn cl-btn--solid" style={{ width: "100%" }}>
                  {L(`Start ${monthly.trialDays}-day free trial`, `${monthly.trialDays} நாள் இலவச சோதனையைத் தொடங்குங்கள்`)}
                </Link>
                <p style={{ margin: "8px 0 0", color: "var(--cl-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                  {L(
                    `${monthly.trialDays} days free, then ${formatINR(premiumPlan.priceINR)}${billing === "monthly" ? " / month" : " / year"}. Cancel anytime.`,
                    `${monthly.trialDays} நாள் இலவசம், பிறகு ${formatINR(premiumPlan.priceINR)}${billing === "monthly" ? " / மாதம்" : " / ஆண்டு"}. எப்போது வேண்டுமானாலும் ரத்து செய்யலாம்.`,
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
