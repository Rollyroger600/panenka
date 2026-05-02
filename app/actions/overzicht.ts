'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'

export async function confirmPredictions(): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('confirmed', initials), true)
  } catch {}
}

export async function loadConfirmed(): Promise<boolean> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return false
    const val = await kvGet<boolean>(participantKey('confirmed', initials))
    return val === true
  } catch {
    return false
  }
}
