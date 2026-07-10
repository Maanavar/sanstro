"use client";

// Shared personal/today utilities extracted from the (now-deleted) Classic
// dashboard-personal-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). No Classic/Nova fork:
// downloadJadhagamPdf, GUIDANCE_REASON_KEYS, ChandrashtamaCard.

import { useState } from "react";
import { DashboardLearnArticleModal } from "@/components/dashboard-learn-article-modal";
import type { Lang } from "@/lib/i18n";

export const GUIDANCE_REASON_KEYS = ["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const;

export async function downloadJadhagamPdf(chartId: string, selectedDate: string, lang: Lang): Promise<void> {
  if (!chartId) return;
  const asOf = selectedDate || new Date().toISOString().slice(0, 10);
  const response = await fetch(`/api/backend/api/v1/charts/${chartId}/export/pdf?asOf=${asOf}&lang=${lang}`, {
    credentials: "include",
  });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jadhagam-${chartId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const CHANDRASHTAMA_AVOID = {
  ta: [
    "முக்கியமான ஒப்பந்தங்கள் கையெழுத்திட வேண்டாம்",
    "புதிய வியாபார முயற்சி தொடங்க வேண்டாம்",
    "அதிக பண பரிவர்த்தனை தவிர்க்கவும்",
    "தேவையற்ற சர்ச்சைகளில் ஈடுபட வேண்டாம்",
  ],
  en: [
    "Don't sign important contracts or agreements",
    "Don't launch a new business or major venture",
    "Avoid large financial transactions or loans",
    "Don't get drawn into unnecessary arguments",
  ],
};

const CHANDRASHTAMA_CAN_DO = {
  ta: [
    "ஆன்மீக நடைமுறைகள் — தியானம், ஜபம், பூஜை",
    "குடும்பத்தினருடன் அமைதியாக நேரம் செலவிடுங்கள்",
    "ஓய்வு எடுங்கள் — உள் வலிமை திரட்டும் காலம்",
    "ஆலய தரிசனம் & தர்மம் செய்வது நல்லது",
  ],
  en: [
    "Spiritual practice — meditation, japa, puja",
    "Spend quiet time with family and loved ones",
    "Rest and restore — build inner reserves",
    "Temple visit and charitable giving are beneficial",
  ],
};

export function ChandrashtamaCard({ lang, chandrashtamaEnds, descriptionTa, descriptionEn, windowsSummary }: {
  lang: Lang;
  chandrashtamaEnds: string | null | undefined;
  descriptionTa: string | null | undefined;
  descriptionEn: string | null | undefined;
  windowsSummary: string;
}) {
  const [showLearnModal, setShowLearnModal] = useState(false);
  const isTa = lang === "ta";
  const endLabel = chandrashtamaEnds
    ? `${isTa ? "முடியும் நேரம்: " : "Ends: "}${new Date(chandrashtamaEnds).toLocaleString(isTa ? "ta-IN" : "en-IN")}`
    : (isTa ? "இன்று கூடுதல் கவனம் தேவை." : "Extra care advised today.");
  const description = isTa ? descriptionTa : descriptionEn;

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--color-amber-border, #d97706)",
      background: "var(--color-amber-bg, #fffbeb)",
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--space-2)",
        padding: "var(--space-2_5) var(--space-4)",
        background: "var(--color-amber, #d97706)", color: "white",
      }}>
        <span style={{ fontWeight: 800, fontSize: "1rem" }}>!</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>
            {isTa ? "சந்திராஷ்டமம் நடப்பு" : "Chandrashtama is active"}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>
            {windowsSummary ? `${isTa ? "ஜன்ம நட்சத்திர நேரங்கள்" : "Janma star windows"}: ${windowsSummary}` : endLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLearnModal(true)}
          style={{ fontSize: "0.75rem", color: "white", textDecoration: "underline", whiteSpace: "nowrap", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
        >
          {isTa ? "அறிய →" : "Learn →"}
        </button>
      </div>

      {showLearnModal && (
        <DashboardLearnArticleModal slug="what-is-chandrashtama" lang={lang} onClose={() => setShowLearnModal(false)} />
      )}

      {description && (
        <p style={{ margin: 0, padding: "var(--space-2_5) var(--space-4)", fontSize: "0.875rem", color: "var(--panel-earth-dark)", borderBottom: "1px solid var(--color-amber-border, #fde68a)" }}>
          {description}
        </p>
      )}

      {/* Do / Don't */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: "var(--space-2_5) var(--space-4)", borderRight: "1px solid var(--color-amber-border, #fde68a)" }}>
          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--planet-saturn, #b45309)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isTa ? "தவிர்க்கவும்" : "Avoid"}
          </p>
          {(isTa ? CHANDRASHTAMA_AVOID.ta : CHANDRASHTAMA_AVOID.en).map((item) => (
            <p key={item} style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--panel-earth)", lineHeight: 1.4 }}>
              <span style={{ color: "var(--planet-saturn, #b45309)", marginRight: "4px" }}>✕</span>{item}
            </p>
          ))}
        </div>
        <div style={{ padding: "var(--space-2_5) var(--space-4)" }}>
          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--chart-d9-active-dark, #047857)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isTa ? "செய்யலாம்" : "Do"}
          </p>
          {(isTa ? CHANDRASHTAMA_CAN_DO.ta : CHANDRASHTAMA_CAN_DO.en).map((item) => (
            <p key={item} style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--panel-earth)", lineHeight: 1.4 }}>
              <span style={{ color: "var(--chart-d9-active-dark, #047857)", marginRight: "4px" }}>✓</span>{item}
            </p>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, padding: "var(--space-2) var(--space-4)", fontSize: "0.6875rem", color: "var(--panel-mid-earth)", borderTop: "1px solid var(--color-amber-border, #fde68a)", fontStyle: "italic" }}>
        {isTa
          ? "சந்திராஷ்டமம் 'கெட்ட நாள்' அல்ல — இது கவனமாக செயல்பட வேண்டிய காலம். சரியாக திட்டமிட்டால் நன்மை பெறலாம்."
          : "Chandrashtama is not a 'bad day' — it's a time for awareness and care. With right planning, you can still thrive."}
      </p>
    </div>
  );
}
