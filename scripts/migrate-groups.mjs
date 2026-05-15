/**
 * Éénmalig migratie-script: OG Redis-sleutels hernoemen naar groepsspecifieke sleutels.
 *
 * Wat het doet:
 *   oranje_vragen          → oranje_vragen:og
 *   oranje_correct         → oranje_correct:og
 *   oranje_antwoorden:{x}  → oranje_antwoorden:og:{x}  (voor alle OG-deelnemers)
 *   scores                 → scores:og
 *
 * Originele sleutels blijven behouden (geen delete) — veilige migratie.
 *
 * Gebruik: node scripts/migrate-groups.mjs
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
})

const OG_INITIALS = ['MG', 'BH', 'TW', 'HP', 'RH', 'DM', 'BM', 'RA', 'TdL', 'WP', 'BS', 'WS', 'TvL', 'TG', 'LV']

async function copyKey(src, dst) {
  const val = await redis.get(src)
  if (val === null) {
    console.log(`  – ${src}: niet gevonden, overgeslagen`)
    return false
  }
  // Upstash redis.get geeft al geparsed object terug; opslaan als JSON string
  await redis.set(dst, JSON.stringify(val))
  console.log(`  ✓ ${src} → ${dst}`)
  return true
}

async function migrate() {
  console.log('=== Groeps-migratie starten ===\n')

  // oranje_vragen → oranje_vragen:og
  console.log('1. oranje_vragen')
  await copyKey('oranje_vragen', 'oranje_vragen:og')

  // oranje_correct → oranje_correct:og
  console.log('\n2. oranje_correct')
  await copyKey('oranje_correct', 'oranje_correct:og')

  // oranje_antwoorden:{initials} → oranje_antwoorden:og:{initials}
  console.log('\n3. oranje_antwoorden per deelnemer')
  for (const initials of OG_INITIALS) {
    const lower = initials.toLowerCase()
    await copyKey(`oranje_antwoorden:${lower}`, `oranje_antwoorden:og:${lower}`)
  }

  // scores → scores:og
  console.log('\n4. scores')
  await copyKey('scores', 'scores:og')

  console.log('\n=== Migratie klaar ===')
  console.log('Originele sleutels zijn NIET verwijderd (veilige migratie).')
}

migrate().catch((err) => {
  console.error('Migratie mislukt:', err)
  process.exit(1)
})
