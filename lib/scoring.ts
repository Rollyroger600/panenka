import { MATCH_ODDS } from './data/odds'
import { KO_QUOTES } from './data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from './data/knockoutRounds'
import type { Prediction, OranjeAnswer, KnockoutPicks } from '@/store/gameStore'

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
  derde:         'tweede',   // no dedicated field; tweede = 1.0 for all teams
  r16:           'r16',
  r8:            'r8',
  r4:            'r4',
  finale:        'finale',
  winnaar:       'winnaar',
}

const NED_MATCH_IDS = [10, 33, 58]
const ORANJE_KEYS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'] as const
const ORANJE_PTS = 2   // points per correct oranje answer

export function scoreParticipant(
  predictions: Record<number, Prediction>,
  knockoutPicks: KnockoutPicks,
  oranjeAnswers: Record<number, OranjeAnswer>,
  results: Record<number, MatchResult>,
  koResults: Record<string, string[]>,
  oranjeResults: Record<number, OranjeResult>,
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
    if (!slot.country || !slot.tok) continue
    const roundId = key.split('_')[0]
    const round = KNOCKOUT_ROUNDS.find((r) => r.id === roundId)
    if (!round) continue
    const advanced = koResults[roundId] ?? []
    if (!advanced.includes(slot.country)) continue
    const quotes = KO_QUOTES[slot.country]
    if (!quotes) continue
    const field = QKEY_MAP[round.qkey]
    const quote = field ? quotes[field] : 1
    knockout += slot.tok * quote
  }

  // ── Oranje ────────────────────────────────────────────────────────────────
  let oranje = 0
  for (const matchId of NED_MATCH_IDS) {
    const pred = oranjeAnswers[matchId]
    const actual = oranjeResults[matchId]
    if (!pred || !actual) continue
    for (const k of ORANJE_KEYS) {
      if (pred[k] && actual[k] && pred[k] === actual[k]) oranje += ORANJE_PTS
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
