'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { OranjeAnswer } from '@/store/gameStore'

export async function loadOranjeVoorspelling(): Promise<Record<number, OranjeAnswer>> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return {}
    const data = await kvGet<Record<number, OranjeAnswer>>(participantKey('oranje', initials))
    return data ?? {}
  } catch {
    return {}
  }
}

export async function saveOranjeVoorspelling(data: Record<number, OranjeAnswer>): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('oranje', initials), data)
  } catch {
    // silently ignore
  }
}
