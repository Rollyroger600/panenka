'use client'
import { useState } from 'react'
import { useFantasyXV } from '@/hooks/useFantasyXV'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore, REGULAR_SLOTS, TALENT_SLOTS } from '@/store/gameStore'
import { TeamNameEditor } from '@/components/fantasy/TeamNameEditor'
import { RulesPanel } from '@/components/fantasy/RulesPanel'
import { PlayerRow } from '@/components/fantasy/PlayerRow'
import { EmptySlot } from '@/components/fantasy/EmptySlot'
import { PlayerModal } from '@/components/fantasy/PlayerModal'
import { SkeletonList } from '@/components/ui/Skeleton'

interface Props {
  participantName: string
}

export function FantasyClient({ participantName }: Props) {
  const { isLoaded } = useFantasyXV(participantName)
  const { isPast } = useDeadline()
  const { fantasySquad } = useGameStore()
  const [modalSlot, setModalSlot] = useState<string | null>(null)

  const openModal = (slotKey: string) => { if (!isPast) setModalSlot(slotKey) }
  const closeModal = () => setModalSlot(null)
  const isTalentSlot = (key: string) => key.startsWith('t')

  if (!isLoaded) return <SkeletonList count={8} />

  return (
    <div>
      <TeamNameEditor />

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      <RulesPanel />

      <div className="mb-2">
        <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Spelers</span>
      </div>
      <div className="flex flex-col gap-2 mb-6">
        {REGULAR_SLOTS.map((key) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} player={player} />
          ) : (
            <EmptySlot key={key} isTalent={false} onClick={() => openModal(key)} />
          )
        })}
      </div>

      <div className="mb-2">
        <span
          className="text-lg text-[#FF6B00]"
          style={{ fontFamily: 'Chalky, cursive' }}
        >
          Talents
        </span>
        <span className="ml-2 text-xs text-[#555]">U22 · geboren na 11 jun 2004</span>
      </div>
      <div className="flex flex-col gap-2 mb-6">
        {TALENT_SLOTS.map((key) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} player={player} />
          ) : (
            <EmptySlot key={key} isTalent onClick={() => openModal(key)} />
          )
        })}
      </div>

      {/* Coach label */}
      <div className="mt-2 text-center">
        <span className="text-base text-[#555]" style={{ fontFamily: 'Chalky, cursive' }}>
          Coach: {participantName}
        </span>
      </div>

      {modalSlot && (
        <PlayerModal
          slotKey={modalSlot}
          talentOnly={isTalentSlot(modalSlot)}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
