import type { ParticipantScore } from '@/app/leaderboard/types'

interface Props {
  participants: ParticipantScore[]
  currentInitials?: string
  startRank?: number
}

export function RankList({ participants, currentInitials, startRank = 4 }: Props) {
  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-1 px-3 py-2 bg-[#111] text-[10px] text-[#444] uppercase tracking-wide">
        <span>#</span>
        <span>Naam</span>
        <span className="text-right">Poule</span>
        <span className="text-right">KO</span>
        <span className="text-right">Fantasy</span>
        <span className="text-right font-bold">Tot.</span>
      </div>
      {participants.map((p, i) => {
        const rank = startRank + i
        const isCurrent = p.initials === currentInitials
        return (
          <div
            key={p.initials}
            className={`grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center ${
              isCurrent ? 'bg-[#FF6B00]/10' : ''
            }`}
          >
            <span className="text-sm text-[#555] font-bold">{rank}</span>
            <span className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
              {p.name}
            </span>
            <span className="text-xs text-[#888] text-right">{p.poulefase ?? '—'}</span>
            <span className="text-xs text-[#888] text-right">{p.knockout ?? '—'}</span>
            <span className="text-xs text-[#888] text-right">{p.fantasy ?? '—'}</span>
            <span className={`text-sm font-bold text-right ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
              {p.total}
            </span>
          </div>
        )
      })}
    </div>
  )
}
