'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { KnockoutPicks } from '@/store/gameStore'

export async function loadKnockoutPicks(): Promise<KnockoutPicks> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return {}
    const data = await kvGet<KnockoutPicks>(participantKey('knockout', initials))
    return data ?? {}
  } catch {
    return {}
  }
}

export async function saveKnockoutPicks(data: KnockoutPicks): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('knockout', initials), data)
  } catch {}
}
