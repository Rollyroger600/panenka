import { MATCHES } from './data/matches'
import { POULES } from './data/knockoutRounds'

// Returns all 4 teams per group derived from match data
export const GROUP_TEAMS: Record<string, string[]> = (() => {
  const map: Record<string, Set<string>> = {}
  for (const m of MATCHES) {
    map[m.poule] ??= new Set()
    map[m.poule].add(m.home)
    map[m.poule].add(m.away)
  }
  return Object.fromEntries(
    POULES.map((p) => [p, Array.from(map[p] ?? [])]),
  )
})()

// Poule index → letter
export const POULE_LETTERS = [...POULES]

// Given current w1/w2/w3 picks, return countries unavailable for w3
// (already picked as group winner or runner-up)
export function getW3Excluded(
  w1Picks: Record<string, string | null>,
  w2Picks: Record<string, string | null>,
): Set<string> {
  const excluded = new Set<string>()
  for (const c of Object.values(w1Picks)) if (c) excluded.add(c)
  for (const c of Object.values(w2Picks)) if (c) excluded.add(c)
  return excluded
}
