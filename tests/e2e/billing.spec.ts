import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Billing & Settings', () => {
  test('pricing page loads all 4 plans', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('text=Free')).toBeVisible()
    await expect(page.locator('text=Starter')).toBeVisible()
    await expect(page.locator('text=Pro')).toBeVisible()
    await expect(page.locator('text=Agency')).toBeVisible()
  })

  test('pricing page has billing toggle', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('button', { hasText: 'monthly' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'annual' })).toBeVisible()
  })

  test('switching to annual shows Save 20% badge', async ({ page }) => {
    await page.goto('/pricing')
    await page.locator('button', { hasText: 'annual' }).click()
    await expect(page.locator('text=Save 20%')).toBeVisible()
  })

  test('pricing FAQ section renders', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('text=Frequently asked questions')).toBeVisible()
    await expect(page.locator('text=Can I cancel anytime')).toBeVisible()
  })

  test.describe('Settings page (authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page)
    })

    test('settings page shows 4 tabs', async ({ page }) => {
      await page.goto('/settings')
      await expect(page.locator('button', { hasText: 'Profile' })).toBeVisible()
      await expect(page.locator('button', { hasText: 'Billing' })).toBeVisible()
      await expect(page.locator('button', { hasText: 'Etsy shop' })).toBeVisible()
      await expect(page.locator('button', { hasText: 'API keys' })).toBeVisible()
    })

    test('clicking Billing tab shows plan info', async ({ page }) => {
      await page.goto('/settings')
      await page.locator('button', { hasText: 'Billing' }).click()
      await expect(page.locator('text=Current plan')).toBeVisible()
    })

    test('clicking Etsy shop tab shows connect button', async ({ page }) => {
      await page.goto('/settings')
      await page.locator('button', { hasText: 'Etsy shop' }).click()
      await expect(page.locator('text=Connect Etsy shop')).toBeVisible()
    })
  })
})
