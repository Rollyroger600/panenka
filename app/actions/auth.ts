'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PARTICIPANTS } from '@/lib/participants'

export async function selectParticipant(token: string) {
  const participant = PARTICIPANTS.find(p => p.token === token)
  if (!participant) return
  const store = await cookies()
  const maxAge = 60 * 60 * 24 * 90 // 90 days
  store.set('participant', participant.initials, { path: '/', maxAge })
  store.set('participantName', participant.name, { path: '/', maxAge })
  redirect('/poulefase')
}
