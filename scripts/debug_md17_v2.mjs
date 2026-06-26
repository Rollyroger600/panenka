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

async function main() {
  // BV's predictions for MD17 matches (65-68)
  const bvPreds = await redisGet('predictions:bv')
  console.log('=== BV predictions (MD17 wedstrijden 65-68) ===')
  for (const id of [65, 66, 67, 68]) {
    console.log(`  Match ${id}:`, bvPreds?.[id] ? JSON.stringify(bvPreds[id]) : 'GEEN')
  }

  // RA's predictions for MD17 matches (65-68)
  const raPreds = await redisGet('predictions:ra')
  console.log('\n=== RA predictions (MD17 wedstrijden 65-68) ===')
  for (const id of [65, 66, 67, 68]) {
    console.log(`  Match ${id}:`, raPreds?.[id] ? JSON.stringify(raPreds[id]) : 'GEEN')
  }
}

main().catch(console.error)
