export type KoRound = 'rv32' | 'rv16' | 'kf' | 'hf' | 'brons' | 'finale'

export interface Match {
  id: number
  poule: string
  round: number
  date: string
  home: string
  away: string
  stadium: string
  phase?: 'group' | 'knockout'
  koRound?: KoRound
  active?: boolean
}

export const MATCHES: Match[] = [
  { id: 1, poule: 'A', round: 1, date: '11 jun', home: 'Mexico', away: 'Zuid-Afrika', stadium: 'Estadio Azteca Mexico City' },
  { id: 2, poule: 'A', round: 1, date: '12 jun', home: 'Zuid-Korea', away: 'Tsjechië', stadium: 'Estadio Guadalajara' },
  { id: 3, poule: 'B', round: 1, date: '12 jun', home: 'Canada', away: 'Bosnië en Herzegovina', stadium: 'Toronto Stadium' },
  { id: 4, poule: 'D', round: 1, date: '13 jun', home: 'Verenigde Staten', away: 'Paraguay', stadium: 'Los Angeles Stadium' },
  { id: 5, poule: 'B', round: 1, date: '13 jun', home: 'Qatar', away: 'Zwitserland', stadium: 'San Francisco Bay Area Stadium' },
  { id: 6, poule: 'C', round: 1, date: '14 jun', home: 'Brazilië', away: 'Marokko', stadium: 'New York New Jersey Stadium' },
  { id: 7, poule: 'C', round: 1, date: '14 jun', home: 'Haïti', away: 'Schotland', stadium: 'Boston Stadium' },
  { id: 8, poule: 'D', round: 1, date: '14 jun', home: 'Australië', away: 'Turkije', stadium: 'BC Place Vancouver' },
  { id: 9, poule: 'E', round: 1, date: '14 jun', home: 'Duitsland', away: 'Curaçao', stadium: 'Houston Stadium' },
  { id: 10, poule: 'F', round: 1, date: '14 jun', home: 'Nederland', away: 'Japan', stadium: 'Dallas Stadium' },
  { id: 11, poule: 'E', round: 1, date: '15 jun', home: 'Ivoorkust', away: 'Ecuador', stadium: 'Philadelphia Stadium' },
  { id: 12, poule: 'F', round: 1, date: '15 jun', home: 'Zweden', away: 'Tunesië', stadium: 'Estadio Monterrey' },
  { id: 13, poule: 'H', round: 1, date: '15 jun', home: 'Spanje', away: 'Kaapverdië', stadium: 'Atlanta Stadium' },
  { id: 14, poule: 'G', round: 1, date: '15 jun', home: 'België', away: 'Egypte', stadium: 'Seattle Stadium' },
  { id: 15, poule: 'H', round: 1, date: '16 jun', home: 'Saoedi-Arabië', away: 'Uruguay', stadium: 'Miami Stadium' },
  { id: 16, poule: 'G', round: 1, date: '16 jun', home: 'Iran', away: 'Nieuw-Zeeland', stadium: 'Los Angeles Stadium' },
  { id: 17, poule: 'I', round: 1, date: '16 jun', home: 'Frankrijk', away: 'Senegal', stadium: 'New York New Jersey Stadium' },
  { id: 18, poule: 'I', round: 1, date: '17 jun', home: 'Irak', away: 'Noorwegen', stadium: 'Boston Stadium' },
  { id: 19, poule: 'J', round: 1, date: '17 jun', home: 'Argentinië', away: 'Algerije', stadium: 'Kansas City Stadium' },
  { id: 20, poule: 'J', round: 1, date: '17 jun', home: 'Oostenrijk', away: 'Jordanië', stadium: 'San Francisco Bay Area Stadium' },
  { id: 21, poule: 'K', round: 1, date: '17 jun', home: 'Portugal', away: 'DR Congo', stadium: 'Houston Stadium' },
  { id: 22, poule: 'L', round: 1, date: '17 jun', home: 'Engeland', away: 'Kroatië', stadium: 'Dallas Stadium' },
  { id: 23, poule: 'L', round: 1, date: '18 jun', home: 'Ghana', away: 'Panama', stadium: 'Toronto Stadium' },
  { id: 24, poule: 'K', round: 1, date: '18 jun', home: 'Oezbekistan', away: 'Colombia', stadium: 'Estadio Azteca Mexico City' },
  { id: 25, poule: 'A', round: 2, date: '18 jun', home: 'Tsjechië', away: 'Zuid-Afrika', stadium: 'Atlanta Stadium' },
  { id: 26, poule: 'B', round: 2, date: '18 jun', home: 'Zwitserland', away: 'Bosnië en Herzegovina', stadium: 'Los Angeles Stadium' },
  { id: 27, poule: 'B', round: 2, date: '19 jun', home: 'Canada', away: 'Qatar', stadium: 'BC Place Vancouver' },
  { id: 28, poule: 'A', round: 2, date: '19 jun', home: 'Mexico', away: 'Zuid-Korea', stadium: 'Estadio Guadalajara' },
  { id: 29, poule: 'D', round: 2, date: '19 jun', home: 'Verenigde Staten', away: 'Australië', stadium: 'Seattle Stadium' },
  { id: 30, poule: 'C', round: 2, date: '20 jun', home: 'Schotland', away: 'Marokko', stadium: 'Boston Stadium' },
  { id: 31, poule: 'C', round: 2, date: '20 jun', home: 'Brazilië', away: 'Haïti', stadium: 'Philadelphia Stadium' },
  { id: 32, poule: 'D', round: 2, date: '20 jun', home: 'Turkije', away: 'Paraguay', stadium: 'San Francisco Bay Area Stadium' },
  { id: 33, poule: 'F', round: 2, date: '20 jun', home: 'Nederland', away: 'Zweden', stadium: 'Houston Stadium' },
  { id: 34, poule: 'E', round: 2, date: '20 jun', home: 'Duitsland', away: 'Ivoorkust', stadium: 'Toronto Stadium' },
  { id: 35, poule: 'E', round: 2, date: '21 jun', home: 'Ecuador', away: 'Curaçao', stadium: 'Kansas City Stadium' },
  { id: 36, poule: 'F', round: 2, date: '21 jun', home: 'Tunesië', away: 'Japan', stadium: 'Estadio Monterrey' },
  { id: 37, poule: 'H', round: 2, date: '21 jun', home: 'Spanje', away: 'Saoedi-Arabië', stadium: 'Atlanta Stadium' },
  { id: 38, poule: 'G', round: 2, date: '21 jun', home: 'België', away: 'Iran', stadium: 'Los Angeles Stadium' },
  { id: 39, poule: 'H', round: 2, date: '22 jun', home: 'Uruguay', away: 'Kaapverdië', stadium: 'Miami Stadium' },
  { id: 40, poule: 'G', round: 2, date: '22 jun', home: 'Nieuw-Zeeland', away: 'Egypte', stadium: 'BC Place Vancouver' },
  { id: 41, poule: 'J', round: 2, date: '22 jun', home: 'Argentinië', away: 'Oostenrijk', stadium: 'Dallas Stadium' },
  { id: 42, poule: 'I', round: 2, date: '22 jun', home: 'Frankrijk', away: 'Irak', stadium: 'Philadelphia Stadium' },
  { id: 43, poule: 'I', round: 2, date: '23 jun', home: 'Noorwegen', away: 'Senegal', stadium: 'New York New Jersey Stadium' },
  { id: 44, poule: 'J', round: 2, date: '23 jun', home: 'Jordanië', away: 'Algerije', stadium: 'San Francisco Bay Area Stadium' },
  { id: 45, poule: 'K', round: 2, date: '23 jun', home: 'Portugal', away: 'Oezbekistan', stadium: 'Houston Stadium' },
  { id: 46, poule: 'L', round: 2, date: '23 jun', home: 'Engeland', away: 'Ghana', stadium: 'Boston Stadium' },
  { id: 47, poule: 'L', round: 2, date: '24 jun', home: 'Panama', away: 'Kroatië', stadium: 'Toronto Stadium' },
  { id: 48, poule: 'K', round: 2, date: '24 jun', home: 'Colombia', away: 'DR Congo', stadium: 'Estadio Guadalajara' },
  { id: 49, poule: 'B', round: 3, date: '24 jun', home: 'Zwitserland', away: 'Canada', stadium: 'BC Place Vancouver' },
  { id: 50, poule: 'B', round: 3, date: '24 jun', home: 'Bosnië en Herzegovina', away: 'Qatar', stadium: 'Seattle Stadium' },
  { id: 51, poule: 'C', round: 3, date: '25 jun', home: 'Schotland', away: 'Brazilië', stadium: 'Miami Stadium' },
  { id: 52, poule: 'C', round: 3, date: '25 jun', home: 'Marokko', away: 'Haïti', stadium: 'Atlanta Stadium' },
  { id: 53, poule: 'A', round: 3, date: '25 jun', home: 'Tsjechië', away: 'Mexico', stadium: 'Estadio Azteca Mexico City' },
  { id: 54, poule: 'A', round: 3, date: '25 jun', home: 'Zuid-Afrika', away: 'Zuid-Korea', stadium: 'Estadio Monterrey' },
  { id: 55, poule: 'E', round: 3, date: '25 jun', home: 'Curaçao', away: 'Ivoorkust', stadium: 'Philadelphia Stadium' },
  { id: 56, poule: 'E', round: 3, date: '25 jun', home: 'Ecuador', away: 'Duitsland', stadium: 'New York New Jersey Stadium' },
  { id: 57, poule: 'F', round: 3, date: '26 jun', home: 'Japan', away: 'Zweden', stadium: 'Dallas Stadium' },
  { id: 58, poule: 'F', round: 3, date: '26 jun', home: 'Tunesië', away: 'Nederland', stadium: 'Kansas City Stadium' },
  { id: 59, poule: 'D', round: 3, date: '26 jun', home: 'Turkije', away: 'Verenigde Staten', stadium: 'Los Angeles Stadium' },
  { id: 60, poule: 'D', round: 3, date: '26 jun', home: 'Paraguay', away: 'Australië', stadium: 'San Francisco Bay Area Stadium' },
  { id: 61, poule: 'I', round: 3, date: '26 jun', home: 'Noorwegen', away: 'Frankrijk', stadium: 'Boston Stadium' },
  { id: 62, poule: 'I', round: 3, date: '26 jun', home: 'Senegal', away: 'Irak', stadium: 'Toronto Stadium' },
  { id: 63, poule: 'H', round: 3, date: '27 jun', home: 'Kaapverdië', away: 'Saoedi-Arabië', stadium: 'Houston Stadium' },
  { id: 64, poule: 'H', round: 3, date: '27 jun', home: 'Uruguay', away: 'Spanje', stadium: 'Estadio Guadalajara' },
  { id: 65, poule: 'G', round: 3, date: '27 jun', home: 'Egypte', away: 'Iran', stadium: 'Seattle Stadium' },
  { id: 66, poule: 'G', round: 3, date: '27 jun', home: 'Nieuw-Zeeland', away: 'België', stadium: 'BC Place Vancouver' },
  { id: 67, poule: 'L', round: 3, date: '27 jun', home: 'Panama', away: 'Engeland', stadium: 'New York New Jersey Stadium' },
  { id: 68, poule: 'L', round: 3, date: '27 jun', home: 'Kroatië', away: 'Ghana', stadium: 'Philadelphia Stadium' },
  { id: 69, poule: 'K', round: 3, date: '28 jun', home: 'Colombia', away: 'Portugal', stadium: 'Miami Stadium' },
  { id: 70, poule: 'K', round: 3, date: '28 jun', home: 'DR Congo', away: 'Oezbekistan', stadium: 'Atlanta Stadium' },
  { id: 71, poule: 'J', round: 3, date: '28 jun', home: 'Algerije', away: 'Oostenrijk', stadium: 'Kansas City Stadium' },
  { id: 72, poule: 'J', round: 3, date: '28 jun', home: 'Jordanië', away: 'Argentinië', stadium: 'Dallas Stadium' },

  // ─── Knock-out fase (#73–#104) ────────────────────────────────────────────
  // Teams zijn TBD totdat de poulefase is afgerond.
  // Activeer per wedstrijd (active: true) zodra de teams bekend zijn.

  // Ronde van 32 — 16 wedstrijden — ±1–4 jul
  { id: 73,  poule: 'KO', round: 1, date: '1 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 74,  poule: 'KO', round: 1, date: '1 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 75,  poule: 'KO', round: 1, date: '1 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 76,  poule: 'KO', round: 1, date: '1 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 77,  poule: 'KO', round: 1, date: '2 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 78,  poule: 'KO', round: 1, date: '2 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 79,  poule: 'KO', round: 1, date: '2 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 80,  poule: 'KO', round: 1, date: '2 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 81,  poule: 'KO', round: 1, date: '3 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 82,  poule: 'KO', round: 1, date: '3 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 83,  poule: 'KO', round: 1, date: '3 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 84,  poule: 'KO', round: 1, date: '3 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 85,  poule: 'KO', round: 1, date: '4 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 86,  poule: 'KO', round: 1, date: '4 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 87,  poule: 'KO', round: 1, date: '4 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },
  { id: 88,  poule: 'KO', round: 1, date: '4 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv32', active: false },

  // Ronde van 16 — 8 wedstrijden — ±5–6 jul
  { id: 89,  poule: 'KO', round: 1, date: '5 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 90,  poule: 'KO', round: 1, date: '5 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 91,  poule: 'KO', round: 1, date: '5 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 92,  poule: 'KO', round: 1, date: '5 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 93,  poule: 'KO', round: 1, date: '6 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 94,  poule: 'KO', round: 1, date: '6 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 95,  poule: 'KO', round: 1, date: '6 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },
  { id: 96,  poule: 'KO', round: 1, date: '6 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'rv16', active: false },

  // Kwartfinales — 4 wedstrijden — ±9–10 jul
  { id: 97,  poule: 'KO', round: 1, date: '9 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'kf', active: false },
  { id: 98,  poule: 'KO', round: 1, date: '9 jul',  home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'kf', active: false },
  { id: 99,  poule: 'KO', round: 1, date: '10 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'kf', active: false },
  { id: 100, poule: 'KO', round: 1, date: '10 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'kf', active: false },

  // Halve finales — 2 wedstrijden — ±13–14 jul
  { id: 101, poule: 'KO', round: 1, date: '13 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'hf', active: false },
  { id: 102, poule: 'KO', round: 1, date: '14 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'hf', active: false },

  // 3e/4e plaatsmatch — 18 jul
  { id: 103, poule: 'KO', round: 1, date: '18 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'brons', active: false },

  // Finale — 19 jul
  { id: 104, poule: 'KO', round: 1, date: '19 jul', home: 'TBD', away: 'TBD', stadium: 'TBD', phase: 'knockout', koRound: 'finale', active: false },
]
