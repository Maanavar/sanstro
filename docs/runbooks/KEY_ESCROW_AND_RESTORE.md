# Runbook — encryption key escrow and restore drill

**Closes SEC-1 items 1 and 2** (`docs/SEC1_SECRET_CUSTODY_RULING.md` §11), the last
two S0 pre-launch blockers. Everything else in Stage 1 is built and committed;
these two act on real key material and a real backup, so they are performed, not
coded.

Budget about 40 minutes the first time.

---

## Why these two and not the other eight

`JOTHIDAM_ENCRYPTION_KEYS` decrypts birth dates, birth times, coordinates and —
since P2-1 — journal text. There is no recovery path that does not involve the
key. Not a support ticket, not a vendor, not a backup.

The other Stage 1 items reduce **exposure**: who can read the key, how many
processes hold it, whether it appears in `docker inspect`. Those matter, and they
are done. These two are the only ones that prevent **loss**, and the failure they
prevent is total and silent — the data is not corrupted, it is simply unreadable,
and you find out during the incident rather than before it.

The distinction that catches people:

> **Retiring a key is not destroying it.** Dropping a key from
> `JOTHIDAM_ENCRYPTION_KEYS` stops the *running system* needing it. Every backup
> taken before that rotation still needs it.

```
old key retention  >=  backup retention
```

Retire on the config; destroy on the calendar.

---

## Part 1 — Escrow (SEC-1 item 1)

**Goal:** the key survives the loss of the production host.

### 1.1 Pick two independent locations

"Independent" means a single event cannot take both. Same password manager in two
vaults is one location. The production host plus a backup of the production host
is one location.

| Combination | Independent? |
|---|---|
| Password manager + printed copy in a physical safe | Yes |
| Password manager + a second person's password manager | Yes |
| Password manager + cloud KMS under a different account | Yes |
| Password manager + `.env` on the production host | **No** — the host is what escrow exists to survive |
| Two vaults in the same password manager account | **No** — one credential compromise takes both |
| Encrypted archive whose passphrase is only in the password manager | **No** — that is one location wearing two coats |

Pick two rows marked Yes. Cost of a third: near zero. Cost of having one: the
product.

### 1.2 Rule: never store the key with the backup

If a backup archive and the key that decrypts it sit in the same bucket, the
encryption is decorative against the exact threat it was chosen for — a leaked
dump. `app/core/encryption.py` is explicit that a leaked dump is the *only* thing
this protects against.

### 1.3 Record the key, and record it as a register

A key with no record of when it was created, when it was retired, and which
backups still need it cannot be safely destroyed — so it never is, and the escrow
grows into a pile of unlabelled secrets nobody dares touch.

Copy this into your password manager alongside the key material. **This table
contains no key material and can live in the repo's private ops notes; the key
values must not.**

```
| Key ID | Created    | Status  | Retired    | Destroy not before | Escrow A        | Escrow B    |
|--------|------------|---------|------------|--------------------|-----------------|-------------|
| K1     | 2026-09-03 | ACTIVE  | —          | —                  | 1Password/Ops   | Safe, print |
| K0     | 2026-05-11 | RETIRED | 2026-09-03 | 2026-12-02         | 1Password/Ops   | Safe, print |
```

**"Destroy not before" is the retired date plus your backup retention window.**
If backups are kept 90 days, a key retired on 2026-09-03 is destroyable on
2026-12-02 and not one day earlier. Put that date in a calendar; it is the only
part of this that expires.

Key IDs are for the register only — the code has no notion of them yet. That is
SEC-1 item 10, and it is deliberately after the hosting decision.

### 1.4 Verify the escrowed copy is actually the live key

The failure this catches: escrowing a key from a previous deployment, a truncated
paste, or one with a trailing newline. All three look fine in a password manager.

Retrieve the key **from escrow**, not from the host, and run Part 2 with it. That
is the check. A key you have not decrypted real data with is a string you are
hoping about.

---

## Part 2 — Restore drill (SEC-1 item 2)

**Goal:** prove the backup restores *and* that the escrowed key reads it.

`scripts/verify_restore.py` does the second half, which is the half that gets
skipped. A restored dump proves Postgres accepted the bytes; every encrypted
column would still be unreadable if the escrowed key were the wrong one.

### 2.1 Take a backup

```powershell
docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
```

Production is the same command against the production container and database.

### 2.2 Create a scratch database

```powershell
docker exec slw-postgres psql -U slw_admin -d postgres -c "CREATE DATABASE vinaadi_restore_check;"
```

The name matters. `verify_restore.py` refuses any database whose name does not
contain `restore`, and refuses `vinaadi`, `vinaadi_dev`, `vinaadi_prod`,
`vinaadi_test` and `postgres` outright. It restores over whatever it is pointed
at, and this gets run out of hours by copy-paste, so the guard is on the name
rather than on the operator.

### 2.3 Restore and verify, using the key from escrow

```powershell
$env:JOTHIDAM_ENCRYPTION_KEYS = "<paste the key retrieved FROM ESCROW>"
python -m scripts.verify_restore `
  --scratch-url "postgresql://slw_admin:slw_dev_password@localhost:5432/vinaadi_restore_check" `
  --dump backup_20260903_1400.sql `
  --docker-container slw-postgres
```

Expected output, and note that no decrypted value ever appears — the script
reports the *shape* of what it read, because this output ends up pasted into
tickets:

```
Scratch database: vinaadi_restore_check
Keys configured:  1 (position 0 encrypts; all of them decrypt)
Restoring backup_20260903_1400.sql ...
Restore completed without error.

Decrypting one row per encrypted table:
  birth_profiles (birth_profile_id=1)
    birth_date_local           OK  -- a valid date in 1990, read by the newest key
    birth_time_local           OK  -- a valid time, read by the newest key
    birth_latitude             OK  -- a latitude in range, read by the newest key
    birth_longitude            OK  -- a longitude in range, read by the newest key
    encrypted_birth_payload    OK  -- a JSON object with 9 key(s), read by the newest key
  journal_entries (journal_id=1)
    note_text                  OK  -- 214 characters of valid UTF-8, read by the newest key

PASS. This backup restores and its encrypted data is readable with the key you supplied.
```

**Exit code 0 is the pass.** Read the failures literally:

| What you see | What it means | Do this |
|---|---|---|
| `COULD NOT BE DECRYPTED by any configured key` | The escrowed key is not the key that wrote this backup | Find the right one **before** the next rotation retires anything |
| `decrypted, but is not what it should be` | Right key, wrong or corrupt data | Treat the backup as suspect; take a fresh one and compare |
| `NO ROWS` | The table was empty, so nothing was proved — an empty restore passes every check there is | Use a dump that actually contains data |
| `Refusing to touch database ...` | The guard worked | Point `--scratch-url` at a scratch database |

### 2.4 Test old-key recovery

The fourth S0 line, and the one that is always skipped because everything works
without it — until a key is destroyed.

After any rotation, take a backup from **before** it, configure **only the
retired key**, and run the same command:

```powershell
$env:JOTHIDAM_ENCRYPTION_KEYS = "<the RETIRED key only>"
python -m scripts.verify_restore --scratch-url "...vinaadi_restore_check" --dump backup_from_before_the_rotation.sql
```

It should pass, and every line should say **`read by the newest key`** — because
with one key configured, position 0 is that key. If it fails, the old key has
already been destroyed too early and those backups are decoration.

Conversely, running a **current** backup with both keys configured and seeing
`read by key #1 (an OLDER key)` means the rotation never finished re-encrypting.
Run `python -m scripts.rotate_encryption_key`, then `--verify`.

### 2.5 Clean up

```powershell
docker exec slw-postgres psql -U slw_admin -d postgres -c "DROP DATABASE vinaadi_restore_check;"
```

Delete the dump file too — it is plaintext for everything that is not
field-encrypted.

---

## Part 3 — Record it

Tick the S0 block in [`../launch/GO_LIVE_CHECKLIST.md`](../launch/GO_LIVE_CHECKLIST.md)
**with the date**. A tick with no date decays into an assumption; a dated tick
tells the next reader how stale it is.

The result is true for *that backup* and *that key* only. Re-run the drill:

- after every key rotation (Part 2.4 is then mandatory, not optional)
- after any change to `ENCRYPTED_COLUMNS` — a newly encrypted column is a newly
  unverified one, which is why `test_every_encrypted_column_in_the_rotation_script_is_verified_here`
  fails the build if the two lists drift apart
- on a schedule, quarterly, whether or not anything changed

---

## Related

- [`../SEC1_SECRET_CUSTODY_RULING.md`](../SEC1_SECRET_CUSTODY_RULING.md) — the ruling these items come from
- [`../DATA_PROTECTION.md`](../DATA_PROTECTION.md) — the four-stage rotation and the retention rule
- `scripts/verify_restore.py` — this drill, executable
- `scripts/rotate_encryption_key.py --verify` — the *other* question: is it safe to retire a key yet
