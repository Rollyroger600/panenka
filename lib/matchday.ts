import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import { GROUP_MEMBERS } from '@/lib/groups'
import { PARTICIPANTS } from '@/lib/participants'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { ALL_SLOTS } from '@/store/gameStore'
import { scoreFantasy } from '@/lib/scoring'
import { getLastMatchBeforeMatchday, MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import type { GroupId } from '@/lib/groups'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import type { MatchResult, FantasyStats } from '@/lib/scoring'

export interface MatchdayQuote {
  matchId: number
  totoOdds: number
  uitslagOdds: number
}

export interface MatchdayConfig {
  matchdayId: number
  quotes: MatchdayQuote[]
  og: { potStand: number }
  asc: { potStand: number }
  savedAt: string
}

export interface MatchdayScoreRow {
  initials: string
  name: string
  poulefase: number
  kofase: number
  doorgaandeLanden: number
  fantasy: number
  total: number
  totoGoed: number
  uitslagGoed: number
  koR32: number
  koR16: number
  koKF: number
  koHF: number
  koFinale: number
  koWinnaar: number
}

export interface MatchdayScores {
  rows: MatchdayScoreRow[]
  // Cumulative totals per matchday for the progress chart
  history: Array<{ matchdayId: number; scores: Record<string, number> }>
}

// ── Redis key helpers ──────────────────────────────────────────────────────────

export function matchdayConfigKey(id: number): string {
  return `matchday:${id}`
}
export const ROTATION_KEY_OG  = 'matchday_rotation_og'
export const ROTATION_KEY_ASC = 'matchday_rotation_asc'

// ── Config load/save ──────────────────────────────────────────────────────────

export async function loadMatchdayConfig(id: number): Promise<MatchdayConfig | null> {
  return kvGet<MatchdayConfig>(matchdayConfigKey(id))
}

export async function saveMatchdayConfig(config: MatchdayConfig): Promise<void> {
  await kvSet(matchdayConfigKey(config.matchdayId), config)
}

// ── Rotation ──────────────────────────────────────────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  // Simple LCG determinism based on seed
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRotation(members: string[], totalSlots: number, seed: number): string[] {
  const round1 = seededShuffle(members, seed)
  const round2 = seededShuffle(members, seed + 1)
  const result = [...round1, ...round2].slice(0, totalSlots)
  return result
}

export async function getOrCreateRotation(group: GroupId): Promise<string[]> {
  const key = group === 'og' ? ROTATION_KEY_OG : ROTATION_KEY_ASC
  const existing = await kvGet<string[]>(key)
  if (existing && existing.length === MATCHDAY_COUNT) return existing

  const members = GROUP_MEMBERS[group]
  // Use a fixed seed per group for reproducibility
  const seed = group === 'og' ? 20260611 : 20260612
  const rotation = buildRotation(members, MATCHDAY_COUNT, seed)
  await kvSet(key, rotation)
  return rotation
}

export async function saveRotation(group: GroupId, rotation: string[]): Promise<void> {
  const key = group === 'og' ? ROTATION_KEY_OG : ROTATION_KEY_ASC
  await kvSet(key, rotation)
}

export function getTotoVanDeDag(rotation: string[], matchdayId: number) {
  const initials = rotation[matchdayId - 1] ?? null
  if (!initials) return null
  return PARTICIPANTS.find((p) => p.initials === initials) ?? null
}

// ── Score computation ─────────────────────────────────────────────────────────

const QKEY_MAP: Record<string, string> = {
  winnaar_poule: 'poulewinnaar',
  tweede:        'tweede',
  derde:         'derde',
  r16:           'r16',
  r8:            'r8',
  r4:            'r4',
  finale:        'finale',
  winnaar:       'winnaar',
}
const R32_IDS = new Set(['w1', 'w2', 'w3'])

// Knockout score per participant, split per round
function computeKoBreakdown(
  knockoutPicks: KnockoutPicks,
  koResults: Record<string, string[]>,
): { total: number; r32: number; r16: number; kf: number; hf: number; finale: number; winnaar: number } {
  const out = { total: 0, r32: 0, r16: 0, kf: 0, hf: 0, finale: 0, winnaar: 0 }
  for (const [key, slot] of Object.entries(knockoutPicks)) {
    const country = slot.country
    if (!country || !slot.tok) continue
    const roundId = key.split('_')[0]
    const round = KNOCKOUT_ROUNDS.find((r) => r.id === roundId)
    if (!round) continue
    const quotes = KO_QUOTES[country]
    if (!quotes) continue

    let pts = 0
    if (R32_IDS.has(roundId)) {
      const correctAdvanced = (koResults[roundId] ?? []).includes(country)
      if (correctAdvanced) {
        const field = QKEY_MAP[round.qkey] as keyof typeof quotes
        pts = slot.tok * (quotes[field] ?? 1)
      } else {
        const advancedAnyRole = [...R32_IDS].some((rid) => (koResults[rid] ?? []).includes(country))
        if (advancedAnyRole) pts = slot.tok * (quotes.derde ?? 1)
      }
      out.r32 += pts
    } else {
      if (!(koResults[roundId] ?? []).includes(country)) continue
      const field = QKEY_MAP[round.qkey] as keyof typeof quotes
      pts = slot.tok * (quotes[field] ?? 1)
      if (roundId === 'r16')     out.r16    += pts
      else if (roundId === 'r8') out.kf     += pts
      else if (roundId === 'r4') out.hf     += pts
      else if (roundId === 'finale')  out.finale  += pts
      else if (roundId === 'winner')  out.winnaar += pts
    }
    out.total += pts
  }
  // Round all
  for (const k of Object.keys(out) as (keyof typeof out)[]) {
    out[k] = Math.round(out[k] * 100) / 100
  }
  return out
}

export async function computeMatchdayScores(
  matchdayId: number,
  group: GroupId,
  results: Record<number, MatchResult>,
  koResults: Record<string, string[]>,
  fantasyStats: FantasyStats,
): Promise<MatchdayScoreRow[]> {
  const cutoff = getLastMatchBeforeMatchday(matchdayId)
  const members = GROUP_MEMBERS[group]
  const participants = PARTICIPANTS.filter((p) => members.includes(p.initials))

  // Load all participant data in parallel
  const rows = await Promise.all(
    participants.map(async (p) => {
      const [predictions, knockoutPicks, fantasyData] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', p.initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', p.initials)),
        kvGet<{ squad: FantasySquad }>(participantKey('fantasy', p.initials)),
      ])

      const preds = predictions ?? {}
      const koPicks = knockoutPicks ?? {}
      const squad = fantasyData?.squad ?? {}

      // Poulefase: match predictions for matches 1-72 with result ≤ cutoff
      let poulefase = 0
      let kofase = 0
      let totoGoed = 0
      let uitslagGoed = 0

      for (const [idStr, pred] of Object.entries(preds)) {
        const matchId = parseInt(idStr)
        if (matchId > cutoff) continue
        const actual = results[matchId]
        if (!actual || !pred.tokens) continue
        const odds = MATCH_ODDS[matchId]
        if (!odds) continue

        const isGroup = matchId <= 72

        if (pred.toto && pred.toto === actual.toto) {
          const totoOdd = pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
          const pts = pred.tokens * totoOdd
          if (isGroup) poulefase += pts; else kofase += pts
          totoGoed++
        }
        if (pred.uitslag && pred.uitslag === actual.uitslag) {
          const scoreOdd = odds.scores[pred.uitslag] ?? 0
          const pts = pred.tokens * scoreOdd
          if (isGroup) poulefase += pts; else kofase += pts
          uitslagGoed++
        }
      }

      const ko = computeKoBreakdown(koPicks, koResults)
      const fantasy = scoreFantasy(squad, fantasyStats)

      const total = Math.round((poulefase + kofase + ko.total + fantasy) * 100) / 100

      return {
        initials: p.initials,
        name: p.name,
        poulefase: Math.round(poulefase * 100) / 100,
        kofase:    Math.round(kofase * 100) / 100,
        doorgaandeLanden: ko.total,
        fantasy: Math.round(fantasy * 100) / 100,
        total,
        totoGoed,
        uitslagGoed,
        koR32:    ko.r32,
        koR16:    ko.r16,
        koKF:     ko.kf,
        koHF:     ko.hf,
        koFinale: ko.finale,
        koWinnaar: ko.winnaar,
      }
    })
  )

  return rows.sort((a, b) => b.total - a.total)
}

// Returns fantasy players for a given match from a participant's squad
export function getFantasyPlayersForMatch(
  squad: FantasySquad,
  homeCountry: string,
  awayCountry: string,
): { home: string | null; away: string | null } {
  let home: string | null = null
  let away: string | null = null
  for (const slot of ALL_SLOTS) {
    const player = squad[slot]
    if (!player) continue
    if (!home && player.country === homeCountry) home = player.name
    if (!away && player.country === awayCountry) away = player.name
  }
  return { home, away }
}
