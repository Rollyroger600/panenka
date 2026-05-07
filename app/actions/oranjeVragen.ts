'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, participantKey } from '@/lib/kv/kv'
import type { OranjeVraag, OranjeVragenMap, OranjeAntwoordenMap, OranjeCorrectMap } from '@/lib/types/oranjeVragen'

// ── Vragen (globale sleutel, alle deelnemers) ─────────────────────────────

export async function loadOranjeVragen(): Promise<OranjeVragenMap> {
  return (await kvGet<OranjeVragenMap>('oranje_vragen')) ?? {}
}

export async function saveOranjeVraag(
  matchId: number,
  vraag: OranjeVraag,
): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  const all = await loadOranjeVragen()
  if (!all[matchId]) all[matchId] = {}
  all[matchId][initials.toLowerCase()] = vraag
  await kvSet('oranje_vragen', all)
}

// ── Antwoorden (per deelnemer) ────────────────────────────────────────────

export async function loadOranjeAntwoorden(): Promise<OranjeAntwoordenMap> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return {}
  return (
    (await kvGet<OranjeAntwoordenMap>(participantKey('oranje_antwoorden', initials))) ?? {}
  )
}

export async function saveOranjeAntwoorden(data: OranjeAntwoordenMap): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  await kvSet(participantKey('oranje_antwoorden', initials), data)
}

// ── Correcte antwoorden (admin, globale sleutel) ──────────────────────────

export async function loadOranjeCorrect(): Promise<OranjeCorrectMap> {
  return (await kvGet<OranjeCorrectMap>('oranje_correct')) ?? {}
}
