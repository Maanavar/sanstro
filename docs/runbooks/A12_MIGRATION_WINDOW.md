# A12 encryption migration: maintenance window and rollback

**Status:** measured 2026-10-12 (Phase 4 D). Migration:
`migrations/versions/uu4e5f6a7b8c_encrypt_natal_inputs_and_derivatives.py`.
Drill: `scripts/a12_migration_drill.py`, run with
`.\scripts\a12-migration-drill.ps1 -Users <n>`.

This runbook estimates the window from a **measurement**. It does not set a
window or an RTO; those are the owner's targets.

## What the migration does to a live system

- Rewrites **14 columns** across `birth_profiles` (7), `charts` (2),
  `chart_planets` (4) and `family_members` (1): add a ciphertext column,
  backfill row by row in primary-key batches of 500, drop the plaintext column,
  rename.
- **One transaction.** `migrations/env.py` runs the whole `alembic upgrade` in a
  single `begin_transaction()`, and Postgres DDL is transactional. A crash or a
  failed statement rolls back to the plaintext schema; there is no
  half-encrypted state to repair.
- **Exclusive locks for the whole run.** `ALTER TABLE` takes `ACCESS EXCLUSIVE`
  on all four tables and holds it until commit. Every request that reads a
  profile or chart blocks for the duration. Treat the window as **downtime** for
  signed-in features, not a background job.
- **Requires the encryption key.** Without `JOTHIDAM_ENCRYPTION_KEY(S)` it
  refuses to start, rather than leaving plaintext behind a successful-looking
  upgrade.

## Measured timings

Synthetic population on `vinaadi_test`. Each user has one profile; one in four
also has a vault with three members. One chart per profile, nine planets per
chart.

| Users | A12 rows rewritten | Upgrade #1 | Downgrade | Upgrade #2 |
|---:|---:|---:|---:|---:|
| 1,000 | 20,000 | 19.3 s | 15.7 s | 15.1 s |
| 10,000 | 200,000 | 152.4 s | 235.6 s | 202.8 s |

Throughput is roughly linear at **~1,000–1,300 rows/s for upgrade** and
**~850–1,300 rows/s for downgrade**. "Rows" counts rows across the four tables;
`chart_planets` is 79% of them (nine per chart).

**Estimating a window:** `rows ÷ 1,000 s` is the conservative figure from this
host. For example, 100,000 users at this shape is ≈2 M rows ≈ **35 min** to
upgrade, and a downgrade is ≈ **40 min**. Count the real rows first:

```sql
SELECT (SELECT count(*) FROM birth_profiles)
     + (SELECT count(*) FROM charts)
     + (SELECT count(*) FROM chart_planets)
     + (SELECT count(*) FROM family_members) AS a12_rows;
```

**What the numbers cannot see.** They come from Docker Desktop on a Windows
laptop, where each statement crosses a port proxy (≈0.25 ms round trip). The
backfill issues **one `UPDATE` per row**, so round-trip latency dominates. A
production database on a different network path, disk and CPU will differ in
either direction. Run the drill on production-like hardware, or time a restored
copy, before committing to a window.

## Why the backfill is not batched (decided 2026-10-12)

The per-row `UPDATE` could be batched for a shorter window. It is deliberately
left as it is:

- **No production database exists yet.** At go-live, `alembic upgrade head`
  runs against an empty schema. This migration then backfills zero rows, and
  the window is nil. Its only populated runs so far are dev and test, where it
  has already been applied.
- **The change is not free.** This migration encrypts birth data. A defect in
  a rewritten backfill either leaves plaintext behind or writes ciphertext
  that cannot be read back. Batching would also require re-running the drill
  and both mutation controls, all to shorten a window nobody will sit through.

**Revisit only if a populated database is upgraded across this revision**, for
example a restored dev copy promoted to production. Run the row-count query
above first. At the measured rate, fewer than ~300,000 rows is under 5 minutes.
Above that, batch the backfill (one `UPDATE … FROM (VALUES …)` per 500-row
page) before applying it, then re-run the drill and its controls.

## Verified behaviour

Each run checks the following. Each check compares SHA-256 fingerprints of
canonicalised values; the drill never prints a decrypted value.

1. After the first downgrade, all 14 columns hold plaintext and match the
   values the application wrote.
2. After the upgrade, all 14 columns are `bytea` and every non-null value is a
   Fernet token. Decrypting it **once** yields plaintext rather than another
   token. The application reads back identical values.
3. After the downgrade, plaintext matches the original exactly, including
   Tamil text inside `raw_payload`. Row counts are identical.
4. A second upgrade from that state does **not** double-encrypt.

**The gate was proven to fail.** With `_dec_float` mutated to round to 4
places, the drill failed at the first fingerprint comparison. With the upgrade
mutated to encrypt twice, it failed on the double-encryption check. Both
mutations were reverted, and the migration file is unchanged.

**Blind spots:**
- Concurrent application traffic during the window is not exercised.
- Lock-wait timeouts against live connections are not exercised.
- A key rotation mid-migration is not exercised.
- Rows the application never writes (for example, malformed legacy plaintext)
  are not covered.
- The ORM-read check requires A12 to be the Alembic head. The drill refuses
  when head has moved past A12, and must then be extended.

## Procedure

1. Take a backup and **verify it restores** (`scripts/verify_restore.py`). That
   backup holds plaintext; see `docs/DATA_PROTECTION.md` §3.
2. Confirm the key is configured and is in escrow
   (`docs/runbooks/KEY_ESCROW_AND_RESTORE.md`). A key lost after this
   migration means the data is lost.
3. Stop the API and workers, or put them into maintenance. The locks would
   otherwise make requests hang instead of fail.
4. `alembic upgrade uu4e5f6a7b8c`. Set a statement timeout above the estimate.
   Do not set one below it, because a timeout rolls back the whole transaction.
5. Start the application. Spot-check one profile and one chart.

## Rollback

- **Before commit:** do nothing. The transaction rolls back to plaintext.
- **After commit:** `alembic downgrade tt3d4e5f6a7b` decrypts back to the
  original types. It takes about as long as the upgrade, holds the same locks,
  and needs the same key. Prefer it to a restore, which loses writes made
  since the backup.
