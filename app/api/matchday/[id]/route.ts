import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { loadMatchdayConfig, saveMatchdayConfig, getOrCreateRotation } from '@/lib/matchday'
import type { MatchdayConfig, MatchdayQuote, CustomBet } from '@/lib/matchday'
import type { GroupId } from '@/lib/groups'

async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin')?.value === 'true'
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchdayId = parseInt(id)
  if (isNaN(matchdayId) || matchdayId < 1 || matchdayId > 27) {
    return NextResponse.json({ error: 'Invalid matchday' }, { status: 400 })
  }

  const config = await loadMatchdayConfig(matchdayId)
  if (!config) {
    return NextResponse.json({ config: null }, { status: 200 })
  }

  // Load rotations for both groups
  const [rotationOg, rotationAsc] = await Promise.all([
    getOrCreateRotation('og'),
    getOrCreateRotation('asc'),
  ])

  return NextResponse.json({ config, rotationOg, rotationAsc })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const matchdayId = parseInt(id)
  if (isNaN(matchdayId) || matchdayId < 1 || matchdayId > 27) {
    return NextResponse.json({ error: 'Invalid matchday' }, { status: 400 })
  }

  const body = await req.json() as {
    group: GroupId
    quotes: MatchdayQuote[]
    potStand: number
    customBets?: CustomBet[]
  }
  const existing = await loadMatchdayConfig(matchdayId)
  const groupUpdate: Record<string, unknown> = {
    ...(existing?.[body.group] ?? { potStand: 0 }),
    potStand: body.potStand,
    quotes: body.quotes,
  }
  if (body.customBets !== undefined) {
    groupUpdate.customBets = body.customBets
  }
  const config: MatchdayConfig = {
    matchdayId,
    ...(existing?.quotes ? { quotes: existing.quotes } : {}),
    og: existing?.og ?? { potStand: 0 },
    asc: existing?.asc ?? { potStand: 0 },
    savedAt: new Date().toISOString(),
    [body.group]: groupUpdate,
  }

  await saveMatchdayConfig(config)
  return NextResponse.json({ ok: true })
}
