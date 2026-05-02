'use client'

interface Props {
  tokens: number | null
  onClick: () => void
}

export function TokenChip({ tokens, onClick }: Props) {
  const isSet = tokens !== null
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors min-w-[52px] justify-center ${
        isSet
          ? 'bg-[#FF6B00] text-white'
          : 'bg-[#252525] text-[#555] hover:bg-[#2e2e2e] hover:text-[#888]'
      }`}
    >
      <span>🪙</span>
      <span>{isSet ? tokens : 'Kies'}</span>
    </button>
  )
}
