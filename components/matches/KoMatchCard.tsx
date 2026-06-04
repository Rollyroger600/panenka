'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { KO_MATCH_ODDS } from '@/lib/data/koMatchOdds'
import { abbrevCountry } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { ScorePicker } from './ScorePicker'

interface Props {
  matchId: number
  home: string
  away: string
  date: string
  remainingBudget: number
}

const MUTED = '#7e7667'
const LABEL = 'font-heading text-sm font-bold uppercase tracking-wider text-center'

export function KoMatchCard({ matchId, home, away, date, remainingBudget }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const pred = predictions[matchId] ?? { toto: null, uitslag: null, tokens: null }
  const effectiveTokens = pred.tokens ?? 1
  const [openScore, setOpenScore] = useState(false)

  const odds = KO_MATCH_ODDS[matchId]
  const hasOdds = !!odds

  const totoOdd = pred.toto && odds
    ? pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
    : null
  const scoreOdd = pred.uitslag && odds ? (odds.scores[pred.uitslag] ?? null) : null
  const maxScore = totoOdd != null && scoreOdd != null
    ? effectiveTokens * totoOdd + effectiveTokens * scoreOdd
    : null

  const isComplete = pred.toto !== null && pred.uitslag !== null

  // Token max: niet meer dan resterend budget + eigen tokens (bij aanpassen)
  const currentOwn = pred.tokens ?? 0
  const maxTokens = Math.min(6, currentOwn + remainingBudget)

  return (
    <div className={`rounded-xl border overflow-hidden ${isComplete ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`} style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          #{matchId}
        </div>

        {(pred.toto !== null || pred.uitslag !== null) && (
          <button
            onClick={() => { setPrediction(matchId, { toto: null, uitslag: null, tokens: 1 }); setOpenScore(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-xs font-bold text-[#666] hover:border-red-500/40 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(37,37,37,0.8)' }}
          >
            wis
          </button>
        )}

        <div className="flex items-center gap-2">
          <FlagImage country={home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(home)}</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(away)}</span>
          <FlagImage country={away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {date} · stand na 90 min
        </p>
      </div>

      {/* Input row */}
      <div className="flex justify-between items-start px-2 pt-2 pb-2">

        {/* Tokens */}
        <div className="flex flex-col items-center gap-1">
          <span className={LABEL} style={{ color: MUTED }}>Tokens</span>
          <div className="font-heading h-9 w-10 rounded-lg text-sm font-bold flex items-center justify-center border bg-[#FF6B00] border-[#FF6B00] text-white">
            {effectiveTokens}
          </div>
        </div>

        {/* Toto */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Toto</span>
            <TotoButtons
              selected={pred.toto}
              onChange={(toto) => setPrediction(matchId, { toto })}
              odds={odds ? { home: odds.home, draw: odds.draw, away: odds.away } : undefined}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border ${
              totoOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`} style={totoOdd == null ? { color: MUTED } : undefined}>
              {totoOdd != null ? totoOdd.toFixed(2) : hasOdds ? '—' : '…'}
            </span>
          </div>
        </div>

        {/* Uitslag */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Uitslag</span>
            <button
              onClick={() => hasOdds && setOpenScore((p) => !p)}
              disabled={!hasOdds}
              className={`font-heading h-9 w-14 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border ${
                pred.uitslag !== null
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                  : hasOdds
                  ? 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
                  : 'bg-[#111] border-[#2a2a2a] opacity-40 cursor-not-allowed'
              }`}
              style={pred.uitslag === null ? { color: MUTED } : undefined}
            >
              {pred.uitslag ?? (hasOdds ? 'Kies' : '—')}
            </button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border ${
              scoreOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`} style={scoreOdd == null ? { color: MUTED } : undefined}>
              {scoreOdd != null ? scoreOdd.toFixed(2) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Steppers + Max score */}
      <div className="px-2 pb-2 flex justify-between items-center">
        <div className="w-10 flex gap-0.5">
          <button
            onClick={() => setPrediction(matchId, { tokens: Math.max(1, effectiveTokens - 1) })}
            disabled={effectiveTokens <= 1}
            className="flex-1 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
          >−</button>
          <button
            onClick={() => setPrediction(matchId, { tokens: Math.min(maxTokens, effectiveTokens + 1) })}
            disabled={effectiveTokens >= maxTokens}
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

      {openScore && (
        <div className="px-3 pb-3">
          <ScorePicker
            matchId={matchId}
            toto={pred.toto}
            selected={pred.uitslag}
            onSelect={(uitslag) => { setPrediction(matchId, { uitslag }); setOpenScore(false) }}
          />
        </div>
      )}
    </div>
  )
}
