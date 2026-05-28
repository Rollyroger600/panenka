import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chatUpdatePoll } from '@/lib/kv/chat'
import type { GroupId } from '@/lib/groups'

function parseGroup(value: unknown): GroupId | null {
  if (value === 'og' || value === 'asc') return value
  return null
}

export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { group: groupRaw, msgId, optionIndex } = await req.json()
  const group = parseGroup(groupRaw)
  if (!group || !msgId || optionIndex === undefined || typeof optionIndex !== 'number') {
    return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 })
  }

  const pollOptions = await chatUpdatePoll(group, msgId, optionIndex, initials)
  if (!pollOptions) return NextResponse.json({ error: 'Poll niet gevonden' }, { status: 404 })

  return NextResponse.json({ pollOptions })
}
