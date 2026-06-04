import { WK_OFFICIAL_SQUADS } from './data/wkOfficialSquads'
import type { Player } from './data/players'

// Pre-built Set for O(1) lookup: "dob|country"
const WK_DOB_COUNTRY = new Set<string>(
  Object.entries(WK_OFFICIAL_SQUADS).flatMap(([country, players]) =>
    players.map((p) => `${p.dob}|${country}`)
  )
)

export type WKSquadStatus = 'confirmed' | 'not_in_squad' | 'unknown'

export function getWKSquadStatus(player: Player): WKSquadStatus {
  const squadPlayers = WK_OFFICIAL_SQUADS[player.country]
  if (!squadPlayers) return 'unknown'
  return WK_DOB_COUNTRY.has(`${player.dob}|${player.country}`) ? 'confirmed' : 'not_in_squad'
}
