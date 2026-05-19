'use client'
import { forwardRef, useState } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { ProgressChart } from '@/components/matchday/charts/ProgressChart'
import type { MatchdayScoreRow } from '@/lib/matchday'
import type { ScoreHistoryPoint } from '@/lib/types/matchday'

interface Props {
  matchdayId: number
  rows: MatchdayScoreRow[]
  scoreHistory: ScoreHistoryPoint[]
  totalMatchdays: number
  exporting?: boolean
}

const VLINE     = '1px solid rgba(255,255,255,0.14)'
const HDR_BOTTOM = '1px solid rgba(255,255,255,0.15)'
const ROW_BOTTOM = '1px solid rgba(255,255,255,0.05)'

type MetricKey = 'total' | 'poulefase' | 'kofase' | 'fantasy' | 'doorgaandeLanden' | 'totoGoed' | 'uitslagGoed'

const METRICS: Array<{ key: MetricKey; label: string; isInt?: boolean }> = [
  { key: 'total',            label: 'Totaal'  },
  { key: 'poulefase',        label: 'Poule'   },
  { key: 'kofase',           label: 'KO'      },
  { key: 'fantasy',          label: 'FXV'     },
  { key: 'doorgaandeLanden', label: 'Landen'  },
  { key: 'totoGoed',         label: "Toto's", isInt: true },
  { key: 'uitslagGoed',      label: 'Uitsl.', isInt: true },
]

const COL_COUNT = 4

export const RanglijstSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, rows, scoreHistory, totalMatchdays, exporting = false }, ref) => {
    const [metricIdx, setMetricIdx] = useState(0)
    const padded      = String(matchdayId).padStart(2, '0')
    const participants = rows.map((r) => ({ initials: r.initials, name: r.name }))

    const metric = exporting ? METRICS[0] : METRICS[metricIdx]
    const sorted = [...rows].sort(
      (a, b) => (b[metric.key] as number) - (a[metric.key] as number)
    )

    const perCol  = Math.ceil(sorted.length / COL_COUNT)
    const columns = Array.from({ length: COL_COUNT }, (_, ci) =>
      sorted.slice(ci * perCol, ci * perCol + perCol)
    )

    return (
      <SlideWrapper ref={ref} title={`RANGLIJST ${padded}`} titleFont="accent" minHeight={720}>

        {/* ProgressChart */}
        <ProgressChart
          history={scoreHistory}
          participants={participants}
          totalMatchdays={totalMatchdays}
          height={500}
          showLegend
          showLineLabels
        />

        {/* Metric toggle — verborgen bij export */}
        {!exporting && (
          <div className="flex justify-center gap-1 mt-2 mb-2">
            {METRICS.map((m, i) => (
              <button
                key={m.key}
                onClick={() => setMetricIdx(i)}
                className="font-heading text-[12px] px-1.5 py-0.5 rounded"
                style={{
                  background: i === metricIdx ? '#FF6B00' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Tussenstand */}
        <div style={{ marginTop: exporting ? 8 : 0 }}>
          <div
            className="font-heading text-[9px] text-white text-center uppercase tracking-wider"
            style={{ borderBottom: HDR_BOTTOM, paddingBottom: 2, marginBottom: 2 }}
          >
            Tussenstand
          </div>

          <div className="flex gap-3">
            {columns.map((col, ci) => (
              <div
                key={ci}
                style={{ flex: 1, borderLeft: ci > 0 ? VLINE : undefined }}
              >
                {col.map((row, ri) => {
                  const rank = ci * perCol + ri + 1
                  const val  = row[metric.key] as number
                  const display = metric.isInt
                    ? (val > 0 ? String(val) : '')
                    : (val > 0 ? val.toFixed(1) : '')
                  return (
                    <div
                      key={row.initials}
                      className="flex items-center"
                      style={{ borderBottom: ROW_BOTTOM, paddingTop: 2, paddingBottom: 2, paddingLeft: 2, paddingRight: 2 }}
                    >
                      <span
                        className="font-heading text-[9px] text-white"
                        style={{ width: 14, flexShrink: 0, opacity: 0.5 }}
                      >
                        {rank}
                      </span>
                      <span className="font-heading text-[9px] text-white font-bold italic flex-1 truncate">
                        {row.name.split(' ')[0]}
                      </span>
                      <span className="font-heading text-[9px] text-white" style={{ flexShrink: 0 }}>
                        {display}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

      </SlideWrapper>
    )
  }
)

RanglijstSlide.displayName = 'RanglijstSlide'
