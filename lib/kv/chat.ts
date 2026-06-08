import { Redis } from '@upstash/redis'
import type { ChatMessage, PollOption } from '@/lib/types/chat'
import type { GroupId } from '@/lib/groups'

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) as string,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN) as string,
})

function messagesKey(group: GroupId): string {
  return `chat:messages:${group}`
}
function pinnedKey(group: GroupId): string {
  return `chat:pinned:${group}`
}
function readKey(group: GroupId): string {
  return `chat:read:${group}`
}

const MAX_MESSAGES = 2000

// Upstash SDK v1.37+ kan JSON-strings auto-deserializeren naar objecten; beide gevallen afhandelen
function parseMember(raw: unknown): ChatMessage {
  if (typeof raw === 'string') return JSON.parse(raw) as ChatMessage
  return raw as ChatMessage
}

export async function chatGetMessages(group: GroupId, since: number, limit: number = 50): Promise<ChatMessage[]> {
  const key = messagesKey(group)
  const raw = await redis.zrange(key, since + 1, '+inf', {
    byScore: true,
    offset: 0,
    count: limit,
  })
  return (raw as unknown[]).map(parseMember)
}

export async function chatGetRecent(group: GroupId, limit: number = 60): Promise<ChatMessage[]> {
  const key = messagesKey(group)
  const count = await redis.zcard(key)
  const start = Math.max(0, count - limit)
  const raw = await redis.zrange(key, start, -1)
  return (raw as unknown[]).map(parseMember)
}

export async function chatAddMessage(group: GroupId, msg: ChatMessage): Promise<void> {
  const key = messagesKey(group)
  await redis.zadd(key, { score: msg.ts, member: JSON.stringify(msg) })
  const count = await redis.zcard(key)
  if (count > MAX_MESSAGES) {
    await redis.zremrangebyrank(key, 0, count - MAX_MESSAGES - 1)
  }
}

// Generieke helper: zoek bericht op id en vervang het
async function chatReplaceMessage(
  group: GroupId,
  msgId: string,
  updater: (msg: ChatMessage) => ChatMessage,
): Promise<boolean> {
  const key = messagesKey(group)
  const raw = await redis.zrange(key, 0, -1) as unknown[]
  for (const member of raw) {
    let msg: ChatMessage
    try { msg = parseMember(member) } catch { continue }
    if (msg.id !== msgId) continue

    const score = await redis.zscore(key, member)
    if (score === null) continue

    const updated = updater(msg)
    await redis.zremrangebyscore(key, score, score)
    await redis.zadd(key, { score, member: JSON.stringify(updated) })
    return true
  }
  return false
}

export async function chatUpdateReactions(
  group: GroupId,
  msgId: string,
  reactions: Record<string, string[]>,
): Promise<boolean> {
  return chatReplaceMessage(group, msgId, (msg) => ({ ...msg, reactions }))
}

export async function chatUpdateMessage(
  group: GroupId,
  msgId: string,
  text: string,
): Promise<boolean> {
  return chatReplaceMessage(group, msgId, (msg) => ({ ...msg, text, editedAt: Date.now() }))
}

export async function chatDeleteMessage(
  group: GroupId,
  msgId: string,
): Promise<boolean> {
  return chatReplaceMessage(group, msgId, (msg) => ({
    ...msg,
    deleted: true,
    text: '',
    imageUrl: undefined,
    gifUrl: undefined,
  }))
}

export async function chatSetPinned(group: GroupId, msgId: string | null): Promise<void> {
  if (msgId === null) {
    await redis.del(pinnedKey(group))
  } else {
    await redis.set(pinnedKey(group), msgId)
  }
}

export async function chatGetPinned(group: GroupId): Promise<string | null> {
  const raw = await redis.get<string>(pinnedKey(group))
  if (!raw) return null
  return typeof raw === 'string' ? raw : String(raw)
}

export async function chatGetAllMessages(group: GroupId): Promise<ChatMessage[]> {
  const raw = await redis.zrange(messagesKey(group), 0, -1)
  return (raw as unknown[]).map(parseMember)
}

export async function chatUpdatePoll(
  group: GroupId,
  msgId: string,
  optionIndex: number,
  voterInitials: string,
): Promise<PollOption[] | null> {
  const key = messagesKey(group)
  const raw = await redis.zrange(key, 0, -1) as unknown[]
  for (const member of raw) {
    let msg: ChatMessage
    try { msg = parseMember(member) } catch { continue }
    if (msg.id !== msgId || !msg.pollOptions) continue

    const score = await redis.zscore(key, member)
    if (score === null) continue

    const alreadyAt = msg.pollOptions.findIndex((o) => o.votes.includes(voterInitials))
    const isMultiple = msg.pollMultiple ?? false

    const newOptions: PollOption[] = msg.pollOptions.map((o, i) => ({
      ...o,
      votes: (isMultiple ? i === optionIndex : true)
        ? o.votes.filter((v) => v !== voterInitials)
        : o.votes,
    }))

    if (alreadyAt !== optionIndex) {
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        votes: [...newOptions[optionIndex].votes, voterInitials],
      }
    }

    const updated: ChatMessage = { ...msg, pollOptions: newOptions }
    await redis.zremrangebyscore(key, score, score)
    await redis.zadd(key, { score, member: JSON.stringify(updated) })
    return newOptions
  }
  return null
}

// Read receipts: initials → last-read timestamp
export async function chatSetRead(group: GroupId, initials: string, ts: number): Promise<void> {
  await redis.hset(readKey(group), { [initials.toLowerCase()]: ts })
}

export async function chatGetReadMap(group: GroupId): Promise<Record<string, number>> {
  const raw = await redis.hgetall(readKey(group))
  if (!raw) return {}
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v)])
  )
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
