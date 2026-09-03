"use client";

import { useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@vinaadi/shared/constants";

/** ₹ with Indian digit grouping; "Free" for zero (MKT-14). */
function formatINR(amount: number): string {
  if (amount <= 0) return "Free";
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

  const monthly = SUBSCRIPTION_PLANS.monthly;
  const annual = SUBSCRIPTION_PLANS.annual;
  const premiumPlan = billing === "monthly" ? monthly : annual;
  const monthlyEquivalent = Math.round(annual.priceINR / 12);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Billing toggle */}
      <div
        role="group"
        aria-label="Billing period"
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
              {option === "monthly" ? "Monthly" : "Annual"}
              {option === "annual" && annual.savingsPercent ? (
                <span style={{ marginLeft: "6px", fontSize: "0.72rem", opacity: 0.85 }}>
                  save {annual.savingsPercent}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Guest */}
        <div style={cardBase}>
          <p style={eyebrowStyle}>Guest</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>Free to explore</h2>
          <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.6 }}>
            See today&apos;s public value before creating an account.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(0)}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Link href="/tools/indraiya-rasipalan" className="cl-btn cl-btn--ghost" style={{ width: "100%" }}>
              Try guest mode
            </Link>
          </div>
        </div>

        {/* Registered */}
        <div style={cardBase}>
          <p style={eyebrowStyle}>Registered</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>Free account</h2>
          <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.6 }}>
            Unlock saved charts, journal tracking, and current dasha context.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(0)}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Link href="/login" className="cl-btn cl-btn--solid" style={{ width: "100%" }}>
              Create free account
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
            Recommended
          </span>
          <p style={{ ...eyebrowStyle, color: "var(--cl-accent)" }}>Premium</p>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--cl-ink)" }}>Full depth</h2>
          <p style={{ margin: 0, color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
            For families who want unlimited chart work, richer timing tools, and deeper reports.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>
            {formatINR(premiumPlan.priceINR)}
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--cl-muted)" }}>
              {billing === "monthly" ? " / month" : " / year"}
            </span>
          </p>
          <p style={{ margin: 0, color: "var(--cl-muted)", fontSize: "0.9rem", minHeight: "1.2em" }}>
            {billing === "annual"
              ? `≈ ${formatINR(monthlyEquivalent)} / month, billed annually`
              : "Switch to annual to save"}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Link href="/login" className="cl-btn cl-btn--solid" style={{ width: "100%" }}>
              Start {monthly.trialDays}-day free trial
            </Link>
            <p style={{ margin: "8px 0 0", color: "var(--cl-muted)", fontSize: "0.8rem", textAlign: "center" }}>
              {monthly.trialDays} days free, then {formatINR(premiumPlan.priceINR)}
              {billing === "monthly" ? " / month" : " / year"}. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
