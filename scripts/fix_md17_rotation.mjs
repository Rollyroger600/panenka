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
  const rotation = await redisGet('matchday_rotation_asc')

  console.log('=== VOOR ===')
  console.log('MD17 (pos 16):', rotation[16])

  // Verwissel: BV (pos 16 = MD17) → RA
  rotation[16] = 'RA'

  console.log('\n=== NA ===')
  console.log('MD17 (pos 16):', rotation[16])
  console.log('Volledige rotation:', rotation)

  await redisSet('matchday_rotation_asc', rotation)
  console.log('\n✅ ASC rotation bijgewerkt: MD17 = RA')
}

main().catch(console.error)
