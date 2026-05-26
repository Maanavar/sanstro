"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Mode = "login" | "signup" | "forgot";

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

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ui state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"signup" | "forgot" | null>(null);

  // inline validation
  const emailTouched = email.length > 0;
  const emailValid = isValidEmail(email);
  const passwordTouched = password.length > 0;
  const passwordValid = isStrongPassword(password);
  const confirmTouched = confirmPassword.length > 0;
  const confirmMatch = password === confirmPassword;

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
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          throw new Error(payload.detail ?? "Unable to create account.");
        }
        setDone("signup");
      } else if (mode === "login") {
        const response = await fetch("/api/backend/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({} as { detail?: string }));
          throw new Error(payload.detail ?? "Incorrect email or password.");
        }
        // Check if user has a birth profile; if not, send them to setup
        try {
          const profileCheck = await fetch("/api/backend/api/v1/birth-profiles/me/latest", { credentials: "include" });
          router.push(profileCheck.ok ? "/dashboard" : "/dashboard?setup=1");
        } catch {
          router.push("/dashboard");
        }
      } else {
        const response = await fetch("/api/backend/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password";
  const subtitle =
    mode === "login" ? "Sign in to your Vinaadi AI account"
    : mode === "signup" ? "Start your Vinaadi AI journey"
    : "We'll send a reset link to your email";

  return (
    <>
      <style>{`
        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05070d;
          padding: 16px;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }
        .auth-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 15% 25%, rgba(229,184,77,0.10) 0%, transparent 35%),
            radial-gradient(circle at 80% 70%, rgba(139,92,246,0.08) 0%, transparent 35%);
        }
        .auth-card {
          position: relative;
          z-index: 1;
          width: min(420px, 100%);
          background: #111218;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 36px 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        }
        .auth-brand {
          display: inline-flex;
          align-items: center;
          margin-bottom: 2px;
        }
        .auth-brand-wordmark {
          width: min(320px, 76vw);
          height: auto;
          display: block;
        }
        .auth-heading {
          margin: 0 0 4px;
          font-size: 1.55rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .auth-subheading {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.45);
        }
        .auth-mode-tabs {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .auth-mode-tab {
          flex: 1;
          padding: 7px 12px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .auth-mode-tab.active {
          background: rgba(255,255,255,0.10);
          color: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .auth-mode-tab:hover:not(.active) {
          color: rgba(255,255,255,0.7);
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-label {
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.02em;
        }
        .auth-input-wrap {
          position: relative;
        }
        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus {
          border-color: rgba(229,184,77,0.5);
          box-shadow: 0 0 0 3px rgba(229,184,77,0.08);
        }
        .auth-input.has-icon { padding-right: 42px; }
        .auth-input.error { border-color: rgba(248,113,113,0.5); }
        .auth-input.valid { border-color: rgba(74,222,128,0.35); }
        .auth-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 2px;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .auth-eye:hover { color: rgba(255,255,255,0.7); }
        .auth-hint {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
          margin-top: 2px;
        }
        .auth-hint.error-hint { color: #f87171; }
        .auth-error {
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(248,113,113,0.3);
          color: #f87171;
          font-size: 0.83rem;
          line-height: 1.5;
        }
        .auth-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, rgba(229,184,77,0.95), rgba(200,155,50,0.95));
          color: #0a0800;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(229,184,77,0.25);
          letter-spacing: 0.01em;
        }
        .auth-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(229,184,77,0.35);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.18);
          font-size: 0.75rem;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .auth-footer {
          text-align: center;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.38);
        }
        .auth-link {
          background: none;
          border: none;
          color: rgba(229,184,77,0.85);
          font-size: 0.82rem;
          font-family: inherit;
          cursor: pointer;
          padding: 0;
          font-weight: 500;
          text-decoration: underline;
          text-decoration-color: rgba(229,184,77,0.3);
          transition: color 0.15s;
        }
        .auth-link:hover { color: rgba(229,184,77,1); }
        .auth-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          padding: 8px 0;
        }
        .auth-success-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4ade80;
        }
        .auth-success-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #fff;
        }
        .auth-success-body {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          max-width: 280px;
        }
        .auth-forgot-link {
          display: flex;
          justify-content: flex-end;
          margin-top: -8px;
        }
        .auth-pw-strength {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
        .auth-pw-bar {
          height: 3px;
          flex: 1;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          transition: background 0.2s;
        }
        .auth-pw-bar.filled-weak  { background: #f87171; }
        .auth-pw-bar.filled-ok    { background: rgba(229,184,77,0.8); }
        .auth-pw-bar.filled-good  { background: #4ade80; }
      `}</style>

      <div className="auth-glow" />
      <main className="auth-root">
        <div className="auth-card">

          {/* Brand */}
          <div>
            <div className="auth-brand">
              <Image
                src="/brand/vinaadi-wordmark-color-transparent.png"
                alt="Vinaadi - Your Cosmic Copilot"
                width={1764}
                height={619}
                className="auth-brand-wordmark"
                priority
              />
            </div>
            <h1 className="auth-heading" style={{ marginTop: "16px" }}>{title}</h1>
            <p className="auth-subheading">{subtitle}</p>
          </div>

          {/* Mode tabs — login / sign up only (forgot is accessed via link) */}
          {mode !== "forgot" && (
            <div className="auth-mode-tabs">
              <button type="button" className={`auth-mode-tab${mode === "login" ? " active" : ""}`} onClick={() => switchMode("login")}>
                Sign in
              </button>
              <button type="button" className={`auth-mode-tab${mode === "signup" ? " active" : ""}`} onClick={() => switchMode("signup")}>
                Sign up
              </button>
            </div>
          )}

          {/* Success states */}
          {done === "signup" && (
            <div className="auth-success">
              <div className="auth-success-icon"><CheckIcon /></div>
              <p className="auth-success-title">Account created!</p>
              <p className="auth-success-body">
                Your account is ready. Sign in to continue to your dashboard.
              </p>
              <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                Go to sign in →
              </button>
            </div>
          )}

          {done === "forgot" && (
            <div className="auth-success">
              <div className="auth-success-icon"><MailIcon /></div>
              <p className="auth-success-title">Reset link sent</p>
              <p className="auth-success-body">
                If an account exists for <strong style={{ color: "rgba(255,255,255,0.75)" }}>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                Back to sign in →
              </button>
            </div>
          )}

          {/* Form */}
          {!done && (
            <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: "16px" }} noValidate>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  className={`auth-input${emailTouched && !emailValid ? " error" : emailTouched && emailValid ? " valid" : ""}`}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                />
                {emailTouched && !emailValid && (
                  <span className="auth-hint error-hint">Enter a valid email address</span>
                )}
              </div>

              {/* Password */}
              {mode !== "forgot" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-password">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="auth-password"
                      className={`auth-input has-icon${passwordTouched && !passwordValid ? " error" : passwordTouched && passwordValid ? " valid" : ""}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    />
                    <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {/* Password strength bars (signup only) */}
                  {mode === "signup" && passwordTouched && (
                    <>
                      <div className="auth-pw-strength">
                        {[0, 1, 2, 3].map((i) => {
                          const len = password.length;
                          const strength = len < 8 ? 1 : len < 12 ? 2 : len < 16 ? 3 : 4;
                          const cls = i < strength ? (strength <= 1 ? "filled-weak" : strength <= 2 ? "filled-ok" : "filled-good") : "";
                          return <div key={i} className={`auth-pw-bar${cls ? ` ${cls}` : ""}`} />;
                        })}
                      </div>
                      {!passwordValid && (
                        <span className="auth-hint error-hint">At least 8 characters required</span>
                      )}
                    </>
                  )}

                  {/* Forgot password link (login only) */}
                  {mode === "login" && (
                    <div className="auth-forgot-link">
                      <button type="button" className="auth-link" style={{ fontSize: "0.78rem" }} onClick={() => switchMode("forgot")}>
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm password (signup only) */}
              {mode === "signup" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm">Confirm password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="auth-confirm"
                      className={`auth-input has-icon${confirmTouched && !confirmMatch ? " error" : confirmTouched && confirmMatch && passwordValid ? " valid" : ""}`}
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    />
                    <button type="button" className="auth-eye" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {confirmTouched && !confirmMatch && (
                    <span className="auth-hint error-hint">Passwords do not match</span>
                  )}
                </div>
              )}

              {/* Error banner */}
              {error && <div className="auth-error" role="alert">{error}</div>}

              {/* Submit */}
              <button
                type="submit"
                className="auth-btn"
                disabled={loading}
                style={{ marginTop: "4px" }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
              </button>

              {/* Back link for forgot mode */}
              {mode === "forgot" && (
                <p style={{ margin: 0, textAlign: "center" }}>
                  <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                    ← Back to sign in
                  </button>
                </p>
              )}
            </form>
          )}

          {/* Footer — terms / note */}
          {!done && mode === "signup" && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.6 }}>
              By creating an account you agree to our{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer", color: "rgba(255,255,255,0.38)" }}>Terms</span>{" "}
              and{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer", color: "rgba(255,255,255,0.38)" }}>Privacy Policy</span>.
            </p>
          )}

        </div>
      </main>
    </>
  );
}

