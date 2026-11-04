# Runbook — personal-data breach

Owner: the founder (there is no one else to escalate to). Last reviewed: 2026-11-04 (admin spec L11).

A breach here means birth details. Not an email list: the date, time and place
of someone's birth, their family members' too, and the questions they asked
about illness, marriage and money. That is why this runbook starts with
containment and the clock rather than with a post-mortem.

**The clock.** Spec L11 and the DPDP Rules give **72 hours** for the detailed
report to the Data Protection Board, and affected users are told without
waiting for it. Start the timer at the moment of *discovery*, not of the
breach, and write that timestamp down in the incident note before anything
else — it is the one fact you cannot reconstruct later.

> **Not legally reviewed.** The 72-hour obligation and its exact contents are
> taken from the spec's sources (§11), not from counsel. The founder's
> privacy-lawyer review (spec §10.5, due before 13 May 2027) covers this. If a
> breach happens first, engage a lawyer on the same day you engage this page.

---

## 1. Contain (first, before any analysis)

```powershell
Set-Location 'D:\sanstro'
```

| If the exposure is… | Do this | Why this and not a shutdown |
|---|---|---|
| A leaked credential (DB password, Razorpay key, JWT secret, Fernet key) | Rotate it. `docs/runbooks/KEY_ESCROW_AND_RESTORE.md` for the encryption key; `docs/DATA_PROTECTION.md` §2a for the JWT secret | Rotation ends the access; a shutdown only pauses it |
| An admin account | `POST /admin/users/{id}/force-logout` (L9) then remove the role: `DELETE /admin/users/{id}/role` | `token_version` invalidates live tokens at once; removing the role alone leaves the session |
| A live application vulnerability | The kill switches in Admin → Config (L10a), narrowest first | They stop a feature without stopping the service |
| Unknown | `maintenance_mode` | Say so to users rather than serving what you cannot vouch for |

A JWT secret rotation signs everyone out. That is the cost, and it is the right
trade during a breach — do not keep a possibly-compromised secret live to avoid
a sign-out.

## 2. Establish scope from the registry, not from memory

`app/privacy/registry.py` is the authoritative list of what this system stores,
in 48 table stores and 7 external processors. Work from it; a scope written
from recollection will miss a table and the report will be wrong in writing.

```powershell
# What the affected accounts actually hold, per store.
docker exec vinaadi-postgres psql -U slw_admin -d vinaadi_dev -c "\dt"
```

For each store ask: was it reachable by this exposure, and does it hold
personal data or only derived values. Record the answer per store, including
the negatives — "not reachable" is a finding the report needs.

**The external processors matter.** PostHog, Sentry, Anthropic, the email
provider and the push services each hold something, and a breach of *their*
systems is still your notification duty. The registry lists what each one has.

## 3. Read the audit log before it ages

```powershell
# Admin -> Audit Log, or directly. Append-only: rows cannot be rewritten.
docker exec vinaadi-postgres psql -U slw_admin -d vinaadi_dev -c "SELECT created_at, actor_email, actor_role, action, target_id, outcome FROM admin_audit_log ORDER BY created_at DESC LIMIT 200;"
```

Every mutating admin route and the two personal-data reads write one row per
request, on every outcome (L4). A `refused` or `error` row during the window is
as interesting as a success. The table has an append-only trigger, so what is
there is what happened.

## 4. Notify

**Affected users**, without waiting for the Board report. Plain Tamil and
English, through the outbox so it is recorded. A breach notice is
*transactional*, not an update — it does not need the P2 "updates" consent and
must not be suppressed by a channel preference. If you find yourself routing
it through the normal alert path, stop: use email directly to the address on
the account.

Say, in this order: what happened, what data of theirs was involved, what you
have done, what they should do, and how to reach you
(`privacy@vinaadi.com`). Do not estimate numbers you have not established.

**The Board**, with the detailed report inside 72 hours of discovery.

> The grievance officer is **not named** yet (spec §10.2 is an open founder
> action). Until one is, `privacy@vinaadi.com` is the only contact the notice
> and the privacy page carry. Naming one is part of closing a breach, not
> optional afterwards.

## 5. Afterwards

- Write the incident note: discovery timestamp, scope per store, containment
  actions with times, who was notified and when, and what the audit log showed.
- Add the gap to the plan's progress table (`docs/admin/ARCHITECTURE_PLAN_2026-11-01.md` §7)
  as its own row. A breach that produces no committed change produces no
  learning.
- Run the restore drill if any data was altered or destroyed:
  `docs/runbooks/KEY_ESCROW_AND_RESTORE.md`.

## What this page does not cover

- **Deciding whether an event is a breach.** If personal data was accessible to
  someone who should not have it, treat it as one and let the lawyer downgrade
  it. The reverse order loses the 72 hours.
- `privacy_requests` tracking — deferred per plan §5; a breach-related request
  arrives through Zoho Desk like any other (`PRIVACY_REQUEST.md`).
- Backups that predate an encryption migration hold plaintext.
  `docs/DATA_PROTECTION.md` §3 has that trap in full; it changes the scope of
  any breach involving backup media.
