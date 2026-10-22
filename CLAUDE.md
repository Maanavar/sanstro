# CLAUDE.md

Vinaadi AI, Windows workspace. Repo root is **`D:\sanstro`**, always. Never guess it;
if a command fails on a path, re-read this line before retrying.

Detail lives in `docs/agent/`. Read the file a section names before working in that area.

## Shell
- PowerShell by default; Bash only if the user asks. Start from `Set-Location 'D:\sanstro'`,
  then use repo-relative paths. Never mix path styles.
- PS 5.1: chain with `;` (no `&&`), `Select-Object -First N` (no `head`), no `2>&1` on native executables.
- Exclude `.venv`, `.pytest_cache`, `__pycache__`, `node_modules` when listing or searching.

## Encoding
- Set `$env:PYTHONIOENCODING = "utf-8"` and `$env:PYTHONUTF8 = "1"` before Python that prints Tamil.
- Tamil files are UTF-8 **without BOM**. Never `Out-File` source; use the Write tool or
  `Set-Content -Encoding utf8`. Check the BOM before re-encoding anything already UTF-8.
- Never change `env_file_encoding="utf-8"` in `app/core/config.py`.

## Databases — never lose dev data
| | Container | Port | DB |
|---|---|---|---|
| Dev (real data) | `vinaadi-postgres` | 5434 | `vinaadi_dev` |
| Test (wipe freely) | `slw-postgres-test` | 5433 | `vinaadi_test` |

`slw-postgres` (:5432) and `slw-adminer` (:8081) belong to another project; never point Vinaadi at them.
The dev server uses the dev DB; every test command uses the test DB.

1. Never `DROP TABLE`, `DROP SCHEMA` or `drop_all()` against `vinaadi_dev`.
2. Review a migration before `alembic upgrade head` on dev. Migrations must be reversible.
3. pytest always runs on the test DB. Set both, and never bypass conftest's guard (there is no SQLite
   fallback). If the test container is down, start it; never reach for a different URL.
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
   $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
   ```
4. Back up before risky work:
   `docker exec vinaadi-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql`

Restore, migration authoring, Postgres type cleanup: `docs/agent/database.md`.

## API contracts — coordinate across surfaces
Routes, query params and response shapes are shared by `app/api/`, `packages/shared/src/api/`,
`mobile/src/api/` and `web/`. Grep all four before changing one, and update them in the same change.
New endpoints get a typed wrapper in `packages/shared/src/api/`, and new callers use it.
Policy and past drift: `docs/agent/api-and-display.md`.

## Display boundary — never render a name the server chose
| Read this | Not this | Through |
|---|---|---|
| `rasi` (number) | `rasiName`, `rasiCode`, `lagnaRasiName`, `munthaRasiName` | `rasiDisplayName(rasi, lang)` — `lib/chart-utils` |
| `graha`, `lord` | the bare string | `tPlanetLord(key, lang)` — `lib/i18n` |
| `nakshatraName`, tithi, yoga, karana | the bare string | `tNakshatra` / `tTithi` / `tYoga` / `tKarana` |
| Saturn-cycle `type` | the bare tag | `saniCycleName(tag, lang)` — `lib/family-flags` |

A field ending in `Name` or `Code` is the wrong field. `title=` and `aria-label=` count as rendering.
Check Tamil mode. Why and history: `docs/agent/api-and-display.md`.

## Testing
- CI is authoritative. Before believing a local failure, check for a competing pytest run (it wipes
  the shared test schema). Never kill another session's run without asking.
- A gate proves its own check, not the item. Run a new gate once with the fix removed and confirm
  it fails, then write its blind spot beside the PASS.
- Never put real personal data (birth details, names, coordinates) in tests, fixtures, seeds, docs
  or payloads. Use synthetic identities.

Commands and cases: `docs/agent/testing-and-debugging.md`.

## Debugging — suspect your own inputs first
Remove flags you doubted first. List every flag when claiming "same command". Make failures legible
before theorising. Bound every wait. Record disproven theories. Set pnpm options in `.npmrc`, never
via `--config.<key>=<value>`. Re-verify any "blocked by" note before acting on it.
The P0-5 case: `docs/agent/testing-and-debugging.md`.

## UI/UX skill (`ui-ux-pro-max`)
Use it only for accessibility criteria and its pre-delivery checklist. Never for colour, type,
style, landing layouts or stack advice: Nova (`web\app\dashboard\dashboard-nova.css`) is the source
of truth, and the repo uses no Tailwind, shadcn or Radix. Owner rulings beat skill output.
Command and details: `docs/agent/ui-ux-skill.md`.
