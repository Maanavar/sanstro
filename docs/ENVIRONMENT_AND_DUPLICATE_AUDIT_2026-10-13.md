# Environment & Duplicate-Page Audit — 2026-10-13

## Resolution — applied 2026-10-13 (owner-delegated)

Owner context: the repo moved from the OneDrive clone to `D:\sanstro` and has
lived only there since. `Downloads\SLW` is an unrelated project.

| Item | Done | Verified by |
|---|---|---|
| D1 | `vinaadi_dev` copied to a **new Vinaadi-owned container** `vinaadi-postgres` (`127.0.0.1:5434`, external volume `vinaadi_dev_pgdata`). The copy streamed container-to-container, so no dump touched disk. | 42/42 tables, 43,788/43,788 rows, **per-table md5 of every row identical**; same 126 indexes, 120 constraints, 42 types, 36 functions, extensions, alembic `uu4e5f6a7b8c` |
| — | `.env`, `.env.example`, `dev-docker.ps1`, `run-tests-safe.ps1`, `restore-dev-db.ps1`, `scripts/verify_restore.py`, `scripts/compose-proxy-smoke.ps1`, CLAUDE.md, AGENTS.md, README, HOW_TO_USE_CODEBASE, key-escrow runbook all point at `vinaadi-postgres:5434` | `vinaadi-dev-api` restarted: `/health/ready` 200, DB check ok, 1 session on the new DB, 0 on the old |
| D2 | `slw-postgres-test` and `slw-mailhog` recreated from `D:\sanstro` (compose labels now point here, `restart: unless-stopped`) | labels inspected; test DBs `vinaadi_test`, `vinaadi_e2e`, `vinaadi_migcheck` intact |
| D3 | `postgres` (SLW's container) and `adminer` removed from this compose file | bare `docker compose up -d` exits 0 |
| D4 | Both hint strings fixed | — |
| D6 | `sanstro_vinaadi_db_data` removed | — |
| D7 | 11 unreferenced images removed; build cache older than 7 days pruned | images 11.9 → 4.1 GB; cache 10.75 → 6.25 GB; **~12.3 GB freed** |
| R1 | Commit `e6d7e66` rescued into local branch `rescue/onedrive-ignorefiles-e6d7e66` (not pushed). Clone-only files checked: `.env` keys all present in D:, the clone's `REVENUECAT_API_KEY` is a `test_` key superseded by the two current keys, `web/.env.local` identical | hashes / key names compared, values never printed |
| — | The dev DB port is now loopback-only (it was `0.0.0.0:5432`) | LAN-address connect to 5434 fails; loopback succeeds |

**Second pass, owner-approved (same day):**

| Item | Done | Verified by |
|---|---|---|
| D5 | `vinaadi_dev` (old copy) and `vinaadi_test` dropped from `slw-postgres`. SLW had stopped that container (clean exit 0 at 04:44 UTC, not by this work); it was started only for the drop and stopped again. | databases left: `postgres`, `slw_local` (14 tables intact) |
| R1 | OneDrive clone deleted (1.9 GB, 95k files, including the three June birth-data dumps). One empty `.pytest_cache` dir remains: its ACL denies the user even reading it, so removal needs an elevated shell. | `Test-Path` on every file |
| B4 | Mobile `learn/nakshatra-list.tsx` + `learn/nakshatra-detail.tsx` deleted, the duplicate "27 Nakshatras" tile removed from Tools, and their only data source `packages/shared/src/data/nakshatras.ts` + its export deleted. The surviving `tools/natchathiram` detail is a superset (backend ganam/yoni, profile, strengths, cautions, compatible groups vs static deity/planet/qualities/description/compatibility). | repo-wide grep: 0 references |
| B5 | `LEARN_CONTENT` moved verbatim (221 lines, byte-identical, checked by script) to `mobile/src/lib/learnContent.ts`; the shadowed `learn/[slug].tsx` route deleted. `_article.tsx` (with the GRW-04 `SITE_HOST` fix) stays as the renderer. | — |
| — | Gates, before → after | mobile `tsc` 0 → 0 errors; shared `tsc` 0 errors; mobile Jest 22/22 suites, 179/179 tests; colour ratchet pass → pass (333 → 332, baseline tightened by exactly one key); touch-target gate **already failing before** (108) → 102, nothing new |

**Correction to B2 below.** The 14 "double-sourced" guide slugs were judged from file
structure, not content. Reading the bodies:
- **Sevvai dosham is not a duplicate.** Its `DOSHAM_DETAILS` entry reuses the
  marketing strings (`DOSHAM_SEVVAI.*`, `DOSHAM_SEVVAI_FAQ`), so there is one source.
- **The other 13 are two different texts, both live.** The public page renders
  `marketing-i18n/*`; signed-in users render the independently written
  `guide-detail-content.ts` entry (0 shared constants for temples and pariharam; the
  Naga entry adds Thirukanitham sections the public page lacks). Deleting either copy
  removes content from one audience, so **nothing was deleted**. The right fix is the
  Sevvai pattern (point the dashboard entry at the reviewed marketing strings), slug by
  slug, after choosing the better text. That is content work, not cleanup.
- `pariharam/[slug]` currently serves no URL but is kept: it is the fallback that
  would serve any new `PARIHARAM_DETAILS` slug, or a slug whose static folder is retired.

**Follow-up noticed, not changed:** the mobile Learn articles' "Full guide" card says an
article exists on the website but is not tappable. The deleted `[slug]` renderer had a
tappable version, but its `webPath`s (`/learn/birth-time`, `/learn/jadhagam`, …) do
not match the real web routes (`/learn/why-birth-time-matters`, …).

**Still open:** B6 unreachable mobile `src/` modules and the B1 web orphans. They are
dead code, not duplicates, so they were not covered by this approval.

---

Scope: (A) every Docker container, image, volume and network on this machine;
(B) duplicate or superseded pages and screens in `web/`, `mobile/` and
`packages/shared/`; (C) repo-level leftovers. This audit is **read-only**: nothing
was stopped, deleted or edited. Every action below is a proposal.

Method: `docker inspect` on each container (to read compose labels, mounts and
env), `psql` against both Postgres servers, and an import-graph
**reachability** scan. The scan starts from every Next.js route and every
expo-router screen and reports any source file that no live entry point can
reach. Unlike a zero-importer grep, it also catches a dead *chain*, such as an
unused old home page that imports its own unused children.

---

## A. Docker

### A1. The five containers are not duplicates

Docker Desktop shows two groups, `sanstro` and `slw`, which makes it look like
two Postgres servers plus a spare. They are five different things:

| Container | Compose project (where it was launched from) | Port | What it holds | Verdict |
|---|---|---|---|---|
| `vinaadi-dev-api` | none (`dev-docker.ps1`, image `vinaadi-api:smokecheck`) | 127.0.0.1:8000 | Vinaadi API with `app/` bind-mounted | **Keep** |
| `slw-postgres` | `slw` → `C:\Users\senth\Downloads\SLW` | 5432 | `vinaadi_dev` (75 MB, **real data**), `slw_local` (12 MB, the SLW project), `vinaadi_test` (11 MB, stale) | **Keep. Shared by both projects** |
| `slw-adminer` | `slw` → `Downloads\SLW` | 8081 | DB web UI for both projects | Keep (optional) |
| `slw-postgres-test` | `sanstro` → `C:\Users\senth\OneDrive\문서\GitHub\sanstro` | 5433 | `vinaadi_test`, `vinaadi_e2e`, `vinaadi_migcheck` | **Keep** |
| `slw-mailhog` | `sanstro` → OneDrive clone | 1025 / 8025 | dev mail catcher | Keep |

`Downloads\SLW` is a separate project (SivaLatheWorks, `github.com/Maanavar/SLW`,
Vite + Prisma). Its container also happens to host Vinaadi's dev database. So
the "other project" group cannot just be left alone or removed: removing it
removes `vinaadi_dev`.

CPU is idle and memory is about 730 MB in total. Nothing here is costing
meaningful resources.

### A2. Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| D1 | **HIGH** | **The SLW project's compose file owns the volume that holds `vinaadi_dev`.** `Downloads\SLW\docker-compose.yml` declares `slw_postgres_data` as a normal (non-external) volume, so running `docker compose down -v` from that folder deletes `slw_slw_postgres_data`, and `vinaadi_dev` with it. Vinaadi's own `docker-compose.yml` correctly marks the same volume `external: true`; the SLW side does not. | `docker inspect slw-postgres`; both compose files |
| D2 | MEDIUM | **The `sanstro` compose project is registered against the stale OneDrive clone**, not `D:\sanstro`. The labels on `slw-postgres-test` / `slw-mailhog` point at `OneDrive\문서\GitHub\sanstro\docker-compose.yml`. The two compose files are currently byte-identical, so nothing is broken yet. But Docker Desktop's "open folder" and any future edit to `D:\sanstro\docker-compose.yml` will diverge from what is actually running. | compose labels |
| D3 | MEDIUM | **`docker compose up -d` (no service name) from `D:\sanstro` fails**: it tries to create `slw-postgres` and `slw-adminer`, which already exist under project `slw`, and errors with "container name already in use". Only `up -d postgres_test` / `mailhog` work. | `docker-compose.yml` names the same `container_name`s as SLW's |
| D4 | LOW | **Two startup hints name services that don't exist.** `dev-docker.ps1:85` says `docker compose up -d db`, but `db` exists only in `docker-compose.app.yml`, so the hint is wrong. `test-docker.ps1:78` says `postgres-test`, but the service is `postgres_test`. Following either hint gives "no such service". | the two scripts |
| D5 | LOW | **A stale `vinaadi_test` database sits on the dev server (5432)**: 24 tables, no stats. Nothing can use it, because `tests/conftest.py` refuses anything except `localhost:5433/vinaadi_test`. It is just confusing to have a "test DB" next to the real one. | `pg_database` on 5432 |
| D6 | LOW | **Orphan volume `sanstro_vinaadi_db_data`.** It was created 2026-09-03 by a `docker-compose.app.yml` run, no container uses it, and its contents are **empty** (4 KB, no `PG_VERSION`). Safe to remove. | `docker run busybox du` |
| D7 | LOW (disk) | **About 10 GB of images that nothing in the repo references**: the P0-5 pnpm investigation images (`dbgpnpm`, `dbgpnpm2/3/4`, `lockcheck`, `lockcheck2`, `mtuprobe`, `nettest`), `vinaadi-deps-nocap` (2.6 GB), `vinaadi-swe312` (1.6 GB) and `node:20-slim` (the web Dockerfile now uses `node:22-slim`). There is also **6.1 GB of reclaimable build cache**. | `docker images`; grep of `*.ps1`, `Dockerfile*`, `docker/`, `.github/` |

Things that look odd but are **not** problems:

- `vinaadi-dev-api` has `JOTHIDAM_DATABASE_URL` twice in its environment. This is
  deliberate: `.env` comes first, then `-e` overrides it with `host.docker.internal`
  (commented at `dev-docker.ps1:103`).
- The image tag `vinaadi-api:smokecheck` is the dev image's real name
  (`dev-docker.ps1:72`), not a leftover.
- `vinaadi_e2e` and `vinaadi_migcheck` on 5433 are in use by
  `scripts/e2e-backend.ps1`, `scripts/ux-audit-stack.ps1` and the migration check.

### A3. Proposed fixes, in order

1. **D1: protect `vinaadi_dev` first.** Back it up now:
   ```powershell
   docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backups\vinaadi_dev_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
   ```
   Then choose one of the following:
   - *(Recommended)* Give Vinaadi its own dev Postgres in `D:\sanstro\docker-compose.yml`
     (for example `vinaadi-postgres`, a new volume, port 5434 or 5432 once SLW moves)
     and restore the dump into it. Each project then owns its own data, and
     the CLAUDE.md "Dev DB" line changes in the same commit.
   - *(Minimum)* In `Downloads\SLW\docker-compose.yml`, mark the volume
     `external: true, name: slw_slw_postgres_data` so `down -v` can't delete it.
     This is a one-line edit in the other repo.
2. **D2 + D3: re-home the compose project.** Once (1) is decided, run
   `docker compose up -d postgres_test mailhog` from `D:\sanstro` so the labels
   point at the real repo. Then remove `postgres` and `adminer` from
   `D:\sanstro\docker-compose.yml`, or put them behind a `profiles: [shared-db]`
   entry, so a bare `up -d` stops colliding with SLW.
3. **D4:** change the two hint strings to `docker compose up -d postgres` and
   `docker compose up -d postgres_test`.
4. **D5:** `DROP DATABASE vinaadi_test;` **on 5432 only**, after confirming you
   don't use it from SLW. (It is not `vinaadi_dev`, but it sits on the dev
   server, so ask first.)
5. **D6:** `docker volume rm sanstro_vinaadi_db_data`
6. **D7:**
   ```powershell
   docker rmi dbgpnpm:latest dbgpnpm2:latest dbgpnpm3:latest dbgpnpm4:latest lockcheck:latest lockcheck2:latest mtuprobe:latest nettest:latest vinaadi-deps-nocap:latest vinaadi-swe312:latest node:20-slim
   docker builder prune -f
   ```
   Do **not** run `docker system prune -a --volumes`, because it would also
   remove volumes.

---

## B. Duplicate pages and screens

### B1. Web dashboard and home: no duplicate found

Reachability scan over 720 files in `web/`: **every** dashboard and home
component is reached from a live route. There is no second dashboard home, no
"v2" tree, and no non-Nova twin of a `*-nova.tsx` file. (`-nova` is the only
design system since the Nova-only migration; the suffix is a naming
convention, not a version marker.) `app/dashboard/(workspace)/page.tsx` and
`[...segments]` are the single dashboard shell.

Only five web source files are unreachable:

| File | Status | Proposal |
|---|---|---|
| `components/advanced-lens-note.tsx` | **Unshipped feature, not dead.** Recorded 2026-08-10 as deliberately kept (dasha-lens framing for Issues #7/#8) | Keep, or wire it in as its own task |
| `components/ui/progress-bar.tsx` (11 lines) | No importer | Delete |
| `components/mode-badge.tsx` | Imported only by its own test | Delete with its test, or wire it in |
| `lib/peyarchi.ts` | Imported only by its own test | Delete with its test |
| `lib/uiux-enhancements.ts` | Imported only by its own test | Delete with its test |

### B2. Web: 14 public guide URLs have two content sources (**the real duplicate**)

Each of these slugs exists **both** as a hand-written static page
(`page.tsx` + `PageContent.tsx`) **and** as an entry in
`web/lib/guide-detail-content.ts`, which its `[slug]` dynamic route also
generates:

| Section | Slugs with both versions |
|---|---|
| `/dosham/` | `sevvai-dosham`, `naga-sarpa-dosham`, `kala-sarpa-dosham`, `pithru-dosham`, `kalathra-dosham` (5) |
| `/temples/` | `arupadai-veedu`, `pancha-bhoota-sthalams`, `thirumananjeri` (3) |
| `/pariharam/` | `rahu-ketu-pariharam`, `sevvai-dosha-pariharam`, `naga-dosha-pariharam`, `kadan-pariharam`, `puthra-pariharam`, `ayul-pariharam` (6, **every** `PARIHARAM_DETAILS` entry) |

Next.js always serves the static folder over `[slug]`, so:

- **The public sees the static version**, but **signed-in users see the
  `guide-detail-content.ts` version** (`dashboard-explore-guide-nova.tsx` reads
  it via `getGuideDetail`). The same dosham is written twice, and a fix in one
  copy does not reach the other.
- `app/(marketing)/pariharam/[slug]/page.tsx` **serves no URL at all**: all six
  of its slugs are shadowed by static folders.
- `sitemap.ts` builds these URLs from the `*_DETAILS` keys, so the sitemap is
  generated from the source the public never sees.

This is the "built two versions, kept one, forgot the other" pattern, at the
content level rather than the dashboard level.

**Proposal (needs your decision, because it changes SEO pages):**
make `guide-detail-content.ts` the single source, since the dashboard
already depends on it. Then:
1. move each static page's extra SEO material (keywords, FAQ JSON-LD, Tamil
   metadata) into the `GuideDetail` entry or a per-slug metadata map;
2. delete the 14 static folders so `[slug]` serves them;
3. before deleting, diff the two texts for each slug and keep whichever was
   reviewed (the static Tamil copy may be the newer reviewed text).

The alternative, keeping the static pages and dropping the 14 `*_DETAILS` entries,
would break the dashboard's guide cards, so it is not recommended.

### B3. Web: consolidation opportunities (not stale code)

- `natchathiram/<27 stars>/page.tsx`: 27 near-identical 18-line files that
  differ only by the data constant. These could be one `[slug]` route.
- `natchathiram/<27>/visual/page.tsx`: 27 files of about 235 lines with the score data
  inlined. They are live (linked from `natchathiram-page.tsx:80`, in the sitemap),
  but the data belongs in `lib/` with a single `[slug]/visual` route.

Neither is a dead duplicate. Both are copy-paste that will drift. Low priority.

### B4. Mobile: two parallel nakshatra browsers (**duplicate feature**)

Both are linked from the same Tools screen (`app/(tabs)/tools/index.tsx`):

| Tile | Route | Data source | Added |
|---|---|---|---|
| "Nakshatra · Traits, deity & padas" | `/(tabs)/tools/natchathiram` → `natchathiram/[slug]` | `NAKSHATRA_LIST` + API query | 2026-06-22 |
| "27 Nakshatras · Browse all lunar mansions" | `/learn/nakshatra-list` → `learn/nakshatra-detail` | static `NAKSHATRA_DATA` | 2026-06-27 |

A user sees two tiles for the same 27 stars, with different detail pages
and different data. **Proposal:** keep the tools version (it has the API-backed
detail and prev/next navigation), point the Learn tile at it, and delete
`learn/nakshatra-list.tsx` + `learn/nakshatra-detail.tsx` (about 323 lines) after
checking whether `NAKSHATRA_DATA` carries anything the tools page lacks.

### B5. Mobile: `learn/[slug].tsx` screen is shadowed

The six static `learn/*.tsx` files (2 lines each) render `LearnArticle` from
`learn/_article.tsx`, which shadows every slug of `learn/[slug].tsx`. Only that
file's `LEARN_CONTENT` export is used; **its screen component (about 100 lines of
render code and styles) never runs**. There are two article renderers for the same content.
**Proposal:** move `LEARN_CONTENT` to `src/` and keep one renderer: either the
`[slug]` screen (deleting the six stubs and `_article.tsx`) or `_article`
(deleting the `[slug]` screen body).

### B6. Mobile: unreachable `src/` modules

No route reaches these: `src/components/AccordionRow.tsx`, `BiText.tsx`,
`PanchangamGrid.tsx`, `ShareCard.tsx`,
`illustrations/VinaadiIllustrations.tsx`, `src/hooks/useResolvedColors.ts`,
`src/lib/error-messages.ts` (273 lines), `src/api/rasiPalan.ts`.
(`src/api/index.ts` is a documentation-only file; keep it.)
**Proposal:** delete them, per-file, after one `tsc --noEmit` + jest run.
Check `error-messages.ts` and `ShareCard.tsx` first: they look like
finished work that was never wired in, like `advanced-lens-note`.

Smaller copy-paste: `mobile/app/temples/arupadai-veedu.tsx` and
`pancha-bhoota.tsx` are 232-line near-twins. They could share one screen.

### B7. `packages/shared`: clean

Every module flagged by the per-package scan is imported by web or mobile
through the `@vinaadi/shared/*` export map.

---

## C. Repo-level leftovers

| # | Item | Size | Finding | Proposal |
|---|---|---|---|---|
| R1 | **`C:\Users\senth\OneDrive\문서\GitHub\sanstro`** | 1.9 GB, 95k files | A second, stale clone (last commit 2026-06-28). It holds **one unpushed commit, `e6d7e66 "ignorefiles"`, which does not exist in `D:\sanstro`** (`.npmrc`, `mobile/src/lib/analytics.ts` +67 lines, `packages/shared/src/index.ts`, …). It is also where Docker thinks the `sanstro` project lives (D2). OneDrive is also syncing 95k files of `node_modules`. | Push `e6d7e66` to a rescue branch (`git push origin e6d7e66:refs/heads/rescue/onedrive-ignorefiles`) or confirm its content is superseded, then re-home Docker (D2), then delete the clone |
| R2 | `D:\sanstro\artifacts\` | 4.9 GB, 10k files (gitignored) | Screenshot runs and probe outputs back to 2026-09-17, including `font-control-new/` and `font-control-old/`, each a copy of `web/`. **Both were modified at 08:14–08:18 today, so another session may be using them.** | Leave `font-control-*` alone until that work lands. Archive or delete dated folders older than 2 weeks |
| R3 | Root `.codex-*.log` (4 files, 2026-09-15), `.commit-message-a13-doc.txt` | small | Gitignored scratch files from earlier sessions | Delete |
| R4 | `backups/`, `db_backups/` | 46 MB + 50 MB of SQL dumps | Gitignored, but they are **dumps of birth data on disk**. The A12 ruling already decided dump deletion, and it is recorded as still pending | Follow through on the A12 deletion decision |

---

## What this audit cannot see

- **Runtime-only references.** The reachability scan follows `import`/`require`
  strings. It cannot see a module loaded by a computed path, a URL (service
  workers in `public/`), or a config string (`app.config.ts` plugins). These
  were checked by hand for the files listed above, but a new dynamic loader
  would be invisible to it.
- **Content equality.** B2 shows that two sources exist for the same 14
  URLs. It does not show that the texts differ today; a per-slug diff is
  step 3 of the proposal.
- **The SLW project's own needs.** D1 and D5 touch a container the other project
  owns. Whether SLW still uses `slw-adminer` or `vinaadi_test`-on-5432 can only
  be answered from that side.
- **Backend duplicates** (`app/api/` routers or services with parallel
  versions) were out of scope for this pass.
