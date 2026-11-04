# Runbook — payment dispute and refund

Owner: the founder, with support handling the first reply. Last reviewed: 2026-11-04 (admin spec L11).

Most "I paid and it says free" tickets are not refund requests. Answer the
access question first; a refund given to someone whose access was simply not
showing costs you the money *and* leaves the bug.

---

## 1. Find the account from whatever they pasted

Admin → Users, one search box. It takes a Razorpay `order_…`, `pay_…`,
`sub_…` or `rfnd_…` id, a user UUID, or part of an email (L9). Use the id from
their confirmation message rather than asking for the email — someone who paid
through UPI from a different address cannot give you a matching one.

Open the account. The support panel answers the access question directly:

| Read this | It means |
|---|---|
| **Access** | What the app is granting them right now |
| **Because of** | Which halves are in force: `purchase`, `grant`, `trial`, `subscription` |
| Subscriptions → **Access** vs **Provider says** | Ours vs Razorpay's. A cancelled Razorpay subscription stays "active" here until its paid period ends — that is correct, not a bug |
| Orders / Payments | Whether the money actually arrived |

**If "Because of" is empty but a payment is captured**, the webhook did not
land or did not grant. That is §2, not a refund.

## 2. Money arrived but access did not

```powershell
Set-Location 'D:\sanstro'
# Did the event reach us at all?
docker exec vinaadi-postgres psql -U slw_admin -d vinaadi_dev -c "SELECT event_id, event_type, signature_valid, status, processed_at, error FROM webhook_events ORDER BY created_at DESC LIMIT 20;"
# What did the nightly reconciliation already notice?
docker exec vinaadi-postgres psql -U slw_admin -d vinaadi_dev -c "SELECT kind, provider_ref, found_at, auto_resolved, resolved_at, detail FROM payment_mismatches WHERE resolved_at IS NULL ORDER BY found_at DESC;"
```

Also in the console: Admin → Payments lists the open mismatches.

| What you see | Do |
|---|---|
| No row for the payment | Razorpay never delivered. Re-send the event from the Razorpay dashboard; the inbox is idempotent on `X-Razorpay-Event-Id`, so a duplicate grants nothing twice |
| `signature_valid = false` | **Do not grant anything.** Either the webhook secret is wrong (check `JOTHIDAM_RAZORPAY_WEBHOOK_SECRET`) or the request was not Razorpay. Treat the second case as a security event |
| Row present, `error` filled | The grant failed, not the payment. Read `error`, fix, re-send the event |
| Mismatch row `missing_locally` | Razorpay has a payment we do not. Re-send; if it still will not process, grant manually (§3) and record the mismatch id in the reason |

Trigger the reconciliation by hand rather than waiting for 03:30 IST:
Admin → Operations → `payment_reconciliation`.

## 3. Restore access without taking money twice

Use the courtesy grant (L9), not a second purchase and not a tier edit:
Admin → Users → the account → **Grant a courtesy entitlement**.

- Reason required; it is the audit row and the only record of why.
- Support may grant up to **30 days**. For a yearly plan whose webhook is
  stuck, grant 30 days to unblock the customer *today* and fix the webhook —
  do not ask an owner for 365 days to paper over it.
- A grant is `source="grant"`, separate from anything bought, so revoking it
  later cannot touch the purchase.

## 4. An actual refund

Refunds are issued **in the Razorpay dashboard**, not from this console. There
is no refund button here on purpose: the money movement is Razorpay's, and a
button that only recorded our half would drift from theirs.

Refund and chargeback terms also have to match the published Refund &
Cancellation page (spec §10.2) — if this page and that page ever disagree, the
published page is what the customer relied on.

After refunding there:

1. Razorpay sends `refund.created` / `refund.processed`. On a **processed, full**
   refund the webhook sets the order to `refunded` and **reverses the credits it
   granted** (`apply_refund`, idempotent on `refund:<order>:<key>`). A partial
   refund marks the order `partially_refunded` and keeps the credits; a pending
   refund changes nothing. Confirm the credit balance on the support panel.
2. A negative balance means the credits were already spent. That is the
   founder's call (D-18), not a bug: the balance blocks further use rather than
   hiding the debt.
3. **Know what a one-time purchase actually grants.** Read the SKU's two
   columns and you know: `credit_grants` is credits to spend (the reports),
   `entitlement_grants` is days of access (a pass). A SKU may carry either or
   both. A pass purchase makes a real `entitlements` row with
   `source="purchase"`, visible on the support panel, and a full refund revokes
   that order's row — stamped `revoked_at`, not deleted, so the history of why
   someone had access on a given day survives the argument.
4. **A second pass extends; a refund of the first does not touch the second.**
   Rows are matched by order, so someone who bought two months and refunded one
   keeps the other. If a customer says "I bought twice and only got a month",
   check for two rows, not one.
5. If the credits were not reversed, the webhook did not land — §2. Re-send the
   event rather than adjusting the ledger by hand; it is idempotent.

> **A misconfigured pass SKU shows up in Admin → Mismatches**, kind
> `product_entitlement_grant`, not as a silent nothing (ARC-43). It means the
> SKU names a key no code reads, or a duration that is not a positive number of
> days: the customer was charged and got their credits, but the access half of
> that SKU granted nothing. Fix the product row, then grant the days as a
> courtesy (§3) — do not ask for a second payment.
>
> Only `premium` is a grantable key, and only a `one_time` SKU may carry grants
> at all; the database refuses a subscription SKU with them, because
> subscription access is computed live from `subscriptions` (ARC-13).

For a subscription the customer wants to stop rather than reverse, use
`POST /payments/subscription/cancel` (the customer can do this themselves in
Settings). Access runs to the period end — say so, or they will write again on
the day it stops.

## 5. A chargeback

Razorpay notifies the dispute. Treat it as a refund for access purposes
(revoke, with the dispute id in the reason) and gather the evidence from here:
the order and payment rows, the webhook event, and the audit rows for anything
an admin did to that account. Do not attach birth data to a dispute file.

## What this page does not cover

- **Invoices and GST.** `tax_paise` and `invoice_number` are columns waiting on
  the founder's CA (spec §10.4). Until they are filled there is no invoice to
  send; say that plainly rather than improvising one.
- Pricing changes. Amounts always come from `products`; a tampered client
  amount is ignored, so a "wrong price" ticket is a `products` row to check,
  not a payment to adjust.
- Payments are live only once the founder's Razorpay actions in plan §7 are
  done. Before that, everything above is test mode.
