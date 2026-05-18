/**
 * FLAKINESS REPORT — Existing E2E Test Suite
 * ============================================================
 *
 * HIGH RISK
 *
 * 1. research.spec.ts — "search returns results"
 *    Reason: Network dependency on research API. Slow/rate-limited
 *    response fires waitForSelector timeout before data arrives.
 *    Fix: page.route('**/v1/research/**', r => r.fulfill({ json: fixture }))
 *         Use expect(locator).toBeVisible({ timeout: 10_000 }) explicitly.
 *
 * 2. grader.spec.ts — "listing grade loads for a valid ID"
 *    Reason: SPA cycles through loading spinner before grade card;
 *    assertion may target detached DOM node if spinner resolves fast.
 *    Fix: await expect(page.getByRole('status')).toBeHidden() before
 *         asserting on grade card. Mock /v1/grade endpoint.
 *
 * 3. dashboard.spec.ts — "KPI cards render"
 *    Reason: Empty-state uncertainty on fresh CI DB (no listings synced).
 *    Fix: In beforeEach, intercept analytics API with fixture data so
 *         KPI cards always have values regardless of DB state.
 *
 * 4. competitors.spec.ts — "Alert feed shows notifications"
 *    Reason: Empty-state uncertainty — relies on seeded notifications.
 *    Fix: POST to notification endpoint in beforeEach or mock the response.
 *
 * 5. auth.spec.ts — "redirects to /dashboard after sign-in"
 *    Reason: NextAuth session cookie timing on slow CI boxes.
 *    Fix: Replace page.url() check with
 *         await page.waitForURL('**/dashboard**', { timeout: 15_000 }).
 *
 * 6. billing.spec.ts — "Stripe checkout button is clickable"
 *    Reason: Stripe.js loads async from external CDN — button may stay
 *    disabled/loading during test.
 *    Fix: page.route('https://js.stripe.com/**', r => r.fulfill({
 *           status: 200, body: '/* stub *\/' }))
 *
 * MEDIUM RISK
 *
 * 7. research.spec.ts — "Enter key navigates to keyword detail"
 *    Reason: 300ms debounce + SPA navigate — URL assertion may fire
 *    before React router updates.
 *    Fix: await page.waitForURL('**/research/**', { timeout: 8_000 })
 *         then assert URL pattern.
 *
 * 8. dashboard.spec.ts — "date filter updates revenue chart"
 *    Reason: Date.now() calls → timezone differences on CI runners.
 *    Fix: page.clock.install({ time: '2025-01-15T12:00:00Z' })
 *         (Playwright ≥ 1.45).
 * ============================================================
 */
import { test, expect, type Page } from '@playwright/test'
import { signIn } from './helpers'

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',   heading: 'Dashboard'   },
  { label: 'Research',    href: '/research',    heading: 'Niche Research' },
  { label: 'Keywords',    href: '/keywords',    heading: 'Keyword Explorer' },
  { label: 'Grader',      href: '/grader',      heading: 'Listing Grader' },
  { label: 'Competitors', href: '/competitors', heading: 'Competitor Intelligence' },
] as const

async function settle(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
}

// ── Sidebar renders correctly ────────────────────────────────────────────────

test.describe('Sidebar navigation — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await settle(page, '/dashboard')
  })

  test('sidebar is visible', async ({ page }) => {
    const sidebar = page.locator('aside').or(page.locator('nav')).first()
    await expect(sidebar).toBeVisible()
  })

  test('all nav links are present', async ({ page }) => {
    for (const item of NAV_ITEMS) {
      await expect(page.locator(`a[href="${item.href}"]`)).toBeVisible({ timeout: 6_000 })
    }
  })
})

// ── Clicking nav items loads correct page ────────────────────────────────────

test.describe('Sidebar routing', () => {
  test.beforeEach(async ({ page }) => { await signIn(page) })

  for (const item of NAV_ITEMS) {
    test(`"${item.label}" → ${item.href} with correct h1`, async ({ page }) => {
      await settle(page, '/dashboard')
      await page.locator(`a[href="${item.href}"]`).click()
      await page.waitForURL(`**${item.href}**`, { timeout: 12_000 })
      await expect(page.locator('h1')).toContainText(item.heading, { ignoreCase: true, timeout: 8_000 })
    })
  }
})

// ── Auth guards redirect unauthenticated users ────────────────────────────────

test.describe('Auth guards', () => {
  const protectedRoutes = ['/dashboard', '/research', '/keywords', '/grader', '/competitors', '/settings']

  for (const route of protectedRoutes) {
    test(`unauthenticated ${route} redirects to /auth/signin`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL('**/auth/signin**', { timeout: 12_000 })
      expect(page.url()).toContain('/auth/signin')
    })
  }
})

// ── Public pages accessible without auth ─────────────────────────────────────

test.describe('Public pages — no auth required', () => {
  test('pricing page accessible without auth', async ({ page }) => {
    const res = await page.goto('/pricing')
    expect(res?.status()).toBe(200)
    expect(page.url()).not.toContain('/auth/signin')
    await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  })

  test('landing page accessible without auth', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    expect(page.url()).not.toContain('/auth/signin')
  })

  test('/auth/signin renders sign-in form', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.locator('form')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

// ── Deep-link pre-filling ─────────────────────────────────────────────────────

test.describe('Deep-link behaviour', () => {
  test.beforeEach(async ({ page }) => { await signIn(page) })

  test('/grader without query param shows empty input', async ({ page }) => {
    await page.goto('/grader')
    await page.waitForLoadState('domcontentloaded')
    const input = page.locator('input[placeholder*="listing"]').first()
    await expect(input).toBeVisible({ timeout: 8_000 })
    await expect(input).toHaveValue('')
  })

  test('/research shows search input', async ({ page }) => {
    await page.goto('/research')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 8_000 })
  })
})

// ── Browser history ───────────────────────────────────────────────────────────

test.describe('Browser history', () => {
  test.beforeEach(async ({ page }) => { await signIn(page) })

  test('back button returns to previous page', async ({ page }) => {
    await settle(page, '/dashboard')
    await page.locator('a[href="/research"]').click()
    await page.waitForURL('**/research**', { timeout: 10_000 })
    await page.goBack()
    await page.waitForURL('**/dashboard**', { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard')
  })
})
