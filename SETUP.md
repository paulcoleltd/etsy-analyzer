# Etsy Analyzer — Local Setup Guide

Follow these steps in order. Each section tells you exactly what to do and why.

---

## STEP 1 — Generate secure secrets (do this first)

Open PowerShell and run:

```powershell
# These generate cryptographically random values
$JWT_SECRET        = -join ((65..90 + 97..122 + 48..57) * 10 | Get-Random -Count 64 | % {[char]$_})
$JWT_REFRESH       = -join ((65..90 + 97..122 + 48..57) * 10 | Get-Random -Count 64 | % {[char]$_})
$NEXTAUTH_SECRET   = -join ((65..90 + 97..122 + 48..57) * 10 | Get-Random -Count 32 | % {[char]$_})
$TOKEN_ENC_KEY     = -join ((48..57 + 97..102) * 10 | Get-Random -Count 64 | % {[char]$_})

Write-Host "JWT_SECRET=$JWT_SECRET"
Write-Host "JWT_REFRESH_SECRET=$JWT_REFRESH"
Write-Host "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
Write-Host "TOKEN_ENCRYPTION_KEY=$TOKEN_ENC_KEY"
```

Copy those 4 output values — you'll paste them into .env.local in Step 2.

---

## STEP 2 — Create your .env.local file

In the etsy-analyzer folder, create a file called `.env.local` with this content.
Replace the CHANGE_ME values with what you generated above.

```env
# ── INFRASTRUCTURE (these work as-is for local Docker) ──────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/etsy_analyzer
DATABASE_URL_TIMESCALE=postgresql://postgres:password@localhost:5432/etsy_analyzer
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# ── SECRETS — paste your generated values here ───────────────────────
JWT_SECRET=CHANGE_ME_64_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_64_CHARS
NEXTAUTH_SECRET=CHANGE_ME_32_CHARS
TOKEN_ENCRYPTION_KEY=CHANGE_ME_64_HEX

# ── APP ──────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# ── ETSY API — get these from etsy.com/developers ────────────────────
# Leave blank for now if you don't have them yet
# The app works without Etsy connection — research/grader still work
ETSY_API_KEY=
ETSY_API_SECRET=
ETSY_REDIRECT_URI=http://localhost:3000/auth/etsy/callback

# ── AI (optional — grader uses heuristic fallback if missing) ────────
ANTHROPIC_API_KEY=

# ── STRIPE (optional — billing pages work without these in dev) ──────
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_AGENCY_MONTHLY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_AGENCY_ANNUAL=

# ── EMAIL (optional — logs to console if missing) ────────────────────
RESEND_API_KEY=
FROM_EMAIL=noreply@localhost

# ── SCRAPING (optional — uses localhost without proxy) ───────────────
ENABLE_SCRAPING=true
BRIGHTDATA_USERNAME=
BRIGHTDATA_PASSWORD=
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=22225

# ── INTERNAL SERVICE URLs (for Docker) ──────────────────────────────
AUTH_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:8001
RESEARCH_SERVICE_URL=http://localhost:8002
KEYWORD_SERVICE_URL=http://localhost:8003
COMPETITOR_SERVICE_URL=http://localhost:3002
GRADER_SERVICE_URL=http://localhost:8004
NOTIFICATION_SERVICE_URL=http://localhost:3003

# ── NEXT.JS PUBLIC URLS (browser-side) ───────────────────────────────
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:8001
NEXT_PUBLIC_RESEARCH_URL=http://localhost:8002
NEXT_PUBLIC_KEYWORD_URL=http://localhost:8003
NEXT_PUBLIC_COMPETITOR_URL=http://localhost:3002
NEXT_PUBLIC_GRADER_URL=http://localhost:8004
NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:3003
```

---

## STEP 3 — Start the infrastructure (Docker)

```powershell
cd C:\Users\Dell\etsy-analyzer
docker compose -f docker-compose.infra.yml up -d
```

Wait about 30 seconds for Elasticsearch to start, then verify:

```powershell
# Should all show "healthy" or "running"
docker compose -f docker-compose.infra.yml ps
```

---

## STEP 4 — Run database migrations

```powershell
cd C:\Users\Dell\etsy-analyzer

# Copy .env.local so pnpm can find it
copy .env.local .env

pnpm db:push
```

Expected output: `All migrations applied successfully`

---

## STEP 5 — Seed Redis plan limits

```powershell
# Connect to the Redis container and set plan limits
docker exec -it etsy-analyzer-redis-1 redis-cli HSET plan:limits:free    research_searches 5   grades 2   keywords 10  competitors 0  exports 1
docker exec -it etsy-analyzer-redis-1 redis-cli HSET plan:limits:starter research_searches 50  grades 20  keywords 100 competitors 5  exports 10
docker exec -it etsy-analyzer-redis-1 redis-cli HSET plan:limits:pro     research_searches 500 grades 200 keywords -1  competitors 25 exports 50
docker exec -it etsy-analyzer-redis-1 redis-cli HSET plan:limits:agency  research_searches -1  grades -1  keywords -1  competitors 100 exports -1
```

---

## STEP 6 — Install Python dependencies

```powershell
# Install for each Python service
cd C:\Users\Dell\etsy-analyzer\services\research-service
pip install -e .

cd C:\Users\Dell\etsy-analyzer\services\keyword-service
pip install -e .

cd C:\Users\Dell\etsy-analyzer\services\grader-service
pip install -e .

cd C:\Users\Dell\etsy-analyzer\services\analytics-service
pip install -e .

cd C:\Users\Dell\etsy-analyzer\services\data-pipeline
pip install -e .
playwright install chromium
```

---

## STEP 7 — Start all services (open 6 PowerShell windows)

**Window 1 — Auth Service (port 3001)**
```powershell
cd C:\Users\Dell\etsy-analyzer
copy .env.local .env
pnpm --filter @etsy-analyzer/auth-service dev
```

**Window 2 — Research Service (port 8002)**
```powershell
cd C:\Users\Dell\etsy-analyzer\services\research-service
copy ..\..\\.env.local .env
PYTHONPATH=. uvicorn src.main:app --host 0.0.0.0 --port 8002 --reload
```

**Window 3 — Keyword Service (port 8003)**
```powershell
cd C:\Users\Dell\etsy-analyzer\services\keyword-service
copy ..\..\\.env.local .env
PYTHONPATH=. uvicorn src.main:app --host 0.0.0.0 --port 8003 --reload
```

**Window 4 — Grader Service (port 8004)**
```powershell
cd C:\Users\Dell\etsy-analyzer\services\grader-service
copy ..\..\\.env.local .env
PYTHONPATH=. uvicorn src.main:app --host 0.0.0.0 --port 8004 --reload
```

**Window 5 — Competitor Service (port 3002)**
```powershell
cd C:\Users\Dell\etsy-analyzer
pnpm --filter @etsy-analyzer/competitor-service dev
```

**Window 6 — Next.js Web App (port 3000)**
```powershell
cd C:\Users\Dell\etsy-analyzer
pnpm --filter @etsy-analyzer/web dev
```

---

## STEP 8 — Seed initial data

Once all services are running:

```powershell
cd C:\Users\Dell\etsy-analyzer\services\data-pipeline
copy ..\..\\.env.local .env
$env:DATA_PIPELINE_MODE = "seed"
$env:PYTHONPATH = "."
python src/main.py
```

This queues 20 keyword scrapes. Each scrape fetches ~48 listings and indexes them into Elasticsearch. After a few minutes you'll see results on the /research page.

---

## STEP 9 — Open the app

Go to: **http://localhost:3000**

1. Click **Start free** to create an account
2. Sign in
3. Go to **Research** → search for "silver ring" or "vinyl record"
4. Go to **Grader** → paste any Etsy listing URL

---

## Optional: Get an API key for better AI features

### Anthropic (for listing grader AI suggestions)
1. Go to https://console.anthropic.com
2. Create API key
3. Add to .env.local: `ANTHROPIC_API_KEY=sk-ant-...`
4. Restart grader service

### Etsy API (for shop dashboard)
1. Go to https://www.etsy.com/developers/register
2. Create an app
3. Add to .env.local:
   ```
   ETSY_API_KEY=your_key
   ETSY_API_SECRET=your_secret
   ```
4. Restart auth service
5. Go to Settings → Connect Etsy shop

### Stripe (for billing features)
1. Go to https://dashboard.stripe.com
2. Get test API keys (sk_test_... and pk_test_...)
3. Create 6 price objects (starter/pro/agency × monthly/annual)
4. Add all values to .env.local
5. Restart notification service
