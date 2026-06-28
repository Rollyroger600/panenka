'use client'

import { useState, useEffect, useMemo } from 'react'
import type { KoMatchTeams } from '@/app/actions/admin'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function isKoMatchLocked(kickoff: string | undefined): boolean {
  if (!kickoff) return false
  return Date.now() >= new Date(kickoff).getTime() - TWO_HOURS_MS
}

export function useKoMatchLocks(koMatchTeams: KoMatchTeams): Record<number, boolean> {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const locks: Record<number, boolean> = {}
    for (const [idStr, data] of Object.entries(koMatchTeams)) {
      const kickoff = data.kickoff
      if (!kickoff) {
        locks[Number(idStr)] = false
        continue
      }
      locks[Number(idStr)] = now >= new Date(kickoff).getTime() - TWO_HOURS_MS
    }
    return locks
  }, [koMatchTeams, now])
}
