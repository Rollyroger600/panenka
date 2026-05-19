'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { PotPoint } from '@/lib/types/matchday'

interface Props {
  data: PotPoint[]
  totalMatchdays: number
  width?: number
}

export function PotChart({ data, totalMatchdays, width = 340 }: Props) {
  // Build full 27-point series, with null for future matchdays
  const chartData = Array.from({ length: totalMatchdays }, (_, i) => {
    const md = i + 1
    const point = data.find((p) => p.matchdayId === md)
    return { md, potStand: point?.potStand ?? null }
  })

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <LineChart width={width} height={140} data={chartData} margin={{ top: 4, right: 38, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.15)" strokeDasharray="0" vertical={true} horizontal={true} />
        <XAxis
          dataKey="md"
          tick={{ fill: '#fff', fontSize: 8 }}
          interval={4}
          tickSize={4}
        />
        <YAxis
          width={34}
          tick={{ fill: '#fff', fontSize: 8 }}
          tickSize={4}
          tickFormatter={(v: number) => `€${v.toFixed(0)}`}
        />
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
    </div>
  )
}
