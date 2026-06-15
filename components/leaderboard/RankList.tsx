import type { ParticipantScore } from '@/app/leaderboard/types'

interface Props {
  participants: ParticipantScore[]
  currentInitials?: string
  startRank?: number
  scoreKey?: keyof ParticipantScore
  scoreLabel?: string
  positionDeltas?: Record<string, number>
}

function TrendArrow({ delta }: { delta: number | undefined }) {
  if (delta === undefined || delta === 0) return null
  return delta > 0
    ? <span className="text-[9px] text-[#4CAF50] font-bold leading-none">▲{delta}</span>
    : <span className="text-[9px] text-[#F44336] font-bold leading-none">▼{Math.abs(delta)}</span>
}

export function RankList({ participants, currentInitials, startRank = 4, scoreKey, scoreLabel, positionDeltas }: Props) {
  const isSingle = scoreKey && scoreKey !== 'total'

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      {isSingle ? (
        <>
          <div className="grid grid-cols-[3.5rem_1fr_4rem] gap-1 px-3 py-2 bg-[#111] text-[10px] text-[#888] uppercase tracking-wide">
            <span>#</span>
            <span>Naam</span>
            <span className="text-right font-bold">{scoreLabel ?? String(scoreKey)}</span>
          </div>
          {participants.map((p, i) => {
            const rank = startRank + i
            const isCurrent = p.initials === currentInitials
            const delta = positionDeltas?.[p.initials]
            return (
              <div
                key={p.initials}
                className={`grid grid-cols-[3.5rem_1fr_4rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center ${
                  isCurrent ? 'bg-[#FF6B00]/10' : ''
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-sm text-[#555] font-bold">{rank}</span>
                  <TrendArrow delta={delta} />
                </div>
                <span className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
                  {p.name}
                </span>
                <span className={`text-sm font-bold text-right ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
                  {scoreKey === 'totoCorrect' || scoreKey === 'uitslagCorrect'
                    ? (p[scoreKey] as number)
                    : (p[scoreKey] as number).toFixed(2)}
                </span>
              </div>
            )
          })}
        </>
      ) : (
        <>
          <div className="grid grid-cols-[3.5rem_1fr_3rem_3rem_3rem_3rem] gap-1 px-3 py-2 bg-[#111] text-[10px] text-[#888] uppercase tracking-wide">
            <span>#</span>
            <span>Naam</span>
            <span className="text-right">Poule</span>
            <span className="text-right">Landen</span>
            <span className="text-right">Fantasy</span>
            <span className="text-right font-bold">Tot.</span>
          </div>
          {participants.map((p, i) => {
            const rank = startRank + i
            const isCurrent = p.initials === currentInitials
            const delta = positionDeltas?.[p.initials]
            return (
              <div
                key={p.initials}
                className={`grid grid-cols-[3.5rem_1fr_3rem_3rem_3rem_3rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center ${
                  isCurrent ? 'bg-[#FF6B00]/10' : ''
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-sm text-[#555] font-bold">{rank}</span>
                  <TrendArrow delta={delta} />
                </div>
                <span className={`text-sm font-bold truncate ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
                  {p.name}
                </span>
                <span className="text-xs text-[#888] text-right">{p.poulefase != null ? p.poulefase.toFixed(2) : '—'}</span>
                <span className="text-xs text-[#888] text-right">{p.knockout ?? '—'}</span>
                <span className="text-xs text-[#888] text-right">{p.fantasy ?? '—'}</span>
                <span className={`text-sm font-bold text-right ${isCurrent ? 'text-[#FF6B00]' : 'text-white'}`}>
                  {p.total.toFixed(2)}
                </span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
