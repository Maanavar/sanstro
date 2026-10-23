# Testing, gates and debugging

Moved word for word from `CLAUDE.md` (lines 154-241) on 2026-10-22. `CLAUDE.md` keeps the short form and points here.

## A gate proves its own check, not the item

A `Gate:` line in an audit is a *measurement*, not the item's definition of done.
Before recording a PASS, state what the check cannot see, and look there by hand.

**Why:** three separate items here have now been recorded green by a gate that
could not fail — DXA-05's pending hero stands at the loaded height, so DXA-07's
"hero ≥ 90%" passed with and without the fix; DXA-08's regex could not see the
casing that was actually wrong; and `web/scripts/ux-audit-core.mjs` once walked
only top-level tab panes in English. It has since gained an `overlays` phase
(five named overlays) and a `ta` phase (top-level tabs in Tamil, desktop and
phone), but sub-tools, reports, overlays in Tamil and every attribute are still
outside it by construction.

**How to apply:** run each new gate once with the fix **removed** and confirm it
fails (see [Suspect your own inputs](#debugging-discipline--suspect-your-own-inputs-before-the-environment)).
Then write the blind spot down beside the PASS. A tick whose scope is not
recorded is inherited as "this item is clean" by the next reader.

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
