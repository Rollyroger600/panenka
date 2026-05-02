'use client'

import { useState, useEffect } from 'react'

const DEADLINE = new Date('2026-06-09T15:00:00Z') // 17:00 CEST = 15:00 UTC

export function useDeadline() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isPast = now >= DEADLINE
  const msLeft = Math.max(0, DEADLINE.getTime() - now.getTime())
  const days    = Math.floor(msLeft / 86_400_000)
  const hours   = Math.floor((msLeft % 86_400_000) / 3_600_000)
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000)

  return { isPast, days, hours, minutes, deadline: DEADLINE }
}
