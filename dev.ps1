param(
    [switch]$Setup,
    [switch]$Migrate
)

# One-time setup: create venv and install deps
if ($Setup) {
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }
    .\.venv\Scripts\python.exe -m pip install -e .[dev]
    Write-Host "Setup complete." -ForegroundColor Green
}

# Run pending migrations
if ($Migrate -or $Setup) {
    .\.venv\Scripts\python.exe -m alembic upgrade head
    Write-Host "Migrations applied." -ForegroundColor Green
}

# Start dev server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
