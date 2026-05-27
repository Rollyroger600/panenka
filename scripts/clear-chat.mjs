/**
 * Verwijdert alle berichten uit de groepschat (chat:messages key).
 * Gebruik vóór de eerste echte lancering om testberichten op te ruimen.
 *
 * Gebruik:
 *   node scripts/clear-chat.mjs
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

const countRes = await redisCmd('ZCARD', 'chat:messages')
const count = countRes.result ?? 0
console.log(`Huidige chatberichten: ${count}`)

if (count === 0) {
  console.log('Niets te verwijderen.')
} else {
  await redisCmd('DEL', 'chat:messages')
  console.log(`✓ ${count} bericht(en) verwijderd uit chat:messages`)
}
