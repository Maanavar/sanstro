"use client";

/* Page-level metadata must be exported from a separate server file
   when using "use client". We add it here via a metadata export comment —
   Next.js 15 supports metadata exports alongside client components in the
   same file when the export is at the module level. However, to keep this
   clean we rely on the parent layout's robots default and add noindex via
   a sibling layout file. The login page does not need search visibility. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { estimatePasswordStrength } from "@/lib/password-strength";
import { lt, LEFT_PANEL_FEATURES, type LoginKey } from "@/lib/login-i18n";
import { LangToggle, useLang } from "@/components/lang-toggle";
import { getAuthProviders } from "@vinaadi/shared/api/auth";
import "@/lib/api"; // side effect: initializes the shared API client used by getAuthProviders
import { GuestChartModal } from "@/components/dashboard-guest-chart-modal";
import { LoginWelcomeNova } from "@/components/login-welcome-nova";
import { Eye, EyeOff, Check, Mail } from "lucide-react";
import "./login.css";

type Mode = "login" | "signup" | "forgot" | "reset";

/**
 * The error banner holds either one of OUR strings (by key, so it re-renders in
 * the reader's language when they use the toggle) or a message the SERVER sent
 * (as text, because we cannot translate what the API produced). Storing the
 * rendered string for both would have frozen our own copy in whichever language
 * was active at the moment the error occurred.
 */
type ErrorState = { key: LoginKey } | { text: string } | null;

/** Thrown when a request fails with no `detail` — carries the fallback we own. */
class AuthCopyError extends Error {
  constructor(readonly key: LoginKey) {
    super(key);
  }
}

function toErrorState(err: unknown): ErrorState {
  if (err instanceof AuthCopyError) return { key: err.key };
  if (err instanceof Error && err.message) return { text: err.message };
  return { key: "error_generic" };
}

/* Auth glyphs — lucide (SHD-02). */
function EyeIcon({ open }: { open: boolean }) {
  return open ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />;
}

function CheckIcon() {
  return <Check size={20} strokeWidth={2.5} aria-hidden="true" />;
}

function MailIcon() {
  return <Mail size={20} aria-hidden="true" />;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(pw: string): boolean {
  return pw.length >= 8;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  // `useLang()` rather than a local read of localStorage. The provider in
  // app/layout.tsx is seeded from the lang COOKIE server-side, so the page is
  // rendered in the reader's language instead of painting English and swapping
  // to Tamil a tick after hydration — and `<LangToggle/>` below gives a first
  // -time visitor a way to choose, which a localStorage read alone never could.
  const [lang] = useLang();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // DPDP Act 2023 §6. Starts false, always: a pre-ticked box is not a consent
  // action the user performed.
  const [consentGiven, setConsentGiven] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [resetToken, setResetToken] = useState<string | null>(null);

  const [error, setError] = useState<ErrorState>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"signup" | "forgot" | "reset" | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showGuestChart, setShowGuestChart] = useState(false);
  // Destination to open once the post-login celestial welcome finishes playing.
  const [welcomeDest, setWelcomeDest] = useState<string | null>(null);

  const emailTouched = email.length > 0;
  const emailValid = isValidEmail(email);
  const passwordTouched = password.length > 0;
  const passwordValid = isStrongPassword(password);
  const confirmTouched = confirmPassword.length > 0;
  const confirmMatch = password === confirmPassword;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      setResetToken(token);
      setMode("reset");
      return;
    }
    if (params.get("mode") === "signup") {
      setMode("signup");
    }
    if (params.get("error") === "oauth_failed") {
      setError({ key: "error_oauth_failed" });
    }
  }, []);

  useEffect(() => {
    getAuthProviders()
      .then((providers) => setGoogleEnabled(providers.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setDone(null);
    setPassword("");
    setConfirmPassword("");
    // Cleared with the rest of the form. Consent carried across a mode switch
    // would be a tick the user made in one context reused in another.
    setConsentGiven(false);
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "reset") {
      if (!passwordValid) {
        setError({ key: "error_password_short" });
        return;
      }
      if (!confirmMatch) {
        setError({ key: "error_password_mismatch" });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch("/api/backend/api/v1/auth/reset-password/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          credentials: "include",
          body: JSON.stringify({ token: resetToken, password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          if (payload.detail) throw new Error(payload.detail);
          throw new AuthCopyError("error_reset_link_invalid");
        }
        setDone("reset");
      } catch (err: unknown) {
        setError(toErrorState(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isValidEmail(email)) {
      setError({ key: "error_email_required" });
      return;
    }

    if (mode !== "forgot") {
      if (!passwordValid) {
        setError({ key: "error_password_short" });
        return;
      }
      if (mode === "signup" && !confirmMatch) {
        setError({ key: "error_password_mismatch" });
        return;
      }
      if (mode === "signup" && !consentGiven) {
        setError({ key: "error_consent_required" });
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/backend/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password, consentGiven }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          if (payload.detail) throw new Error(payload.detail);
          throw new AuthCopyError("error_create_failed");
        }
        track("onboarding_step_completed", { step: "account_created" });
        setDone("signup");
      } else if (mode === "login") {
        const response = await fetch("/api/backend/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          if (payload.detail) throw new Error(payload.detail);
          throw new AuthCopyError("error_credentials");
        }
        let dest = "/dashboard";
        try {
          const profileCheck = await fetch("/api/backend/api/v1/birth-profiles/me/latest", { credentials: "include" });
          dest = profileCheck.ok ? "/dashboard" : "/dashboard?setup=1";
          track("onboarding_step_completed", { step: "login", has_profile: profileCheck.ok });
        } catch {
          dest = "/dashboard";
        }
        // Warm the dashboard route behind the welcome curtain so the hand-off is
        // seamless, then play the celestial welcome; it navigates when it ends.
        try { router.prefetch(dest); } catch { /* prefetch is best-effort */ }
        setWelcomeDest(dest);
      } else {
        const response = await fetch("/api/backend/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          if (payload.detail) throw new Error(payload.detail);
          throw new AuthCopyError("error_reset_failed");
        }
        setDone("forgot");
      }
    } catch (err: unknown) {
      setError(toErrorState(err));
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "login" ? lt("title_login", lang)
    : mode === "signup" ? lt("title_signup", lang)
    : mode === "reset" ? lt("title_reset", lang)
    : lt("title_forgot", lang);

  const subtitle =
    mode === "login" ? lt("subtitle_login", lang)
    : mode === "signup" ? lt("subtitle_signup", lang)
    : mode === "reset" ? lt("subtitle_reset", lang)
    : lt("subtitle_forgot", lang);

  /* Password strength 0-4 — entropy-aware (UXD-22), not length-only. The
     helper has accepted a `lang` since it was written; this page passed "en"
     regardless, so the strength label and the four requirement lines stayed
     English underneath a Tamil form. */
  const pwStrengthResult = estimatePasswordStrength(password, lang);
  const pwStrength = pwStrengthResult.score;
  const pwStrengthLabel = pwStrengthResult.label;
  const pwStrengthColor = ["", "var(--planet-saturn)", "var(--chart-d1-active)", "var(--chart-d9-active)", "var(--chart-d9-active-dark)"][pwStrength];

  return (
    <>
      <div className="ca-root">

        {/* ── Left branding panel (desktop ≥1024px) ── */}
        <aside className="ca-left" aria-label={lt("left_panel_aria", lang)}>
          <div className="ca-left-brand">
            <Link href="/" aria-label={lt("brand_home_aria", lang)} className="ca-brand-link">
              <Image
                src="/brand/vinaadi-symbol-icon.png"
                alt=""
                aria-hidden
                width={512}
                height={512}
                className="ca-brand-icon-lg"
                priority
              />
              <span className="ca-left-wordmark">Vinaadi</span>
            </Link>
            <p className="ca-left-tagline">{lt("left_tagline", lang)}</p>
          </div>

          <div>
            <p className="ca-left-headline">
              {lang === "ta" ? <>ஒரு அமைதியான<br />வாசிப்பு.<br /><em>ஒவ்வொரு காலையும்.</em></> : <>One quiet<br />reading.<br /><em>Every morning.</em></>}
            </p>
          </div>

          <ul className="ca-left-features" role="list">
            {LEFT_PANEL_FEATURES.map((f) => (
              <li key={f.en} className="ca-left-feature">
                <span className="ca-left-feature-dot" aria-hidden="true" />
                <p className="ca-left-feature-text">{f[lang]}</p>
              </li>
            ))}
          </ul>

          <Link href="/" className="ca-left-back">{lt("left_back_home", lang)}</Link>
        </aside>

        {/* ── Right form panel ── */}
        <main className="ca-right">
          {/* A-004. The page speaks the reader's language, which until now it
              could only LEARN from a preference set elsewhere in the app —
              unreachable for the one visitor who most needs it, someone
              arriving at /login for the first time. `LangToggle` is the same
              control the marketing pages carry, and writes the same cookie the
              server reads, so the choice survives into the dashboard. */}
          <div className="ca-lang-row">
            <LangToggle />
          </div>
          <div className="ca-card">

            {/* Mobile brand (hidden on desktop via CSS) */}
            <Link href="/" className="ca-card-brand" aria-label={lt("brand_home_aria", lang)}>
              <Image
                src="/brand/vinaadi-symbol-icon.png"
                alt=""
                width={512}
                height={512}
                className="ca-brand-icon-sm"
                priority
              />
              <span className="ca-card-brand-wordmark">Vinaadi</span>
            </Link>

            {/* Heading */}
            <div>
              <h1 className="ca-heading">{title}</h1>
              <p className="ca-subheading">{subtitle}</p>
            </div>

            {/* Mode tabs (login / signup only) */}
            {mode !== "forgot" && mode !== "reset" && (
              <div className="ca-tabs" role="tablist" aria-label={lt("tablist_aria", lang)}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  className={`ca-tab${mode === "login" ? " active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  {lt("tab_sign_in", lang)}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  className={`ca-tab${mode === "signup" ? " active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  {lt("tab_create_account", lang)}
                </button>
              </div>
            )}

            {/* Google SSO — only rendered once the backend confirms it's configured (#55) */}
            {googleEnabled && mode !== "forgot" && mode !== "reset" && !done && (
              <>
                {/* Full-page redirect to the backend OAuth start route (a proxied
                    API path, not a Next page) — a client-side <Link> would break
                    the OAuth flow, so the native <a> is intentional. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/backend/api/v1/auth/oauth/google/start"
                  className="ca-google-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.998 11.998 0 0 0 12 24Z"/>
                    <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.75l4.01-3.11Z"/>
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.63l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z"/>
                  </svg>
                  {lt("google_continue", lang)}
                </a>
                <div className="ca-divider"><span>{lt("divider_or", lang)}</span></div>
              </>
            )}

            {/* ── Success states ── */}
            {done === "signup" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><CheckIcon /></div>
                <p className="ca-success-title">{lt("success_signup_title", lang)}</p>
                <p className="ca-success-body">{lt("success_signup_body", lang)}</p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  {lt("success_go_sign_in", lang)}
                </button>
              </div>
            )}

            {done === "forgot" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><MailIcon /></div>
                <p className="ca-success-title">{lt("success_forgot_title", lang)}</p>
                <p className="ca-success-body">
                  {lt("success_forgot_prefix", lang)}{" "}
                  <strong className="ca-email-strong">{email}</strong>,{" "}
                  {lt("success_forgot_suffix", lang)}
                </p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  {lt("back_to_sign_in", lang)}
                </button>
              </div>
            )}

            {done === "reset" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><CheckIcon /></div>
                <p className="ca-success-title">{lt("success_reset_title", lang)}</p>
                <p className="ca-success-body">{lt("success_reset_body", lang)}</p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  {lt("success_go_sign_in", lang)}
                </button>
              </div>
            )}

            {/* ── Form ── */}
            {!done && (
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="ca-form"
                noValidate
              >
                {/* Email — not shown for reset mode (identity comes from the token) */}
                {mode !== "reset" && (
                  <div className="ca-field">
                    <label className="ca-label" htmlFor="ca-email">{lt("label_email", lang)}</label>
                    <input
                      id="ca-email"
                      className={`ca-input${emailTouched && !emailValid ? " is-error" : emailTouched && emailValid ? " is-valid" : ""}`}
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      aria-invalid={emailTouched && !emailValid}
                      aria-describedby={emailTouched && !emailValid ? "ca-email-error" : undefined}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    />
                    {emailTouched && !emailValid && (
                      <span id="ca-email-error" className="ca-hint is-error" role="alert">{lt("error_email_invalid", lang)}</span>
                    )}
                  </div>
                )}

                {/* Password */}
                {mode !== "forgot" && (
                  <div className="ca-field">
                    <label className="ca-label" htmlFor="ca-password">{lt(mode === "reset" ? "label_new_password" : "label_password", lang)}</label>
                    <div className="ca-input-wrap">
                      <input
                        id="ca-password"
                        className={`ca-input has-icon${passwordTouched && !passwordValid ? " is-error" : passwordTouched && passwordValid ? " is-valid" : ""}`}
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"}
                        required
                        placeholder={mode === "signup" || mode === "reset" ? lt("placeholder_password_new", lang) : "••••••••"}
                        value={password}
                        aria-invalid={passwordTouched && !passwordValid ? "true" : undefined}
                        aria-describedby={(mode === "signup" || mode === "reset") && password.length > 0 ? "ca-password-reqs" : undefined}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      />
                      <button
                        type="button"
                        className="ca-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={lt(showPassword ? "hide_password" : "show_password", lang)}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>

                    {/* Strength bars — signup and reset */}
                    {(mode === "signup" || mode === "reset") && passwordTouched && (
                      <div className="ca-pw-strength" aria-hidden="true">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="ca-pw-bar"
                            style={{
                              background: i <= pwStrength ? pwStrengthColor : "var(--panel-tan-light)",
                            }}
                          />
                        ))}
                        <span
                          className="ca-pw-label"
                          style={{ color: pwStrengthColor }}
                        >
                          {pwStrengthLabel}
                        </span>
                      </div>
                    )}

                    {/* UXD-22 — requirements shown up front as the user types, not
                        only as a post-submit error. */}
                    {(mode === "signup" || mode === "reset") && password.length > 0 && (
                      <ul id="ca-password-reqs" style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: "4px" }}>
                        {pwStrengthResult.requirements.map((req) => (
                          <li
                            key={req.label}
                            style={{
                              display: "flex", alignItems: "center", gap: "7px",
                              fontSize: "0.72rem", lineHeight: 1.3,
                              color: req.met ? "var(--color-positive, #3F7A4E)" : "var(--color-muted, #7A6F5E)",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: "12px", height: "12px", flexShrink: 0, borderRadius: "50%",
                                background: req.met ? "var(--color-positive, #3F7A4E)" : "transparent",
                                border: req.met ? "none" : "1.5px solid currentColor",
                              }}
                            />
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Forgot link — login only */}
                    {mode === "login" && (
                      <div className="ca-forgot">
                        <button
                          type="button"
                          className="ca-text-btn"
                          onClick={() => switchMode("forgot")}
                        >
                          {lt("forgot_password", lang)}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm password — signup and reset */}
                {(mode === "signup" || mode === "reset") && (
                  <div className="ca-field">
                    <label className="ca-label" htmlFor="ca-confirm">{lt(mode === "reset" ? "label_confirm_new" : "label_confirm", lang)}</label>
                    <div className="ca-input-wrap">
                      <input
                        id="ca-confirm"
                        className={`ca-input has-icon${confirmTouched && !confirmMatch ? " is-error" : confirmTouched && confirmMatch && passwordValid ? " is-valid" : ""}`}
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder={lt("placeholder_confirm", lang)}
                        value={confirmPassword}
                        aria-invalid={confirmTouched && !confirmMatch ? "true" : undefined}
                        aria-describedby={confirmTouched && !confirmMatch ? "ca-confirm-error" : undefined}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      />
                      <button
                        type="button"
                        className="ca-eye"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                        aria-label={lt(showConfirm ? "hide_confirm" : "show_confirm", lang)}
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {confirmTouched && !confirmMatch && (
                      <span id="ca-confirm-error" className="ca-hint is-error" role="alert">{lt("error_confirm_mismatch", lang)}</span>
                    )}
                  </div>
                )}

                {/* Privacy consent — signup only. DPDP Act 2023 §6 requires a
                    specific, informed, unambiguous action before birth data is
                    collected, so this starts unticked and the submit is blocked
                    until it is ticked. A pre-ticked box is not an action the
                    user took, and the backend rejects a missing or false value
                    rather than inferring one. */}
                {mode === "signup" && (
                  <div className="ca-field">
                    <label className="ca-consent" htmlFor="ca-consent">
                      <input
                        id="ca-consent"
                        type="checkbox"
                        checked={consentGiven}
                        aria-describedby="ca-consent-text"
                        onChange={(e) => { setConsentGiven(e.target.checked); setError(null); }}
                      />
                      <span id="ca-consent-text">
                        {lt("consent_prefix", lang)}{" "}
                        <Link href="/privacy" className="ca-link" target="_blank" rel="noreferrer">
                          {lt("consent_privacy_link", lang)}
                        </Link>
                        {lt("consent_suffix", lang)}
                      </span>
                    </label>
                  </div>
                )}

                {/* Error banner */}
                {error && <div className="ca-error" role="alert">{"key" in error ? lt(error.key, lang) : error.text}</div>}

                {/* Submit */}
                <button type="submit" className="ca-btn" disabled={loading}>
                  {loading
                    ? lt("submit_loading", lang)
                    : mode === "login"
                      ? lt("submit_sign_in", lang)
                      : mode === "signup"
                        ? lt("submit_create", lang)
                        : mode === "reset"
                          ? lt("submit_update_password", lang)
                          : lt("submit_send_reset", lang)}
                </button>

                {/* Back to sign in — forgot/reset modes */}
                {(mode === "forgot" || mode === "reset") && (
                  <p className="ca-center-row">
                    <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                      {lt("back_to_sign_in", lang)}
                    </button>
                  </p>
                )}
              </form>
            )}

            {/* Terms — signup only */}
            {!done && mode === "signup" && (
              <p className="ca-terms">
                {lt("terms_prefix", lang)}{" "}
                <Link href="/terms">{lt("terms_link", lang)}</Link> {lt("terms_and", lang)}{" "}
                <Link href="/privacy">{lt("privacy_link", lang)}</Link>.
              </p>
            )}

            {/* Footer switch hint */}
            {!done && mode !== "forgot" && mode !== "reset" && (
              <p className="ca-footer">
                {mode === "login" ? (
                  <>{lt("footer_no_account", lang)}{" "}
                    <button type="button" className="ca-text-btn ca-footer-switch" onClick={() => switchMode("signup")}>
                      {lt("footer_create_one", lang)}
                    </button>
                  </>
                ) : (
                  <>{lt("footer_have_account", lang)}{" "}
                    <button type="button" className="ca-text-btn ca-footer-switch" onClick={() => switchMode("login")}>
                      {lt("footer_sign_in", lang)}
                    </button>
                  </>
                )}
              </p>
            )}

            {/* No-account path (#5) — the guest chart preview already exists and
                works end-to-end (POST /api/v1/public/chart), it just had no link
                pointing to it anywhere in the product. */}
            {!done && mode !== "forgot" && mode !== "reset" && (
              <p className="ca-footer">
                <button type="button" className="ca-text-btn" onClick={() => setShowGuestChart(true)}>
                  {lt("guest_chart_cta", lang)}
                </button>
              </p>
            )}

          </div>
        </main>
      </div>

      {showGuestChart && (
        <GuestChartModal
          lang={lang}
          onClose={() => setShowGuestChart(false)}
          onCreateAccount={() => { setShowGuestChart(false); switchMode("signup"); }}
        />
      )}

      {welcomeDest && (
        <LoginWelcomeNova
          // No saved chart yet (routed to setup) ⇒ a genuine first arrival, so the
          // curtain greets with "Welcome" rather than "Welcome back".
          firstTime={welcomeDest.includes("setup=1")}
          // UXD-21 — reserve the grand ray-burst reveal for the biggest arrival:
          // a first-ever login. Routine returns get the calmer standard reveal.
          grand={welcomeDest.includes("setup=1")}
          milestoneLabel={welcomeDest.includes("setup=1") ? "Your first sky awaits" : undefined}
          onDone={() => router.push(welcomeDest)}
        />
      )}
    </>
  );
}
