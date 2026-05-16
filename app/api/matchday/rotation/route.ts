import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrCreateRotation, saveRotation } from '@/lib/matchday'
import type { GroupId } from '@/lib/groups'

async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin')?.value === 'true'
}

export async function GET() {
  const [og, asc] = await Promise.all([
    getOrCreateRotation('og'),
    getOrCreateRotation('asc'),
  ])
  return NextResponse.json({ og, asc })
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { group: GroupId; rotation: string[] }
  await saveRotation(body.group, body.rotation)
  return NextResponse.json({ ok: true })
}
