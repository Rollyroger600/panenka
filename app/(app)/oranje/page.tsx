import { cookies } from 'next/headers'
import { OranjeClient } from './OranjeClient'

export default async function OranjePage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  return <OranjeClient mijnInitials={initials} />
}
