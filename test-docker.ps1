# Backend test suite, run in a Linux container instead of the host venv.
#
# WHY. The host venv cannot even COLLECT the suite. tests/conftest.py line 30
# does `from app.main import app`, which walks
# app.api.admin -> app.middleware -> app.services.feature_flags ->
# app.calculations -> app.calculations.ephemeris -> swe.dll, and Smart App
# Control blocks that DLL (see dev-docker.ps1's header and the memory note).
# So this is not "the ephemeris tests are broken" -- it is every one of the 278
# test files, including the ones that touch no astrology at all.
#
# THE DB GUARD IS SATISFIED, NOT BYPASSED. tests/conftest.py:96 requires the
# database to be literally `localhost:5433` / `127.0.0.1:5433` and named exactly
# `vinaadi_test`. `--network host` gives this container the host's network
# namespace, so `localhost:5433` inside it IS the slw-postgres-test container's
# published port -- the same endpoint the guard intends. Nothing is overridden
# and CLAUDE.md rule 3 is respected: vinaadi_dev is never reachable under this
# URL. Verified reachable before use, since a silent fallback here would be a
# test run against the wrong database.
#
# Host networking is a Docker Desktop 4.34+ feature and is enabled here
# (docker 29.7.2, confirmed by connecting to 127.0.0.1:5433 from a container).
# If it is ever turned off, this script fails loudly on the reachability probe
# rather than quietly testing nothing.
#
# WHAT THIS RUNS: pyswisseph on Python 3.12 -- the binding CI and production
# use. The swisseph-ffi (3.14) half of docs/vinaadi-fix-spec.md item 5 is a
# SEPARATE matrix leg and this script does not cover it; see -Binding ffi.
#
# NOT AUTHORITATIVE. CLAUDE.md is explicit that CI is. A green run here means
# "worth pushing", not "done". And two concurrent runs destroy each other:
# conftest's _reset_db does DROP SCHEMA public CASCADE, so a second pytest wipes
# the first one's schema mid-test and produces a burst of UndefinedTable errors
# that look like a code bug. This script refuses to start if another run holds
# connections to vinaadi_test.

param(
    [string[]]$Paths = @('tests'),
    [ValidateSet('pyswisseph', 'ffi')]
    [string]$Binding = 'pyswisseph',
    [switch]$Build,
    # Hard ceiling on the whole run. Not decoration: a run of this suite in a
    # container sat for FOURTEEN HOURS at 5% on 2026-10-11/12 because nothing
    # bounded it. CLAUDE.md's own rule -- bound every unbounded wait -- applies
    # to the thing enforcing the rules too.
    #
    # The number is measured, not guessed, and the first guess was wrong. CI
    # runs this suite in 13-14 min, so 45 min looked generous; in this container
    # 40 min reached only 49%, which puts a full run near 80 min. The ceiling
    # exists to catch a HANG, so it must sit well above honest slowness or it
    # just mislabels a slow run as a hang -- which is exactly what it did to
    # tests/test_marriage_signature_determinism.py, a file that passes in 22 s
    # on its own. 2 h is ~1.5x the expected worst case.
    #
    # Why slower than CI at all: Docker Desktop on Windows, coverage
    # instrumentation, and one shared core. Not a defect, just the price.
    [int]$TimeoutSeconds = 7200,
    # Run the known-stalling test too. Off by default -- see KNOWN STALL below.
    [switch]$IncludeStalled,
    [string[]]$PytestArgs = @()
)

$ErrorActionPreference = 'Stop'
Set-Location 'D:\sanstro'

if ($Binding -eq 'ffi') {
    $Image      = 'vinaadi-ffi-test:314'
    $Dockerfile = 'docker/Dockerfile.test-ffi'
} else {
    $Image      = 'vinaadi-test:312'
    $Dockerfile = 'docker/Dockerfile.test'
}

# The test DB container must be up. Its name is checked exactly: a
# `-filter name=` match is a substring match, so slw-postgres-test alone
# would also satisfy a sloppy check for slw-postgres and vice versa.
$running = docker ps --filter 'name=slw-postgres-test' --filter 'status=running' --format '{{.Names}}'
if ($running -notcontains 'slw-postgres-test') {
    throw "Test DB (slw-postgres-test) is not running. Start it: docker compose up -d postgres-test"
}

# Competing-run guard. CLAUDE.md: trace the parent chain before killing
# anything -- another agent session may own that run. So this reports and
# stops; it never kills.
$conns = docker exec slw-postgres-test psql -U slw_admin -d postgres -tAc `
    "SELECT count(*) FROM pg_stat_activity WHERE datname='vinaadi_test';"
if ($LASTEXITCODE -ne 0) { throw "Could not query slw-postgres-test for active connections." }
if ([int]$conns.Trim() -gt 0) {
    Write-Host "REFUSING TO START: $($conns.Trim()) connection(s) already on vinaadi_test." -ForegroundColor Red
    Write-Host "Another pytest run (possibly another Claude session or the IDE runner) owns it." -ForegroundColor Red
    Write-Host "conftest's _reset_db drops the schema, so starting now would destroy that run." -ForegroundColor Red
    Write-Host "Find it, trace its parent chain, and ask before killing anything:" -ForegroundColor DarkGray
    Write-Host '  Get-CimInstance Win32_Process -Filter "Name=''python.exe''" | Where-Object { $_.CommandLine -like "*pytest*" } | Select-Object ProcessId, CommandLine' -ForegroundColor DarkGray
    throw "Concurrent run on vinaadi_test."
}

$exists = docker images --format '{{.Repository}}:{{.Tag}}' | Where-Object { $_ -eq $Image }
if ($Build -or -not $exists) {
    if (-not (Test-Path $Dockerfile)) { throw "Missing $Dockerfile" }
    Write-Host "Building $Image from $Dockerfile..." -ForegroundColor Yellow
    docker build -t $Image -f $Dockerfile .
    if ($LASTEXITCODE -ne 0) { throw "Test image build failed." }
}

# Reachability probe, before anything that could mistake silence for success.
# The checker is a file, not a -c here-string: PS 5.1 mangles embedded double
# quotes on the way to a native exe, which is how the dependency-drift gate
# below came to report clean while python was dying on a SyntaxError.
docker run --rm --network host `
    -v "D:\sanstro\docker\check-db-reachable.py:/app/check-db-reachable.py:ro" `
    $Image python -I /app/check-db-reachable.py 127.0.0.1 5433
if ($LASTEXITCODE -ne 0) { throw "Test DB not reachable from the container -- is host networking enabled in Docker Desktop?" }

# KNOWN STALL, DESELECTED BY DEFAULT.
#
# tests/test_admin_elevation.py::test_a_recompute_job_still_needs_no_elevation
# POSTs /api/v1/admin/jobs/panchangam_prewarm/trigger, which runs the prewarm
# cron synchronously inside the request. In THIS container it does not finish:
# isolated it exceeds 208 s, and a full run sat 14 hours at 5% because of it.
# Deselecting it alone takes the same 40 minutes from 5% to 49%, so it is the
# entire blockage.
#
# WHAT IT IS NOT: a product defect, and not skipped anywhere that matters. CI's
# backend-tests job runs plain `pytest -q` over testpaths = ["tests"], so it
# runs this test, with no skip marker, and that job is green. The daily
# run_panchangam_prewarm_cron in the production worker is fine on Linux. This
# deselect is local-only and buys back local full-suite runs; it removes no
# coverage from the gate that decides anything.
#
# Measurement killed four explanations, so do not re-derive them: ephemeris
# file I/O over the bind mount (36,690 vs 19,878 calls/s -- irrelevant at this
# scale), Docker Desktop's port proxy (0.28 vs 0.25 ms per round trip), a slow
# or non-converging panchangam (all 9 prewarm locations x 45 days = 15.7 s
# total), and lock contention (pg_blocking_pids empty throughout). The open
# suspect is _SWISS_LOCK serialising ephemeris calls between the anyio worker
# thread running the cron -- which opens its OWN SessionLocal(), not the test's
# overridden session -- and the TestClient thread blocked on its future.
# NOT localised. Pass -IncludeStalled to run it and pick the thread back up.
$stalling = 'tests/test_admin_elevation.py::test_a_recompute_job_still_needs_no_elevation'
if (-not $IncludeStalled -and -not (($PytestArgs -join ' ') -match [regex]::Escape($stalling))) {
    $PytestArgs = @('--deselect', $stalling) + $PytestArgs
    Write-Host "Deselected the known local stall (-IncludeStalled to run it; CI runs it regardless)." -ForegroundColor DarkGray
}

# COVERAGE GATE. pyproject's addopts carry `--cov=app --cov-fail-under=88`,
# which is right for a full run and wrong for a focused one: pytest exits 1 on
# "coverage 3.2% < 88%" and the output reads as a failing test when every test
# passed. Focused runs therefore get --no-cov unless the caller asked for
# coverage explicitly. A full run keeps the gate.
$isFullRun = ($Paths.Count -eq 1) -and ($Paths[0] -eq 'tests')
$covRequested = ($PytestArgs -join ' ') -match '--cov'
if (-not $isFullRun -and -not $covRequested) {
    $PytestArgs = @('--no-cov') + $PytestArgs
    Write-Host "Focused run: --no-cov added (pyproject enforces 88% on a full run)." -ForegroundColor DarkGray
}

Write-Host "Running $Binding tests: $($Paths -join ' ')" -ForegroundColor Cyan

# Repo mounted read-only so a test cannot mutate the working tree; pytest's
# cache is disabled for the same reason. The DB is the only writable surface.
#
# COVERAGE_FILE must point off the read-only mount. pytest-cov calls
# coverage.erase() during startup, which os.remove()s its data file relative to
# the rootdir -- so the run died with
# `OSError: [Errno 30] Read-only file system: '/src/.coverage'` before
# collecting a single test. Writing coverage data into the repo is also just
# wrong here: it would land next to the source as an untracked artifact of a
# container run. /tmp is inside the container and dies with it.
docker run --rm --network host `
    -v "D:\sanstro:/src:ro" `
    -w /src `
    -e JOTHIDAM_DATABASE_URL="postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test" `
    -e JOTHIDAM_TEST_DB_RESET_ACK="I_UNDERSTAND_THIS_WIPES_TEST_DB" `
    -e PYTHONIOENCODING=utf-8 `
    -e PYTHONUTF8=1 `
    -e PYTHONDONTWRITEBYTECODE=1 `
    -e COVERAGE_FILE=/tmp/.coverage `
    -e PYTHONFAULTHANDLER=1 `
    $Image `
    timeout -s ABRT $TimeoutSeconds python -m pytest @Paths -p no:cacheprovider @PytestArgs
$code = $LASTEXITCODE

if ($code -eq 0) {
    Write-Host "PASS ($Binding). Not authoritative -- CI is." -ForegroundColor Green
} elseif ($code -eq 134) {
    # `timeout -s ABRT` plus PYTHONFAULTHANDLER=1 means the ceiling does not
    # just kill the run, it prints the stack of every thread first -- so a hang
    # reports WHERE it hung instead of going silent. 134 = 128 + SIGABRT(6).
    Write-Host "TIMEOUT after ${TimeoutSeconds}s ($Binding). A faulthandler stack for every thread is above --" -ForegroundColor Red
    Write-Host "read it before theorising; the deepest app/ frame is where it sat." -ForegroundColor Red
} else {
    Write-Host "FAIL ($Binding), pytest exit $code." -ForegroundColor Red
}
exit $code
