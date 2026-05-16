import { NextRequest, NextResponse } from 'next/server'
import { kvGet, participantKey } from '@/lib/kv/kv'
import { MATCHES } from '@/lib/data/matches'
import { MATCH_ODDS } from '@/lib/data/odds'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import {
  loadMatchdayConfig,
  getOrCreateRotation,
  getTotoVanDeDag,
  computeMatchdayScores,
  getFantasyPlayersForMatch,
} from '@/lib/matchday'
import { getMatchesForMatchday, MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import type { MatchResult, FantasyStats } from '@/lib/scoring'
import type { FullMatchdayData, MatchSlideData, MatchParticipantRow, PotPoint, ScoreHistoryPoint } from '@/lib/types/matchday'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchdayId = parseInt(id)
  const { searchParams } = new URL(req.url)
  const group = (searchParams.get('group') ?? 'og') as GroupId

  if (isNaN(matchdayId) || matchdayId < 1 || matchdayId > MATCHDAY_COUNT) {
    return NextResponse.json({ error: 'Invalid matchday' }, { status: 400 })
  }

  // Load config for this matchday
  const config = await loadMatchdayConfig(matchdayId)
  if (!config) {
    return NextResponse.json({ error: 'Matchday not yet configured' }, { status: 404 })
  }

  // Load shared data
  const [rotation, results, koResults, fantasyStats] = await Promise.all([
    getOrCreateRotation(group),
    kvGet<Record<number, MatchResult>>('results'),
    kvGet<Record<string, string[]>>('ko_results'),
    kvGet<FantasyStats>('fantasy_stats'),
  ])

  const safeResults = results ?? {}
  const safeKoResults = koResults ?? {}
  const safeFstats = fantasyStats ?? {}

  // Determine totoVanDeDag
  const totoParticipant = getTotoVanDeDag(rotation, matchdayId)

  // Load all participant data for this group
  const members = GROUP_MEMBERS[group]
  const groupParticipants = PARTICIPANTS.filter((p) => members.includes(p.initials))

  const [allPredictions, allSquads] = await Promise.all([
    Promise.all(
      groupParticipants.map(async (p) => ({
        initials: p.initials,
        preds: await kvGet<Record<number, Prediction>>(participantKey('predictions', p.initials)) ?? {},
      }))
    ),
    Promise.all(
      groupParticipants.map(async (p) => ({
        initials: p.initials,
        squad: (await kvGet<{ squad: FantasySquad }>(participantKey('fantasy', p.initials)))?.squad ?? {},
      }))
    ),
  ])

  const predsByInitials = Object.fromEntries(allPredictions.map((x) => [x.initials, x.preds]))
  const squadsByInitials = Object.fromEntries(allSquads.map((x) => [x.initials, x.squad]))

  // Build match slide data
  const matchIds = getMatchesForMatchday(matchdayId)
  const isLast = matchIds.length === 2  // MD 26-27: only 2 matches

  // Split into slides: [0,1] and [2,3] or single [0,1] for short days
  const slideGroups = isLast
    ? [matchIds]                           // 1 slide: both matches
    : [matchIds.slice(0, 2), matchIds.slice(2)]  // 2 slides

  const matchSlides: MatchSlideData[][] = slideGroups.map((ids) =>
    ids.map((matchId) => {
      const match = MATCHES.find((m) => m.id === matchId)
      if (!match) return null

      const odds = MATCH_ODDS[matchId] ?? null

      const participantRows: MatchParticipantRow[] = groupParticipants.map((p) => {
        const pred = predsByInitials[p.initials]?.[matchId]
        const squad = squadsByInitials[p.initials] ?? {}
        const { home: fantasyHome, away: fantasyAway } = getFantasyPlayersForMatch(
          squad,
          match.home,
          match.away,
        )
        return {
          initials: p.initials,
          name: p.name,
          tokens: pred?.tokens ?? null,
          toto: pred?.toto ?? null,
          uitslag: pred?.uitslag ?? null,
          uitslagQuote: pred?.uitslag && odds ? (odds.scores[pred.uitslag] ?? null) : null,
          fantasyHome,
          fantasyAway,
        }
      })

      return { matchId, match, odds, participantRows } as MatchSlideData
    }).filter(Boolean) as MatchSlideData[]
  )

  // Compute current matchday scores
  const scores = await computeMatchdayScores(matchdayId, group, safeResults, safeKoResults, safeFstats)

  // Build pot history from all saved matchday configs up to this one
  const potHistory: PotPoint[] = []
  for (let md = 1; md <= matchdayId; md++) {
    const cfg = await loadMatchdayConfig(md)
    if (cfg) {
      potHistory.push({
        matchdayId: md,
        potStand: group === 'og' ? cfg.og.potStand : cfg.asc.potStand,
      })
    }
  }

  // Build score history: total per participant at the END of each past matchday
  // Score at end of MD n = scores computed for MD n+1 (which cuts off at last match of MD n)
  const scoreHistory: ScoreHistoryPoint[] = []
  for (let md = 1; md <= matchdayId; md++) {
    const mdCfg = await loadMatchdayConfig(md)
    if (!mdCfg) continue
    // Score at end of MD md = computeMatchdayScores(md + 1, ...)
    const mdScores = await computeMatchdayScores(md + 1, group, safeResults, safeKoResults, safeFstats)
    scoreHistory.push({
      matchdayId: md,
      scores: Object.fromEntries(mdScores.map((r) => [r.initials, r.total])),
    })
  }

  const data: FullMatchdayData = {
    matchdayId,
    config,
    totoVanDeDagInitials: totoParticipant?.initials ?? null,
    totoVanDeDagName: totoParticipant?.name ?? null,
    matchSlides,
    scores,
    potHistory,
    scoreHistory,
  }

  return NextResponse.json(data)
}
