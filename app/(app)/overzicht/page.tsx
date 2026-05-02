import { cookies } from 'next/headers'
import { OverzichtClient } from './OverzichtClient'

export default async function OverzichtPage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const participantName = store.get('participantName')?.value ?? 'Speler'
  return <OverzichtClient initials={initials} participantName={participantName} />
}
