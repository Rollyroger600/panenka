'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { ProgressChart } from '@/components/matchday/charts/ProgressChart'
import type { MatchdayScoreRow } from '@/lib/matchday'
import type { ScoreHistoryPoint } from '@/lib/types/matchday'

interface Props {
  matchdayId: number
  rows: MatchdayScoreRow[]  // current ranking (sorted by total)
  scoreHistory: ScoreHistoryPoint[]
  totalMatchdays: number
}

export const RanglijstSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, rows, scoreHistory, totalMatchdays }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')
    const participants = rows.map((r) => ({ initials: r.initials, name: r.name }))

    return (
      <SlideWrapper ref={ref} title={`RANGLIJST ${padded}`}>
        {/* Progress line chart */}
        <div className="rounded-lg p-2 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[#888] text-[9px] text-center mb-1 font-heading tracking-wide uppercase">
            Totaalscore per matchday
          </p>
          <ProgressChart
            history={scoreHistory}
            participants={participants}
            totalMatchdays={totalMatchdays}
          />
        </div>

        {/* Tussenstand table */}
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="font-heading text-[#FF6B00] text-xs tracking-wider mb-2 uppercase">
            Tussenstand
          </p>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,107,0,0.3)' }}>
                <th className="text-left text-[#888] text-[8px] px-1 py-0.5 font-heading w-6">#</th>
                <th className="text-left text-[#888] text-[8px] px-1 py-0.5 font-heading">Naam</th>
                <th className="text-right text-[#888] text-[8px] px-1 py-0.5 font-heading">Poule</th>
                <th className="text-right text-[#888] text-[8px] px-1 py-0.5 font-heading">KO</th>
                <th className="text-right text-[#888] text-[8px] px-1 py-0.5 font-heading">FXV</th>
                <th className="text-right text-[#FF6B00] text-[8px] px-1 py-0.5 font-heading font-bold">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.initials}
                  className="border-b border-[#ffffff08]"
                  style={i === 0 ? { background: 'rgba(255,107,0,0.1)' } : undefined}
                >
                  <td className="text-[#888] text-[9px] px-1 py-0.5 w-6">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </td>
                  <td className="text-white text-[9px] px-1 py-0.5 font-bold">{row.name}</td>
                  <td className="text-right text-[9px] text-[#ddd] px-1 py-0.5 tabular-nums">
                    {row.poulefase > 0 ? row.poulefase.toFixed(1) : '–'}
                  </td>
                  <td className="text-right text-[9px] text-[#ddd] px-1 py-0.5 tabular-nums">
                    {(row.kofase + row.doorgaandeLanden) > 0 ? (row.kofase + row.doorgaandeLanden).toFixed(1) : '–'}
                  </td>
                  <td className="text-right text-[9px] text-[#ddd] px-1 py-0.5 tabular-nums">
                    {row.fantasy > 0 ? row.fantasy.toFixed(1) : '–'}
                  </td>
                  <td className="text-right text-[9px] text-[#FF6B00] font-bold px-1 py-0.5 tabular-nums">
                    {row.total > 0 ? row.total.toFixed(1) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideWrapper>
    )
  }
)

RanglijstSlide.displayName = 'RanglijstSlide'
