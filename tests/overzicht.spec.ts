import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

test.describe('Overzicht', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'RH', 'Rogier')
    await page.goto(`${BASE}/overzicht`)
    await page.waitForTimeout(1500)
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('shows summary content', async ({ page }) => {
    const body = await page.locator('body').textContent()
    const hasContent = body && (
      body.includes('Overzicht') || body.includes('Poulefase') ||
      body.includes('Knockout') || body.includes('Fantasy') ||
      body.includes('Rogier')
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

test.describe('Oranje', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'RH', 'Rogier')
    await page.goto(`${BASE}/oranje`)
    await page.waitForTimeout(1500)
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('shows oranje content', async ({ page }) => {
    const body = await page.locator('body').textContent()
    const hasContent = body && (
      body.includes('Oranje') || body.includes('Nederland') ||
      body.includes('WK') || body.includes('vraag') || body.includes('Vraag')
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
