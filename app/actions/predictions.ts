'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { Prediction } from '@/store/gameStore'

export async function loadPredictions(): Promise<Record<number, Prediction>> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return {}
    const data = await kvGet<Record<number, Prediction>>(participantKey('predictions', initials))
    return data ?? {}
  } catch {
    return {}
  }
}

export async function savePredictions(data: Record<number, Prediction>): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('predictions', initials), data)
  } catch {
    // silently ignore save errors
  }
}
