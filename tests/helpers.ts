import type { Page, BrowserContext } from '@playwright/test'

const BASE = 'http://localhost:3001'

// Set participant cookie directly (bypasses login UI)
export async function loginAs(context: BrowserContext, initials: string, name: string) {
  await context.addCookies([
    { name: 'participant', value: initials, domain: 'localhost', path: '/' },
    { name: 'participantName', value: name, domain: 'localhost', path: '/' },
  ])
}

// Skip onboarding modal by setting localStorage flag
export async function skipOnboarding(page: Page) {
  await page.evaluate(() => localStorage.setItem('onboarding_seen', 'true'))
}

// Login via UI (click the button)
export async function loginViaUI(page: Page, token: string) {
  await page.goto(`${BASE}/?t=${token}`)
  await page.locator('button', { hasText: 'Invullen' }).click()
  await page.waitForURL(/poulefase/, { timeout: 10000 })
}

export { BASE }
