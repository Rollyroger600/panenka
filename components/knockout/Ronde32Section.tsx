'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { TokenStepper } from './TokenStepper'
import { GROUP_TEAMS, POULE_LETTERS, getW3Excluded } from '@/lib/knockoutHelpers'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import { KO_TRENDS } from '@/lib/data/knockoutQuotes_trends'
import type { OddsTrend } from '@/lib/data/knockoutQuotes_trends'
import { SuggestionsPanel, type Suggestion } from './SuggestionsPanel'
import { abbrevCountry } from '@/lib/helpers'
import type { StandingRow } from '@/lib/standings'

function getQuote(country: string, qkey: string): number | null {
  const q = KO_QUOTES[country]
  if (!q) return null
  const key = qkey === 'winnaar_poule' ? 'poulewinnaar' : qkey
  return (q as unknown as Record<string, number>)[key] ?? null
}

function getTrend(country: string, qkey: string): OddsTrend {
  const t = KO_TRENDS[country]
  if (!t) return null
  const key = qkey === 'winnaar_poule' ? 'poulewinnaar' : qkey
  return (t as unknown as Record<string, OddsTrend>)[key] ?? null
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

const W1_MIN = 2; const W1_MAX = 9
const W3_MAX_SLOTS = 8

export function Ronde32Section() {
  const { knockoutPicks, setKnockoutSlot, clearKnockoutSlot } = useGameStore()
  const [openPicker, setOpenPicker] = useState<string | null>(null)

  function applyAllSuggestions(suggestions: Suggestion[], bestThird: StandingRow[]) {
    const hasExisting =
      suggestions.some((_, i) => knockoutPicks[`w1_${i}`]?.country || knockoutPicks[`w2_${i}`]?.country) ||
      Array.from({ length: W3_MAX_SLOTS }, (_, i) => knockoutPicks[`w3_${i}`]?.country).some(Boolean)

    if (hasExisting && !window.confirm('Je hebt al keuzes gemaakt. Wil je alles overschrijven met de suggesties?')) return

    suggestions.forEach(({ w1, w2 }, i) => {
      if (w1) setKnockoutSlot(`w1_${i}`, { country: w1, tok: W1_MIN })
      if (w2) setKnockoutSlot(`w2_${i}`, { country: w2, tok: W1_MIN })
    })
    bestThird.forEach((team, i) => {
      if (i < W3_MAX_SLOTS) setKnockoutSlot(`w3_${i}`, { country: team.country, tok: W1_MIN })
    })
  }

  function getSlot(key: string) {
    return knockoutPicks[key] ?? { country: null, tok: W1_MIN }
  }

  function pickCountry(key: string, country: string | null) {
    if (country === null) {
      clearKnockoutSlot(key)
    } else {
      // Global steal: clear this country from any other slot it currently occupies
      const allKeys = [
        ...POULE_LETTERS.map((_, i) => `w1_${i}`),
        ...POULE_LETTERS.map((_, i) => `w2_${i}`),
        ...Array.from({ length: W3_MAX_SLOTS }, (_, i) => `w3_${i}`),
      ]
      for (const otherKey of allKeys) {
        if (otherKey !== key && knockoutPicks[otherKey]?.country === country) {
          clearKnockoutSlot(otherKey)
        }
      }
      setKnockoutSlot(key, { country, tok: getSlot(key).tok || W1_MIN })
    }
    setOpenPicker(null)
  }

  function setTok(key: string, tok: number) {
    setKnockoutSlot(key, { tok })
  }

  const w1Countries: Record<string, string | null> = {}
  const w2Countries: Record<string, string | null> = {}
  POULE_LETTERS.forEach((p, i) => {
    w1Countries[p] = getSlot(`w1_${i}`).country
    w2Countries[p] = getSlot(`w2_${i}`).country
  })
  const w3Excluded = getW3Excluded(w1Countries, w2Countries)
  const w3Picks = Array.from({ length: W3_MAX_SLOTS }, (_, i) => getSlot(`w3_${i}`))
  const w3PickedCountries = new Set(w3Picks.map((s) => s.country).filter(Boolean) as string[])

  return (
    <div className="flex flex-col gap-4">
      <SuggestionsPanel onApplyAll={applyAllSuggestions} />

      {/* W1 — Poulewinnaars */}
      <SlotSection
        title="Poulewinnaars"
        slots={POULE_LETTERS.map((poule, i) => {
          const key = `w1_${i}`
          const slot = getSlot(key)
          const excluded = new Set([
            w2Countries[poule],
            ...(GROUP_TEAMS[poule]?.filter(t => w3PickedCountries.has(t)) ?? []),
          ].filter(Boolean) as string[])
          const options = GROUP_TEAMS[poule] ?? []
          return { key, label: poule, slot, options, excluded }
        })}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
        pickCountry={pickCountry}
        setTok={setTok}
        min={W1_MIN}
        max={W1_MAX}
        qkey="winnaar_poule"
      />

      {/* W2 — Nummers 2 */}
      <SlotSection
        title="Nummers 2"
        slots={POULE_LETTERS.map((poule, i) => {
          const key = `w2_${i}`
          const slot = getSlot(key)
          const excluded = new Set([
            w1Countries[poule],
            ...(GROUP_TEAMS[poule]?.filter(t => w3PickedCountries.has(t)) ?? []),
          ].filter(Boolean) as string[])
          const options = GROUP_TEAMS[poule] ?? []
          return { key, label: poule, slot, options, excluded }
        })}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
        pickCountry={pickCountry}
        setTok={setTok}
        min={W1_MIN}
        max={W1_MAX}
        qkey="tweede"
      />

      {/* W3 — Beste nummers 3 */}
      {(() => {
        const w3Slots = Array.from({ length: W3_MAX_SLOTS }, (_, i) => ({
          key: `w3_${i}`,
          label: String(i + 1),
          slot: getSlot(`w3_${i}`),
        }))
        const openW3Slot = openPicker?.startsWith('w3_')
          ? w3Slots.find(s => s.key === openPicker) ?? null
          : null
        // All countries taken in w1, w2 or other w3 slots
        const w3Taken = new Set([...w3Excluded, ...w3PickedCountries])
        const w3Rows: typeof w3Slots[] = []
        for (let i = 0; i < w3Slots.length; i += 4) w3Rows.push(w3Slots.slice(i, i + 4))
        const openW3RowIndex = openPicker?.startsWith('w3_')
          ? w3Rows.findIndex(row => row.some(s => s.key === openPicker))
          : -1

        return (
          <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
              <div>
                <span className="text-sm font-bold text-white">Beste nummers 3</span>
              </div>
              <span className="text-xs font-bold text-[#FF6B00]">{w3PickedCountries.size} / 8</span>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {w3Rows.map((row, rowIndex) => (
                <div key={rowIndex}>
                  <div className="grid grid-cols-4 gap-2">
                    {row.map(({ key, label, slot }) => (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <div className="relative w-full aspect-square">
                          <button
                            onClick={() => setOpenPicker(openPicker === key ? null : key)}
                            className={`w-full h-full rounded-xl flex flex-col items-center justify-center border transition-colors ${
                              slot.country
                                ? 'border-[#FF6B00] bg-[#1e1e1e]'
                                : openPicker === key
                                ? 'border-[#555] bg-[#1e1e1e]'
                                : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                            }`}
                          >
                            {slot.country ? (
                              <>
                                <FlagImage country={slot.country} size={28} />
                                <span className="font-accent font-light text-[11px] text-white mt-1 leading-none">{abbrevCountry(slot.country)}</span>
                                {getQuote(slot.country, 'derde') != null && (
                                  <span className="inline-flex items-center gap-0.5 font-heading text-sm font-bold text-[#FF6B00] mt-0.5">
                                    {getQuote(slot.country, 'derde')!.toFixed(2)}
                                    <TrendIndicator trend={getTrend(slot.country, 'derde')} />
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xl font-bold" style={{ color: '#777' }}>{label}</span>
                            )}
                          </button>
                          {slot.country && (
                            <button
                              onClick={(e) => { e.stopPropagation(); pickCountry(key, null) }}
                              className="absolute top-1 right-1 text-[#777] hover:text-white transition-colors text-[11px] leading-none w-4 h-4 flex items-center justify-center"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <TokenStepper
                          value={slot.tok}
                          min={W1_MIN}
                          max={W1_MAX}
                          onChange={(tok) => setTok(key, tok)}
                        />
                      </div>
                    ))}
                  </div>
                  {openW3RowIndex === rowIndex && openW3Slot && (
                    <div className="mt-2">
                      <W3CountryPicker
                        taken={w3Taken}
                        currentValue={openW3Slot.slot.country}
                        onSelect={(country) => pickCountry(openW3Slot.key, country)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Shared slot section (w1/w2) ──────────────────────────────────────────────

interface SlotDef {
  key: string
  label: string
  slot: { country: string | null; tok: number }
  options: string[]
  excluded: Set<string>
}

function SlotSection({
  title, slots, openPicker, setOpenPicker, pickCountry, setTok, min, max, qkey,
}: {
  title: string
  slots: SlotDef[]
  openPicker: string | null
  setOpenPicker: (k: string | null) => void
  pickCountry: (key: string, c: string | null) => void
  setTok: (key: string, tok: number) => void
  min: number
  max: number
  qkey?: string
}) {
  const filled = slots.filter((s) => s.slot.country).length
  const openSlot = slots.find(s => s.key === openPicker) ?? null

  // Group slots into rows of 4
  const rows: SlotDef[][] = []
  for (let i = 0; i < slots.length; i += 4) rows.push(slots.slice(i, i + 4))
  const openRowIndex = openPicker
    ? rows.findIndex(row => row.some(s => s.key === openPicker))
    : -1

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <div>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        <span className="text-xs font-bold text-[#FF6B00]">{filled} / {slots.length}</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            <div className="grid grid-cols-4 gap-2">
              {row.map(({ key, label, slot }) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <div className="relative w-full aspect-square">
                    <button
                      onClick={() => setOpenPicker(openPicker === key ? null : key)}
                      className={`w-full h-full rounded-xl flex flex-col items-center justify-center border transition-colors ${
                        slot.country
                          ? 'border-[#FF6B00] bg-[#1e1e1e]'
                          : openPicker === key
                          ? 'border-[#555] bg-[#1e1e1e]'
                          : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                      }`}
                    >
                      {slot.country ? (
                        <>
                          <FlagImage country={slot.country} size={28} />
                          <span className="font-accent font-light text-[11px] text-white mt-1 leading-none">{abbrevCountry(slot.country)}</span>
                          {qkey && getQuote(slot.country, qkey) != null && (
                            <span className="inline-flex items-center gap-0.5 font-heading text-sm font-bold text-[#FF6B00] mt-0.5">
                              {getQuote(slot.country, qkey)!.toFixed(2)}
                              <TrendIndicator trend={getTrend(slot.country, qkey)} />
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xl font-bold" style={{ color: '#777' }}>{label}</span>
                      )}
                    </button>
                    {slot.country && (
                      <button
                        onClick={(e) => { e.stopPropagation(); pickCountry(key, null) }}
                        className="absolute top-1 right-1 text-[#777] hover:text-white transition-colors text-[11px] leading-none w-4 h-4 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <TokenStepper value={slot.tok} min={min} max={max} onChange={(tok) => setTok(key, tok)} />
                </div>
              ))}
            </div>

            {/* Inline picker — shown directly below the row containing the open card */}
            {openRowIndex === rowIndex && openSlot && (
              <div className="mt-2 rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(10,10,10,0.75)' }}>
                <div className="px-3 py-2 bg-[#111] flex items-center justify-between">
                  <span className="text-[10px] text-[#999] uppercase tracking-widest">
                    Groep {openSlot.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 p-3">
                  {openSlot.options.map((country) => {
                    const isSelected = openSlot.slot.country === country
                    const isTaken = !isSelected && openSlot.excluded.has(country)
                    const quote = qkey ? getQuote(country, qkey) : null
                    return (
                      <button
                        key={country}
                        onClick={() => pickCountry(openPicker!, isSelected ? null : country)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-colors ${
                          isSelected
                            ? 'border-[#FF6B00] bg-[#FF6B00]/10'
                            : isTaken
                            ? 'border-[#553300] bg-[#1a1a1a] hover:border-[#886600]'
                            : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                        }`}
                      >
                        {isTaken && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00] opacity-70" />
                        )}
                        <span className={isSelected ? '' : 'opacity-60'}>
                          <FlagImage country={country} size={28} />
                        </span>
                        <span className={`font-accent font-light text-[11px] mt-1 leading-none ${isSelected ? 'text-white' : 'text-[#888]'}`}>
                          {abbrevCountry(country)}
                        </span>
                        {quote != null && (
                          <span className={`font-heading text-[10px] font-bold mt-0.5 ${isSelected ? 'text-[#FF6B00]' : 'text-[#666]'}`}>
                            {quote.toFixed(2)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── W3 country picker ─────────────────────────────────────────────────────────

function W3CountryPicker({
  taken, currentValue, onSelect,
}: {
  taken: Set<string>
  currentValue: string | null
  onSelect: (c: string | null) => void
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(10,10,10,0.75)' }}>
      <div className="px-3 py-2 bg-[#111] flex items-center">
        <span className="text-[10px] text-[#999] uppercase tracking-widest">Kies land</span>
      </div>
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="flex gap-2 p-3">
          {ALL_COUNTRIES.map((country) => {
            const isSelected = currentValue === country
            const isTaken = !isSelected && taken.has(country)
            const quote = getQuote(country, 'derde')
            return (
              <button
                key={country}
                onClick={() => onSelect(isSelected ? null : country)}
                className={`relative flex-shrink-0 w-[72px] h-[72px] rounded-xl flex flex-col items-center justify-center border transition-colors ${
                  isSelected
                    ? 'border-[#FF6B00] bg-[#FF6B00]/10'
                    : isTaken
                    ? 'border-[#553300] bg-[#1a1a1a] hover:border-[#886600]'
                    : 'border-[#444] bg-[#1a1a1a] hover:border-[#666]'
                }`}
              >
                {isTaken && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00] opacity-70" />
                )}
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
