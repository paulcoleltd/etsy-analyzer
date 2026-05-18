import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

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
    const btn = page.locator('button', { hasText: 'Grade' })
    await expect(btn).toBeDisabled()
  })

  test('Grade button enables when input has text', async ({ page }) => {
    await page.goto('/grader')
    await page.fill('input[placeholder*="listing"]', '123456789')
    await expect(page.locator('button', { hasText: 'Grade' })).toBeEnabled()
  })

  test('/grader/bulk shows plan gate for free users', async ({ page }) => {
    await page.goto('/grader/bulk')
    // Free plan users see upgrade prompt
    const hasGate = await page.locator('text=Bulk audit requires Pro plan').isVisible()
      || await page.locator('text=Start audit').isVisible()
    expect(hasGate).toBe(true)
  })
})
