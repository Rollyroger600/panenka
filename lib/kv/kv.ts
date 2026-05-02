import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function kvGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await redis.set(key, JSON.stringify(value))
}

export function participantKey(section: string, initials: string): string {
  return `${section}:${initials.toLowerCase()}`
}
