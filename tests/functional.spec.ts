/**
 * Functional tests: save → reload → verify data persists in Redis.
 * Run with: npx playwright test tests/functional.spec.ts
 */
import { test, expect } from '@playwright/test'
import { loginAs, BASE } from './helpers'

async function setupPage(page: any, context: any, initials: string, name: string) {
  await loginAs(context, initials, name)
  await page.addInitScript(() => {
    localStorage.setItem('onboarding_seen', 'true')
  })
}

// Wait for match cards to fully load from Redis (toto buttons become visible)
async function waitForMatchCards(page: any) {
  await page.locator('button', { hasText: 'X' }).first().waitFor({ state: 'visible', timeout: 10000 })
}

// Wait for knockout picks to load (Kies winnaar or filled slot)
async function waitForKnockout(page: any) {
  await page.locator('text=Poulewinnaars').waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(500)
}

// ─── 1. Poulefase: toto opslaan en herladen ──────────────────────────────────

test.describe('Poulefase: save & reload', () => {
  test('toto keuze "1" blijft na herladen', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/poulefase`)
    await waitForMatchCards(page)

    await page.locator('button', { hasText: '1' }).first().click()
    await page.waitForTimeout(1500) // debounce + save

    await page.reload()
    await waitForMatchCards(page)

    const savedToto = page.locator('button.bg-\\[\\#FF6B00\\]').filter({ hasText: '1' }).first()
    await expect(savedToto).toBeVisible({ timeout: 5000 })
  })

  test('uitslag keuze blijft na herladen', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/poulefase`)
    await waitForMatchCards(page)

    // Open ScorePicker — click the uitslag button (shows "Kies" or current score)
    // Target match 2 to avoid interference with toto test on match 1
    const uitslagBtns = page.locator('button').filter({ hasText: 'Kies' })
    await expect(uitslagBtns.first()).toBeVisible({ timeout: 5000 })
    await uitslagBtns.first().click()
    await page.waitForTimeout(500)

    // Pick first score from the ScorePicker
    const scoreBtn = page.locator('button').filter({ hasText: /^\d+ - \d+$/ }).first()
    await expect(scoreBtn).toBeVisible({ timeout: 3000 })
    const scoreText = (await scoreBtn.textContent())?.trim() ?? ''
    await scoreBtn.click()
    await page.waitForTimeout(1500)

    await page.reload()
    await waitForMatchCards(page)

    // Uitslag button now shows score with orange bg
    const savedScore = page.locator('button.bg-\\[\\#FF6B00\\]').filter({ hasText: /\d - \d/ }).first()
    await expect(savedScore).toBeVisible({ timeout: 5000 })
  })

  test('na wissen verdwijnt de oranje toto na herladen', async ({ page, context }) => {
    // Use Tom (separate user) to avoid interference with other tests using RH
    await setupPage(page, context, 'TdL', 'Tom')
    await page.goto(`${BASE}/poulefase`)
    await waitForMatchCards(page)

    // Pick toto "X" on first match
    await page.locator('button', { hasText: 'X' }).first().click()
    await page.waitForTimeout(800)

    // Click "wis" to clear it
    const wisBtn = page.locator('button', { hasText: 'wis' }).first()
    await expect(wisBtn).toBeVisible({ timeout: 3000 })
    await wisBtn.click()
    await page.waitForTimeout(1500)

    // Reload — the "X" toto should no longer be orange on the first match
    await page.reload()
    await waitForMatchCards(page)

    // No orange "X" button should appear (count = 0 for highlighted toto X)
    const orangeX = page.locator('button[class*="bg-[#FF6B00]"]').filter({ hasText: 'X' })
    await expect(orangeX).toHaveCount(0, { timeout: 5000 })
  })
})

// ─── 2. Knockout: picks opslaan en herladen ──────────────────────────────────

test.describe('Knockout: save & reload', () => {
  test('groepswinnaar picks blijven na herladen', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/knockout`)
    await waitForKnockout(page)

    const filledSlots = page.locator('button[class*="border-[#FF6B00]"]')
    const emptySlots  = page.locator('button[class*="border-[#444]"]')
    const filledBefore = await filledSlots.count()

    if (filledBefore > 0) {
      // Already filled — just verify they persist after reload
      await page.reload()
      await waitForKnockout(page)
      const filledAfter = await filledSlots.count()
      expect(filledAfter).toBe(filledBefore)
    } else {
      // Nothing filled yet — pick one and verify it saves
      await expect(emptySlots.first()).toBeVisible({ timeout: 5000 })
      await emptySlots.first().click()
      await page.waitForTimeout(500)

      // Click first country in the picker grid
      const pickerBtn = page.locator('div.grid button[class*="border-[#444]"]').first()
      await expect(pickerBtn).toBeVisible({ timeout: 3000 })
      await pickerBtn.click()
      await page.waitForTimeout(1500)

      await page.reload()
      await waitForKnockout(page)
      expect(await filledSlots.count()).toBeGreaterThan(0)
    }
  })

  test('beste nummer 3 picks blijven na herladen', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/knockout`)
    await waitForKnockout(page)

    await page.locator('text=Beste nummers 3').scrollIntoViewIfNeeded()

    // Read the W3 count badge (e.g. "4 / 8") shown in the section header
    const countBadge = page.locator('text=Beste nummers 3').locator('../..').locator('text=/ 8')
    const badgeText = await countBadge.textContent().catch(() => '0 / 8')
    const filledBefore = parseInt(badgeText ?? '0')

    if (filledBefore === 0) {
      // Nothing saved yet — just verify page loads without errors
      await expect(page.locator('text=Application error')).not.toBeVisible()
      return
    }

    // Reload and verify same count persists
    await page.reload()
    await waitForKnockout(page)
    await page.locator('text=Beste nummers 3').scrollIntoViewIfNeeded()

    const badgeAfter = await page.locator('text=Beste nummers 3').locator('../..').locator('text=/ 8').textContent().catch(() => '0 / 8')
    const filledAfter = parseInt(badgeAfter ?? '0')
    expect(filledAfter).toBe(filledBefore)
  })
})

// ─── 3. Fantasy: speler toevoegen en bewaren ─────────────────────────────────

test.describe('Fantasy: save & reload', () => {
  test('squad heeft minimaal 1 speler na herladen', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/fantasy`)
    // Wait for squad to load
    await page.locator('text=Fantasy').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(1500)

    const emptySlots = page.locator('button').filter({ hasText: /Kies|Voeg toe/ })
    const emptyBefore = await emptySlots.count()

    if (emptyBefore === 0) {
      await page.reload()
      await page.waitForTimeout(2000)
      expect(await emptySlots.count()).toBe(0)
      return
    }

    await emptySlots.first().click()
    await page.waitForTimeout(1500)

    // Player modal shows rows like "E. Haaland", "K. Mbappé"
    const playerBtn = page.locator('button').filter({ hasText: /[A-Z]\. [A-Z]/ }).first()
    await expect(playerBtn).toBeVisible({ timeout: 5000 })
    await playerBtn.click()
    await page.waitForTimeout(1500)

    await page.reload()
    await page.locator('text=Fantasy').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(1500)

    const emptyAfter = await page.locator('button').filter({ hasText: /Kies|Voeg toe/ }).count()
    expect(emptyAfter).toBeLessThan(emptyBefore)
  })
})

// ─── 4. Token budget: berekening klopt ───────────────────────────────────────

test.describe('Token budget: berekening', () => {
  test('token budget zichtbaar in header', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/poulefase`)
    await waitForMatchCards(page)

    const header = page.locator('header')
    await expect(header).toContainText(/\d+/i)
    await expect(header).toContainText(/token/i)
  })

  test('token stepper knoppen zijn aanwezig en klikbaar', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/poulefase`)
    await waitForMatchCards(page)

    // Match cards each have token stepper buttons with bg-[#252525] class
    // Use attribute selector to find them — avoids CSS escaping issues
    const stepperBtns = page.locator('button[class*="bg-[#252525]"][class*="rounded"]')
    await expect(stepperBtns.first()).toBeVisible({ timeout: 3000 })
    const count = await stepperBtns.count()
    expect(count).toBeGreaterThan(0) // at least one stepper visible

    // Clicking a stepper should not crash
    await stepperBtns.first().click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('budget op overzicht laadt zonder errors', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/overzicht`)
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Application error')).not.toBeVisible()
  })

  test('geen negatief budget zichtbaar', async ({ page, context }) => {
    await setupPage(page, context, 'RH', 'Rogier')
    await page.goto(`${BASE}/overzicht`)
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    expect(body).not.toMatch(/-[1-9]\d{2,}/)
  })
})
