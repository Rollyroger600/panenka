import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'
import { AdminLogin } from './AdminLogin'
import { loadResults, loadKoResults, loadOranjeResults } from '@/app/actions/admin'

export default async function AdminPage() {
  const store = await cookies()
  const isAdmin = store.get('admin')?.value === 'true'

  if (!isAdmin) return <AdminLogin />

  const [results, koResults, oranjeResults] = await Promise.all([
    loadResults(),
    loadKoResults(),
    loadOranjeResults(),
  ])

  return (
    <AdminClient
      initialResults={results}
      initialKoResults={koResults}
      initialOranjeResults={oranjeResults}
    />
  )
}
