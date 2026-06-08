'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { FantasySquad, Scratchpad } from '@/store/gameStore'
import { WK_PLAYERS } from '@/lib/data/players'

interface FantasyKV {
  squad: FantasySquad
  teamName: string
  scratchpad?: Scratchpad
}

const PLAYER_BY_ID = Object.fromEntries(WK_PLAYERS.map((p) => [p.id, p]))

function hydrateSquad(squad: FantasySquad): FantasySquad {
  return Object.fromEntries(
    Object.entries(squad).map(([slot, player]) => [
      slot,
      player ? (PLAYER_BY_ID[player.id] ?? player) : null,
    ])
  )
}

export async function loadFantasy(): Promise<{ squad: FantasySquad; teamName: string; scratchpad: Scratchpad }> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    if (!initials) return { squad: {}, teamName: '', scratchpad: {} }
    const data = await kvGet<FantasyKV>(participantKey('fantasy', initials))
    if (!data) return { squad: {}, teamName: '', scratchpad: {} }
    return { squad: hydrateSquad(data.squad), teamName: data.teamName, scratchpad: data.scratchpad ?? {} }
  } catch {
    return { squad: {}, teamName: '', scratchpad: {} }
  }
}

export async function saveFantasy(squad: FantasySquad, teamName: string, scratchpad: Scratchpad): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  await kvSet(participantKey('fantasy', initials), { squad, teamName, scratchpad })
}
