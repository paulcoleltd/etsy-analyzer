import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Competitor Intelligence', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('/competitors page loads with empty state', async ({ page }) => {
    await page.goto('/competitors')
    await expect(page.locator('h1', { hasText: 'Competitor Intelligence' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Track shop' })).toBeVisible()
  })

  test('clicking Track shop shows add form', async ({ page }) => {
    await page.goto('/competitors')
    await page.locator('button', { hasText: 'Track shop' }).click()
    await expect(page.locator('input[placeholder*="shop name"]')).toBeVisible()
  })

  test('alert feed tab is visible', async ({ page }) => {
    await page.goto('/competitors')
    await expect(page.locator('button', { hasText: 'Alert feed' })).toBeVisible()
  })

  test('switching to Alert feed tab shows feed', async ({ page }) => {
    await page.goto('/competitors')
    await page.locator('button', { hasText: 'Alert feed' }).click()
    // Either alerts or empty state
    const hasEmpty  = await page.locator('text=No alerts yet').isVisible()
    const hasAlerts = await page.locator('[class*="alert"]').count() > 0
    expect(hasEmpty || hasAlerts).toBe(true)
  })
})
