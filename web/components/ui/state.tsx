"use client";

import type { ReactNode } from "react";
import { AlertCircle, CircleOff, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";

import { Button } from "./button";
import { Card } from "./card";

type Lang = "ta" | "en";
type BiText = Record<Lang, string>;

type StateProps = {
  title?: BiText;
  message?: BiText;
  lang?: Lang;
  children?: ReactNode;
};

const COPY = {
  loading: {
    title: { ta: "ஏற்றுகிறது", en: "Loading" },
    message: { ta: "தகவல் தயாராகிறது.", en: "Your information is being prepared." },
  },
  error: {
    title: { ta: "தகவலை ஏற்ற முடியவில்லை", en: "Could not load this information" },
    message: { ta: "சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.", en: "Please try again in a moment." },
    retry: { ta: "மீண்டும் முயற்சி", en: "Try again" },
  },
  empty: {
    title: { ta: "இன்னும் தகவல் இல்லை", en: "Nothing here yet" },
    message: { ta: "தொடங்கியதும் உங்கள் தகவல் இங்கே தோன்றும்.", en: "Your information will appear here once you get started." },
  },
  gated: {
    title: { ta: "இந்த அம்சத்திற்கு அனுமதி தேவை", en: "This feature needs access" },
    message: { ta: "உங்கள் திட்டத்தைப் பார்க்கவும் அல்லது அனுமதி பெறவும்.", en: "Review your plan or request access to continue." },
    action: { ta: "விருப்பங்களைப் பார்", en: "View options" },
  },
  unavailable: {
    title: { ta: "இந்த பகுதி இப்போது கிடைக்கவில்லை", en: "This section is temporarily unavailable" },
    message: { ta: "மற்ற தகவல்கள் பாதிக்கப்படவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.", en: "Your other information is unaffected. Please try again later." },
  },
} as const;

function select(text: BiText, lang: Lang): string {
  return text[lang];
}

function StateShell({
  icon,
  title,
  message,
  lang,
  children,
  live = "polite",
}: StateProps & { icon: ReactNode; live?: "polite" | "assertive" }) {
  const resolvedTitle = title ?? COPY.empty.title;
  const activeLang = lang ?? "en";

  return (
    <Card
      as="section"
      className="ui-state"
      aria-label={select(resolvedTitle, activeLang)}
      aria-live={live}
      aria-atomic="true"
      style={{
        display: "grid",
        justifyItems: "start",
        gap: "10px",
        padding: "24px",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", color: "var(--color-accent)" }}>{icon}</span>
      <div>
        <h3 style={{ margin: 0, color: "var(--color-text)", fontSize: "1rem" }}>{select(resolvedTitle, activeLang)}</h3>
        <p style={{ margin: "6px 0 0", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {select(message ?? COPY.empty.message, activeLang)}
        </p>
      </div>
      {children}
    </Card>
  );
}

export function LoadingState({ title = COPY.loading.title, message = COPY.loading.message, lang = "en" }: StateProps) {
  return <StateShell icon={<LoaderCircle className="ui-state__spinner" size={22} />} title={title} message={message} lang={lang} />;
}

export function ErrorState({
  title = COPY.error.title,
  message = COPY.error.message,
  lang = "en",
  onRetry,
}: StateProps & { onRetry?: () => void }) {
  return (
    <StateShell icon={<AlertCircle size={22} />} title={title} message={message} lang={lang} live="assertive">
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} aria-label={select(COPY.error.retry, lang)}>
          <RefreshCw size={15} aria-hidden="true" /> {select(COPY.error.retry, lang)}
        </Button>
      ) : null}
    </StateShell>
  );
}

export function EmptyState({ title = COPY.empty.title, message = COPY.empty.message, lang = "en", children }: StateProps) {
  return <StateShell icon={<CircleOff size={22} />} title={title} message={message} lang={lang}>{children}</StateShell>;
}

export function GatedState({
  title = COPY.gated.title,
  message = COPY.gated.message,
  lang = "en",
  onAction,
  actionLabel = COPY.gated.action,
}: StateProps & { onAction?: () => void; actionLabel?: BiText }) {
  return (
    <StateShell icon={<LockKeyhole size={22} />} title={title} message={message} lang={lang}>
      {onAction ? <Button size="sm" onClick={onAction}>{select(actionLabel, lang)}</Button> : null}
    </StateShell>
  );
}

export function UnavailableState({ title = COPY.unavailable.title, message = COPY.unavailable.message, lang = "en" }: StateProps) {
  return <StateShell icon={<AlertCircle size={22} />} title={title} message={message} lang={lang} />;
}
