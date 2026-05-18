# Shared Test Context — Etsy Analyzer

## System Under Test
Monorepo at `C:\Users\Dell\etsy-analyzer` (9-phase SaaS build).

## Services and Ports
| Service              | Port  | Language   |
|----------------------|-------|------------|
| auth-service         | 3001  | NestJS     |
| analytics-service    | 8001  | Python/FastAPI |
| research-service     | 8002  | Python/FastAPI |
| keyword-service      | 8003  | Python/FastAPI |
| grader-service       | 8004  | Python/FastAPI |
| competitor-service   | 3002  | NestJS     |
| notification-service | 3003  | NestJS     |
| web (Next.js)        | 3000  | Next.js    |

## Infrastructure
- PostgreSQL 16 + TimescaleDB → localhost:5432
- Redis 7            → localhost:6379
- Elasticsearch 8.13 → localhost:9200

## Test Data Contracts
- E2E seed user: `e2e@etsy-analyzer.test` / `TestPassword123!`
- Test listing ID: `123456789` (synthetic — grader should return 422 gracefully)
- Test shop name: `TestShop` (research service returns empty set gracefully)
- Plan limits: free=5 searches, starter=50, pro=500

## Risk Register
| Risk                              | Severity | Mitigation                         |
|-----------------------------------|----------|------------------------------------|
| Etsy token expiry mid-test        | HIGH     | Use synthetic data, mock OAuth     |
| ES index empty (no scraped data)  | MEDIUM   | Empty-state assertions in E2E      |
| Rate limit triggers during CI     | MEDIUM   | Use internal bypass header         |
| Flaky: SPA navigation timing      | LOW      | 600ms settle delay in content script |
| DB migration drift                | HIGH     | Run migrations before test suite   |

## Execution Order (dependency graph)
1. EnvManager: health-check all infra → PASS required
2. DataValidator: verify schema + seed test user
3. APITester: auth flow → get JWT for downstream tests
4. APITester: research / keyword / grader endpoints
5. UITester: auth pages (no auth required)
6. UITester: dashboard / research / grader (requires JWT from step 3)
7. Reporter: aggregate all results
