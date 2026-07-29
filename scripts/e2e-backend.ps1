<#
Starts the backend against the dedicated vinaadi_e2e database, for Playwright's
e2e webServer entry. Never points at vinaadi_dev, so throwaway @e2e.test
accounts created by browser-driven test runs stop polluting the real admin
dashboard's user/family-vault counts.
#>
param(
    [int]$Port = 8010,
    [string]$DatabaseUrl = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_e2e"
)

Set-Location (Split-Path -Parent $PSScriptRoot)

$Python = ".\.venv\Scripts\python.exe"
$env:PYTHONIOENCODING = "utf-8"
$env:JOTHIDAM_DATABASE_URL = $DatabaseUrl

& $Python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    throw "e2e migration check failed against $DatabaseUrl"
}

& $Python -m uvicorn app.main:app --port $Port
