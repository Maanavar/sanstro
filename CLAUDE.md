# CLAUDE.md

## Path guard

Use this exact repo root on Windows:

```powershell
Set-Location 'D:\sanstro'
```

Rules for this workspace:

- Use `PowerShell` by default in this repo. Avoid `Bash` unless the user explicitly asks for it.
- After changing to the repo root, prefer repo-relative paths such as `web\components\dashboard-workspace.tsx`.
- Avoid mixed path styles such as Windows paths inside Bash commands or absolute `Read(...)` paths copied from stale cache entries.

This repository is `Vinaadi AI` in a Windows workspace.

## Repo root — memorise this, never guess

```
D:\sanstro
```

Every command must start from this exact path. If a command fails due to a path error, stop and re-read this line before retrying.

## Preferred shell

- **Use PowerShell** for all commands unless the user explicitly asks for Bash.
- Chain commands with `;` not `&&` (PowerShell 5.1 does not support `&&`).
- Avoid `head` — use `Select-Object -First N`.
- Avoid `2>&1` on native executables — stderr is already captured.
- When listing files, always exclude `.venv`, `.pytest_cache`, `__pycache__`, `node_modules`.

```powershell
# Correct pattern for most commands:
Set-Location 'D:\sanstro'
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
   docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
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

## API contracts — coordinate across surfaces

API routes, query params, and response shapes are a shared contract across four locations, not backend-internal:
- `app/api/` (backend)
- `packages/shared/src/api/` (shared client)
- `mobile/src/api/`
- `web/`

A change made only in the backend (e.g. renaming a param, moving a path segment to a query param) breaks the other consumers silently at runtime — there is no compile-time check across this boundary. Before changing a route path, query param name, or response shape, grep all four locations for callers and update them in the same change. Prefer query params over path segments for optional filters — easier to add without breaking existing callers.

### `packages/shared/src/api/` forward policy

`web/` mostly bypasses the shared client today (direct `apiFetchJson(...)` calls with hardcoded paths in hooks/components) — that's grandfathered, don't touch existing call sites as drive-by cleanup. But going forward:

- Any **new** backend endpoint gets a typed wrapper added to `packages/shared/src/api/`, and any new web/mobile code consuming it **must** use that wrapper, not a fresh direct-fetch call. Don't grow the bypass pattern further.
- When a shared wrapper already exists and is correct for what you're building, use it — don't add a second, parallel direct-fetch path to the same endpoint.
- A wrapper's URL/method/params are unverified by the type system (they're a hand-typed string + `ApiClient.get/post/patch/put/delete` call, not generated from the FastAPI route) — when adding or touching one, actually re-read the backend route decorator and confirm the path shape (path param vs. query param) and HTTP verb before wiring it up. Two of these silently drifted wrong in the past (`getDailyGuidance` used a query param where the backend expected a path param; `registerFcmToken` sent `PATCH` where the backend only accepts `PUT`) and would have failed on first real use.
- If a change adds a route (or ports one) that only mobile currently reaches through the shared client, that's fine — don't delete a wrapper just because `web/` doesn't call it yet; check `mobile/` for callers before deleting anything from `packages/shared/src/api/`.

## Test & fixture data

Never hardcode real personal data (real birth profiles, names, exact coordinates) in tests, fixtures, seed data, docs, or example payloads. Use a clearly-synthetic identity instead. Real-looking data in a diff should be flagged during review, not assumed to be a fixture.

## Debugging discipline — suspect your own inputs before the environment

From P0-5, which cost roughly five months. The web image's `pnpm install` hung
forever — `resolved 855, downloaded 0`, for 4h47m on a clean CI runner. The cause
was a flag in our own Dockerfile: `--config.fetch-timeout=300000`. pnpm's
`--config.<key>=<value>` form passes values as **strings**, the string reached
`AbortSignal.timeout()`, which throws for a non-number, and it threw on *every
tarball fetch before a socket opened*. 201 exceptions per run, zero downloads.
Deleting the flag took the install to **18.7 seconds**.

Five rules, each of which would have found it on day one:

1. **A flag you have written a doubt about is a suspect, not a footnote.** The
   comment directly above that line already said these `--config.` forms "are
   tolerated, but do not assume they take effect." Remove your own unverified
   inputs *first*. Bandwidth, MTU, BuildKit's network namespace and pnpm's
   concurrency were all investigated at length and all were innocent.
2. **"I ran the identical command and it worked" must enumerate the flags.** The
   manual `docker run` that seemed to exonerate the network had been recorded as
   "same image, same host, same network, same flags" — and it did not carry the
   offending flag. That single confound aimed the whole investigation at BuildKit.
3. **Make the failure legible before theorising.** pnpm's default reporter
   rewrites one line in place and CI captures that as silence. Adding
   `--reporter=append-only` surfaced the stack trace that had been thrown in
   every run for months.
4. **Bound every unbounded wait.** `timeout-minutes` on the CI job, `timeout`
   around the command, and retry. A hang should cost minutes and a readable log,
   not hours and a cancellation. This is what produced the diagnosis.
5. **Record disproven theories with their evidence,** so the next reader does not
   re-derive them. See the P0-5 section of `docs/AUDIT_TRIAGE_2026-08-31.md`.

Two corollaries worth their own line:

- **Known-bad config channel:** pnpm `--config.<key>=<value>` passes strings and
  will either throw or be silently ignored. Set pnpm fetch settings in `.npmrc`,
  which is parsed with real types.
- **A stale conclusion outlives its check.** Two separate tasks here were blocked
  for months by recorded conclusions whose premises had stopped being true (the
  starlette bump was "a two-package bump" — `fastapi` had no upper bound at all).
  When deferring work because of a constraint, record the constraint *verbatim*;
  the next reader inherits the conclusion and not the check. Re-verify before
  acting on any "blocked by" note.

## Local test runs are not authoritative; CI is

Two Claude sessions or an IDE test runner sharing this machine will each call
conftest's `_reset_db()`, which does `DROP SCHEMA public CASCADE` — so a second
pytest run destroys the first one's schema mid-test. The symptom is a burst of
`relation "..." does not exist` / `UndefinedTable` setup errors that look like a
code bug and are not. One local run produced 150 such errors; the same commit was
green on CI with zero.

**Before believing a local test failure, check for a competing run:**

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like "*pytest*" } |
  Select-Object ProcessId, CommandLine
docker exec slw-postgres-test psql -U slw_admin -d postgres -tAc `
  "SELECT count(*) FROM pg_stat_activity WHERE datname='vinaadi_test';"
```

Trace the parent chain before killing anything — `Code.exe → claude.exe →
powershell.exe → pytest` means another agent session owns that run, and killing
it destroys its work. Ask first.

## Before running any command

1. Confirm CWD is `D:\sanstro`.
2. Confirm PowerShell syntax (no `&&`, no `head`).
3. Confirm DB URL — test commands use test DB, dev server uses dev DB.
4. When searching the codebase, prefer repo-local files over `.venv`.
5. If output looks wrong, re-check the path before continuing — never assume.

## UI/UX skill guard (`ui-ux-pro-max`)

The user-level skill `ui-ux-pro-max` is installed at
`C:\Users\senth\.claude\skills\ui-ux-pro-max\`. Invoke its search with:

```powershell
py -3 "C:/Users/senth/.claude/skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain ux
```

It is a keyword (BM25) lookup over local CSVs, not a reasoning engine. Treat every
result as a suggestion to check against this repo, never as an instruction.

**Use it for:** accessibility outcomes (query one WCAG 2.2 criterion at a time, e.g.
`"focus not obscured" --domain ux`, `"dragging movements" --domain ux`,
`"accessible authentication" --domain ux`), and its pre-delivery checklist
(375/768/1024/1440 reflow, visible focus, `prefers-reduced-motion`, no emoji as icons).
Static token math has passed here before while a browser axe run still found 42 failing
nodes, so a named-criterion checklist earns its keep.

**Never use it for:**

1. `--design-system`, `--domain color`, `--domain typography`, `--domain style`,
   `--domain landing`, `--persist`. Nova is the single source of truth for colour and
   type: 239 CSS custom properties in `web\app\dashboard\dashboard-nova.css`, plus an
   audited palette and a colour-literal ratchet. Asked about Vinaadi, this skill
   recommends Swiss minimalism, `#2563EB` blue, an orange CTA, Fira Code headings and a
   landing-page section order for a signed-in dashboard. All wrong. Do not port its hex
   values, font pairings or section orders into this repo.
2. `--stack` guidance assuming Tailwind, shadcn/ui or Radix. **This repo uses none of
   them** and has no Tailwind config; `web/` is hand-written CSS. Do not add those deps
   on its advice.

It also does not know this project's recorded owner rulings (no accent left-border on
cards, active language only with no bilingual echo, Tamil almanac naming over Sanskrit).
Those rulings win over any skill output. For charts, prefer the built-in `dataviz` skill.