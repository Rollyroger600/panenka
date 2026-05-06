'use client'
import { useState } from 'react'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { useDeadline } from '@/hooks/useDeadline'
import { Ronde32Section } from '@/components/knockout/Ronde32Section'
import { RoundSection } from '@/components/knockout/RoundSection'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ScheduleView } from '@/components/knockout/ScheduleView'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'

const TABS = [
  { id: 'ronde32', label: 'Ronde van 32', short: 'R 32' },
  { id: 'r16',    label: 'Ronde van 16', short: 'R 16' },
  { id: 'r8',     label: 'Kwartfinales',  short: '1/4' },
  { id: 'r4',     label: 'Halve Finales', short: '1/2' },
  { id: 'finale', label: 'Finale',        short: 'Fin' },
  { id: 'winner', label: 'Winnaar',       short: 'Win' },
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

      {/* Round tabs — centered */}
      <div className="flex gap-1.5 mb-5 bg-[#161616] rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white'
                : 'text-white hover:text-[#FF6B00]'
            }`}
          >
            <span className="sm:hidden">{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
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
