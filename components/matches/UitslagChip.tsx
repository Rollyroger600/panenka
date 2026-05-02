'use client'

interface Props {
  uitslag: string | null
  onClick: () => void
}

export function UitslagChip({ uitslag, onClick }: Props) {
  const isSet = uitslag !== null
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors min-w-[52px] text-center ${
        isSet
          ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30'
          : 'bg-[#252525] text-[#555] hover:bg-[#2e2e2e] hover:text-[#888]'
      }`}
    >
      {isSet ? uitslag : 'Score'}
    </button>
  )
}
