// Contract for app/api/admin_support.py — the support console (admin spec L9).
//
// Like `adminAudit.ts`, this exports types and paths rather than callers: the
// console sends these through its own fetch so it can attach the elevation
// header and handle a `403 mfa_required` in one place.

/** GET /admin/users/{id}/support — first touch, written once at signup. */
export interface SupportAcquisition {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  ref: string | null;
  referrer_host: string | null;
  landing_path: string | null;
}

export interface SupportAccount {
  user_id: string;
  email: string | null;
  email_verified: boolean;
  user_mode: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string | null;
  /** The IST day of their last signed-in request (spec §8), with the client and language it used. */
  last_seen_on: string | null;
  last_platform: string | null;
  last_language: string | null;
  acquisition: SupportAcquisition;
}

export interface SupportAccess {
  state: "free" | "trial" | "premium";
  trial_ends_at: string | null;
  /**
   * Why they have it: any of "trial", "purchase", "grant", "subscription".
   * A billing ticket is usually answered by which of these is missing.
   */
  sources: string[];
}

export interface SupportEntitlement {
  id: string;
  key: string;
  /** trial | purchase | grant. A courtesy grant is "grant". */
  source: string;
  source_id: string | null;
  starts_at: string;
  ends_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  granted_by: string | null;
  is_active: boolean;
}

export interface SupportSubscription {
  subscription_id: string;
  tier: string;
  /** The ACCESS projection: "active" grants access until `current_period_end`. */
  status: string;
  provider: string | null;
  /** Razorpay's own state — why `status` is what it is. */
  provider_status: string | null;
  provider_subscription_id: string | null;
  sku: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface SupportOrder {
  id: string;
  sku: string;
  provider_order_id: string;
  amount_paise: number;
  status: string;
  paid_at: string | null;
  created_at: string | null;
}

export interface SupportPayment {
  id: string;
  provider_payment_id: string;
  method: string;
  amount_paise: number;
  status: string;
  captured_at: string | null;
  order_id: string | null;
  subscription_id: string | null;
}

export interface SupportRefund {
  id: string;
  provider_refund_id: string;
  provider_payment_id: string;
  amount_paise: number;
  status: string;
  created_at: string | null;
}

export interface SupportCredit {
  credit_key: string;
  balance: number;
}

/**
 * Everything the support screen needs about one account.
 *
 * Deliberately carries **no birth data**. The masked family view and the
 * audited reveal are deferred (plan §5), and a test asserts their absence here
 * so this cannot quietly become the way round the reveal gate.
 */
export interface SupportView {
  account: SupportAccount;
  access: SupportAccess;
  entitlements: SupportEntitlement[];
  subscriptions: SupportSubscription[];
  orders: SupportOrder[];
  payments: SupportPayment[];
  refunds: SupportRefund[];
  credits: SupportCredit[];
  /** Purpose → granted. P1 "service" through P4 "ask_improve". */
  consents: Record<string, boolean>;
  adult_declared: boolean;
}

export interface SupportActionResult {
  detail: string;
}

/** POST body for a courtesy grant. Support may ask for at most 30 days. */
export interface GrantEntitlementBody {
  key: string;
  days: number;
  reason: string;
}

/** What support may grant. A free-text key would store access nothing reads. */
export const GRANTABLE_ENTITLEMENT_KEYS = ["premium"] as const;

/** Spec §6: support is capped here, the owner is not. */
export const SUPPORT_MAX_GRANT_DAYS = 30;

export const adminSupportPaths = {
  /** GET. Audited as a personal-data read. */
  view: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/support`,
  /**
   * POST body {reason}. Emails the account holder; the token is never
   * returned, so holding the console does not mean holding the account.
   */
  resetLink: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/reset-link`,
  /** POST body {reason}. Bumps `token_version` and revokes refresh tokens. */
  forceLogout: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/force-logout`,
  /** POST body {key, days, reason}. Answers a SupportEntitlement. */
  grantEntitlement: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/entitlements`,
  /** POST body {reason}. Owner only. Stamps `revoked_at`; deletes nothing. */
  revokeEntitlement: (userId: string, entitlementId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/entitlements/${encodeURIComponent(entitlementId)}/revoke`,
} as const;
