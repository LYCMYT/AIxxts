#requires -Version 5.1

[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$TaskPrefix = "AIxxts"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command Get-ScheduledTask -ErrorAction SilentlyContinue)) {
  throw "The ScheduledTasks PowerShell module is required. Missing command: Get-ScheduledTask"
}

$TaskNames = @(
  "$TaskPrefix Collect",
  "$TaskPrefix Daily Digest"
)

foreach ($TaskName in $TaskNames) {
  $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

  if ($null -eq $Task) {
    Write-Host "Task not found: $TaskName"
    continue
  }

  if ($PSCmdlet.ShouldProcess($TaskName, "Unregister scheduled task")) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Unregistered task: $TaskName"
  }
}
