import type { Player } from './data/players'
import { TEAM_QUOTES } from './data/teamQuotes'
import { KO_QUOTES } from './data/knockoutQuotes'
import { KO_TRENDS } from './data/knockoutQuotes_trends'
import type { OddsTrend } from './data/knockoutQuotes_trends'

export function computePlayerQuote(player: Player): number {
  const tq = TEAM_QUOTES[player.country] ?? { teamQuote: 3.0 }
  const derde = KO_QUOTES[player.country]?.derde
  // verwacht = 1 + (derde / 6.5), fallback 1.5 als Kambi-data ontbreekt
  const verwacht = derde != null ? 1 + derde / 6.5 : 1.5
  return (100 / player.overall) ** 2 * tq.teamQuote * verwacht
}

// Trend voor spelersquote volgt de 'derde' (kwalificeert voor KO) trend
export function getPlayerTrend(country: string): OddsTrend {
  return KO_TRENDS[country]?.derde ?? null
}

export function abbrevName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return fullName
  const first = parts[0]
  const last = parts.slice(1).join(' ')
  return `${first[0]}. ${last}`
}

export function abbrevCountry(name: string): string {
  const map: Record<string, string> = {
    'Nederland': 'NED', 'Frankrijk': 'FRA', 'Duitsland': 'GER', 'Spanje': 'ESP',
    'Engeland': 'ENG', 'Brazilië': 'BRA', 'Argentinië': 'ARG', 'Portugal': 'POR',
    'België': 'BEL', 'Mexico': 'MEX', 'Colombia': 'COL', 'Uruguay': 'URU',
    'Japan': 'JPN', 'Zuid-Korea': 'KOR', 'Marokko': 'MAR', 'Senegal': 'SEN',
    'Ghana': 'GHA', 'Ivoorkust': 'CIV', 'Egypte': 'EGY', 'DR Congo': 'COD',
    'Tunesië': 'TUN', 'Algerije': 'ALG', 'Zuid-Afrika': 'RSA', 'Kameroen': 'CMR',
    'Noorwegen': 'NOR', 'Zweden': 'SWE', 'Zwitserland': 'SUI', 'Kroatië': 'CRO',
    'Tsjechië': 'CZE', 'Oostenrijk': 'AUT', 'Schotland': 'SCO', 'Turkije': 'TUR',
    'Oezbekistan': 'UZB', 'Bosnië en Herzegovina': 'BIH', 'VS': 'USA',
    'Verenigde Staten': 'USA', 'Canada': 'CAN', 'Panama': 'PAN',
    'Paraguay': 'PAR', 'Ecuador': 'ECU', 'Australië': 'AUS', 'Iran': 'IRN',
    'Irak': 'IRQ', 'Saoedi-Arabië': 'KSA', 'Qatar': 'QAT', 'Jordanië': 'JOR',
    'Nieuw-Zeeland': 'NZL', 'Kaapverdië': 'CPV', 'Curaçao': 'CUW',
    'Haïti': 'HAI',
  }
  return map[name] ?? name.slice(0, 3).toUpperCase()
}

export function formatQuote(q: number): string {
  return q.toFixed(2)
}
