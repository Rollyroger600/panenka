'use client'
import type { Toto } from '@/store/gameStore'

interface Props {
  selected: Toto | null
  onChange: (toto: Toto) => void
}

const OPTIONS: { key: Toto; label: string }[] = [
  { key: '1', label: '1' },
  { key: 'X', label: 'X' },
  { key: '2', label: '2' },
]

export function TotoButtons({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map(({ key, label }) => {
        const isSelected = selected === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`h-9 w-9 flex flex-col items-center justify-center rounded-lg border transition-colors ${
              isSelected
                ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
            }`}
            style={!isSelected ? { color: '#7e7667' } : undefined}
          >
            <span className="font-heading text-xs font-bold leading-none">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
