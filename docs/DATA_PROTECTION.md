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
and `app/services/encryption.py` each built their own `Fernet` from the same
setting. Harmless while both read one single-key setting; the moment one gained
rotation and the other did not, half the codebase would write data the other
half could not read. `app/services/encryption.py` now imports from core and
holds no key logic.

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

### The three steps, in order

1. **Prepend the new key** to `JOTHIDAM_ENCRYPTION_KEYS` and deploy. New writes
   use it; existing rows still decrypt under the old key. The app is fully
   functional here and this step is reversible.
2. **Re-encrypt existing rows:**
   ```bash
   python -m scripts.rotate_encryption_key --dry-run   # counts, writes nothing
   python -m scripts.rotate_encryption_key
   ```
   Safe to interrupt and safe to re-run: it commits per batch and re-wrapping an
   already-rotated row is a no-op in effect.
3. **Drop the old key** from the list once step 2 reports completion.

> **Running step 3 before step 2 finishes destroys data.** Every row still
> holding old ciphertext becomes permanently unreadable, and there is no way to
> find them afterwards — Fernet tells you whether the keys you offered worked,
> never which key a token actually needs. `test_rotate_bytes_makes_the_old_key_droppable`
> demonstrates exactly this failure.

### Adding an encrypted column later

Add it to `ENCRYPTED_COLUMNS` in `scripts/rotate_encryption_key.py`.
`tests/test_encryption_rotation.py` fails until you do — a column missing from
that list rotates silently, reports success, and is readable only by the key you
are about to delete. The guard scans model metadata for the `Encrypted*` types,
and keeps an explicit `_HAND_ENCRYPTED` list for columns encrypted manually
(currently `birth_profiles.encrypted_birth_payload`), which are plain
`LargeBinary` and invisible to that scan.

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

- **The privacy policy has not been updated.** §1's qualification — dump
  protection, not host-compromise protection — must reach it before it claims
  anything about encryption. Deliberately not edited here: it is a legal
  document, not a code change.
- **No purge window is configured**, so no journal entry is ever hard-deleted
  today. The mechanism exists and is tested; the number is a decision.
- **Backup expiry is unautomated.** See §3.
