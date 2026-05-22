import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSetEx, participantKey } from '@/lib/kv/kv'
import { MATCHES } from '@/lib/data/matches'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import { loadMatchdayConfig } from '@/lib/matchday'
import { getMatchesForMatchday } from '@/lib/data/matchdayMap'
import { FDO_MATCH_IDS } from '@/lib/data/fdoMatchIds'
import { computePlayerQuote } from '@/lib/helpers'
import { ALL_SLOTS } from '@/lib/data/slots'
import type { GroupId } from '@/lib/groups'
import type { Prediction, FantasySquad } from '@/store/gameStore'
import type { LiveMatchData, LiveParticipantRow, LiveGoalEvent, LiveBookingEvent, LiveSubstitutionEvent, LivePenaltyEvent, LivePlayer, LiveMatchStats } from '@/lib/types/matchday'

const FDO_BASE = 'https://api.football-data.org/v4'
const LIVE_CACHE_TTL = 25  // seconds

interface FdoTeam {
  id: number
  name: string
  formation: string | null
  lineup: Array<{ player: { name: string }; position: string | null; shirtNumber: number | null }>
  bench:   Array<{ player: { name: string }; position: string | null; shirtNumber: number | null }>
  statistics?: Array<{ type: string; value: number | null }>
}

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
  venue?: string
  attendance?: number | null
  bookings?: Array<{ minute: number; team: { id: number; name: string }; player: { name: string }; card: string }>
  substitutions?: Array<{ minute: number; team: { id: number; name: string }; playerOut: { name: string }; playerIn: { name: string } }>
  penalties?: Array<{ player: { name: string }; team: { id: number; name: string }; scored: boolean }>
  homeTeam?: FdoTeam
  awayTeam?: FdoTeam
}

function currentToto(home: number, away: number): '1' | 'X' | '2' {
  if (home > away) return '1'
  if (away > home) return '2'
  return 'X'
}

function parseUitslagScore(s: string): { h: number; a: number } | null {
  const parts = s.split('-').map(Number)
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return { h: parts[0], a: parts[1] }
}

function computeUitslagState(
  uitslag: string | null,
  liveHome: number,
  liveAway: number,
  status: string
): { impossible: boolean; possible: boolean } {
  if (!uitslag) return { impossible: false, possible: false }
  const p = parseUitslagScore(uitslag)
  if (!p) return { impossible: false, possible: false }
  if (status === 'FINISHED') {
    const correct = p.h === liveHome && p.a === liveAway
    return { impossible: !correct, possible: false }
  }
  const impossible = p.h < liveHome || p.a < liveAway
  const possible = !impossible && !(p.h === liveHome && p.a === liveAway)
  return { impossible, possible }
}

function extractStat(stats: Array<{ type: string; value: number | null }> | undefined, type: string): number | null {
  return stats?.find((s) => s.type === type)?.value ?? null
}

function normalizeCard(raw: string): 'YELLOW' | 'RED' | 'YELLOW_RED' {
  if (raw === 'RED_CARD') return 'RED'
  if (raw === 'YELLOW_RED_CARD') return 'YELLOW_RED'
  return 'YELLOW'
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

  // Local-only test mapping via .env.local (never deployed)
  const effectiveIds: Record<number, number> = { ...FDO_MATCH_IDS }
  const testMatch = process.env.FDO_TEST_MATCH
  if (testMatch) {
    const [internalStr, fdoStr] = testMatch.split(':')
    const internal = parseInt(internalStr)
    const fdo = parseInt(fdoStr)
    if (!isNaN(internal) && !isNaN(fdo)) effectiveIds[internal] = fdo
  }

  for (const matchId of matchIds) {
    const fdoId = effectiveIds[matchId]
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
      const { impossible: uitslagImpossible, possible: uitslagPossible } =
        computeUitslagState(uitslag, scoreHome, scoreAway, status)

      const potentialTotoPoints = totoCorrect ? Math.round(tokens * totoOdds * 100) / 100 : 0
      const potentialUitslagPoints = uitslagCorrect ? Math.round(tokens * uitslagOdds * 100) / 100 : 0

      // Fantasy: find home/away player separately (max 1 per country per spelregel)
      const squad: FantasySquad = squadsByInitials[p.initials] ?? {}
      let fantasyHomePlayer: { name: string; goals: number; assists: number } | null = null
      let fantasyAwayPlayer: { name: string; goals: number; assists: number } | null = null

      if (match) {
        for (const slot of ALL_SLOTS) {
          const player = squad[slot]
          if (!player) continue
          if (player.country === match.home && !fantasyHomePlayer) {
            fantasyHomePlayer = {
              name: player.name,
              goals: goalsByScorer[player.name] ?? 0,
              assists: assistsByScorer[player.name] ?? 0,
            }
          } else if (player.country === match.away && !fantasyAwayPlayer) {
            fantasyAwayPlayer = {
              name: player.name,
              goals: goalsByScorer[player.name] ?? 0,
              assists: assistsByScorer[player.name] ?? 0,
            }
          }
        }
      }

      let fantasyGoals = 0
      let fantasyAssists = 0
      let potentialFantasyPoints = 0
      for (const fp of [fantasyHomePlayer, fantasyAwayPlayer]) {
        if (!fp || (fp.goals === 0 && fp.assists === 0)) continue
        const playerEntry = Object.values(squad).find((sp) => sp?.name === fp.name)
        if (!playerEntry) continue
        const quote = computePlayerQuote(playerEntry)
        fantasyGoals += fp.goals
        fantasyAssists += fp.assists
        potentialFantasyPoints += (fp.goals + fp.assists) * quote
      }
      potentialFantasyPoints = Math.round(potentialFantasyPoints * 100) / 100

      const totalPotential = Math.round((potentialTotoPoints + potentialUitslagPoints + potentialFantasyPoints) * 100) / 100

      return {
        initials: p.initials,
        name: p.name,
        tokens,
        toto,
        totoCorrect,
        totoOdds,
        potentialTotoPoints,
        uitslag,
        uitslagCorrect,
        uitslagPossible,
        uitslagImpossible,
        uitslagOdds,
        potentialUitslagPoints,
        fantasyGoals,
        fantasyAssists,
        potentialFantasyPoints,
        fantasyHomePlayer,
        fantasyAwayPlayer,
        totalPotential,
      }
    })

    participantRows.sort((a, b) => {
      if (b.totalPotential !== a.totalPotential) return b.totalPotential - a.totalPotential
      if (a.totalPotential === 0) {
        const remA = (a.uitslag && !a.uitslagImpossible && !a.uitslagCorrect ? 1 : 0)
          + (a.fantasyHomePlayer != null ? 1 : 0)
          + (a.fantasyAwayPlayer != null ? 1 : 0)
        const remB = (b.uitslag && !b.uitslagImpossible && !b.uitslagCorrect ? 1 : 0)
          + (b.fantasyHomePlayer != null ? 1 : 0)
          + (b.fantasyAwayPlayer != null ? 1 : 0)
        return remB - remA
      }
      return 0
    })

    // New fields from FDO
    const homeTeamId = fdoMatch.homeTeam?.id
    const isHomeTeam = (teamId: number) => teamId === homeTeamId

    const venue = fdoMatch.venue ?? null
    const attendance = fdoMatch.attendance ?? null

    const bookings: LiveBookingEvent[] = (fdoMatch.bookings ?? []).map((b) => ({
      minute: b.minute,
      player: b.player.name,
      team: isHomeTeam(b.team.id) ? 'home' : 'away',
      card: normalizeCard(b.card),
    }))

    const substitutions: LiveSubstitutionEvent[] = (fdoMatch.substitutions ?? []).map((s) => ({
      minute: s.minute,
      playerOut: s.playerOut.name,
      playerIn: s.playerIn.name,
      team: isHomeTeam(s.team.id) ? 'home' : 'away',
    }))

    const penalties: LivePenaltyEvent[] = (fdoMatch.penalties ?? []).map((p) => ({
      player: p.player.name,
      team: isHomeTeam(p.team.id) ? 'home' : 'away',
      scored: p.scored,
    }))

    const mapPlayer = (e: { player: { name: string }; position: string | null; shirtNumber: number | null }): LivePlayer => ({
      name: e.player.name,
      position: e.position ?? null,
      shirtNumber: e.shirtNumber ?? null,
    })

    const homeLineup = (fdoMatch.homeTeam?.lineup ?? []).map(mapPlayer)
    const awayLineup = (fdoMatch.awayTeam?.lineup ?? []).map(mapPlayer)
    const homeBench  = (fdoMatch.homeTeam?.bench ?? []).map(mapPlayer)
    const awayBench  = (fdoMatch.awayTeam?.bench ?? []).map(mapPlayer)
    const homeFormation = fdoMatch.homeTeam?.formation ?? null
    const awayFormation = fdoMatch.awayTeam?.formation ?? null

    const homeStats: LiveMatchStats | null = fdoMatch.homeTeam?.statistics ? {
      possession:    extractStat(fdoMatch.homeTeam.statistics, 'ball_possession'),
      shots:         extractStat(fdoMatch.homeTeam.statistics, 'total_shots'),
      shotsOnTarget: extractStat(fdoMatch.homeTeam.statistics, 'shots_on_goal'),
      corners:       extractStat(fdoMatch.homeTeam.statistics, 'corner_kicks'),
      fouls:         extractStat(fdoMatch.homeTeam.statistics, 'fouls'),
      yellowCards:   extractStat(fdoMatch.homeTeam.statistics, 'yellow_cards'),
      redCards:      extractStat(fdoMatch.homeTeam.statistics, 'red_cards'),
    } : null

    const awayStats: LiveMatchStats | null = fdoMatch.awayTeam?.statistics ? {
      possession:    extractStat(fdoMatch.awayTeam.statistics, 'ball_possession'),
      shots:         extractStat(fdoMatch.awayTeam.statistics, 'total_shots'),
      shotsOnTarget: extractStat(fdoMatch.awayTeam.statistics, 'shots_on_goal'),
      corners:       extractStat(fdoMatch.awayTeam.statistics, 'corner_kicks'),
      fouls:         extractStat(fdoMatch.awayTeam.statistics, 'fouls'),
      yellowCards:   extractStat(fdoMatch.awayTeam.statistics, 'yellow_cards'),
      redCards:      extractStat(fdoMatch.awayTeam.statistics, 'red_cards'),
    } : null

    liveMatches.push({
      matchId,
      status: status as LiveMatchData['status'],
      score: { home: scoreHome, away: scoreAway },
      minute: fdoMatch.minute ?? null,
      goals: fdoGoals,
      participantRows,
      venue,
      attendance,
      bookings,
      substitutions,
      penalties,
      homeLineup,
      awayLineup,
      homeBench,
      awayBench,
      homeFormation,
      awayFormation,
      homeStats,
      awayStats,
    })
  }

  return NextResponse.json({ liveMatches })
}
