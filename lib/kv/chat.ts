import { Redis } from '@upstash/redis'
import type { ChatMessage, PollOption } from '@/lib/types/chat'

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) as string,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN) as string,
})

const MESSAGES_KEY = 'chat:messages'
const MAX_MESSAGES = 2000

// Upstash SDK v1.37+ kan JSON-strings auto-deserializeren naar objecten; beide gevallen afhandelen
function parseMember(raw: unknown): ChatMessage {
  if (typeof raw === 'string') return JSON.parse(raw) as ChatMessage
  return raw as ChatMessage
}

export async function chatGetMessages(since: number, limit: number = 50): Promise<ChatMessage[]> {
  const raw = await redis.zrange(MESSAGES_KEY, since + 1, '+inf', {
    byScore: true,
    offset: 0,
    count: limit,
  })
  return (raw as unknown[]).map(parseMember)
}

export async function chatGetRecent(limit: number = 60): Promise<ChatMessage[]> {
  const count = await redis.zcard(MESSAGES_KEY)
  const start = Math.max(0, count - limit)
  const raw = await redis.zrange(MESSAGES_KEY, start, -1)
  return (raw as unknown[]).map(parseMember)
}

export async function chatAddMessage(msg: ChatMessage): Promise<void> {
  await redis.zadd(MESSAGES_KEY, { score: msg.ts, member: JSON.stringify(msg) })
  const count = await redis.zcard(MESSAGES_KEY)
  if (count > MAX_MESSAGES) {
    await redis.zremrangebyrank(MESSAGES_KEY, 0, count - MAX_MESSAGES - 1)
  }
}

export async function chatUpdateReactions(
  msgId: string,
  reactions: Record<string, string[]>,
): Promise<boolean> {
  const raw = await redis.zrange(MESSAGES_KEY, 0, -1) as unknown[]
  for (const member of raw) {
    let msg: ChatMessage
    try { msg = parseMember(member) } catch { continue }
    if (msg.id !== msgId) continue

    const score = await redis.zscore(MESSAGES_KEY, member)
    if (score === null) continue

    const updated: ChatMessage = { ...msg, reactions }
    await redis.zremrangebyscore(MESSAGES_KEY, score, score)
    await redis.zadd(MESSAGES_KEY, { score, member: JSON.stringify(updated) })
    return true
  }
  return false
}

export async function chatGetAllMessages(): Promise<ChatMessage[]> {
  const raw = await redis.zrange(MESSAGES_KEY, 0, -1)
  return (raw as unknown[]).map(parseMember)
}

export async function chatUpdatePoll(
  msgId: string,
  optionIndex: number,
  voterInitials: string,
): Promise<PollOption[] | null> {
  const raw = await redis.zrange(MESSAGES_KEY, 0, -1) as unknown[]
  for (const member of raw) {
    let msg: ChatMessage
    try { msg = parseMember(member) } catch { continue }
    if (msg.id !== msgId || !msg.pollOptions) continue

    const score = await redis.zscore(MESSAGES_KEY, member)
    if (score === null) continue

    const alreadyAt = msg.pollOptions.findIndex((o) => o.votes.includes(voterInitials))
    const isMultiple = msg.pollMultiple ?? false

    // Bij enkelvoudige poll: alle bestaande stemmen verwijderen. Bij meervoudige: alleen van gekozen optie.
    const newOptions: PollOption[] = msg.pollOptions.map((o, i) => ({
      ...o,
      votes: (isMultiple ? i === optionIndex : true)
        ? o.votes.filter((v) => v !== voterInitials)
        : o.votes,
    }))

    // Toggle: zelfde optie opnieuw = stem intrekken; anders toevoegen
    if (alreadyAt !== optionIndex) {
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        votes: [...newOptions[optionIndex].votes, voterInitials],
      }
    }

    const updated: ChatMessage = { ...msg, pollOptions: newOptions }
    await redis.zremrangebyscore(MESSAGES_KEY, score, score)
    await redis.zadd(MESSAGES_KEY, { score, member: JSON.stringify(updated) })
    return newOptions
  }
  return null
}

// Push subscriptions
export async function savePushSubscription(initials: string, sub: PushSubscriptionJSON): Promise<void> {
  await redis.set(`push:sub:${initials.toLowerCase()}`, JSON.stringify(sub))
}

export async function removePushSubscription(initials: string): Promise<void> {
  await redis.del(`push:sub:${initials.toLowerCase()}`)
}

export async function getAllPushSubscriptions(): Promise<Array<{ initials: string; sub: PushSubscriptionJSON }>> {
  const keys = await redis.smembers('push:sub:index') as string[]
  const results: Array<{ initials: string; sub: PushSubscriptionJSON }> = []
  for (const initials of keys) {
    const raw = await redis.get<string>(`push:sub:${initials}`)
    if (raw) {
      const sub = typeof raw === 'string' ? JSON.parse(raw) : raw
      results.push({ initials, sub })
    }
  }
  return results
}

export async function indexPushSubscription(initials: string): Promise<void> {
  await redis.sadd('push:sub:index', initials.toLowerCase())
}

export async function deindexPushSubscription(initials: string): Promise<void> {
  await redis.srem('push:sub:index', initials.toLowerCase())
}
