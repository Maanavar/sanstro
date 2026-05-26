# CLAUDE.md

This repository is `Vinaadi AI` in a Windows workspace.

## Repo root — memorise this, never guess

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

The Korean folder name `문서` is mandatory. Do NOT substitute `Documents`, `문서`, a Bash-style path, or any variation. Every command must start from this exact path. If a command fails due to a path error, stop and re-read this line before retrying.

## Preferred shell

- **Use PowerShell** for all commands unless the user explicitly asks for Bash.
- Chain commands with `;` not `&&` (PowerShell 5.1 does not support `&&`).
- Avoid `head` — use `Select-Object -First N`.
- Avoid `2>&1` on native executables — stderr is already captured.
- When listing files, always exclude `.venv`, `.pytest_cache`, `__pycache__`, `node_modules`.

```powershell
# Correct pattern for most commands:
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
Get-ChildItem -Recurse -Filter "*.py" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\.venv|\.pytest_cache|__pycache__|node_modules' } |
  Select-Object -ExpandProperty FullName |
  Select-Object -First 30
```

## Encoding — prevent double-encoding errors

- Always set `$env:PYTHONIOENCODING = "utf-8"` before running Python commands (already in `dev.ps1`).
- Always set `$env:PYTHONUTF8 = "1"` when running pytest or any Python script that outputs Tamil text.
- Files containing Tamil characters must be saved as **UTF-8 without BOM**.
- When writing or editing `.py` files, do NOT use `Out-File` (defaults to UTF-16). Use the Write tool or `Set-Content -Encoding utf8`.
- Never re-encode a file that is already UTF-8 — check encoding first with `[System.IO.File]::ReadAllBytes(path)[0..2]` (BOM check) before any encoding operation.
- The `.env` file uses `env_file_encoding="utf-8"` (already set in `app/core/config.py`) — never change this.

## Database safety — never lose dev data

### DB topology
- **Dev DB:** Docker container `slw-postgres`, port **5432**, db `vinaadi_dev` — THIS IS THE REAL DATA DB
- **Test DB:** Docker container `slw-postgres-test` (separate container), port **5433**, db `vinaadi_test` — wipe freely
- **SQLite test:** `sqlite:///./pytest_local_test.db` — for offline/CI use only

### Rules — follow without exception
1. **Never run `alembic upgrade head` against `vinaadi_dev` without first confirming the migration is backwards-safe.** Review the migration file before applying.
2. **Never run `DROP TABLE`, `DROP SCHEMA`, or `Base.metadata.drop_all()` against `vinaadi_dev`** — ever.
3. **Never point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev` when running pytest** — conftest.py will refuse if the DB name is `vinaadi_dev`, but do not override or bypass that guard.
4. **Before running tests**, confirm the env var points to the test DB:
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
   $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
   ```
   Or use SQLite for offline tests:
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
   ```
5. **To back up dev data before risky work:**
   ```powershell
   docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
   ```
6. **To restore from backup** (use `restore-dev-db.ps1`):
   ```powershell
   .\restore-dev-db.ps1 -BackupFile backup_20260526_1400.sql
   ```
7. **`dev.ps1` runs `alembic upgrade head` on startup** — this is safe for forward-only migrations. It will NOT drop data. If a migration fails, fix the migration file, do NOT manually drop tables.

### Migration authoring rules
- Every migration must be **reversible** — always fill in the `downgrade()` function.
- Use `render_as_batch=True` in `env.py` for SQLite compatibility (already set).
- Test the migration on the test DB first: apply → verify → downgrade → verify.
- Never use `op.drop_column` or `op.drop_table` on a column/table that still has live data without confirming with the user first.

## Before running any command

1. Confirm CWD is the exact repo root path above.
2. Confirm PowerShell syntax (no `&&`, no `head`).
3. Confirm DB URL — test commands use test DB, dev server uses dev DB.
4. When searching the codebase, prefer repo-local files over `.venv`.
5. If output looks wrong, re-check the path before continuing — never assume.
