import { cookies } from 'next/headers'
import { FantasyClient } from './FantasyClient'
import { loadFantasyStats, loadSquadsForGroup } from '@/app/actions/admin'
import type { ParticipantSquadData } from '@/app/actions/admin'
import { DUAL_GROUP_INITIALS, GROUP_MEMBERS, getGroupForParticipant } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'

function computeGroupCounts(squads: ParticipantSquadData[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const { squad } of squads) {
    for (const player of Object.values(squad)) {
      if (player?.name) counts[player.name] = (counts[player.name] ?? 0) + 1
    }
  }
  return counts
}

export default async function FantasyPage() {
  const store = await cookies()
  const participantName = store.get('participantName')?.value ?? 'Speler'
  const initials = store.get('participant')?.value ?? ''
  const isDualGroup = DUAL_GROUP_INITIALS.includes(initials)
  const defaultGroup = (store.get('group')?.value ?? 'og') as GroupId
  const userGroup = isDualGroup ? defaultGroup : getGroupForParticipant(initials)

  const inOg = isDualGroup || GROUP_MEMBERS.og.includes(initials)
  const inAsc = isDualGroup || GROUP_MEMBERS.asc.includes(initials)

  const [fantasyStats, ogSquads, ascSquads] = await Promise.all([
    loadFantasyStats(),
    inOg ? loadSquadsForGroup('og') : Promise.resolve([]),
    inAsc ? loadSquadsForGroup('asc') : Promise.resolve(null),
  ])

  const ogPlayerCounts = computeGroupCounts(ogSquads)
  const ascPlayerCounts = ascSquads ? computeGroupCounts(ascSquads) : null

  return (
    <FantasyClient
      participantName={participantName}
      participantInitials={initials}
      fantasyStats={fantasyStats}
      ogPlayerCounts={ogPlayerCounts}
      ascPlayerCounts={ascPlayerCounts}
      ogSquads={ogSquads}
      ascSquads={ascSquads}
      isDualGroup={isDualGroup}
      defaultGroup={userGroup}
    />
  )
}
