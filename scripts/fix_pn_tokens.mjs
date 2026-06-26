/**
 * Eenmalig script: corrigeer tokens van Peter (PN)
 * - Wedstrijd 58: 7 → 6 tokens
 * - Wedstrijd 61: 3 → 4 tokens
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [k, ...v] = l.split('=')
    return [k.trim(), v.join('=').trim()]
  })
)

const REDIS_URL = env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'predictions:pn'

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  const json = await res.json()
  return typeof json.result === 'string' ? JSON.parse(json.result) : json.result
}

async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  })
  const json = await res.json()
  if (json.result !== 'OK') throw new Error(`SET failed: ${JSON.stringify(json)}`)
}

async function main() {
  const predictions = await redisGet(KEY)
  if (!predictions) {
    console.error('Geen predictions gevonden voor PN')
    process.exit(1)
  }

  const m58 = predictions['58']
  const m61 = predictions['61']

  console.log('=== VOOR aanpassing ===')
  console.log('Wedstrijd 58:', JSON.stringify(m58))
  console.log('Wedstrijd 61:', JSON.stringify(m61))

  if (!m58 || m58.tokens !== 7) {
    console.warn(`⚠️  Wedstrijd 58 tokens is ${m58?.tokens}, verwacht 7`)
  }
  if (!m61 || m61.tokens !== 3) {
    console.warn(`⚠️  Wedstrijd 61 tokens is ${m61?.tokens}, verwacht 3`)
  }

  // Pas tokens aan
  predictions['58'] = { ...m58, tokens: 6 }
  predictions['61'] = { ...m61, tokens: 4 }

  console.log('\n=== NA aanpassing ===')
  console.log('Wedstrijd 58:', JSON.stringify(predictions['58']))
  console.log('Wedstrijd 61:', JSON.stringify(predictions['61']))

  await redisSet(KEY, predictions)
  console.log('\n✅ Predictions PN bijgewerkt in Redis')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
