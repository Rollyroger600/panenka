'use client'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { KO_MATCH_ODDS } from '@/lib/data/koMatchOdds'
import { abbrevCountry, normalizeUitslag } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { ScorePicker } from './ScorePicker'
import type { MatchResult } from '@/lib/scoring'
import type { LiveGoalEvent } from '@/lib/types/matchday'

interface Props {
  matchId: number
  home: string
  away: string
  date: string
  time?: string
  remainingBudget: number
  readOnly?: boolean
  result?: MatchResult
}

const MUTED = '#7e7667'
const LABEL = 'font-heading text-sm font-bold uppercase tracking-wider text-center'

type Panel = 'score' | 'details' | null

export function KoMatchCard({ matchId, home, away, date, time, remainingBudget, readOnly = false, result }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const pred = predictions[matchId] ?? { toto: null, uitslag: null, tokens: null }
  const effectiveTokens = pred.tokens ?? 1
  const [openPanel, setOpenPanel] = useState<Panel>(null)

  const odds = KO_MATCH_ODDS[matchId]
  const hasOdds = !!odds

  const totoOdd = pred.toto && odds
    ? pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
    : null
  const scoreOdd = pred.uitslag && odds ? (odds.scores[pred.uitslag] ?? null) : null
  const maxScore = totoOdd != null && scoreOdd != null
    ? effectiveTokens * totoOdd + effectiveTokens * scoreOdd
    : null

  const earnedScore = result && odds
    ? (() => {
        let s = 0
        if (pred.toto && pred.toto === result.toto) {
          const tOdd = pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
          s += effectiveTokens * tOdd
        }
        const normPred = pred.uitslag ? normalizeUitslag(pred.uitslag) : null
        const normResult = result.uitslag ? normalizeUitslag(result.uitslag) : null
        if (normPred && normPred === normResult) {
          s += effectiveTokens * (odds.scores[normPred] ?? 0)
        }
        return Math.round(s * 100) / 100
      })()
    : null

  const currentOwn = pred.tokens ?? 0
  const maxTokens = Math.min(6, currentOwn + remainingBudget)

  return (
    <div className={`rounded-xl border overflow-hidden ${result ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`} style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header */}
      <div
        className={`relative flex flex-col items-center px-3 py-2.5 ${result ? 'cursor-pointer select-none' : ''}`}
        style={{ background: 'rgba(10,10,10,0.75)' }}
        onClick={result ? () => setOpenPanel((p) => (p === 'details' ? null : 'details')) : undefined}
      >
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          #{matchId}
        </div>

        {!readOnly && (pred.toto !== null || pred.uitslag !== null) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPrediction(matchId, { toto: null, uitslag: null, tokens: 1 })
              setOpenPanel(null)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-xs font-bold text-[#666] hover:border-red-500/40 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(37,37,37,0.8)' }}
            title="Wis keuzes"
          >
            wis
          </button>
        )}

        {result && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center pointer-events-none">
            <span
              className={`text-[10px] font-bold transition-transform duration-200 ${openPanel === 'details' ? 'rotate-180' : ''}`}
              style={{ color: MUTED }}
            >▼</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <FlagImage country={home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(home)}</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(away)}</span>
          <FlagImage country={away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {date}{time ? ` · ${time}` : ''} · stand na 90 min
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
              disabled={readOnly}
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
              onClick={() => !readOnly && hasOdds && setOpenPanel((p) => (p === 'score' ? null : 'score'))}
              disabled={readOnly || !hasOdds}
              className={`font-heading h-9 w-14 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border ${
                pred.uitslag !== null
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                  : readOnly
                  ? 'bg-[#1a1a1a] border-[#2a2a2a] cursor-not-allowed'
                  : hasOdds
                  ? 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
                  : 'bg-[#111] border-[#2a2a2a] opacity-40 cursor-not-allowed'
              }`}
              style={pred.uitslag === null ? { color: MUTED } : undefined}
            >
              {pred.uitslag ? normalizeUitslag(pred.uitslag) : (hasOdds ? 'Kies' : '—')}
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

      {/* Steppers + Score */}
      <div className={`px-2 pb-2 flex items-center ${readOnly ? 'justify-end' : 'justify-between'}`}>
        {!readOnly && (
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
        )}
        {readOnly ? (
          <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Score{' '}
            {earnedScore !== null && earnedScore > 0
              ? <span className="text-[#FF6B00]">{earnedScore.toFixed(2)} pts</span>
              : <span style={{ color: MUTED }}>0.00 pts</span>
            }
          </span>
        ) : maxScore !== null && (
          <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Max. score{' '}
            <span className="text-[#FF6B00]">{maxScore.toFixed(1)} pts</span>
          </span>
        )}
      </div>

      {/* Score picker */}
      {!readOnly && openPanel === 'score' && (
        <div className="px-3 pb-3">
          <ScorePicker
            matchId={matchId}
            toto={pred.toto}
            selected={pred.uitslag}
            onSelect={(uitslag) => {
              if (readOnly) return
              setPrediction(matchId, { uitslag })
              setOpenPanel(null)
            }}
          />
        </div>
      )}

      {/* Wedstrijddetails dropdown */}
      {openPanel === 'details' && result && (
        <KoMatchDetailsDropdown
          matchId={matchId}
          result={result}
          predToto={pred.toto}
          predUitslag={pred.uitslag}
        />
      )}
    </div>
  )
}

function KoMatchDetailsDropdown({ matchId, result, predToto, predUitslag }: {
  matchId: number
  result: MatchResult
  predToto: string | null
  predUitslag: string | null
}) {
  const [goals, setGoals] = useState<LiveGoalEvent[] | null>(null)

  useEffect(() => {
    fetch(`/api/match/${matchId}/goals`)
      .then((r) => r.ok ? r.json() : { goals: [] })
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setGoals([]))
  }, [matchId])

  const totoCorrect = predToto === result.toto
  const uitslagCorrect = predUitslag != null && normalizeUitslag(predUitslag) === normalizeUitslag(result.uitslag)
  const scoreDisplay = result.uitslag.replace('-', ' - ')

  return (
    <div className="border-t border-[#222] px-3 py-3">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className={`font-heading text-xl font-bold ${uitslagCorrect ? 'text-emerald-400' : 'text-white'}`}>
          {scoreDisplay}
        </span>
        {totoCorrect && (
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-400/30 rounded px-1.5 py-0.5">
            Toto ✓
          </span>
        )}
      </div>

      {goals === null ? (
        <p className="text-center font-heading text-xs uppercase tracking-widest" style={{ color: MUTED }}>
          Laden…
        </p>
      ) : goals.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {goals.map((g, i) => {
            const label = `${g.minute}' ${g.scorer}${g.type === 'PENALTY' ? ' (P)' : g.type === 'OWN' ? ' (OG)' : ''}`
            return (
              <div key={i} className="flex items-start text-xs">
                {g.team === 'home' ? (
                  <>
                    <div className="flex-1 flex flex-col">
                      <span className="text-white font-medium">⚽ {label}</span>
                      {g.assister && (
                        <span className="pl-4" style={{ color: MUTED }}>↳ {g.assister}</span>
                      )}
                    </div>
                    <div className="flex-1" />
                  </>
                ) : (
                  <>
                    <div className="flex-1" />
                    <div className="flex-1 flex flex-col items-end">
                      <span className="text-white font-medium">{label} ⚽</span>
                      {g.assister && (
                        <span className="pr-4" style={{ color: MUTED }}>{g.assister} ↲</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
