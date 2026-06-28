'use client'
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PARTICIPANTS } from '@/lib/participants'

// Budget voor groepsfase (1–72) + KO-landen picks
export function useTokenBudget(initials?: string) {
  const storeInitials = useGameStore((s) => s.participantInitials)
  const effectiveInitials = initials ?? storeInitials
  const predictions = useGameStore((s) => s.predictions)
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)
  const base = 335
  const bonus = PARTICIPANTS.find((p) => p.initials === effectiveInitials)?.extra ?? 0
  const total = base + bonus
  const used = useMemo(() => {
    const poule = Object.entries(predictions)
      .filter(([id]) => parseInt(id) <= 72)
      .reduce((sum, [, p]) => sum + (p.tokens ?? 1), 0)
    const ko = Object.values(knockoutPicks).reduce(
      (sum, slot) => sum + (slot.country ? slot.tok : 0),
      0,
    )
    return poule + ko
  }, [predictions, knockoutPicks])
  return { base, bonus, total, used, remaining: total - used }
}

// Budget voor KO-wedstrijden toto/uitslag (73–104)
// Base: 50 tokens + bonus Oranje-tokens (berekend door server na scorerun)
// availableMatchCount = aantal wedstrijden met bekende teams (elk 1 token minimum)
export function useKoMatchBudget(oranjeTokens: number, availableMatchCount = 0) {
  const predictions = useGameStore((s) => s.predictions)
  const base = 65
  const total = base + oranjeTokens
  const used = useMemo(() => {
    const filledIds = new Set<number>()
    let sum = 0
    for (const [idStr, p] of Object.entries(predictions)) {
      const id = parseInt(idStr)
      if (id < 73) continue
      filledIds.add(id)
      sum += p.tokens ?? 1
    }
    const unfilledCount = Math.max(0, availableMatchCount - filledIds.size)
    return sum + unfilledCount
  }, [predictions, availableMatchCount])
  return { base, oranjeTokens, total, used, remaining: total - used }
}
