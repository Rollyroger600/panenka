'use client'

interface Props {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}

export function TokenStepper({ value, min, max, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-6 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-bold text-[#FF6B00]">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-6 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
      >
        +
      </button>
    </div>
  )
}
