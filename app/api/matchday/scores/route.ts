import { NextRequest, NextResponse } from 'next/server'
import { kvGet } from '@/lib/kv/kv'
import { computeMatchdayScores } from '@/lib/matchday'
import type { GroupId } from '@/lib/groups'
import type { MatchResult, FantasyStats } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matchdayId = parseInt(searchParams.get('matchday') ?? '')
  const group = (searchParams.get('group') ?? 'og') as GroupId

  if (isNaN(matchdayId) || matchdayId < 1 || matchdayId > 27) {
    return NextResponse.json({ error: 'Invalid matchday' }, { status: 400 })
  }

  const [results, koResults, fantasyStats] = await Promise.all([
    kvGet<Record<number, MatchResult>>('results'),
    kvGet<Record<string, string[]>>('ko_results'),
    kvGet<FantasyStats>('fantasy_stats'),
  ])

  const rows = await computeMatchdayScores(
    matchdayId,
    group,
    results ?? {},
    koResults ?? {},
    fantasyStats ?? {},
  )

  return NextResponse.json({ rows })
}
