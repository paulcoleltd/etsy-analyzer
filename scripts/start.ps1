# Etsy Analyzer — Start all services
# Run from: C:\Users\Dell\etsy-analyzer
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start.ps1

$Root = Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent
Set-Location $Root

# Make sure .env exists
if (-not (Test-Path ".env") -and (Test-Path ".env.local")) {
    Copy-Item ".env.local" ".env"
}

Write-Host "Starting Etsy Analyzer services..." -ForegroundColor Cyan
Write-Host ""

# Start each service in a new PowerShell window
$services = @(
    @{ Name = "Auth Service (3001)";       Cmd = "pnpm --filter @etsy-analyzer/auth-service dev" },
    @{ Name = "Research Service (8002)";   Cmd = "cd services\research-service && set PYTHONPATH=. && uvicorn src.main:app --host 0.0.0.0 --port 8002 --reload" },
    @{ Name = "Keyword Service (8003)";    Cmd = "cd services\keyword-service  && set PYTHONPATH=. && uvicorn src.main:app --host 0.0.0.0 --port 8003 --reload" },
    @{ Name = "Grader Service (8004)";     Cmd = "cd services\grader-service   && set PYTHONPATH=. && uvicorn src.main:app --host 0.0.0.0 --port 8004 --reload" },
    @{ Name = "Competitor Service (3002)"; Cmd = "pnpm --filter @etsy-analyzer/competitor-service dev" },
    @{ Name = "Web App (3000)";            Cmd = "pnpm --filter @etsy-analyzer/web dev" }
)

foreach ($svc in $services) {
    $title = $svc.Name
    $cmd   = "cd '$Root'; $($svc.Cmd)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Normal
    Write-Host "  Started: $title" -ForegroundColor Green
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "All services starting. Wait ~15 seconds then open:" -ForegroundColor White
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Health checks:" -ForegroundColor Yellow
Write-Host "  http://localhost:3001/health  (auth)"
Write-Host "  http://localhost:8002/health  (research)"
Write-Host "  http://localhost:8003/health  (keywords)"
Write-Host "  http://localhost:8004/health  (grader)"
Write-Host "  http://localhost:3002/health  (competitors)"
