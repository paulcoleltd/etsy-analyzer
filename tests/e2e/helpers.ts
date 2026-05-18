import { Page } from '@playwright/test'

export const TEST_USER = {
  email:    process.env.E2E_EMAIL    ?? 'test@etsy-analyzer.test',
  password: process.env.E2E_PASSWORD ?? 'TestPassword123!',
  name:     'E2E Test User',
}

/** Signs in via the UI and waits for redirect to /dashboard. */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/auth/signin')
  await page.fill('input[type="email"]',    TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

/** Signs up a new user (used once in the user-journey suite). */
export async function signUp(page: Page, email: string, name = 'Test User'): Promise<void> {
  await page.goto('/auth/signup')
  await page.fill('input[id="name"]',     name)
  await page.fill('input[id="email"]',    email)
  await page.fill('input[id="password"]', 'TestPassword123!')
  await page.click('button[type="submit"]')
  // Expect confirmation screen (no redirect — email verification required)
  await page.waitForSelector('text=Check your email', { timeout: 8_000 })
}
