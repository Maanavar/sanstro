"use client";

import { useState } from "react";

interface AlertBannerProps {
  variant: "critical" | "caution";
  icon?: string;
  message: string;
  dismissible?: boolean;
}

export function AlertBanner({ variant, icon, message, dismissible = true }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const defaultIcon = variant === "critical" ? "⛔" : "⚠";
  const liveValue = variant === "critical" ? "assertive" : "polite";

  return (
    <div
      className={`alert-banner alert-banner--${variant}`}
      role="alert"
      aria-live={liveValue}
    >
      <span className="alert-banner__icon" aria-hidden="true">
        {icon ?? defaultIcon}
      </span>
      <span className="alert-banner__body">{message}</span>
      {dismissible && (
        <button
          type="button"
          className="alert-banner__dismiss"
          aria-label="Dismiss alert"
          onClick={() => setDismissed(true)}
        >
          ✕
        </button>
      )}
    </div>
  );
}
