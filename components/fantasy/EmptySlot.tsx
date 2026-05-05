interface Props {
  isTalent: boolean
  slotIndex: number
  onClick: () => void
}

export function EmptySlot({ isTalent, slotIndex, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#111] hover:border-[#FF6B00]/40 hover:bg-[#161616] transition-colors"
    >
      <span className="text-sm font-bold text-[#555] w-6 shrink-0 text-right">#{slotIndex}</span>
      <span className="w-7 shrink-0" />
      <span className="text-sm text-[#444]">
        {isTalent ? '+ Talent kiezen (U22)' : '+ Speler kiezen'}
      </span>
    </button>
  )
}
