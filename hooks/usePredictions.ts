'use client'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadPredictions, savePredictions } from '@/app/actions/predictions'
export function usePredictions() {
  const { predictions, initPredictions, setSaveStatus } = useGameStore()
  const [isLoaded, setIsLoaded] = useState(false)
  const initialized = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadPredictions().then((data) => {
      initPredictions(data)
      setIsLoaded(true)
      initialized.current = true
    })
  }, [initPredictions])

  useEffect(() => {
    if (!initialized.current) return
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await savePredictions(predictions)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [predictions, setSaveStatus])

  return { isLoaded }
}
