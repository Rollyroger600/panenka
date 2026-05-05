'use client'
import { useState } from 'react'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { useDeadline } from '@/hooks/useDeadline'
import { Ronde32Section } from '@/components/knockout/Ronde32Section'
import { RoundSection } from '@/components/knockout/RoundSection'
import { SkeletonList } from '@/components/ui/Skeleton'
import { BracketView } from '@/components/knockout/BracketView'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'

const TABS = [
  { id: 'ronde32', label: 'Ronde van 16' },
  { id: 'r16',    label: 'Ronde van 8' },
  { id: 'r8',     label: 'Kwartfinales' },
  { id: 'r4',     label: 'Halve Finales' },
  { id: 'finale', label: 'Finale' },
  { id: 'winner', label: 'Winnaar' },
]

const NON32_ROUNDS = KNOCKOUT_ROUNDS.filter((r) => r.uiTab !== 'ronde32')

export function KnockoutClient() {
  const { isLoaded } = useKnockoutPicks()
  const { isPast } = useDeadline()
  const [activeTab, setActiveTab] = useState('ronde32')

  const activeRound = NON32_ROUNDS.find((r) => r.uiTab === activeTab)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1 text-center">Knockout</h1>
      <p className="text-white text-sm mb-4 text-center">Voorspel welke landen doorgaan per ronde</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-white font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      <BracketView />

      {/* Round tabs — centered */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white'
                : 'bg-[#1e1e1e] text-white hover:text-[#FF6B00]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
