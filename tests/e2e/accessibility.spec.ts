/**
 * Accessibility checks for all major pages.
 * Asserts: alt text, labelled inputs, single h1, no empty buttons.
 */
import { test, expect, type Page } from '@playwright/test'
import { signIn } from './helpers'

async function settle(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
}

async function assertA11y(page: Page, pageName: string) {
  // 1. All images have alt text
  const noAlt = page.locator('img:not([alt])')
  const noAltCount = await noAlt.count()
  expect(noAltCount, `${pageName}: ${noAltCount} img(s) missing alt`).toBe(0)

  // 2. Exactly one h1
  const h1Count = await page.locator('h1').count()
  expect(h1Count, `${pageName}: expected 1 h1, found ${h1Count}`).toBe(1)

  // 3. Form inputs have accessible labels
  const inputs = page.locator(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
  )
  const inputCount = await inputs.count()
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i)
    const id           = await input.getAttribute('id')
    const ariaLabel    = await input.getAttribute('aria-label')
    const ariaLabelled = await input.getAttribute('aria-labelledby')
    const placeholder  = await input.getAttribute('placeholder')
    const inLabel      = await input.evaluate((el: Element) => {
      let n: Element | null = el
      while (n) { if (n.tagName.toLowerCase() === 'label') return true; n = n.parentElement }
      return false
    })
    const hasForLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false
    const labelled = Boolean(ariaLabel) || Boolean(ariaLabelled) || Boolean(placeholder) || inLabel || hasForLabel
    expect(labelled, `${pageName}: input #${i} (id="${id ?? 'none'}") has no accessible label`).toBe(true)
  }

  // 4. No buttons with empty accessible name
  const buttons = page.locator('button')
  const btnCount = await buttons.count()
  for (let i = 0; i < btnCount; i++) {
    const btn        = buttons.nth(i)
    const text       = ((await btn.textContent()) ?? '').trim()
    const ariaLabel  = ((await btn.getAttribute('aria-label')) ?? '').trim()
    const title      = ((await btn.getAttribute('title')) ?? '').trim()
    const ariaLbl    = ((await btn.getAttribute('aria-labelledby')) ?? '').trim()
    expect(
      text.length > 0 || ariaLabel.length > 0 || title.length > 0 || ariaLbl.length > 0,
      `${pageName}: button #${i} has no accessible name`,
    ).toBe(true)
  }
}

// ── /research ────────────────────────────────────────────────────────────────

test.describe('/research — accessibility', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); await settle(page, '/research') })

  test('images have alt text',            async ({ page }) => { await expect(page.locator('img:not([alt])')).toHaveCount(0) })
  test('page has exactly one h1',         async ({ page }) => { await expect(page.locator('h1')).toHaveCount(1) })
  test('inputs are labelled',             async ({ page }) => { await assertA11y(page, '/research') })
  test('no buttons with empty text',      async ({ page }) => { await assertA11y(page, '/research') })
})

// ── /grader ──────────────────────────────────────────────────────────────────

test.describe('/grader — accessibility', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); await settle(page, '/grader') })

  test('images have alt text',            async ({ page }) => { await expect(page.locator('img:not([alt])')).toHaveCount(0) })
  test('page has exactly one h1',         async ({ page }) => { await expect(page.locator('h1')).toHaveCount(1) })
  test('inputs are labelled',             async ({ page }) => { await assertA11y(page, '/grader') })
  test('no buttons with empty text',      async ({ page }) => { await assertA11y(page, '/grader') })
})

// ── /dashboard ───────────────────────────────────────────────────────────────

test.describe('/dashboard — accessibility', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); await settle(page, '/dashboard') })

  test('images have alt text',            async ({ page }) => { await expect(page.locator('img:not([alt])')).toHaveCount(0) })
  test('page has exactly one h1',         async ({ page }) => { await expect(page.locator('h1')).toHaveCount(1) })
  test('inputs are labelled',             async ({ page }) => { await assertA11y(page, '/dashboard') })
  test('no buttons with empty text',      async ({ page }) => { await assertA11y(page, '/dashboard') })
})

// ── /pricing (public) ────────────────────────────────────────────────────────

test.describe('/pricing — accessibility (public)', () => {
  test.beforeEach(async ({ page }) => { await settle(page, '/pricing') })

  test('images have alt text',            async ({ page }) => { await expect(page.locator('img:not([alt])')).toHaveCount(0) })
  test('page has exactly one h1',         async ({ page }) => { await expect(page.locator('h1')).toHaveCount(1) })
  test('no buttons with empty text',      async ({ page }) => { await assertA11y(page, '/pricing') })
})
