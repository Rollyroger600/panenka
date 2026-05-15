'use client'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadPredictions } from '@/app/actions/predictions'
import { loadKnockoutPicks } from '@/app/actions/knockout'

export function GlobalDataLoader() {
  const { initPredictions, initKnockoutPicks } = useGameStore()
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    loadPredictions().then(initPredictions)
    loadKnockoutPicks().then(initKnockoutPicks)
  }, [initPredictions, initKnockoutPicks])

  return null
}
