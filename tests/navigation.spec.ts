import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

test.describe('Navigation', () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, 'RH', 'Rogier')
  })

  test('all main pages load without errors', async ({ page }) => {
    const pages = ['/poulefase', '/knockout', '/oranje', '/fantasy', '/overzicht']
    for (const path of pages) {
      await page.goto(`${BASE}${path}`)
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Application error')).not.toBeVisible()
    }
  })

  test('bottom nav is visible on all pages', async ({ page }) => {
    const pages = ['/poulefase', '/knockout', '/fantasy', '/overzicht']
    for (const path of pages) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('nav')).toBeVisible()
    }
  })

  test('poulefase page renders content', async ({ page }) => {
    await page.goto(`${BASE}/poulefase`)
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Application error')).not.toBeVisible()
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(100)
  })

  test('knockout page renders round tabs', async ({ page }) => {
    await page.goto(`${BASE}/knockout`)
    await page.waitForTimeout(1500)
    await expect(page.locator('button', { hasText: 'R 32' })).toBeVisible()
  })

  test('fantasy page renders', async ({ page }) => {
    await page.goto(`${BASE}/fantasy`)
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('oranje page renders', async ({ page }) => {
    await page.goto(`${BASE}/oranje`)
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('overzicht page renders', async ({ page }) => {
    await page.goto(`${BASE}/overzicht`)
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })
})
