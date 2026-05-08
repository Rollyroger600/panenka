'use client'

interface Props {
  value: number | null
  onChange: (n: number) => void
  onClose: () => void
  min?: number
  max?: number
}

export function TokenPicker({ value, onChange, onClose, min = 1, max = 6 }: Props) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="flex items-center gap-1 py-1">
      {options.map((n) => (
        <button
          key={n}
          onClick={() => { onChange(n); onClose() }}
          className={`font-heading w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
            value === n
              ? 'bg-[#FF6B00] text-white'
              : 'bg-[#252525] text-[#aaa] hover:bg-[#333]'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={onClose}
        className="font-heading w-8 h-8 rounded-lg text-xs text-[#555] hover:text-[#888]"
      >
        ✕
      </button>
    </div>
  )
}
