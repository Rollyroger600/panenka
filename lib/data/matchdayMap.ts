import { MATCHES } from '@/lib/data/matches'

// Statische map: matchday ID (1-27) → array van match IDs
// MD 1-25: 4 wedstrijden elk | MD 26-27: 2 wedstrijden elk

export const MATCHDAY_MAP: Record<number, number[]> = Object.fromEntries([
  ...Array.from({ length: 25 }, (_, i) => {
    const md = i + 1
    const start = i * 4 + 1
    return [md, [start, start + 1, start + 2, start + 3]]
  }),
  [26, [101, 102]],
  [27, [103, 104]],
])

export const MATCHDAY_COUNT = 27

export function getMatchesForMatchday(matchdayId: number): number[] {
  return MATCHDAY_MAP[matchdayId] ?? []
}

// Returns the matchday that contains the given match ID (1-indexed)
export function getMatchdayForMatch(matchId: number): number {
  for (const [md, ids] of Object.entries(MATCHDAY_MAP)) {
    if (ids.includes(matchId)) return parseInt(md)
  }
  return -1
}

// Last match ID of the matchday preceding the given matchday (used for score cutoff)
export function getLastMatchBeforeMatchday(matchdayId: number): number {
  if (matchdayId <= 1) return 0
  const prevIds = MATCHDAY_MAP[matchdayId - 1] ?? []
  return prevIds[prevIds.length - 1] ?? 0
}

const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
}

// Bepaalt de huidige matchday op basis van het tijdstip.
// Een matchday is "afgelopen" 120 min na de laatste aftrap (90 min + 30 min marge).
export function getCurrentMatchday(): number {
  const now = Date.now()

  for (let md = 1; md <= MATCHDAY_COUNT; md++) {
    const matchIds = MATCHDAY_MAP[md]
    if (!matchIds) continue

    let latestKickoff = 0
    for (const id of matchIds) {
      const m = MATCHES.find((x) => x.id === id)
      if (!m?.time) continue
      const [day, mon] = m.date.split(' ')
      const mi = MONTH_IDX[mon]
      if (mi === undefined) continue
      const [h, min] = m.time.split(':').map(Number)
      const t = new Date(2026, mi, parseInt(day), h, min).getTime()
      if (t > latestKickoff) latestKickoff = t
    }

    if (latestKickoff === 0) return md
    const endTime = latestKickoff + 120 * 60_000
    if (now < endTime) return md
  }

  return MATCHDAY_COUNT
}
