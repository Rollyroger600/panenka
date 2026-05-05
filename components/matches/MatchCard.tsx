'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MATCH_ODDS } from '@/lib/data/odds'
import { abbrevCountry } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { TokenPicker } from './TokenPicker'
import { ScorePicker } from './ScorePicker'
import type { Match } from '@/lib/data/matches'

interface Props { match: Match }
type Panel = 'tokens' | 'score' | null

const MUTED = '#7e7667'
const LABEL = 'text-[9px] font-bold uppercase tracking-wider text-center'

export function MatchCard({ match }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const pred = predictions[match.id] ?? { toto: null, uitslag: null, tokens: null }
  const [openPanel, setOpenPanel] = useState<Panel>(null)

  const odds = MATCH_ODDS[match.id]
  const totoOdd = pred.toto
    ? pred.toto === '1' ? odds?.home : pred.toto === 'X' ? odds?.draw : odds?.away
    : null
  const scoreOdd = pred.uitslag && odds ? odds.scores[pred.uitslag] ?? null : null
  const maxScore =
    pred.tokens !== null && totoOdd != null && scoreOdd != null
      ? pred.tokens * totoOdd + pred.tokens * scoreOdd
      : null

  function togglePanel(panel: Panel) {
    setOpenPanel((p) => (p === panel ? null : panel))
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        {/* Match number — square badge */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          #{match.id}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="text-sm font-bold text-white">{abbrevCountry(match.home)}</span>
          <span className="font-bold" style={{ color: MUTED }}>-</span>
          <span className="text-sm font-bold text-white">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date} · {match.stadium}
        </p>
      </div>

      {/* Input row — spread full width */}
      <div className="flex justify-between items-end px-2 pt-2 pb-2">

        {/* Tokens */}
        <div className="flex flex-col items-center gap-1">
          <span className={LABEL} style={{ color: MUTED }}>Tokens</span>
          <button
            onClick={() => togglePanel('tokens')}
            className={`h-9 w-10 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border ${
              pred.tokens !== null
                ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
            }`}
            style={pred.tokens === null ? { color: MUTED } : undefined}
          >
            {pred.tokens ?? 'Kies'}
          </button>
        </div>

        {/* Toto + Quote toto */}
        <div className="flex items-end gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Toto</span>
            <TotoButtons
              matchId={match.id}
              selected={pred.toto}
              onChange={(toto) => setPrediction(match.id, { toto })}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`h-9 w-9 flex items-center justify-center text-xs font-bold rounded-lg border ${
              totoOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`}
              style={totoOdd == null ? { color: MUTED } : undefined}
            >
              {totoOdd != null ? totoOdd.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* Uitslag + Quote uitslag */}
        <div className="flex items-end gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Uitslag</span>
            <button
              onClick={() => togglePanel('score')}
              className={`h-9 w-16 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border ${
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
            <span className={`h-9 w-9 flex items-center justify-center text-xs font-bold rounded-lg border ${
              scoreOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`}
              style={scoreOdd == null ? { color: MUTED } : undefined}
            >
              {scoreOdd != null ? scoreOdd.toFixed(2) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Max score */}
      {maxScore !== null && (
        <div className="px-3 pb-2 flex justify-end">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Max. score{' '}
            <span className="text-[#FF6B00]">{maxScore.toFixed(1)} pts</span>
          </span>
        </div>
      )}

      {/* Token picker */}
      {openPanel === 'tokens' && (
        <div className="px-3 pb-2">
          <TokenPicker
            value={pred.tokens}
            onChange={(n) => setPrediction(match.id, { tokens: n })}
            onClose={() => setOpenPanel(null)}
          />
        </div>
      )}

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
