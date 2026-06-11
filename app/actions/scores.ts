'use server'
import { kvGet, groupKey } from '@/lib/kv/kv'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { ParticipantScore } from '@/app/leaderboard/types'

const SCORE_DEFAULTS: ParticipantScore = {
  name: '', initials: '', total: 0, poulefase: 0, knockout: 0,
  koWedstrijden: 0, oranje: 0, oranjeTokens: 0, fantasy: 0,
  totoCorrect: 0, uitslagCorrect: 0,
}

export async function loadScoresForGroup(groupId: GroupId): Promise<ParticipantScore[]> {
  const groupParticipants = PARTICIPANTS.filter((p) => GROUP_MEMBERS[groupId].includes(p.initials))
  try {
    const stored =
      await kvGet<Record<string, Partial<ParticipantScore>>>(groupKey('scores', groupId)) ??
      (groupId === 'og' ? await kvGet<Record<string, Partial<ParticipantScore>>>('scores') : null)

    if (stored && Object.keys(stored).length > 0) {
      return groupParticipants
        .map((p) => {
          const s = stored[p.initials.toLowerCase()]
          return { ...SCORE_DEFAULTS, name: p.name, initials: p.initials, ...(s ?? {}) }
        })
        .sort((a, b) => b.total - a.total)
    }
  } catch {}
  return groupParticipants.map((p) => ({ ...SCORE_DEFAULTS, name: p.name, initials: p.initials }))
}
