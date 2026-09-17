<#
.SYNOPSIS
  Isolated signed-in dashboard stack for rendered UX checks
  (docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md, web/scripts/ux-audit.mjs).

.DESCRIPTION
  Why this exists. `next dev` deletes everything in its distDir except `cache`
  when it starts (next/dist/server/dev/hot-reloader-webpack.js, clean()). A
  second dev server started inside web/ therefore wipes the compiled output of
  the dev server the owner already runs on :3000. This script runs the frontend
  from a COPY of web/ that has its own .next, wired to the dedicated e2e backend
  (database vinaadi_e2e) on :8010, so nothing the owner is running is touched.

  The copy must live on the same drive as the repo: from another drive Next
  emits "./D:/..." module paths and every route answers 500.

  up      copy web/ to artifacts/ux-stack/web (gitignored), link node_modules and
          packages with directory junctions, start the backend and the frontend,
          and wait until /api/backend/health THROUGH THE FRONTEND PROXY reports
          environment "e2e". Refuses to finish if it reports anything else.
  down    stop both process trees and remove the junctions (the links only,
          never their targets). The copied files stay; they are gitignored.
  serve   start the isolated stack, keep it alive for a caller such as
          Playwright, and tear it down when the caller exits.
  watch   internal to serve: a detached process that runs Stop-Stack once
          -WatchPid exits, because Playwright force-kills the serve tree and
          its finally block never runs.
  status  show ports, recorded processes, junctions and proxy health.

  Never delete artifacts/ux-stack with `Remove-Item -Recurse` while junctions
  exist: Windows PowerShell 5.1 can follow a junction into its target. Run
  `-Action down` first; it removes the links with `cmd /c rmdir`.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
  node web\scripts\ux-audit.mjs
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
#>
param(
    [ValidateSet("up", "down", "serve", "watch", "status")]
    [string]$Action = "status",
    [int]$FrontendPort = 3100,
    [int]$BackendPort = 8010,
    [int]$StartupTimeoutSeconds = 300,
    [int]$WatchPid = 0
)

$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
$Stack = Join-Path $Repo "artifacts\ux-stack"
$CopyWeb = Join-Path $Stack "web"
$StateFile = Join-Path $Stack "stack.json"
$LogDir = Join-Path $Stack "logs"
$Junctions = @(
    @{ Path = (Join-Path $CopyWeb "node_modules"); Target = (Join-Path $Repo "web\node_modules") },
    @{ Path = (Join-Path $Stack "node_modules"); Target = (Join-Path $Repo "node_modules") },
    @{ Path = (Join-Path $Stack "packages"); Target = (Join-Path $Repo "packages") }
)

function Get-Listener([int]$Port) {
    Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Get-CommandLine([int]$ProcessId) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
    if ($p) { return [string]$p.CommandLine }
    return ""
}

function Stop-Tree([int]$ProcessId) {
    if ($ProcessId -gt 0 -and (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        # Redirected inside cmd, not by PowerShell: with ErrorActionPreference
        # Stop, a PowerShell-side stderr redirect of a native command becomes a
        # terminating error. taskkill complains about children that already
        # exited with their parent; that noise is expected and harmless.
        & cmd.exe /c "taskkill /PID $ProcessId /T /F >nul 2>&1"
    }
}

function Remove-Junctions {
    foreach ($j in $Junctions) {
        $item = Get-Item -LiteralPath $j.Path -Force -ErrorAction SilentlyContinue
        if ($null -eq $item) { continue }
        if ($item.LinkType -ne "Junction") {
            throw "$($j.Path) exists and is not a junction - refusing to touch it."
        }
        & cmd.exe /c rmdir "$($j.Path)" | Out-Null
        Write-Output "unlinked $($j.Path)"
    }
}

function New-Junctions {
    foreach ($j in $Junctions) {
        if (-not (Test-Path -LiteralPath $j.Target)) { throw "missing link target $($j.Target)" }
        New-Item -ItemType Junction -Path $j.Path -Target $j.Target | Out-Null
    }
}

function Get-ProxyEnvironment {
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:$FrontendPort/api/backend/health" -TimeoutSec 60
        return [string]$h.environment
    } catch {
        return $null
    }
}

function Stop-Stack {
    # Only processes this script recorded are stopped. Another session's
    # Playwright run also uses :3100/:8010, and killing it would destroy its work.
    if (Test-Path -LiteralPath $StateFile) {
        $state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
        foreach ($name in @("frontendPid", "frontendServerPid", "backendPid", "backendServerPid")) {
            if ($state.PSObject.Properties.Name -contains $name) { Stop-Tree ([int]$state.$name) }
        }
        Remove-Item -LiteralPath $StateFile -ErrorAction SilentlyContinue
    }
    foreach ($port in @($FrontendPort, $BackendPort)) {
        $l = Get-Listener $port
        if ($null -eq $l) { continue }
        $cmd = Get-CommandLine $l.OwningProcess
        Write-Warning "port $port is still held by pid $($l.OwningProcess), which this script did not record - left alone: $cmd"
    }
    Remove-Junctions
}

switch ($Action) {
    "status" {
        foreach ($port in @($FrontendPort, $BackendPort, 3000, 8000)) {
            $l = Get-Listener $port
            if ($l) {
                $cmd = Get-CommandLine $l.OwningProcess
                Write-Output (":{0} pid {1} {2}" -f $port, $l.OwningProcess, $cmd.Substring(0, [Math]::Min(110, $cmd.Length)))
            } else {
                Write-Output (":{0} free" -f $port)
            }
        }
        foreach ($j in $Junctions) {
            $item = Get-Item -LiteralPath $j.Path -Force -ErrorAction SilentlyContinue
            $state = if ($null -eq $item) { "absent" } else { "$($item.LinkType)" }
            Write-Output ("link {0}: {1}" -f $j.Path, $state)
        }
        $envName = Get-ProxyEnvironment
        Write-Output ("proxy environment: {0}" -f $(if ($envName) { $envName } else { "unreachable" }))
    }

    "down" {
        Stop-Stack
        Write-Output "stack down"
    }

    "serve" {
        & $PSCommandPath -Action up -FrontendPort $FrontendPort -BackendPort $BackendPort -StartupTimeoutSeconds $StartupTimeoutSeconds
        $state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
        $state | Add-Member -NotePropertyName servePid -NotePropertyValue ([int]$PID)
        $state | ConvertTo-Json | Set-Content -Encoding ascii -LiteralPath $StateFile
        $watchCommand = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Action watch -FrontendPort $FrontendPort -BackendPort $BackendPort -WatchPid $PID"
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "start", "`"`"", "/b", $watchCommand) -WorkingDirectory $Repo -WindowStyle Hidden | Out-Null
        try {
            while ($true) {
                if (-not (Test-Path -LiteralPath $StateFile)) { break }
                $state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
                $frontendPid = if ($state.PSObject.Properties.Name -contains "frontendServerPid") { [int]$state.frontendServerPid } else { 0 }
                $backendPid = if ($state.PSObject.Properties.Name -contains "backendServerPid") { [int]$state.backendServerPid } else { 0 }
                if (($frontendPid -gt 0 -and -not (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) -or
                    ($backendPid -gt 0 -and -not (Get-Process -Id $backendPid -ErrorAction SilentlyContinue))) { break }
                Start-Sleep -Seconds 1
            }
        } finally {
            & $PSCommandPath -Action down -FrontendPort $FrontendPort -BackendPort $BackendPort
        }
    }

    "watch" {
        while ($WatchPid -gt 0 -and (Get-Process -Id $WatchPid -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 1
        }
        if (Test-Path -LiteralPath $StateFile) {
            $state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
            if ($state.PSObject.Properties.Name -contains "servePid" -and [int]$state.servePid -eq $WatchPid) {
                Stop-Stack
            }
        }
    }

    "up" {
        foreach ($port in @($FrontendPort, $BackendPort)) {
            $l = Get-Listener $port
            if ($l) {
                throw "port $port is already in use by pid $($l.OwningProcess). Run -Action status, then -Action down if it is this stack."
            }
        }
        New-Item -ItemType Directory -Force -Path $CopyWeb | Out-Null
        New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
        # A refresh must never copy through, or purge through, an old link.
        Remove-Junctions
        & robocopy.exe (Join-Path $Repo "web") $CopyWeb /MIR /XJ `
            /XD node_modules .next e2e tests test-results playwright-report coverage .artifacts .vite artifacts `
            /XF tsconfig.tsbuildinfo output.log .env.local `
            /NFL /NDL /NJH /NJS /NP | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
        New-Junctions
        [System.IO.File]::WriteAllText(
            (Join-Path $CopyWeb ".env.local"),
            "BACKEND_URL=http://127.0.0.1:$BackendPort`n",
            (New-Object System.Text.UTF8Encoding($false)))

        $backend = Start-Process -FilePath "powershell.exe" `
            -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $Repo "scripts\e2e-backend.ps1"), "-Port", "$BackendPort") `
            -WorkingDirectory $Repo -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $LogDir "backend.out.log") `
            -RedirectStandardError (Join-Path $LogDir "backend.err.log")

        $env:BACKEND_URL = "http://127.0.0.1:$BackendPort"
        $env:NEXT_TELEMETRY_DISABLED = "1"
        $frontend = Start-Process -FilePath "node.exe" `
            -ArgumentList @("node_modules\next\dist\bin\next", "dev", "--port", "$FrontendPort") `
            -WorkingDirectory $CopyWeb -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $LogDir "frontend.out.log") `
            -RedirectStandardError (Join-Path $LogDir "frontend.err.log")

        $state = [ordered]@{ backendPid = $backend.Id; frontendPid = $frontend.Id; started = (Get-Date).ToString("s") }
        $state | ConvertTo-Json | Set-Content -Encoding ascii -LiteralPath $StateFile

        $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
        $envName = $null
        while ((Get-Date) -lt $deadline) {
            $envName = Get-ProxyEnvironment
            if ($envName) { break }
            Start-Sleep -Seconds 3
        }
        if ($envName -ne "e2e") {
            Write-Warning "proxy environment is '$envName' - expected 'e2e'. Stopping. Logs: $LogDir"
            Stop-Stack
            throw "isolated stack did not come up against the e2e backend"
        }
        # Record the processes that actually hold the ports (the dev server and
        # uvicorn run as children of the processes started above).
        $state.frontendServerPid = (Get-Listener $FrontendPort).OwningProcess
        $state.backendServerPid = (Get-Listener $BackendPort).OwningProcess
        $state | ConvertTo-Json | Set-Content -Encoding ascii -LiteralPath $StateFile
        Write-Output "stack up: http://localhost:$FrontendPort (proxy -> e2e backend :$BackendPort). Logs: $LogDir"
    }
}

exit 0
