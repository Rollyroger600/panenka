'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { PotPoint } from '@/lib/types/matchday'

interface Props {
  data: PotPoint[]
  totalMatchdays: number
}

export function PotChart({ data, totalMatchdays }: Props) {
  // Build full 27-point series, with null for future matchdays
  const chartData = Array.from({ length: totalMatchdays }, (_, i) => {
    const md = i + 1
    const point = data.find((p) => p.matchdayId === md)
    return { md, potStand: point?.potStand ?? null }
  })

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="md"
          tick={{ fill: '#888', fontSize: 8 }}
          interval={4}
          tickSize={4}
        />
        <YAxis
          tick={{ fill: '#888', fontSize: 8 }}
          tickSize={4}
          tickFormatter={(v: number) => `€${v.toFixed(0)}`}
        />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="4 2" />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 10 }}
          formatter={(v) => [`€ ${(v as number)?.toFixed(2) ?? '–'}`, 'Pot']}
          labelFormatter={(l) => `MD ${l}`}
        />
        <Line
          type="monotone"
          dataKey="potStand"
          stroke="#FF6B00"
          strokeWidth={2}
          dot={{ fill: '#FF6B00', r: 2 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
