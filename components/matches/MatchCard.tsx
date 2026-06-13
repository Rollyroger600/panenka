'use client'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useTokenBudget } from '@/hooks/useTokenBudget'
import { MATCH_ODDS } from '@/lib/data/odds'
import { ODDS_TRENDS } from '@/lib/data/odds_trends'
import type { OddsTrend } from '@/lib/data/odds_trends'
import { abbrevCountry, normalizeUitslag } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { ScorePicker } from './ScorePicker'
import type { Match } from '@/lib/data/matches'
import type { MatchResult } from '@/lib/scoring'
import type { LiveGoalEvent } from '@/lib/types/matchday'

interface Props { match: Match; readOnly?: boolean; result?: MatchResult }
type Panel = 'score' | 'details' | null

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

export function MatchCard({ match, readOnly = false, result }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const { remaining } = useTokenBudget()
  const pred = predictions[match.id] ?? { toto: null, uitslag: null, tokens: null }
  const effectiveTokens = pred.tokens ?? 1
  const [openPanel, setOpenPanel] = useState<Panel>(null)

  const odds   = MATCH_ODDS[match.id]
  const trends = ODDS_TRENDS[match.id]

  const totoOdd = pred.toto
    ? pred.toto === '1' ? odds?.home : pred.toto === 'X' ? odds?.draw : odds?.away
    : null
  const totoTrend: OddsTrend = pred.toto
    ? pred.toto === '1' ? (trends?.home ?? null) : pred.toto === 'X' ? (trends?.draw ?? null) : (trends?.away ?? null)
    : null

  const scoreOdd   = pred.uitslag && odds ? odds.scores[pred.uitslag] ?? null : null
  const scoreTrend: OddsTrend = pred.uitslag && trends?.scores ? (trends.scores[pred.uitslag] ?? null) : null
  const maxScore =
    totoOdd != null && scoreOdd != null
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

  return (
    <div className={`rounded-xl border overflow-hidden ${result ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`} style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header */}
      <div
        className={`relative flex flex-col items-center px-3 py-2.5 ${result ? 'cursor-pointer select-none' : ''}`}
        style={{ background: 'rgba(10,10,10,0.75)' }}
        onClick={result ? () => setOpenPanel((p) => (p === 'details' ? null : 'details')) : undefined}
      >
        {/* Match number — square badge */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          # {match.id}
        </div>

        {/* Wis-knop — gespiegeld rechts (alleen in edit-modus) */}
        {!readOnly && (pred.toto !== null || pred.uitslag !== null) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPrediction(match.id, { toto: null, uitslag: null, tokens: 1 })
              setOpenPanel(null)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-xs font-bold text-[#666] hover:border-red-500/40 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(37,37,37,0.8)' }}
            title="Wis keuzes"
          >
            wis
          </button>
        )}

        {/* Chevron — zichtbaar zodra admin uitslag bevestigd heeft */}
        {result && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center pointer-events-none">
            <span
              className={`text-[10px] font-bold transition-transform duration-200 ${openPanel === 'details' ? 'rotate-180' : ''}`}
              style={{ color: MUTED }}
            >▼</span>
          </div>
        )}

        {/* Teams */}
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.home)}</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date}{match.time ? ` · ${match.time}` : ''} · {match.stadium}
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
              disabled={readOnly}
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
              {!readOnly && <TrendIndicator trend={totoTrend} />}
            </span>
          </div>
        </div>

        {/* Uitslag + Quote uitslag */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Uitslag</span>
            <button
              onClick={() => !readOnly && setOpenPanel((p) => (p === 'score' ? null : 'score'))}
              disabled={readOnly}
              className={`font-heading h-9 w-14 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border ${
                pred.uitslag !== null
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                  : readOnly
                  ? 'bg-[#1a1a1a] border-[#2a2a2a] cursor-not-allowed'
                  : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
              }`}
              style={pred.uitslag === null ? { color: MUTED } : undefined}
            >
              {pred.uitslag ? normalizeUitslag(pred.uitslag) : 'Kies'}
            </button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={LABEL} style={{ color: MUTED }}>Quote</span>
            <span className={`relative h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border ${
              scoreOdd != null ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-[#3a3a3a]'
            }`}
              style={scoreOdd == null ? { color: MUTED } : undefined}
            >
              {scoreOdd != null ? scoreOdd.toFixed(2) : '—'}
              {!readOnly && <TrendIndicator trend={scoreTrend} />}
            </span>
          </div>
        </div>
      </div>

      {/* Steppers + Score */}
      <div className={`px-2 pb-2 flex items-center ${readOnly ? 'justify-end' : 'justify-between'}`}>
        {!readOnly && (
          <div className="w-10 flex gap-0.5">
            <button
              onClick={() => setPrediction(match.id, { tokens: Math.max(1, effectiveTokens - 1) })}
              disabled={effectiveTokens <= 1}
              className="flex-1 h-6 rounded bg-[#252525] text-[#aaa] text-sm font-bold disabled:opacity-30 hover:bg-[#333] transition-colors"
            >−</button>
            <button
              onClick={() => setPrediction(match.id, { tokens: Math.min(6, effectiveTokens + 1) })}
              disabled={effectiveTokens >= 6 || remaining <= 0}
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

      {/* Wedstrijddetails dropdown */}
      {openPanel === 'details' && result && (
        <MatchDetailsDropdown
          matchId={match.id}
          result={result}
          predToto={pred.toto}
          predUitslag={pred.uitslag}
        />
      )}
    </div>
  )
}

// ── MatchDetailsDropdown ───────────────────────────────────────────────────────

interface DropdownProps {
  matchId: number
  result: MatchResult
  predToto: string | null
  predUitslag: string | null
}

function MatchDetailsDropdown({ matchId, result, predToto, predUitslag }: DropdownProps) {
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
      {/* Uitslag */}
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

      {/* Doelpunten */}
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
