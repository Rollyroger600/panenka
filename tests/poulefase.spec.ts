import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

test.describe('Poulefase', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'RH', 'Rogier')
    await page.goto(`${BASE}/poulefase`)
    await page.waitForTimeout(1500)
  })

  test('page loads without application error', async ({ page }) => {
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('page contains group or match content', async ({ page }) => {
    const body = await page.locator('body').textContent()
    const hasContent = body && (
      body.includes('Poule') || body.includes('Groep') ||
      body.includes('Nederland') || body.includes('Wedstrijd') ||
      body.includes('vs') || body.includes('Stand')
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
