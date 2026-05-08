'use client'
import { useState } from 'react'
import { useFantasyXV } from '@/hooks/useFantasyXV'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore, REGULAR_SLOTS, TALENT_SLOTS, SCRATCHPAD_SLOTS } from '@/store/gameStore'
import { TeamNameEditor } from '@/components/fantasy/TeamNameEditor'
import { RulesPanel } from '@/components/fantasy/RulesPanel'
import { PlayerRow } from '@/components/fantasy/PlayerRow'
import { EmptySlot } from '@/components/fantasy/EmptySlot'
import { ScratchpadRow } from '@/components/fantasy/ScratchpadRow'
import { PlayerModal } from '@/components/fantasy/PlayerModal'
import { SkeletonList } from '@/components/ui/Skeleton'

interface Props {
  participantName: string
}

export function FantasyClient({ participantName }: Props) {
  const { isLoaded } = useFantasyXV(participantName)
  const { isPast } = useDeadline()
  const { fantasySquad, scratchpad, setScratchpadPlayer, setActiveInfoSlot } = useGameStore()
  const [modalSlot, setModalSlot] = useState<string | null>(null)
  const [scratchpadModalSlot, setScratchpadModalSlot] = useState<string | null>(null)

  const openModal = (slotKey: string) => { if (!isPast) setModalSlot(slotKey) }
  const closeModal = () => setModalSlot(null)
  const isTalentSlot = (key: string) => key.startsWith('t')

  const firstEmptyScratchpadSlot = SCRATCHPAD_SLOTS.find((k) => !scratchpad[k])

  if (!isLoaded) return <SkeletonList count={8} />

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Fantasy XV</h1>
      <p className="font-accent font-light text-white text-xs mb-4 text-center">Stel je eigen droomteam samen</p>
      <TeamNameEditor />

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      <RulesPanel />

      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Spelers</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {REGULAR_SLOTS.map((key, idx) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} slotIndex={idx + 1} player={player} />
          ) : (
            <EmptySlot key={key} isTalent={false} slotIndex={idx + 1} onClick={() => openModal(key)} />
          )
        })}
      </div>

      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Talents</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {TALENT_SLOTS.map((key, idx) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} slotIndex={REGULAR_SLOTS.length + idx + 1} player={player} />
          ) : (
            <EmptySlot key={key} isTalent slotIndex={REGULAR_SLOTS.length + idx + 1} onClick={() => openModal(key)} />
          )
        })}
      </div>

      {/* Coach label */}
      <div className="mt-2 mb-8 text-center">
        <span className="font-script text-2xl text-white">
          Coach: {participantName}
        </span>
      </div>

      {/* Kladblok */}
      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Kladblok</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {SCRATCHPAD_SLOTS.map((key) => {
          const player = scratchpad[key]
          return player ? (
            <ScratchpadRow key={key} slotKey={key} player={player} />
          ) : null
        })}
        {!isPast && firstEmptyScratchpadSlot && (
          <button
            onClick={() => { setActiveInfoSlot(null); setScratchpadModalSlot(firstEmptyScratchpadSlot) }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#222] bg-[#0d0d0d] hover:border-[#333] transition-colors text-[#333] text-sm"
          >
            + Speler toevoegen aan kladblok
          </button>
        )}
        {isPast && SCRATCHPAD_SLOTS.every((k) => !scratchpad[k]) && (
          <p className="text-xs text-[#333] text-center py-2">Geen spelers op kladblok</p>
        )}
      </div>

      {/* Uitleg puntensysteem */}
      <div className="mt-4 rounded-xl bg-[#111] border border-[#2a2a2a] p-4 text-xs text-[#555] space-y-1 mb-6">
        <p className="font-bold text-[#666] mb-2">Hoe werkt de puntentelling?</p>
        <p>Spelers verdienen punten met doelpunten en assists. Het totaal aan goals en assists wordt per speler vermenigvuldigd met de quotering van de betreffende speler (oranje getal rechts) en toegevoegd aan je puntentotaal.</p>
        <p className="mt-2">De quotering wordt bepaald door de kwaliteit van de speler (rating EA FC), de kwaliteit van het land (FIFA ranking) en de verwachting van het land in het toernooi (gebaseerd op quoteringen voor behalen volgende ronde).</p>
      </div>

      {modalSlot && (
        <PlayerModal
          slotKey={modalSlot}
          talentOnly={isTalentSlot(modalSlot)}
          onClose={closeModal}
        />
      )}
      {scratchpadModalSlot && (
        <PlayerModal
          slotKey={scratchpadModalSlot}
          talentOnly={false}
          onClose={() => setScratchpadModalSlot(null)}
          onSelect={(player) => {
            setScratchpadPlayer(scratchpadModalSlot, player)
            setActiveInfoSlot(null)
          }}
        />
      )}
    </div>
  )
}
