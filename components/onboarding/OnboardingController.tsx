'use client'
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { OnboardingSlides } from './OnboardingSlides'

export function OnboardingController() {
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen)

  useEffect(() => {
    if (localStorage.getItem('onboarding_seen')) return
    const t = setTimeout(() => setOnboardingOpen(true), 1000)
    return () => clearTimeout(t)
  }, [setOnboardingOpen])

  return <OnboardingSlides />
}
