'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { kvGet, kvSet, participantKey, groupKey } from '@/lib/kv/kv'
import { scoreParticipant, scoreFantasy } from '@/lib/scoring'
import type { FantasyStats } from '@/lib/scoring'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { MatchResult, OranjeResult } from '@/lib/scoring'
import type { Prediction, OranjeAnswer, KnockoutPicks } from '@/store/gameStore'
import type { ParticipantScore } from '@/app/leaderboard/types'
import type { OranjeVragenMap, OranjeVraag, OranjeCorrectMap, OranjeAntwoordenMap, AntwoordType } from '@/lib/types/oranjeVragen'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'panenka2026'

export async function adminLogin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false
  const store = await cookies()
  store.set('admin', 'true', { path: '/', maxAge: 60 * 60 * 24 * 7, httpOnly: true })
  return true
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin')?.value === 'true'
}

export async function setAdminGroup(groupId: GroupId): Promise<void> {
  const store = await cookies()
  store.set('admin_group', groupId, { path: '/', maxAge: 60 * 60 * 24 * 7, httpOnly: true })
  redirect('/admin')
}

export async function loadResults(): Promise<Record<number, MatchResult>> {
  return (await kvGet<Record<number, MatchResult>>('results')) ?? {}
}

export async function saveResult(matchId: number, toto: '1' | 'X' | '2', uitslag: string): Promise<void> {
  const results = await loadResults()
  results[matchId] = { toto, uitslag }
  await kvSet('results', results)
}

export async function deleteResult(matchId: number): Promise<void> {
  const results = await loadResults()
  delete results[matchId]
  await kvSet('results', results)
}

export async function loadKoResults(): Promise<Record<string, string[]>> {
  return (await kvGet<Record<string, string[]>>('ko_results')) ?? {}
}

export async function saveKoResults(data: Record<string, string[]>): Promise<void> {
  await kvSet('ko_results', data)
}

export async function loadOranjeResults(): Promise<Record<number, OranjeResult>> {
  return (await kvGet<Record<number, OranjeResult>>('oranje_results')) ?? {}
}

export async function saveOranjeResults(data: Record<number, OranjeResult>): Promise<void> {
  await kvSet('oranje_results', data)
}

// ── Oranje vragen (admin beheer) ─────────────────────────────────────────

export async function loadOranjeVragenAdmin(groupId: GroupId = 'og'): Promise<OranjeVragenMap> {
  return (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', groupId))) ?? {}
}

export async function updateOranjeVraag(
  matchId: number,
  initials: string,
  updates: Partial<Pick<OranjeVraag, 'gepubliceerd' | 'adminType' | 'tekst'>>,
  groupId: GroupId = 'og',
): Promise<void> {
  const all = await loadOranjeVragenAdmin(groupId)
  const key = initials.toLowerCase()
  if (!all[matchId]?.[key]) return
  all[matchId][key] = { ...all[matchId][key], ...updates }
  await kvSet(groupKey('oranje_vragen', groupId), all)
}

export async function loadOranjeCorrectAdmin(groupId: GroupId = 'og'): Promise<OranjeCorrectMap> {
  return (await kvGet<OranjeCorrectMap>(groupKey('oranje_correct', groupId))) ?? {}
}

export async function saveOranjeCorrect(data: OranjeCorrectMap, groupId: GroupId = 'og'): Promise<void> {
  await kvSet(groupKey('oranje_correct', groupId), data)
}

// ── Fantasy statistieken ──────────────────────────────────────────────────

export async function loadFantasyStats(): Promise<FantasyStats> {
  return (await kvGet<FantasyStats>('fantasy_stats')) ?? {}
}

export async function saveFantasyStats(data: FantasyStats): Promise<void> {
  await kvSet('fantasy_stats', data)
}

// ── Score berekening ──────────────────────────────────────────────────────

export async function computeAndSaveScores(groupId: GroupId = 'og'): Promise<Record<string, ParticipantScore>> {
  const [results, koResults, oranjeResults, oranjeCorrect, fantasyStats] = await Promise.all([
    loadResults(),
    loadKoResults(),
    loadOranjeResults(),
    loadOranjeCorrectAdmin(groupId),
    loadFantasyStats(),
  ])

  const heeftNieuweSysteem = Object.keys(oranjeCorrect).length > 0
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))

  const scores: Record<string, ParticipantScore> = {}

  await Promise.all(
    groupParticipants.map(async (p) => {
      const [predictions, knockoutPicks, oranjeAnswers, oranjeAntwoorden, fantasyData] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', p.initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', p.initials)),
        kvGet<Record<number, OranjeAnswer>>(participantKey('oranje', p.initials)),
        kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, p.initials)),
        kvGet<{ squad: Record<string, import('@/lib/data/players').Player | null> }>(participantKey('fantasy', p.initials)),
      ])

      const breakdown = scoreParticipant(
        predictions ?? {},
        knockoutPicks ?? {},
        oranjeAnswers ?? {},
        results,
        koResults,
        oranjeResults,
        heeftNieuweSysteem ? (oranjeAntwoorden ?? {}) : undefined,
        heeftNieuweSysteem ? oranjeCorrect : undefined,
      )

      const fantasy = scoreFantasy(fantasyData?.squad ?? {}, fantasyStats)
      const total = Math.round((breakdown.poulefase + breakdown.knockout + fantasy) * 100) / 100

      scores[p.initials.toLowerCase()] = {
        name: p.name,
        initials: p.initials,
        poulefase: breakdown.poulefase,
        knockout: breakdown.knockout,
        oranje: breakdown.oranje,
        fantasy,
        total,
      }
    }),
  )

  await kvSet(groupKey('scores', groupId), scores)
  return scores
}
