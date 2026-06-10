'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useTokenBudget } from '@/hooks/useTokenBudget'
import { FlagImage } from '@/components/ui/FlagImage'
import { TokenStepper } from './TokenStepper'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import { KO_TRENDS } from '@/lib/data/knockoutQuotes_trends'
import type { OddsTrend } from '@/lib/data/knockoutQuotes_trends'
import { abbrevCountry } from '@/lib/helpers'
import { WINNER_PHRASES } from '@/lib/data/winnerPhrases'
import type { KnockoutRound } from '@/lib/data/knockoutRounds'

const MUTED = '#7e7667'

function getQuote(country: string, qkey: string): number | null {
  const q = KO_QUOTES[country]
  if (!q) return null
  return (q as unknown as Record<string, number>)[qkey] ?? null
}

function getTrend(country: string, qkey: string): OddsTrend {
  const t = KO_TRENDS[country]
  if (!t) return null
  return (t as unknown as Record<string, OddsTrend>)[qkey] ?? null
}

function TrendIndicator({ trend }: { trend: OddsTrend }) {
  if (!trend || trend === 'same') return null
  return (
    <span className={`text-[7px] leading-none font-bold ${
      trend === 'up' ? 'text-[#FF6B00]' : 'text-emerald-400'
    }`}>
      {trend === 'up' ? '▲' : '▼'}
    </span>
  )
}

type SlotStatus = 'correct' | 'incorrect' | 'unknown'

function getSlotStatus(country: string, roundId: string, koResults: Record<string, string[]>): SlotStatus {
  if (!(koResults[roundId] ?? []).length) return 'unknown'
  return koResults[roundId].includes(country) ? 'correct' : 'incorrect'
}

interface Props {
  round: KnockoutRound
  readOnly?: boolean
  koResults?: Record<string, string[]>
}

export function RoundSection({ round, readOnly = false, koResults = {} }: Props) {
  const { knockoutPicks, setKnockoutSlot, clearKnockoutSlot } = useGameStore()
  const { remaining } = useTokenBudget()
  const [openPicker, setOpenPicker] = useState<string | null>(null)

  function getSlot(key: string) {
    return knockoutPicks[key] ?? { country: null, tok: round.minTokens }
  }

  const slots = Array.from({ length: round.slots }, (_, i) => ({
    key: `${round.id}_${i}`,
    label: String(i + 1),
    slot: getSlot(`${round.id}_${i}`),
  }))

  const pickedCountries = new Set(slots.map(s => s.slot.country).filter(Boolean) as string[])

  const maxScore = slots.reduce((sum, { slot }) => {
    if (!slot.country) return sum
    const q = getQuote(slot.country, round.qkey)
    if (q === null) return sum
    return sum + slot.tok * q
  }, 0)

  const earnedScore = readOnly ? slots.reduce((sum, { slot }) => {
    if (!slot.country) return sum
    const advanced = (koResults[round.id] ?? []).includes(slot.country)
    if (!advanced) return sum
    const q = getQuote(slot.country, round.qkey)
    return q !== null ? sum + slot.tok * q : sum
  }, 0) : null

  function pickCountry(key: string, country: string | null) {
    if (country === null) {
      clearKnockoutSlot(key)
    } else {
      for (const s of slots) {
        if (s.key !== key && s.slot.country === country) clearKnockoutSlot(s.key)
      }
      setKnockoutSlot(key, { country, tok: getSlot(key).tok || round.minTokens })
    }
    setOpenPicker(null)
  }

  function setTok(key: string, tok: number) {
    setKnockoutSlot(key, { tok })
  }

  const cols = round.slots === 1 ? 1 : round.slots === 2 ? 2 : 4
  const gridClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-4'
  const wrapperClass = cols === 1 ? 'max-w-[96px] mx-auto' : cols === 2 ? 'max-w-[208px] mx-auto' : ''

  const rows: typeof slots[] = []
  for (let i = 0; i < slots.length; i += cols) rows.push(slots.slice(i, i + cols))

  const openRowIndex = !readOnly && openPicker
    ? rows.findIndex(row => row.some(s => s.key === openPicker))
    : -1
  const openSlot = !readOnly ? (slots.find(s => s.key === openPicker) ?? null) : null
  const takenByOthers = (currentKey: string) =>
    new Set(slots.filter(s => s.key !== currentKey).map(s => s.slot.country).filter(Boolean) as string[])

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <span className="text-sm font-bold text-white">{round.label}</span>
        <span className="text-xs font-bold text-[#FF6B00]">{pickedCountries.size} / {round.slots}</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            <div className={`grid ${gridClass} gap-2 ${wrapperClass}`}>
              {row.map(({ key, label, slot }) => {
                const status: SlotStatus = readOnly && slot.country
                  ? getSlotStatus(slot.country, round.id, koResults)
                  : 'unknown'
                const borderClass = readOnly
                  ? status === 'correct' ? 'border-[#FF6B00] bg-[#1e1e1e]' : 'border-[#444] bg-[#1a1a1a]'
                  : slot.country ? 'border-[#FF6B00] bg-[#1e1e1e]'
                  : openPicker === key ? 'border-[#555] bg-[#1e1e1e]'
                  : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className="relative w-full aspect-square">
                      <button
                        onClick={() => !readOnly && setOpenPicker(openPicker === key ? null : key)}
                        disabled={readOnly}
                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center border transition-colors ${borderClass}`}
                      >
                        {slot.country ? (
                          <>
                            <FlagImage country={slot.country} size={28} />
                            <span className="font-accent font-light text-[11px] text-white mt-1 leading-none">
                              {abbrevCountry(slot.country)}
                            </span>
                            {getQuote(slot.country, round.qkey) != null && (
                              <span className="inline-flex items-center gap-0.5 font-heading text-sm font-bold text-[#FF6B00] mt-0.5">
                                {getQuote(slot.country, round.qkey)!.toFixed(2)}
                                {!readOnly && <TrendIndicator trend={getTrend(slot.country, round.qkey)} />}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xl font-bold" style={{ color: '#777' }}>{label}</span>
                        )}
                      </button>
                      {readOnly && slot.country && status !== 'unknown' && (
                        <span className={`absolute top-1 right-1 text-xs font-bold leading-none ${
                          status === 'correct' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {status === 'correct' ? '✓' : '✗'}
                        </span>
                      )}
                      {!readOnly && slot.country && (
                        <button
                          onClick={(e) => { e.stopPropagation(); clearKnockoutSlot(key); setOpenPicker(null) }}
                          className="absolute top-1 right-1 text-[#777] hover:text-white transition-colors text-[11px] leading-none w-4 h-4 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {readOnly
                      ? <span className="font-heading text-sm font-bold text-[#FF6B00]">{slot.tok}</span>
                      : <TokenStepper
                          value={slot.tok}
                          min={round.minTokens}
                          max={remaining > 0 ? Math.min(round.maxTokens, slot.tok + remaining) : slot.tok}
                          onChange={(tok) => setTok(key, tok)}
                        />
                    }
                  </div>
                )
              })}
            </div>
            {openRowIndex === rowIndex && openSlot && (
              <div className="mt-2">
                <RoundCountryPicker
                  taken={takenByOthers(openSlot.key)}
                  currentValue={openSlot.slot.country}
                  qkey={round.qkey}
                  onSelect={(country) => pickCountry(openSlot.key, country)}
                />
              </div>
            )}
          </div>
        ))}
        {round.id === 'winner' && slots[0]?.slot.country && WINNER_PHRASES[slots[0].slot.country] && (
          <p className="text-center text-base font-bold text-white whitespace-nowrap">
            {WINNER_PHRASES[slots[0].slot.country]}
          </p>
        )}
      </div>
      <div className="px-3 pb-2 flex justify-end">
        {readOnly ? (
          <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Score{' '}
            {earnedScore !== null && earnedScore > 0
              ? <span className="text-[#FF6B00]">{earnedScore.toFixed(2)} pts</span>
              : <span style={{ color: MUTED }}>0.00 pts</span>
            }
          </span>
        ) : maxScore > 0 && (
          <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Max. score{' '}
            <span className="text-[#FF6B00]">{maxScore.toFixed(1)} pts</span>
          </span>
        )}
      </div>
    </div>
  )
}

function RoundCountryPicker({
  taken, currentValue, qkey, onSelect,
}: {
  taken: Set<string>
  currentValue: string | null
  qkey: string
  onSelect: (c: string | null) => void
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(10,10,10,0.75)' }}>
      <div className="px-3 py-2 bg-[#111] flex items-center">
        <span className="text-[10px] text-[#999] uppercase tracking-widest">Kies land</span>
      </div>
      <div className="overflow-y-auto max-h-64">
        <div className="grid grid-cols-4 gap-2 p-3">
          {ALL_COUNTRIES.map((country) => {
            const isSelected = currentValue === country
            const isTaken = !isSelected && taken.has(country)
            const quote = getQuote(country, qkey)
            return (
              <button
                key={country}
                onClick={() => onSelect(isSelected ? null : country)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-colors ${
                  isSelected ? 'border-[#FF6B00] bg-[#FF6B00]/10'
                  : isTaken ? 'border-[#553300] bg-[#1a1a1a] hover:border-[#886600]'
                  : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                }`}
              >
                {isTaken && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00] opacity-70" />}
                <span className={isSelected ? '' : 'opacity-60'}>
                  <FlagImage country={country} size={24} />
                </span>
                <span className={`font-accent font-light text-[10px] mt-1 leading-none ${isSelected ? 'text-white' : 'text-[#888]'}`}>
                  {abbrevCountry(country)}
                </span>
                {quote != null && (
                  <span className={`font-heading text-[9px] font-bold mt-0.5 ${isSelected ? 'text-[#FF6B00]' : 'text-[#666]'}`}>
                    {quote.toFixed(2)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
