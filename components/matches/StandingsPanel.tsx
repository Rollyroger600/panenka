'use client'
import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { computeStandings } from '@/lib/standings'
import { FlagImage } from '@/components/ui/FlagImage'

const POULES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function StandingsPanel() {
  const predictions = useGameStore((s) => s.predictions)
  const [isOpen, setIsOpen] = useState(false)

  const hasAnyUitslag = Object.values(predictions).some((p) => p.uitslag !== null)
  const standings = useMemo(() => computeStandings(predictions), [predictions])

  if (!hasAnyUitslag) return null

  return (
    <div className="mb-4 rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-bold text-white">Poulestand (voorspeld)</span>
        <span className="text-[#555] text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-3">
          {POULES.map((poule) => {
            const rows = standings[poule] ?? []
            return (
              <div key={poule} className="bg-[#111] rounded-lg overflow-hidden">
                <div className="px-2 py-1 bg-[#1a1a1a] text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest">
                  Poule {poule}
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-[#444]">
                      <th className="text-left px-2 py-0.5 font-normal">Land</th>
                      <th className="px-1 py-0.5 font-normal">G</th>
                      <th className="px-1 py-0.5 font-normal">W</th>
                      <th className="px-1 py-0.5 font-normal">Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={row.country}
                        className={`${i < 2 ? 'border-l-2 border-[#2ECC71]' : ''}`}
                      >
                        <td className="px-2 py-0.5">
                          <div className="flex items-center gap-1">
                            <FlagImage country={row.country} size={12} />
                            <span className="text-[#ccc] truncate">{row.country.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-1 py-0.5 text-center text-[#888]">{row.played}</td>
                        <td className="px-1 py-0.5 text-center text-[#888]">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="px-1 py-0.5 text-center font-bold text-white">{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
