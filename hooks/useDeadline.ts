'use client'

import { useState, useEffect } from 'react'

const DEADLINE             = new Date('2026-06-09T21:59:00Z') // 23:59 CEST
const VRAAG_DEADLINE       = new Date('2026-05-31T21:59:00Z') // 31 mei 23:59 CEST
const VRAAG_GRACE_DEADLINE = new Date('2026-06-03T21:59:00Z') // 3 juni 23:59 CEST – voor wie niets had ingediend

export function useDeadline() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isPast           = now >= DEADLINE
  const isVraagPast      = now >= VRAAG_DEADLINE
  const isVraagGracePast = now >= VRAAG_GRACE_DEADLINE
  const msLeft = Math.max(0, DEADLINE.getTime() - now.getTime())
  const days    = Math.floor(msLeft / 86_400_000)
  const hours   = Math.floor((msLeft % 86_400_000) / 3_600_000)
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000)

  return { isPast, isVraagPast, isVraagGracePast, days, hours, minutes, deadline: DEADLINE, vraagDeadline: VRAAG_DEADLINE }
}
