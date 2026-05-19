// FLAKINESS REPORT -- Existing E2E Test Suite
// ============================================================
// HIGH RISK
// 1. research.spec.ts "search returns results"
//    Reason: Network dependency; waitForSelector fires before data arrives.
//    Fix: page.route('** /v1/research/**', r => r.fulfill({ json: fixture }))
//    STATUS: Fixed via mockResearchSearch() in fixtures.ts
// 2. grader.spec.ts "listing grade loads for a valid ID"
//    Reason: SPA spinner -> grade card race.
//    Fix: await expect(page.getByRole('status')).toBeHidden() before grade card.
//    STATUS: Fixed via mockGrade() in fixtures.ts
// 3. dashboard.spec.ts "KPI cards render"
//    Reason: Empty-state uncertainty on fresh CI DB.
//    Fix: Mock analytics API in beforeEach.
//    STATUS: Fixed via mockDashboardOverview() in fixtures.ts
// 4. competitors.spec.ts "Alert feed shows notifications"
//    Reason: Relies on seeded notifications.
//    Fix: Mock notification API or POST a notification in beforeEach.
// 5. auth.spec.ts "redirects to /dashboard after sign-in"
//    Reason: NextAuth cookie timing on slow CI.
//    Fix: Replace page.url() with page.waitForURL('**/dashboard**', { timeout: 15_000 })
// 6. billing.spec.ts "Stripe checkout button is clickable"
//    Reason: Stripe.js CDN load blocks button render.
//    Fix: Use mockStripe() from fixtures.ts in beforeEach
//    STATUS: Fixed via mockStripe() in fixtures.ts
// MEDIUM RISK
// 7. research.spec.ts "Enter key navigates to keyword detail"
//    Reason: 300ms debounce + SPA navigate race.
//    Fix: page.waitForURL('**/research/**', { timeout: 8_000 })
// 8. dashboard.spec.ts "date filter updates revenue chart"
//    Reason: Date.now() timezone differences on CI.
//    Fix: page.clock.install({ time: '2025-01-15T12:00:00Z' }) (Playwright >= 1.45)
// ============================================================

import { test, expect, type Page } from '@playwright/test'
import { signIn } from './helpers'

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',   heading: 'Dashboard'            },
  { label: 'Research',    href: '/research',    heading: 'Niche Research'        },
  { label: 'Keywords',    href: '/keywords',    heading: 'Keyword Explorer'      },
  { label: 'Grader',      href: '/grader',      heading: 'Listing Grader'        },
  { label: 'Competitors', href: '/competitors', heading: 'Competitor Intelligence' },
] as const

async function settle(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
}

// -- Sidebar renders correctly -----------------------------------------------

test.describe('Sidebar navigation -- authenticated', () => {
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

// -- Clicking nav items loads correct page ------------------------------------

test.describe('Sidebar routing', () => {
  test.beforeEach(async ({ page }) => { await signIn(page) })

  for (const item of NAV_ITEMS) {
    test(`"${item.label}" -> ${item.href} with correct h1`, async ({ page }) => {
      await settle(page, '/dashboard')
      await page.locator(`a[href="${item.href}"]`).click()
      await page.waitForURL(`**${item.href}**`, { timeout: 12_000 })
      await expect(page.locator('h1')).toContainText(item.heading, { ignoreCase: true, timeout: 8_000 })
    })
  }
})

// -- Auth guards redirect unauthenticated users --------------------------------

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

// -- Public pages accessible without auth -------------------------------------

test.describe('Public pages -- no auth required', () => {
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

// -- Deep-link pre-filling ----------------------------------------------------

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

// -- Browser history ----------------------------------------------------------

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
