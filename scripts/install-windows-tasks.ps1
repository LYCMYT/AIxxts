#requires -Version 5.1

[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$ProjectPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path,

  [ValidatePattern("^\d{2}:\d{2}$")]
  [string]$DailyTime = "08:00",

  [ValidateRange(1, 1439)]
  [int]$CollectMinutes = 30,

  [string]$TaskPrefix = "AIxxts",

  [string]$PnpmPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-CommandPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandOrPath
  )

  if (Test-Path -LiteralPath $CommandOrPath) {
    return (Resolve-Path -LiteralPath $CommandOrPath).Path
  }

  return (Get-Command $CommandOrPath -ErrorAction Stop).Source
}

foreach ($CommandName in @("New-ScheduledTaskAction", "Register-ScheduledTask")) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "The ScheduledTasks PowerShell module is required. Missing command: $CommandName"
  }
}

$ResolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$PackageJsonPath = Join-Path $ResolvedProjectPath "package.json"
$RunnerPath = Join-Path $ResolvedProjectPath "scripts\run-windows-job.ps1"

if (-not (Test-Path -LiteralPath $PackageJsonPath)) {
  throw "ProjectPath must point to the AIxxts repository root. Missing package.json: $PackageJsonPath"
}

if (-not (Test-Path -LiteralPath $RunnerPath)) {
  throw "Missing task runner script: $RunnerPath"
}

try {
  $DailyTimeSpan = [TimeSpan]::ParseExact($DailyTime, "hh\:mm", [Globalization.CultureInfo]::InvariantCulture)
} catch {
  throw "DailyTime must use 24-hour HH:mm format, for example 08:00 or 21:30."
}

if ([string]::IsNullOrWhiteSpace($PnpmPath)) {
  $ResolvedPnpmPath = Resolve-CommandPath "pnpm"
} else {
  $ResolvedPnpmPath = Resolve-CommandPath $PnpmPath
}

$OutputPath = Join-Path $ResolvedProjectPath "output"
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

function New-AIxxtsTaskAction {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("collect", "daily")]
    [string]$Job
  )

  $Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -ProjectPath "{1}" -Job {2} -PnpmPath "{3}"' -f `
    $RunnerPath, $ResolvedProjectPath, $Job, $ResolvedPnpmPath

  return New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Arguments -WorkingDirectory $ResolvedProjectPath
}

$CollectTaskName = "$TaskPrefix Collect"
$DailyTaskName = "$TaskPrefix Daily Digest"
$CurrentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Limited
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)

$CollectTrigger = New-ScheduledTaskTrigger `
  -Once `
  -At ((Get-Date).AddMinutes(1)) `
  -RepetitionInterval (New-TimeSpan -Minutes $CollectMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$DailyTrigger = New-ScheduledTaskTrigger -Daily -At ([DateTime]::Today.Add($DailyTimeSpan))

$Tasks = @(
  @{
    Name = $CollectTaskName
    Action = New-AIxxtsTaskAction -Job "collect"
    Trigger = $CollectTrigger
    Description = "Runs pnpm job:collect for AIxxts every $CollectMinutes minutes. Logs to output\collect.log."
  },
  @{
    Name = $DailyTaskName
    Action = New-AIxxtsTaskAction -Job "daily"
    Trigger = $DailyTrigger
    Description = "Runs pnpm job:daily for AIxxts at $DailyTime. Logs to output\daily.log."
  }
)

foreach ($Task in $Tasks) {
  if ($PSCmdlet.ShouldProcess($Task.Name, "Register scheduled task")) {
    Register-ScheduledTask `
      -TaskName $Task.Name `
      -Action $Task.Action `
      -Trigger $Task.Trigger `
      -Principal $Principal `
      -Settings $Settings `
      -Description $Task.Description `
      -Force | Out-Null

    Write-Host "Registered task: $($Task.Name)"
  }
}

Write-Host "Project path: $ResolvedProjectPath"
Write-Host "Collect interval: every $CollectMinutes minute(s)"
Write-Host "Daily digest time: $DailyTime"
Write-Host "Logs: $OutputPath"
