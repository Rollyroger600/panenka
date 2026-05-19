import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSetEx, participantKey } from '@/lib/kv/kv'
import { MATCHES } from '@/lib/data/matches'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import { loadMatchdayConfig } from '@/lib/matchday'
import { getMatchesForMatchday } from '@/lib/data/matchdayMap'
import { FDO_MATCH_IDS } from '@/lib/data/fdoMatchIds'
import { computePlayerQuote } from '@/lib/helpers'
import { ALL_SLOTS } from '@/store/gameStore'
import type { GroupId } from '@/lib/groups'
import type { Prediction, FantasySquad } from '@/store/gameStore'
import type { LiveMatchData, LiveParticipantRow, LiveGoalEvent } from '@/lib/types/matchday'

const FDO_BASE = 'https://api.football-data.org/v4'
const LIVE_CACHE_TTL = 25  // seconds

interface FdoMatch {
  status: string
  minute?: number
  score: {
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
  goals: Array<{
    minute: number
    team: { name: string }
    scorer: { name: string }
    assist: { name: string | null } | null
    type: string
  }>
}

function currentToto(home: number, away: number): '1' | 'X' | '2' {
  if (home > away) return '1'
  if (away > home) return '2'
  return 'X'
}

// Tracks when we're allowed to make another request (rate-limit backoff)
let retryAfterMs = 0

async function fetchFdoMatch(fdoId: number): Promise<FdoMatch | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return null
  if (Date.now() < retryAfterMs) return null  // still in backoff

  try {
    const res = await fetch(`${FDO_BASE}/matches/${fdoId}`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    })

    // Respect throttling headers
    const retryAfter = res.headers.get('X-RequestCounter-Reset') ?? res.headers.get('Retry-After')
    if (res.status === 429 && retryAfter) {
      retryAfterMs = Date.now() + parseInt(retryAfter) * 1000
      return null
    }

    if (!res.ok) return null
    const json = await res.json()
    return json.match ?? json ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matchdayId = parseInt(searchParams.get('matchday') ?? '')
  const group = (searchParams.get('group') ?? 'og') as GroupId

  if (isNaN(matchdayId) || matchdayId < 1) {
    return NextResponse.json({ liveMatches: [] })
  }

  const config = await loadMatchdayConfig(matchdayId)
  const matchIds = getMatchesForMatchday(matchdayId)

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

  const liveMatches: LiveMatchData[] = []

  for (const matchId of matchIds) {
    const fdoId = FDO_MATCH_IDS[matchId]
    if (!fdoId) continue

    const cacheKey = `live:${matchId}`
    let fdoMatch = await kvGet<FdoMatch>(cacheKey)

    if (!fdoMatch) {
      fdoMatch = await fetchFdoMatch(fdoId)
      if (fdoMatch) {
        await kvSetEx(cacheKey, fdoMatch, LIVE_CACHE_TTL)
      }
    }

    if (!fdoMatch) continue

    const status = fdoMatch.status
    if (status !== 'IN_PLAY' && status !== 'PAUSED' && status !== 'FINISHED') continue
    // Only include recently finished (treat FINISHED same as live for the slide)
    // Slide will be hidden by MatchdayDrawer once a configurable time passes post-match

    const scoreHome = fdoMatch.score.fullTime.home ?? fdoMatch.score.halfTime.home ?? 0
    const scoreAway = fdoMatch.score.fullTime.away ?? fdoMatch.score.halfTime.away ?? 0
    const totoNow = currentToto(scoreHome, scoreAway)
    const uitslagNow = `${scoreHome}-${scoreAway}`

    const goals: LiveGoalEvent[] = (fdoMatch.goals ?? []).map((g) => ({
      scorer: g.scorer.name,
      minute: g.minute,
      team: g.team.name.toLowerCase().includes('home') ? 'home' : 'away',
      type: (g.type as LiveGoalEvent['type']) ?? 'REGULAR',
    }))

    // Determine home/away team names for the match (to tag goal teams correctly)
    const match = MATCHES.find((m) => m.id === matchId)
    const fdoGoals: LiveGoalEvent[] = (fdoMatch.goals ?? []).map((g) => {
      const teamName = g.team?.name ?? ''
      const isHome = match
        ? teamName.toLowerCase().includes(match.home.toLowerCase().split(' ')[0].toLowerCase())
        : false
      return {
        scorer: g.scorer.name,
        minute: g.minute,
        team: isHome ? 'home' : 'away',
        type: (g.type as LiveGoalEvent['type']) ?? 'REGULAR',
      }
    })

    // goal scorer names from fdo for fantasy matching
    const goalsByScorer: Record<string, number> = {}
    const assistsByScorer: Record<string, number> = {}
    for (const g of fdoMatch.goals ?? []) {
      const sName = g.scorer.name
      goalsByScorer[sName] = (goalsByScorer[sName] ?? 0) + 1
      if (g.assist?.name) {
        const aName = g.assist.name
        assistsByScorer[aName] = (assistsByScorer[aName] ?? 0) + 1
      }
    }

    const quoteEntry = config?.quotes.find((q) => q.matchId === matchId)
    const totoOdds = quoteEntry?.totoOdds ?? 1
    const uitslagOdds = quoteEntry?.uitslagOdds ?? 1

    const participantRows: LiveParticipantRow[] = groupParticipants.map((p) => {
      const pred = predsByInitials[p.initials]?.[matchId]
      const tokens = pred?.tokens ?? 0
      const toto = pred?.toto ?? null
      const uitslag = pred?.uitslag ?? null

      const totoCorrect = toto === totoNow
      const uitslagCorrect = uitslag === uitslagNow

      const potentialTotoPoints = totoCorrect ? Math.round(tokens * totoOdds * 100) / 100 : 0
      const potentialUitslagPoints = uitslagCorrect ? Math.round(tokens * uitslagOdds * 100) / 100 : 0

      // Fantasy: find squad players from home/away teams, count goals/assists in this match
      const squad: FantasySquad = squadsByInitials[p.initials] ?? {}
      let fantasyGoals = 0
      let fantasyAssists = 0
      let potentialFantasyPoints = 0

      if (match) {
        for (const slot of ALL_SLOTS) {
          const player = squad[slot]
          if (!player) continue
          if (player.country !== match.home && player.country !== match.away) continue
          const g = goalsByScorer[player.name] ?? 0
          const a = assistsByScorer[player.name] ?? 0
          if (g === 0 && a === 0) continue
          const quote = computePlayerQuote(player)
          fantasyGoals += g
          fantasyAssists += a
          potentialFantasyPoints += (g + a) * quote
        }
        potentialFantasyPoints = Math.round(potentialFantasyPoints * 100) / 100
      }

      const totalPotential = Math.round((potentialTotoPoints + potentialUitslagPoints + potentialFantasyPoints) * 100) / 100

      return {
        initials: p.initials,
        name: p.name,
        toto,
        totoCorrect,
        potentialTotoPoints,
        uitslag,
        uitslagCorrect,
        potentialUitslagPoints,
        fantasyGoals,
        fantasyAssists,
        potentialFantasyPoints,
        totalPotential,
      }
    })

    participantRows.sort((a, b) => b.totalPotential - a.totalPotential)

    liveMatches.push({
      matchId,
      status: status as LiveMatchData['status'],
      score: { home: scoreHome, away: scoreAway },
      minute: fdoMatch.minute ?? null,
      goals: fdoGoals,
      participantRows,
    })
  }

  return NextResponse.json({ liveMatches })
}
