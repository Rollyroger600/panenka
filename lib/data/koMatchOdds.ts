import type { MatchOdds } from './odds'

// Quoteringen voor KO-wedstrijden (matchId 73–104)
// Worden gevuld door scripts/scrape-ko-match-odds.mjs zodra de teams bekend zijn.
export const KO_MATCH_ODDS: Record<number, MatchOdds> = {}
