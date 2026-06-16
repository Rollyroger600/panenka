'use server'
import { kvGet } from '@/lib/kv/kv'
import { loadMatchdayConfig, computeMatchdayScores } from '@/lib/matchday'
import type { MatchdayScoreRow } from '@/lib/matchday'
import { MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import type { GroupId } from '@/lib/groups'
import type { MatchResult, FantasyStats } from '@/lib/scoring'
import type { PotPoint } from '@/lib/types/matchday'

export interface MatchdayHistoryPoint {
  matchdayId: number
  rows: MatchdayScoreRow[]
}

const ALL_MATCHDAYS = Array.from({ length: MATCHDAY_COUNT }, (_, i) => i + 1)

// Pot stand per matchday (admin-ingevuld veld), voor de /stand pot-grafiek
export async function loadPotHistoryForGroup(group: GroupId): Promise<PotPoint[]> {
  const configs = await Promise.all(ALL_MATCHDAYS.map((md) => loadMatchdayConfig(md)))
  const history: PotPoint[] = []
  configs.forEach((cfg, i) => {
    if (!cfg) return
    history.push({ matchdayId: i + 1, potStand: group === 'og' ? cfg.og.potStand : cfg.asc.potStand })
  })
  return history
}

// Score per deelnemer per matchday (alle metrics tegelijk), voor de /stand ranglijst-grafiek
export async function loadScoreHistoryForGroup(group: GroupId): Promise<MatchdayHistoryPoint[]> {
  const [results, koResults, fantasyStats, configs] = await Promise.all([
    kvGet<Record<number, MatchResult>>('results'),
    kvGet<Record<string, string[]>>('ko_results'),
    kvGet<FantasyStats>('fantasy_stats'),
    Promise.all(ALL_MATCHDAYS.map((md) => loadMatchdayConfig(md))),
  ])

  const safeResults = results ?? {}
  const safeKoResults = koResults ?? {}
  const safeFstats = fantasyStats ?? {}

  const existingMds = configs
    .map((cfg, i) => (cfg ? i + 1 : null))
    .filter((md): md is number => md !== null)

  // Score aan het EINDE van matchday md = computeMatchdayScores met cutoff na laatste wedstrijd van md
  const rowsPerMd = await Promise.all(
    existingMds.map((md) => computeMatchdayScores(md + 1, group, safeResults, safeKoResults, safeFstats))
  )

  return existingMds.map((md, i) => ({ matchdayId: md, rows: rowsPerMd[i] }))
}
