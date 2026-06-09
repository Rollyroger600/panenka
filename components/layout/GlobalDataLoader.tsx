'use client'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadPredictions } from '@/app/actions/predictions'
import { loadKnockoutPicks } from '@/app/actions/knockout'

interface Props {
  initials: string
}

export function GlobalDataLoader({ initials }: Props) {
  const { initPredictions, initKnockoutPicks, setParticipantInitials } = useGameStore()
  const loaded = useRef(false)

  useEffect(() => {
    setParticipantInitials(initials)
    if (loaded.current) return
    loaded.current = true
    loadPredictions().then(initPredictions)
    loadKnockoutPicks().then(initKnockoutPicks)
  }, [initials, initPredictions, initKnockoutPicks, setParticipantInitials])

  return null
}
