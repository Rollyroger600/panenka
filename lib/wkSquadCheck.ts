import { WK_OFFICIAL_SQUADS } from './data/wkOfficialSquads'
import type { Player } from './data/players'

// dob|country keys where a sofifaId is specified — only that exact player gets confirmed
const WK_DOB_COUNTRY_EXCLUSIVE = new Set<string>()
// sofifaIds that are explicitly confirmed
const WK_SOFIFA_IDS = new Set<number>()
// dob|country keys without sofifaId — fallback check
const WK_DOB_COUNTRY = new Set<string>()

Object.entries(WK_OFFICIAL_SQUADS).forEach(([country, players]) => {
  players.forEach((p) => {
    const key = `${p.dob}|${country}`
    if (p.sofifaId) {
      WK_SOFIFA_IDS.add(p.sofifaId)
      WK_DOB_COUNTRY_EXCLUSIVE.add(key)
    } else {
      WK_DOB_COUNTRY.add(key)
    }
  })
})

export type WKSquadStatus = 'confirmed' | 'not_in_squad' | 'unknown'

export function getWKSquadStatus(player: Player): WKSquadStatus {
  const squadPlayers = WK_OFFICIAL_SQUADS[player.country]
  if (!squadPlayers) return 'unknown'
  // Explicit sofifaId match → always confirmed
  if (WK_SOFIFA_IDS.has(player.id)) return 'confirmed'
  const key = `${player.dob}|${player.country}`
  // dob|country with a sofifaId set → requires sofifaId match (handled above)
  if (WK_DOB_COUNTRY_EXCLUSIVE.has(key)) return 'not_in_squad'
  // Standard dob|country fallback
  return WK_DOB_COUNTRY.has(key) ? 'confirmed' : 'not_in_squad'
}
