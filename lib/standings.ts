import { MATCHES } from './data/matches'
import type { Prediction } from '@/store/gameStore'
import type { MatchResult } from '@/lib/scoring'

export interface StandingRow {
  country: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export function parseScore(uitslag: string): [number, number] | null {
  const parts = uitslag.split(/\s*-\s*/)
  if (parts.length !== 2) return null
  const h = parseInt(parts[0], 10)
  const a = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(a)) return null
  return [h, a]
}

export function computeStandings(
  predictions: Record<number, Prediction>,
): Record<string, StandingRow[]> {
  const groups: Record<string, Record<string, StandingRow>> = {}

  // Initialize all teams
  for (const match of MATCHES) {
    if (match.phase === 'knockout') continue
    if (!groups[match.poule]) groups[match.poule] = {}
    for (const team of [match.home, match.away]) {
      if (!groups[match.poule][team]) {
        groups[match.poule][team] = {
          country: team, played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, pts: 0,
        }
      }
    }
  }

  // Apply predictions
  for (const match of MATCHES) {
    if (match.phase === 'knockout') continue
    const pred = predictions[match.id]
    if (!pred?.uitslag) continue
    const score = parseScore(pred.uitslag)
    if (!score) continue
    const [hg, ag] = score

    const h = groups[match.poule][match.home]
    const a = groups[match.poule][match.away]

    h.played++; a.played++
    h.gf += hg; h.ga += ag; h.gd += hg - ag
    a.gf += ag; a.ga += hg; a.gd += ag - hg

    if (hg > ag) { h.won++; h.pts += 3; a.lost++ }
    else if (hg < ag) { a.won++; a.pts += 3; h.lost++ }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++ }
  }

  // Sort each group: pts → gd → gf → name
  const result: Record<string, StandingRow[]> = {}
  for (const [poule, teams] of Object.entries(groups)) {
    result[poule] = Object.values(teams).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.country.localeCompare(b.country),
    )
  }
  return result
}

export function computeStandingsFromResults(
  results: Record<number, MatchResult>,
): Record<string, StandingRow[]> {
  const groups: Record<string, Record<string, StandingRow>> = {}

  for (const match of MATCHES) {
    if (match.phase === 'knockout') continue
    if (!groups[match.poule]) groups[match.poule] = {}
    for (const team of [match.home, match.away]) {
      if (!groups[match.poule][team]) {
        groups[match.poule][team] = {
          country: team, played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, pts: 0,
        }
      }
    }
  }

  for (const match of MATCHES) {
    if (match.phase === 'knockout') continue
    const res = results[match.id]
    if (!res?.uitslag) continue
    const score = parseScore(res.uitslag)
    if (!score) continue
    const [hg, ag] = score

    const h = groups[match.poule][match.home]
    const a = groups[match.poule][match.away]

    h.played++; a.played++
    h.gf += hg; h.ga += ag; h.gd += hg - ag
    a.gf += ag; a.ga += hg; a.gd += ag - hg

    if (hg > ag) { h.won++; h.pts += 3; a.lost++ }
    else if (hg < ag) { a.won++; a.pts += 3; h.lost++ }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++ }
  }

  const result: Record<string, StandingRow[]> = {}
  for (const [poule, teams] of Object.entries(groups)) {
    result[poule] = Object.values(teams).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.country.localeCompare(b.country),
    )
  }
  return result
}
