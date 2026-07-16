'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey, groupKey } from '@/lib/kv/kv'
import { PARTICIPANTS } from '@/lib/participants'
import { isKoMatchIdLocked } from '@/lib/koMatchDeadline'
import type { Prediction } from '@/store/gameStore'
import type { KoMatchTeams } from '@/app/actions/admin'
import type { ParticipantScore } from '@/app/leaderboard/types'

// Zelfde globale poulefase-deadline als hooks/useDeadline.ts (single source of truth zou mooier zijn,
// maar dat bestand is 'use client' — hier hardcoded als server-side spiegel).
const POULEFASE_DEADLINE = new Date('2026-06-09T21:59:00Z').getTime()

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

    const key = participantKey('predictions', initials)
    const [existing, koMatchTeams] = await Promise.all([
      kvGet<Record<number, Prediction>>(key),
      kvGet<KoMatchTeams>('ko_match_teams'),
    ])
    const safeExisting = existing ?? {}
    const teams = koMatchTeams ?? {}

    const participant = PARTICIPANTS.find((p) => p.initials === initials)
    const poulefaseDeadline = participant?.deadlineOverride
      ? new Date(participant.deadlineOverride).getTime()
      : POULEFASE_DEADLINE
    const poulefaseLocked = Date.now() >= poulefaseDeadline

    // Verdedig tegen client-state die na de deadline nog is gewijzigd (bv. een al openstaand
    // uitslagen-venster dat een keuze doorzet nadat de vergrendeling is ingegaan): voor elke
    // wedstrijd die inmiddels vergrendeld is, negeren we de inkomende waarde en houden we vast
    // aan wat er al in Redis stond.
    const merged: Record<number, Prediction> = { ...data }
    const allMatchIds = new Set([...Object.keys(data), ...Object.keys(safeExisting)].map(Number))
    for (const matchId of allMatchIds) {
      const locked = matchId >= 73 ? isKoMatchIdLocked(matchId, teams) : poulefaseLocked
      if (!locked) continue
      if (safeExisting[matchId] !== undefined) merged[matchId] = safeExisting[matchId]
      else delete merged[matchId]
    }

    await kvSet(key, merged)
  } catch {
    // silently ignore save errors
  }
}
