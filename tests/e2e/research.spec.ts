import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Research Engine', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('/research page loads with trending keywords', async ({ page }) => {
    await page.goto('/research')
    await expect(page.locator('h1', { hasText: 'Niche Research' })).toBeVisible()
    await expect(page.locator('text=Trending keywords')).toBeVisible()
  })

  test('search input triggers debounced results', async ({ page }) => {
    await page.goto('/research')
    await page.fill('input[placeholder*="silver ring"]', 'silver ring')
    // Wait for debounce + results to render (or empty state)
    await page.waitForTimeout(500)
    // Either listings or empty-state message should be visible
    const hasResults = await page.locator('[data-listing-id]').count() > 0
      || await page.locator('text=No listings found').isVisible()
    expect(hasResults).toBe(true)
  })

  test('Enter key navigates to keyword detail page', async ({ page }) => {
    await page.goto('/research')
    const input = page.locator('input[placeholder*="silver ring"]')
    await input.fill('silver ring')
    await input.press('Enter')
    await page.waitForURL('**/research/**', { timeout: 6_000 })
    await expect(page).toHaveURL(/silver\+ring|silver%20ring/)
  })

  test('/keywords page loads and shows search input', async ({ page }) => {
    await page.goto('/keywords')
    await expect(page.locator('h1', { hasText: 'Keyword Explorer' })).toBeVisible()
    await expect(page.locator('input[placeholder*="keyword"]')).toBeVisible()
  })

  test('keyword explore shows volume and competition', async ({ page }) => {
    await page.goto('/keywords')
    await page.fill('input[placeholder*="keyword"]', 'ring')
    await page.waitForTimeout(600)
    // Volume card should appear (or no-data state)
    const hasData = await page.locator('text=Est. monthly searches').isVisible()
      || await page.locator('text=No data found').isVisible()
    expect(hasData).toBe(true)
  })
})
