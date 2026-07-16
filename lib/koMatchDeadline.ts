// Pure deadline-logica voor KO-wedstrijden (73-104), bruikbaar in zowel client hooks als server actions.
import type { KoMatchTeams } from '@/app/actions/admin'

export const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function isKoMatchLocked(kickoff: string | undefined, now: number = Date.now()): boolean {
  if (!kickoff) return false
  return now >= new Date(kickoff).getTime() - TWO_HOURS_MS
}

export function isKoMatchIdLocked(matchId: number, koMatchTeams: KoMatchTeams, now: number = Date.now()): boolean {
  return isKoMatchLocked(koMatchTeams[matchId]?.kickoff, now)
}
