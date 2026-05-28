import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chatGetMessages, chatGetRecent, chatAddMessage } from '@/lib/kv/chat'
import { sendPushToGroup } from '@/lib/push'
import type { ChatMessage } from '@/lib/types/chat'
import type { GroupId } from '@/lib/groups'

function parseGroup(value: string | null | undefined): GroupId | null {
  if (value === 'og' || value === 'asc') return value
  return null
}

// GET /api/chat/messages?since=<ts>&limit=<n>&group=<og|asc>
export async function GET(req: NextRequest) {
  try {
    const group = parseGroup(req.nextUrl.searchParams.get('group'))
    if (!group) return NextResponse.json({ error: 'Ontbrekende group parameter', messages: [] }, { status: 400 })

    const since = parseInt(req.nextUrl.searchParams.get('since') ?? '0', 10)
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10), 100)

    const messages = since > 0
      ? await chatGetMessages(group, since, limit)
      : await chatGetRecent(group, limit)

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[chat/messages GET]', err)
    return NextResponse.json({ error: 'Opslag niet bereikbaar', messages: [] }, { status: 500 })
  }
}

// POST /api/chat/messages
export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  const name = jar.get('participantName')?.value

  if (!initials || !name) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await req.json()
  const { group: groupRaw, text, type = 'text', imageUrl, gifUrl, replyTo, pollQuestion, pollOptions, pollMultiple } = body

  const group = parseGroup(groupRaw)
  if (!group) return NextResponse.json({ error: 'Ontbrekende group parameter' }, { status: 400 })

  if (!text && !imageUrl && !gifUrl && type !== 'poll') {
    return NextResponse.json({ error: 'Leeg bericht' }, { status: 400 })
  }
  if (type === 'poll' && (!pollQuestion || !Array.isArray(pollOptions) || pollOptions.length < 2)) {
    return NextResponse.json({ error: 'Ongeldige poll' }, { status: 400 })
  }

  const msg: ChatMessage = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    sender: name,
    senderInitials: initials,
    text: text ?? '',
    ts: Date.now(),
    type,
    reactions: {},
    ...(imageUrl && { imageUrl }),
    ...(gifUrl && { gifUrl }),
    ...(replyTo && { replyTo }),
    ...(pollQuestion && { pollQuestion }),
    ...(pollOptions && { pollOptions }),
    ...(pollMultiple && { pollMultiple: true }),
  }

  await chatAddMessage(group, msg)

  sendPushToGroup(group, {
    title: name,
    body: type === 'poll' ? `📊 ${pollQuestion}` : type === 'image' ? '📷 Afbeelding' : type === 'gif' ? '🎞️ GIF' : text.slice(0, 80),
    senderInitials: initials,
  }).catch(() => {})

  return NextResponse.json({ message: msg })
}
