// Script om WS tokens te corrigeren in Redis
// Gebruik: node scripts/fix_ws_tokens.mjs [--dry-run]

const UPSTASH_URL = 'https://key-buffalo-113422.upstash.io'
const UPSTASH_TOKEN = 'gQAAAAAAAbsOAAIgcDEzNmE1ZTkxOThlYjg0NDc0OGY1Njc4NWEzNTA1MDAyMQ'

const isDryRun = process.argv.includes('--dry-run')

async function kvGet(key) {
  const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const json = await res.json()
  if (json.result === null) return null
  return JSON.parse(json.result)
}

async function kvSet(key, value) {
  const res = await fetch(`${UPSTASH_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(value)),
  })
  return res.json()
}

// Wijzigingen zoals opgegeven:
const CHANGES = [
  // Eerste 24 wedstrijden -> 1 token
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(id => ({ id, set: 1 })),
  // 6 -> 5
  { id: 36, from: 6, set: 5 },
  { id: 39, from: 6, set: 5 },
  { id: 45, from: 6, set: 5 },
  { id: 57, from: 6, set: 5 },
  { id: 63, from: 6, set: 5 },
  // 5 -> 4
  { id: 26, from: 5, set: 4 },
  { id: 30, from: 5, set: 4 },
  { id: 32, from: 5, set: 4 },
  { id: 43, from: 5, set: 4 },
  { id: 54, from: 5, set: 4 },
  { id: 55, from: 5, set: 4 },
  { id: 59, from: 5, set: 4 },
  // 4 -> 3
  { id: 25, from: 4, set: 3 },
  { id: 53, from: 4, set: 3 },
  // 3 -> 2
  { id: 46, from: 3, set: 2 },
]

const predictions = await kvGet('predictions:ws')
if (!predictions) {
  console.error('Geen predictions gevonden voor WS!')
  process.exit(1)
}

console.log(`Predictions WS geladen: ${Object.keys(predictions).length} wedstrijden\n`)

let tokensBefore = 0
let tokensAfter = 0
const issues = []

for (const [idStr, pred] of Object.entries(predictions)) {
  if (parseInt(idStr) <= 72) tokensBefore += pred.tokens ?? 1
}

// Verwerk wijzigingen
for (const change of CHANGES) {
  const pred = predictions[change.id]
  if (!pred) {
    console.log(`  Wedstrijd ${change.id}: NIET GEVONDEN in predictions (overgeslagen)`)
    continue
  }
  const current = pred.tokens ?? 1
  if (change.from !== undefined && current !== change.from) {
    issues.push(`  ⚠️  Wedstrijd ${change.id}: verwacht ${change.from} token(s), maar heeft ${current}`)
  }
  console.log(`  Wedstrijd ${change.id}: ${current} -> ${change.set} token(s)`)
  predictions[change.id] = { ...pred, tokens: change.set }
}

for (const [idStr, pred] of Object.entries(predictions)) {
  if (parseInt(idStr) <= 72) tokensAfter += pred.tokens ?? 1
}

console.log(`\nTokens poulefase voor:  ${tokensBefore}`)
console.log(`Tokens poulefase na:    ${tokensAfter}`)

if (issues.length > 0) {
  console.log('\nWaarschuwingen:')
  issues.forEach(i => console.log(i))
}

if (isDryRun) {
  console.log('\n[DRY RUN] Geen wijzigingen opgeslagen.')
} else {
  await kvSet('predictions:ws', predictions)
  console.log('\n✓ Wijzigingen opgeslagen in Redis.')
}
