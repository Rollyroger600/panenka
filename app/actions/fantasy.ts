'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { FantasySquad, Scratchpad } from '@/store/gameStore'

interface FantasyKV {
  squad: FantasySquad
  teamName: string
  scratchpad?: Scratchpad
}

export async function loadFantasy(): Promise<{ squad: FantasySquad; teamName: string; scratchpad: Scratchpad }> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return { squad: {}, teamName: '', scratchpad: {} }
    const data = await kvGet<FantasyKV>(participantKey('fantasy', initials))
    return data ? { squad: data.squad, teamName: data.teamName, scratchpad: data.scratchpad ?? {} } : { squad: {}, teamName: '', scratchpad: {} }
  } catch {
    return { squad: {}, teamName: '', scratchpad: {} }
  }
}

export async function saveFantasy(squad: FantasySquad, teamName: string, scratchpad: Scratchpad): Promise<void> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return
    await kvSet(participantKey('fantasy', initials), { squad, teamName, scratchpad })
  } catch {}
}
