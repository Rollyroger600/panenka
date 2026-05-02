import { cookies } from 'next/headers'
import { FantasyClient } from './FantasyClient'

export default async function FantasyPage() {
  const store = await cookies()
  const participantName = store.get('participantName')?.value ?? 'Speler'
  return <FantasyClient participantName={participantName} />
}
