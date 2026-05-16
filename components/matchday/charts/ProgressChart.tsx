'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ScoreHistoryPoint } from '@/lib/types/matchday'
import type { MatchdayScoreRow } from '@/lib/matchday'

interface Props {
  history: ScoreHistoryPoint[]
  participants: Array<{ initials: string; name: string }>
  totalMatchdays: number
}

// Color palette for participant lines
const LINE_COLORS = [
  '#FF6B00', '#FFB800', '#2ECC71', '#3498DB', '#9B59B6',
  '#E74C3C', '#1ABC9C', '#F39C12', '#D35400', '#27AE60',
  '#2980B9', '#8E44AD', '#C0392B', '#16A085', '#F1C40F',
  '#7F8C8D',
]

export function ProgressChart({ history, participants, totalMatchdays }: Props) {
  // Build chart data: one row per matchday
  const chartData = Array.from({ length: totalMatchdays }, (_, i) => {
    const md = i + 1
    const point = history.find((h) => h.matchdayId === md)
    const row: Record<string, number | null> = { md }
    for (const p of participants) {
      row[p.initials] = point?.scores[p.initials] ?? null
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis
          dataKey="md"
          tick={{ fill: '#888', fontSize: 7 }}
          interval={4}
          tickSize={3}
        />
        <YAxis tick={{ fill: '#888', fontSize: 7 }} tickSize={3} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 9 }}
          labelFormatter={(l) => `MD ${l}`}
          formatter={(v, name) => [(v as number)?.toFixed(1) ?? '–', name as string]}
        />
        {participants.map((p, i) => (
          <Line
            key={p.initials}
            type="monotone"
            dataKey={p.initials}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            name={p.name.split(' ')[0]}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
