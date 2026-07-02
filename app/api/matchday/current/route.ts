import { NextResponse } from 'next/server'
import { loadKoMatchTeams } from '@/app/actions/admin'
import { getCurrentMatchday } from '@/lib/data/matchdayMap'

export async function GET() {
  const koMatchTeams = await loadKoMatchTeams()
  const kickoffOverrides = Object.fromEntries(
    Object.entries(koMatchTeams)
      .filter(([, v]) => v.kickoff)
      .map(([id, v]) => [id, v.kickoff as string])
  )
  const matchdayId = getCurrentMatchday(kickoffOverrides)
  return NextResponse.json({ matchdayId })
}
