<#
Starts the backend against the dedicated vinaadi_e2e database, for Playwright's
e2e webServer entry. Never points at vinaadi_dev, so throwaway @e2e.test
accounts created by browser-driven test runs stop polluting the real admin
dashboard's user/family-vault counts.

RUNS IN A CONTAINER, NOT THE HOST VENV (changed 2026-10-11). The host venv
cannot import app.main at all: Smart App Control blocks
.venv\Lib\site-packages\swisseph_ffi\libs\windows-x64\swe.dll with
`OSError: [WinError 4551]`, and app.main -> app.api.admin -> app.middleware ->
app.services.feature_flags -> app.calculations reaches it on every start. So
this script, Playwright's whole webServer flow, and scripts/ux-audit-stack.ps1
were all dead for the same single reason. See dev-docker.ps1's header for the
diagnosis and why retrying is not the answer.

NETWORKING, AND THE ASYMMETRY THAT DECIDES IT. The first version of this used
`--network host`, reasoning that -DatabaseUrl could then stay exactly the
localhost:5433 string callers pass. That is half true and the wrong half.
On Docker Desktop for Windows `--network host` joins the container to the
LINUX VM's network namespace, not Windows':

  outbound  container -> host's published 5433   WORKS
            (this is how test-docker.ps1 reaches vinaadi_test)
  inbound   Windows -> a port the container LISTENS on   DOES NOT
            (uvicorn bound 0.0.0.0:8010 and localhost:8010 never answered)

Playwright runs on Windows and must reach this backend, so the port has to be
published, and `-p` cannot be combined with `--network host`. Hence bridge
networking plus a translation of the DB host only.

The translation is deliberately narrow: it rewrites the HOST portion and
nothing else, and then asserts the database NAME came through unchanged and is
not vinaadi_dev. Rewriting a caller-supplied connection string is how a run
ends up against the wrong database -- playwright.config.ts passes
E2E_DATABASE_URL -- so the part that chooses the data is the part that is
checked, loudly, before anything starts.
#>
param(
    [int]$Port = 8010,
    [string]$DatabaseUrl = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_e2e",
    [string]$Image = "vinaadi-test:312"
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

# ORDER MATTERS HERE. These checks used to sit below the alembic call. That made
# the vinaadi_dev refusal dead code for the case it exists for: `alembic upgrade
# head` would have already run against the dev database before the guard fired,
# and CLAUDE.md rule 1 is that a migration is never applied to vinaadi_dev
# without the migration being reviewed first. Nothing may touch a database above
# this line.
$Container = "vinaadi-e2e-api-$Port"

# Translate ONLY the host portion of the connection string. localhost inside a
# bridge-networked container is the container itself, so the caller's
# localhost:5433 would silently resolve to nothing there.
#
# Everything that selects DATA -- database name, user, password, port -- is left
# byte-for-byte alone, and then checked. A connection string is the one input
# here where being approximately right is worse than failing.
$ContainerDatabaseUrl = $DatabaseUrl
foreach ($hostName in @('@localhost:', '@127.0.0.1:')) {
    if ($ContainerDatabaseUrl.Contains($hostName)) {
        $ContainerDatabaseUrl = $ContainerDatabaseUrl.Replace($hostName, '@host.docker.internal:')
        break
    }
}

# Assertions on the result, not on the intent. CLAUDE.md rule 3: never point a
# test backend at vinaadi_dev.
$origDb = ($DatabaseUrl -split '/')[-1]
$newDb  = ($ContainerDatabaseUrl -split '/')[-1]
if ($origDb -ne $newDb) {
    throw "URL translation changed the database name ('$origDb' -> '$newDb'). Refusing to start."
}
if ($newDb -match 'vinaadi_dev') {
    throw "Refusing to start: this would run e2e against vinaadi_dev. Pass -DatabaseUrl for vinaadi_e2e."
}
if ($ContainerDatabaseUrl -eq $DatabaseUrl -and $DatabaseUrl -match '@(localhost|127\.0\.0\.1):') {
    throw "Expected to rewrite the DB host for the container and did not. Refusing to start."
}
Write-Host "e2e DB: $newDb (host rewritten for the container)" -ForegroundColor DarkGray

$Python = ".\.venv\Scripts\python.exe"
$env:PYTHONIOENCODING = "utf-8"
$env:JOTHIDAM_DATABASE_URL = $DatabaseUrl

# Migrations stay on the host. alembic imports app.models, which does NOT reach
# app.calculations, so this is the one part of the old script that never
# broke -- dev.ps1 printed "No pending migrations" and only then died on
# uvicorn. Keeping it here also keeps the e2e DB's schema owned by the same
# alembic the developer runs by hand.
& $Python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    throw "e2e migration check failed against $DatabaseUrl"
}

# Idempotent: Playwright kills this script's process when a run ends, and the
# docker CLI dying does not necessarily stop the container. Clearing a leftover
# by name on entry means the next run cannot silently attach to a stale backend
# holding the previous run's env -- which would be invisible from the browser,
# exactly the failure the e2e environment tag below exists to catch.
docker rm -f $Container 2>$null | Out-Null

if (-not (docker images --format '{{.Repository}}:{{.Tag}}' | Where-Object { $_ -eq $Image })) {
    Write-Host "Building $Image (first run)..." -ForegroundColor Yellow
    docker build -t $Image -f docker/Dockerfile.test .
    if ($LASTEXITCODE -ne 0) { throw "Could not build $Image" }
}

try {
    # Bridge networking + published port (see the header). Bound to 127.0.0.1
    # so this test backend is never on the machine's public interface.
    #
    # --env-file .env FIRST, then -e overrides. The old host-venv version got
    # JOTHIDAM_JWT_SECRET and the admin key from .env implicitly, because
    # pydantic-settings reads .env from the working directory; a container has
    # no .env unless it is given one. Without this the app mints ephemeral
    # secrets at boot and logs "JWT tokens won't survive restart" -- harmless
    # for a single e2e session, but a silent behaviour change from what this
    # script used to do, so it is kept rather than quietly dropped. The -e
    # flags after it are what must NOT come from .env: .env's
    # JOTHIDAM_DATABASE_URL points at vinaadi_dev.
    #
    # JOTHIDAM_ENVIRONMENT=e2e makes this backend self-identifying on
    # GET /health, which is what web/e2e/global-setup.ts checks before a single
    # spec is allowed to run. Pointing the browser at a frontend whose proxy
    # reaches the *dev* backend is the failure this whole script exists to
    # prevent, and it is invisible from the browser's side otherwise -- both
    # backends answer identically. Every branch in app/ keys on
    # "production"/"staging", so "e2e" behaves exactly like "development"
    # everywhere else.
    #
    # Attached, not detached: Playwright's webServer waits on this process and
    # streams its output, and --rm plus attachment means normal teardown stops
    # the container.
    #
    # Source mounted read-only over the image's copy so e2e runs test the
    # working tree, not whatever was baked in at build time.
    docker run --rm --name $Container `
        --env-file .env `
        -v "${PWD}\app:/src/app:ro" `
        -w /src `
        -p "127.0.0.1:${Port}:${Port}" `
        -e JOTHIDAM_DATABASE_URL="$ContainerDatabaseUrl" `
        -e JOTHIDAM_ENVIRONMENT=e2e `
        -e PYTHONIOENCODING=utf-8 `
        -e PYTHONUTF8=1 `
        -e PYTHONDONTWRITEBYTECODE=1 `
        $Image `
        python -m uvicorn app.main:app --host 0.0.0.0 --port $Port
} finally {
    docker rm -f $Container 2>$null | Out-Null
}
