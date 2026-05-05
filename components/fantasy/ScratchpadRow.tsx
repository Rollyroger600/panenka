'use client'
import { useGameStore, REGULAR_SLOTS, TALENT_SLOTS } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import { useMemo } from 'react'
import type { Player } from '@/lib/data/players'

interface Props {
  slotKey: string
  player: Player
}

export function ScratchpadRow({ slotKey, player }: Props) {
  const { activeInfoSlot, setActiveInfoSlot, setScratchpadPlayer, setFantasyPlayer, fantasySquad } = useGameStore()
  const isOpen = activeInfoSlot === slotKey
  const quote = computePlayerQuote(player)

  const isTalent = player.dob >= '2004-06-11'

  const firstEmptySquadSlot = useMemo(() => {
    // Prefer talent slots for U22 players, but allow any empty slot
    const ordered = isTalent ? [...TALENT_SLOTS, ...REGULAR_SLOTS] : [...REGULAR_SLOTS, ...TALENT_SLOTS]
    return ordered.find((k) => !fantasySquad[k]) ?? null
  }, [fantasySquad, isTalent])

  function moveToTeam() {
    if (!firstEmptySquadSlot) return
    setFantasyPlayer(firstEmptySquadSlot, player)
    setScratchpadPlayer(slotKey, null)
    setActiveInfoSlot(null)
  }

  return (
    <>
      <button
        onClick={() => setActiveInfoSlot(slotKey)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left border-dashed ${
          isOpen ? 'bg-[#111] border-[#333]' : 'bg-[#0d0d0d] border-[#222] hover:border-[#333]'
        } border`}
      >
        <FlagImage country={player.country} size={28} className="shrink-0 opacity-60" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#888] truncate">{player.name}</div>
          <div className="text-xs text-[#444] truncate">{player.country} · {player.club}</div>
        </div>
        <span className="text-sm font-bold text-[#555] shrink-0">{player.overall}</span>
        <span className="text-xs font-bold text-[#555] bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-lg shrink-0">
          {formatQuote(quote)}
        </span>
      </button>

      {isOpen && (
        <div className="mx-1 mb-2 rounded-xl bg-[#0d0d0d] border border-dashed border-[#2a2a2a] p-3">
          <div className="flex items-center gap-2 mb-3">
            <FlagImage country={player.country} size={20} />
            <span className="text-sm font-bold text-[#999]">{player.fullName}</span>
            <span className="ml-auto text-sm text-[#555]">Quote {formatQuote(quote)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Overall', value: player.overall },
              { label: 'Positie(s)', value: player.positions.join(', ') },
              { label: 'Leeftijd WK', value: `${Math.floor((new Date('2026-06-11').getTime() - new Date(player.dob).getTime()) / (365.25 * 24 * 3600 * 1000))} jr` },
              { label: 'Club', value: player.club },
              { label: 'Competitie', value: player.league },
              { label: 'Conf.', value: player.confederation },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#111] rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-[#444] uppercase tracking-wide">{label}</div>
                <div className="text-xs font-bold text-[#666] truncate">{value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={moveToTeam}
              disabled={!firstEmptySquadSlot}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                firstEmptySquadSlot
                  ? 'bg-[#1a3a2a] text-[#4adf8a] border border-[#4adf8a]/20 hover:bg-[#1a3a2a]/80'
                  : 'bg-[#1a1a1a] text-[#444] border border-[#2a2a2a] cursor-not-allowed'
              }`}
            >
              ↑ Zet in team
            </button>
            <button
              onClick={() => { setScratchpadPlayer(slotKey, null); setActiveInfoSlot(null) }}
              className="flex-1 py-1.5 rounded-lg bg-[#1a1a1a] text-[#555] border border-[#2a2a2a] text-xs font-bold hover:bg-[#222] transition-colors"
            >
              ✕ Verwijder
            </button>
          </div>
        </div>
      )}
    </>
  )
}
