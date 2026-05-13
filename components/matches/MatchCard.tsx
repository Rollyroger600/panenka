'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MATCH_ODDS } from '@/lib/data/odds'
import { ODDS_TRENDS } from '@/lib/data/odds_trends'
import type { OddsTrend } from '@/lib/data/odds_trends'
import { abbrevCountry } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { ScorePicker } from './ScorePicker'
import type { Match } from '@/lib/data/matches'

interface Props { match: Match }
type Panel = 'score' | null

const MUTED = '#7e7667'
const LABEL = 'font-heading text-sm font-bold uppercase tracking-wider text-center'

function TrendIndicator({ trend }: { trend: OddsTrend }) {
  if (!trend || trend === 'same') return null
  return (
    <span
      className={`absolute top-0.5 right-0.5 text-[7px] leading-none font-bold ${
        trend === 'up' ? 'text-[#FF6B00]' : 'text-emerald-400'
      }`}
    >
      {trend === 'up' ? '▲' : '▼'}
    </span>
  )
}

export function MatchCard({ match }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const pred = predictions[match.id] ?? { toto: null, uitslag: null, tokens: null }
  const effectiveTokens = pred.tokens ?? 1
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const isComplete = pred.toto !== null && pred.uitslag !== null

  const odds   = MATCH_ODDS[match.id]
  const trends = ODDS_TRENDS[match.id]

  const totoOdd = pred.toto
    ? pred.toto === '1' ? odds?.home : pred.toto === 'X' ? odds?.draw : odds?.away
    : null
  const totoTrend: OddsTrend = pred.toto
    ? pred.toto === '1' ? (trends?.home ?? null) : pred.toto === 'X' ? (trends?.draw ?? null) : (trends?.away ?? null)
    : null

  const scoreOdd = pred.uitslag && odds ? odds.scores[pred.uitslag] ?? null : null
  const maxScore =
    totoOdd != null && scoreOdd != null
      ? effectiveTokens * totoOdd + effectiveTokens * scoreOdd
      : null

  return (
    <div className={`rounded-xl border overflow-hidden ${isComplete ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`} style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        {/* Match number — square badge */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          # {match.id}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.home)}</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date} · {match.stadium}
        </p>
      </div>

      {/* Input row — spread full width */}
      <div className="flex justify-between items-start px-2 pt-2 pb-2">

        {/* Tokens */}
        <div className="flex flex-col items-center gap-1">
          <span className={LABEL} style={{ color: MUTED }}>Tokens</span>
          <div className="font-heading h-9 w-10 rounded-lg text-sm font-bold flex items-center justify-center border bg-[#FF6B00] border-[#FF6B00] text-white">
            {effectiveTokens}
          </div>
        </div>

        {/* Toto + Quote toto */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Toto</span>
            <TotoButtons
              selected={pred.toto}
              onChange={(toto) => setPrediction(match.id, { toto })}
              odds={odds ? { home: odds.home, draw: odds.draw, away: odds.away } : undefined}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`relative h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border ${
              totoOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`}
              style={totoOdd == null ? { color: MUTED } : undefined}
            >
              {totoOdd != null ? totoOdd.toFixed(2) : '—'}
              <TrendIndicator trend={totoTrend} />
            </span>
          </div>
        </div>

        {/* Uitslag + Quote uitslag */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Uitslag</span>
            <button
              onClick={() => setOpenPanel((p) => (p === 'score' ? null : 'score'))}
              className={`font-heading h-9 w-14 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border ${
                pred.uitslag !== null
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                  : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
              }`}
              style={pred.uitslag === null ? { color: MUTED } : undefined}
            >
              {pred.uitslag ?? 'Kies'}
            </button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border ${
              scoreOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`}
              style={scoreOdd == null ? { color: MUTED } : undefined}
            >
              {scoreOdd != null ? scoreOdd.toFixed(2) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Steppers + Max score */}
      <div className="px-2 pb-2 flex justify-between items-center">
        <div className="w-10 flex gap-0.5">
          <button
            onClick={() => setPrediction(match.id, { tokens: Math.max(1, effectiveTokens - 1) })}
            disabled={effectiveTokens <= 1}
            className="flex-1 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
          >−</button>
          <button
            onClick={() => setPrediction(match.id, { tokens: Math.min(6, effectiveTokens + 1) })}
            disabled={effectiveTokens >= 6}
            className="flex-1 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
          >+</button>
        </div>
        {maxScore !== null && (
          <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Max. score{' '}
            <span className="text-[#FF6B00]">{maxScore.toFixed(1)} pts</span>
          </span>
        )}
      </div>

      {/* Score picker */}
      {openPanel === 'score' && (
        <div className="px-3 pb-3">
          <ScorePicker
            matchId={match.id}
            toto={pred.toto}
            selected={pred.uitslag}
            onSelect={(uitslag) => {
              setPrediction(match.id, { uitslag })
              setOpenPanel(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
