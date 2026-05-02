'use client'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadKnockoutPicks, saveKnockoutPicks } from '@/app/actions/knockout'
import { useDeadline } from './useDeadline'

export function useKnockoutPicks() {
  const { knockoutPicks, initKnockoutPicks, setSaveStatus } = useGameStore()
  const { isPast } = useDeadline()
  const [isLoaded, setIsLoaded] = useState(false)
  const initialized = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadKnockoutPicks().then((data) => {
      initKnockoutPicks(data)
      setIsLoaded(true)
      initialized.current = true
    })
  }, [initKnockoutPicks])

  useEffect(() => {
    if (!initialized.current || isPast) return
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await saveKnockoutPicks(knockoutPicks)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [knockoutPicks, isPast, setSaveStatus])

  return { isLoaded }
}
