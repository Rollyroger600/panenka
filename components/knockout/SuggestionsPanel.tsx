'use client'
import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { computeStandings, type StandingRow } from '@/lib/standings'
import { FlagImage } from '@/components/ui/FlagImage'
import { abbrevCountry } from '@/lib/helpers'
import { PouleGrid } from '@/components/matches/StandingsPanel'
import { POULE_LETTERS } from '@/lib/knockoutHelpers'

export interface Suggestion {
  poule: string
  w1: string
  w2: string
  w3: string
}

interface Props {
  onApplyAll: (suggestions: Suggestion[], bestThird: StandingRow[]) => void
}

function getBest3Set(standings: Record<string, StandingRow[]>): Set<string> {
  const thirds = POULE_LETTERS.map((p) => standings[p]?.[2]).filter(Boolean) as StandingRow[]
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  return new Set(thirds.slice(0, 8).map((r) => r.country))
}

export function SuggestionsPanel({ onApplyAll }: Props) {
  const [open, setOpen] = useState(false)
  const predictions = useGameStore((s) => s.predictions)

  const hasAnyUitslag = useMemo(
    () => Object.values(predictions).some((p) => p.uitslag !== null),
    [predictions],
  )

  const standings = useMemo(() => computeStandings(predictions), [predictions])
  const best3Set = useMemo(() => getBest3Set(standings), [standings])

  const suggestions: Suggestion[] = useMemo(() =>
    POULE_LETTERS.map((poule) => {
      const ranked = standings[poule] ?? []
      return { poule, w1: ranked[0]?.country ?? '', w2: ranked[1]?.country ?? '', w3: ranked[2]?.country ?? '' }
    }),
    [standings],
  )

  const bestThird: StandingRow[] = useMemo(() =>
    POULE_LETTERS
      .map((poule) => (standings[poule] ?? [])[2])
      .filter(Boolean)
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .slice(0, 8),
    [standings],
  )

  if (!hasAnyUitslag) return null

  return (
    <div className="sticky top-24 z-20">
      {/* Toggle button */}
      <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.95)' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3"
        >
          <span className="text-sm font-bold text-white">
            Suggesties op basis van jouw uitslagen
          </span>
          <span className="text-[#555] text-xs">{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 rounded-xl border border-[#2a2a2a] overflow-y-auto max-h-[45vh] mt-1" style={{ background: 'rgba(22,22,22,0.97)' }}>
          <div className="px-3 pt-3 pb-4 flex flex-col gap-4">

            {/* Standings-style grid */}
            <PouleGrid standings={standings} best3Set={best3Set} />

            {/* Beste nummers 3 */}
            {bestThird.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
                <div className="bg-[#FF6B00] px-2 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Beste nummers 3
                  </span>
                  <div className="flex gap-2.5">
                    <span className="text-[9px] font-bold text-white/80 w-3 text-right">G</span>
                    <span className="text-[9px] font-bold text-white/80 w-5 text-right">DS</span>
                    <span className="text-[9px] font-bold text-white/80 w-4 text-right">Pt</span>
                  </div>
                </div>
                {bestThird.map((team, i) => (
                  <div
                    key={team.country}
                    className="flex items-center px-2 py-1.5 border-b border-[#1e1e1e] last:border-b-0 border-l-2 border-l-[#2ECC71]" style={{ background: 'rgba(22,22,22,0.82)' }}
                  >
                    <span className="text-[9px] font-bold text-[#555] w-3 shrink-0">{i + 1}</span>
                    <div className="flex items-center gap-1 flex-1 min-w-[36px] ml-1">
                      <FlagImage country={team.country} size={14} />
                      <span className="font-accent font-light text-[10px] text-white">
                        {abbrevCountry(team.country)}
                      </span>
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                      <span className="text-[10px] font-bold text-white w-3 text-right">{team.played}</span>
                      <span className={`text-[10px] font-bold w-5 text-right ${
                        team.gd > 0 ? 'text-[#FF6B00]' : team.gd < 0 ? 'text-[#E74C3C]' : 'text-white'
                      }`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </span>
                      <span className={`text-[10px] font-bold w-4 text-right ${
                        team.pts > 0 ? 'text-[#FF6B00]' : 'text-white'
                      }`}>
                        {team.pts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={() => onApplyAll(suggestions, bestThird)}
              className="w-full py-2.5 rounded-lg bg-[#FF6B00] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF8C33] transition-colors"
            >
              Stel alles in op basis van suggesties
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
