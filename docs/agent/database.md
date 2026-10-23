# Database safety

Moved word for word from `CLAUDE.md` (lines 53-95) on 2026-10-22. `CLAUDE.md` keeps the short form and points here.

## Database safety — never lose dev data

### DB topology
- **Dev DB:** Docker container `vinaadi-postgres`, port **5434** (loopback only), db `vinaadi_dev` — THIS IS THE REAL DATA DB.
  Its volume `vinaadi_dev_pgdata` is `external`, so no `docker compose down -v` can delete it.
- **Test DB:** Docker container `slw-postgres-test` (separate container), port **5433**, db `vinaadi_test` — wipe freely
- **Not ours:** `slw-postgres` (:5432) and `slw-adminer` (:8081) belong to the SLW project
  (`C:\Users\senth\Downloads\SLW`). Vinaadi's dev DB lived there until 2026-10-13; never
  point Vinaadi at :5432 again. See `docs/ENVIRONMENT_AND_DUPLICATE_AUDIT_2026-10-13.md`.
- **SQLite: not an option for the suite.** `tests/conftest.py` refuses any database
  not named exactly `vinaadi_test` on `localhost:5433`, and `app/db/session.py`
  passes `max_overflow`, which SQLite's dialect rejects at import time
  (`TypeError: Invalid argument(s) 'max_overflow'`). There is no offline fallback.
  A test that genuinely needs SQLite builds its **own** engine —
  `tests/test_newsletter.py` does exactly this to prove table portability.

### Rules — follow without exception
1. **Never run `alembic upgrade head` against `vinaadi_dev` without first confirming the migration is backwards-safe.** Review the migration file before applying.
2. **Never run `DROP TABLE`, `DROP SCHEMA`, or `Base.metadata.drop_all()` against `vinaadi_dev`** — ever.
3. **Never point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev` when running pytest** — conftest.py will refuse if the DB name is `vinaadi_dev`, but do not override or bypass that guard.
4. **Before running tests**, confirm the env var points to the test DB:
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
   $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
   ```
   There is no SQLite alternative — see the DB topology above. If the Docker test
   container is not running, start it; do not reach for a different URL.
5. **To back up dev data before risky work:**
   ```powershell
   docker exec vinaadi-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
   ```
6. **To restore from backup** (use `restore-dev-db.ps1`):
   ```powershell
   .\restore-dev-db.ps1 -BackupFile backup_20260526_1400.sql
   ```
7. **`dev.ps1` runs `alembic upgrade head` on startup** — this is safe for forward-only migrations. It will NOT drop data. If a migration fails, fix the migration file, do NOT manually drop tables.
8. **`DROP TABLE` alone does not remove Postgres composite/enum types tied to a table's columns** — a leftover type can collide on recreation (`UniqueViolation`) the second time a test suite resets schema state in the same session. Test fixtures that reset schema must use `DROP SCHEMA ... CASCADE` + `CREATE SCHEMA`, not per-table `DROP TABLE`. This only reproduces against real Postgres, not SQLite.

### Migration authoring rules
- Every migration must be **reversible** — always fill in the `downgrade()` function.
- Use `render_as_batch=True` in `env.py` for SQLite compatibility (already set).
- Test the migration on the test DB first: apply → verify → downgrade → verify.
- Never use `op.drop_column` or `op.drop_table` on a column/table that still has live data without confirming with the user first.
