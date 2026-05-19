# Etsy Analyzer — Automated Setup Script
# Run this from: C:\Users\Dell\etsy-analyzer
# Usage: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Etsy Analyzer — Local Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check prerequisites ────────────────────────────────────────────

Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Yellow

$tools = @("docker", "node", "pnpm", "python")
foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "  ERROR: $tool not found. Please install it first." -ForegroundColor Red
        exit 1
    }
    $ver = & $tool --version 2>&1 | Select-Object -First 1
    Write-Host "  $tool`: $ver" -ForegroundColor Green
}

# ── Step 2: Generate secrets ───────────────────────────────────────────────

Write-Host ""
Write-Host "[2/7] Generating secure secrets..." -ForegroundColor Yellow

function New-RandomString([int]$Length, [string]$Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
    -join ((1..$Length) | ForEach-Object { $Chars[(Get-Random -Maximum $Chars.Length)] })
}
function New-HexString([int]$ByteCount) {
    $bytes = New-Object byte[] $ByteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [BitConverter]::ToString($bytes) -replace '-', '' | ForEach-Object { $_.ToLower() }
}

$JWT_SECRET      = New-RandomString 64
$JWT_REFRESH     = New-RandomString 64
$NEXTAUTH_SECRET = New-RandomString 32
$TOKEN_ENC_KEY   = New-HexString 32

Write-Host "  Secrets generated OK" -ForegroundColor Green

# ── Step 3: Create .env.local ──────────────────────────────────────────────

Write-Host ""
Write-Host "[3/7] Creating .env.local..." -ForegroundColor Yellow

$envPath = Join-Path $Root ".env.local"

if (Test-Path $envPath) {
    Write-Host "  .env.local already exists — skipping (delete it to regenerate)" -ForegroundColor Cyan
} else {
    $envContent = @"
# ── INFRASTRUCTURE ───────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/etsy_analyzer
DATABASE_URL_TIMESCALE=postgresql://postgres:password@localhost:5432/etsy_analyzer
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# ── GENERATED SECRETS ────────────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
TOKEN_ENCRYPTION_KEY=$TOKEN_ENC_KEY

# ── APP ──────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# ── ETSY API (get from etsy.com/developers) ──────────────────────────
ETSY_API_KEY=
ETSY_API_SECRET=
ETSY_REDIRECT_URI=http://localhost:3000/auth/etsy/callback

# ── AI (optional — grader degrades gracefully without this) ──────────
ANTHROPIC_API_KEY=

# ── STRIPE (optional) ────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_AGENCY_MONTHLY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_AGENCY_ANNUAL=

# ── EMAIL (optional — logs to console without this) ───────────────────
RESEND_API_KEY=
FROM_EMAIL=noreply@localhost

# ── SCRAPING ──────────────────────────────────────────────────────────
ENABLE_SCRAPING=true
BRIGHTDATA_USERNAME=
BRIGHTDATA_PASSWORD=
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=22225

# ── INTERNAL SERVICE URLs ─────────────────────────────────────────────
AUTH_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:8001
RESEARCH_SERVICE_URL=http://localhost:8002
KEYWORD_SERVICE_URL=http://localhost:8003
COMPETITOR_SERVICE_URL=http://localhost:3002
GRADER_SERVICE_URL=http://localhost:8004
NOTIFICATION_SERVICE_URL=http://localhost:3003

# ── NEXT.JS PUBLIC URLS ───────────────────────────────────────────────
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:8001
NEXT_PUBLIC_RESEARCH_URL=http://localhost:8002
NEXT_PUBLIC_KEYWORD_URL=http://localhost:8003
NEXT_PUBLIC_COMPETITOR_URL=http://localhost:3002
NEXT_PUBLIC_GRADER_URL=http://localhost:8004
NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:3003
"@
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    # Also copy to root .env for pnpm
    Copy-Item $envPath (Join-Path $Root ".env")
    Write-Host "  .env.local created OK" -ForegroundColor Green
}

# ── Step 4: Start Docker infrastructure ───────────────────────────────────

Write-Host ""
Write-Host "[4/7] Starting Docker infrastructure..." -ForegroundColor Yellow

Set-Location $Root
docker compose -f docker-compose.infra.yml up -d

Write-Host "  Waiting 35 seconds for Elasticsearch to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 35

# Check health
$healthy = docker compose -f docker-compose.infra.yml ps --format json 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
Write-Host "  Docker services started" -ForegroundColor Green

# ── Step 5: Install pnpm dependencies ─────────────────────────────────────

Write-Host ""
Write-Host "[5/7] Installing Node.js dependencies..." -ForegroundColor Yellow
pnpm install --frozen-lockfile=false 2>&1 | Select-String "Done|Error" | Write-Host
Write-Host "  Dependencies installed" -ForegroundColor Green

# ── Step 6: Build packages and run migrations ──────────────────────────────

Write-Host ""
Write-Host "[6/7] Building shared packages and running DB migrations..." -ForegroundColor Yellow

pnpm --filter @etsy-analyzer/types build 2>&1 | Out-Null
pnpm --filter @etsy-analyzer/config build 2>&1 | Out-Null
pnpm --filter @etsy-analyzer/db build 2>&1 | Out-Null

Write-Host "  Packages built" -ForegroundColor Green

try {
    pnpm db:push 2>&1 | Select-String "applied|error" | Write-Host
    Write-Host "  DB migrations applied" -ForegroundColor Green
} catch {
    Write-Host "  DB migration warning (may already be applied): $_" -ForegroundColor Yellow
}

# ── Step 7: Seed Redis plan limits ─────────────────────────────────────────

Write-Host ""
Write-Host "[7/7] Seeding Redis plan limits..." -ForegroundColor Yellow

$redisContainer = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1 | Select-Object -First 1

if ($redisContainer) {
    docker exec $redisContainer redis-cli HSET plan:limits:free    research_searches 5   grades 2   keywords 10  competitors 0  exports 1  | Out-Null
    docker exec $redisContainer redis-cli HSET plan:limits:starter research_searches 50  grades 20  keywords 100 competitors 5  exports 10 | Out-Null
    docker exec $redisContainer redis-cli HSET plan:limits:pro     research_searches 500 grades 200 keywords -1  competitors 25 exports 50 | Out-Null
    docker exec $redisContainer redis-cli HSET plan:limits:agency  research_searches -1  grades -1  keywords -1  competitors 100 exports -1 | Out-Null
    Write-Host "  Redis plan limits seeded" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Redis container not found — run manually from SETUP.md" -ForegroundColor Yellow
}

# ── Done ────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Install Python deps (run once):" -ForegroundColor Yellow
Write-Host "     pip install fastapi uvicorn asyncpg redis elasticsearch pydantic pydantic-settings structlog httpx tenacity"
Write-Host ""
Write-Host "  2. Start all services — open 6 PowerShell windows:" -ForegroundColor Yellow
Write-Host "     Window 1: pnpm --filter @etsy-analyzer/auth-service dev"
Write-Host "     Window 2: cd services\research-service  && set PYTHONPATH=. && uvicorn src.main:app --port 8002 --reload"
Write-Host "     Window 3: cd services\keyword-service   && set PYTHONPATH=. && uvicorn src.main:app --port 8003 --reload"
Write-Host "     Window 4: cd services\grader-service    && set PYTHONPATH=. && uvicorn src.main:app --port 8004 --reload"
Write-Host "     Window 5: pnpm --filter @etsy-analyzer/competitor-service dev"
Write-Host "     Window 6: pnpm --filter @etsy-analyzer/web dev"
Write-Host ""
Write-Host "  3. Open http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  See SETUP.md for optional features (Etsy API, AI, Stripe)" -ForegroundColor Cyan
Write-Host ""
