'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { TokenStepper } from './TokenStepper'
import { GROUP_TEAMS, POULE_LETTERS, getW3Excluded } from '@/lib/knockoutHelpers'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { SuggestionsPanel, type Suggestion } from './SuggestionsPanel'
import type { StandingRow } from '@/lib/standings'

const W1_MIN = 2; const W1_MAX = 9
const W3_MAX_SLOTS = 8

export function Ronde32Section() {
  const { knockoutPicks, setKnockoutSlot, clearKnockoutSlot } = useGameStore()
  const [openPicker, setOpenPicker] = useState<string | null>(null)

  function applyAllSuggestions(suggestions: Suggestion[], bestThird: StandingRow[]) {
    // Fill w1 / w2 empty slots per group
    suggestions.forEach(({ w1, w2 }, i) => {
      if (w1 && !knockoutPicks[`w1_${i}`]?.country) setKnockoutSlot(`w1_${i}`, { country: w1, tok: W1_MIN })
      if (w2 && !knockoutPicks[`w2_${i}`]?.country) setKnockoutSlot(`w2_${i}`, { country: w2, tok: W1_MIN })
    })
    // Fill empty w3 slots from bestThird list
    let w3Slot = 0
    for (const team of bestThird) {
      // Skip slots already filled
      while (w3Slot < W3_MAX_SLOTS && knockoutPicks[`w3_${w3Slot}`]?.country) w3Slot++
      if (w3Slot >= W3_MAX_SLOTS) break
      setKnockoutSlot(`w3_${w3Slot}`, { country: team.country, tok: W1_MIN })
      w3Slot++
    }
  }

  function getSlot(key: string) {
    return knockoutPicks[key] ?? { country: null, tok: W1_MIN }
  }

  function pickCountry(key: string, country: string | null) {
    if (country === null) {
      clearKnockoutSlot(key)
    } else {
      setKnockoutSlot(key, { country, tok: getSlot(key).tok || W1_MIN })
    }
    setOpenPicker(null)
  }

  function setTok(key: string, tok: number) {
    setKnockoutSlot(key, { tok })
  }

  // Derive w1/w2 picks for exclusion logic
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
    <div className="flex flex-col gap-6">
      <SuggestionsPanel onApplyAll={applyAllSuggestions} />

      {/* W1 — Poulewinnaars */}
      <SlotSection
        title="Poulewinnaars"
        subtitle="12 groepswinnaars"
        slots={POULE_LETTERS.map((poule, i) => {
          const key = `w1_${i}`
          const slot = getSlot(key)
          const excluded = new Set([w2Countries[poule]].filter(Boolean) as string[])
          const options = GROUP_TEAMS[poule]?.filter((t) => !excluded.has(t)) ?? []
          return { key, label: poule, slot, options }
        })}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
        pickCountry={pickCountry}
        setTok={setTok}
        min={W1_MIN}
        max={W1_MAX}
      />

      {/* W2 — Nummers 2 */}
      <SlotSection
        title="Nummers 2"
        subtitle="12 runners-up"
        slots={POULE_LETTERS.map((poule, i) => {
          const key = `w2_${i}`
          const slot = getSlot(key)
          const excluded = new Set([w1Countries[poule]].filter(Boolean) as string[])
          const options = GROUP_TEAMS[poule]?.filter((t) => !excluded.has(t)) ?? []
          return { key, label: poule, slot, options }
        })}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
        pickCountry={pickCountry}
        setTok={setTok}
        min={W1_MIN}
        max={W1_MAX}
      />

      {/* W3 — Beste nummers 3 */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
        <div className="px-4 py-3 bg-[#111] flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white">Beste nummers 3</span>
            <span className="ml-2 text-xs text-[#555]">8 beste derde-plaatsers</span>
          </div>
          <span className="text-xs font-bold text-[#FF6B00]">{w3PickedCountries.size} / 8</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {Array.from({ length: W3_MAX_SLOTS }, (_, i) => {
            const key = `w3_${i}`
            const slot = getSlot(key)
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[#444] w-4 text-center font-bold">{i + 1}</span>
                <button
                  onClick={() => setOpenPicker(openPicker === key ? null : key)}
                  className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                    slot.country
                      ? 'bg-[#252525] text-white'
                      : 'bg-[#1a1a1a] text-[#444] hover:text-[#666]'
                  }`}
                >
                  {slot.country ? (
                    <>
                      <FlagImage country={slot.country} size={16} />
                      <span className="font-bold">{slot.country}</span>
                    </>
                  ) : (
                    <span>+ Kies land</span>
                  )}
                </button>
                {slot.country && (
                  <TokenStepper
                    value={slot.tok}
                    min={W1_MIN}
                    max={W1_MAX}
                    onChange={(tok) => setTok(key, tok)}
                  />
                )}
              </div>
            )
          })}
        </div>
        {/* W3 country picker */}
        {openPicker?.startsWith('w3_') && (
          <div className="px-3 pb-3">
            <W3CountryPicker
              excluded={w3Excluded}
              alreadyPicked={w3PickedCountries}
              currentKey={openPicker}
              currentValue={getSlot(openPicker).country}
              maxReached={w3PickedCountries.size >= W3_MAX_SLOTS}
              onSelect={(country) => pickCountry(openPicker, country)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared slot section (w1/w2) ──────────────────────────────────────────────

interface SlotDef {
  key: string
  label: string
  slot: { country: string | null; tok: number }
  options: string[]
}

function SlotSection({
  title, subtitle, slots, openPicker, setOpenPicker, pickCountry, setTok, min, max,
}: {
  title: string
  subtitle: string
  slots: SlotDef[]
  openPicker: string | null
  setOpenPicker: (k: string | null) => void
  pickCountry: (key: string, c: string | null) => void
  setTok: (key: string, tok: number) => void
  min: number
  max: number
}) {
  const filled = slots.filter((s) => s.slot.country).length
  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      <div className="px-4 py-3 bg-[#111] flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="ml-2 text-xs text-[#555]">{subtitle}</span>
        </div>
        <span className="text-xs font-bold text-[#FF6B00]">{filled} / {slots.length}</span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        {slots.map(({ key, label, slot, options }) => (
          <div key={key}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF6B00] w-5 text-center">{label}</span>
              <button
                onClick={() => setOpenPicker(openPicker === key ? null : key)}
                className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors text-left ${
                  slot.country
                    ? 'bg-[#252525] text-white'
                    : 'bg-[#1a1a1a] text-[#444] hover:text-[#666]'
                }`}
              >
                {slot.country ? (
                  <>
                    <FlagImage country={slot.country} size={16} />
                    <span className="font-bold">{slot.country}</span>
                  </>
                ) : (
                  <span className="text-xs">+ Kies winnaar</span>
                )}
              </button>
              {slot.country && (
                <>
                  <TokenStepper value={slot.tok} min={min} max={max} onChange={(tok) => setTok(key, tok)} />
                  <button onClick={() => pickCountry(key, null)} className="text-[#444] hover:text-[#888] text-sm px-1">✕</button>
                </>
              )}
            </div>
            {openPicker === key && (
              <div className="mt-1 ml-7 flex flex-wrap gap-1.5 p-2 bg-[#111] rounded-lg">
                {options.map((country) => (
                  <button
                    key={country}
                    onClick={() => pickCountry(key, country)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      slot.country === country
                        ? 'bg-[#FF6B00] text-white'
                        : 'bg-[#252525] text-[#ccc] hover:bg-[#333]'
                    }`}
                  >
                    <FlagImage country={country} size={14} />
                    {country}
                  </button>
                ))}
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
  excluded, alreadyPicked, currentKey, currentValue, maxReached, onSelect,
}: {
  excluded: Set<string>
  alreadyPicked: Set<string>
  currentKey: string
  currentValue: string | null
  maxReached: boolean
  onSelect: (c: string | null) => void
}) {
  const available = ALL_COUNTRIES.filter((c) => !excluded.has(c))
  return (
    <div className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a]">
      <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">
        Kies een land (niet al gekozen als winnaar of runner-up)
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {currentValue && (
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-[#E74C3C]/20 text-[#E74C3C] border border-[#E74C3C]/30"
          >
            ✕ Verwijder
          </button>
        )}
        {available.map((country) => {
          const isSelected = currentValue === country
          const isPicked = alreadyPicked.has(country) && !isSelected
          const isDisabled = isPicked || (maxReached && !isSelected)
          return (
            <button
              key={country}
              onClick={() => !isDisabled && onSelect(isSelected ? null : country)}
              disabled={isDisabled}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                isSelected
                  ? 'bg-[#FF6B00] text-white'
                  : isDisabled
                  ? 'bg-[#1a1a1a] text-[#333] cursor-not-allowed'
                  : 'bg-[#252525] text-[#ccc] hover:bg-[#333]'
              }`}
            >
              <FlagImage country={country} size={12} />
              {country}
            </button>
          )
        })}
      </div>
    </div>
  )
}
