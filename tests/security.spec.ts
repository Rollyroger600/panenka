import { test, expect } from '@playwright/test'
import { loginAs, loginViaUI, BASE } from './helpers'

test.describe('Security: unauthenticated access', () => {
  test('/poulefase redirects to / without cookie', async ({ page }) => {
    await page.goto(`${BASE}/poulefase`)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('/knockout redirects to / without cookie', async ({ page }) => {
    await page.goto(`${BASE}/knockout`)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('/oranje redirects to / without cookie', async ({ page }) => {
    await page.goto(`${BASE}/oranje`)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('/fantasy redirects to / without cookie', async ({ page }) => {
    await page.goto(`${BASE}/fantasy`)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('/overzicht redirects to / without cookie', async ({ page }) => {
    await page.goto(`${BASE}/overzicht`)
    await expect(page).toHaveURL(`${BASE}/`)
  })
})

test.describe('Security: invalid token', () => {
  test('fake token shows no login button', async ({ page }) => {
    await page.goto(`${BASE}/?t=fakefakefakefake`)
    await expect(page.locator('button', { hasText: 'Invullen' })).not.toBeVisible()
  })

  test('empty token shows no login button', async ({ page }) => {
    await page.goto(`${BASE}/?t=`)
    await expect(page.locator('button', { hasText: 'Invullen' })).not.toBeVisible()
  })
})

test.describe('Security: admin access', () => {
  test('/admin without admin cookie shows login form', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    // Should show AdminLogin, not data tables
    const tables = page.locator('table')
    await expect(tables).toHaveCount(0)
  })

  test('/admin with participant cookie (non-admin) still shows login', async ({ page, context }) => {
    await loginAs(context, 'RH', 'Rogier')
    await page.goto(`${BASE}/admin`)
    // No admin data visible
    const tables = page.locator('table')
    await expect(tables).toHaveCount(0)
  })
})

test.describe('Security: API routes', () => {
  test('/api/export without auth returns 401 or 403', async ({ request }) => {
    const response = await request.get(`${BASE}/api/export`)
    expect([401, 403, 405]).toContain(response.status())
  })
})

test.describe('Security: correct cookie per token', () => {
  test('Rogier token sets RH cookie', async ({ page, context }) => {
    await loginViaUI(page, 'APM1qt41Cm')
    const cookies = await context.cookies()
    expect(cookies.find(c => c.name === 'participant')?.value).toBe('RH')
  })

  test('Bob token sets BH cookie', async ({ page, context }) => {
    await loginViaUI(page, 'kHOIXn3uWo')
    const cookies = await context.cookies()
    expect(cookies.find(c => c.name === 'participant')?.value).toBe('BH')
  })
})
