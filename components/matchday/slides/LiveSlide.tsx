'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import { COUNTRY_ABB } from '@/lib/data/countries'
import { MATCHES } from '@/lib/data/matches'
import type { LiveMatchData } from '@/lib/types/matchday'

interface Props {
  matchdayId: number
  liveMatches: LiveMatchData[]
  exporting?: boolean
}

const HDR_BOTTOM = '1px solid rgba(255,255,255,0.15)'
const ROW_BOTTOM = '1px solid rgba(255,255,255,0.05)'
const MUTED = 'rgba(255,255,255,0.35)'

function totoLabel(t: '1' | 'X' | '2' | null) {
  if (!t) return '—'
  return t
}

function goalTypeLabel(type: string) {
  if (type === 'PENALTY') return ' (P)'
  if (type === 'OWN') return ' (OG)'
  return ''
}

export const LiveSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, liveMatches, exporting = false }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    return (
      <SlideWrapper ref={ref} minHeight={720}>
        {/* Title row with live indicator */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="live-pulse-dot" />
          <span className="font-heading text-white text-[13px] tracking-widest uppercase">
            Live — Matchday {padded}
          </span>
        </div>

        {liveMatches.map((lm) => {
          const match = MATCHES.find((m) => m.id === lm.matchId)
          if (!match) return null

          const homeAbb = COUNTRY_ABB[match.home] ?? match.home
          const awayAbb = COUNTRY_ABB[match.away] ?? match.away
          const minuteStr = lm.status === 'PAUSED' ? 'HT' : lm.minute != null ? `${lm.minute}'` : ''

          return (
            <div key={lm.matchId} className="mb-4">
              {/* Score header */}
              <div className="flex items-center justify-center gap-3 mb-1">
                <FlagImage country={match.home} size={28} />
                <span className="font-accent font-light text-base text-white">{homeAbb}</span>
                <span className="font-heading text-white text-xl" style={{ minWidth: 48, textAlign: 'center' }}>
                  {lm.score.home} – {lm.score.away}
                </span>
                <span className="font-accent font-light text-base text-white">{awayAbb}</span>
                <FlagImage country={match.away} size={28} />
                {minuteStr && (
                  <span className="font-heading text-[11px]" style={{ color: MUTED, minWidth: 28 }}>
                    {minuteStr}
                  </span>
                )}
              </div>

              {/* Goal scorers */}
              {lm.goals.length > 0 && (
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mb-3">
                  {lm.goals.map((g, i) => (
                    <span key={i} className="font-heading text-[9px]" style={{ color: MUTED }}>
                      ⚽ {g.minute}' {g.scorer}{goalTypeLabel(g.type)}
                    </span>
                  ))}
                </div>
              )}

              {/* Participant table */}
              <div style={{ borderBottom: HDR_BOTTOM, paddingBottom: 3, marginBottom: 3 }}>
                <div className="grid font-heading text-[9px] uppercase tracking-wider" style={{ color: MUTED, gridTemplateColumns: '1fr 28px 56px 48px 44px' }}>
                  <span>Deelnemer</span>
                  <span className="text-center">Toto</span>
                  <span className="text-center">Uitslag</span>
                  <span className="text-center">FXV</span>
                  <span className="text-right">Punten</span>
                </div>
              </div>

              {lm.participantRows.map((row) => (
                <div
                  key={row.initials}
                  className="grid items-center"
                  style={{ gridTemplateColumns: '1fr 28px 56px 48px 44px', borderBottom: ROW_BOTTOM, paddingTop: 3, paddingBottom: 3 }}
                >
                  <span className="font-heading text-[10px] text-white truncate">
                    {row.name.split(' ')[0]}
                  </span>

                  {/* Toto */}
                  <span
                    className="font-heading text-[10px] text-center"
                    style={{ color: row.totoCorrect ? '#4ade80' : row.toto ? '#f87171' : MUTED }}
                  >
                    {row.totoCorrect ? '✓' : row.toto ? totoLabel(row.toto) : '—'}
                  </span>

                  {/* Uitslag */}
                  <span
                    className="font-heading text-[9px] text-center"
                    style={{ color: row.uitslagCorrect ? '#4ade80' : row.uitslag ? MUTED : MUTED }}
                  >
                    {row.uitslagCorrect ? `✓ ${row.uitslag}` : (row.uitslag ?? '—')}
                  </span>

                  {/* Fantasy */}
                  <span className="font-heading text-[9px] text-center" style={{ color: row.potentialFantasyPoints > 0 ? '#facc15' : MUTED }}>
                    {row.fantasyGoals > 0 || row.fantasyAssists > 0
                      ? `${row.fantasyGoals}G ${row.fantasyAssists}A`
                      : '—'}
                  </span>

                  {/* Total potential */}
                  <span
                    className="font-heading text-[10px] text-right"
                    style={{ color: row.totalPotential > 0 ? '#FF6B00' : MUTED }}
                  >
                    {row.totalPotential > 0 ? row.totalPotential.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}

        {liveMatches.length === 0 && (
          <div className="flex items-center justify-center flex-1">
            <span className="font-heading text-[11px]" style={{ color: MUTED }}>
              Geen live wedstrijden
            </span>
          </div>
        )}
      </SlideWrapper>
    )
  }
)

LiveSlide.displayName = 'LiveSlide'
