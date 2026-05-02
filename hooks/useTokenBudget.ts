'use client'
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'

const EXTRA_TOKENS: Record<string, number> = {
  MG: 9, BH: 5, TW: 4, HP: 2, RH: 10, DM: 9,
  BM: 5, RA: 3, TdL: 1, WP: 4, BS: 7, WS: 6, TvL: 5, TG: 9, LV: 3,
}

export function useTokenBudget(initials: string) {
  const predictions = useGameStore((s) => s.predictions)
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)
  const base = 335
  const bonus = EXTRA_TOKENS[initials] ?? 0
  const total = base + bonus
  const used = useMemo(() => {
    const poule = Object.values(predictions).reduce((sum, p) => sum + (p.tokens ?? 0), 0)
    const ko = Object.values(knockoutPicks).reduce(
      (sum, slot) => sum + (slot.country ? slot.tok : 0),
      0,
    )
    return poule + ko
  }, [predictions, knockoutPicks])
  return { base, bonus, total, used, remaining: total - used }
}
