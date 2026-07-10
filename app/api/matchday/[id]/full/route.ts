import { NextRequest, NextResponse } from 'next/server'
import { kvGet, participantKey } from '@/lib/kv/kv'
import { MATCHES } from '@/lib/data/matches'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_MATCH_ODDS } from '@/lib/data/koMatchOdds'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { normalizeUitslag } from '@/lib/helpers'
import {
  loadMatchdayConfig,
  getOrCreateRotation,
  getTotoVanDeDag,
  computeMatchdayScores,
  getFantasyPlayersForMatch,
  getGroupQuotes,
  FIRST_CUSTOM_BET_MATCHDAY,
} from '@/lib/matchday'
import { getMatchesForMatchday, MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import type { MatchResult, FantasyStats } from '@/lib/scoring'
import type { KoMatchTeams } from '@/app/actions/admin'
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
  const [rotation, results, koResults, fantasyStats, koMatchTeams] = await Promise.all([
    getOrCreateRotation(group),
    kvGet<Record<number, MatchResult>>('results'),
    kvGet<Record<string, string[]>>('ko_results'),
    kvGet<FantasyStats>('fantasy_stats'),
    kvGet<KoMatchTeams>('ko_match_teams'),
  ])

  const safeResults = results ?? {}
  const safeKoResults = koResults ?? {}
  const safeFstats = fantasyStats ?? {}
  const safeKoTeams = koMatchTeams ?? {}

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

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000
  const now = Date.now()

  const matchSlides: MatchSlideData[][] = slideGroups.map((ids) =>
    ids.map((matchId) => {
      const staticMatch = MATCHES.find((m) => m.id === matchId)
      if (!staticMatch) return null

      const koTeam = safeKoTeams[matchId]
      const match = koTeam
        ? { ...staticMatch, home: koTeam.home, away: koTeam.away, ...(koTeam.stadium ? { stadium: koTeam.stadium } : {}) }
        : staticMatch

      const odds = (matchId > 72 ? KO_MATCH_ODDS[matchId] : MATCH_ODDS[matchId]) ?? null

      const locked = matchId > 72 && koTeam?.kickoff
        ? now < new Date(koTeam.kickoff).getTime() - TWO_HOURS_MS
        : false

      const participantRows: MatchParticipantRow[] = groupParticipants.map((p) => {
        if (locked) {
          return {
            initials: p.initials,
            name: p.name,
            tokens: null,
            toto: null,
            uitslag: null,
            uitslagQuote: null,
            fantasyHome: null,
            fantasyAway: null,
          }
        }
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
          tokens: (pred?.tokens ?? 1) + (group === 'asc' ? (p.ascBonusTokens?.[matchId] ?? 0) : 0),
          toto: pred?.toto ?? null,
          uitslag: pred?.uitslag ? normalizeUitslag(pred.uitslag) : null,
          uitslagQuote: pred?.uitslag && odds ? (odds.scores[normalizeUitslag(pred.uitslag)] ?? null) : null,
          fantasyHome,
          fantasyAway,
        }
      })

      return { matchId, match, odds, participantRows, ...(locked ? { locked } : {}) } as MatchSlideData
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

  const resolvedConfig = { ...config, quotes: getGroupQuotes(config, group) }

  const useCustomBets = matchdayId >= (FIRST_CUSTOM_BET_MATCHDAY[group] ?? Infinity)
  const customBets = useCustomBets ? (config[group].customBets ?? []) : undefined

  const data: FullMatchdayData = {
    matchdayId,
    config: resolvedConfig,
    totoVanDeDagInitials: useCustomBets ? null : (totoParticipant?.initials ?? null),
    totoVanDeDagName: useCustomBets ? null : (totoParticipant?.name ?? null),
    matchSlides,
    scores,
    potHistory,
    scoreHistory,
    ...(customBets ? { customBets } : {}),
  }

  return NextResponse.json(data)
}
