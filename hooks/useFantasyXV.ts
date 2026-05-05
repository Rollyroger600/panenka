'use client'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadFantasy, saveFantasy } from '@/app/actions/fantasy'
import { useDeadline } from './useDeadline'

export function useFantasyXV(participantName: string) {
  const { fantasySquad, teamName, scratchpad, initFantasy, initScratchpad, setSaveStatus } = useGameStore()
  const { isPast } = useDeadline()
  const [isLoaded, setIsLoaded] = useState(false)
  const initialized = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadFantasy().then(({ squad, teamName: savedName, scratchpad: savedScratchpad }) => {
      initFantasy(squad, savedName || '')
      initScratchpad(savedScratchpad)
      setIsLoaded(true)
      initialized.current = true
    })
  }, [initFantasy, initScratchpad, participantName])

  useEffect(() => {
    if (!initialized.current || isPast) return
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await saveFantasy(fantasySquad, teamName, scratchpad)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [fantasySquad, teamName, scratchpad, isPast, setSaveStatus])

  return { isLoaded }
}
