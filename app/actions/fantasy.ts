'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { FantasySquad } from '@/store/gameStore'

interface FantasyKV {
  squad: FantasySquad
  teamName: string
}

export async function loadFantasy(): Promise<{ squad: FantasySquad; teamName: string }> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return { squad: {}, teamName: '' }
    const data = await kvGet<FantasyKV>(participantKey('fantasy', initials))
    return data ?? { squad: {}, teamName: '' }
  } catch {
    return { squad: {}, teamName: '' }
  }
}

export async function saveFantasy(squad: FantasySquad, teamName: string): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('fantasy', initials), { squad, teamName })
  } catch {}
}
