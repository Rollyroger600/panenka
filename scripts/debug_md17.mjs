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
  // 1. Matchday 17 config
  const config = await redisGet('matchday:17')
  console.log('=== Matchday 17 config ===')
  console.log(JSON.stringify(config, null, 2))

  // 2. ASC rotation
  const rotation = await redisGet('matchday_rotation_asc')
  console.log('\n=== ASC rotation (pos 17) ===')
  console.log('Rotation[16] (MD17):', rotation?.[16])
  console.log('Full:', rotation)

  // 3. RA predictions (kort overzicht van MD17 wedstrijden)
  const raPreds = await redisGet('predictions:ra')
  console.log('\n=== RA predictions (wedstrijden in MD17) ===')
  // Matchday 17 wedstrijden — even ophalen
  if (raPreds) {
    for (const id of Object.keys(raPreds)) {
      const n = parseInt(id)
      if (n >= 65 && n <= 72) {
        console.log(`  Match ${id}:`, JSON.stringify(raPreds[id]))
      }
    }
  }
}

main().catch(console.error)
