'use client'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { PlayerInfoCard } from './PlayerInfoCard'
import { computePlayerQuote, formatQuote, abbrevName } from '@/lib/helpers'
import { validateFantasyXV } from '@/lib/validation'
import { ALL_SLOTS } from '@/store/gameStore'
import { useMemo } from 'react'
import type { Player } from '@/lib/data/players'

interface Props {
  slotKey: string
  player: Player
}

export function PlayerRow({ slotKey, player }: Props) {
  const { activeInfoSlot, setActiveInfoSlot, setFantasyPlayer, fantasySquad } = useGameStore()
  const isOpen = activeInfoSlot === slotKey
  const quote = computePlayerQuote(player)

  const hasViolation = useMemo(() => {
    const players = ALL_SLOTS.map((k) => fantasySquad[k] ?? null)
    const { violations } = validateFantasyXV(players)
    return violations.some((v) => v.includes(player.country) || v.includes(player.club))
  }, [fantasySquad, player])

  return (
    <>
      <button
        onClick={() => setActiveInfoSlot(slotKey)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors text-left ${
          isOpen ? 'bg-[#252525]' : 'bg-[#161616] hover:bg-[#1e1e1e]'
        } border border-[#2a2a2a]`}
      >
        <span className="text-sm font-bold text-white flex-1 truncate">{abbrevName(player.fullName)}</span>
        {hasViolation && (
          <span className="text-[10px] font-bold text-[#E74C3C] bg-[#E74C3C]/10 px-1.5 py-0.5 rounded shrink-0">
            !
          </span>
        )}
        <FlagImage country={player.country} size={18} className="shrink-0" />
        <span className="text-xs font-bold text-[#FFB800] shrink-0">★ {formatQuote(quote)}</span>
      </button>
      {isOpen && (
        <PlayerInfoCard
          player={player}
          onRemove={() => {
            setFantasyPlayer(slotKey, null)
            setActiveInfoSlot(null)
          }}
        />
      )}
    </>
  )
}
