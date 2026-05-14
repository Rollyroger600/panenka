import { test, expect } from '@playwright/test'
import { loginViaUI, BASE } from './helpers'

test.describe('Login flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('token in URL shows welcome card with name', async ({ page }) => {
    await page.goto(`${BASE}/?t=APM1qt41Cm`)
    await expect(page.locator('text=Rogier')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Invullen' })).toBeVisible()
  })

  test('clicking Invullen redirects to poulefase', async ({ page }) => {
    await loginViaUI(page, 'APM1qt41Cm')
    await expect(page).toHaveURL(/poulefase/)
  })

  test('invalid token shows no welcome card', async ({ page }) => {
    await page.goto(`${BASE}/?t=fakefakefake`)
    await expect(page.locator('button', { hasText: 'Invullen' })).not.toBeVisible()
  })

  test('session persists after reload', async ({ page }) => {
    await loginViaUI(page, 'APM1qt41Cm')
    await page.reload()
    await expect(page).toHaveURL(/poulefase/)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('all 15 participant tokens show correct name', async ({ page }) => {
    const participants = [
      { name: 'Michiel',  token: 'JylvPmTIji' },
      { name: 'Bob',      token: 'kHOIXn3uWo' },
      { name: 'Thom',     token: 'E3bWhhx3IS' },
      { name: 'Rogier',   token: 'APM1qt41Cm' },
      { name: 'Daan',     token: 'CFHby83vWE' },
    ]
    for (const { name, token } of participants) {
      await page.goto(`${BASE}/?t=${token}`)
      await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 })
      await page.context().clearCookies()
    }
  })

  test('correct cookie is set after login', async ({ page, context }) => {
    await loginViaUI(page, 'APM1qt41Cm')
    const cookies = await context.cookies()
    const participantCookie = cookies.find(c => c.name === 'participant')
    expect(participantCookie?.value).toBe('RH')
  })
})
