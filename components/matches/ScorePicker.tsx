'use client'
import { MATCH_ODDS } from '@/lib/data/odds'
import type { Toto } from '@/store/gameStore'

interface Props {
  matchId: number
  toto: Toto | null
  selected: string | null
  onSelect: (score: string) => void
}

// Scores are grouped by result type
const HOME_WIN_SCORES = ['1 - 0', '2 - 0', '2 - 1', '3 - 0', '3 - 1', '3 - 2', '4 - 0', '4 - 1', '4 - 2', '4 - 3', '5 - 1', '5 - 2']
const DRAW_SCORES = ['0 - 0', '1 - 1', '2 - 2', '3 - 3', '4 - 4']
const AWAY_WIN_SCORES = ['0 - 1', '0 - 2', '1 - 2', '0 - 3', '1 - 3', '2 - 3', '0 - 4', '1 - 4', '2 - 4', '3 - 4', '0 - 5', '1 - 5', '2 - 5']

function ScoreColumn({ title, scores, matchId, selected, onSelect }: {
  title: string
  scores: string[]
  matchId: number
  selected: string | null
  onSelect: (s: string) => void
}) {
  const odds = MATCH_ODDS[matchId]
  return (
    <div className="flex-1">
      <div className="text-[10px] text-[#555] font-bold uppercase tracking-wide mb-1 text-center">{title}</div>
      <div className="flex flex-col gap-0.5">
        {scores.map((score) => {
          const odd = odds?.scores[score]
          const isSelected = selected === score
          return (
            <button
              key={score}
              onClick={() => onSelect(score)}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                  : 'text-[#888] hover:bg-[#252525] hover:text-white'
              }`}
            >
              <span className="font-bold">{score}</span>
              {odd !== undefined && (
                <span className={`ml-1 ${isSelected ? 'text-[#2ECC71]' : 'text-[#FFB800]'}`}>
                  {odd.toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ScorePicker({ matchId, toto, selected, onSelect }: Props) {
  return (
    <div className="mt-2 p-2 rounded-xl bg-[#111] border border-[#2a2a2a]">
      <div className="flex gap-2">
        <ScoreColumn title="Thuis wint" scores={HOME_WIN_SCORES} matchId={matchId} selected={selected} onSelect={onSelect} />
        <ScoreColumn title="Gelijk" scores={DRAW_SCORES} matchId={matchId} selected={selected} onSelect={onSelect} />
        <ScoreColumn title="Uit wint" scores={AWAY_WIN_SCORES} matchId={matchId} selected={selected} onSelect={onSelect} />
      </div>
    </div>
  )
}
