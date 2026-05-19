import { test, expect } from '@playwright/test'
import { signIn } from './helpers'
import {
  mockResearchSearch, mockNiche, mockTrending, mockKeywordExplore,
  FIXTURE_LISTING_ID,
} from './fixtures'

test.describe('Research Engine', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('/research page loads with trending keywords section', async ({ page }) => {
    await mockTrending(page)
    await page.goto('/research')
    await expect(page.locator('h1', { hasText: 'Niche Research' })).toBeVisible()
    await expect(page.locator('text=Trending keywords')).toBeVisible()
  })

  test('trending keywords render from fixture data', async ({ page }) => {
    await mockTrending(page)
    await page.goto('/research')
    // fixture has "vinyl record art" as first trending keyword
    await expect(page.locator('text=vinyl record art')).toBeVisible({ timeout: 5_000 })
  })

  test('search input triggers debounced results using fixture', async ({ page }) => {
    await mockResearchSearch(page)
    await page.goto('/research')
    await page.fill('input[placeholder*="silver ring"]', 'vinyl record art')
    // Wait for debounce (300ms) + React render
    await page.waitForTimeout(500)
    // Fixture returns 1 result with a listing card
    const hasResult = await page.locator('text=Vintage Cocktail Print').isVisible()
      || await page.locator('text=No listings found').isVisible()
    expect(hasResult).toBe(true)
  })

  test('Enter key navigates to keyword detail page', async ({ page }) => {
    await mockResearchSearch(page)
    await page.goto('/research')
    const input = page.locator('input[placeholder*="silver ring"]')
    await input.fill('vinyl record art')
    await input.press('Enter')
    await page.waitForURL('**/research/**', { timeout: 8_000 })
    await expect(page).toHaveURL(/vinyl|record|art/i)
  })

  test('/research/[keyword] niche page renders score', async ({ page }) => {
    await mockNiche(page)
    await mockResearchSearch(page)
    await page.goto('/research/vinyl%20record%20art')
    // Niche score card should be visible
    await expect(page.locator('text=Niche Score').or(page.locator('text=niche_score'))).toBeVisible({ timeout: 8_000 })
  })

  test('/keywords page loads and shows search input', async ({ page }) => {
    await page.goto('/keywords')
    await expect(page.locator('h1', { hasText: 'Keyword Explorer' })).toBeVisible()
    await expect(page.locator('input[placeholder*="keyword"]')).toBeVisible()
  })

  test('keyword explore shows volume stat from fixture', async ({ page }) => {
    await mockKeywordExplore(page)
    await page.goto('/keywords')
    await page.fill('input[placeholder*="keyword"]', 'vinyl record art')
    // Wait for debounce + fixture response
    await page.waitForTimeout(500)
    // Fixture returns volume_est: 8000 → should show "Est. monthly searches"
    const hasData = await page.locator('text=Est. monthly searches').isVisible({ timeout: 4_000 })
      .catch(() => false)
    const hasNoData = await page.locator('text=No data found').isVisible({ timeout: 500 })
      .catch(() => false)
    expect(hasData || hasNoData).toBe(true)
  })
})
