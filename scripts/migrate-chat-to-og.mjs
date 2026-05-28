/**
 * Migreert bestaande chatberichten van de oude gedeelde key (chat:messages)
 * naar de OG-groepskey (chat:messages:og).
 *
 * Eénmalig draaien vóór de eerste lancering van de gesplitste chat:
 *   node scripts/migrate-chat-to-og.mjs
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

async function redisCmd(...args) {
  const res = await fetch(`${BASE}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`Upstash fout: ${res.status} ${await res.text()}`)
  return res.json()
}

const SOURCE = 'chat:messages'
const TARGET = 'chat:messages:og'

// Controleer hoeveel berichten er in de oude key zitten
const sourceCount = (await redisCmd('ZCARD', SOURCE)).result ?? 0
console.log(`Berichten in '${SOURCE}': ${sourceCount}`)

if (sourceCount === 0) {
  console.log('Geen berichten om te migreren.')
  process.exit(0)
}

// Controleer of de doelkey al bestaat
const targetCount = (await redisCmd('ZCARD', TARGET)).result ?? 0
if (targetCount > 0) {
  console.log(`Waarschuwing: '${TARGET}' bevat al ${targetCount} bericht(en).`)
  console.log('Migratie wordt overgeslagen om dubbele berichten te voorkomen.')
  console.log('Verwijder eerst de doelkey als je opnieuw wilt migreren.')
  process.exit(0)
}

// Gebruik ZUNIONSTORE om alle leden inclusief scores naar de nieuwe key te kopiëren
const result = await redisCmd('ZUNIONSTORE', TARGET, 1, SOURCE)
const migrated = result.result ?? 0
console.log(`✓ ${migrated} bericht(en) gemigreerd van '${SOURCE}' naar '${TARGET}'`)
console.log('')
console.log('De oude key \'chat:messages\' is bewaard. Verwijder hem handmatig als alles werkt:')
console.log('  node -e "..." of via Upstash console: DEL chat:messages')
