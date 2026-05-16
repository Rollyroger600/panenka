'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'
import type { MatchdayScoreRow } from '@/lib/matchday'

interface Props {
  rows: MatchdayScoreRow[]
}

const COLORS = {
  poulefase:         '#FF6B00',
  kofase:            '#FFB800',
  fantasy:           '#2ECC71',
  doorgaandeLanden:  '#3498DB',
}

export function ScoreStackedChart({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.total - a.total)
  const chartData = sorted.map((r) => ({
    name: r.name.split(' ')[0],  // first name only for space
    poulefase: r.poulefase,
    kofase: r.kofase,
    fantasy: r.fantasy,
    doorgaandeLanden: r.doorgaandeLanden,
  }))

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 7 }} tickSize={3} />
        <YAxis tick={{ fill: '#888', fontSize: 7 }} tickSize={3} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 9 }}
          formatter={(v, name) => [(v as number).toFixed(1), name as string]}
        />
        <Bar dataKey="poulefase" stackId="a" fill={COLORS.poulefase} name="Poulefase" />
        <Bar dataKey="kofase" stackId="a" fill={COLORS.kofase} name="KO Fase" />
        <Bar dataKey="fantasy" stackId="a" fill={COLORS.fantasy} name="Fantasy" />
        <Bar dataKey="doorgaandeLanden" stackId="a" fill={COLORS.doorgaandeLanden} name="Doorgaande Landen" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
