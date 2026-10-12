# Dev backend, run in a Linux container instead of the host venv.
#
# WHY THIS EXISTS. On this machine the host venv cannot start the API at all:
#
#   OSError: [WinError 4551] An Application Control policy has blocked this file
#     .venv\Lib\site-packages\swisseph_ffi\libs\windows-x64\swe.dll
#
# That is Smart App Control (VerifiedAndReputablePolicyState = 1, policy
# {0283ac0f-fff1-49ae-ada1-8a933130cad6}) refusing an unsigned DLL whose cloud
# reputation never resolved. The `ModuleNotFoundError: No module named
# 'swisseph'` printed just above it in the traceback is EXPECTED and is not the
# failure -- requirements carry markers (`pyswisseph` below 3.14,
# `swisseph-ffi` at 3.14+) and this host runs 3.14, so the ImportError branch is
# the designed path. Read past it.
#
# The verdict is per file hash and dynamic. It cleared on its own once
# (2026-09-29) which is why it was first recorded as transient -- but it came
# back on 2026-10-11 against a byte-identical DLL (sha256 17F2BC42..., unchanged
# since 21-May), and the same class of block on mypy's `librt.base64...pyd`
# survived 12 retries over ~15 minutes plus two more attempts hours apart
# (docs/MASTER_FIX_LIST.md). So: retry once, then come here. Do not bisect the
# venv, reinstall, or go looking for a missing dependency -- nothing is missing.
#
# This container is the documented local route around it: Linux, `libswe.so`,
# code integrity not involved, and `pyswisseph` -- the SAME binding CI and
# production use (Dockerfile pins python:3.12-slim), not the 3.14 ffi branch.
#
# WHAT THIS IS NOT. Migrations stay on the host, where they already work:
# `alembic upgrade head` imports no ephemeris code, which is why dev.ps1 got
# past its migration step and died only when uvicorn imported the app. If a
# migration is pending, run alembic on the host first:
#
#   .\.venv\Scripts\python.exe -m alembic upgrade head
#
# NOT `dev.ps1 -Migrate` -- that switch is declared in dev.ps1's param block and
# never referenced, so it runs the whole script and dies on uvicorn exactly as
# before. Review the migration before applying it to vinaadi_dev (CLAUDE.md).
#
# Hot reload works through the bind mount. WATCHFILES_FORCE_POLLING below was
# originally commented here as load-bearing -- "without it edits are silently
# ignored" -- which was asserted and never tested. Tested: inotify alone also
# picks up host edits on this Docker Desktop version, at the same CPU cost,
# because watchfiles recognises the mount and polls regardless. The env var is
# kept only to make that fallback explicit rather than version-dependent; it
# buys nothing and costs nothing. See -NoReload for what the watcher costs.

param(
    [int]$Port = 8000,
    # Serve without the file watcher. Watching app/ across the Docker Desktop
    # bind mount costs ~6% CPU with the server completely idle, for as long as
    # the container is up; without the watcher it is 0.2%. Use this when you
    # need the API up but are not editing it -- running the frontend, poking at
    # routes, leaving it on in the background.
    #
    # THERE IS NO CHEAPER WAY TO WATCH, measured rather than assumed:
    #   no watcher                     0.21%
    #   --reload (inotify)         ~6.6%
    #   --reload + FORCE_POLLING   ~6.7%
    #   uvicorn --reload-delay 2   no change -- it throttles uvicorn's reload
    #                              loop, not watchfiles' own poll thread
    # watchfiles detects that this path is a mount and polls either way, so the
    # cost is the mount, not the setting. Don't go looking for a flag.
    [switch]$NoReload,
    [switch]$Build,
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'
Set-Location 'D:\sanstro'

$Container = 'vinaadi-dev-api'
$Image     = 'vinaadi-api:smokecheck'

if ($Stop) {
    docker rm -f $Container 2>$null | Out-Null
    Write-Host "Stopped $Container." -ForegroundColor Green
    exit 0
}

# The dev DB is a container on the host's published port, reached from inside
# this container as host.docker.internal. Fail early and by name if it is down,
# rather than letting the API boot and return 503 from /health/ready.
$pg = docker ps --filter 'name=slw-postgres' --filter 'status=running' --format '{{.Names}}'
if ($pg -notcontains 'slw-postgres') {
    throw "Dev Postgres (slw-postgres) is not running. Start it: docker compose up -d db"
}

if (-not (Test-Path '.env')) {
    throw "No .env at D:\sanstro\.env -- the API needs JOTHIDAM_JWT_SECRET and JOTHIDAM_ENCRYPTION_KEY."
}

$exists = docker images --format '{{.Repository}}:{{.Tag}}' | Where-Object { $_ -eq $Image }
if ($Build -or -not $exists) {
    Write-Host "Building $Image (the wheels stage compiles pyswisseph from sdist -- there is no cp312 wheel)..." -ForegroundColor Yellow
    docker build -t $Image -f Dockerfile .
    if ($LASTEXITCODE -ne 0) { throw "Image build failed." }
}

docker rm -f $Container 2>$null | Out-Null

$uvicornReload = if ($NoReload) { @() } else { @('--reload', '--reload-dir', '/app/app') }

# .env first, then -e overrides: the DB URL in .env points at localhost, which
# inside the container is the container itself.
docker run -d --name $Container `
    --env-file .env `
    -e JOTHIDAM_DATABASE_URL="postgresql://slw_admin:slw_dev_password@host.docker.internal:5432/vinaadi_dev" `
    -e JOTHIDAM_ENVIRONMENT=development `
    -e WATCHFILES_FORCE_POLLING=true `
    -e PYTHONIOENCODING=utf-8 `
    -e PYTHONUTF8=1 `
    -v "D:\sanstro\app:/app/app:ro" `
    -v "D:\sanstro\docker\check-dep-drift.py:/app/check-dep-drift.py:ro" `
    -p "127.0.0.1:${Port}:8000" `
    --entrypoint tini `
    $Image `
    -- uvicorn app.main:app --host 0.0.0.0 --port 8000 @uvicornReload | Out-Null
if ($LASTEXITCODE -ne 0) { throw "docker run failed." }

# Bound the wait. A hang should cost seconds and a readable log, not a blank
# prompt: the reloader parent logs "Uvicorn running" before the child has
# finished importing the app, so the parent's log line is not readiness.
$deadline = (Get-Date).AddSeconds(90)
$ready = $false
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Seconds 2 }
}

if (-not $ready) {
    docker logs $Container --tail 40
    throw "API did not answer /health on port $Port within 90s."
}

# DRIFT GATE. The image bakes its dependencies in at build time; only app\ is
# mounted. So a commit that changes requirements.txt leaves this container
# running the OLD tree while the mounted source expects the new one -- and the
# failure surfaces as a route-level ImportError or a subtle version difference,
# not as anything that looks like a stale image. (Real near-miss: this image
# predates the python-jose -> PyJWT swap of 2026-10-09 by two days; it happened
# to already carry PyJWT 2.15.1, so it booted. Next time it will not.)
#
# The checker lives in docker/check-dep-drift.py rather than inline. An inline
# here-string version was written first and SILENTLY PASSED: PS 5.1 mangles
# embedded double quotes when handing a string to a native exe, so the regex
# reached python unquoted, python died with a SyntaxError, $drift came back
# empty and the gate reported clean. Hence both halves of this -- source through
# a file, never a native argument, and exit code 2 (the checker itself broke)
# treated as loudly as exit code 1 (real drift).
$drift = Get-Content -Raw 'requirements.txt' |
    docker exec -i $Container python -I /app/check-dep-drift.py
$driftExit = $LASTEXITCODE

if ($driftExit -eq 1) {
    Write-Host "WARNING: image dependencies have drifted from requirements.txt:" -ForegroundColor Yellow
    $drift | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    Write-Host "  Rebuild with: .\dev-docker.ps1 -Build" -ForegroundColor Yellow
} elseif ($driftExit -ne 0) {
    Write-Host "WARNING: the dependency-drift check did not run (exit $driftExit) -- this is NOT a pass." -ForegroundColor Yellow
}

$reloadNote = if ($NoReload) { "watcher OFF (-NoReload)" } else { "hot reload on app\" }
Write-Host "API ready on http://127.0.0.1:$Port -- $reloadNote." -ForegroundColor Green
Write-Host "  logs:  docker logs -f $Container" -ForegroundColor DarkGray
Write-Host "  stop:  .\dev-docker.ps1 -Stop" -ForegroundColor DarkGray
docker exec $Container python -c "import urllib.request,json; print('ready:', json.load(urllib.request.urlopen('http://127.0.0.1:8000/health/ready'))['status'])"
