'use client'
import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { computeStandings, type StandingRow } from '@/lib/standings'
import { FlagImage } from '@/components/ui/FlagImage'
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

export function SuggestionsPanel({ onApplyAll }: Props) {
  const [open, setOpen] = useState(false)
  const predictions = useGameStore((s) => s.predictions)

  const hasAnyUitslag = useMemo(
    () => Object.values(predictions).some((p) => p.uitslag !== null),
    [predictions],
  )

  const standings = useMemo(() => computeStandings(predictions), [predictions])

  const suggestions: Suggestion[] = useMemo(() =>
    POULE_LETTERS.map((poule) => {
      const ranked = standings[poule] ?? []
      return {
        poule,
        w1: ranked[0]?.country ?? '',
        w2: ranked[1]?.country ?? '',
        w3: ranked[2]?.country ?? '',
      }
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

  const filledCount = suggestions.filter((s) => s.w1 && s.w2).length

  return (
    <div className="rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/5 overflow-hidden mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-bold text-[#FF6B00]">
            Suggesties op basis van jouw voorspellingen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#FF6B00]/70">{filledCount}/12 poules</span>
          <span className="text-[#FF6B00] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs text-[#888] mb-3">
            Gebaseerd op jouw uitslag-voorspellingen. "Stel alles in" vult alleen lege slots.
          </p>

          {/* Group suggestions grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {suggestions.map(({ poule, w1, w2, w3 }) => (
              <div key={poule} className="bg-[#111] rounded-lg px-3 py-2">
                <div className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1">Poule {poule}</div>
                {w1 ? (
                  <>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] text-[#2ECC71] font-bold w-3">1</span>
                      <FlagImage country={w1} size={12} />
                      <span className="text-[11px] text-white font-bold truncate">{w1}</span>
                    </div>
                    {w2 && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] text-[#888] font-bold w-3">2</span>
                        <FlagImage country={w2} size={12} />
                        <span className="text-[11px] text-[#ccc] truncate">{w2}</span>
                      </div>
                    )}
                    {w3 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-[#555] font-bold w-3">3</span>
                        <FlagImage country={w3} size={12} />
                        <span className="text-[11px] text-[#666] truncate">{w3}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] text-[#444]">Geen uitslag ingevuld</div>
                )}
              </div>
            ))}
          </div>

          {/* Best 3rd-place teams */}
          {bestThird.length > 0 && (
            <div className="bg-[#111] rounded-lg px-3 py-2 mb-3">
              <div className="text-[10px] font-bold text-[#FFB800] uppercase mb-1.5">
                Beste derde-plaatsers → w3 suggesties
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bestThird.map((team, i) => (
                  <div key={team.country} className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg px-2 py-1">
                    <span className="text-[9px] text-[#555] font-bold">{i + 1}.</span>
                    <FlagImage country={team.country} size={12} />
                    <span className="text-[11px] text-[#888]">{team.country}</span>
                    <span className="text-[9px] text-[#555] ml-1">{team.pts}pt</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onApplyAll(suggestions, bestThird)}
            className="w-full py-2 rounded-lg bg-[#FF6B00] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF8C33] transition-colors"
          >
            Stel alles in op basis van suggesties
          </button>
        </div>
      )}
    </div>
  )
}
