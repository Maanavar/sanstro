param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$DevDbContainer = "vinaadi-postgres",
    [string]$DevDbUser = "slw_admin",
    [string]$DevDbName = "vinaadi_dev"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

$isDevDbRunning = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $DevDbContainer }
if (-not $isDevDbRunning) {
    throw "Dev DB container '$DevDbContainer' is not running."
}

# Erasures must survive a restore (admin spec L5): a backup taken before an
# account was erased still holds it. Carry the live tombstones across and
# replay them afterwards (app/privacy/tombstones.py).
$tombstoneFile = Join-Path $PSScriptRoot ("tombstones_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".json")
$tombstoneCount = 0
$hasTombstones = docker exec $DevDbContainer psql -U $DevDbUser -d $DevDbName -At -c "SELECT to_regclass('public.erasure_tombstones') IS NOT NULL"
if ($hasTombstones -eq "t") {
    $json = docker exec $DevDbContainer psql -v ON_ERROR_STOP=1 -U $DevDbUser -d $DevDbName -At -c "SELECT coalesce(json_agg(json_build_object('id', id, 'user_id', user_id, 'via', via, 'erased_at', erased_at) ORDER BY erased_at), '[]') FROM erasure_tombstones"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not read erasure_tombstones; not restoring, so no erased account comes back."
    }
    # No BOM: Python's json module refuses one.
    [IO.File]::WriteAllText($tombstoneFile, ($json -join ""), (New-Object Text.UTF8Encoding $false))
    $tombstoneCount = docker exec $DevDbContainer psql -U $DevDbUser -d $DevDbName -At -c "SELECT count(*) FROM erasure_tombstones"
    Write-Host "Saved $tombstoneCount erasure tombstones to $tombstoneFile" -ForegroundColor Yellow
}

Write-Host "Resetting schema in $DevDbName before restore..." -ForegroundColor Yellow
docker exec $DevDbContainer psql -v ON_ERROR_STOP=1 -U $DevDbUser -d $DevDbName -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to reset schema in $DevDbName."
}

Write-Host "Restoring from $BackupFile ..." -ForegroundColor Yellow
Get-Content -LiteralPath $BackupFile -Raw | docker exec -i $DevDbContainer psql -v ON_ERROR_STOP=1 -U $DevDbUser -d $DevDbName
if ($LASTEXITCODE -ne 0) {
    throw "Restore failed."
}

if ([int]$tombstoneCount -gt 0) {
    $replay = "python -m app.privacy.tombstones replay $tombstoneFile"
    $envLine = Select-String -Path (Join-Path $PSScriptRoot ".env") -Pattern '^JOTHIDAM_DATABASE_URL=(.*)$' | Select-Object -First 1
    if (-not $envLine -or $envLine.Matches[0].Groups[1].Value -notmatch "/$DevDbName$") {
        throw "Restored, but .env's JOTHIDAM_DATABASE_URL does not name $DevDbName. Before using the database, run: $replay"
    }
    $env:JOTHIDAM_DATABASE_URL = $envLine.Matches[0].Groups[1].Value
    $python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
    Push-Location $PSScriptRoot
    try {
        # A backup older than the tombstone table needs the schema first (dev.ps1 does the same on start).
        & $python -m alembic upgrade head
        if ($LASTEXITCODE -ne 0) { throw "Restored, but alembic upgrade failed. Fix it, then run: $replay" }
        & $python -m app.privacy.tombstones replay $tombstoneFile
        if ($LASTEXITCODE -ne 0) { throw "Restored, but the tombstone replay failed. Before using the database, run: $replay" }
    }
    finally {
        Pop-Location
    }
}

Write-Host "Restore complete for $DevDbName" -ForegroundColor Green
