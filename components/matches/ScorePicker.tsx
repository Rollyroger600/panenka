'use client'
import { MATCH_ODDS } from '@/lib/data/odds'
import type { Toto } from '@/store/gameStore'

interface Props {
  matchId: number
  toto: Toto | null
  selected: string | null
  onSelect: (score: string) => void
}

function parseScore(s: string): [number, number] {
  const [h, a] = s.split(' - ').map(Number)
  return [h, a]
}

function sortScores(scores: string[]): string[] {
  return scores.slice().sort((a, b) => {
    const [ah, aa] = parseScore(a)
    const [bh, ba] = parseScore(b)
    const totalA = ah + aa
    const totalB = bh + ba
    if (totalA !== totalB) return totalA - totalB
    return ah - bh
  })
}

function groupScores(matchId: number) {
  const scores = Object.keys(MATCH_ODDS[matchId]?.scores ?? {})
  const home: string[] = []
  const draw: string[] = []
  const away: string[] = []
  for (const s of scores) {
    const [h, a] = parseScore(s)
    if (h > a) home.push(s)
    else if (h === a) draw.push(s)
    else away.push(s)
  }
  return { home: sortScores(home), draw: sortScores(draw), away: sortScores(away) }
}

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
      <div className="font-heading text-xs text-[#555] font-bold uppercase tracking-wide mb-1 text-center">{title}</div>
      <div className="flex flex-col gap-0.5">
        {scores.map((score) => {
          const odd = odds?.scores[score]
          const isSelected = selected === score
          return (
            <button
              key={score}
              onClick={() => onSelect(score)}
              className={`flex items-center justify-between px-3.5 py-1 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-[#FF6B00]/20 text-[#FF6B00]'
                  : 'text-[#888] hover:bg-[#252525] hover:text-white'
              }`}
            >
              <span className="font-heading font-bold">{score}</span>
              {odd !== undefined && (
                <span className={`font-heading ml-0.5 ${isSelected ? 'text-[#FF6B00]' : 'text-[#7E7667]'}`}>
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
  const { home, draw, away } = groupScores(matchId)
  return (
    <div className="mt-2 p-2 rounded-xl bg-[#111] border border-[#2a2a2a]">
      <div className="flex gap-2">
        <ScoreColumn title="Thuis wint" scores={home} matchId={matchId} selected={selected} onSelect={onSelect} />
        <ScoreColumn title="Gelijk" scores={draw} matchId={matchId} selected={selected} onSelect={onSelect} />
        <ScoreColumn title="Uit wint" scores={away} matchId={matchId} selected={selected} onSelect={onSelect} />
      </div>
    </div>
  )
}
