'use client'
import type { Toto } from '@/store/gameStore'

interface Props {
  selected: Toto | null
  onChange: (toto: Toto) => void
  odds?: { home: number; draw: number; away: number }
}

const OPTIONS: { key: Toto; label: string; oddKey: 'home' | 'draw' | 'away' }[] = [
  { key: '1', label: '1', oddKey: 'home' },
  { key: 'X', label: 'X', oddKey: 'draw' },
  { key: '2', label: '2', oddKey: 'away' },
]

export function TotoButtons({ selected, onChange, odds }: Props) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map(({ key, label, oddKey }) => {
        const isSelected = selected === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`w-9 h-9 flex flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors ${
              isSelected
                ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
            }`}
            style={!isSelected ? { color: '#7e7667' } : undefined}
          >
            <span className="font-heading text-sm font-bold leading-none">{label}</span>
            {odds && (
              <span className="text-[9px] leading-none opacity-80">
                {odds[oddKey].toFixed(2)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
