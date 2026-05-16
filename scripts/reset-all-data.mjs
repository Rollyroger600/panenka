/**
 * Eenmalig reset-script: wist alle deelnemersdata uit Redis.
 * Gebruik: node scripts/reset-all-data.mjs
 *
 * Wat wordt gewist:
 *   predictions:{initials}              — poulefase voorspellingen
 *   knockout:{initials}                 — knockout picks
 *   fantasy:{initials}                  — fantasy squad + teamnaam
 *   oranje:{initials}                   — oranje antwoorden (oud formaat)
 *   confirmed:{initials}                — overzicht bevestiging
 *   oranje_vragen:{groupId}             — ingediende vragen per groep
 *   oranje_correct:{groupId}            — correcte antwoorden per groep
 *   oranje_antwoorden:{groupId}:{init}  — antwoorden per groep per deelnemer
 *   scores:{groupId}                    — berekende standen
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
})

const OG_INITIALS  = ['mg', 'bh', 'tw', 'hp', 'rh', 'dm', 'bm', 'ra', 'tdl', 'wp', 'bs', 'ws', 'tvl', 'tg', 'lv']
const ASC_INITIALS = ['js', 'cv', 'bv', 'ar', 'mb', 'jh', 'jk', 'ns', 'pn', 'two', 'cb', 'dk', 'ww', 'vh', 'ws', 'ra']
const ALL_INITIALS = [...new Set([...OG_INITIALS, ...ASC_INITIALS])]
const GROUPS = ['og', 'asc']
const PER_PARTICIPANT_SECTIONS = ['predictions', 'knockout', 'fantasy', 'oranje', 'confirmed']

const keys = [
  // Per deelnemer
  ...ALL_INITIALS.flatMap(init =>
    PER_PARTICIPANT_SECTIONS.map(section => `${section}:${init}`)
  ),
  // Per groep
  ...GROUPS.flatMap(g => [
    `oranje_vragen:${g}`,
    `oranje_correct:${g}`,
    `scores:${g}`,
  ]),
  // Per groep per deelnemer (oranje antwoorden)
  ...OG_INITIALS.map(init => `oranje_antwoorden:og:${init}`),
  ...ASC_INITIALS.map(init => `oranje_antwoorden:asc:${init}`),
]

console.log(`🗑  ${keys.length} keys worden gewist...\n`)

let deleted = 0
let skipped = 0

for (const key of keys) {
  const result = await redis.del(key)
  if (result > 0) {
    console.log(`  ✓ ${key}`)
    deleted++
  } else {
    skipped++
  }
}

console.log(`\n✅ Klaar — ${deleted} gewist, ${skipped} waren al leeg.`)
