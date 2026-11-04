# Runbook — privacy request handling

Owner: the founder. Last reviewed: 2026-11-04 (admin spec L11).

Five kinds arrive: **access** (send me my data), **correction**, **erasure**,
**withdrawal** of a consent, and **grievance**. All five reach
`privacy@vinaadi.com` or Zoho Desk.

> **There is no tracker yet.** The `privacy_requests` table and its console page
> are deferred (plan §5), so the due date lives in Zoho Desk and nowhere else.
> Put the deadline in the ticket subject the moment you open it. That is the
> whole of the tracking, and it is the most likely thing to go wrong.
>
> The **grievance officer is not named** (spec §10.2, an open founder action).
> The privacy notice carries only `privacy@vinaadi.com`.

---

## 0. Before anything: is it them?

Act only on a request from the address on the account, and reply to that
address, never to a reply-to that differs from it. "Send me my data" from an
unverified sender is the easiest way to hand someone else's birth chart over.
If the address does not match, say you can only act on the registered address —
do not ask for other documents.

## 1. Access — send them their data

The person can do this themselves: Settings → Privacy & Legal →
**Download my data** (`GET /auth/me/export`), which is also what the privacy
notice tells them. Point them there first; it is faster for both of you
and leaves no copy in a mailbox.

If they cannot sign in, an owner can export for them (reason required,
elevated, audited):

Admin → Privacy → Export, or `GET /admin/users/{id}/export?reason=…`

The export is JSON, built from `app/privacy/registry.py`, which states per
store what export shows. It excludes `hashed_password` and `token_version`.

> The readable Tamil/English summary is deferred (plan §5). You are sending
> JSON. Say so in the covering mail and offer to answer questions about it,
> rather than pretending it is a report.

Send it as an attachment to the registered address. Delete your local copy
afterwards.

## 2. Correction

Most corrections are self-service and the answer is a pointer, not an action:
birth date, time and place are editable on both web and mobile, and editing
them recalculates the charts. Name and email are in Settings.

Do not edit someone's birth details on their behalf from the database. There is
no audited route for it, which is deliberate — a chart changed by an admin with
no record is indistinguishable from a bug, and the person will see the
difference.

## 3. Erasure

One path serves both routes (L5): the person's own
`DELETE /auth/me` and the console's
`DELETE /admin/users/{id}/data` (reason required, elevated, audited). **The
admin route removes the account itself**, not just its data.

What survives, detached and deliberately: orders, subscriptions, payments,
refunds and webhook events stay as accounting records with the user link set to
NULL. Audit rows keep their action with the actor nulled and the target
rewritten to `erased:<tombstone id>`. Every erasure writes an
`erasure_tombstones` row and an audit row with per-store counts.

Tell the person what stays and why — "we keep the payment record, with your
name removed, because we have to account for the money" — before you run it.
Afterwards, send the per-store counts if they ask; they are in the audit row.

**The seven external processors are manual.** The registry lists each one and
what to do. PostHog and Sentry need the account id deleted in their own
consoles; Anthropic's API logs age out on their own and nothing can request
otherwise. An erasure is not finished when the route returns 200.

Refusals are possible and are listed in the registry's refusal rules — read
them rather than improvising a reason to say no.

## 4. Withdrawal of consent

Self-service: Settings → Privacy & Legal, one toggle per purpose. It takes
effect on the next request, not overnight.

Know what each withdrawal does, because people ask:

| Withdrawn | Effect |
|---|---|
| P2 updates | Every non-transactional message stops. Alerts pause — including family digests. The in-app bell still receives them |
| P3 analytics | PostHog returns to anonymous immediately and the identity is reset |
| P4 ask improve | Questions are no longer kept for review |
| P1 service | Cannot be withdrawn while the account exists; it *is* the service. Explain that erasure is the route, and offer it |

## 5. Grievance

Reply within the ticket, in the language they wrote in. Say what you found,
what you will do, and by when. If the answer is "no", say which rule or
registry entry it follows from.

Tell them they may escalate to the Data Protection Board if your answer does
not satisfy them. The privacy notice already says this; repeating it in the
reply is not an invitation, it is the obligation.

## What this page does not cover

- **Due dates in law.** The spec's `PENDING-LEGAL` list (§1) has three open
  questions that touch this page, including Rule 8(3)'s one-year retention
  versus "erase from product, keep a minimal encrypted record for 12 months".
  Until the lawyer review, follow this page and flag anything it does not
  answer rather than deciding it in a ticket.
- Mobile in-app export and delete do not exist yet; a mobile user is directed
  to the web.
- Guest data: unclaimed guest sessions expire on their own schedule (L2). A
  guest asking for erasure has no account to erase — say that, and that the
  data goes on its own.
