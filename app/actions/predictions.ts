'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey, groupKey } from '@/lib/kv/kv'
import type { Prediction } from '@/store/gameStore'
import type { KoMatchTeams } from '@/app/actions/admin'
import type { ParticipantScore } from '@/app/leaderboard/types'

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

// KO-wedstrijd teams (publiek leesbaar, geen admin check)
export async function loadKoMatchTeamsPublic(): Promise<KoMatchTeams> {
  return (await kvGet<KoMatchTeams>('ko_match_teams')) ?? {}
}

// Oranje-tokens voor de ingelogde deelnemer (uit laatste score-run)
export async function loadMyOranjeTokens(): Promise<number> {
  try {
    const store = await cookies()
    const initials = store.get('participant')?.value
    const groupId = store.get('group')?.value ?? 'og'
    if (!initials) return 0
    const scores = await kvGet<Record<string, ParticipantScore>>(groupKey('scores', groupId))
    return scores?.[initials.toLowerCase()]?.oranjeTokens ?? 0
  } catch {
    return 0
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
