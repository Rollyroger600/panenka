import webpush from 'web-push'
import { getAllPushSubscriptions } from '@/lib/kv/chat'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:info@panenka.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

interface PushPayload {
  title: string
  body: string
  senderInitials: string
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const subs = await getAllPushSubscriptions()
  await Promise.allSettled(
    subs
      .filter((s) => s.initials !== payload.senderInitials) // don't notify sender
      .map((s) =>
        webpush.sendNotification(
          s.sub as webpush.PushSubscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/Logo/Artboard 1@4x.png',
            badge: '/Logo/Artboard 1@4x.png',
            tag: 'chat',
            url: '/chat',
          }),
        ),
      ),
  )
}
