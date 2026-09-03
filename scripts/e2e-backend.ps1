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

# Makes this backend self-identifying on GET /health, which is what
# web/e2e/global-setup.ts checks before a single spec is allowed to run.
# Pointing the browser at a frontend whose proxy reaches the *dev* backend is
# the failure this whole script exists to prevent, and it is invisible from the
# browser's side otherwise — both backends answer identically. Every branch in
# app/ keys on "production"/"staging", so "e2e" behaves exactly like
# "development" everywhere else.
$env:JOTHIDAM_ENVIRONMENT = "e2e"

& $Python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    throw "e2e migration check failed against $DatabaseUrl"
}

& $Python -m uvicorn app.main:app --port $Port
