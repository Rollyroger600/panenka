import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chatUpdateReactions, chatGetAllMessages } from '@/lib/kv/chat'

// POST /api/chat/react
// Body: { msgId, emoji }
// Toggles emoji reaction for the current participant
export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { msgId, emoji } = await req.json()
  if (!msgId || !emoji) {
    return NextResponse.json({ error: 'Ontbrekende parameters' }, { status: 400 })
  }

  // Find the message
  const all = await chatGetAllMessages()
  const msg = all.find((m) => m.id === msgId)
  if (!msg) {
    return NextResponse.json({ error: 'Bericht niet gevonden' }, { status: 404 })
  }

  const reactions = { ...msg.reactions }
  const current = reactions[emoji] ?? []

  if (current.includes(initials)) {
    // Remove reaction
    const next = current.filter((i) => i !== initials)
    if (next.length === 0) {
      delete reactions[emoji]
    } else {
      reactions[emoji] = next
    }
  } else {
    reactions[emoji] = [...current, initials]
  }

  await chatUpdateReactions(msgId, reactions)
  return NextResponse.json({ reactions })
}
