param(
    [switch]$Setup,
    [switch]$Migrate
)

$Python = ".\.venv\Scripts\python.exe"
$env:PYTHONIOENCODING = "utf-8"

function Ensure-Venv {
    if (-not (Test-Path $Python)) {
        python -m venv .venv
    }
}

function Ensure-BackendDependencies {
    & $Python -m pip show python-jose 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        & $Python -m pip install -e .[dev]
    }
}

# One-time setup: create venv and install deps
Ensure-Venv

if ($Setup) {
    & $Python -m pip install -e .[dev]
    Write-Host "Setup complete." -ForegroundColor Green
} else {
    Ensure-BackendDependencies
}

# Check/apply migrations on startup. Alembic only applies when pending.
$migrationOutput = & $Python -m alembic upgrade head 2>&1
if ($LASTEXITCODE -ne 0) {
    $migrationOutput | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    throw "Migration check failed."
}

$migrationText = ($migrationOutput | Out-String)
if ($migrationText -match "Running upgrade") {
    Write-Host "Migrations applied." -ForegroundColor Green
} else {
    Write-Host "No pending migrations." -ForegroundColor DarkYellow
}

# Start dev server (watch backend app folder only to avoid frontend/.next churn)
& $Python -m uvicorn app.main:app --reload --reload-dir app
