/**
 * Verwijdert alle testdata die door seed-live-test.mjs is aangemaakt.
 * Draai dit na de live-test van vanavond.
 *
 * Gebruik:
 *   node scripts/cleanup-live-test.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

function readEnvLocal() {
  const env = {}
  try {
    const lines = readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
    }
  } catch { /* .env.local niet gevonden */ }
  return env
}

const env = readEnvLocal()
const BASE  = env.UPSTASH_REDIS_REST_URL  || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

if (!BASE || !TOKEN) {
  console.error('UPSTASH_REDIS_REST_URL en/of TOKEN niet gevonden.')
  process.exit(1)
}

async function pipeline(commands) {
  const res = await fetch(`${BASE}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Upstash fout: ${res.status} ${await res.text()}`)
  return res.json()
}

// Alle keys die door seed-live-test.mjs zijn aangemaakt
const KEYS = [
  'matchday:1',
  // Voorspellingen OG
  'predictions:mg', 'predictions:bh', 'predictions:tw', 'predictions:hp',
  'predictions:rh', 'predictions:dm', 'predictions:bm', 'predictions:ra',
  'predictions:tdl','predictions:wp', 'predictions:bs', 'predictions:ws',
  'predictions:tvl','predictions:tg', 'predictions:lv',
  // Fantasy squads
  'fantasy:mg', 'fantasy:tw', 'fantasy:rh', 'fantasy:ra',
  'fantasy:bs', 'fantasy:dm', 'fantasy:tg',
  // ESPN live cache (vervalt vanzelf na 30s, maar voor de zekerheid)
  'live:espn:1',
]

const commands = KEYS.map((k) => ['DEL', k])

console.log(`Verwijderen van ${commands.length} keys uit Redis...`)
const results = await pipeline(commands)

let ok = 0
results.forEach((r, i) => {
  if (r.error) console.error(`  ✗ ${KEYS[i]}: ${r.error}`)
  else { console.log(`  ✓ ${KEYS[i]}`); ok++ }
})

console.log(`\nKlaar — ${ok}/${commands.length} keys verwijderd.`)
console.log('De deelnemers zien nu weer hun eigen data (ongewijzigd).')
