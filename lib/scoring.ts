import { MATCH_ODDS } from './data/odds'
import { KO_QUOTES } from './data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from './data/knockoutRounds'
import { computePlayerQuote } from './helpers'
import type { Player } from './data/players'
import type { Prediction, OranjeAnswer, KnockoutPicks } from '@/store/gameStore'
import type { OranjeCorrectMap, OranjeAntwoordenMap } from '@/lib/types/oranjeVragen'

export type FantasyStats = Record<string, { goals: number; assists: number }>

export interface MatchResult {
  toto: '1' | 'X' | '2'
  uitslag: string
}

export interface OranjeResult {
  q1: string | null; q2: string | null; q3: string | null
  q4: string | null; q5: string | null; q6: string | null
  q7: string | null; q8: string | null; q9: string | null
}

export interface ScoreBreakdown {
  poulefase: number
  knockout: number
  oranje: number
  total: number
}

// qkey → KO_QUOTES field
const QKEY_MAP: Record<string, keyof typeof KO_QUOTES[string]> = {
  winnaar_poule: 'poulewinnaar',
  tweede:        'tweede',
  derde:         'derde',
  r16:           'r16',
  r8:            'r8',
  r4:            'r4',
  finale:        'finale',
  winnaar:       'winnaar',
}

const R32_IDS = ['w1', 'w2', 'w3'] as const

const NED_MATCH_IDS = [10, 33, 58]
const ORANJE_KEYS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'] as const
const ORANJE_PTS = 2   // legacy — not used in new scoring

const ORANJE_PTS_NIEUW = 0.5  // punten per correct beantwoorde deelnemersvraag

function scoreOranjeNieuw(
  antwoorden: OranjeAntwoordenMap,  // deelnemer's antwoorden
  correct: OranjeCorrectMap,
): number {
  let punten = 0
  for (const matchId of NED_MATCH_IDS) {
    const matchAnt = antwoorden[matchId] ?? {}
    const matchCorrect = correct[matchId] ?? {}
    for (const [initials, correctWaarde] of Object.entries(matchCorrect)) {
      if (!correctWaarde) continue
      const gegeven = matchAnt[initials]
      if (!gegeven) continue
      // percentage: ±5% marge
      if (/^\d+$/.test(correctWaarde) && /^\d+$/.test(gegeven)) {
        if (Math.abs(parseInt(gegeven, 10) - parseInt(correctWaarde, 10)) <= 5) {
          punten += ORANJE_PTS_NIEUW
        }
      } else if (gegeven === correctWaarde) {
        punten += ORANJE_PTS_NIEUW
      }
    }
  }
  return Math.round(punten * 100) / 100
}

export function scoreParticipant(
  predictions: Record<number, Prediction>,
  knockoutPicks: KnockoutPicks,
  oranjeAnswers: Record<number, OranjeAnswer>,
  results: Record<number, MatchResult>,
  koResults: Record<string, string[]>,
  oranjeResults: Record<number, OranjeResult>,
  oranjeAntwoorden?: OranjeAntwoordenMap,
  oranjeCorrect?: OranjeCorrectMap,
): ScoreBreakdown {
  // ── Poulefase ─────────────────────────────────────────────────────────────
  let poulefase = 0
  for (const [idStr, pred] of Object.entries(predictions)) {
    const matchId = parseInt(idStr)
    const actual = results[matchId]
    if (!actual || !pred.tokens) continue
    const odds = MATCH_ODDS[matchId]
    if (!odds) continue

    if (pred.toto && pred.toto === actual.toto) {
      const totoOdd = pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
      poulefase += pred.tokens * totoOdd
    }
    if (pred.uitslag && pred.uitslag === actual.uitslag) {
      const scoreOdd = odds.scores[pred.uitslag] ?? 0
      poulefase += pred.tokens * scoreOdd
    }
  }

  // ── Knockout ──────────────────────────────────────────────────────────────
  let knockout = 0
  for (const [key, slot] of Object.entries(knockoutPicks)) {
    const country = slot.country
    if (!country || !slot.tok) continue
    const roundId = key.split('_')[0]
    const round = KNOCKOUT_ROUNDS.find((r) => r.id === roundId)
    if (!round) continue
    const quotes = KO_QUOTES[country]
    if (!quotes) continue

    if ((R32_IDS as readonly string[]).includes(roundId)) {
      // R32: correct rol → specifieke quote; andere rol maar wel door → quote_derde
      const correctAdvanced = (koResults[roundId] ?? []).includes(country)
      if (correctAdvanced) {
        const field = QKEY_MAP[round.qkey]
        knockout += slot.tok * (quotes[field] ?? 1)
      } else {
        const advancedAnyRole = R32_IDS.some((rid) => (koResults[rid] ?? []).includes(country))
        if (advancedAnyRole) {
          knockout += slot.tok * (quotes.derde ?? 1)
        }
      }
    } else {
      // R16 t/m winnaar: alleen punten bij correcte voorspelling
      if (!(koResults[roundId] ?? []).includes(country)) continue
      const field = QKEY_MAP[round.qkey]
      knockout += slot.tok * (quotes[field] ?? 1)
    }
  }

  // ── Oranje ────────────────────────────────────────────────────────────────
  // Nieuw systeem (deelnemersvragen) heeft voorrang; legacy als fallback
  let oranje = 0
  if (oranjeAntwoorden && oranjeCorrect) {
    oranje = scoreOranjeNieuw(oranjeAntwoorden, oranjeCorrect)
  } else {
    for (const matchId of NED_MATCH_IDS) {
      const pred = oranjeAnswers[matchId]
      const actual = oranjeResults[matchId]
      if (!pred || !actual) continue
      for (const k of ORANJE_KEYS) {
        if (pred[k] && actual[k] && pred[k] === actual[k]) oranje += ORANJE_PTS
      }
    }
  }

  const total = Math.round((poulefase + knockout + oranje) * 100) / 100
  return {
    poulefase: Math.round(poulefase * 100) / 100,
    knockout:  Math.round(knockout * 100) / 100,
    oranje,
    total,
  }
}

export function scoreFantasy(
  squad: Record<string, Player | null>,
  stats: FantasyStats,
): number {
  let total = 0
  for (const player of Object.values(squad)) {
    if (!player) continue
    const s = stats[player.name]
    if (!s || (s.goals === 0 && s.assists === 0)) continue
    total += (s.goals + s.assists) * computePlayerQuote(player)
  }
  return Math.round(total * 100) / 100
}
