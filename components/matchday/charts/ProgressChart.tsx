'use client'
import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { ScoreHistoryPoint } from '@/lib/types/matchday'

interface Props {
  history: ScoreHistoryPoint[]
  participants: Array<{ initials: string; name: string }>
  totalMatchdays: number
  height?: number
  showLegend?: boolean
  showLineLabels?: boolean
}

const LINE_COLORS = [
  '#FF6B00', '#FFB800', '#2ECC71', '#3498DB', '#9B59B6',
  '#E74C3C', '#1ABC9C', '#F39C12', '#D35400', '#27AE60',
  '#2980B9', '#8E44AD', '#C0392B', '#16A085', '#F1C40F',
]

export function ProgressChart({ history, participants, totalMatchdays, height = 180, showLegend = false, showLineLabels = false, style, width = 350 }: Props & { style?: React.CSSProperties; width?: number }) {
  const chartData = Array.from({ length: totalMatchdays }, (_, i) => {
    const md = i + 1
    const point = history.find((h) => h.matchdayId === md)
    const row: Record<string, number | null> = { md }
    for (const p of participants) {
      row[p.initials] = point?.scores[p.initials] ?? null
    }
    return row
  })

  // Last non-null index per participant for end-of-line labels
  const lastNonNullIdx: Record<string, number> = {}
  if (showLineLabels) {
    for (const p of participants) {
      let last = -1
      for (let i = 0; i < chartData.length; i++) {
        if (chartData[i][p.initials] !== null) last = i
      }
      lastNonNullIdx[p.initials] = last
    }
  }

  return (
    <div style={style}>
      <LineChart width={width} height={height} data={chartData} margin={{ top: 4, right: showLineLabels ? 36 : 30, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.15)" strokeDasharray="0" vertical={true} horizontal={true} />
          <XAxis dataKey="md" tick={{ fill: '#fff', fontSize: 7 }} interval={4} tickSize={3} />
          <YAxis width={26} tick={{ fill: '#fff', fontSize: 7 }} tickSize={3} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 9 }}
            labelFormatter={(l) => `MD ${l}`}
            formatter={(v, name) => [(v as number)?.toFixed(1) ?? '–', name as string]}
          />
          {participants.map((p, i) => {
            const color     = LINE_COLORS[i % LINE_COLORS.length]
            const firstName = p.name.split(' ')[0]
            const lastIdx   = lastNonNullIdx[p.initials] ?? -1
            return (
              <Line
                key={p.initials}
                type="monotone"
                dataKey={p.initials}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                name={firstName}
                label={showLineLabels ? (props: any) => {
                  if (props.index !== lastIdx || props.value == null) return <g />
                  return (
                    <text
                      x={props.x + 4}
                      y={props.y}
                      fill={color}
                      fontSize={7}
                      dominantBaseline="middle"
                      fontFamily='"Built Titling", sans-serif'
                    >
                      {firstName}
                    </text>
                  )
                } : undefined}
              />
            )
          })}
        </LineChart>

      {showLegend && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px 4px', marginTop: 6 }}>
          {participants.map((p, i) => (
            <div key={p.initials} style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: LINE_COLORS[i % LINE_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: '#fff', fontFamily: '"Built Titling", sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
