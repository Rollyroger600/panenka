'use client'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadOranjeVoorspelling, saveOranjeVoorspelling } from '@/app/actions/oranje'
import { useDeadline } from './useDeadline'

export function useOranjeVoorspelling() {
  const { oranjeVoorspelling, initOranjeVoorspelling, setSaveStatus } = useGameStore()
  const { isPast } = useDeadline()
  const [isLoaded, setIsLoaded] = useState(false)
  const initialized = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadOranjeVoorspelling().then((data) => {
      initOranjeVoorspelling(data)
      setIsLoaded(true)
      initialized.current = true
    })
  }, [initOranjeVoorspelling])

  useEffect(() => {
    if (!initialized.current || isPast) return
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await saveOranjeVoorspelling(oranjeVoorspelling)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [oranjeVoorspelling, isPast, setSaveStatus])

  return { isLoaded }
}
