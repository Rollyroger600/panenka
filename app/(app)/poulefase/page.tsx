import { cookies } from 'next/headers'
import { PoulefaseClient } from './PoulefaseClient'

export default async function PoulefasePage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  return <PoulefaseClient initials={initials} />
}
