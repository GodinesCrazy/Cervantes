param(
  [string]$Provider = 'gemini',
  [int]$Port = 3002
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -ne 0 } |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$env:AI_PROVIDER = $Provider
$env:PORT = [string]$Port

$process = Start-Process -WindowStyle Hidden -FilePath npm.cmd -ArgumentList 'run', 'dev:backend' -WorkingDirectory $root -PassThru
try {
  Start-Sleep -Seconds 8

  $status = Invoke-RestMethod -Uri "http://localhost:$Port/api/settings/status" -Method Get
  $project = Invoke-RestMethod -Uri "http://localhost:$Port/api/projects" -Method Post -ContentType 'application/json' -Body (@{
    name = "$Provider smoke test"
    rawIdea = 'Un ebook premium sobre cuidado de perros para principiantes'
    topic = 'Un ebook premium sobre cuidado de perros para principiantes'
    audience = 'Duenos principiantes'
    tone = 'Premium practico'
  } | ConvertTo-Json)

  $result = Invoke-RestMethod -Uri "http://localhost:$Port/api/projects/$($project.id)/idea" -Method Post -ContentType 'application/json' -Body (@{
    rawIdea = 'Un ebook premium sobre cuidado de perros para principiantes'
    topic = 'Un ebook premium sobre cuidado de perros para principiantes'
  } | ConvertTo-Json)

  $latestLog = $result.aiUsageLogs | Select-Object -First 1 provider, model, status, error
  @{
    settings = $status.ai
    projectId = $result.id
    questions = $result.clarifications.Count
    latestAiLog = $latestLog
  } | ConvertTo-Json -Depth 8
} finally {
  Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -ne 0 } |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  if ($process -and !$process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
}
