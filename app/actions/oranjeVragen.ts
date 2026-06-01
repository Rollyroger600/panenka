'use server'
import { cookies } from 'next/headers'
import { kvGet, kvSet, groupKey } from '@/lib/kv/kv'
import type { GroupId } from '@/lib/groups'
import { DUAL_GROUP_INITIALS } from '@/lib/groups'
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

export async function loadOranjeVragenForGroup(groupId: GroupId): Promise<OranjeVragenMap> {
  const vragen = (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', groupId))) ?? {}
  if (groupId !== 'og') {
    const ogVragen = (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', 'og'))) ?? {}
    for (const [matchIdStr, matchVragen] of Object.entries(ogVragen)) {
      const matchId = parseInt(matchIdStr)
      for (const initials of DUAL_GROUP_INITIALS) {
        const key = initials.toLowerCase()
        if (matchVragen[key] && !vragen[matchId]?.[key]) {
          if (!vragen[matchId]) vragen[matchId] = {}
          vragen[matchId][key] = matchVragen[key]
        }
      }
    }
  }
  return vragen
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

  // dual-group deelnemers: ook opslaan in de andere groep
  if (DUAL_GROUP_INITIALS.includes(initials.toUpperCase())) {
    const otherGroup: GroupId = groupId === 'og' ? 'asc' : 'og'
    const otherAll = (await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', otherGroup))) ?? {}
    if (!otherAll[matchId]) otherAll[matchId] = {}
    otherAll[matchId][initials.toLowerCase()] = vraag
    await kvSet(groupKey('oranje_vragen', otherGroup), otherAll)
  }
}

// ── Antwoorden (per deelnemer, per groep) ─────────────────────────────────

export async function loadOranjeAntwoorden(): Promise<OranjeAntwoordenMap> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return {}
  const groupId = await getGroupId()
  return (await kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, initials))) ?? {}
}

export async function loadOranjeAntwoordenForGroup(groupId: GroupId): Promise<OranjeAntwoordenMap> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return {}
  return (await kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, initials))) ?? {}
}

export async function saveOranjeAntwoorden(data: OranjeAntwoordenMap): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  const groupId = await getGroupId()
  await kvSet(groupKey('oranje_antwoorden', groupId, initials), data)
}

export async function saveOranjeAntwoordenForGroup(data: OranjeAntwoordenMap, groupId: GroupId): Promise<void> {
  const store = await cookies()
  const initials = store.get('participant')?.value
  if (!initials) return
  await kvSet(groupKey('oranje_antwoorden', groupId, initials), data)
}

// ── Correcte antwoorden (per groep) ──────────────────────────────────────

export async function loadOranjeCorrect(): Promise<OranjeCorrectMap> {
  const groupId = await getGroupId()
  return (await kvGet<OranjeCorrectMap>(groupKey('oranje_correct', groupId))) ?? {}
}
