'use client'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { TokenStepper } from './TokenStepper'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import type { KnockoutRound } from '@/lib/data/knockoutRounds'

function getQuote(country: string, qkey: string): number | null {
  const q = KO_QUOTES[country]
  if (!q) return null
  const key = qkey === 'winnaar_poule' ? 'poulewinnaar' : qkey
  return (q as unknown as Record<string, number>)[key] ?? null
}

interface Props {
  round: KnockoutRound
}

export function RoundSection({ round }: Props) {
  const { knockoutPicks, setKnockoutSlot, clearKnockoutSlot } = useGameStore()

  // All filled slots for this round
  const filled = Array.from({ length: round.slots }, (_, i) => ({
    key: `${round.id}_${i}`,
    slot: knockoutPicks[`${round.id}_${i}`] ?? { country: null, tok: round.minTokens },
  })).filter((s) => s.slot.country)

  const pickedCountries = new Set(filled.map((s) => s.slot.country as string))

  function toggle(country: string) {
    // Find if already picked
    const existingIndex = filled.findIndex((s) => s.slot.country === country)
    if (existingIndex >= 0) {
      clearKnockoutSlot(filled[existingIndex].key)
      return
    }
    // Find next free slot
    const nextIndex = Array.from({ length: round.slots }, (_, i) => i).find(
      (i) => !knockoutPicks[`${round.id}_${i}`]?.country,
    )
    if (nextIndex === undefined) return // all slots filled
    setKnockoutSlot(`${round.id}_${nextIndex}`, { country, tok: round.minTokens })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Country chip grid */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
        <div className="px-4 py-3 bg-[#111] flex items-center justify-between">
          <span className="text-sm font-bold text-white">{round.label}</span>
          <span className="text-xs font-bold text-[#FF6B00]">
            {pickedCountries.size} / {round.slots}
          </span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {ALL_COUNTRIES.map((country) => {
            const isPicked = pickedCountries.has(country)
            const maxReached = pickedCountries.size >= round.slots
            const isDisabled = !isPicked && maxReached
            const quote = getQuote(country, round.qkey)
            return (
              <button
                key={country}
                onClick={() => !isDisabled && toggle(country)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isPicked
                    ? 'bg-[#FF6B00] text-white'
                    : isDisabled
                    ? 'bg-[#161616] text-[#333] cursor-not-allowed'
                    : 'bg-[#252525] text-[#ccc] hover:bg-[#333]'
                }`}
              >
                <FlagImage country={country} size={14} />
                {country}
                {quote != null && (
                  <span className={`text-[10px] ${isPicked ? 'text-orange-100' : 'text-[#FFB800]'}`}>
                    {quote.toFixed(2)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Token rows per selected country */}
      {filled.length > 0 && (
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
          <div className="px-4 py-2 bg-[#111]">
            <span className="text-xs text-[#888] uppercase tracking-widest">
              Tokens per land · min {round.minTokens} · max {round.maxTokens}
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {filled.map(({ key, slot }) => {
              const quote = getQuote(slot.country!, round.qkey)
              return (
              <div key={key} className="flex items-center gap-3">
                <FlagImage country={slot.country!} size={18} />
                <span className="text-sm font-bold text-white flex-1">{slot.country}</span>
                {quote != null && (
                  <span className="text-xs font-bold text-[#FFB800]">{quote.toFixed(2)}</span>
                )}
                <TokenStepper
                  value={slot.tok}
                  min={round.minTokens}
                  max={round.maxTokens}
                  onChange={(tok) => setKnockoutSlot(key, { tok })}
                />
                <button
                  onClick={() => clearKnockoutSlot(key)}
                  className="text-[#444] hover:text-[#E74C3C] text-sm px-1 transition-colors"
                >
                  ✕
                </button>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
