'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { POULE_LETTERS } from '@/lib/knockoutHelpers'

function CountryChip({ country }: { country: string | null }) {
  if (!country) {
    return (
      <div className="flex items-center gap-1 bg-[#111] border border-[#1a1a1a] rounded px-1.5 py-0.5">
        <span className="text-[10px] text-[#333]">?</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 bg-[#252525] rounded px-1.5 py-0.5">
      <FlagImage country={country} size={10} />
      <span className="text-[10px] text-white font-bold truncate max-w-[60px]">{country}</span>
    </div>
  )
}

export function BracketView() {
  const [open, setOpen] = useState(false)
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)

  function getCountries(roundId: string, slots: number): (string | null)[] {
    return Array.from({ length: slots }, (_, i) => knockoutPicks[`${roundId}_${i}`]?.country ?? null)
  }

  // For w1/w2: 12 groups in order; w3: 8 slots
  const w1 = POULE_LETTERS.map((_, i) => knockoutPicks[`w1_${i}`]?.country ?? null)
  const w2 = POULE_LETTERS.map((_, i) => knockoutPicks[`w2_${i}`]?.country ?? null)
  const w3 = Array.from({ length: 8 }, (_, i) => knockoutPicks[`w3_${i}`]?.country ?? null)
  const r16 = getCountries('r16', 16)
  const r8 = getCountries('r8', 8)
  const r4 = getCountries('r4', 4)
  const finale = getCountries('finale', 2)
  const winner = getCountries('winner', 1)

  const totalPicks = [...w1, ...w2, ...w3, ...r16, ...r8, ...r4, ...finale, ...winner].filter(Boolean).length

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden mb-4" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Bracket overzicht</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555]">{totalPicks} picks</span>
          <span className="text-[#555] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto px-3 pb-4">
          <div className="flex gap-3 min-w-max">

            {/* R32 qualifiers: w1 + w2 + w3 */}
            <div className="flex gap-2">
              {/* w1 */}
              <div className="flex flex-col gap-1">
                <div className="text-[9px] text-[#FF6B00] font-bold uppercase text-center mb-1">Winnaars</div>
                {POULE_LETTERS.map((p, i) => (
                  <div key={p} className="flex items-center gap-1">
                    <span className="text-[9px] text-[#FF6B00] w-3">{p}</span>
                    <CountryChip country={w1[i]} />
                  </div>
                ))}
              </div>
              {/* w2 */}
              <div className="flex flex-col gap-1">
                <div className="text-[9px] text-[#888] font-bold uppercase text-center mb-1">Runners-up</div>
                {POULE_LETTERS.map((p, i) => (
                  <div key={p} className="flex items-center gap-1">
                    <span className="text-[9px] text-[#444] w-3">{p}</span>
                    <CountryChip country={w2[i]} />
                  </div>
                ))}
              </div>
              {/* w3 */}
              <div className="flex flex-col gap-1">
                <div className="text-[9px] text-[#FFB800] font-bold uppercase text-center mb-1">Beste 3e</div>
                {w3.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-[9px] text-[#444] w-3">{i + 1}</span>
                    <CountryChip country={c} />
                  </div>
                ))}
                {/* Pad to 12 rows to align with w1/w2 */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-[22px]" />
                ))}
              </div>
            </div>

            {/* Arrow separator */}
            <div className="flex items-center text-[#333] text-lg self-center">›</div>

            {/* R16 */}
            <div className="flex flex-col gap-1 self-center">
              <div className="text-[9px] text-[#888] font-bold uppercase text-center mb-1">R. van 16</div>
              {r16.map((c, i) => <CountryChip key={i} country={c} />)}
            </div>

            <div className="flex items-center text-[#333] text-lg self-center">›</div>

            {/* R8 */}
            <div className="flex flex-col gap-1 self-center">
              <div className="text-[9px] text-[#888] font-bold uppercase text-center mb-1">Kwartf.</div>
              {r8.map((c, i) => <CountryChip key={i} country={c} />)}
            </div>

            <div className="flex items-center text-[#333] text-lg self-center">›</div>

            {/* R4 */}
            <div className="flex flex-col gap-1 self-center">
              <div className="text-[9px] text-[#888] font-bold uppercase text-center mb-1">Halve f.</div>
              {r4.map((c, i) => <CountryChip key={i} country={c} />)}
            </div>

            <div className="flex items-center text-[#333] text-lg self-center">›</div>

            {/* Finale */}
            <div className="flex flex-col gap-1 self-center">
              <div className="text-[9px] text-[#888] font-bold uppercase text-center mb-1">Finale</div>
              {finale.map((c, i) => <CountryChip key={i} country={c} />)}
            </div>

            <div className="flex items-center text-[#333] text-lg self-center">›</div>

            {/* Winner */}
            <div className="flex flex-col gap-1 self-center">
              <div className="text-[9px] text-[#FFB800] font-bold uppercase text-center mb-1">🏆</div>
              <CountryChip country={winner[0]} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
