/**
 * Playwright global setup — runs once before all tests.
 *
 * 1. Waits for the web app and auth service to be healthy.
 * 2. Creates the E2E test user if it doesn't exist.
 * 3. For test addresses (@etsy-analyzer.test) bypasses email verification
 *    by directly calling the verify endpoint with a well-known test token
 *    OR by hitting the DB via a dedicated test API (auth-service dev mode).
 */
import { chromium } from '@playwright/test'

const AUTH_URL = process.env.TEST_AUTH_URL ?? 'http://localhost:3001'
const BASE_URL  = process.env.BASE_URL       ?? 'http://localhost:3000'

const TEST_USER = {
  email:    process.env.E2E_EMAIL    ?? 'e2e@etsy-analyzer.test',
  password: process.env.E2E_PASSWORD ?? 'TestPassword123!',
  name:     'E2E Test User',
}

async function waitForService(url: string, maxAttempts = 20): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error(`Service at ${url} did not become ready after ${maxAttempts} attempts`)
}

async function ensureTestUser(): Promise<void> {
  // Try signing up — 409 Conflict means user already exists, both are OK
  const signupRes = await fetch(`${AUTH_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  })

  if (signupRes.status === 409) {
    console.log(`[setup] Test user already exists: ${TEST_USER.email}`)
    return
  }

  if (!signupRes.ok) {
    const body = await signupRes.text()
    console.warn(`[setup] Signup returned ${signupRes.status}: ${body}`)
    return
  }

  console.log(`[setup] Test user created: ${TEST_USER.email}`)

  // Bypass email verification for @etsy-analyzer.test addresses.
  // In CI we call a dev-only endpoint that auto-verifies any test address.
  // If that endpoint doesn't exist, we fall back to signing in — the auth
  // service should auto-verify test addresses when NODE_ENV=test.
  if (TEST_USER.email.endsWith('@etsy-analyzer.test')) {
    try {
      const bypassRes = await fetch(`${AUTH_URL}/auth/dev/verify-test-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_USER.email }),
      })
      if (bypassRes.ok) {
        console.log('[setup] Email verification bypassed via dev endpoint')
        return
      }
    } catch {
      // dev endpoint not available — that's fine in prod
    }
  }
}

async function verifySignIn(): Promise<boolean> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
    })
    if (res.ok) {
      const data = await res.json() as { accessToken?: string }
      return !!data.accessToken
    }
    return false
  } catch {
    return false
  }
}

export default async function globalSetup() {
  console.log('\n[playwright] Global setup starting…')

  // Wait for services to be healthy
  console.log('[setup] Waiting for auth-service…')
  await waitForService(`${AUTH_URL}/health`)
  console.log('[setup] auth-service ready ✓')

  console.log('[setup] Waiting for web app…')
  await waitForService(`${BASE_URL}/api/auth/session`)
  console.log('[setup] web app ready ✓')

  // Seed test user
  await ensureTestUser()

  // Confirm sign-in works (up to 5 retries for newly created + verified users)
  for (let attempt = 1; attempt <= 5; attempt++) {
    const ok = await verifySignIn()
    if (ok) {
      console.log('[setup] Test user sign-in confirmed ✓')
      return
    }
    if (attempt < 5) {
      console.log(`[setup] Sign-in attempt ${attempt} failed — user may need verification, retrying…`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // If sign-in still fails, warn but don't fail the suite — some tests
  // don't require auth and should still run
  console.warn('[setup] ⚠️  Could not verify test user sign-in. Auth-required tests will fail.')
  console.warn('[setup] Ensure email verification is auto-bypassed for @etsy-analyzer.test in NODE_ENV=test')
}
