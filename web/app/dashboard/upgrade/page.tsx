"use client";

import { useEffect, useState } from "react";
import { DashboardAuxiliaryShell } from "@/components/dashboard-auxiliary-shell";
import { useLang } from "@/components/lang-toggle";
import { readErrorMessage } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import {
  cancelSubscription,
  confirmPayment,
  getMe,
  getOrderPaymentStatus,
  listPaymentProducts,
  startOrderCheckout,
  startSubscriptionCheckout,
  type MeResponse,
  type PaymentProduct,
} from "@vinaadi/shared/api";
import { ACCOUNT_TRIAL_DAYS, OPEN_BETA, TIER_LIMITS } from "@vinaadi/shared/constants";
import { Button, Card } from "@/components/ui";
import "@/components/upgrade-page.css";

/** How long to wait for Razorpay's webhook after the browser says "paid". Bounded. */
const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

type Outcome = { tone: "ok" | "wait" | "error"; text: string } | null;

function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    paise / 100,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribe or buy, through Razorpay (admin spec L1). The only page whose CSP
 * allows Razorpay Checkout (lib/security-headers.ts `isCheckoutPath`).
 *
 * New Tamil, pending native review.
 */
export default function UpgradePage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const L = (en: string, taText: string) => (ta ? taText : en);
  const [products, setProducts] = useState<PaymentProduct[] | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  async function refresh() {
    const [list, who] = await Promise.all([listPaymentProducts(), getMe()]);
    setProducts(list);
    setMe(who);
  }

  useEffect(() => {
    refresh().catch((err: unknown) => setOutcome({ tone: "error", text: readErrorMessage(err) }));
  }, []);

  async function waitForOrder(orderId: string): Promise<boolean> {
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);
      const { status } = await getOrderPaymentStatus(orderId);
      if (status === "paid") return true;
    }
    return false;
  }

  async function buy(product: PaymentProduct) {
    setBusy(product.sku);
    setOutcome(null);
    try {
      const start =
        product.kind === "subscription"
          ? await startSubscriptionCheckout(product.sku)
          : await startOrderCheckout(product.sku);
      const success = await openRazorpayCheckout(start, ta ? product.nameTa : product.nameEn);
      if (!success) {
        setOutcome({ tone: "wait", text: L("Payment closed. Nothing was charged.", "கட்டணம் மூடப்பட்டது. எதுவும் வசூலிக்கப்படவில்லை.") });
        return;
      }
      const { status } = await confirmPayment(success);
      let done = status !== "processing";
      if (!done && start.orderId) done = await waitForOrder(start.orderId);
      setOutcome(
        done
          ? { tone: "ok", text: L("Payment received. Thank you!", "கட்டணம் பெறப்பட்டது. நன்றி!") }
          : {
              tone: "wait",
              text: L(
                "We are confirming your payment with the bank. This can take a few minutes; it will appear on your account without you doing anything.",
                "உங்கள் கட்டணத்தை வங்கியுடன் உறுதிசெய்கிறோம். சில நிமிடங்கள் ஆகலாம்; நீங்கள் எதுவும் செய்யாமலேயே உங்கள் கணக்கில் தோன்றும்.",
              ),
            },
      );
      await refresh();
    } catch (err: unknown) {
      setOutcome({ tone: "error", text: readErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setOutcome(null);
    try {
      const result = await cancelSubscription();
      const until = result.currentPeriodEnd ? new Date(result.currentPeriodEnd).toLocaleDateString(ta ? "ta-IN" : "en-IN") : null;
      setOutcome({
        tone: "ok",
        text: until
          ? L(`Renewal stopped. Premium continues until ${until}.`, `புதுப்பித்தல் நிறுத்தப்பட்டது. ${until} வரை பிரீமியம் தொடரும்.`)
          : L("Renewal stopped.", "புதுப்பித்தல் நிறுத்தப்பட்டது."),
      });
    } catch (err: unknown) {
      setOutcome({ tone: "error", text: readErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  const premium = TIER_LIMITS.premium;

  return (
    <DashboardAuxiliaryShell pageTitle={{ en: "Premium", ta: "பிரீமியம்" }}>
      <div className="cd-page upg-page">
        <div className="upg-wrap">
          <div>
            <h1 className="upg-title">{L("Premium", "பிரீமியம்")}</h1>
            <p className="upg-lead">
              {L(
                `Full timing tools, unlimited profiles, ${premium.askVinaadiDailyLimit} Ask Vinaadi questions a day, and ${premium.detailedReportsMonthlyIncluded} jadhagam + ${premium.poruthamReportsMonthlyIncluded} porutham report a month. Pay by UPI or card; cancel any time and keep Premium to the end of the paid period.`,
                `முழு நேரக் கணிப்புக் கருவிகள், வரம்பற்ற சுயவிவரங்கள், நாளொன்றுக்கு ${premium.askVinaadiDailyLimit} கேள்விகள், மாதம் ${premium.detailedReportsMonthlyIncluded} ஜாதக + ${premium.poruthamReportsMonthlyIncluded} பொருத்த அறிக்கை. UPI அல்லது கார்டு மூலம் செலுத்தலாம்; எப்போது வேண்டுமானாலும் ரத்து செய்யலாம், செலுத்திய காலம் முடியும் வரை பிரீமியம் தொடரும்.`,
              )}
            </p>
          </div>

          <p role="status" aria-live="polite" className="upg-status" data-tone={outcome?.tone}>
            {outcome?.text ?? ""}
          </p>

          {OPEN_BETA ? (
            <Card>
              {L(
                "Every feature is free while Vinaadi is in open beta. Nothing to buy yet.",
                "Vinaadi திறந்த பீட்டாவில் இருக்கும் வரை அனைத்து வசதிகளும் இலவசம். இப்போது வாங்க எதுவும் இல்லை.",
              )}
            </Card>
          ) : me?.accessState === "premium" ? (
            <Card>
              <strong>{L("You have Premium.", "உங்களிடம் பிரீமியம் உள்ளது.")}</strong>
              <Button variant="secondary" className="upg-cta" disabled={busy !== null} onClick={() => void cancel()}>
                {L("Stop renewing", "புதுப்பித்தலை நிறுத்து")}
              </Button>
            </Card>
          ) : (
            <>
              {me?.accessState === "trial" && me.trialEndsAt ? (
                <Card>
                  {L(
                    `Your free trial runs until ${new Date(me.trialEndsAt).toLocaleDateString("en-IN")}. Nothing is charged when it ends.`,
                    `உங்கள் இலவசச் சோதனை ${new Date(me.trialEndsAt).toLocaleDateString("ta-IN")} வரை. முடிந்ததும் எந்தக் கட்டணமும் வசூலிக்கப்படாது.`,
                  )}
                </Card>
              ) : me && !me.emailVerified ? (
                <Card>
                  {L(
                    `Confirm your email address to try Premium free for ${ACCOUNT_TRIAL_DAYS} days first.`,
                    `முதலில் ${ACCOUNT_TRIAL_DAYS} நாள் இலவசமாக பிரீமியத்தை முயல உங்கள் மின்னஞ்சலை உறுதிசெய்யுங்கள்.`,
                  )}
                </Card>
              ) : null}
              <div className="upg-grid">
                {(products ?? []).map((product) => (
                  <Card key={product.sku}>
                    <h2 className="upg-product-name">{ta ? product.nameTa : product.nameEn}</h2>
                    <span className="upg-price">
                      {rupees(product.priceInrPaise)}
                      <span className="upg-period">
                        {product.billingPeriod === "month" ? L(" / month", " / மாதம்") : product.billingPeriod === "year" ? L(" / year", " / ஆண்டு") : ""}
                      </span>
                    </span>
                    <Button
                      variant="primary"
                      className="upg-cta"
                      disabled={!product.available || busy !== null}
                      onClick={() => void buy(product)}
                    >
                      {busy === product.sku
                        ? "…"
                        : !product.available
                          ? L("Coming soon", "விரைவில்")
                          : product.kind === "subscription"
                            ? L("Subscribe", "சந்தா செலுத்து")
                            : L("Buy", "வாங்கு")}
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardAuxiliaryShell>
  );
}
