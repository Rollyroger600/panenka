import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

test.describe('Fantasy XV', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'RH', 'Rogier')
    await page.goto(`${BASE}/fantasy`)
    await page.waitForTimeout(1500)
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('shows fantasy content', async ({ page }) => {
    const body = await page.locator('body').textContent()
    const hasContent = body && (
      body.includes('Fantasy') || body.includes('budget') ||
      body.includes('Budget') || body.includes('Coach') ||
      body.includes('speler') || body.includes('XV')
    )
    expect(hasContent).toBeTruthy()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.reload()
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})
