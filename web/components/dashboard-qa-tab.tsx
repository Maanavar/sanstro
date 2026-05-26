"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { QARegressionReport, QAValidationResponse } from "@/lib/types";

import { Button, Surface } from "./dashboard-ui";
export function QATab({ lang }: { lang: Lang }) {
  const [result, setResult] = useState<QAValidationResponse | null>(null);
  const [regressions, setRegressions] = useState<QARegressionReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runTests() {
    setRunning(true);
    setError(null);
    try {
      const res = await apiFetchJson<QAValidationResponse>("/api/v1/qa/validate");
      setResult(res);
      const reg = await apiFetchJson<QARegressionReport>("/api/v1/qa/regressions");
      setRegressions(reg);
    } catch (e) {
      setError(readErrorMessage(e));
    } finally {
      setRunning(false);
    }
  }

  async function clearRegressions() {
    try {
      await apiFetchJson("/api/v1/qa/regressions", { method: "DELETE" });
      setRegressions({ total_stored: 0, failures: [] });
    } catch (e) {
      setError(readErrorMessage(e));
    }
  }

  const allPass = result && result.total_failed === 0;

  return (
    <div className="tab-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="section-kicker">{t("qa_kicker", lang)}</p>
          <h2 className="section-title">{t("qa_title", lang)}</h2>
          <p className="section-description">{t("qa_desc", lang)}</p>
        </div>
        <Button onClick={() => void runTests()} variant="primary" disabled={running}>
          {running ? t("qa_running", lang) : t("qa_run", lang)}
        </Button>
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "0.82rem" }}>{error}</p>}

      {/* Summary strip */}
      {result && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#4ade80" }}>{result.total_passed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_passed", lang)}</p>
          </div>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: result.total_failed > 0 ? "#f87171" : "#4ade80" }}>{result.total_failed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_failed", lang)}</p>
          </div>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{result.total_passed + result.total_failed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_total", lang)}</p>
          </div>
          {allPass && (
            <div className="card" style={{ padding: "16px 24px", flex: 2, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <span style={{ fontSize: "1.4rem" }}>✓</span>
              <p style={{ margin: 0, fontWeight: 700, color: "#4ade80" }}>{t("qa_all_pass", lang)}</p>
            </div>
          )}
          {!allPass && result.total_failed > 0 && (
            <div className="card" style={{ padding: "16px 24px", flex: 2, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(248,113,113,0.35)" }}>
              <span style={{ fontSize: "1.4rem" }}>⚠</span>
              <p style={{ margin: 0, fontWeight: 700, color: "#f87171" }}>{t("qa_has_failures", lang)}</p>
            </div>
          )}
        </div>
      )}

      {!result && !running && (
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>{t("qa_never_run", lang)}</p>
        </div>
      )}

      {/* Module breakdown */}
      {result && result.modules.map((mod) => (
        <div key={mod.module} className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Module header — clickable to expand/collapse */}
          <button
            type="button"
            onClick={() => setExpanded(expanded === mod.module ? null : mod.module)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", background: "none", border: "none",
              borderBottom: expanded === mod.module ? "1px solid rgba(255,255,255,0.06)" : "none",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
              background: mod.failed === 0 ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
              color: mod.failed === 0 ? "#4ade80" : "#f87171",
              border: `1px solid ${mod.failed === 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}>
              {mod.failed === 0 ? "PASS" : "FAIL"}
            </span>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{mod.module}</span>
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {mod.passed}/{mod.passed + mod.failed} · {expanded === mod.module ? "▲" : "▼"}
            </span>
          </button>

          {/* Case rows */}
          {expanded === mod.module && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {[t("qa_test_id", lang), t("qa_description", lang), t("qa_expected", lang), t("qa_actual", lang), t("qa_status", lang)].map((h) => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mod.cases.map((c) => (
                    <tr key={c.test_id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: c.passed ? "transparent" : "rgba(239,68,68,0.05)" }}>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{c.test_id}</td>
                      <td style={{ padding: "6px 12px", color: "rgba(255,255,255,0.75)", maxWidth: "320px" }}>{c.description}</td>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{String(c.expected)}</td>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: c.passed ? "rgba(255,255,255,0.5)" : "#f87171", whiteSpace: "nowrap" }}>{String(c.actual)}</td>
                      <td style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "999px",
                          background: c.passed ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.15)",
                          color: c.passed ? "#4ade80" : "#f87171",
                        }}>
                          {c.passed ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Regression store */}
      {regressions && (
        <Surface title={t("qa_regressions", lang)}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <Button onClick={() => void clearRegressions()} variant="ghost" disabled={regressions.total_stored === 0}>
              {t("qa_clear_all", lang)}
            </Button>
          </div>
          {regressions.total_stored === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{t("qa_no_regressions", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {regressions.failures.map((f) => (
                <div key={f.test_id} style={{ borderRadius: "8px", border: "1px solid rgba(248,113,113,0.25)", background: "rgba(239,68,68,0.06)", padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#f87171", fontWeight: 700 }}>{f.test_id}</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{f.module}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>×{f.occurrences}</span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>{f.description}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                    expected: <code style={{ color: "#f87171" }}>{String(f.expected)}</code>
                    {" · "}actual: <code style={{ color: "#f87171" }}>{String(f.actual)}</code>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Surface>
      )}
    </div>
  );
}

