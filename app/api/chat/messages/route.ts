import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chatGetMessages, chatGetRecent, chatAddMessage } from '@/lib/kv/chat'
import { sendPushToAll } from '@/lib/push'
import type { ChatMessage } from '@/lib/types/chat'

// GET /api/chat/messages?since=<ts>&limit=<n>
export async function GET(req: NextRequest) {
  const since = parseInt(req.nextUrl.searchParams.get('since') ?? '0', 10)
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10), 100)

  const messages = since > 0
    ? await chatGetMessages(since, limit)
    : await chatGetRecent(limit)

  return NextResponse.json({ messages })
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
  const { text, type = 'text', imageUrl, gifUrl, replyTo, pollQuestion, pollOptions, pollMultiple } = body

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

  await chatAddMessage(msg)

  sendPushToAll({
    title: name,
    body: type === 'poll' ? `📊 ${pollQuestion}` : type === 'image' ? '📷 Afbeelding' : type === 'gif' ? '🎞️ GIF' : text.slice(0, 80),
    senderInitials: initials,
  }).catch(() => {})

  return NextResponse.json({ message: msg })
}
