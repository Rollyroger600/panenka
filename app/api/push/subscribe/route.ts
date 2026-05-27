import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { savePushSubscription, removePushSubscription, indexPushSubscription, deindexPushSubscription } from '@/lib/kv/chat'

export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const sub: PushSubscriptionJSON = await req.json()
  if (!sub.endpoint) return NextResponse.json({ error: 'Ongeldige subscription' }, { status: 400 })

  await savePushSubscription(initials, sub)
  await indexPushSubscription(initials)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  await removePushSubscription(initials)
  await deindexPushSubscription(initials)

  return NextResponse.json({ ok: true })
}
