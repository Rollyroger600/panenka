import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import type { Player } from '@/lib/data/players'

interface Props {
  player: Player
  onMoveToScratchpad?: () => void
}

export function PlayerInfoCard({ player, onMoveToScratchpad }: Props) {
  const quote = computePlayerQuote(player)
  const age = Math.floor(
    (new Date('2026-06-11').getTime() - new Date(player.dob).getTime()) / (365.25 * 24 * 3600 * 1000),
  )

  const cells = [
    { label: 'Overall', value: player.overall },
    { label: 'Positie(s)', value: player.positions.join(', ') },
    { label: 'Leeftijd WK', value: `${age} jr` },
    { label: 'Club', value: player.club },
    { label: 'Competitie', value: player.league },
    { label: 'Conf.', value: player.confederation },
  ]

  return (
    <div className="mx-1 mb-2 rounded-xl bg-[#111] border border-[#2a2a2a] p-3">
      <div className="flex items-center gap-2 mb-3">
        <FlagImage country={player.country} size={20} />
        <span className="text-sm font-bold text-white">{player.fullName}</span>
        <span className="ml-auto text-sm font-bold text-white">Quote {formatQuote(quote)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {cells.map(({ label, value }) => (
          <div key={label} className="bg-[#1a1a1a] rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-[#888] uppercase tracking-wide">{label}</div>
            <div className="text-xs font-bold text-[#ccc] truncate">{value}</div>
          </div>
        ))}
      </div>
      {onMoveToScratchpad && (
        <button
          onClick={onMoveToScratchpad}
          className="w-full py-1.5 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 text-xs font-bold hover:bg-[#FF6B00]/20 transition-colors"
        >
          ↓ Naar kladblok
        </button>
      )}
    </div>
  )
}
