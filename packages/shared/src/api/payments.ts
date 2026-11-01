import { getApiClient } from "./client";

// Contract for app/api/payments.py (web payments through Razorpay, admin spec
// L1) and the admin payment lists in app/api/admin.py.
//
// The browser never sends an amount: checkout takes a SKU, the server prices it
// from the `products` table, and access is granted by Razorpay's webhook or by
// the server fetching the order — never by the browser's success callback alone.

export type ProductKind = "subscription" | "one_time";

/** GET /payments/products — what is on sale now. */
export interface PaymentProduct {
  sku: string;
  kind: ProductKind;
  nameEn: string;
  nameTa: string;
  priceInrPaise: number;
  billingPeriod: "month" | "year" | null;
  /** Subscriptions only: false until the plan exists in Razorpay. */
  available: boolean;
}

/** POST /payments/checkout/order and /payments/checkout/subscription. */
export interface CheckoutStart {
  provider: "razorpay";
  /** Razorpay key id for Checkout (public by design). */
  keyId: string;
  sku: string;
  nameEn: string;
  nameTa: string;
  /** One-time purchases. */
  orderId: string | null;
  amountPaise: number | null;
  currency: string | null;
  /** Subscriptions. */
  subscriptionId: string | null;
}

/** Razorpay Checkout's success-handler fields, passed through as Razorpay names them. */
export interface PaymentConfirmRequest {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
}

/** paid / active = access granted; processing = the webhook has not landed yet. */
export interface PaymentConfirmResponse {
  status: "paid" | "active" | "processing";
}

export interface SubscriptionCancelResponse {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

export function listPaymentProducts(): Promise<PaymentProduct[]> {
  return getApiClient().get("/payments/products") as Promise<PaymentProduct[]>;
}

export function startOrderCheckout(sku: string): Promise<CheckoutStart> {
  return getApiClient().post("/payments/checkout/order", { sku }) as Promise<CheckoutStart>;
}

export function startSubscriptionCheckout(sku: string): Promise<CheckoutStart> {
  return getApiClient().post("/payments/checkout/subscription", { sku }) as Promise<CheckoutStart>;
}

export function confirmPayment(body: PaymentConfirmRequest): Promise<PaymentConfirmResponse> {
  return getApiClient().post("/payments/confirm", body) as Promise<PaymentConfirmResponse>;
}

export function getOrderPaymentStatus(orderId: string): Promise<PaymentConfirmResponse> {
  return getApiClient().get(`/payments/orders/${encodeURIComponent(orderId)}`) as Promise<PaymentConfirmResponse>;
}

/** Stop renewing; Premium continues to the end of the paid period (refund policy D-18). */
export function cancelSubscription(): Promise<SubscriptionCancelResponse> {
  return getApiClient().post("/payments/subscription/cancel") as Promise<SubscriptionCancelResponse>;
}

// ── Admin (payments.read) ────────────────────────────────────────────────────

/** GET /admin/payments/mismatches — what the nightly reconciliation found. */
export interface PaymentMismatch {
  id: string;
  /** payment_missing | payment_status | payment_amount | refund_missing | subscription_status */
  kind: string;
  provider_ref: string;
  detail: Record<string, unknown>;
  /** Reconciliation applied the fix itself (a lost webhook for a known order). */
  auto_resolved: boolean;
  found_at: string;
  resolved_at: string | null;
}

/** GET /admin/payments/orders */
export interface RecentOrder {
  provider_order_id: string;
  user_id: string | null;
  sku: string;
  amount_paise: number;
  status: "created" | "paid" | "failed" | "refunded" | "partially_refunded";
  created_at: string;
  paid_at: string | null;
}

export const adminPaymentPaths = {
  mismatches: "/admin/payments/mismatches",
  orders: "/admin/payments/orders",
} as const;
