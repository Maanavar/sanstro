"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getMe, getMySubscription, type MeResponse, type SubscriptionInfo } from "@vinaadi/shared/api";
import { OPEN_BETA } from "@vinaadi/shared/constants";
import { isStoreSubscription, periodEndMeaning } from "@vinaadi/shared/subscriptionManage";

import type { Lang } from "@/lib/i18n";
import { StatusChip } from "./ui";

const titleStyle: React.CSSProperties = { fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" };
const descStyle: React.CSSProperties = { fontSize: "var(--text-sm)", color: "var(--color-faint)", marginTop: "3px", lineHeight: 1.5 };

function dateLabel(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Settings → Plan & billing (audit U3, 2026-11-03). The upgrade page was
 * reachable only from the marketing pricing page, Reports and store badges, so
 * a subscriber could not find "Stop renewing", which lives only there.
 *
 * Read-only here: buying and cancelling stay on /dashboard/upgrade, the one
 * page whose CSP admits Razorpay Checkout (lib/security-headers.ts). A
 * subscription bought in the app (provider `revenuecat`) cannot be cancelled
 * from the web at all, so it points to the store instead.
 *
 * Content only, no card: the Settings tab wraps it in its own `Card`.
 *
 * New Tamil, pending native review.
 */
export function PlanBillingSummary({ lang }: { lang: Lang }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMe(), getMySubscription().catch(() => null)])
      .then(([who, subscription]) => {
        if (cancelled) return;
        setMe(who);
        setSub(subscription?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div role="alert" style={{ fontSize: "var(--text-base)", color: "var(--color-low)" }}>
        {L("Could not load your plan. Please reload the page.", "உங்கள் திட்டத்தை ஏற்ற முடியவில்லை. பக்கத்தை மீண்டும் ஏற்றவும்.")}
      </div>
    );
  }
  if (!me) {
    return <div style={descStyle}>{L("Loading your plan…", "உங்கள் திட்டம் ஏற்றப்படுகிறது…")}</div>;
  }

  const premium = me.accessState === "premium";
  const trial = me.accessState === "trial";
  const fromStore = isStoreSubscription(sub?.provider);
  const planName = premium ? L("Premium", "பிரீமியம்") : trial ? L("Free trial", "இலவசச் சோதனை") : L("Free", "இலவசம்");

  let detail: string;
  if (OPEN_BETA) {
    detail = L(
      "Every feature is free while Vinaadi is in open beta. Nothing is charged.",
      "Vinaadi திறந்த பீட்டாவில் இருக்கும் வரை அனைத்து வசதிகளும் இலவசம். எந்தக் கட்டணமும் இல்லை.",
    );
  } else if (premium && sub?.current_period_end && periodEndMeaning(sub) === "ends") {
    // Renewal already stopped: the date is when access ends, not when it renews.
    detail = L(
      `Premium ends on ${dateLabel(sub.current_period_end, lang)} and will not renew.`,
      `${dateLabel(sub.current_period_end, lang)} அன்று பிரீமியம் முடிகிறது; புதுப்பிக்கப்படாது.`,
    );
  } else if (premium && sub?.current_period_end) {
    detail = L(
      `The current period runs until ${dateLabel(sub.current_period_end, lang)}.`,
      `நடப்புக் காலம் ${dateLabel(sub.current_period_end, lang)} வரை.`,
    );
  } else if (trial && me.trialEndsAt) {
    detail = L(
      `Your trial runs until ${dateLabel(me.trialEndsAt, lang)}. Nothing is charged when it ends.`,
      `உங்கள் சோதனை ${dateLabel(me.trialEndsAt, lang)} வரை. முடிந்ததும் எந்தக் கட்டணமும் வசூலிக்கப்படாது.`,
    );
  } else if (premium) {
    detail = L("Premium is active on this account.", "இந்தக் கணக்கில் பிரீமியம் செயலில் உள்ளது.");
  } else {
    detail = L("Upgrade for full timing tools and more Ask Vinaadi questions.", "முழு நேரக் கருவிகளுக்கும் கூடுதல் Ask Vinaadi கேள்விகளுக்கும் மேம்படுத்துங்கள்.");
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ maxWidth: "420px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div style={titleStyle}>{L("Your plan", "உங்கள் திட்டம்")}</div>
            <StatusChip done={premium} label={planName} />
          </div>
          <div style={descStyle}>{detail}</div>
        </div>
        {!OPEN_BETA && !(premium && fromStore) && (
          // A link styled as the kit's button: a <button> inside an <a> is
          // nested interactive content.
          <Link
            href="/dashboard/upgrade"
            className={premium ? "ui-btn ui-btn--secondary" : "ui-btn ui-btn--primary"}
            style={{ textDecoration: "none" }}
          >
            {premium ? L("Manage subscription", "சந்தாவை நிர்வகிக்கவும்") : L("See plans", "திட்டங்களைப் பார்க்கவும்")}
          </Link>
        )}
      </div>
      {premium && !OPEN_BETA && periodEndMeaning(sub) !== "ends" && (
        <div style={descStyle}>
          {fromStore
            ? L(
                "You subscribed in the Vinaadi app, so renewal is managed in the App Store or Google Play, under your account's subscriptions.",
                "நீங்கள் Vinaadi செயலியில் சந்தா செலுத்தியதால், புதுப்பித்தலை App Store அல்லது Google Play-இல் உங்கள் கணக்கின் சந்தாக்களில் நிர்வகிக்கலாம்.",
              )
            : L(
                "Stopping renewal keeps Premium until the end of the paid period.",
                "புதுப்பித்தலை நிறுத்தினாலும் செலுத்திய காலம் முடியும் வரை பிரீமியம் தொடரும்.",
              )}
        </div>
      )}
    </>
  );
}
