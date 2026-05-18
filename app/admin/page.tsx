import { cookies } from 'next/headers'
import { AdminClient } from './AdminClient'
import { AdminLogin } from './AdminLogin'
import { loadResults, loadKoResults, loadOranjeResults, loadOranjeVragenAdmin, loadOranjeCorrectAdmin, loadOranjeBeoordeling, loadAlleOranjeAntwoorden, loadFantasyStats } from '@/app/actions/admin'
import type { GroupId } from '@/lib/groups'

export default async function AdminPage() {
  const store = await cookies()
  const isAdmin = store.get('admin')?.value === 'true'

  if (!isAdmin) return <AdminLogin />

  const groupId = (store.get('admin_group')?.value ?? 'og') as GroupId

  const [results, koResults, oranjeResults, oranjeVragen, oranjeCorrect, oranjeBeoordeling, alleAntwoorden, fantasyStats] = await Promise.all([
    loadResults(),
    loadKoResults(),
    loadOranjeResults(),
    loadOranjeVragenAdmin(groupId),
    loadOranjeCorrectAdmin(groupId),
    loadOranjeBeoordeling(groupId),
    loadAlleOranjeAntwoorden(groupId),
    loadFantasyStats(),
  ])

  return (
    <AdminClient
      groupId={groupId}
      initialResults={results}
      initialKoResults={koResults}
      initialOranjeResults={oranjeResults}
      initialOranjeVragen={oranjeVragen}
      initialOranjeCorrect={oranjeCorrect}
      initialOranjeBeoordeling={oranjeBeoordeling}
      initialAlleAntwoorden={alleAntwoorden}
      initialFantasyStats={fantasyStats}
    />
  )
}
