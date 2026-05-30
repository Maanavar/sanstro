"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface AlertBannerProps {
  variant: "critical" | "caution";
  icon?: ReactNode;
  message: string;
  dismissible?: boolean;
}

function AlertIcon({ variant }: { variant: "critical" | "caution" }) {
  if (variant === "critical") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
      <path d="M12 3l9 17H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ width: "14px", height: "14px" }}>
      <path d="M5.5 5.5l9 9m0-9l-9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AlertBanner({ variant, icon, message, dismissible = true }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const liveValue = variant === "critical" ? "assertive" : "polite";

  return (
    <div className={`alert-banner alert-banner--${variant}`} role="alert" aria-live={liveValue}>
      <span className="alert-banner__icon" aria-hidden="true">
        {icon ?? <AlertIcon variant={variant} />}
      </span>
      <span className="alert-banner__body">{message}</span>
      {dismissible && (
        <button
          type="button"
          className="alert-banner__dismiss"
          aria-label="Dismiss alert"
          onClick={() => setDismissed(true)}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
