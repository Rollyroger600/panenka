import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) as string,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN) as string,
})

export async function kvGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await redis.set(key, JSON.stringify(value))
}

export function participantKey(section: string, initials: string): string {
  return `${section}:${initials.toLowerCase()}`
}

export function groupKey(section: string, groupId: string, initials?: string): string {
  return initials
    ? `${section}:${groupId}:${initials.toLowerCase()}`
    : `${section}:${groupId}`
}
