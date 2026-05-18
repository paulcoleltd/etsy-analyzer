import { test, expect } from '@playwright/test'
import { signUp, TEST_USER } from './helpers'

test.describe('Authentication', () => {
  test('landing page loads and shows sign-in link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Sign in')).toBeVisible()
    await expect(page.locator('text=Start free')).toBeVisible()
  })

  test('sign-up form shows validation errors for short password', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.fill('input[id="name"]',     'Test User')
    await page.fill('input[id="email"]',    'test@example.com')
    await page.fill('input[id="password"]', 'short')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=At least 8 characters')).toBeVisible()
  })

  test('sign-up flow reaches email confirmation screen', async ({ page }) => {
    const email = `e2e+${Date.now()}@etsy-analyzer.test`
    await signUp(page, email)
    await expect(page.locator('text=Check your email')).toBeVisible()
  })

  test('sign-in with bad credentials shows error', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]',    'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('forgot password form shows success message', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await page.fill('input[type="email"]', 'unknown@example.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Check your email')).toBeVisible()
  })
})
