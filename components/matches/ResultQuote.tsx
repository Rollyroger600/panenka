interface Props {
  tokens: number | null
  odds: number | null
}

export function ResultQuote({ tokens, odds }: Props) {
  const value = tokens !== null && odds !== null ? (tokens * odds).toFixed(2) : null
  return (
    <span
      className={`text-xs font-bold rounded px-1.5 py-0.5 ${
        value ? 'text-[#FFB800] bg-[#FFB800]/10' : 'text-[#333]'
      }`}
    >
      {value ? `★ ${value}` : '—'}
    </span>
  )
}
