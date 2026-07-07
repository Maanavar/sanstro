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
import { getAuthProviders } from "@vinaadi/shared/api/auth";
import "@/lib/api"; // side effect: initializes the shared API client used by getAuthProviders
import { GuestChartModal } from "@/components/dashboard-guest-chart-modal";

type Mode = "login" | "signup" | "forgot" | "reset";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(pw: string): boolean {
  return pw.length >= 8;
}

const leftPanelFeatures = [
  { icon: "◎", text: "Thirukanitham accuracy — Lahiri ayanamsa, Drik ephemeris" },
  { icon: "☽", text: "Daily Dasa, Gochar & Panchangam in plain language" },
  { icon: "⊕", text: "Family vault — group charts, shared fortune windows" },
  { icon: "✦", text: "Yogas & Dosham explained transparently, not just a verdict" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [resetToken, setResetToken] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"signup" | "forgot" | "reset" | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showGuestChart, setShowGuestChart] = useState(false);

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
      setError("Google sign-in didn't complete. Please try again or use email instead.");
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
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "reset") {
      if (!passwordValid) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!confirmMatch) {
        setError("Passwords do not match.");
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
          throw new Error(payload.detail ?? "This reset link is invalid or has expired.");
        }
        setDone("reset");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode !== "forgot") {
      if (!passwordValid) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (mode === "signup" && !confirmMatch) {
        setError("Passwords do not match.");
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
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          throw new Error(payload.detail ?? "Unable to create account.");
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
          throw new Error(payload.detail ?? "Incorrect email or password.");
        }
        try {
          const profileCheck = await fetch("/api/backend/api/v1/birth-profiles/me/latest", { credentials: "include" });
          const dest = profileCheck.ok ? "/dashboard" : "/dashboard?setup=1";
          track("onboarding_step_completed", { step: "login", has_profile: profileCheck.ok });
          router.push(dest);
        } catch {
          router.push("/dashboard");
        }
      } else {
        const response = await fetch("/api/backend/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          throw new Error(payload.detail ?? "Unable to process reset request.");
        }
        setDone("forgot");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "login" ? "Welcome back"
    : mode === "signup" ? "Create your account"
    : mode === "reset" ? "Set a new password"
    : "Reset your password";

  const subtitle =
    mode === "login" ? "Sign in to your Vinaadi workspace"
    : mode === "signup" ? "Start your morning reading practice"
    : mode === "reset" ? "Choose a new password for your account"
    : "We'll send a reset link to your email";

  /* Password strength level 0-4 */
  const pwStrength = password.length < 1 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : password.length < 16 ? 3 : 4;
  const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const pwStrengthColor = ["", "var(--planet-saturn)", "var(--chart-d1-active)", "var(--chart-d9-active)", "var(--chart-d9-active-dark)"][pwStrength];

  return (
    <>
      <style>{`
        /* ── Clarity Auth — warm cream design system ── */
        .ca-root {
          min-height: 100vh;
          display: flex;
          background: var(--panel-hover);
          font-family: var(--font-body), var(--font-tamil), system-ui, sans-serif;
          color: var(--panel-earth);
        }

        /* ── Left branding panel (desktop ≥1024px) ── */
        .ca-left {
          display: none;
          width: 420px;
          flex-shrink: 0;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          background: var(--cl-bg-2);
          border-right: 1px solid var(--panel-tan-light);
          position: relative;
          overflow: hidden;
        }
        .ca-left::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -80px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow-brand) 0%, transparent 70%);
          pointer-events: none;
        }
        .ca-left::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--ring-success) 0%, transparent 70%);
          pointer-events: none;
        }
        @media (min-width: 1024px) {
          .ca-left { display: flex; }
          .ca-right { padding: 32px 64px; }
          .ca-card-brand { display: none; }
        }

        .ca-left-brand {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .ca-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .ca-brand-icon-lg {
          width: 36px;
          height: 36px;
        }
        .ca-brand-icon-sm {
          width: 24px;
          height: 24px;
        }
        .ca-left-wordmark {
          font-family: var(--font-display), Georgia, serif;
          font-size: 1.75rem;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: var(--panel-earth-dark);
          line-height: 1;
          margin: 0;
          text-decoration: none;
        }
        .ca-left-wordmark:hover { color: var(--panel-earth); }
        .ca-left-tagline {
          margin: 8px 0 0;
          font-size: 0.83rem;
          color: var(--panel-warm-muted);
          line-height: 1.6;
          max-width: 300px;
        }

        .ca-left-headline {
          position: relative;
          z-index: 1;
          font-family: var(--font-display), Georgia, serif;
          font-size: clamp(2rem, 3vw, 2.5rem);
          font-weight: 500;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--panel-earth-dark);
          margin: 0 0 8px;
        }
        .ca-left-headline em {
          font-style: italic;
          color: var(--panel-warm-muted);
        }

        .ca-left-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .ca-left-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .ca-left-feature-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--chart-d1-active);
          flex-shrink: 0;
          margin-top: 0.45em;
        }
        .ca-left-feature-text {
          margin: 0;
          font-size: 0.84rem;
          color: var(--panel-earth);
          line-height: 1.55;
        }

        .ca-left-back {
          font-size: 0.78rem;
          color: var(--panel-faint);
          text-decoration: none;
          position: relative;
          z-index: 1;
          transition: color 150ms ease;
        }
        .ca-left-back:hover { color: var(--panel-earth-dark); }

        /* ── Right form panel ── */
        .ca-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          position: relative;
        }

        /* Subtle decorative arc behind the form */
        .ca-right::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          border: 1px solid var(--panel-tan-light);
          pointer-events: none;
          opacity: 0.5;
        }

        .ca-card {
          width: min(440px, 100%);
          background: var(--cl-surface);
          border: 1px solid var(--panel-tan-light);
          border-radius: 24px;
          padding: 36px 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 8px 40px var(--shadow-card);
          position: relative;
          z-index: 1;
        }

        /* Mobile brand shown inside card */
        .ca-card-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 4px;
          text-decoration: none;
        }
        .ca-card-brand-wordmark {
          font-family: var(--font-display), Georgia, serif;
          font-size: 1.35rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: var(--panel-earth-dark);
          transition: color 150ms ease;
        }
        .ca-card-brand:hover .ca-card-brand-wordmark { color: var(--panel-warm-muted); }

        /* Card heading */
        .ca-heading {
          margin: 0 0 4px;
          font-family: var(--font-display), Georgia, serif;
          font-size: 1.6rem;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: var(--panel-earth-dark);
          line-height: 1.1;
        }
        .ca-subheading {
          margin: 0;
          font-size: 0.85rem;
          color: var(--panel-warm-muted);
          line-height: 1.5;
        }

        /* Google SSO button + divider */
        .ca-google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          border-radius: 999px;
          border: 1.5px solid var(--panel-tan);
          background: var(--cl-surface);
          color: var(--panel-earth-dark);
          font-size: 0.87rem;
          font-weight: 600;
          font-family: inherit;
          text-decoration: none;
          cursor: pointer;
          min-height: 44px;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .ca-google-btn:hover {
          border-color: var(--chart-d1-active);
          background: var(--veil-white-50);
        }
        .ca-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: -4px 0;
          font-size: 0.76rem;
          color: var(--panel-faint);
        }
        .ca-divider::before, .ca-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--panel-tan-light);
        }

        /* Mode toggle tabs */
        .ca-tabs {
          display: flex;
          background: var(--cl-bg-2);
          border: 1.5px solid var(--panel-tan);
          border-radius: 12px;
          padding: 4px;
          gap: 3px;
        }
        .ca-tab {
          flex: 1;
          padding: 9px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--panel-warm-muted);
          font-size: 0.87rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
          min-height: 40px;
        }
        .ca-tab.active {
          background: var(--cl-surface);
          color: var(--panel-earth-dark);
          box-shadow: 0 1px 6px var(--shadow-tab);
        }
        .ca-tab:hover:not(.active) {
          background: var(--veil-white-50);
          color: var(--panel-earth);
        }

        /* Fields */
        .ca-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ca-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--panel-earth);
          letter-spacing: 0.01em;
        }
        .ca-input-wrap { position: relative; }
        .ca-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--panel-tan);
          background: var(--cl-surface);
          color: var(--panel-earth-dark);
          font-size: 0.9rem;
          font-family: inherit;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
        }
        .ca-input::placeholder { color: var(--panel-faint); }
        .ca-input:hover { border-color: var(--chart-d1-active); }
        .ca-input:focus {
          border-color: var(--chart-d1-active);
          box-shadow: 0 0 0 3px var(--ring-brand);
        }
        .ca-input:-webkit-autofill,
        .ca-input:-webkit-autofill:hover,
        .ca-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--cl-surface) inset, 0 0 0 3px var(--ring-brand);
          -webkit-text-fill-color: var(--panel-earth-dark);
          border-color: var(--chart-d1-active);
          transition: background-color 9999s ease-in-out 0s;
        }
        .ca-input.has-icon { padding-right: 44px; }
        .ca-input.is-error { border-color: var(--planet-saturn); box-shadow: 0 0 0 3px var(--ring-error); }
        .ca-input.is-valid { border-color: var(--chart-d9-active); box-shadow: 0 0 0 3px var(--ring-success); }

        /* Eye toggle */
        .ca-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          color: var(--panel-faint);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          min-height: 36px;
          transition: color 150ms ease;
        }
        .ca-eye:hover { color: var(--panel-earth); }

        /* Hint text */
        .ca-hint {
          font-size: 0.74rem;
          color: var(--panel-faint);
          margin-top: 1px;
          line-height: 1.4;
        }
        .ca-hint.is-error { color: var(--planet-saturn); }

        /* Forgot password link */
        .ca-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: -4px;
        }
        .ca-text-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--chart-d1-active);
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: var(--underline-brand);
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          transition: color 150ms ease, text-decoration-color 150ms ease;
        }
        .ca-text-btn:hover {
          color: var(--planet-lagna);
          text-decoration-color: var(--underline-brand-strong);
        }

        /* Password strength */
        .ca-pw-strength {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          align-items: center;
        }
        .ca-pw-bar {
          height: 3px;
          flex: 1;
          border-radius: 999px;
          background: var(--panel-tan-light);
          transition: background 200ms ease;
        }
        .ca-pw-label {
          font-size: 0.7rem;
          font-weight: 600;
          min-width: 36px;
          text-align: right;
          transition: color 200ms ease;
        }

        /* Error banner */
        .ca-error {
          padding: 11px 14px;
          border-radius: 10px;
          background: var(--panel-warm-tint);
          border: 1px solid var(--border-error-soft);
          color: var(--planet-saturn);
          font-size: 0.84rem;
          line-height: 1.5;
        }

        /* Submit button */
        .ca-btn {
          width: 100%;
          padding: 13px 20px;
          border-radius: 999px;
          border: none;
          background: var(--panel-earth-dark);
          color: var(--panel-hover);
          font-size: 0.92rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 150ms ease, transform 120ms ease, box-shadow 150ms ease;
          letter-spacing: 0.01em;
          min-height: 48px;
          margin-top: 4px;
        }
        .ca-btn:hover:not(:disabled) {
          background: var(--panel-earth);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px var(--shadow-btn);
        }
        .ca-btn:active:not(:disabled) { transform: translateY(0); }
        .ca-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Success state */
        .ca-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
          padding: 8px 0;
        }
        .ca-success-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--chart-d9-lagna-bg);
          border: 1px solid var(--border-success-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--chart-d9-active);
        }
        .ca-success-title {
          margin: 0;
          font-family: var(--font-display), Georgia, serif;
          font-size: 1.2rem;
          font-weight: 500;
          color: var(--panel-earth-dark);
        }
        .ca-success-body {
          margin: 0;
          font-size: 0.85rem;
          color: var(--panel-warm-muted);
          line-height: 1.65;
          max-width: 300px;
        }
        .ca-email-strong {
          color: var(--panel-earth);
        }
        .ca-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ca-center-row {
          margin: 0;
          text-align: center;
        }
        .ca-footer-switch {
          font-size: 0.82rem;
        }

        /* Footer row */
        .ca-footer {
          text-align: center;
          font-size: 0.82rem;
          color: var(--panel-warm-muted);
          line-height: 1.5;
        }
        .ca-footer a {
          color: var(--chart-d1-active);
          text-decoration: none;
          font-weight: 500;
        }
        .ca-footer a:hover { text-decoration: underline; }

        /* Terms */
        .ca-terms {
          margin: 0;
          font-size: 0.74rem;
          color: var(--panel-faint);
          text-align: center;
          line-height: 1.6;
        }
        .ca-terms a {
          color: var(--panel-warm-muted);
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .ca-right {
            padding: 18px 14px;
          }

          .ca-card {
            padding: 28px 20px 22px;
            border-radius: 20px;
            gap: 20px;
          }

          .ca-heading {
            font-size: 1.4rem;
          }

          .ca-tabs {
            gap: 4px;
          }

          .ca-tab {
            padding-inline: 10px;
            font-size: 0.82rem;
          }
        }

        @media (max-width: 420px) {
          .ca-root {
            min-height: 100dvh;
          }

          .ca-right {
            padding: 12px;
          }

          .ca-card {
            padding: 24px 16px 18px;
            border-radius: 18px;
          }

          .ca-subheading,
          .ca-footer,
          .ca-terms {
            font-size: 0.78rem;
          }

          .ca-btn {
            min-height: 46px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ca-btn, .ca-tab, .ca-input, .ca-text-btn, .ca-pw-bar {
            transition: none !important;
          }
          .ca-btn:hover:not(:disabled) { transform: none; }
        }
      `}</style>

      <div className="ca-root">

        {/* ── Left branding panel (desktop ≥1024px) ── */}
        <aside className="ca-left" aria-label="Vinaadi features">
          <div className="ca-left-brand">
            <Link href="/" aria-label="Vinaadi home" className="ca-brand-link">
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
            <p className="ca-left-tagline">
              Thirukanitham-based Tamil astrology for daily life and family planning.
            </p>
          </div>

          <div>
            <p className="ca-left-headline">
              One quiet<br />reading.<br /><em>Every morning.</em>
            </p>
          </div>

          <ul className="ca-left-features" role="list">
            {leftPanelFeatures.map((f) => (
              <li key={f.text} className="ca-left-feature">
                <span className="ca-left-feature-dot" aria-hidden="true" />
                <p className="ca-left-feature-text">{f.text}</p>
              </li>
            ))}
          </ul>

          <Link href="/" className="ca-left-back">← Back to home</Link>
        </aside>

        {/* ── Right form panel ── */}
        <main className="ca-right">
          <div className="ca-card">

            {/* Mobile brand (hidden on desktop via CSS) */}
            <Link href="/" className="ca-card-brand" aria-label="Vinaadi home">
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
              <div className="ca-tabs" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  className={`ca-tab${mode === "login" ? " active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  className={`ca-tab${mode === "signup" ? " active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </div>
            )}

            {/* Google SSO — only rendered once the backend confirms it's configured (#55) */}
            {googleEnabled && mode !== "forgot" && mode !== "reset" && !done && (
              <>
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
                  Continue with Google
                </a>
                <div className="ca-divider"><span>or</span></div>
              </>
            )}

            {/* ── Success states ── */}
            {done === "signup" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><CheckIcon /></div>
                <p className="ca-success-title">Account created</p>
                <p className="ca-success-body">
                  Your account is ready. Sign in to open your dashboard.
                </p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  Go to sign in →
                </button>
              </div>
            )}

            {done === "forgot" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><MailIcon /></div>
                <p className="ca-success-title">Reset link sent</p>
                <p className="ca-success-body">
                  If an account exists for{" "}
                  <strong className="ca-email-strong">{email}</strong>,
                  you&apos;ll receive a reset link shortly.
                </p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  ← Back to sign in
                </button>
              </div>
            )}

            {done === "reset" && (
              <div className="ca-success" role="status">
                <div className="ca-success-icon" aria-hidden="true"><CheckIcon /></div>
                <p className="ca-success-title">Password updated</p>
                <p className="ca-success-body">
                  Your password has been changed. Please sign in with your new password.
                </p>
                <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                  Go to sign in →
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
                    <label className="ca-label" htmlFor="ca-email">Email</label>
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
                      <span id="ca-email-error" className="ca-hint is-error" role="alert">Enter a valid email address</span>
                    )}
                  </div>
                )}

                {/* Password */}
                {mode !== "forgot" && (
                  <div className="ca-field">
                    <label className="ca-label" htmlFor="ca-password">{mode === "reset" ? "New password" : "Password"}</label>
                    <div className="ca-input-wrap">
                      <input
                        id="ca-password"
                        className={`ca-input has-icon${passwordTouched && !passwordValid ? " is-error" : passwordTouched && passwordValid ? " is-valid" : ""}`}
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"}
                        required
                        placeholder={mode === "signup" || mode === "reset" ? "Min. 8 characters" : "••••••••"}
                        value={password}
                        aria-invalid={passwordTouched && !passwordValid ? "true" : undefined}
                        aria-describedby={passwordTouched && !passwordValid ? "ca-password-error" : undefined}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      />
                      <button
                        type="button"
                        className="ca-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
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

                    {(mode === "signup" || mode === "reset") && passwordTouched && !passwordValid && (
                      <span id="ca-password-error" className="ca-hint is-error" role="alert">At least 8 characters required</span>
                    )}

                    {/* Forgot link — login only */}
                    {mode === "login" && (
                      <div className="ca-forgot">
                        <button
                          type="button"
                          className="ca-text-btn"
                          onClick={() => switchMode("forgot")}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm password — signup and reset */}
                {(mode === "signup" || mode === "reset") && (
                  <div className="ca-field">
                    <label className="ca-label" htmlFor="ca-confirm">{mode === "reset" ? "Confirm new password" : "Confirm password"}</label>
                    <div className="ca-input-wrap">
                      <input
                        id="ca-confirm"
                        className={`ca-input has-icon${confirmTouched && !confirmMatch ? " is-error" : confirmTouched && confirmMatch && passwordValid ? " is-valid" : ""}`}
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="Repeat your password"
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
                        aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {confirmTouched && !confirmMatch && (
                      <span id="ca-confirm-error" className="ca-hint is-error" role="alert">Passwords do not match</span>
                    )}
                  </div>
                )}

                {/* Error banner */}
                {error && <div className="ca-error" role="alert">{error}</div>}

                {/* Submit */}
                <button type="submit" className="ca-btn" disabled={loading}>
                  {loading
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create account"
                        : mode === "reset"
                          ? "Update password"
                          : "Send reset link"}
                </button>

                {/* Back to sign in — forgot/reset modes */}
                {(mode === "forgot" || mode === "reset") && (
                  <p className="ca-center-row">
                    <button type="button" className="ca-text-btn" onClick={() => switchMode("login")}>
                      ← Back to sign in
                    </button>
                  </p>
                )}
              </form>
            )}

            {/* Terms — signup only */}
            {!done && mode === "signup" && (
              <p className="ca-terms">
                By creating an account you agree to our{" "}
                <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
              </p>
            )}

            {/* Footer switch hint */}
            {!done && mode !== "forgot" && mode !== "reset" && (
              <p className="ca-footer">
                {mode === "login" ? (
                  <>No account?{" "}
                    <button type="button" className="ca-text-btn ca-footer-switch" onClick={() => switchMode("signup")}>
                      Create one
                    </button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button type="button" className="ca-text-btn ca-footer-switch" onClick={() => switchMode("login")}>
                      Sign in
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
                  Try a chart first — no account needed
                </button>
              </p>
            )}

          </div>
        </main>
      </div>

      {showGuestChart && (
        <GuestChartModal lang="en" onClose={() => setShowGuestChart(false)} />
      )}
    </>
  );
}
