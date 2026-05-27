import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })

// Set participant cookie (simulate being logged in as Rogier)
await ctx.addCookies([
  { name: 'participant', value: 'RH', domain: 'localhost', path: '/' },
  { name: 'participantName', value: 'Rogier', domain: 'localhost', path: '/' },
])

const page = await ctx.newPage()

// Suppress onboarding modal by setting localStorage key before each navigation
async function goTo(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('onboarding_seen', '1'))
  await page.waitForTimeout(1200)
}

// Screenshot 1: poulefase — header (beker) + bottom nav (6 tabs)
await goTo('http://localhost:3000/poulefase')
await page.screenshot({ path: 'scripts/shot-header.png', clip: { x: 0, y: 0, width: 390, height: 120 } })
console.log('✓ shot-header.png (header met beker icoon)')
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(200)
await page.screenshot({ path: 'scripts/shot-nav.png', clip: { x: 0, y: 744, width: 390, height: 100 } })
console.log('✓ shot-nav.png (bottom nav — 6 tabs check)')

// Screenshot 2: chat page
await goTo('http://localhost:3000/chat')
await page.screenshot({ path: 'scripts/shot-chat.png', fullPage: false })
console.log('✓ shot-chat.png (chat pagina)')

// Check key elements
const header = await page.locator('h1').filter({ hasText: 'Groepschat' }).count()
const input = await page.locator('textarea').count()
const emojiBtn = await page.locator('button[title="Emoji"]').count()
const imgBtn = await page.locator('button[title="Afbeelding sturen"]').count()
const gifBtn = await page.locator('button[title="GIF sturen"]').count()
console.log(`  Header "Groepschat": ${header > 0 ? '✓' : '✗'}`)
console.log(`  Textarea input: ${input > 0 ? '✓' : '✗'}`)
console.log(`  Emoji button: ${emojiBtn > 0 ? '✓' : '✗'}`)
console.log(`  Afbeelding button: ${imgBtn > 0 ? '✓' : '✗'}`)
console.log(`  GIF button: ${gifBtn > 0 ? '✓' : '✗'}`)

// Screenshot 3: type a message
await page.locator('textarea').fill('Test bericht ⚽🔥')
await page.screenshot({ path: 'scripts/shot-chat-input.png', fullPage: false })
console.log('✓ shot-chat-input.png (bericht ingevuld)')

await browser.close()
