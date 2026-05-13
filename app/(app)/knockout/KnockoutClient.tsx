'use client'
import { useState } from 'react'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { usePredictions } from '@/hooks/usePredictions'
import { useDeadline } from '@/hooks/useDeadline'
import { Ronde32Section } from '@/components/knockout/Ronde32Section'
import { RoundSection } from '@/components/knockout/RoundSection'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ScheduleView } from '@/components/knockout/ScheduleView'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'

const TABS = [
  { id: 'ronde32', label: 'R 32' },
  { id: 'r16',    label: 'R 16' },
  { id: 'r8',     label: '1/4' },
  { id: 'r4',     label: '1/2' },
  { id: 'finale', label: 'Fin' },
  { id: 'winner', label: 'Win' },
]

const NON32_ROUNDS = KNOCKOUT_ROUNDS.filter((r) => r.uiTab !== 'ronde32')

export function KnockoutClient() {
  const { isLoaded } = useKnockoutPicks()
  usePredictions()
  const { isPast } = useDeadline()
  const [activeTab, setActiveTab] = useState('ronde32')

  const activeRound = NON32_ROUNDS.find((r) => r.uiTab === activeTab)

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Knockout</h1>
      <p className="font-accent font-light text-white text-xs mb-4 text-center">Voorspel welke landen doorgaan per ronde</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-white font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      {/* Round tabs — centered */}
      <div className="flex gap-1.5 mb-5 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all ${
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white'
                : 'text-white hover:text-[#FF6B00]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'ronde32' && <ScheduleView activeTab={activeTab} />}

      {!isLoaded ? (
        <SkeletonList count={4} />
      ) : (
        <>
          {activeTab === 'ronde32' && <Ronde32Section />}
          {activeRound && <RoundSection round={activeRound} />}
        </>
      )}
    </div>
  )
}
