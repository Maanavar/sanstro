<#
.SYNOPSIS
    A01: prove the built web container can actually reach the built API container.

.DESCRIPTION
    The existing `web-image` CI job builds the web image and curls `/` — a page
    that needs no backend at all. That is why A01 survived: `docker-compose.app.yml`
    handed the web service `API_BASE_URL` while every reader in web/ reads
    `BACKEND_URL`, so the stack came up, the homepage returned 200, and login,
    dashboard data and every server-rendered public page failed against an API
    that was healthy the whole time.

    This brings up db + redis + api + web from the real compose file and makes
    three claims through the *proxy*, not around it:

      1. `GET /`                              — the claim CI already makes.
      2. `GET /api/backend/health/ready`       — web resolved BACKEND_URL, found
                                                 `api` over the compose network,
                                                 and proxied the response back.
      3. register → login → `GET /api/backend/api/v1/auth/me`
                                               — a synthetic authenticated read,
                                                 POST bodies and an Authorization
                                                 header included (A01 step 6).

    Claim 2 is the one that fails on the A01 configuration. Claim 3 is the one
    that fails if the proxy forwards a method, body or header incorrectly.

    Cookie-free Bearer endpoints on purpose: the api service sets
    JOTHIDAM_COOKIE_SECURE=true, and a Secure cookie is not sent back over plain
    HTTP, so a cookie-session smoke would fail for a reason that is not A01.

.PARAMETER BreakBackendUrl
    NEGATIVE CONTROL. Points the web container's BACKEND_URL at loopback — the
    address the A01 fallback produced — and asserts that claim 2 FAILS. A gate
    that cannot fail proves nothing; run this once before trusting a pass.

    Note what it does and does not reproduce: it reproduces the *consequence*
    (web has no route to the API), not the *cause* (compose spelling the variable
    with the mobile app's name). The spelling is held by
    web/lib/backend-url.test.ts, which cannot see container networking. The two
    gates are complements, and neither alone covers A01.

.PARAMETER SkipBuild
    Reuse images already built under this project. For iterating on the checks.

.NOTES
    ISOLATION. Runs under its own compose project name, so the postgres volume
    is `<project>_vinaadi_db_data` and not the real stack's. It never touches
    vinaadi_dev: that is a different container (slw-postgres), a different
    volume and a different database name, and this stack publishes no port on
    5432. Secrets and the database password are generated per run and synthetic.

    It passes --env-file explicitly, which REPLACES compose's automatic `.env`
    loading, so an operator's real .env cannot leak into the smoke stack.
#>
[CmdletBinding()]
param(
    [string]$Project = "vinaadi-smoke",
    [int]$WebPort = 13000,
    [int]$ApiPort = 18000,
    [switch]$BreakBackendUrl,
    [switch]$SkipBuild,
    [int]$BuildTimeoutSeconds = 2400,
    [int]$BootTimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

# Repo root derived from this script's own location, not typed. On this
# workspace that resolves to D:\sanstro (the path CLAUDE.md pins); in CI it
# resolves to the checkout, so the same gate runs in both without a second copy.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot
if (-not (Test-Path (Join-Path $repoRoot "docker-compose.app.yml"))) {
    throw "Not a Vinaadi checkout: no docker-compose.app.yml at $repoRoot."
}

# --- isolation guard -------------------------------------------------------
# This script runs `docker compose down -v`, which destroys the project's
# volumes. That is safe only because the project is a throwaway. Refuse to run
# under any name that could be someone's real stack.
if ($Project -notmatch '^vinaadi-smoke') {
    throw "Refusing to run: -Project must start with 'vinaadi-smoke' (got '$Project'). " +
          "This script runs 'docker compose down -v' against it."
}

$script:failures = @()
function Claim([string]$name, [bool]$ok, [string]$detail = "") {
    if ($ok) {
        Write-Host "  PASS  $name" -ForegroundColor Green
    } else {
        Write-Host "  FAIL  $name $detail" -ForegroundColor Red
        $script:failures += $name
    }
    return $ok
}

# --- synthetic environment -------------------------------------------------
# RandomNumberGenerator.Create(), deliberately:
#   - the static Fill() overload is .NET Core only, and this workspace's shell
#     is Windows PowerShell 5.1 on .NET Framework (first run died on it);
#   - RNGCryptoServiceProvider is Windows-only under .NET Core, so it would die
#     the other way round in CI on a Linux runner.
# Create() exists on both.
function New-RandomBytes([int]$count) {
    $buffer = New-Object 'System.Byte[]' $count
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
    return $buffer
}

function New-SyntheticSecret([int]$bytes) {
    return [Convert]::ToBase64String((New-RandomBytes $bytes))
}

# Fernet wants url-safe base64 of exactly 32 bytes.
function New-FernetKey {
    return ([Convert]::ToBase64String((New-RandomBytes 32))).Replace('+', '-').Replace('/', '_')
}

# GetTempPath(), not $env:TEMP: TEMP is not set on a Linux runner.
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) "vinaadi-compose-smoke-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Path $workDir -Force | Out-Null
$envFile = Join-Path $workDir ".env.smoke"

# Loopback is what the A01 fallback resolved to inside the web container, where
# nothing listens. Setting it deliberately is the negative control.
$backendUrlValue = if ($BreakBackendUrl) { "http://127.0.0.1:8000" } else { "http://api:8000" }

@(
    "POSTGRES_DB=vinaadi_smoke"
    "POSTGRES_USER=smoke_admin"
    "POSTGRES_PASSWORD=$(New-SyntheticSecret 18)"
    "JOTHIDAM_JWT_SECRET=$(New-SyntheticSecret 48)"
    "JOTHIDAM_ADMIN_API_KEY=$(New-SyntheticSecret 24)"
    "JOTHIDAM_ENCRYPTION_KEY=$(New-FernetKey)"
    "BACKEND_URL=$backendUrlValue"
    # The opt-in `edge` service declares `${VINAADI_DOMAIN:?}`, and compose
    # interpolates every service in the file at load time — before profiles are
    # applied — so even `down` fails without it. Synthetic, and the edge service
    # is never started here.
    "VINAADI_DOMAIN=smoke.invalid"
    # One worker: the smoke is a wiring check, not a concurrency test, and the
    # api service refuses WEB_CONCURRENCY > 1 without a shared limiter.
    "WEB_CONCURRENCY=1"
    "JOTHIDAM_RUN_SCHEDULER_IN_WEB=false"
) | Set-Content -Path $envFile -Encoding utf8

# Host-port override, generated rather than committed.
#
# docker-compose.app.yml pins 127.0.0.1:3000 and 127.0.0.1:8000, which collide
# with a `next dev` / uvicorn already running on this machine. The override
# remaps only the published ports and leaves the shipped file — the thing under
# test — untouched. The project directory, and so every build context, still
# comes from the first -f file.
#
# `!override` is required, not decoration: compose MERGES sequence fields across
# overlay files, so a plain `ports:` list is APPENDED to the base one. The first
# run of this override published 18000 *and* 8000 and died on
# "ports are not available: ... 127.0.0.1:8000 ... Only one usage of each socket
# address", which reads like a port conflict in the base file rather than a
# merge semantics mistake in this one.
$overrideFile = Join-Path $workDir "docker-compose.smoke-ports.yml"
@(
    "services:"
    "  api:"
    "    ports: !override"
    "      - `"127.0.0.1:${ApiPort}:8000`""
    "  web:"
    "    ports: !override"
    "      - `"127.0.0.1:${WebPort}:3000`""
) | Set-Content -Path $overrideFile -Encoding utf8

$compose = @(
    "compose", "--env-file", $envFile,
    "-f", "docker-compose.app.yml",
    "-f", $overrideFile,
    "-p", $Project
)

function Invoke-Compose {
    param([string[]]$Arguments, [int]$TimeoutSeconds = 600, [switch]$IgnoreExit)
    $all = $compose + $Arguments
    Write-Host "docker $($all -join ' ')" -ForegroundColor DarkGray
    $proc = Start-Process -FilePath "docker" -ArgumentList $all -NoNewWindow -PassThru
    # Touching .Handle caches the process handle. Without it, a Start-Process
    # object obtained with -PassThru but not -Wait reports a NULL ExitCode after
    # the process ends, which this script printed as "failed with exit code ."
    $null = $proc.Handle
    if (-not $proc.WaitForExit($TimeoutSeconds * 1000)) {
        # Bound every unbounded wait: a hang should cost minutes and a readable
        # log, not hours and a cancellation (P0-5).
        try { $proc.Kill() } catch { }
        throw "docker compose $($Arguments -join ' ') exceeded ${TimeoutSeconds}s and was killed."
    }
    # The timed WaitForExit(ms) overload returns before ExitCode is populated —
    # it reported an empty code on the first run of this script. The no-arg
    # overload after it flushes that.
    $proc.WaitForExit()
    $exitCode = $proc.ExitCode
    if ($exitCode -ne 0 -and -not $IgnoreExit) {
        throw "docker compose $($Arguments -join ' ') failed with exit code $exitCode."
    }
    return $exitCode
}

function Invoke-Probe {
    <# Returns @{ Status; Body } — never throws on an HTTP error status. #>
    param([string]$Url, [string]$Method = "GET", [string]$Body, [hashtable]$Headers = @{}, [int]$TimeoutSeconds = 30)
    try {
        $splat = @{
            Uri             = $Url
            Method          = $Method
            TimeoutSec      = $TimeoutSeconds
            Headers         = $Headers
            UseBasicParsing = $true
            ErrorAction     = 'Stop'
        }
        if ($Body) {
            $splat.Body = $Body
            $splat.ContentType = "application/json"
        }
        $response = Invoke-WebRequest @splat
        return @{ Status = [int]$response.StatusCode; Body = $response.Content }
    } catch {
        $webResponse = $_.Exception.Response
        if ($null -ne $webResponse) {
            $status = 0
            try { $status = [int]$webResponse.StatusCode } catch { }
            $body = ""
            try {
                $reader = New-Object System.IO.StreamReader($webResponse.GetResponseStream())
                $body = $reader.ReadToEnd()
            } catch { }
            return @{ Status = $status; Body = $body }
        }
        return @{ Status = 0; Body = $_.Exception.Message }
    }
}

$cleanupDone = $false
function Invoke-Cleanup {
    if ($script:cleanupDone) { return }
    $script:cleanupDone = $true
    Write-Host ""
    Write-Host "--- tearing down project '$Project' (volumes included) ---" -ForegroundColor DarkGray
    Invoke-Compose -Arguments @("down", "-v", "--remove-orphans") -TimeoutSeconds 180 -IgnoreExit | Out-Null
    Remove-Item -Recurse -Force $workDir -ErrorAction SilentlyContinue
}

try {
    Write-Host ""
    Write-Host "=== Compose proxy smoke (A01) ===" -ForegroundColor Cyan
    Write-Host "project:      $Project"
    Write-Host "web BACKEND_URL: $backendUrlValue$(if ($BreakBackendUrl) { '   <-- NEGATIVE CONTROL' })"
    Write-Host ""

    # Start from nothing, so a previous run's containers cannot answer for this one.
    Invoke-Compose -Arguments @("down", "-v", "--remove-orphans") -TimeoutSeconds 180 -IgnoreExit | Out-Null

    if (-not $SkipBuild) {
        # One service at a time, deliberately. Building both together runs
        # `pip install` and a 855-package `pnpm install` through the same
        # BuildKit network at once; the first attempt here failed with
        # "Could not find a version that satisfies the requirement bcrypt==5.0.0
        # (from versions: none)" while pnpm was retrying dozens of registry
        # fetches beside it. "from versions: none" is PyPI being unreachable,
        # not a missing release — an isolated build probe reached PyPI fine
        # seconds later. Serialising removes the contention, and makes a real
        # failure attributable to one image.
        foreach ($service in @("api", "web")) {
            Invoke-Compose -Arguments @("build", $service) -TimeoutSeconds $BuildTimeoutSeconds | Out-Null
        }
    }

    # The worker is not part of this check; naming the services keeps the
    # scheduler and certbot out of it.
    Invoke-Compose -Arguments @("up", "-d", "--no-build", "db", "redis", "api", "web") -TimeoutSeconds 300 | Out-Null

    # WAIT FOR THE API TO BE HEALTHY, NOT JUST STARTED.
    #
    # `up -d` returns when containers are created, and this container runs
    # Alembic before uvicorn accepts a connection. The first version of this
    # script waited only for web, fired its probes while the api was still
    # mid-migration, and reported
    #   FAIL proxy reaches the api container -> HTTP 502 Backend unreachable
    # on a correctly configured stack.
    #
    # That is worse than a flake: the NEGATIVE CONTROL asserts exactly that
    # failure, so it would have "passed" because the backend had not finished
    # booting rather than because BACKEND_URL was wrong — a gate that cannot
    # fail, confirming nothing. The api service already declares a healthcheck;
    # this waits for it.
    Write-Host ""
    Write-Host "--- waiting for api health (max ${BootTimeoutSeconds}s) ---" -ForegroundColor DarkGray
    $deadline = (Get-Date).AddSeconds($BootTimeoutSeconds)
    $apiHealthy = $false
    $apiContainer = "$Project-api-1"
    while ((Get-Date) -lt $deadline) {
        $status = (docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $apiContainer 2>$null)
        if ($status -eq "healthy") { $apiHealthy = $true; break }
        if ($status -eq "none") {
            # No healthcheck declared on this service: fall back to the port.
            if ((Invoke-Probe -Url "http://127.0.0.1:$ApiPort/health/ready" -TimeoutSeconds 5).Status -eq 200) {
                $apiHealthy = $true; break
            }
        }
        Start-Sleep -Seconds 3
    }
    if (-not $apiHealthy) {
        Invoke-Compose -Arguments @("logs", "--tail", "60", "api") -TimeoutSeconds 60 -IgnoreExit | Out-Null
        throw "api never became healthy within ${BootTimeoutSeconds}s; the proxy claims would be untrustworthy."
    }
    Write-Host "api is healthy" -ForegroundColor DarkGray

    Write-Host "--- waiting for web on $WebPort (max ${BootTimeoutSeconds}s) ---" -ForegroundColor DarkGray
    $deadline = (Get-Date).AddSeconds($BootTimeoutSeconds)
    $served = $false
    while ((Get-Date) -lt $deadline) {
        if ((Invoke-Probe -Url "http://127.0.0.1:$WebPort/" -TimeoutSeconds 5).Status -eq 200) {
            $served = $true
            break
        }
        Start-Sleep -Seconds 3
    }

    Write-Host ""
    Write-Host "--- claims ---" -ForegroundColor Cyan

    if (-not (Claim "web serves / on $WebPort" $served)) {
        Invoke-Compose -Arguments @("logs", "--tail", "60", "web") -TimeoutSeconds 60 -IgnoreExit | Out-Null
        throw "web never served; the remaining claims cannot be evaluated."
    }

    # CLAIM 2 — the A01 claim.
    $ready = Invoke-Probe -Url "http://127.0.0.1:$WebPort/api/backend/health/ready"
    $readyOk = ($ready.Status -eq 200) -and ($ready.Body -match '"status"\s*:\s*"ready"')
    Claim "proxy reaches the api container (/api/backend/health/ready)" $readyOk `
        "-> HTTP $($ready.Status) $($ready.Body)" | Out-Null

    # CLAIM 3 — a synthetic authenticated read through the proxy (step 6).
    # Clearly-synthetic identity: never a real address (CLAUDE.md, test data).
    $email = "smoke+$([Guid]::NewGuid().ToString('N').Substring(0,10))@example.invalid"
    $password = "Sm0ke-" + (New-SyntheticSecret 12)
    $registerBody = @{ email = $email; password = $password; consentGiven = $true } | ConvertTo-Json -Compress
    $register = Invoke-Probe -Url "http://127.0.0.1:$WebPort/api/backend/api/v1/auth/mobile/register" `
        -Method POST -Body $registerBody
    Claim "proxy forwards a POST body (mobile register)" ($register.Status -eq 200) `
        "-> HTTP $($register.Status) $($register.Body)" | Out-Null

    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json -Compress
    $login = Invoke-Probe -Url "http://127.0.0.1:$WebPort/api/backend/api/v1/auth/mobile/login" `
        -Method POST -Body $loginBody
    $accessToken = $null
    if ($login.Status -eq 200) {
        try { $accessToken = ($login.Body | ConvertFrom-Json).accessToken } catch { }
    }
    Claim "proxy returns an issued token (mobile login)" ([bool]$accessToken) `
        "-> HTTP $($login.Status) $($login.Body)" | Out-Null

    if ($accessToken) {
        $me = Invoke-Probe -Url "http://127.0.0.1:$WebPort/api/backend/api/v1/auth/me" `
            -Headers @{ Authorization = "Bearer $accessToken" }
        $meOk = ($me.Status -eq 200) -and ($me.Body -match [Regex]::Escape($email))
        Claim "proxy forwards Authorization and returns the account (auth/me)" $meOk `
            "-> HTTP $($me.Status)" | Out-Null
    }

    # A backend outage must read as a bounded, recognisable error, not a hang
    # (A01 'Tests and completion criteria').
    if (-not $BreakBackendUrl) {
        Invoke-Compose -Arguments @("stop", "api") -TimeoutSeconds 120 | Out-Null
        $outage = Invoke-Probe -Url "http://127.0.0.1:$WebPort/api/backend/health/ready" -TimeoutSeconds 30
        Claim "backend outage is a bounded 502, not a hang" `
            (($outage.Status -eq 502) -and ($outage.Body -match "unreachable")) `
            "-> HTTP $($outage.Status) $($outage.Body)" | Out-Null
    }

    Write-Host ""
    if ($BreakBackendUrl) {
        # Inverted expectation. The whole point is that it must not pass.
        if ($readyOk) {
            Write-Host "NEGATIVE CONTROL FAILED: the proxy reached the api container with " -ForegroundColor Red -NoNewline
            Write-Host "BACKEND_URL=$backendUrlValue. This gate cannot fail, so it proves nothing." -ForegroundColor Red
            exit 1
        }
        Write-Host "NEGATIVE CONTROL OK: claim 2 failed with the broken BACKEND_URL, as required." -ForegroundColor Green
        exit 0
    }

    if ($script:failures.Count -gt 0) {
        Write-Host "SMOKE FAILED: $($script:failures -join '; ')" -ForegroundColor Red
        Invoke-Compose -Arguments @("logs", "--tail", "80", "web", "api") -TimeoutSeconds 60 -IgnoreExit | Out-Null
        exit 1
    }

    Write-Host "SMOKE PASSED: web -> api is wired through the proxy." -ForegroundColor Green
    exit 0
} finally {
    Invoke-Cleanup
}
