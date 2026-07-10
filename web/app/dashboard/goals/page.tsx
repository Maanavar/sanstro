"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, toQuery } from "@/lib/api";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, BirthProfileSnapshot } from "@/lib/types";

interface GoalData {
  goalId: string;
  chartId: string;
  goalType: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GoalListData {
  chartId: string;
  goals: GoalData[];
}

const GOAL_TYPES = [
  { key: "career",    labelEn: "Career",    labelTa: "தொழில்" },
  { key: "marriage",  labelEn: "Marriage",  labelTa: "திருமணம்" },
  { key: "education", labelEn: "Education", labelTa: "கல்வி" },
  { key: "health",    labelEn: "Health",    labelTa: "உடல் நலம்" },
  { key: "wealth",    labelEn: "Wealth",    labelTa: "செல்வம்" },
  { key: "family",    labelEn: "Family",    labelTa: "குடும்பம்" },
  { key: "spiritual", labelEn: "Spiritual", labelTa: "ஆன்மீகம்" },
  { key: "property",  labelEn: "Property",  labelTa: "சொத்து" },
  { key: "travel",    labelEn: "Travel",    labelTa: "பயணம்" },
  { key: "general",   labelEn: "General",   labelTa: "பொது" },
] as const;

const GOAL_ICONS: Record<string, string> = {
  career: "💼", marriage: "💍", education: "📚", health: "🌿",
  wealth: "💰", family: "🏠", spiritual: "🪔", property: "🏡",
  travel: "✈️", general: "⭐",
};

type ProfileResponse = { data: BirthProfileSnapshot };

export default function GoalsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [chartId, setChartId] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const ta = lang === "ta";

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as Lang);

    void (async () => {
      try {
        const profile = await apiFetchJson<ProfileResponse>("/api/v1/birth-profiles/me/latest");
        const cId = profile.data.chartId;
        if (!cId) throw new Error("No chart found. Please complete your birth profile.");
        setChartId(cId);

        const res = await apiFetchJson<ApiEnvelope<GoalListData>>(
          `/api/v1/goals${toQuery({ chartId: cId, activeOnly: true })}`
        );
        setGoals(res.data.goals);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("not authenticated")) {
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleCreate() {
    if (!chartId || !selectedType) return;
    setCreating(true);
    try {
      const res = await apiFetchJson<ApiEnvelope<GoalData>>("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartId,
          goalType: selectedType,
          description: description.trim() || null,
          languagePreference: "ta-en",
        }),
      });
      setGoals((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setSelectedType("");
      setDescription("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(goalId: string) {
    try {
      await apiFetchJson(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((g) => g.goalId !== goalId));
    } catch {
      setError(ta ? "நீக்க முடியவில்லை" : "Failed to remove goal");
    }
  }

  const GOAL_TYPE_LABEL = (key: string) => {
    const t = GOAL_TYPES.find((g) => g.key === key);
    return t ? (ta ? t.labelTa : t.labelEn) : key;
  };

  return (
    <div className="cd-shell" style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-muted)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← {ta ? "திரும்பு" : "Back"}
          </button>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
            {ta ? "என் இலக்குகள்" : "My Goals"}
          </h1>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", fontSize: "0.85rem", color: "var(--color-text)" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ height: "120px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)", fontSize: "0.85rem" }}>
            {ta ? "ஏற்றுகிறது…" : "Loading…"}
          </div>
        )}

        {!loading && (
          <>
            {/* Add goal button */}
            {!showCreate && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                style={{
                  padding: "12px 20px", borderRadius: "12px",
                  border: "2px dashed var(--color-border)",
                  background: "transparent", color: "var(--color-muted)",
                  fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                  textAlign: "center",
                }}
              >
                + {ta ? "புதிய இலக்கு சேர்க்கவும்" : "Add a new goal"}
              </button>
            )}

            {/* Create form */}
            {showCreate && (
              <div style={{ padding: "20px", borderRadius: "14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-strong)" }}>
                  {ta ? "இலக்கு வகை தேர்ந்தெடுக்கவும்" : "Select goal type"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
                  {GOAL_TYPES.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setSelectedType(g.key)}
                      style={{
                        padding: "10px 6px", borderRadius: "10px", cursor: "pointer",
                        border: selectedType === g.key ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                        background: selectedType === g.key ? "var(--color-mid-bg)" : "transparent",
                        fontWeight: selectedType === g.key ? 700 : 400,
                        fontSize: "0.8rem", color: "var(--color-text)", textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{GOAL_ICONS[g.key] ?? "⭐"}</div>
                      {ta ? g.labelTa : g.labelEn}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-muted)" }}>
                    {ta ? "விரிவான விளக்கம் (விருப்பப்படி)" : "Description (optional)"}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={ta ? "உங்கள் இலக்கை விவரிக்கவும்…" : "Describe your goal…"}
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "10px 12px",
                      borderRadius: "8px", border: "1px solid var(--color-border)",
                      background: "var(--color-bg)", color: "var(--color-text)",
                      fontSize: "0.85rem", resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={!selectedType || creating}
                    className="button button--primary"
                    style={{ padding: "10px 20px", opacity: !selectedType ? 0.5 : 1 }}
                  >
                    {creating ? (ta ? "சேர்க்கிறது…" : "Adding…") : (ta ? "சேர்க்கவும்" : "Add Goal")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setSelectedType(""); setDescription(""); }}
                    style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-muted)", fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    {ta ? "ரத்து" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Goals list */}
            {goals.length === 0 && !showCreate && (
              <div style={{ padding: "40px 24px", borderRadius: "14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "2rem" }}>🌱</p>
                <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {ta ? "இன்னும் இலக்குகள் இல்லை" : "No goals yet"}
                </p>
                <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.82rem" }}>
                  {ta
                    ? "ஒரு இலக்கு சேர்க்கவும் — Vinaadi உங்கள் ஜாதகம் அந்த இலக்கை எவ்வாறு ஆதரிக்கிறது என்று காட்டும்."
                    : "Add a goal and Vinaadi will show how your chart supports it with daily and dasha context."}
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {goals.map((goal) => (
                <div
                  key={goal.goalId}
                  style={{ padding: "16px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", gap: "14px" }}
                >
                  <span style={{ fontSize: "1.6rem" }}>{GOAL_ICONS[goal.goalType] ?? "⭐"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-strong)" }}>
                      {GOAL_TYPE_LABEL(goal.goalType)}
                    </p>
                    {goal.description && (
                      <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                        {goal.description}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-faint)" }}>
                      {new Date(goal.createdAt).toLocaleDateString(ta ? "ta-IN" : "en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeactivate(goal.goalId)}
                    title={ta ? "நீக்கவும்" : "Remove"}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: "1rem", padding: "4px 8px", borderRadius: "6px", opacity: 0.55 }}
                    aria-label={ta ? "நீக்கவும்" : "Remove goal"}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
