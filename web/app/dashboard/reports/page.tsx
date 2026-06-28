"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANG_STORAGE_KEY, type Lang } from "@/lib/i18n";
import { PPU_REPORT_PRODUCTS, PPU_PORUTHAM_PRODUCTS, PPU_TOPUP_PRODUCTS } from "@vinaadi/shared/constants/tiers";

type Section = { heading: { en: string; ta: string }; products: typeof PPU_REPORT_PRODUCTS | typeof PPU_PORUTHAM_PRODUCTS | typeof PPU_TOPUP_PRODUCTS };

const SECTIONS: Section[] = [
  {
    heading: { en: "Jadhagam Reports", ta: "ஜாதக அறிக்கைகள்" },
    products: PPU_REPORT_PRODUCTS,
  },
  {
    heading: { en: "Porutham Reports", ta: "பொருத்த அறிக்கைகள்" },
    products: PPU_PORUTHAM_PRODUCTS,
  },
  {
    heading: { en: "Ask Vinaadi Top-up", ta: "கேள்வி பேக்" },
    products: PPU_TOPUP_PRODUCTS,
  },
];

type BuyState = "idle" | "loading" | "queued" | "error";

export default function ReportsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [buyState, setBuyState] = useState<Record<string, BuyState>>({});

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as Lang);
    void fetch("/api/backend/api/v1/settings/ui", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { data?: { lang?: string } }) => {
        const dbLang = j.data?.lang;
        if (dbLang === "ta" || dbLang === "en") setLang(dbLang as Lang);
      })
      .catch(() => {});
  }, []);

  const ta = lang === "ta";

  async function handleBuy(productId: string) {
    setBuyState((s) => ({ ...s, [productId]: "loading" }));
    try {
      const res = await fetch("/api/backend/api/v1/reports/purchase", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "1",
        },
        body: JSON.stringify({ product_id: productId }),
      });
      if (!res.ok) {
        setBuyState((s) => ({ ...s, [productId]: "error" }));
        return;
      }
      setBuyState((s) => ({ ...s, [productId]: "queued" }));
    } catch {
      setBuyState((s) => ({ ...s, [productId]: "error" }));
    }
  }

  function btnLabel(productId: string) {
    const state = buyState[productId] ?? "idle";
    if (state === "loading") return ta ? "…" : "…";
    if (state === "queued") return ta ? "✓ பட்டியலில் சேர்க்கப்பட்டது" : "✓ Added to waitlist";
    if (state === "error") return ta ? "மீண்டும் முயற்சி செய்யவும்" : "Retry";
    return ta ? "வாங்கு →" : "Buy →";
  }

  function btnDisabled(productId: string) {
    const state = buyState[productId] ?? "idle";
    return state === "loading" || state === "queued";
  }

  function btnStyle(productId: string): React.CSSProperties {
    const state = buyState[productId] ?? "idle";
    const base: React.CSSProperties = {
      marginTop: "auto",
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      fontWeight: 600,
      fontSize: "0.85rem",
      cursor: btnDisabled(productId) ? "default" : "pointer",
    };
    if (state === "queued") {
      return { ...base, background: "var(--panel-green, #2d6a4f)", color: "#fff", opacity: 0.9 };
    }
    if (state === "error") {
      return { ...base, background: "var(--panel-red, #9b2226)", color: "#fff" };
    }
    return {
      ...base,
      background: state === "loading" ? "var(--panel-earth-dark)" : "var(--chart-amber, #d4a017)",
      color: "#fff",
      opacity: state === "loading" ? 0.7 : 1,
    };
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)", color: "var(--color-text)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--text-secondary)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← {ta ? "திரும்பு" : "Back"}
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              {ta ? "அறிக்கைகளை வாங்கு" : "Buy Reports"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {ta
                ? "ஒவ்வொரு வாங்குதலும் ஒரு முறை மட்டுமே — மாத சந்தா தேவையில்லை."
                : "One-time purchase per report — no subscription required."}
            </p>
          </div>
        </div>

        {/* Notice banner */}
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--panel-warm-tint)", border: "1px solid var(--panel-golden)", fontSize: "0.82rem", color: "var(--panel-earth)" }}>
          {ta
            ? "💳 கட்டண செயல்முறை விரைவில் இயக்கப்படும். இப்போது, வரிசையில் இணைவதற்கு கீழே உள்ள வாங்கு பொத்தானை அழுத்துங்கள்."
            : "💳 Payment processing coming soon. Press Buy to join the waitlist for your chosen report."}
        </div>

        {SECTIONS.map((section) => (
          <section key={section.heading.en}>
            <h2 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", opacity: 0.7 }}>
              {ta ? section.heading.ta : section.heading.en}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
              {Object.values(section.products).map((product) => (
                <div
                  key={product.rcProductId}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                      {ta ? product.label.ta : product.label.en}
                    </h3>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--chart-amber)", whiteSpace: "nowrap" }}>
                      ₹{product.priceINR}
                    </span>
                  </div>
                  {"pages" in product && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "var(--panel-warm-gold)", color: "var(--panel-earth)", alignSelf: "flex-start" }}>
                      {product.pages} {ta ? "பக்கம்" : "pages"}
                    </span>
                  )}
                  {"questions" in product && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "var(--panel-warm-gold)", color: "var(--panel-earth)", alignSelf: "flex-start" }}>
                      {product.questions} {ta ? "கேள்விகள்" : "questions"}
                    </span>
                  )}
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                    {ta ? product.description.ta : product.description.en}
                  </p>
                  <button
                    type="button"
                    disabled={btnDisabled(product.rcProductId)}
                    onClick={() => void handleBuy(product.rcProductId)}
                    style={btnStyle(product.rcProductId)}
                  >
                    {btnLabel(product.rcProductId)}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Upgrade CTA */}
        <div style={{ padding: "20px", borderRadius: "14px", background: "var(--cl-bg-2)", border: "1px solid var(--panel-tan)", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
            {ta ? "பிரீமியம் திட்டத்தில் மாதம் 5 விரிவான அறிக்கைகள் இலவசம்" : "Premium plan includes 5 detailed reports per month"}
          </p>
          <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            {ta ? "மாத ₹149 அல்லது வருட ₹999 — 7 நாள் இலவச சோதனை" : "₹149/month or ₹999/year — 7-day free trial"}
          </p>
          <Link
            href="/pricing"
            style={{ padding: "10px 22px", borderRadius: "999px", background: "var(--panel-earth-dark)", color: "var(--panel-hover)", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none", display: "inline-block" }}
          >
            {ta ? "பிரீமியம் பார்க்க →" : "View Premium →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
