import type { ParticipantScore } from '@/app/leaderboard/types'

interface Props {
  top3: ParticipantScore[]
}

const ORDER = [1, 0, 2] // visual order: 2nd | 1st | 3rd

const MEDAL = ['🥇', '🥈', '🥉']
const HEIGHT = ['h-20', 'h-28', 'h-14']
const NAME_SIZE = ['text-sm', 'text-base', 'text-sm']

export function Podium({ top3 }: Props) {
  if (top3.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-2 mb-8">
      {ORDER.map((i) => {
        const p = top3[i]
        if (!p) return <div key={i} className="flex-1" />
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <span className="text-2xl mb-1">{MEDAL[i]}</span>
            <span className={`font-bold text-white text-center ${NAME_SIZE[i]}`}>{p.name}</span>
            <span className="text-[#FF6B00] text-lg font-bold">{p.total}</span>
            <div
              className={`w-full rounded-t-lg mt-2 flex items-center justify-center ${HEIGHT[i]} ${
                i === 0
                  ? 'bg-[#FFB800]/20 border border-[#FFB800]/40'
                  : 'bg-[#252525] border border-[#2a2a2a]'
              }`}
            >
              <span className="text-2xl font-bold text-[#444]">{i + 1}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
