'use client'
import { useTokenBudget } from '@/hooks/useTokenBudget'

interface Props {
  initials: string
}

export function TokenBanner({ initials }: Props) {
  const { total, used, remaining } = useTokenBudget(initials)
  const pct = Math.min((used / total) * 100, 100)

  return (
    <div className="mb-4 rounded-xl bg-[#161616] border border-[#2a2a2a] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#888] uppercase tracking-widest">Token budget</span>
        <span className="text-sm font-bold text-white">
          <span className="text-[#FF6B00]">{remaining}</span>
          <span className="text-[#444]"> / {total}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#FF6B00] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#555]">{used} gebruikt</span>
        <span className="text-[10px] text-[#555]">{remaining} over</span>
      </div>
    </div>
  )
}
