"use client";

import { useState } from "react";
import type { SupportEntitlement, SupportView } from "@vinaadi/shared/api";
import { GRANTABLE_ENTITLEMENT_KEYS, SUPPORT_MAX_GRANT_DAYS } from "@vinaadi/shared/api";

/**
 * Admin → Users → the selected account (admin spec L9, launch cut).
 *
 * One screen that answers the two questions a support ticket actually opens
 * with — "who is this" and "what should they have access to" — and carries the
 * four actions that resolve it without the owner.
 *
 * Presentational, like `admin-life-focus-panel.tsx`: the console owns the fetch,
 * because elevation and the `mfa_required` retry belong in one place. The types
 * are the shared wrapper's, so the field-name contract guard covers this screen.
 *
 * Two things it deliberately does NOT do:
 * - Show birth data. The masked family view and the audited reveal are deferred
 *   (plan §5); the endpoint does not return any, and this screen must not grow
 *   a field that quietly becomes the way round that gate.
 * - Let an action through without a reason. Every one of them writes an audit
 *   row whose whole value is the "why", so the buttons stay disabled until
 *   there is one. The server refuses a blank reason too — this is the courtesy,
 *   not the gate.
 *
 * English only, like the rest of the console.
 */

/** A reason has to be a sentence someone can read back, not a keystroke. */
const MIN_REASON = 4;

function hasReason(text: string): boolean {
  return text.trim().length >= MIN_REASON;
}

function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

function day(value: string | null): string {
  if (!value) return "-";
  // Dates arrive as ISO; show the calendar day, which is all §8 records.
  return value.slice(0, 10);
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function entitlementState(row: SupportEntitlement): string {
  if (row.revoked_at) return `Revoked ${day(row.revoked_at)}`;
  if (row.is_active) return row.ends_at ? `Active until ${day(row.ends_at)}` : "Active, no end";
  return row.ends_at && row.ends_at < new Date().toISOString() ? "Expired" : "Not yet started";
}

export interface AdminSupportPanelProps {
  view: SupportView;
  /** The signed-in admin's role: decides whether revoke shows and the grant cap. */
  role: string | null;
  busy: boolean;
  onResetLink: (reason: string) => void;
  onForceLogout: (reason: string) => void;
  onGrant: (key: string, days: number, reason: string) => void;
  onRevoke: (entitlementId: string, reason: string) => void;
}

export function AdminSupportPanel({
  view,
  role,
  busy,
  onResetLink,
  onForceLogout,
  onGrant,
  onRevoke,
}: AdminSupportPanelProps) {
  const [actionReason, setActionReason] = useState("");
  const [grantKey, setGrantKey] = useState<string>(GRANTABLE_ENTITLEMENT_KEYS[0]);
  const [grantDays, setGrantDays] = useState("7");
  const [grantReason, setGrantReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const isOwner = role === "owner";
  const maxDays = isOwner ? 3650 : SUPPORT_MAX_GRANT_DAYS;
  const days = Number.parseInt(grantDays, 10);
  const daysValid = Number.isFinite(days) && days > 0 && days <= maxDays;

  const { account, access } = view;

  return (
    <div className="admin-user-detail">
      <div className="admin-metrics admin-metrics--detail">
        <div className="admin-metric">
          <span>Access</span>
          <strong>{access.state}</strong>
        </div>
        <div className="admin-metric">
          <span>Because of</span>
          {/* The question a billing ticket is really asking. */}
          <strong>{access.sources.length > 0 ? access.sources.join(", ") : "nothing"}</strong>
        </div>
        <div className="admin-metric">
          <span>Last seen</span>
          <strong>{day(account.last_seen_on)}</strong>
        </div>
        <div className="admin-metric">
          <span>On</span>
          <strong>
            {account.last_platform ?? "-"}
            {account.last_language ? ` / ${account.last_language}` : ""}
          </strong>
        </div>
        <div className="admin-metric">
          <span>Email verified</span>
          <strong>{yesNo(account.email_verified)}</strong>
        </div>
        <div className="admin-metric">
          <span>18+ declared</span>
          <strong>{yesNo(view.adult_declared)}</strong>
        </div>
      </div>

      {account.acquisition.source || account.acquisition.ref ? (
        <p>
          First touch: {account.acquisition.source ?? "direct"}
          {account.acquisition.medium ? ` / ${account.acquisition.medium}` : ""}
          {account.acquisition.campaign ? ` / ${account.acquisition.campaign}` : ""}
          {account.acquisition.ref ? ` (referral ${account.acquisition.ref})` : ""}
        </p>
      ) : null}

      <section aria-labelledby="support-consents-title">
        <h4 id="support-consents-title">Consent</h4>
        <div className="admin-metrics admin-metrics--detail">
          {Object.entries(view.consents).map(([purpose, granted]) => (
            <div className="admin-metric" key={purpose}>
              <span>{purpose}</span>
              <strong>{yesNo(granted)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="support-entitlements-title">
        <h4 id="support-entitlements-title">Entitlements</h4>
        {view.entitlements.length === 0 ? (
          <p>No entitlement rows. Access, if any, comes from a subscription.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Source</th>
                <th>From</th>
                <th>State</th>
                {isOwner ? <th>Revoke</th> : null}
              </tr>
            </thead>
            <tbody>
              {view.entitlements.map((row) => (
                <tr key={row.id}>
                  <td>{row.key}</td>
                  <td>{row.source}</td>
                  <td>{day(row.starts_at)}</td>
                  <td>{entitlementState(row)}</td>
                  {isOwner ? (
                    <td>
                      {row.revoked_at ? (
                        row.revoked_reason ?? "-"
                      ) : revoking === row.id ? (
                        <span className="admin-suspend-form">
                          <input
                            className="admin-input"
                            type="text"
                            aria-label="Revocation reason"
                            placeholder="Why revoke (required)"
                            maxLength={500}
                            value={revokeReason}
                            onChange={(event) => setRevokeReason(event.target.value)}
                          />
                          <button
                            className="admin-button admin-button--danger"
                            type="button"
                            disabled={busy || !hasReason(revokeReason)}
                            onClick={() => {
                              onRevoke(row.id, revokeReason.trim());
                              setRevokeReason("");
                              setRevoking(null);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            className="admin-button admin-button--quiet"
                            type="button"
                            onClick={() => {
                              setRevoking(null);
                              setRevokeReason("");
                            }}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          className="admin-button admin-button--quiet"
                          type="button"
                          disabled={busy}
                          onClick={() => setRevoking(row.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="support-grant-title">
        <h4 id="support-grant-title">Grant a courtesy entitlement</h4>
        <p>
          {isOwner
            ? "As an owner you are not capped."
            : `Support may grant up to ${SUPPORT_MAX_GRANT_DAYS} days. Ask an owner for longer.`}
        </p>
        <div className="admin-suspend-form">
          <select
            className="admin-input"
            aria-label="What to grant"
            value={grantKey}
            onChange={(event) => setGrantKey(event.target.value)}
          >
            {GRANTABLE_ENTITLEMENT_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <input
            className="admin-input"
            type="number"
            min={1}
            max={maxDays}
            aria-label="Days"
            value={grantDays}
            onChange={(event) => setGrantDays(event.target.value)}
          />
          <input
            className="admin-input"
            type="text"
            aria-label="Grant reason"
            placeholder="Why grant this (required)"
            maxLength={500}
            value={grantReason}
            onChange={(event) => setGrantReason(event.target.value)}
          />
          <button
            className="admin-button"
            type="button"
            disabled={busy || !daysValid || !hasReason(grantReason)}
            onClick={() => {
              onGrant(grantKey, days, grantReason.trim());
              setGrantReason("");
            }}
          >
            Grant {grantKey}
          </button>
        </div>
      </section>

      <section aria-labelledby="support-billing-title">
        <h4 id="support-billing-title">Billing</h4>
        {view.subscriptions.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Access</th>
                <th>Provider says</th>
                <th>Period ends</th>
                <th>Cancelling</th>
                <th>Provider ID</th>
              </tr>
            </thead>
            <tbody>
              {view.subscriptions.map((sub) => (
                <tr key={sub.subscription_id}>
                  <td>{sub.tier}</td>
                  <td>{sub.status}</td>
                  {/* Why `status` is what it is: a cancelled Razorpay
                      subscription stays "active" until its paid period ends. */}
                  <td>{sub.provider_status ?? "-"}</td>
                  <td>{day(sub.current_period_end)}</td>
                  <td>{yesNo(sub.cancel_at_period_end)}</td>
                  <td>{sub.provider_subscription_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No subscriptions.</p>
        )}

        {view.orders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>SKU</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {view.orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.provider_order_id}</td>
                  <td>{order.sku}</td>
                  <td>{rupees(order.amount_paise)}</td>
                  <td>{order.status}</td>
                  <td>{day(order.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No orders.</p>
        )}

        {view.payments.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {view.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.provider_payment_id}</td>
                  <td>{payment.method}</td>
                  <td>{rupees(payment.amount_paise)}</td>
                  <td>{payment.status}</td>
                  <td>{day(payment.captured_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {view.refunds.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Refund</th>
                <th>Of payment</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {view.refunds.map((refund) => (
                <tr key={refund.id}>
                  <td>{refund.provider_refund_id}</td>
                  <td>{refund.provider_payment_id}</td>
                  <td>{rupees(refund.amount_paise)}</td>
                  <td>{refund.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {view.credits.length > 0 ? (
          <div className="admin-metrics admin-metrics--detail">
            {view.credits.map((credit) => (
              <div className="admin-metric" key={credit.credit_key}>
                <span>{credit.credit_key}</span>
                <strong>{credit.balance}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="support-actions-title">
        <h4 id="support-actions-title">Account actions</h4>
        <div className="admin-suspend-form">
          <input
            className="admin-input"
            type="text"
            aria-label="Action reason"
            placeholder="Why (required, recorded in the audit log)"
            maxLength={500}
            value={actionReason}
            onChange={(event) => setActionReason(event.target.value)}
          />
          <button
            className="admin-button"
            type="button"
            disabled={busy || !hasReason(actionReason) || !account.email}
            onClick={() => {
              onResetLink(actionReason.trim());
              setActionReason("");
            }}
          >
            Email a reset link
          </button>
          <button
            className="admin-button admin-button--danger"
            type="button"
            disabled={busy || !hasReason(actionReason)}
            onClick={() => {
              onForceLogout(actionReason.trim());
              setActionReason("");
            }}
          >
            End every session
          </button>
        </div>
        {account.email ? (
          // Saying where it goes matters: the agent never sees the link, so
          // "sent" is the only confirmation either of us gets.
          <p>The link goes to {account.email}. It is never shown here.</p>
        ) : (
          <p>This account signs in with Google and has no password to reset.</p>
        )}
      </section>
    </div>
  );
}
