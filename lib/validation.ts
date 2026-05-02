import type { Player } from './data/players'

export interface ValidationResult {
  violations: string[]
  countryMap: Record<string, string[]>
  confedMap: Record<string, string[]>
  clubMap: Record<string, string[]>
}

export function validateFantasyXV(players: (Player | null)[]): ValidationResult {
  const filled = players.filter((p): p is Player => p !== null)
  const countryMap: Record<string, string[]> = {}
  const confedMap: Record<string, string[]> = {}
  const clubMap: Record<string, string[]> = {}

  for (const p of filled) {
    countryMap[p.country] ??= []
    countryMap[p.country].push(p.name)
    confedMap[p.confederation] ??= []
    confedMap[p.confederation].push(p.name)
    clubMap[p.club] ??= []
    clubMap[p.club].push(p.name)
  }

  const violations: string[] = []

  for (const [country, names] of Object.entries(countryMap)) {
    if (names.length > 1)
      violations.push(`Max 1 per land: ${country} (${names.join(', ')})`)
  }
  for (const [conf, names] of Object.entries(confedMap)) {
    if (names.length > 3)
      violations.push(`Max 3 per confederatie: ${conf} (${names.length} spelers)`)
  }
  for (const [club, names] of Object.entries(clubMap)) {
    if (names.length > 1)
      violations.push(`Max 1 per club: ${club} (${names.join(', ')})`)
  }

  return { violations, countryMap, confedMap, clubMap }
}
