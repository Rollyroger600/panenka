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
