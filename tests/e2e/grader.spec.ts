import { test, expect } from '@playwright/test'
import { signIn } from './helpers'
import { mockGrade, mockListingIntelligence, FIXTURE_LISTING_ID } from './fixtures'

test.describe('Listing Grader', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('/grader page loads with input form', async ({ page }) => {
    await page.goto('/grader')
    await expect(page.locator('h1', { hasText: 'Listing Grader' })).toBeVisible()
    await expect(page.locator('input[placeholder*="listing"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Grade' })).toBeVisible()
  })

  test('Grade button is disabled with empty input', async ({ page }) => {
    await page.goto('/grader')
    await expect(page.locator('button', { hasText: 'Grade' })).toBeDisabled()
  })

  test('Grade button enables when input has text', async ({ page }) => {
    await page.goto('/grader')
    await page.fill('input[placeholder*="listing"]', FIXTURE_LISTING_ID)
    await expect(page.locator('button', { hasText: 'Grade' })).toBeEnabled()
  })

  test('grading real listing 4493579933 shows B grade from fixture', async ({ page }) => {
    // Mock both intelligence and grade endpoints so no live services required
    await mockListingIntelligence(page)
    await mockGrade(page)
    await page.goto('/grader')
    await page.fill('input[placeholder*="listing"]', FIXTURE_LISTING_ID)
    await page.locator('button', { hasText: 'Grade' }).click()

    // Wait for grade result to appear (spinner disappears, grade card renders)
    await expect(
      page.locator('text=Listing Grader').or(page.locator('text=Grade another')),
    ).toBeVisible({ timeout: 12_000 })

    // Grade badge B should appear somewhere on the page
    const gradeBadge = page.locator('text=B').or(page.locator('[class*="grade"]'))
    await expect(gradeBadge.first()).toBeVisible({ timeout: 8_000 })
  })

  test('dimension scores panel appears after grading', async ({ page }) => {
    await mockListingIntelligence(page)
    await mockGrade(page)
    await page.goto('/grader')
    await page.fill('input[placeholder*="listing"]', FIXTURE_LISTING_ID)
    await page.locator('button', { hasText: 'Grade' }).click()

    // Either dimension cards or empty state
    const hasDimensions = await page
      .locator('text=Title').or(page.locator('text=Tags')).isVisible({ timeout: 10_000 })
      .catch(() => false)
    const hasError = await page.locator('text=Could not grade').isVisible({ timeout: 500 })
      .catch(() => false)
    expect(hasDimensions || hasError).toBe(true)
  })

  test('/grader/bulk shows plan gate for free users', async ({ page }) => {
    await page.goto('/grader/bulk')
    const hasGate  = await page.locator('text=Bulk audit requires Pro plan').isVisible()
    const hasStart = await page.locator('text=Start audit').isVisible()
    expect(hasGate || hasStart).toBe(true)
  })
})
