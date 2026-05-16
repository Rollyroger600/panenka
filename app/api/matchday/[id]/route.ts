import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { loadMatchdayConfig, saveMatchdayConfig, getOrCreateRotation } from '@/lib/matchday'
import type { MatchdayConfig } from '@/lib/matchday'

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

  const body = await req.json() as Omit<MatchdayConfig, 'matchdayId' | 'savedAt'>
  const config: MatchdayConfig = {
    ...body,
    matchdayId,
    savedAt: new Date().toISOString(),
  }

  await saveMatchdayConfig(config)
  return NextResponse.json({ ok: true })
}
