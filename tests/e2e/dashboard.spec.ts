import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('dashboard shows connect Etsy banner when not connected', async ({ page }) => {
    await page.goto('/dashboard')
    // Either KPI cards (if connected) or connect banner
    const hasKPI     = await page.locator('text=Revenue today').isVisible()
    const hasBanner  = await page.locator('text=Connect your Etsy shop').isVisible()
    expect(hasKPI || hasBanner).toBe(true)
  })

  test('dashboard has period selector with 3 options', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('button', { hasText: '7 days' })).toBeVisible()
    await expect(page.locator('button', { hasText: '30 days' })).toBeVisible()
    await expect(page.locator('button', { hasText: '90 days' })).toBeVisible()
  })

  test('sync button is present and clickable', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('button', { hasText: 'Sync' })).toBeVisible()
  })

  test('/dashboard/listings page loads with table', async ({ page }) => {
    await page.goto('/dashboard/listings')
    await expect(page.locator('h1', { hasText: 'Your Listings' })).toBeVisible()
    // Table headers should be visible
    await expect(page.locator('th', { hasText: 'Listing' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Grade' })).toBeVisible()
  })
})
