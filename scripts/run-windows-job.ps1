#requires -Version 5.1

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("collect", "daily")]
  [string]$Job,

  [string]$ProjectPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path,

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

$ResolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$PackageJsonPath = Join-Path $ResolvedProjectPath "package.json"

if (-not (Test-Path -LiteralPath $PackageJsonPath)) {
  throw "ProjectPath must point to the AIxxts repository root. Missing package.json: $PackageJsonPath"
}

$OutputPath = Join-Path $ResolvedProjectPath "output"
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

$PackageScript = if ($Job -eq "collect") { "job:collect" } else { "job:daily" }
$LogName = if ($Job -eq "collect") { "collect.log" } else { "daily.log" }
$LogPath = Join-Path $OutputPath $LogName

if ([string]::IsNullOrWhiteSpace($PnpmPath)) {
  $ResolvedPnpmPath = Resolve-CommandPath "pnpm"
} else {
  $ResolvedPnpmPath = Resolve-CommandPath $PnpmPath
}

function Write-TaskLogLine {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  $Timestamp = Get-Date -Format "o"
  Add-Content -LiteralPath $LogPath -Value "[$Timestamp] $Message" -Encoding UTF8
}

Set-Location -LiteralPath $ResolvedProjectPath
Write-TaskLogLine "START $PackageScript"

$ExitCode = 0
$StdoutPath = [IO.Path]::GetTempFileName()
$StderrPath = [IO.Path]::GetTempFileName()

try {
  $Process = Start-Process `
    -FilePath $ResolvedPnpmPath `
    -ArgumentList @($PackageScript) `
    -WorkingDirectory $ResolvedProjectPath `
    -RedirectStandardOutput $StdoutPath `
    -RedirectStandardError $StderrPath `
    -Wait `
    -PassThru `
    -WindowStyle Hidden

  Get-Content -LiteralPath $StdoutPath -ErrorAction SilentlyContinue |
    Add-Content -LiteralPath $LogPath -Encoding UTF8
  Get-Content -LiteralPath $StderrPath -ErrorAction SilentlyContinue |
    Add-Content -LiteralPath $LogPath -Encoding UTF8

  $ExitCode = $Process.ExitCode
} catch {
  $_ | Out-String | Add-Content -LiteralPath $LogPath -Encoding UTF8
  $ExitCode = 1
} finally {
  Remove-Item -LiteralPath $StdoutPath, $StderrPath -Force -ErrorAction SilentlyContinue
}

Write-TaskLogLine "END $PackageScript exit=$ExitCode"
exit $ExitCode
