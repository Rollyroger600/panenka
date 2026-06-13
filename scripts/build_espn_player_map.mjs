#!/usr/bin/env node
/**
 * Fetcht alle ESPN WK-rosters, matcht spelersnamen tegen lib/data/players.ts,
 * en schrijft lib/data/espnPlayerMap.ts + scripts/espn_unmatched.txt.
 *
 * Gebruik: node scripts/build_espn_player_map.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── normName (zelfde als in de live route) ───────────────────────────────────
function normName(s) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

// Sorteert de woorden in een naam — matcht "Son Heung-Min" met "Heung Min Son"
function sortedWords(s) {
  return normName(s).replace(/-/g, ' ').split(/\s+/).sort().join(' ')
}

// ─── Parse lib/data/players.ts (als tekst, geen TS-compiler nodig) ────────────
function parsePlayers() {
  const src = readFileSync(join(ROOT, 'lib/data/players.ts'), 'utf8')
  const players = []
  for (const line of src.split('\n')) {
    const idM    = line.match(/\bid:\s*(\d+)/)
    const nameM  = line.match(/\bname:\s*"([^"]+)"/)
    const midM   = line.match(/\bmiddleName:\s*"([^"]+)"/)
    if (idM && nameM && midM) {
      players.push({ id: parseInt(idM[1]), name: nameM[1], middleName: midM[1] })
    }
  }
  return players
}

// ─── Parse lib/data/espnMatchIds.ts ──────────────────────────────────────────
function parseMatchIds() {
  const src = readFileSync(join(ROOT, 'lib/data/espnMatchIds.ts'), 'utf8')
  const ids = {}
  const re = /^\s*(\d+):\s*(\d+)/gm
  let m
  while ((m = re.exec(src)) !== null) {
    ids[parseInt(m[1])] = parseInt(m[2])
  }
  return ids
}

// ─── Fetch ESPN summary ───────────────────────────────────────────────────────
async function fetchSummary(espnId) {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnId}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Stap 1: spelers laden...')
  const players = parsePlayers()
  console.log(`  ${players.length} spelers geladen uit players.ts`)

  const matchIds = parseMatchIds()
  const matchEntries = Object.entries(matchIds)
  console.log(`  ${matchEntries.length} ESPN wedstrijd-IDs geladen`)

  // Bouw naam-lookup: normName en gesorteerde-woorden (voor Koreaanse naamsorde)
  const byNorm = new Map()
  const bySorted = new Map()
  for (const p of players) {
    const kMid   = normName(p.middleName)
    const kShort = normName(p.name)
    const kSort  = sortedWords(p.middleName)
    if (!byNorm.has(kMid))    byNorm.set(kMid, p)
    if (!byNorm.has(kShort))  byNorm.set(kShort, p)
    if (!bySorted.has(kSort)) bySorted.set(kSort, p)
  }

  // Haal ESPN rosters op
  const espnPlayers = new Map()  // ESPN displayName → { player | null, country }
  const BATCH = 6

  console.log(`\nStap 2: ESPN rosters fetchen (${matchEntries.length} wedstrijden, batch ${BATCH})...`)

  for (let i = 0; i < matchEntries.length; i += BATCH) {
    const batch = matchEntries.slice(i, i + BATCH)
    await Promise.all(batch.map(async ([, espnId]) => {
      const summary = await fetchSummary(Number(espnId))
      if (!summary?.rosters) return
      for (const roster of summary.rosters) {
        const country = roster.team?.displayName ?? ''
        for (const entry of roster.roster ?? []) {
          const name = entry.athlete?.displayName
          if (!name || espnPlayers.has(name)) continue
          const found = byNorm.get(normName(name)) ?? bySorted.get(sortedWords(name)) ?? null
          espnPlayers.set(name, { player: found, country })
        }
      }
    }))
    process.stdout.write(`  ${Math.min(i + BATCH, matchEntries.length)}/${matchEntries.length} wedstrijden verwerkt\r`)
    if (i + BATCH < matchEntries.length) {
      await new Promise(r => setTimeout(r, 150))
    }
  }
  console.log()

  // Splits gematcht / niet gematcht
  const matched = []
  const unmatched = []
  for (const [espnName, { player, country }] of espnPlayers) {
    if (player) matched.push({ espnName, player, country })
    else        unmatched.push({ espnName, country })
  }

  console.log(`\nResultaat:`)
  console.log(`  Unieke ESPN spelers:  ${espnPlayers.size}`)
  console.log(`  Gematcht:             ${matched.length}`)
  console.log(`  Niet gematcht:        ${unmatched.length}`)

  // ─── Schrijf lib/data/espnPlayerMap.ts ─────────────────────────────────────
  matched.sort((a, b) => a.player.id - b.player.id)

  const mapLines = matched.map(({ espnName, player }) => {
    // Markeer gevallen waar ESPN-naam afwijkt van middleName (ook na accent-stripping)
    const needsComment = normName(espnName) !== normName(player.middleName)
    const comment = needsComment ? `  // was: "${player.middleName}"` : ''
    return `  ${player.id}: "${espnName}",${comment}`
  })

  const mapOutput = `// Mapping: app player ID → ESPN displayName
// Gegenereerd door: node scripts/build_espn_player_map.mjs
// Handmatige aanvullingen onderaan toevoegen (zie scripts/espn_unmatched.txt)
export const ESPN_PLAYER_MAP: Record<number, string> = {
${mapLines.join('\n')}
}
`
  writeFileSync(join(ROOT, 'lib/data/espnPlayerMap.ts'), mapOutput, 'utf8')
  console.log(`\nGeschreven: lib/data/espnPlayerMap.ts (${matched.length} entries)`)

  // ─── Schrijf scripts/espn_unmatched.txt ────────────────────────────────────
  unmatched.sort((a, b) => a.country.localeCompare(b.country) || a.espnName.localeCompare(b.espnName))
  const unmatchedLines = [
    `Niet-gematchte ESPN spelers (${unmatched.length}) — handmatig toevoegen aan espnPlayerMap.ts`,
    `Land                      ESPN displayName`,
    `─────────────────────────────────────────────────────`,
    ...unmatched.map(({ espnName, country }) => `${country.padEnd(25)} ${espnName}`),
  ]
  writeFileSync(join(__dirname, 'espn_unmatched.txt'), unmatchedLines.join('\n'), 'utf8')
  console.log(`Geschreven: scripts/espn_unmatched.txt (${unmatched.length} spelers)`)

  if (unmatched.length > 0) {
    console.log('\nEerste 10 niet-gematchte spelers:')
    unmatched.slice(0, 10).forEach(({ espnName, country }) =>
      console.log(`  [${country}] ${espnName}`)
    )
  }
}

main().catch(console.error)
