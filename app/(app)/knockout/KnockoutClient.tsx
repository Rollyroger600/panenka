'use client'
import { useState, useMemo } from 'react'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore } from '@/store/gameStore'
import { Ronde32Section } from '@/components/knockout/Ronde32Section'
import { RoundSection } from '@/components/knockout/RoundSection'
import { SkeletonList } from '@/components/ui/Skeleton'
import { BracketView } from '@/components/knockout/BracketView'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'

const TABS = [
  { id: 'ronde32', label: 'Ronde 32' },
  { id: 'r16',    label: 'R. van 16' },
  { id: 'r8',     label: 'Kwartf.' },
  { id: 'r4',     label: 'Halve F.' },
  { id: 'finale', label: 'Finale' },
  { id: 'winner', label: 'Winnaar' },
]

const NON32_ROUNDS = KNOCKOUT_ROUNDS.filter((r) => r.uiTab !== 'ronde32')

export function KnockoutClient() {
  const { isLoaded } = useKnockoutPicks()
  const { isPast } = useDeadline()
  const [activeTab, setActiveTab] = useState('ronde32')
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)

  const totalFilled = useMemo(
    () => Object.values(knockoutPicks).filter((s) => s.country).length,
    [knockoutPicks],
  )

  const activeRound = NON32_ROUNDS.find((r) => r.uiTab === activeTab)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Knockout</h1>
      <p className="text-[#888] text-sm mb-1">Voorspel welke landen doorgaan per ronde</p>
      <p className="text-[#FF6B00] text-xs font-bold mb-4">{totalFilled} landen gekozen</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      <BracketView />

      <div className="flex overflow-x-auto gap-1 mb-5 pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white'
                : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
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
