'use client'
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { computeStandings, type StandingRow } from '@/lib/standings'
import { FlagImage } from '@/components/ui/FlagImage'
import { abbrevCountry } from '@/lib/helpers'

const POULES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function getBest3Set(standings: Record<string, StandingRow[]>): Set<string> {
  const thirds = POULES.map((p) => standings[p]?.[2]).filter(Boolean) as StandingRow[]
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  return new Set(thirds.slice(0, 8).map((r) => r.country))
}

export function StandingsPanel() {
  const predictions = useGameStore((s) => s.predictions)
  const standings = useMemo(() => computeStandings(predictions), [predictions])
  const best3Set = useMemo(() => getBest3Set(standings), [standings])

  return (
    <div>
      <p className="text-white text-sm font-bold text-center mb-4">
        Poulestand op basis van voorspelde uitslagen
      </p>
      <PouleGrid standings={standings} best3Set={best3Set} />
    </div>
  )
}

export function PouleGrid({
  standings,
  best3Set,
}: {
  standings: Record<string, StandingRow[]>
  best3Set: Set<string>
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {POULES.map((poule) => {
        const rows = standings[poule] ?? []
        return (
          <div key={poule} className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            <div className="bg-[#FF6B00] px-2 py-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Poule {poule}
              </span>
              <div className="flex gap-2.5">
                <span className="text-[9px] font-bold text-white/80 w-4 text-right">G</span>
                <span className="text-[9px] font-bold text-white/80 w-5 text-right">DS</span>
                <span className="text-[9px] font-bold text-white/80 w-4 text-right">Pt</span>
              </div>
            </div>

            {rows.map((row, i) => {
              const isQualifier = i < 2 || (i === 2 && best3Set.has(row.country))
              return (
                <div
                  key={row.country}
                  className={`flex items-center px-2 py-1.5 border-b border-[#1e1e1e] last:border-0 bg-[#111] ${
                    isQualifier ? 'border-l-2 border-l-[#2ECC71]' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <span className="text-[9px] font-bold text-[#555] w-3 shrink-0">{i + 1}</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0 ml-1">
                    <FlagImage country={row.country} size={14} />
                    <span className="font-accent font-light text-[10px] text-white truncate">
                      {abbrevCountry(row.country)}
                    </span>
                  </div>
                  <div className="flex gap-2.5 shrink-0">
                    <span className="text-[10px] font-bold text-white w-4 text-right">{row.played}</span>
                    <span className={`text-[10px] font-bold w-5 text-right ${
                      row.gd > 0 ? 'text-[#FF6B00]' : row.gd < 0 ? 'text-[#E74C3C]' : 'text-white'
                    }`}>
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </span>
                    <span className={`text-[10px] font-bold w-4 text-right ${
                      row.pts > 0 ? 'text-[#FF6B00]' : 'text-white'
                    }`}>
                      {row.pts}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
