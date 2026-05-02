'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function selectParticipant(initials: string, name: string) {
  const store = await cookies()
  const maxAge = 60 * 60 * 24 * 90 // 90 days
  store.set('participant', initials, { path: '/', maxAge })
  store.set('participantName', name, { path: '/', maxAge })
  redirect('/poulefase')
}
