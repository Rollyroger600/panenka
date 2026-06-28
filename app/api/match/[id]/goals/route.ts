import { NextRequest, NextResponse } from 'next/server'
import { ESPN_MATCH_IDS } from '@/lib/data/espnMatchIds'
import type { LiveGoalEvent } from '@/lib/types/matchday'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const COMPETITION = process.env.ESPN_TEST_COMPETITION ?? 'fifa.world'

interface EspnPlay {
  clock: { displayValue: string }
  didScore?: boolean
  didAssist?: boolean
  ownGoal: boolean
  penaltyKick: boolean
}

interface EspnRosterEntry {
  athlete: { displayName: string }
  plays?: EspnPlay[]
}

interface EspnRoster {
  homeAway: 'home' | 'away'
  roster?: EspnRosterEntry[]
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

function parseMinute(displayValue: string): number {
  const s = displayValue.replace("'", '').trim()
  if (s === 'HT') return 45
  if (s.includes('+')) {
    const [base, extra] = s.split('+').map(Number)
    return (base || 0) + (extra || 0)
  }
  return parseInt(s) || 0
}

function extractGoals(rosters: EspnRoster[]): LiveGoalEvent[] {
  const goals: LiveGoalEvent[] = []
  const assistByMinuteTeam: Record<string, string> = {}

  for (const roster of rosters) {
    const team = roster.homeAway
    for (const player of roster.roster ?? []) {
      const name = player.athlete?.displayName ?? ''
      for (const play of player.plays ?? []) {
        if (play.didAssist) {
          const min = parseMinute(play.clock?.displayValue ?? '0')
          assistByMinuteTeam[`${min}-${team}`] = name
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
          const minute = parseMinute(clockDisplay)
          const assister = assistByMinuteTeam[`${minute}-${team}`]
          goals.push({
            scorer: name,
            minute,
            team,
            type: play.ownGoal ? 'OWN' : play.penaltyKick ? 'PENALTY' : 'REGULAR',
            phase: getGoalPhase(clockDisplay, play.penaltyKick ?? false),
            ...(assister ? { assister } : {}),
          })
        }
      }
    }
  }

  goals.sort((a, b) => a.minute - b.minute)
  return goals
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const matchId = parseInt(id)
  if (isNaN(matchId)) return NextResponse.json({ goals: [] })

  const espnId = ESPN_MATCH_IDS[matchId]
  if (!espnId) return NextResponse.json({ goals: [] })

  try {
    const res = await fetch(
      `${ESPN_BASE}/${COMPETITION}/summary?event=${espnId}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ goals: [] })

    const summary = await res.json()
    const goals = extractGoals(summary.rosters ?? [])
    return NextResponse.json({ goals })
  } catch {
    return NextResponse.json({ goals: [] })
  }
}
