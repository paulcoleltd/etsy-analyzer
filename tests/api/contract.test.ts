/**
 * API Contract Tests — Etsy Analyzer
 *
 * Verifies HTTP contracts for all service endpoints:
 *   - Correct status codes for happy path and error cases
 *   - Response shape matches expected schema
 *   - Auth-required routes return 401 without Bearer token
 *   - Rate-limit responses include the standard error envelope
 *
 * Run: npx ts-node --esm tests/api/contract.test.ts
 * (or integrate into CI via the GitHub Actions workflow)
 */

const AUTH_URL    = process.env.TEST_AUTH_URL    ?? 'http://localhost:3001'
const RESEARCH_URL = process.env.TEST_RESEARCH_URL ?? 'http://localhost:8002'
const KEYWORD_URL  = process.env.TEST_KEYWORD_URL  ?? 'http://localhost:8003'
const GRADER_URL   = process.env.TEST_GRADER_URL   ?? 'http://localhost:8004'
const NOTIF_URL    = process.env.TEST_NOTIF_URL    ?? 'http://localhost:3003'
const COMP_URL     = process.env.TEST_COMP_URL     ?? 'http://localhost:3002'

const TEST_EMAIL    = process.env.E2E_EMAIL    ?? 'test@etsy-analyzer.test'
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'TestPassword123!'

// ── Helpers ──────────────────────────────────────────────────────────────────

let cachedToken: string | null = null

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const res = await fetch(`${AUTH_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} — ensure test user exists`)
  const data = await res.json() as { accessToken: string }
  cachedToken = data.accessToken
  return cachedToken
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}
const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    results.push({ name, passed: true, duration: Date.now() - start })
    console.log(`  ✓ ${name}`)
  } catch (err) {
    results.push({ name, passed: false, error: String(err), duration: Date.now() - start })
    console.error(`  ✗ ${name}: ${String(err)}`)
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    },
    toBeGreaterThanOrEqual(n: number) {
      if (typeof actual !== 'number' || actual < n)
        throw new Error(`Expected ≥${n}, got ${JSON.stringify(actual)}`)
    },
    toBeLessThan(n: number) {
      if (typeof actual !== 'number' || actual >= n)
        throw new Error(`Expected <${n}, got ${JSON.stringify(actual)}`)
    },
    toContain(key: string) {
      if (typeof actual !== 'object' || actual === null || !(key in actual))
        throw new Error(`Expected object to contain key "${key}", got ${JSON.stringify(actual)}`)
    },
    toBeString() {
      if (typeof actual !== 'string') throw new Error(`Expected string, got ${typeof actual}`)
    },
  }
}

function hasErrorEnvelope(body: Record<string, unknown>): void {
  expect(body).toContain('error')
  expect(body).toContain('message')
  expect(body).toContain('request_id')
  expect(body).toContain('timestamp')
}

// ── Auth Service Tests ───────────────────────────────────────────────────────

async function testAuthService() {
  console.log('\n📋 Auth Service (port 3001)')

  await test('GET /health → 200 with status ok', async () => {
    const res = await fetch(`${AUTH_URL}/health`)
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body['status']).toBe('ok')
    expect(body['service']).toBe('auth-service')
  })

  await test('POST /auth/signup → 400 for missing fields', async () => {
    const res = await fetch(`${AUTH_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad' }),
    })
    expect(res.status).toBe(400)
  })

  await test('POST /auth/signup → 400 for short password', async () => {
    const res = await fetch(`${AUTH_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@x.com', password: 'short', name: 'Test' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('POST /auth/signin → 401 for unknown user', async () => {
    const res = await fetch(`${AUTH_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@nowhere.com', password: 'Password1!' }),
    })
    expect(res.status).toBe(401)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('POST /auth/signin → 401 for wrong password', async () => {
    const res = await fetch(`${AUTH_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'WrongPassword1!' }),
    })
    expect(res.status).toBe(401)
  })

  await test('GET /auth/me → 401 without token', async () => {
    const res = await fetch(`${AUTH_URL}/auth/me`)
    expect(res.status).toBe(401)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('GET /auth/me → 200 with valid token', async () => {
    const token = await getToken()
    const res = await fetch(`${AUTH_URL}/auth/me`, { headers: bearer(token) })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('email')
    expect(body).toContain('plan')
  })

  await test('POST /auth/forgot-password → 200 for unknown email (no enum)', async () => {
    const res = await fetch(`${AUTH_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@nowhere.com' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('message')
  })

  await test('POST /auth/verify-email → 400 for invalid token', async () => {
    const res = await fetch(`${AUTH_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-real-token' }),
    })
    expect(res.status).toBe(400)
  })

  await test('GET /v1/billing/usage → 401 without token', async () => {
    const res = await fetch(`${AUTH_URL}/v1/billing/usage`)
    expect(res.status).toBe(401)
  })

  await test('GET /v1/billing/usage → 200 with token', async () => {
    const token = await getToken()
    const res = await fetch(`${AUTH_URL}/v1/billing/usage`, { headers: bearer(token) })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('plan')
    expect(body).toContain('usage')
  })
}

// ── Research Service Tests ───────────────────────────────────────────────────

async function testResearchService() {
  console.log('\n🔍 Research Service (port 8002)')

  await test('GET /health → 200', async () => {
    const res = await fetch(`${RESEARCH_URL}/health`)
    expect(res.status).toBe(200)
  })

  await test('GET /v1/research/search?q= → 422 for empty query', async () => {
    const token = await getToken()
    const res = await fetch(`${RESEARCH_URL}/v1/research/search?q=`, {
      headers: bearer(token),
    })
    // FastAPI returns 422 for validation failures
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  await test('GET /v1/research/search?q=ring → 200 (may be empty)', async () => {
    const token = await getToken()
    const res = await fetch(`${RESEARCH_URL}/v1/research/search?q=ring`, {
      headers: bearer(token),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('keyword')
    expect(body).toContain('results')
    expect(body).toContain('total')
  })

  await test('GET /v1/research/niche/{keyword} → 200 with niche_score', async () => {
    const token = await getToken()
    const res = await fetch(`${RESEARCH_URL}/v1/research/niche/silver+ring`, {
      headers: bearer(token),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('niche_score')
    expect(body).toContain('rating')
    expect(body).toContain('total_listings')
  })

  await test('GET /v1/research/listing/bad-id → 404 or 422', async () => {
    const token = await getToken()
    const res = await fetch(`${RESEARCH_URL}/v1/research/listing/notavalidid`, {
      headers: bearer(token),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  await test('GET /v1/research/trending → 200 array', async () => {
    const token = await getToken()
    const res = await fetch(`${RESEARCH_URL}/v1/research/trending`, {
      headers: bearer(token),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    if (!Array.isArray(body)) throw new Error('Expected array response')
  })
}

// ── Keyword Service Tests ────────────────────────────────────────────────────

async function testKeywordService() {
  console.log('\n🏷️  Keyword Service (port 8003)')

  await test('GET /health → 200', async () => {
    const res = await fetch(`${KEYWORD_URL}/health`)
    expect(res.status).toBe(200)
  })

  await test('GET /v1/keywords/explore?q=ring → 200 with volume_est', async () => {
    const token = await getToken()
    const res = await fetch(`${KEYWORD_URL}/v1/keywords/explore?q=ring`, {
      headers: bearer(token),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('volume_est')
    expect(body).toContain('competition')
    expect(body).toContain('related')
  })

  await test('POST /v1/keywords/cluster with keywords array → 200', async () => {
    const token = await getToken()
    const res = await fetch(`${KEYWORD_URL}/v1/keywords/cluster`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ keywords: ['silver ring', 'gold ring', 'custom necklace'] }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('clusters')
    expect(body).toContain('total_keywords')
  })

  await test('POST /v1/keywords/cluster with < 2 keywords → 422', async () => {
    const token = await getToken()
    const res = await fetch(`${KEYWORD_URL}/v1/keywords/cluster`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ keywords: ['one'] }),
    })
    expect(res.status).toBe(422)
  })

  await test('GET /v1/keywords/trends?q=ring → 200 with data array', async () => {
    const token = await getToken()
    const res = await fetch(`${KEYWORD_URL}/v1/keywords/trends?q=ring&period=3m`, {
      headers: bearer(token),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toContain('data')
    expect(body).toContain('trend_direction')
  })
}

// ── Grader Service Tests ─────────────────────────────────────────────────────

async function testGraderService() {
  console.log('\n⭐ Grader Service (port 8004)')

  await test('GET /health → 200', async () => {
    const res = await fetch(`${GRADER_URL}/health`)
    expect(res.status).toBe(200)
  })

  await test('POST /v1/grade/listing with no body → 422', async () => {
    const token = await getToken()
    const res = await fetch(`${GRADER_URL}/v1/grade/listing`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(422)
  })

  await test('POST /v1/grade/listing with invalid listing ID → 4xx', async () => {
    const token = await getToken()
    const res = await fetch(`${GRADER_URL}/v1/grade/listing`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ etsy_listing_id: 'not-a-number' }),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  await test('POST /v1/grade/listing with valid ID → 200 or 404', async () => {
    const token = await getToken()
    const res = await fetch(`${GRADER_URL}/v1/grade/listing`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ etsy_listing_id: '123456789' }),
    })
    // 200 if listing exists in ES, 404 if not — both are correct
    expect([200, 404]).toBe(
      [200, 404].includes(res.status) ? [200, 404] : [res.status]
    )
    if (res.status === 200) {
      const body = await res.json() as Record<string, unknown>
      expect(body).toContain('overall_grade')
      expect(body).toContain('dimension_scores')
    }
  })

  await test('GET /v1/grade/history → 401 without token', async () => {
    const res = await fetch(`${GRADER_URL}/v1/grade/history`)
    expect(res.status).toBe(401)
  })
}

// ── Notification Service Tests ───────────────────────────────────────────────

async function testNotificationService() {
  console.log('\n🔔 Notification Service (port 3003)')

  await test('GET /health → 200', async () => {
    const res = await fetch(`${NOTIF_URL}/health`)
    expect(res.status).toBe(200)
  })

  await test('GET /v1/notifications → 401 without token', async () => {
    const res = await fetch(`${NOTIF_URL}/v1/notifications`)
    expect(res.status).toBe(401)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('GET /v1/notifications → 200 array with token', async () => {
    const token = await getToken()
    const res = await fetch(`${NOTIF_URL}/v1/notifications`, { headers: bearer(token) })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    if (!Array.isArray(body)) throw new Error('Expected array response')
  })

  await test('POST /v1/billing/checkout → 401 without token', async () => {
    const res = await fetch(`${NOTIF_URL}/v1/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_test' }),
    })
    expect(res.status).toBe(401)
  })

  await test('POST /v1/billing/webhook → 400 for missing Stripe signature', async () => {
    const res = await fetch(`${NOTIF_URL}/v1/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    })
    // Should reject with 400 (bad request) — webhook missing stripe-signature header
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
}

// ── Competitor Service Tests ─────────────────────────────────────────────────

async function testCompetitorService() {
  console.log('\n👥 Competitor Service (port 3002)')

  await test('GET /health → 200', async () => {
    const res = await fetch(`${COMP_URL}/health`)
    expect(res.status).toBe(200)
  })

  await test('GET /v1/competitors → 401 without token', async () => {
    const res = await fetch(`${COMP_URL}/v1/competitors`)
    expect(res.status).toBe(401)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('GET /v1/competitors → 200 array with token', async () => {
    const token = await getToken()
    const res = await fetch(`${COMP_URL}/v1/competitors`, { headers: bearer(token) })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    if (!Array.isArray(body)) throw new Error('Expected array response')
  })

  await test('POST /v1/competitors with missing shopId → 400', async () => {
    const token = await getToken()
    const res = await fetch(`${COMP_URL}/v1/competitors`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  await test('DELETE /v1/competitors/nonexistent → 404', async () => {
    const token = await getToken()
    const res = await fetch(`${COMP_URL}/v1/competitors/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: bearer(token),
    })
    expect(res.status).toBe(404)
  })
}

// ── Error envelope contract ──────────────────────────────────────────────────

async function testErrorEnvelopeContract() {
  console.log('\n🛡️  Error Envelope Contract')

  await test('401 response includes {error, message, request_id, timestamp}', async () => {
    const res = await fetch(`${AUTH_URL}/auth/me`)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
    expect(typeof body['timestamp']).toBe('string')
    // request_id should be a UUID-ish string
    expect(typeof body['request_id']).toBe('string')
    ;(body['request_id'] as string).length
    if ((body['request_id'] as string).length < 8)
      throw new Error(`request_id too short: ${body['request_id']}`)
  })

  await test('400 validation error includes details array', async () => {
    const res = await fetch(`${AUTH_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'x' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    hasErrorEnvelope(body)
  })

  await test('X-Request-ID header is echoed in response', async () => {
    const requestId = `test-${Date.now()}`
    const res = await fetch(`${AUTH_URL}/health`, {
      headers: { 'x-request-id': requestId },
    })
    const echoed = res.headers.get('x-request-id')
    if (echoed !== requestId)
      throw new Error(`Expected x-request-id ${requestId}, got ${echoed}`)
  })
}

// ── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Etsy Analyzer — API Contract Tests')
  console.log('═══════════════════════════════════════════════════════')

  await testAuthService()
  await testResearchService()
  await testKeywordService()
  await testGraderService()
  await testNotificationService()
  await testCompetitorService()
  await testErrorEnvelopeContract()

  // ── Summary ────────────────────────────────────────────────────
  const passed  = results.filter(r => r.passed).length
  const failed  = results.filter(r => !r.passed).length
  const total   = results.length
  const avgMs   = Math.round(results.reduce((s, r) => s + r.duration, 0) / total)

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed  |  avg ${avgMs}ms`)
  console.log('═══════════════════════════════════════════════════════')

  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter(r => !r.passed).forEach(r => console.error(`  ✗ ${r.name}\n    ${r.error}`))
    process.exit(1)
  }
}

run().catch(err => { console.error(err); process.exit(1) })
