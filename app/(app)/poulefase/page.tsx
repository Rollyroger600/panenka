import { cookies } from 'next/headers'
import { PoulefaseClient } from './PoulefaseClient'
import { loadResults } from '@/app/actions/admin'

export default async function PoulefasePage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const results = await loadResults()
  return <PoulefaseClient initials={initials} results={results} />
}
