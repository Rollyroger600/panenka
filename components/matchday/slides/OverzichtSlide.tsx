'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { ScoreStackedChart } from '@/components/matchday/charts/ScoreStackedChart'
import type { MatchdayScoreRow } from '@/lib/matchday'

interface Props {
  matchdayId: number
  rows: MatchdayScoreRow[]
}

function ScoreCell({ value }: { value: number }) {
  return (
    <td className="text-right text-[9px] text-[#ddd] px-1 py-0.5 tabular-nums">
      {value > 0 ? value.toFixed(1) : '–'}
    </td>
  )
}

function IntCell({ value }: { value: number }) {
  return (
    <td className="text-right text-[9px] text-[#ddd] px-1 py-0.5 tabular-nums">
      {value > 0 ? value : '–'}
    </td>
  )
}

export const OverzichtSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, rows }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    return (
      <SlideWrapper ref={ref} title={`OVERZICHT ${padded}`}>
        {/* Table 1: match score breakdown */}
        <div className="mb-2 overflow-x-auto">
          <table className="w-full" style={{ fontSize: 8 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,107,0,0.4)' }}>
                <th className="text-left text-[#FF6B00] px-1 py-0.5 font-heading text-[8px]">Naam</th>
                <th className="text-right text-[#FF6B00] px-1 py-0.5 font-heading text-[8px]">Poule</th>
                <th className="text-right text-[#FFB800] px-1 py-0.5 font-heading text-[8px]">KO</th>
                <th className="text-right text-[#2ECC71] px-1 py-0.5 font-heading text-[8px]">FXV</th>
                <th className="text-right text-[#aaa] px-1 py-0.5 font-heading text-[8px]">T✓</th>
                <th className="text-right text-[#aaa] px-1 py-0.5 font-heading text-[8px]">U✓</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.initials} className="border-b border-[#ffffff0a]">
                  <td className="text-white px-1 py-0.5 text-[9px] font-bold">{row.name}</td>
                  <ScoreCell value={row.poulefase} />
                  <ScoreCell value={row.kofase} />
                  <ScoreCell value={row.fantasy} />
                  <IntCell value={row.totoGoed} />
                  <IntCell value={row.uitslagGoed} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 2: KO breakdown */}
        <div className="mb-2 overflow-x-auto">
          <table className="w-full" style={{ fontSize: 8 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(61,139,219,0.4)' }}>
                <th className="text-left text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">Naam</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">R32</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">R16</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">KF</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">HF</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">Fin</th>
                <th className="text-right text-[#3498DB] px-1 py-0.5 font-heading text-[8px]">Win</th>
                <th className="text-right text-[#FF6B00] px-1 py-0.5 font-heading text-[8px] font-bold">Tot</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.initials} className="border-b border-[#ffffff0a]">
                  <td className="text-white px-1 py-0.5 text-[9px]">{row.name}</td>
                  <ScoreCell value={row.koR32} />
                  <ScoreCell value={row.koR16} />
                  <ScoreCell value={row.koKF} />
                  <ScoreCell value={row.koHF} />
                  <ScoreCell value={row.koFinale} />
                  <ScoreCell value={row.koWinnaar} />
                  <td className="text-right text-[9px] text-[#FF6B00] font-bold px-1 py-0.5 tabular-nums">
                    {row.total > 0 ? row.total.toFixed(1) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stacked bar chart */}
        <div className="rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[8px] text-[#888] mb-1 flex gap-3 justify-center">
            <span><span className="inline-block w-2 h-2 rounded-sm mr-0.5" style={{ background: '#FF6B00' }} />Poule</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-0.5" style={{ background: '#FFB800' }} />KO fase</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-0.5" style={{ background: '#2ECC71' }} />Fantasy</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-0.5" style={{ background: '#3498DB' }} />Doorgaande landen</span>
          </div>
          <ScoreStackedChart rows={rows} />
        </div>
      </SlideWrapper>
    )
  }
)

OverzichtSlide.displayName = 'OverzichtSlide'
