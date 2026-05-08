'use client'
import { useGameStore, ALL_SLOTS, SCRATCHPAD_SLOTS } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { PlayerInfoCard } from './PlayerInfoCard'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import { validateFantasyXV } from '@/lib/validation'
import { useMemo } from 'react'
import type { Player } from '@/lib/data/players'

interface Props {
  slotKey: string
  slotIndex: number
  player: Player
}

export function PlayerRow({ slotKey, slotIndex, player }: Props) {
  const { activeInfoSlot, setActiveInfoSlot, setFantasyPlayer, setScratchpadPlayer, fantasySquad, scratchpad } = useGameStore()
  const isOpen = activeInfoSlot === slotKey
  const quote = computePlayerQuote(player)

  const hasViolation = useMemo(() => {
    const players = ALL_SLOTS.map((k) => fantasySquad[k] ?? null)
    const { violations } = validateFantasyXV(players)
    return violations.some((v) => v.includes(player.country) || v.includes(player.club))
  }, [fantasySquad, player])

  function moveToScratchpad() {
    const emptySlot = SCRATCHPAD_SLOTS.find((k) => !scratchpad[k])
    if (!emptySlot) return
    setScratchpadPlayer(emptySlot, player)
    setFantasyPlayer(slotKey, null)
    setActiveInfoSlot(null)
  }

  const scratchpadFull = SCRATCHPAD_SLOTS.every((k) => !!scratchpad[k])

  return (
    <>
      <button
        onClick={() => setActiveInfoSlot(slotKey)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left hover:bg-[#1e1e1e] border ${hasViolation ? 'border-[#E74C3C]/40' : 'border-[#2a2a2a]'}`}
        style={{ background: isOpen ? '#252525' : 'rgba(22,22,22,0.82)' }}
      >
        <span className="text-sm font-bold text-[#555] w-6 shrink-0 text-right">#{slotIndex}</span>
        <FlagImage country={player.country} size={28} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{player.name}</div>
          <div className="text-xs text-[#666] truncate">{player.country} · {player.club}</div>
        </div>
        <span className="text-sm font-bold text-white shrink-0">{player.overall}</span>
        <span className="font-heading text-xs font-bold text-[#FF6B00] border border-[#FF6B00] px-2 py-0.5 rounded-lg shrink-0">
          {formatQuote(quote)}
        </span>
      </button>
      {isOpen && (
        <PlayerInfoCard
          player={player}
          onRemove={() => {
            setFantasyPlayer(slotKey, null)
            setActiveInfoSlot(null)
          }}
          onMoveToScratchpad={scratchpadFull ? undefined : moveToScratchpad}
        />
      )}
    </>
  )
}
