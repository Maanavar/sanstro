# Populated-data drill for the A12 encryption migration. See the docstring of
# scripts/a12_migration_drill.py for what it checks and why.
#
# Runs in the same container and against the same database as test-docker.ps1,
# with the same two guards: the test DB container must be up, and nothing else
# may hold a connection to vinaadi_test (the drill drops its schema, exactly as
# conftest's _reset_db does, and would destroy a concurrent pytest run).
#
# Bounded: a hung migration aborts with a faulthandler stack after
# -TimeoutSeconds instead of sitting silently.

param(
    [int]$Users = 1000,
    [int]$TimeoutSeconds = 3600
)

$ErrorActionPreference = 'Stop'
Set-Location 'D:\sanstro'
$Image = 'vinaadi-test:312'

$running = docker ps --filter 'name=slw-postgres-test' --filter 'status=running' --format '{{.Names}}'
if ($running -notcontains 'slw-postgres-test') {
    throw "Test DB (slw-postgres-test) is not running. Start it: docker start slw-postgres-test"
}

$conns = docker exec slw-postgres-test psql -U slw_admin -d postgres -tAc `
    "SELECT count(*) FROM pg_stat_activity WHERE datname='vinaadi_test';"
if ($LASTEXITCODE -ne 0) { throw "Could not query slw-postgres-test for active connections." }
if ([int]$conns.Trim() -gt 0) {
    throw "REFUSING: $($conns.Trim()) connection(s) already on vinaadi_test -- another run owns it. Trace it and ask before killing anything."
}

docker run --rm --network host `
    -v "D:\sanstro\docker\check-db-reachable.py:/app/check-db-reachable.py:ro" `
    $Image python -I /app/check-db-reachable.py 127.0.0.1 5433
if ($LASTEXITCODE -ne 0) { throw "Test DB not reachable from the container." }

Write-Host "A12 migration drill: $Users synthetic users on vinaadi_test" -ForegroundColor Cyan
# Alembic logs to stderr. Under 'Stop', PS 5.1 turns the first stderr line of a
# native command into a terminating NativeCommandError and abandons the run
# mid-migration. The exit code below is the verdict.
$ErrorActionPreference = 'Continue'
docker run --rm --network host `
    -v "D:\sanstro:/src:ro" `
    -w /src `
    -e JOTHIDAM_DATABASE_URL="postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test" `
    -e JOTHIDAM_TEST_DB_RESET_ACK="I_UNDERSTAND_THIS_WIPES_TEST_DB" `
    -e PYTHONIOENCODING=utf-8 `
    -e PYTHONUTF8=1 `
    -e PYTHONDONTWRITEBYTECODE=1 `
    -e PYTHONFAULTHANDLER=1 `
    $Image `
    timeout -s ABRT $TimeoutSeconds python -m scripts.a12_migration_drill --users $Users
exit $LASTEXITCODE
