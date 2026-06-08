import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chatSetRead, chatGetReadMap } from '@/lib/kv/chat'
import type { GroupId } from '@/lib/groups'

function parseGroup(value: string | null | undefined): GroupId | null {
  if (value === 'og' || value === 'asc') return value
  return null
}

// GET /api/chat/read?group=<og|asc>
export async function GET(req: NextRequest) {
  const group = parseGroup(req.nextUrl.searchParams.get('group'))
  if (!group) return NextResponse.json({ readMap: {} })
  const readMap = await chatGetReadMap(group)
  return NextResponse.json({ readMap })
}

// POST /api/chat/read — markeer berichten als gelezen tot en met ts
export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body = await req.json()
  const { group: groupRaw, ts } = body
  const group = parseGroup(groupRaw)
  if (!group || typeof ts !== 'number') {
    return NextResponse.json({ error: 'Ontbrekende parameters' }, { status: 400 })
  }

  await chatSetRead(group, initials, ts)
  return NextResponse.json({ ok: true })
}
