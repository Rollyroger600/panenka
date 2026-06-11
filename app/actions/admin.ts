'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { kvGet, kvSet, participantKey, groupKey } from '@/lib/kv/kv'
import { scoreParticipant, scoreFantasy } from '@/lib/scoring'
import type { FantasyStats } from '@/lib/scoring'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS, DUAL_GROUP_INITIALS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { WK_PLAYERS } from '@/lib/data/players'
import type { Player } from '@/lib/data/players'
import type { MatchResult, OranjeResult } from '@/lib/scoring'
import type { Prediction, OranjeAnswer, KnockoutPicks } from '@/store/gameStore'
import type { ParticipantScore } from '@/app/leaderboard/types'
import type { OranjeVragenMap, OranjeVraag, OranjeCorrectMap, OranjeAntwoordenMap, OranjeBeoordeling, AntwoordType } from '@/lib/types/oranjeVragen'
import { chatAddMessage } from '@/lib/kv/chat'
import { MATCHES } from '@/lib/data/matches'
import type { ChatMessage } from '@/lib/types/chat'

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
  const isNew = !results[matchId]
  results[matchId] = { toto, uitslag }
  await kvSet('results', results)

  // Post automatisch een chat-bericht bij een nieuwe eindstand
  if (isNew) {
    const match = MATCHES.find((m) => m.id === matchId)
    const label = match ? `${match.home} – ${match.away}` : `Wedstrijd ${matchId}`
    const text = `⚽ **${label}**: ${uitslag}`
    const ts = Date.now()
    const botMsg: ChatMessage = {
      id: `bot-${matchId}-${ts.toString(36)}`,
      sender: 'WK 2026',
      senderInitials: 'BOT',
      text,
      ts,
      type: 'system',
      reactions: {},
    }
    const groups: GroupId[] = ['og', 'asc']
    await Promise.all(groups.map((g) => chatAddMessage(g, botMsg).catch(() => {})))
  }
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
  const vragen = (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', groupId))) ?? {}
  if (groupId !== 'og') {
    const ogVragen = (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', 'og'))) ?? {}
    for (const [matchIdStr, matchVragen] of Object.entries(ogVragen)) {
      const matchId = parseInt(matchIdStr)
      for (const initials of DUAL_GROUP_INITIALS) {
        const key = initials.toLowerCase()
        if (matchVragen[key] && !vragen[matchId]?.[key]) {
          if (!vragen[matchId]) vragen[matchId] = {}
          vragen[matchId][key] = matchVragen[key]
        }
      }
    }
  }
  return vragen
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

export async function loadOranjeBeoordeling(groupId: GroupId = 'og'): Promise<OranjeBeoordeling> {
  return (await kvGet<OranjeBeoordeling>(groupKey('oranje_beoordeling', groupId))) ?? {}
}

export async function saveOranjeBeoordeling(data: OranjeBeoordeling, groupId: GroupId = 'og'): Promise<void> {
  await kvSet(groupKey('oranje_beoordeling', groupId), data)
}

export async function loadAlleOranjeAntwoorden(groupId: GroupId = 'og'): Promise<Record<string, OranjeAntwoordenMap>> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  const entries = await Promise.all(
    groupParticipants.map(async (p) => {
      const antwoorden = await kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, p.initials))
      return [p.initials.toLowerCase(), antwoorden ?? {}] as const
    })
  )
  return Object.fromEntries(entries)
}

// ── Fantasy statistieken ──────────────────────────────────────────────────

// ── KO-wedstrijd teams (admin vult in zodra teams bekend zijn) ────────────

export type KoMatchTeams = Record<number, { home: string; away: string }>

export async function loadKoMatchTeams(): Promise<KoMatchTeams> {
  return (await kvGet<KoMatchTeams>('ko_match_teams')) ?? {}
}

export async function saveKoMatchTeams(data: KoMatchTeams): Promise<void> {
  await kvSet('ko_match_teams', data)
}

// ── Fantasy statistieken ──────────────────────────────────────────────────

export async function loadFantasyStats(): Promise<FantasyStats> {
  return (await kvGet<FantasyStats>('fantasy_stats')) ?? {}
}

export async function saveFantasyStats(data: FantasyStats): Promise<void> {
  await kvSet('fantasy_stats', data)
}

export type ParticipantSquadData = {
  initials: string
  name: string
  teamName: string
  squad: Record<string, Player | null>
}

const _wkPlayerById = Object.fromEntries(WK_PLAYERS.map((p) => [p.id, p]))

function _hydrateSquad(squad: Record<string, Player | null>): Record<string, Player | null> {
  return Object.fromEntries(
    Object.entries(squad).map(([slot, player]) => [
      slot,
      player ? (_wkPlayerById[player.id] ?? player) : null,
    ])
  )
}

export async function loadSquadsForGroup(groupId: GroupId): Promise<ParticipantSquadData[]> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  return Promise.all(
    groupParticipants.map(async (p) => {
      const data = await kvGet<{ squad: Record<string, Player | null>; teamName: string }>(
        participantKey('fantasy', p.initials)
      )
      return {
        initials: p.initials,
        name: p.name,
        teamName: data?.teamName ?? '',
        squad: data?.squad ? _hydrateSquad(data.squad) : {},
      }
    })
  )
}

export async function loadAllPlayerCounts(): Promise<Record<string, number>> {
  const squads = await Promise.all(
    PARTICIPANTS.map((p) =>
      kvGet<{ squad: Record<string, { name: string } | null> }>(participantKey('fantasy', p.initials))
    )
  )
  const counts: Record<string, number> = {}
  for (const data of squads) {
    if (!data?.squad) continue
    for (const player of Object.values(data.squad)) {
      if (player?.name) counts[player.name] = (counts[player.name] ?? 0) + 1
    }
  }
  return counts
}

// ── Score berekening ──────────────────────────────────────────────────────

export async function computeAndSaveScores(groupId: GroupId = 'og'): Promise<Record<string, ParticipantScore>> {
  const [results, koResults, oranjeResults, oranjeCorrect, beoordeling, fantasyStats] = await Promise.all([
    loadResults(),
    loadKoResults(),
    loadOranjeResults(),
    loadOranjeCorrectAdmin(groupId),
    loadOranjeBeoordeling(groupId),
    loadFantasyStats(),
  ])

  const heeftNieuweSysteem = Object.keys(oranjeCorrect).length > 0 || Object.keys(beoordeling).length > 0
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
        p.initials.toLowerCase(),
        beoordeling,
        groupId === 'asc' ? p.ascBonusTokens : undefined,
      )

      const fantasy = scoreFantasy(fantasyData?.squad ?? {}, fantasyStats)
      const total = Math.round((breakdown.poulefase + breakdown.knockout + breakdown.koWedstrijden + fantasy) * 100) / 100

      scores[p.initials.toLowerCase()] = {
        name: p.name,
        initials: p.initials,
        poulefase: breakdown.poulefase,
        knockout: breakdown.knockout,
        koWedstrijden: breakdown.koWedstrijden,
        oranje: breakdown.oranje,
        oranjeTokens: breakdown.oranjeTokens,
        fantasy,
        total,
        totoCorrect: breakdown.totoCorrect,
        uitslagCorrect: breakdown.uitslagCorrect,
      }
    }),
  )

  await kvSet(groupKey('scores', groupId), scores)
  return scores
}

// ── Voortgang deelnemers ──────────────────────────────────────────────────────

export type VoortgangEntry = {
  name: string
  initials: string
  totoCount: number
  uitslagCount: number
  tokensBudget: number
  tokensUsed: number
  koLandenCount: number
  fantasyCount: number
  oranjeCount: number
  oranjeTotal: number
}

export async function loadVoortgang(groupId: GroupId = 'og'): Promise<VoortgangEntry[]> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  const oranjeVragen = await loadOranjeVragenAdmin(groupId)

  // Collect all published questions: { matchId, authorKey }
  const published: { matchId: number; authorKey: string }[] = []
  for (const [matchIdStr, matchVragen] of Object.entries(oranjeVragen)) {
    for (const [authorKey, vraag] of Object.entries(matchVragen)) {
      if (vraag.gepubliceerd) published.push({ matchId: parseInt(matchIdStr), authorKey })
    }
  }

  const entries = await Promise.all(
    groupParticipants.map(async (p) => {
      const initialsLC = p.initials.toLowerCase()
      const [predictions, knockoutPicks, fantasyData, antwoorden] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', p.initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', p.initials)),
        kvGet<{ squad: Record<string, unknown> }>(participantKey('fantasy', p.initials)),
        kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, p.initials)),
      ])

      const preds = predictions ?? {}
      let totoCount = 0, uitslagCount = 0, pouleTokens = 0
      for (const [idStr, pred] of Object.entries(preds)) {
        if (parseInt(idStr) <= 72) {
          if (pred.toto !== null) totoCount++
          if (pred.uitslag !== null && pred.uitslag !== '') uitslagCount++
          pouleTokens += pred.tokens ?? 1
        }
      }

      let koLandenCount = 0, koTokens = 0
      for (const slot of Object.values(knockoutPicks ?? {})) {
        if (slot.country) { koLandenCount++; koTokens += slot.tok }
      }

      const fantasyCount = Object.values(fantasyData?.squad ?? {}).filter(v => v !== null).length

      // Oranje: count all answered published questions (including own)
      const ant = antwoorden ?? {}
      const oranjeTotal = published.length
      const oranjeCount = published.filter(
        q => ant[q.matchId]?.[q.authorKey] !== undefined
      ).length

      return {
        name: p.name,
        initials: p.initials,
        totoCount,
        uitslagCount,
        tokensBudget: 335 + p.extra,
        tokensUsed: pouleTokens + koTokens,
        koLandenCount,
        fantasyCount,
        oranjeCount,
        oranjeTotal,
      }
    })
  )

  return entries
}

// ── Token diagnose ────────────────────────────────────────────────────────────

export type TokenUsageEntry = {
  name: string
  initials: string
  budget: number
  poule: number
  koPicks: number
  used: number
  over: number
}

export async function loadAllTokenUsage(groupId: GroupId = 'og'): Promise<TokenUsageEntry[]> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  const entries = await Promise.all(
    groupParticipants.map(async (p) => {
      const [predictions, knockoutPicks] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', p.initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', p.initials)),
      ])
      const budget = 335 + p.extra
      const poule = Object.entries(predictions ?? {})
        .filter(([id]) => parseInt(id) <= 72)
        .reduce((sum, [, pred]) => sum + (pred.tokens ?? 1), 0)
      const koPicks = Object.values(knockoutPicks ?? {})
        .reduce((sum, slot) => sum + (slot.country ? slot.tok : 0), 0)
      const used = poule + koPicks
      return { name: p.name, initials: p.initials, budget, poule, koPicks, used, over: used - budget }
    })
  )
  return entries.sort((a, b) => b.over - a.over)
}
