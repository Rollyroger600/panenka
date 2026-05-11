'use client'
import { useGameStore, ALL_SLOTS, SCRATCHPAD_SLOTS } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { PlayerInfoCard } from './PlayerInfoCard'
import { computePlayerQuote, formatQuote, getPlayerTrend } from '@/lib/helpers'
import type { OddsTrend } from '@/lib/data/knockoutQuotes_trends'

function TrendIndicator({ trend }: { trend: OddsTrend }) {
  if (!trend || trend === 'same') return null
  return (
    <span className={`absolute top-0 right-0 text-[7px] leading-none font-bold ${
      trend === 'up' ? 'text-[#FF6B00]' : 'text-emerald-400'
    }`}>
      {trend === 'up' ? '▲' : '▼'}
    </span>
  )
}
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
  const trend = getPlayerTrend(player.country)

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
      <div
        className={`flex items-center rounded-xl border ${hasViolation ? 'border-[#E74C3C]/40' : 'border-[#2a2a2a]'}`}
        style={{ background: isOpen ? '#252525' : 'rgba(22,22,22,0.82)' }}
      >
        <button
          onClick={() => setActiveInfoSlot(slotKey)}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left min-w-0 hover:bg-white/5 rounded-l-xl transition-colors"
        >
          <span className="text-sm font-bold text-[#555] w-6 shrink-0 text-right">#{slotIndex}</span>
          <FlagImage country={player.country} size={28} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{player.name}</div>
            <div className="text-xs text-[#666] truncate">{player.country} · {player.club}</div>
          </div>
          <span className="text-sm font-bold text-white shrink-0">{player.overall}</span>
          <span className="relative font-heading text-xs font-bold text-[#FF6B00] border border-[#FF6B00] px-2 py-0.5 rounded-lg shrink-0">
            {formatQuote(quote)}
            <TrendIndicator trend={trend} />
          </span>
        </button>
        <button
          onClick={() => { setFantasyPlayer(slotKey, null); setActiveInfoSlot(null) }}
          className="px-3 py-2.5 text-[#444] hover:text-[#999] transition-colors shrink-0 text-base"
        >
          ✕
        </button>
      </div>
      {isOpen && (
        <PlayerInfoCard
          player={player}
          onMoveToScratchpad={scratchpadFull ? undefined : moveToScratchpad}
        />
      )}
    </>
  )
}
