'use client'
import { useTokenBudget } from '@/hooks/useTokenBudget'

export function TokenCount({ initials }: { initials: string }) {
  const { remaining, total } = useTokenBudget(initials)
  const color = remaining < 0 ? 'text-[#E74C3C]' : 'text-[#FF6B00]'
  return (
    <span className={`text-sm font-bold ${color}`}>
      🪙 {remaining}/{total}
    </span>
  )
}
