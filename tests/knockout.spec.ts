import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

test.describe('Knockout', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'RH', 'Rogier')
    // Navigate first so we have a page context, then set localStorage to skip onboarding
    await page.goto(`${BASE}/knockout`)
    await page.evaluate(() => localStorage.setItem('onboarding_seen', 'true'))
    await page.reload()
    await page.waitForTimeout(1500)
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('text=Application error')).not.toBeVisible()
    await expect(page.locator('text=Knockout')).toBeVisible()
  })

  test('all round tabs are visible', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'R 32' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'R 16' })).toBeVisible()
    await expect(page.locator('button', { hasText: '1/4' })).toBeVisible()
    await expect(page.locator('button', { hasText: '1/2' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Fin' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Win' })).toBeVisible()
  })

  test('can switch between tabs', async ({ page }) => {
    await page.locator('button', { hasText: 'R 16' }).first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Application error')).not.toBeVisible()

    await page.locator('button', { hasText: 'Fin' }).first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('Ronde 32 shows group winners, runners-up and best 3rd', async ({ page }) => {
    await expect(page.locator('text=Poulewinnaars')).toBeVisible()
    await expect(page.locator('text=Nummers 2')).toBeVisible()
    await expect(page.locator('text=Beste nummers 3')).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.reload()
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})
