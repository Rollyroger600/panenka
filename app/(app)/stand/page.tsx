import { cookies } from 'next/headers'
import { getGroupForParticipant } from '@/lib/groups'
import { StandClient } from './StandClient'

export default async function StandPage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const defaultGroup = getGroupForParticipant(initials)

  return <StandClient mijnInitials={initials} defaultGroup={defaultGroup} />
}
