import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { scoreColorPct } from "@/lib/format";
import type { PoruthamShareViewData } from "@vinaadi/shared/api/porutham-shares";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

async function fetchShare(token: string): Promise<PoruthamShareViewData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/porutham-shares/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: PoruthamShareViewData };
    return json.data ?? null;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await fetchShare(token);
  if (!data) return { title: "Porutham Result | Vinaadi AI" };

  const names = [data.labelA, data.labelB].filter(Boolean).join(" & ") || "This match";
  const title = `${names} — ${data.totalScore}/${data.maxScore} Porutham | Vinaadi AI`;
  const description = data.summary.en || "View this Tamil marriage porutham (compatibility) result — shared via Vinaadi AI.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

function KutaRow({ nameEn, nameTa, passed }: { nameEn: string; nameTa: string; passed: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
      borderBottom: "1px solid var(--cl-border)",
    }}>
      <p style={{ margin: 0, flex: 1, fontSize: "0.86rem", color: "var(--cl-ink)" }}>
        {nameEn} <span style={{ fontSize: "0.75rem", color: "var(--cl-muted)" }}>· {nameTa}</span>
      </p>
      <span style={{
        fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px",
        background: passed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        color: passed ? "#22a55a" : "#e5484d",
        border: `1px solid ${passed ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)"}`,
      }}>
        {passed ? "✓ Pass" : "✗ Fail"}
      </span>
    </div>
  );
}

export default async function PoruthamSharePage({ params }: Props) {
  const { token } = await params;
  const data = await fetchShare(token);

  if (!data) {
    return (
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section style={{ padding: "64px 0" }}>
            <div className="cl-container" style={{ textAlign: "center", maxWidth: "40rem", marginInline: "auto" }}>
              <h1 className="cl-pub-h1" style={{ marginBottom: "12px" }}>This link is no longer available</h1>
              <p className="cl-pub-lead" style={{ marginBottom: "24px" }}>
                The porutham result may have been revoked, or the share link has expired (links last 30 days).
              </p>
              <Link href="/dashboard" className="cl-btn cl-btn--solid">Go to Vinaadi AI →</Link>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const pct = data.totalScore / Math.max(1, data.maxScore);
  const names = [data.labelA, data.labelB].filter(Boolean).join(" & ");

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Porutham Result · பொருத்தம் முடிவு</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "28ch" }}>
              {names || "Marriage Compatibility"}
            </h1>
            <p className="cl-pub-lead">Shared via Vinaadi AI · Thirukanitham-based calculation</p>
          </div>
        </section>

        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Score hero */}
            <div style={{
              background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px",
              padding: "24px", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center",
            }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                  Total Score
                </p>
                <p style={{ margin: 0, fontSize: "2.6rem", fontWeight: 900, lineHeight: 1, color: scoreColorPct(pct) }}>
                  {data.totalScore}
                  <span style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--cl-muted)" }}>/{data.maxScore}</span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                  {data.label} · {data.percentage.toFixed(0)}%
                </p>
                {(data.rajjuDosha || data.vedhaDosha || data.nadiDosha.hasNadiDosha) && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {data.rajjuDosha && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.12)", color: "#e5484d", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ Rajju Dosha</span>}
                    {data.vedhaDosha && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.12)", color: "#e5484d", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ Vedha Dosha</span>}
                    {data.nadiDosha.hasNadiDosha && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.12)", color: "#e5484d", border: "1px solid rgba(248,113,113,0.3)" }}>⚠ Nadi Dosha</span>}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--cl-ink)", lineHeight: 1.6 }}>
                  {data.summary.en}
                </p>
                {data.summary.ta && (
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                    {data.summary.ta}
                  </p>
                )}
                {data.contextNote && (
                  <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "var(--cl-muted)", lineHeight: 1.5 }}>
                    {data.contextNote.en}
                  </p>
                )}
              </div>
            </div>

            {/* Nakshatra pair */}
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                  {data.labelA || "Person A"} Nakshatra
                </p>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>{data.boyNakshatraName}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                  {data.labelB || "Person B"} Nakshatra
                </p>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>{data.girlNakshatraName}</p>
              </div>
            </div>

            {/* Kuta breakdown */}
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 6px" }}>
                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--cl-muted)" }}>
                  Tamil 10 Poruthams · தமிழ் 10 பொருத்தங்கள்
                </p>
              </div>
              {data.kutas.map((k) => (
                <KutaRow key={k.name} nameEn={k.name} nameTa={k.nameTa} passed={k.passed} />
              ))}
            </div>

            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--cl-muted)", fontStyle: "italic" }}>
              This is a read-only shared result. It does not include birth details or personal information.
            </p>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Check your own compatibility</h2>
              <p className="cl-cta-strip__body">Create a free account for the full compatibility intelligence report, charts, and daily guidance.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
