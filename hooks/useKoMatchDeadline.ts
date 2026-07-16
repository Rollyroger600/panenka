'use client'

import { useState, useEffect, useMemo } from 'react'
import type { KoMatchTeams } from '@/app/actions/admin'
import { isKoMatchLocked } from '@/lib/koMatchDeadline'

const DEADLINE_OVERRIDES: Record<number, string[]> = {}

export { isKoMatchLocked }

export function useKoMatchLocks(koMatchTeams: KoMatchTeams, participant?: string): Record<number, boolean> {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const locks: Record<number, boolean> = {}
    for (const [idStr, data] of Object.entries(koMatchTeams)) {
      const matchId = Number(idStr)
      const kickoff = data.kickoff
      if (!kickoff) {
        locks[matchId] = false
        continue
      }
      if (participant && DEADLINE_OVERRIDES[matchId]?.includes(participant)) {
        locks[matchId] = false
        continue
      }
      locks[matchId] = isKoMatchLocked(kickoff, now)
    }
    return locks
  }, [koMatchTeams, now, participant])
}
