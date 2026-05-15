'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, groupKey } from '@/lib/kv/kv'
import type { GroupId } from '@/lib/groups'
import type { OranjeVraag, OranjeVragenMap, OranjeAntwoordenMap, OranjeCorrectMap } from '@/lib/types/oranjeVragen'

async function getGroupId(): Promise<GroupId> {
  const store = await cookies()
  return (store.get('group')?.value ?? 'og') as GroupId
}

// ── Vragen (per groep) ────────────────────────────────────────────────────

export async function loadOranjeVragen(): Promise<OranjeVragenMap> {
  const groupId = await getGroupId()
  return (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', groupId))) ?? {}
}

export async function saveOranjeVraag(
  matchId: number,
  vraag: OranjeVraag,
): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  const groupId = await getGroupId()
  const all = await loadOranjeVragen()
  if (!all[matchId]) all[matchId] = {}
  all[matchId][initials.toLowerCase()] = vraag
  await kvSet(groupKey('oranje_vragen', groupId), all)
}

// ── Antwoorden (per deelnemer, per groep) ─────────────────────────────────

export async function loadOranjeAntwoorden(): Promise<OranjeAntwoordenMap> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return {}
  const groupId = await getGroupId()
  return (await kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, initials))) ?? {}
}

export async function saveOranjeAntwoorden(data: OranjeAntwoordenMap): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  const groupId = await getGroupId()
  await kvSet(groupKey('oranje_antwoorden', groupId, initials), data)
}

// ── Correcte antwoorden (per groep) ──────────────────────────────────────

export async function loadOranjeCorrect(): Promise<OranjeCorrectMap> {
  const groupId = await getGroupId()
  return (await kvGet<OranjeCorrectMap>(groupKey('oranje_correct', groupId))) ?? {}
}
