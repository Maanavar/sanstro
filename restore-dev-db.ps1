param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$DevDbContainer = "slw-postgres",
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

Write-Host "Restore complete for $DevDbName" -ForegroundColor Green
