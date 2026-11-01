/**
 * Razorpay Checkout in the browser (admin spec L1).
 *
 * The script is Razorpay's hosted checkout.js; it is loaded on demand from the
 * one route whose CSP allows it (`isCheckoutPath` in lib/security-headers.ts).
 * It is inserted by this module's own (nonced) code, so 'strict-dynamic'
 * trusts it without a nonce of its own.
 *
 * What comes back from a successful checkout is the browser's word only. It is
 * passed to `confirmPayment`, and the server decides — from Razorpay's API or
 * webhook — whether anything was paid.
 */
import type { CheckoutStart } from "@vinaadi/shared/api";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
};

type RazorpayOptions = {
  key: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loading: Promise<RazorpayConstructor> | null = null;

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay needs a browser"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not load")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Razorpay did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Open Checkout for a server-created order or subscription. Resolves with the
 * success fields, or null when the buyer closes the window. A failed attempt
 * keeps the window open (Razorpay offers a retry), so it does not resolve.
 */
export async function openRazorpayCheckout(start: CheckoutStart, description: string): Promise<RazorpaySuccess | null> {
  const Razorpay = await loadRazorpay();
  return new Promise<RazorpaySuccess | null>((resolve) => {
    new Razorpay({
      key: start.keyId,
      name: "Vinaadi",
      description,
      ...(start.orderId ? { order_id: start.orderId } : {}),
      ...(start.subscriptionId ? { subscription_id: start.subscriptionId } : {}),
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    }).open();
  });
}
