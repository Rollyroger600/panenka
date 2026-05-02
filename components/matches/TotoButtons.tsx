'use client'
import { MATCH_ODDS } from '@/lib/data/odds'
import type { Toto } from '@/store/gameStore'

interface Props {
  matchId: number
  selected: Toto | null
  onChange: (toto: Toto) => void
}

const OPTIONS: { key: Toto; label: string }[] = [
  { key: '1', label: '1' },
  { key: 'X', label: 'X' },
  { key: '2', label: '2' },
]

export function TotoButtons({ matchId, selected, onChange }: Props) {
  const odds = MATCH_ODDS[matchId]

  return (
    <div className="flex gap-1">
      {OPTIONS.map(({ key, label }) => {
        const odd = odds ? (key === '1' ? odds.home : key === 'X' ? odds.draw : odds.away) : null
        const isSelected = selected === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 min-w-[40px] transition-colors ${
              isSelected
                ? 'bg-[#FF6B00] text-white'
                : 'bg-[#252525] text-[#aaa] hover:bg-[#2e2e2e]'
            }`}
          >
            <span className="text-xs font-bold leading-none">{label}</span>
            {odd !== null && (
              <span className={`text-[10px] leading-none mt-0.5 ${isSelected ? 'text-orange-100' : 'text-[#FFB800]'}`}>
                {odd.toFixed(2)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
