'use client'
import { useState, useMemo } from 'react'
import { useGameStore, ALL_SLOTS } from '@/store/gameStore'
import { WK_PLAYERS } from '@/lib/data/players'
import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import type { Player } from '@/lib/data/players'

const WK_START = '2026-06-11'
const IS_TALENT = (p: Player) => p.dob >= '2004-06-11'

const CONFEDERATIONS = ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC']
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']

interface Props {
  slotKey: string
  talentOnly: boolean
  onClose: () => void
}

export function PlayerModal({ slotKey, talentOnly, onClose }: Props) {
  const { fantasySquad, setFantasyPlayer, setActiveInfoSlot } = useGameStore()
  const [search, setSearch] = useState('')
  const [filterConf, setFilterConf] = useState<string | null>(null)
  const [filterPos, setFilterPos] = useState<string | null>(null)

  const alreadyPicked = useMemo(
    () => new Set(ALL_SLOTS.map((k) => fantasySquad[k]?.id).filter(Boolean) as number[]),
    [fantasySquad],
  )

  const results = useMemo(() => {
    let pool = WK_PLAYERS
    if (talentOnly) pool = pool.filter(IS_TALENT)
    if (filterConf) pool = pool.filter((p) => p.confederation === filterConf)
    if (filterPos) pool = pool.filter((p) => p.positions.includes(filterPos))
    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(
        (p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.country.toLowerCase().includes(q),
      )
    }
    return pool.slice(0, 80)
  }, [search, filterConf, filterPos, talentOnly])

  function select(player: Player) {
    setFantasyPlayer(slotKey, player)
    setActiveInfoSlot(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] flex flex-col bg-[#111] rounded-t-2xl border-t border-[#2a2a2a]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <span className="text-base font-bold text-white">
            {talentOnly ? 'Talent kiezen (U22)' : 'Speler kiezen'}
          </span>
          <button onClick={onClose} className="text-[#555] hover:text-white text-xl">✕</button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 shrink-0">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam of land…"
            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
          />
        </div>

        {/* Confederation filter */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {CONFEDERATIONS.map((c) => (
            <button
              key={c}
              onClick={() => setFilterConf(filterConf === c ? null : c)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                filterConf === c ? 'bg-[#FF6B00] text-white' : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Position filter */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setFilterPos(filterPos === pos ? null : pos)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                filterPos === pos ? 'bg-[#252525] text-[#FF6B00] border border-[#FF6B00]' : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="px-4 pb-1 shrink-0">
          <span className="text-[10px] text-[#444]">{results.length} spelers</span>
        </div>

        {/* Player list */}
        <div className="overflow-y-auto flex-1 px-4 pb-24">
          {results.map((player) => {
            const isPicked = alreadyPicked.has(player.id)
            const quote = computePlayerQuote(player)
            return (
              <button
                key={player.id}
                onClick={() => !isPicked && select(player)}
                disabled={isPicked}
                className={`w-full flex items-center gap-2.5 py-2.5 border-b border-[#1a1a1a] text-left transition-colors ${
                  isPicked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <FlagImage country={player.country} size={20} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{player.name}</div>
                  <div className="text-[10px] text-[#555] truncate">
                    {player.positions.join(', ')} · {player.club}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#FFB800]">★ {formatQuote(quote)}</div>
                  <div className="text-[10px] text-[#444]">{player.overall}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
