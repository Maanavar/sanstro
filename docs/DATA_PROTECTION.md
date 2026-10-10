# Data protection: encryption at rest, key rotation, retention

**Task:** P2-1 in `docs/AUDIT_TRIAGE_2026-08-31.md`.
**Date:** 2026-09-03.

---

## 1. What is encrypted, and what that buys

| Column | Type | Since |
|---|---|---|
| `birth_profiles.birth_date_local` | `EncryptedDate` | original |
| `birth_profiles.birth_time_local` | `EncryptedTime` | original |
| `birth_profiles.birth_latitude` / `birth_longitude` | `EncryptedFloat` | original |
| `birth_profiles.encrypted_birth_payload` | `LargeBinary`, encrypted by hand | original |
| `journal_entries.note_text` | `EncryptedString` | **P2-1** |
| `birth_profiles.birth_datetime_utc` | `EncryptedDateTime` | **A12 C** |
| `birth_profiles.birth_place` / `birth_timezone` | `EncryptedString` | **A12 C** |
| `birth_profiles.current_place` / `current_timezone` | `EncryptedString` | **A12 C** |
| `birth_profiles.current_latitude` / `current_longitude` | `EncryptedFloat` | **A12 C** |
| `charts.julian_day` / `lagna_longitude` | `EncryptedFloat` | **A12 C** |
| `chart_planets.absolute_longitude` / `degree_in_rasi` / `speed_deg_per_day` | `EncryptedFloat` | **A12 C** |
| `chart_planets.raw_payload` | `EncryptedJSON` | **A12 C** |
| `family_members.date_of_birth_local` | `EncryptedDate` | **A12 C** |

**A12 Option C (2026-10-08, migration `uu4e5f6a7b8c`).** Before it, a dump gave
the exact birth instant away through `birth_datetime_utc` and `julian_day`, and
almost as precisely through the stored longitudes. The duplicate-profile and
duplicate-member checks now narrow in SQL by owner/vault and name only, and
compare every birth field decrypted in Python.

**What a dump still shows, by ruling.** `rasi`, `nakshatra`, `pada`, `d9_rasi`,
`lagna_rasi`, `moon_rasi`, `janma_nakshatra`, `janma_pada` stay plaintext — they
are SQL-filtered and coarse. Coarse is not harmless: the set of planet signs
fixes the birth year and month, the Moon's pada narrows it to one or two days,
and the lagna sign to a ~2-hour window. So the birth *date* is still inferable
from a dump, and public copy must not say "birth details are encrypted at rest"
(`web/lib/encryption-claim-copy.test.ts`). `current_location_updated_at` stays
plaintext (a timestamp, not a place). `dasha_periods` and `varga_positions`
still have plaintext JD/payload columns but no writer and no rows;
`tests/test_birth_data_at_rest.py` fails if the chart path starts writing them.
`daily_scores` / `family_daily_scores` narratives are out of scope.

`note_text` is free text a user wrote about their own life and was the last
plaintext column of its kind. Encryption is Fernet — AES-128-CBC with an
HMAC-SHA256, so ciphertext is authenticated: a tampered value raises
`InvalidToken` on read rather than decrypting to a plausible wrong answer.

### Be precise about the benefit

This protects against **a leaked database dump. Nothing else.** The key lives in
the environment of the process that holds the data, so anyone who compromises
the application host has both. It is still worth doing — dumps escape by routes
host compromise does not: a misplaced backup, an over-broad read replica, a
restored snapshot on somebody's laptop, a decommissioned disk.

It must not be described as more than that, **least of all in the privacy
policy.** Claiming "your journal is encrypted" without that qualification is a
claim the implementation does not support.

### Two consequences of encrypting a text column

1. **The database no longer enforces the length.** `note_text` was
   `String(2000)`; ciphertext has no `VARCHAR(n)`. The `max_length=2000` on
   `app/schemas/journal.py` is now the only limit. Remove it and rows become
   unbounded.
2. **The column is unsearchable in SQL.** No `LIKE`, no `ORDER BY`, no useful
   index. This was checked before the change: journal tag extraction already ran
   in Python (`journal_service._extract_tags`) and nothing filtered on
   `note_text` in SQL. Any future full-text journal search needs a different
   design — a searchable derived index, or a deliberate decision not to encrypt.

---

## 2. Key rotation

One key path, in `app/core/encryption.py`. There used to be two — that module
and the column-types module (then `app/services/encryption.py`) each built their
own `Fernet` from the same setting. Harmless while both read one single-key
setting; the moment one gained rotation and the other did not, half the
codebase would write data the other half could not read. The column types —
now `app/db/encrypted_types.py` (moved out of `services` by A13, 2026-10-08) —
import from core and hold no key logic.

### Configuration

```bash
# Single key — the right choice until you rotate. Unchanged, still supported.
JOTHIDAM_ENCRYPTION_KEY=<fernet key>

# Rotation form: comma-separated, NEWEST FIRST. First encrypts, all decrypt.
JOTHIDAM_ENCRYPTION_KEYS=<new key>,<old key>
```

Generate a key with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### The four stages, in order

1. **ADD** — prepend the new key to `JOTHIDAM_ENCRYPTION_KEYS` and deploy. New
   writes use it; existing rows still decrypt under the old key. The app is
   fully functional here and this stage is reversible.
2. **SWITCH** — automatic, and the same deploy: the list is newest-first and
   `MultiFernet` encrypts with index 0. Named separately because "did new writes
   actually switch?" is a question worth being able to ask.
3. **RE-ENCRYPT** existing rows:
   ```bash
   python -m scripts.rotate_encryption_key --dry-run   # counts, writes nothing
   python -m scripts.rotate_encryption_key
   ```
   Safe to interrupt and safe to re-run: it commits per batch, and a value
   already under the newest key is skipped rather than rewritten.
4. **VERIFY, then retire:**
   ```bash
   python -m scripts.rotate_encryption_key --verify
   ```
   Read-only. Decrypts every stored value with the newest key **alone** and
   reports what still needs an older one. Exits non-zero unless nothing does.
   Only on a pass, and only after taking a backup, drop the old key.

> **Stage 3 completing is not evidence that stage 4 will pass.** The re-encryption
> pass runs through `MultiFernet.rotate`, which succeeds under *any* configured
> key — so "finished without an error" says nothing about which key a row now
> needs. `--verify` builds a single-key `Fernet` from the newest key and is the
> only thing that answers the retirement question.

> **Retiring the old key before stage 4 passes destroys data.** Every row still
> holding old ciphertext becomes permanently unreadable, and there is no way to
> find them afterwards — Fernet tells you whether the keys you offered worked,
> never which key a token actually needs. `test_rotate_bytes_makes_the_old_key_droppable`
> demonstrates exactly this failure.

### Retiring a key is not destroying it

```
old key retention  >=  old database backup retention
```

Dropping a key from `JOTHIDAM_ENCRYPTION_KEYS` stops the running system from
needing it. It does not make the backups stop needing it. A dump taken before
the rotation still contains old-key ciphertext, so:

```
Monday    the database is fully under K2, K1 dropped from the config
Tuesday   K1 destroyed
Friday    a backup from last month is restored -> unreadable, permanently
```

If database backups are retained 90 days, K1 stays in restricted archival escrow
for at least 90 days past the rotation, and is destroyed only as a dated,
recorded action. Retire on the config; destroy on the calendar.

### What the census means

`--verify` reports four numbers per table and in total:

| Line | Meaning | Blocks retirement? |
|---|---|---|
| Scanned | Non-null encrypted values examined | — |
| Readable by newest key | Fine. Under the encrypting key already | No |
| Still requiring an older key | Stage 3 is incomplete for these rows | **Yes** — re-run stage 3 |
| Unreadable by any key | A key is missing from the config, or the data is corrupt | **Yes** — do not retire anything; this is a restore situation |

Rows in the last two categories are logged by table, column and primary key, so
they can be looked at. Never by value.

### Adding an encrypted column later

Add it to `ENCRYPTED_COLUMNS` in `scripts/rotate_encryption_key.py`.
`tests/test_encryption_rotation.py` fails until you do — a column missing from
that list rotates silently, reports success, and is readable only by the key you
are about to delete. The guard scans model metadata for the `Encrypted*` types,
and keeps an explicit `_HAND_ENCRYPTED` list for columns encrypted manually
(currently `birth_profiles.encrypted_birth_payload`), which are plain
`LargeBinary` and invisible to that scan.

---

## 2a. Rotating the JWT secret

The same shape as §2, for a different secret and a much smaller cost. Added
2026-10-10; before that date there was no way to do this without signing
everybody out, which is why nobody did.

### Configuration

```
# Single secret — the right choice until you rotate. Unchanged, still supported.
JOTHIDAM_JWT_SECRET=<48+ random bytes>

# Rotation form: comma-separated, NEWEST FIRST. First signs, all verify.
JOTHIDAM_JWT_SECRETS=<new>,<old>
```

`JOTHIDAM_JWT_SECRETS` takes precedence when set. The singular form is **never
split on commas**, so a secret that contains one keeps working — that is the
reason the rotation form is its own variable rather than a comma in the old one.

### The three stages, in order

1. **Prepend and deploy.** `JOTHIDAM_JWT_SECRETS=<new>,<old>`. New tokens are
   signed with `<new>`; tokens readers are already holding verify against
   `<old>`. **Nobody is signed out.**
2. **Wait out a token lifetime.** `JOTHIDAM_JWT_EXPIRE_MINUTES` (1 day) for web;
   30 minutes for the mobile access token. After that window every token in
   flight was signed with `<new>`.
3. **Drop `<old>` and deploy.** `JOTHIDAM_JWT_SECRETS=<new>` — or move it back to
   the singular form, which is the tidier end state.

### Dropping it early costs a sign-out, not data

This is the one place this procedure is *less* dangerous than its
encryption-key twin, and the difference is worth being precise about:

| | Encryption key dropped early | JWT secret dropped early |
|---|---|---|
| Web | — | every signed-in reader is signed out |
| Mobile | — | access token dies; **the session survives** |
| Data | **permanently unreadable** | nothing lost |

Mobile survives because its refresh token is an opaque `secrets.token_hex(32)`
row in `refresh_tokens` (`app/api/mobile_auth.py`), not a JWT — it is not signed
with this secret at all, so a client that handles 401 → `/auth/refresh` recovers
without the reader noticing. Web has no refresh token: the session *is* the
cookie JWT.

So there is no `--verify` step and no escrow rule here. A backup never needs a
JWT secret.

### The length floor

A production API process **refuses to boot** on a secret shorter than the hash
it feeds — 32 bytes for HS256, 48 for HS384, 64 for HS512. Such a secret is
brute-forceable offline from a single captured token, and a forged token mints
any session, so this is a full authentication bypass rather than a weakness.

It refuses rather than warns because the fix is now cheap: stage 1 above, and
nobody is signed out. Before the rotation form existed, refusing here would have
forced the very outage it is trying to avoid — which is exactly why this sat
recorded as "owner decision, not done here" from 2026-10-08, when the move to
PyJWT first made the weakness visible (python-jose never said anything about
key length). Making the fix cheap is what made the rule enforceable.

The error message names the variable that is actually set, and the **position**
of each offending secret in the list — never its value. `JOTHIDAM_JWT_ALGORITHM`
is pinned to the three HMAC families (`tests/test_jwt_hmac_only.py`), so there is
no asymmetric case to consider.

### What is not covered

- **Whether this deployment's current secret clears the floor.** Only the
  deployment knows its own value. A short one is now a loud boot failure with
  the fix in the message, which is the point.
- **Revocation.** Rotating is a blunt global sign-out, not a revocation
  mechanism. Per-user is `users.token_version` (the `ver` claim, checked in
  `app/core/auth.py`); SEC-5 in `docs/MASTER_FIX_LIST.md` is still open for the
  web session.
- **A real deploy.** `tests/test_jwt_secret_rotation.py` pins the behaviour in
  process. That the operator actually waits out stage 2 is procedural.

---

## 3. Retention and hard deletion

### The problem this fixes

Journal deletion was an archive and only an archive. `delete_journal_entry` and
`apply_journal_retention_window` both set `deleted_at`; nothing ever removed a
row. A user who deleted an entry still had their text in the database
indefinitely — and encryption changes nothing there, because a key that is
present decrypts a row that was never deleted.

### The policy

| Stage | What happens | Controlled by |
|---|---|---|
| User deletes an entry | `deleted_at` set; hidden from every read path | `DELETE /api/v1/journal/{id}` |
| User's retention window | `deleted_at` set in bulk on entries older than `keepDays` | `POST /api/v1/journal/retention/apply` |
| **Grace period** | archived rows remain recoverable by an operator | `JOTHIDAM_JOURNAL_PURGE_AFTER_DAYS` |
| **Hard delete** | row permanently removed, daily at 03:00 UTC | `journal_purge` scheduled job |

**`JOTHIDAM_JOURNAL_PURGE_AFTER_DAYS` defaults to `0`, meaning never purge.**
That default is deliberate and should stay until somebody picks a number on
purpose. The correct window is a product and legal decision, not an engineering
default, and the cost of guessing is the permanent destruction of a user's
writing. Nothing is deleted until it is set.

Only rows that are *already archived* are ever in scope — the grace period is
measured from `deleted_at`, not from `entry_date`. A live entry is never
purged however old it is (`test_a_live_entry_is_never_in_scope_however_old`).

`journal_purge` is the **only** scheduled job that destroys data. Every other
entry in `SCHEDULED_JOBS` is an idempotent recompute, which is the stated reason
the admin `jobs/{id}/trigger` endpoint does not require elevation (P1-4 step 2).
That reasoning still holds only because this job is a no-op on a default
deployment. **If the default ever becomes non-zero, move this job to the
elevated set.**

### Backup expiry — operational, not implemented here

Backups are `pg_dump` output (`CLAUDE.md`, "Database safety"), written to
`backups/` and `db_backups/`. They are outside the application and no code here
expires them.

They also **contain ciphertext, not plaintext** — a dump taken today is
unreadable without the key, which is the whole point of §1. Two things follow:

- A backup taken before a key rotation needs the *old* key to restore. Do not
  drop a retired key while any backup that predates the rotation is still in
  retention. Retire the key and the backups together, or keep the key.
- Backup retention must be at least as long as the hard-delete grace period, or
  a "permanently deleted" entry is still restorable from a backup — which makes
  the deletion claim false in a way that matters legally.

Recommended, once a purge window is chosen: retain daily dumps for the same
number of days as `JOTHIDAM_JOURNAL_PURGE_AFTER_DAYS`, and no longer.

### Backups that predate an encryption migration hold plaintext

The "ciphertext, not plaintext" statement above is only true of columns that were
encrypted when the dump was taken. Every dump taken before `uu4e5f6a7b8c` holds
the 14 A12 C columns in plaintext — exact birth instant, place, timezone, current
location, longitudes, family DOB.

Policy (owner-delegated decision, 2026-10-08): **forward-only.** Old dumps are not
rewritten or re-encrypted; they age out under backup retention, and the key rule
in §2 (old key retention ≥ backup retention) applies unchanged to the new
ciphertext. Because backup expiry is not automated, "age out" is a manual step:
pre-migration dumps in `backups/` and `db_backups/` must be deleted by hand once
outside retention — and deleting them needs the owner's per-file approval. Until
then they are the most sensitive files on the host.

#### The three that were left, and what they actually held (2026-10-10)

On 2026-10-08 the owner was asked per file and kept three of the four. The
question was asked without evidence about their contents, so here it is. A
census of each dump's `users` block, joined to `birth_profiles.owner_user_id`:

| Dump | users | live birth profiles, by owner |
|---|---|---|
| `backups/vinaadi_dev_20260630_003648.sql` | 6 | **gmail.com 3**, example.local 3, jothidam.test 1 |
| `db_backups/backup_20260728_1112_pre_e2e_cleanup.sql` | 246 (227 `@e2e.test`) | **gmail.com 3**, example.local 3, example.test 11, jothidam.test 1 |
| `db_backups/backup_20260728_1120_pre_example_domain_cleanup.sql` | 19 | **gmail.com 3**, example.local 3, example.test 11, jothidam.test 1 |
| the database today | 5 | **gmail.com 3**, jothidam.test 1 |

The real owner has the **same three** birth profiles in all three dumps and in
the live database. Every row those dumps hold and the database does not belongs
to a synthetic account — `@e2e.test`, `@example.test`, `@example.com`,
`@example.local` — which is exactly what the two July cleanups deliberately
removed. So the thing they were kept for, reconstructing a cleanup that went
wrong, has nothing in them to reconstruct.

Against that: each one is a plaintext copy of the real birth instant, place,
timezone, coordinates and a family date of birth. And restoring one is no longer
a `psql` away — the A12 columns are encrypted types now, so a restore would also
need the backfill re-run.

**Decision (2026-10-10, owner delegated items 1-3 of the Codex brief): delete
all three.** A current replacement exists and was proven first, which is the
order that matters:

```
backups/vinaadi_dev_20261010_0726.sql     # ciphertext, 40.6 MB
python -m scripts.verify_restore --scratch-url .../vinaadi_restore_check
  -> PASS: 22 encrypted values across 5 tables decrypted, shapes correct
  -> restored row counts identical to live (users 5, profiles 4, charts 5,
     chart_planets 46, family_members 2, journal_entries 2)
```

That is also the first real restore drill on this project (§4.8 of
`docs/ARCHITECTURE_FINDINGS_AND_SOLUTIONS_2026-10-07.md` asked for one): a dump
taken, restored into a throwaway database, and decrypted with the configured
key. It says nothing about RPO/RTO, which are still unset.

**Not yet done.** The deletion itself is still pending — the agent session's
sandbox refused the three `Remove-Item` calls as irreversible local destruction,
so they are the owner's to run:

```powershell
Remove-Item 'D:\sanstro\backups\vinaadi_dev_20260630_003648.sql'
Remove-Item 'D:\sanstro\db_backups\backup_20260728_1112_pre_e2e_cleanup.sql'
Remove-Item 'D:\sanstro\db_backups\backup_20260728_1120_pre_example_domain_cleanup.sql'
```

Until those run, the sentence above this section still applies: they are the
most sensitive files on the host.

---

## 4. Personal data that deliberately still reaches other systems

Two decisions that are easy to mistake for oversights. Both are choices; change
either only on purpose.

### The caller IP is logged in full

`RequestLoggingMiddleware` emits `client` on every request line, and
`JsonLogFormatter`'s `_SENSITIVE_KEY_PARTS` does **not** redact it — bearer
tokens and email addresses are stripped, the IP is not. This is the one piece of
personal data still going to logs after P1-3 removed birth coordinates.

It is kept because IP-keyed rate limiting, abuse investigation and incident
triage all need it: `resolve_client_ip` feeds `RateLimitMiddleware`, and a log
line without the caller is not much use during an incident. The exposure is
bounded by log retention rather than by redaction, so log retention is the
control that matters here.

### Mobile crash reporting is not consent-gated; product analytics is

`setUser` and `trackEvent` are gated behind `setAnalyticsConsent`, which
defaults to `false` and is set from the **Usage analytics** toggle on the Me
screen (persisted in `analyticsOptedIn`, restored at launch). `captureError` is
deliberately **not** gated: crash reporting runs under legitimate interest and
carries no identity while `setUser` is withheld, whereas product analytics runs
under consent.

Withdrawing consent takes effect immediately — `setAnalyticsConsent(false)`
clears the Sentry user and resets the PostHog client rather than waiting for the
next launch. Event *properties* are separately constrained by
`ALLOWED_EVENT_PROPERTIES`, which is what stopped `rasi` reaching PostHog from
two onboarding screens.

Do not harmonise these two gates in either direction without revisiting this
section.

### Pre-existing mobile keys keep their original entropy — accepted, pre-launch

`getMasterEncryptionKey` returns whatever key is already in SecureStore, and
`hexToBytes` accepts any 64 hex characters — which a key from the old
`Math.random()` derivation also satisfies. That compatibility is intentional:
rejecting those keys would make existing installs undecryptable, and P2-6's
v2→v3 migration exists precisely so nobody loses data.

The consequence is that an install created before the entropy fix keeps a weak
key indefinitely, even though its data is now v3-encrypted. **This is accepted,
not overlooked**, on the grounds that the install base is pre-launch. Re-deciding
it means versioning the key (`v2` key → generate a strong one → re-encrypt every
value under it, with the same write-before-delete ordering the storage migration
uses), and the trigger for re-deciding is a real install base — not a code
review.

---

## 5. Still open

- **The privacy policy makes no encryption claim (A12a, 2026-10-08).** It used
  to say birth details were "encrypted at rest", which was false. Restoring any
  encryption wording needs §1's qualification — dump protection only — and the
  coarse-key residual above; the copy guard stays until then.
- **No purge window is configured**, so no journal entry is ever hard-deleted
  today. The mechanism exists and is tested; the number is a decision.
- **Backup expiry is unautomated.** See §3.
- **Three pre-A12 plaintext dumps are still on the host** (2026-10-10). Decided
  and justified in §3; the `Remove-Item` calls are the owner's to run.
- **Whether production's JWT secret clears the §2a length floor is unknown
  here.** A short one is now a boot failure with the fix in the message, so the
  first production deploy answers it either way.
