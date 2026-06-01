param(
    [switch]$StartTestDb,
    [switch]$SkipDevBackup,
    [switch]$AllowNoBackup,
    [switch]$ForceUnsafeTestDbUrl,
    [string]$TestDbContainer = "slw-postgres-test",
    [string]$TestDbAdminUser = "slw_admin",
    [string]$TestDbName = "vinaadi_test",
    [string]$TestDbUser = "slw_test_runner",
    [string]$TestDbPassword = "slw_test_runner_password",
    [string]$TestDbUrl = "postgresql://slw_test_runner:slw_test_runner_password@localhost:5433/vinaadi_test",
    [string]$DevDbContainer = "slw-postgres",
    [string]$DevDbUser = "slw_admin",
    [string]$DevDbName = "vinaadi_dev",
    [string]$BackupDir = "backups"
)

$ErrorActionPreference = "Stop"

$Python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    throw "Virtual environment not found at .venv. Create it first: python -m venv .venv"
}

if ((-not $ForceUnsafeTestDbUrl) -and ($TestDbUrl -notmatch "localhost:5433/.+test")) {
    throw "Refusing to run tests with non-test URL. Use localhost:5433 and a database name containing 'test', or pass -ForceUnsafeTestDbUrl."
}

if ($StartTestDb) {
    docker compose up -d postgres_test | Out-Host
}

$isTestDbRunning = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $TestDbContainer }
if (-not $isTestDbRunning) {
    throw "Test DB container '$TestDbContainer' is not running. Start it with -StartTestDb."
}

$testRoleSql = @"
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', '$TestDbUser', '$TestDbPassword')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$TestDbUser');
\gexec
ALTER ROLE $TestDbUser LOGIN PASSWORD '$TestDbPassword';
GRANT CONNECT, TEMP ON DATABASE $TestDbName TO $TestDbUser;
GRANT USAGE, CREATE ON SCHEMA public TO $TestDbUser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $TestDbUser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $TestDbUser;
    ALTER SCHEMA public OWNER TO $TestDbUser;
    GRANT ALL ON SCHEMA public TO $TestDbUser;
"@

$testRoleSql | docker exec -i $TestDbContainer psql -v ON_ERROR_STOP=1 -U $TestDbAdminUser -d $TestDbName | Out-Host
if ($LASTEXITCODE -ne 0) {
    throw "Failed to provision restricted test DB role '$TestDbUser'."
}

if (-not $SkipDevBackup) {
    $backupRoot = Join-Path (Get-Location) $BackupDir
    if (-not (Test-Path $backupRoot)) {
        New-Item -ItemType Directory -Path $backupRoot | Out-Null
    }

    $isDevDbRunning = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $DevDbContainer }
    if (-not $isDevDbRunning) {
        $message = "Dev DB container '$DevDbContainer' is not running, so backup could not be created."
        if ($AllowNoBackup) {
            Write-Warning "$message Continuing because -AllowNoBackup was provided."
        } else {
            throw "$message Start the container or rerun with -AllowNoBackup."
        }
    } else {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupPath = Join-Path $backupRoot "$($DevDbName)_$timestamp.sql"
        Write-Host "Creating dev DB backup at $backupPath" -ForegroundColor Cyan
        docker exec $DevDbContainer pg_dump -U $DevDbUser -d $DevDbName --no-owner --no-privileges | Set-Content -LiteralPath $backupPath -Encoding UTF8
        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump failed while creating dev DB backup."
        }
        if ((Get-Item -LiteralPath $backupPath).Length -lt 64) {
            throw "Backup file looks too small. Aborting to avoid unsafe test run."
        }
        Write-Host "Backup complete: $backupPath" -ForegroundColor Green
    }
}

$env:JOTHIDAM_DATABASE_URL = $TestDbUrl
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
$env:PIP_PROGRESS_BAR = "off"

Write-Host "Running tests against $($env:JOTHIDAM_DATABASE_URL)" -ForegroundColor Yellow
& $Python -m pytest tests/ -v --tb=short
exit $LASTEXITCODE
