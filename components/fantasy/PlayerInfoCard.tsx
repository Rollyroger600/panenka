import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import type { Player } from '@/lib/data/players'

interface Props {
  player: Player
  onRemove: () => void
  onMoveToScratchpad?: () => void
}

export function PlayerInfoCard({ player, onRemove, onMoveToScratchpad }: Props) {
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
            <div className="text-[9px] text-[#555] uppercase tracking-wide">{label}</div>
            <div className="text-xs font-bold text-[#ccc] truncate">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {onMoveToScratchpad && (
          <button
            onClick={onMoveToScratchpad}
            className="flex-1 py-1.5 rounded-lg bg-[#1a2a3a] text-[#4a9eff] border border-[#4a9eff]/20 text-xs font-bold hover:bg-[#1a2a3a]/80 transition-colors"
          >
            ↓ Naar kladblok
          </button>
        )}
        <button
          onClick={onRemove}
          className="flex-1 py-1.5 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] text-xs font-bold hover:bg-[#E74C3C]/20 transition-colors"
        >
          ✕ Verwijder
        </button>
      </div>
    </div>
  )
}
