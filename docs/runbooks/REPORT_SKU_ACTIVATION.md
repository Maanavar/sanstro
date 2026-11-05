# Runbook — putting the two report SKUs on sale (ARC-14)

**Status: not done. This is the one step between a working report deliverable
and selling it.** Everything else shipped; running the SQL below is the
decision to charge money, and it is the owner's to make.

## Why this is a runbook and not a migration

It was written as an Alembic migration first and that was wrong. A migration in
the chain is applied by the next `alembic upgrade head` — on dev, in CI, in
production, by anyone, as a side effect of an unrelated deploy. "Two SKUs go on
sale" must not be something that happens because someone upgraded a schema. So
it is a deliberate, reviewed statement, run by hand, recorded here.

## The condition ARC-14 set

> a report SKU goes active when its deliverable ships and has a test buying it
> end to end.

Met as of 2026-11-05:

| What ARC-14 asked for | Where it is |
|---|---|
| A real deliverable | `app/services/report_pdf_service.py` → a stored PDF in `reports` |
| A credit can be spent on it | `app/services/report_delivery_service.py` |
| Premium's monthly inclusions enforced | same file, `_included_used` + `allowance_for` |
| A test buying it end to end | `tests/test_report_delivery.py` — 26 tests |
| The fake way to buy is gone | `POST /reports/purchase` deleted; web page rewritten |

The delivery path does **not** read `products.active`. It reads the
`credit_ledger`. So activation controls whether a new credit can be *bought*,
and nothing else.

## Before

```powershell
Set-Location 'D:\sanstro'
docker exec vinaadi-postgres pg_dump -U slw_admin vinaadi_dev > "backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql"
```

Confirm what you are about to change, and that the prices are the ones you mean
(they are rows, not code — D-08):

```sql
SELECT sku, name_en, price_inr_paise, credit_grants, active
FROM products
WHERE sku IN ('jadhagam_report', 'porutham_report');
```

Expect two rows, `active = false`, `price_inr_paise = 9900` (₹99 each), each
granting one credit of its own key.

## Activate

```sql
UPDATE products
   SET active = true, updated_at = now()
 WHERE sku IN ('jadhagam_report', 'porutham_report')
   AND deleted_at IS NULL;
-- expect: UPDATE 2
```

## After — check the thing a buyer sees, not the row

1. `GET /api/v1/payments/products` includes both SKUs with
   `available: true` (one-time products are available as soon as they are
   active; only subscriptions additionally need a `razorpay_plan_id`).
2. `/dashboard/upgrade` lists them and the Buy button opens Razorpay. That is
   the only route whose CSP allows checkout.js (`isCheckoutPath` in
   `web/lib/security-headers.ts`) — the reports page deliberately links here
   rather than opening checkout itself.
3. Buy one in Razorpay test mode. Then on `/dashboard/reports` the allowance
   shows the credit, making a report spends it, and the PDF downloads.
4. `/dashboard/reports` must now offer "Buy a report" where it previously said
   reports were not on sale. That copy is driven by whether the SKU comes back
   from `listPaymentProducts()`, so it follows this change with no deploy.

## Reversing it

```sql
UPDATE products
   SET active = false, updated_at = now()
 WHERE sku IN ('jadhagam_report', 'porutham_report');
```

This stops new purchases. It does **not** strand a credit someone already
bought: `POST /reports` reads the ledger, so an unspent credit stays spendable
and an already-delivered report stays downloadable. Refunds are
`docs/runbooks/PAYMENT_DISPUTE_AND_REFUND.md`.

## What is still open after activation

- **Mobile can make and save a report, but cannot buy a credit.** That is
  deliberate: Apple and Google require their own purchase flow for digital
  goods. So activating these SKUs adds a *web* purchase path only, and a phone
  user spends what their Premium plan includes or what they bought on the web.
  If you want in-app purchase of report credits, that is a store product
  (RevenueCat, `mobile/app/premium.tsx`) and a separate piece of work.
- **`ask_topup_10` is still inactive** and is not covered here. Its deliverable
  (Ask Vinaadi questions) exists, so it is a separate ARC-14 judgement.
- **The Tamil document is unreviewed.** The report renders in Tamil and is
  sized and tested, but the wording has not had a native review (Phase 4 owner
  decision). A Tamil report is sellable only if that is acceptable.
