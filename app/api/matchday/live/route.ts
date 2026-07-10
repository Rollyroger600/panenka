import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSetEx, participantKey } from '@/lib/kv/kv'
import { MATCHES } from '@/lib/data/matches'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import { loadMatchdayConfig, resolveTotoOdds, resolveUitslagOdds, getGroupQuotes } from '@/lib/matchday'
import { getMatchesForMatchday } from '@/lib/data/matchdayMap'
import { ESPN_MATCH_IDS } from '@/lib/data/espnMatchIds'
import { ESPN_PLAYER_MAP } from '@/lib/data/espnPlayerMap'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_MATCH_ODDS } from '@/lib/data/koMatchOdds'
import { computePlayerQuote, normalizeUitslag } from '@/lib/helpers'
import { ALL_SLOTS } from '@/lib/data/slots'
import type { GroupId } from '@/lib/groups'
import type { MatchdayQuote } from '@/lib/matchday'
import type { Prediction, FantasySquad } from '@/store/gameStore'
import type { LiveMatchData, LiveParticipantRow, LiveGoalEvent, LiveBookingEvent, LiveSubstitutionEvent, LivePlayer, LiveMatchStats } from '@/lib/types/matchday'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const DEFAULT_COMPETITION = 'fifa.world'
const LIVE_CACHE_TTL = 30  // seconds

// ─── ESPN types ───────────────────────────────────────────────────────────────

interface EspnPlay {
  clock: { displayValue: string }
  scoringPlay: boolean
  substitution: boolean
  redCard: boolean
  yellowCard: boolean
  penaltyKick: boolean
  ownGoal: boolean
  didScore?: boolean
  didAssist?: boolean
}

interface EspnRosterEntry {
  active: boolean
  starter: boolean
  jersey?: string
  subbedIn?: boolean
  subbedOut?: boolean
  athlete: { displayName: string }
  position?: { name: string; abbreviation: string }
  plays?: EspnPlay[]
}

interface EspnRoster {
  homeAway: 'home' | 'away'
  team: { displayName: string }
  roster?: EspnRosterEntry[]
}

interface EspnStatus {
  type: { description: string; completed: boolean }
  displayClock?: string
  period?: number
}

interface EspnStat {
  name: string
  displayValue: string
}

interface EspnSummary {
  header: {
    competitions: Array<{
      status: EspnStatus
      competitors: Array<{
        homeAway: 'home' | 'away'
        score?: string
        team: {
          displayName: string
          abbreviation?: string
          logos?: Array<{ href: string }>
        }
      }>
      attendance?: number
      venue?: { fullName: string }
    }>
  }
  rosters?: EspnRoster[]
  gameInfo?: {
    venue?: { fullName: string }
    attendance?: number
  }
  boxscore?: {
    teams?: Array<{
      team: { displayName: string }
      statistics?: EspnStat[]
    }>
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normName(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function isReguliereTijdVoorbij(description: string): boolean {
  switch (description) {
    case 'Extra Time':
    case 'Extra Time First Half':
    case 'Extra Time Second Half':
    case 'Extra Time Half Time':
    case 'Overtime':
    case 'Penalty Shootout':
    case 'Penalties':
    case 'After Extra Time':
    case 'After Pen.':
    case 'Final/Penalties':
      return true
    default:
      return false
  }
}

function espnStatusToInternal(description: string): 'IN_PLAY' | 'PAUSED' | 'FINISHED' | null {
  switch (description) {
    case 'In Progress':
    case 'First Half':
    case 'Second Half':
    case 'Extra Time':
    case 'Extra Time First Half':
    case 'Extra Time Second Half':
    case 'Overtime':
    case 'Penalty Shootout':
    case 'Penalties':          return 'IN_PLAY'
    case 'Half Time':
    case 'Halftime':
    case 'End of Period':
    case 'Intermission':
    case 'Extra Time Half Time': return 'PAUSED'
    case 'Full Time':
    case 'Final':
    case 'Final - Loss':
    case 'After Extra Time':
    case 'After Pen.':
    case 'Final/Penalties':    return 'FINISHED'
    default:                   return null
  }
}

function getGoalPhase(clockDisplay: string, isPenaltyKick: boolean): 'regular' | 'extratime' | 'shootout' {
  const s = clockDisplay.replace("'", '').trim()
  if (s.includes('+')) {
    const base = parseInt(s.split('+')[0])
    return base <= 90 ? 'regular' : 'extratime'
  }
  const minute = parseInt(s) || 0
  if (minute <= 90) return 'regular'
  if (minute > 120 && isPenaltyKick) return 'shootout'
  return 'extratime'
}

function parseEspnMinute(displayValue: string): number {
  const s = displayValue.replace("'", '').trim()
  if (s === 'HT') return 45
  if (s.includes('+')) {
    const [base, extra] = s.split('+').map(Number)
    return (base || 0) + (extra || 0)
  }
  return parseInt(s) || 0
}

function getMatchMinute(status: EspnStatus): number | null {
  if (!status.displayClock) return null
  // ESPN displayClock is the overall game clock, e.g. "67:00" in the 67th minute
  // It can also be "67'" or just "67" — extract the leading integer
  const minute = parseInt(status.displayClock)
  return isNaN(minute) ? null : minute
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

// ─── ESPN data extraction ─────────────────────────────────────────────────────

function extractGoals(rosters: EspnRoster[]): {
  goals: LiveGoalEvent[]
  goalsByScorer: Record<string, number>
  assistsByScorer: Record<string, number>
  reguliereScore: { home: number; away: number }
} {
  const goals: LiveGoalEvent[] = []
  const goalsByScorer: Record<string, number> = {}
  const assistsByScorer: Record<string, number> = {}
  const reguliereScore = { home: 0, away: 0 }
  // minute+team → assister name + phase, for linking to goals
  const assistByMinuteTeam: Record<string, { name: string; phase: 'regular' | 'extratime' | 'shootout' }> = {}

  for (const roster of rosters) {
    const team = roster.homeAway
    for (const player of roster.roster ?? []) {
      const name = player.athlete?.displayName ?? ''
      for (const play of player.plays ?? []) {
        if (play.didAssist) {
          const clockDisplay = play.clock?.displayValue ?? '0'
          const min = parseEspnMinute(clockDisplay)
          const phase = getGoalPhase(clockDisplay, false)
          if (phase !== 'shootout') {
            assistsByScorer[name] = (assistsByScorer[name] ?? 0) + 1
          }
          assistByMinuteTeam[`${min}-${team}`] = { name, phase }
        }
      }
    }
  }

  for (const roster of rosters) {
    const team = roster.homeAway
    for (const player of roster.roster ?? []) {
      const name = player.athlete?.displayName ?? ''
      for (const play of player.plays ?? []) {
        if (play.didScore) {
          const clockDisplay = play.clock?.displayValue ?? '0'
          const minute = parseEspnMinute(clockDisplay)
          const phase = getGoalPhase(clockDisplay, play.penaltyKick ?? false)
          const assistEntry = assistByMinuteTeam[`${minute}-${team}`]
          const assister = assistEntry?.name

          goals.push({
            scorer: name,
            minute,
            team,
            type: play.ownGoal ? 'OWN' : play.penaltyKick ? 'PENALTY' : 'REGULAR',
            phase,
            ...(assister ? { assister } : {}),
          })

          // Reguliere score: alleen goals in reguliere tijd (90' + blessuretijd)
          if (phase === 'regular') {
            const isOwn = play.ownGoal ?? false
            if (team === 'home') { isOwn ? reguliereScore.away++ : reguliereScore.home++ }
            else                { isOwn ? reguliereScore.home++ : reguliereScore.away++ }
          }

          // Fantasy: reguliere + verlenging, geen strafschoppenserie
          if (phase !== 'shootout') {
            goalsByScorer[name] = (goalsByScorer[name] ?? 0) + 1
          }
        }
      }
    }
  }

  goals.sort((a, b) => a.minute - b.minute)
  return { goals, goalsByScorer, assistsByScorer, reguliereScore }
}

function extractBookings(rosters: EspnRoster[]): LiveBookingEvent[] {
  const bookings: LiveBookingEvent[] = []
  for (const roster of rosters) {
    const team = roster.homeAway
    for (const player of roster.roster ?? []) {
      const name = player.athlete?.displayName ?? ''
      for (const play of player.plays ?? []) {
        if (play.yellowCard || play.redCard) {
          bookings.push({
            minute: parseEspnMinute(play.clock?.displayValue ?? '0'),
            player: name,
            team,
            card: play.redCard ? 'RED' : 'YELLOW',
          })
        }
      }
    }
  }
  return bookings.sort((a, b) => a.minute - b.minute)
}

function extractSubs(rosters: EspnRoster[]): LiveSubstitutionEvent[] {
  const subs: LiveSubstitutionEvent[] = []

  for (const roster of rosters) {
    const team = roster.homeAway
    const ins:  Array<{ name: string; minute: number }> = []
    const outs: Array<{ name: string; minute: number }> = []

    for (const player of roster.roster ?? []) {
      const name = player.athlete?.displayName ?? ''
      const subPlay = player.plays?.find((p) => p.substitution)
      if (!subPlay) continue
      const minute = parseEspnMinute(subPlay.clock?.displayValue ?? '0')
      if (player.subbedIn)  ins.push({ name, minute })
      if (player.subbedOut) outs.push({ name, minute })
    }

    ins.sort((a, b) => a.minute - b.minute)
    outs.sort((a, b) => a.minute - b.minute)

    // Group by minute and pair in/out players
    const byMinute = new Map<number, { ins: string[]; outs: string[] }>()
    for (const p of ins) {
      if (!byMinute.has(p.minute)) byMinute.set(p.minute, { ins: [], outs: [] })
      byMinute.get(p.minute)!.ins.push(p.name)
    }
    for (const p of outs) {
      if (!byMinute.has(p.minute)) byMinute.set(p.minute, { ins: [], outs: [] })
      byMinute.get(p.minute)!.outs.push(p.name)
    }

    for (const [minute, { ins: inPlayers, outs: outPlayers }] of byMinute) {
      const count = Math.min(inPlayers.length, outPlayers.length)
      for (let i = 0; i < count; i++) {
        subs.push({ minute, playerIn: inPlayers[i], playerOut: outPlayers[i], team })
      }
    }
  }

  return subs.sort((a, b) => a.minute - b.minute)
}

function extractLineups(rosters: EspnRoster[]): {
  homeLineup: LivePlayer[]
  awayLineup: LivePlayer[]
  homeBench:  LivePlayer[]
  awayBench:  LivePlayer[]
} {
  const homeLineup: LivePlayer[] = []
  const awayLineup: LivePlayer[] = []
  const homeBench:  LivePlayer[] = []
  const awayBench:  LivePlayer[] = []

  for (const roster of rosters) {
    const isHome = roster.homeAway === 'home'
    for (const player of roster.roster ?? []) {
      const entry: LivePlayer = {
        name: player.athlete?.displayName ?? '',
        position: player.position?.name ?? null,
        shirtNumber: player.jersey ? parseInt(player.jersey) : null,
      }
      if (player.starter) {
        (isHome ? homeLineup : awayLineup).push(entry)
      } else if (player.active) {
        (isHome ? homeBench : awayBench).push(entry)
      }
    }
  }

  return { homeLineup, awayLineup, homeBench, awayBench }
}

function extractStats(
  boxscoreTeams: Array<{ team: { displayName: string }; statistics?: EspnStat[] }> | undefined,
  rosters: EspnRoster[]
): { homeStats: LiveMatchStats | null; awayStats: LiveMatchStats | null } {
  if (!boxscoreTeams?.length) return { homeStats: null, awayStats: null }

  const homeTeamName = rosters.find((r) => r.homeAway === 'home')?.team.displayName
  const awayTeamName = rosters.find((r) => r.homeAway === 'away')?.team.displayName

  function parseStat(stats: EspnStat[] | undefined, name: string): number | null {
    const s = stats?.find((x) => x.name === name)
    if (!s) return null
    const v = parseFloat(s.displayValue)
    return isNaN(v) ? null : v
  }

  function buildStats(stats: EspnStat[] | undefined): LiveMatchStats | null {
    if (!stats?.length) return null
    return {
      possession:    parseStat(stats, 'possessionPct'),
      shots:         parseStat(stats, 'totalShots'),
      shotsOnTarget: parseStat(stats, 'shotsOnTarget'),
      corners:       parseStat(stats, 'wonCorners'),
      fouls:         parseStat(stats, 'foulsCommitted'),
      yellowCards:   parseStat(stats, 'yellowCards'),
      redCards:      parseStat(stats, 'redCards'),
    }
  }

  const homeTeam = boxscoreTeams.find((t) => t.team.displayName === homeTeamName)
  const awayTeam = boxscoreTeams.find((t) => t.team.displayName === awayTeamName)

  // Fallback: als teamnamen niet matchen, gebruik volgorde (index 0 = home, 1 = away)
  const homeSrc = homeTeam ?? boxscoreTeams[0]
  const awaySrc = awayTeam ?? boxscoreTeams[1]

  return {
    homeStats: buildStats(homeSrc?.statistics),
    awayStats: buildStats(awaySrc?.statistics),
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchEspnSummary(eventId: number, competition: string): Promise<EspnSummary | null> {
  try {
    const res = await fetch(
      `${ESPN_BASE}/${competition}/summary?event=${eventId}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return null
    return await res.json() as EspnSummary
  } catch {
    return null
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

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

  const hasKoMatches = matchIds.some((id) => id > 72)

  const [allPredictions, allSquads, koMatchTeams] = await Promise.all([
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
    hasKoMatches
      ? kvGet<Record<number, { home: string; away: string; kickoff?: string }>>('ko_match_teams')
      : Promise.resolve(null),
  ])

  const predsByInitials = Object.fromEntries(allPredictions.map((x) => [x.initials, x.preds]))
  const squadsByInitials = Object.fromEntries(allSquads.map((x) => [x.initials, x.squad]))

  const liveMatches: LiveMatchData[] = []

  // Test-override via .env.local: ESPN_TEST_MATCH=internalId:espnEventId
  // Optioneel: ESPN_TEST_COMPETITION=esp.1 (default: fifa.world)
  const effectiveIds: Record<number, number> = { ...ESPN_MATCH_IDS }
  const testMatch = process.env.ESPN_TEST_MATCH
  if (testMatch) {
    const [internalStr, espnStr] = testMatch.split(':')
    const internal = parseInt(internalStr)
    const espnId   = parseInt(espnStr)
    if (!isNaN(internal) && !isNaN(espnId)) effectiveIds[internal] = espnId
  }
  const competition = process.env.ESPN_TEST_COMPETITION ?? DEFAULT_COMPETITION

  for (const matchId of matchIds) {
    const espnId = effectiveIds[matchId]
    if (!espnId) continue

    const cacheKey = `live:espn:${matchId}`
    let summary = await kvGet<EspnSummary>(cacheKey)

    if (!summary) {
      summary = await fetchEspnSummary(espnId, competition)
      if (summary) {
        await kvSetEx(cacheKey, summary, LIVE_CACHE_TTL)
      }
    }

    if (!summary) continue

    const comp = summary.header?.competitions?.[0]
    if (!comp) continue

    const statusDesc = comp.status?.type?.description ?? ''
    const internalStatus = espnStatusToInternal(statusDesc)
    if (!internalStatus) continue
    const regulierVoorbij = isReguliereTijdVoorbij(statusDesc)

    const homeComp = comp.competitors?.find((c) => c.homeAway === 'home')
    const awayComp = comp.competitors?.find((c) => c.homeAway === 'away')
    const scoreHome = parseInt(homeComp?.score ?? '0') || 0
    const scoreAway = parseInt(awayComp?.score ?? '0') || 0

    const homeTeamAbbr = homeComp?.team.abbreviation ?? null
    const awayTeamAbbr = awayComp?.team.abbreviation ?? null
    const homeTeamLogo = homeComp?.team.logos?.[0]?.href ?? null
    const awayTeamLogo = awayComp?.team.logos?.[0]?.href ?? null

    const rosters = summary.rosters ?? []
    const { goals, goalsByScorer, assistsByScorer, reguliereScore } = extractGoals(rosters)
    const bookings      = extractBookings(rosters)
    const substitutions = extractSubs(rosters)
    const { homeLineup, awayLineup, homeBench, awayBench } = extractLineups(rosters)

    // Normalized lookup: strip accents + lowercase so "Quiñones" matches "Quinones" etc.
    const normGoals:   Record<string, number> = {}
    const normAssists: Record<string, number> = {}
    for (const [k, v] of Object.entries(goalsByScorer))   normGoals[normName(k)]   = v
    for (const [k, v] of Object.entries(assistsByScorer)) normAssists[normName(k)] = v

    function lookupGoals(player: { id: number; name: string; middleName: string }): number {
      const espnName = ESPN_PLAYER_MAP[player.id]
      return (espnName != null ? goalsByScorer[espnName] ?? null : null)
        ?? goalsByScorer[player.middleName]
        ?? goalsByScorer[player.name]
        ?? normGoals[normName(player.middleName)]
        ?? normGoals[normName(player.name)]
        ?? 0
    }
    function lookupAssists(player: { id: number; name: string; middleName: string }): number {
      const espnName = ESPN_PLAYER_MAP[player.id]
      return (espnName != null ? assistsByScorer[espnName] ?? null : null)
        ?? assistsByScorer[player.middleName]
        ?? assistsByScorer[player.name]
        ?? normAssists[normName(player.middleName)]
        ?? normAssists[normName(player.name)]
        ?? 0
    }

    // Toto/uitslag beoordeling op basis van de reguliere stand (90' + blessuretijd),
    // niet de stand na verlenging/penalties
    const totoNow    = currentToto(reguliereScore.home, reguliereScore.away)
    const uitslagNow = `${reguliereScore.home} - ${reguliereScore.away}`
    const staticMatch = MATCHES.find((m) => m.id === matchId)
    const koTeams = matchId > 72 ? koMatchTeams?.[matchId] : null
    const match = staticMatch && koTeams
      ? { ...staticMatch, home: koTeams.home, away: koTeams.away }
      : staticMatch

    const quoteEntry = config ? getGroupQuotes(config, group).find((q) => q.matchId === matchId) : undefined
    const staticOdds = matchId <= 72 ? MATCH_ODDS[matchId] : KO_MATCH_ODDS[matchId]

    // Merge MATCH_ODDS (per-outcome toto + per-score uitslag) with admin config.
    // Admin per-outcome values override MATCH_ODDS when explicitly set.
    const effectiveQuote: MatchdayQuote | undefined = (() => {
      if (!staticOdds && !quoteEntry) return undefined
      return {
        matchId,
        totoOdds1: quoteEntry?.totoOdds1 || staticOdds?.home,
        totoOddsX: quoteEntry?.totoOddsX || staticOdds?.draw,
        totoOdds2: quoteEntry?.totoOdds2 || staticOdds?.away,
        uitslagOddsMap: quoteEntry?.uitslagOddsMap ?? staticOdds?.scores,
        uitslagOddsFallback: quoteEntry?.uitslagOddsFallback,
      }
    })()

    const participantRows: LiveParticipantRow[] = groupParticipants.map((p) => {
      const pred   = predsByInitials[p.initials]?.[matchId]
      const tokens = (pred?.tokens ?? 1) + (group === 'asc' ? (p.ascBonusTokens?.[matchId] ?? 0) : 0)
      const toto   = pred?.toto   ?? null
      const uitslag = pred?.uitslag ? normalizeUitslag(pred.uitslag) : null

      const totoCorrect    = toto === totoNow
      const uitslagCorrect = uitslag === uitslagNow
      // Als de reguliere tijd voorbij is, behandel de reguliere stand als definitief
      const effectiveStatus = regulierVoorbij ? 'FINISHED' : internalStatus
      const { impossible: uitslagImpossible, possible: uitslagPossible } =
        computeUitslagState(uitslag, reguliereScore.home, reguliereScore.away, effectiveStatus)

      const totoOdds    = resolveTotoOdds(effectiveQuote, toto)
      const uitslagOdds = resolveUitslagOdds(effectiveQuote, uitslag)

      const potentialTotoPoints    = totoCorrect    ? Math.round(tokens * totoOdds    * 100) / 100 : 0
      const potentialUitslagPoints = uitslagCorrect ? Math.round(tokens * uitslagOdds * 100) / 100 : 0

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
              goals:   lookupGoals(player),
              assists: lookupAssists(player),
            }
          } else if (player.country === match.away && !fantasyAwayPlayer) {
            fantasyAwayPlayer = {
              name: player.name,
              goals:   lookupGoals(player),
              assists: lookupAssists(player),
            }
          }
        }
      }

      let fantasyGoals   = 0
      let fantasyAssists = 0
      let potentialFantasyPoints = 0
      for (const fp of [fantasyHomePlayer, fantasyAwayPlayer]) {
        if (!fp || (fp.goals === 0 && fp.assists === 0)) continue
        const playerEntry = Object.values(squad).find((sp) => sp?.name === fp.name)
        if (!playerEntry) continue
        const quote = computePlayerQuote(playerEntry)
        fantasyGoals   += fp.goals
        fantasyAssists += fp.assists
        potentialFantasyPoints += (fp.goals + fp.assists) * quote
      }
      potentialFantasyPoints = Math.round(potentialFantasyPoints * 100) / 100

      const totalPotential = Math.round(
        (potentialTotoPoints + potentialUitslagPoints + potentialFantasyPoints) * 100
      ) / 100

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

    liveMatches.push({
      matchId,
      status:  internalStatus,
      score:   { home: scoreHome, away: scoreAway },
      minute:  getMatchMinute(comp.status),
      goals,
      participantRows,
      venue:      summary.gameInfo?.venue?.fullName ?? comp.venue?.fullName ?? null,
      attendance: summary.gameInfo?.attendance ?? comp.attendance ?? null,
      bookings,
      substitutions,
      penalties:    [],   // ESPN heeft geen aparte penalty-shootout lijst
      homeLineup,
      awayLineup,
      homeBench,
      awayBench,
      homeFormation: null,  // ESPN geeft formatie niet als string
      awayFormation: null,
      ...extractStats(summary.boxscore?.teams, rosters),
      homeTeamName: match?.home ?? null,
      awayTeamName: match?.away ?? null,
      homeTeamAbbr,
      awayTeamAbbr,
      homeTeamLogo,
      awayTeamLogo,
    })
  }

  return NextResponse.json({ liveMatches })
}
