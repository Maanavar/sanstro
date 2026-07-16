"use client";

/**
 * Official store-badge assets. The multi-colour Google logo paths are brand
 * assets (Google's mandated colours), intentionally kept here rather than
 * tokenised — this component is the single home for them so page-level styling
 * stays on the `--cl-*` design tokens.
 */
export function GooglePlayBadge({ onClick }: { onClick?: () => void }) {
  return (
    <a
      href="https://play.google.com/store/apps/details?id=ai.vinaadi.app"
      onClick={onClick}
      aria-label="Get Vinaadi on Google Play"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "var(--cl-bg)",
        borderRadius: "12px",
        padding: "12px 20px",
        textDecoration: "none",
        border: "1px solid var(--cl-border)",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.18 23.76C2.48 23.36 2 22.6 2 21.7V2.3C2 1.4 2.48.64 3.18.24L13.88 12 3.18 23.76z" fill="#EA4335" />
        <path d="M17.67 15.54L5.4 22.78l9.3-9.3 2.97 2.06z" fill="#FBBC05" />
        <path d="M21.14 10.53c.55.3.86.84.86 1.47s-.31 1.17-.86 1.47l-3.47 2.07-3.23-3.23 3.23-3.23 3.47 2.45z" fill="#4285F4" />
        <path d="M5.4 1.22L17.67 8.46l-2.97 2.07-9.3-9.31z" fill="#34A853" />
      </svg>
      <div>
        <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--cl-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Get it on
        </p>
        <p style={{ margin: 0, fontSize: "1rem", color: "var(--cl-ink)", fontWeight: 800, lineHeight: 1.2 }}>
          Google Play
        </p>
      </div>
    </a>
  );
}
