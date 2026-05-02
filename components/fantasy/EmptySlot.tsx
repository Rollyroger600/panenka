interface Props {
  isTalent: boolean
  onClick: () => void
}

export function EmptySlot({ isTalent, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#2a2a2a] text-[#444] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors bg-[#111]"
    >
      <span className="text-lg leading-none">+</span>
      <span className="text-sm">{isTalent ? 'Talent toevoegen (U22)' : 'Speler toevoegen'}</span>
    </button>
  )
}
