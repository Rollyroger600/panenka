'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadScoresForGroup } from '@/app/actions/scores'
import { Podium } from '@/components/leaderboard/Podium'
import { RankList } from '@/components/leaderboard/RankList'
import { DUAL_GROUP_INITIALS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { ParticipantScore } from '@/app/leaderboard/types'

type Tab = 'stand' | 'inzet' | 'pot'

const TABS: { label: string; value: Tab }[] = [
  { label: 'Stand',  value: 'stand' },
  { label: 'Inzet',  value: 'inzet' },
  { label: 'Pot',    value: 'pot'   },
]

interface Props {
  mijnInitials: string
  defaultGroup: GroupId
}

export function StandClient({ mijnInitials, defaultGroup }: Props) {
  const isDualGroup = DUAL_GROUP_INITIALS.includes(mijnInitials.toUpperCase())
  const [activeGroup, setActiveGroup] = useState<GroupId>(defaultGroup)
  const [activeTab, setActiveTab] = useState<Tab>('stand')
  const [scores, setScores] = useState<ParticipantScore[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [headerToggleEl, setHeaderToggleEl] = useState<Element | null>(null)

  useEffect(() => {
    setHeaderToggleEl(document.getElementById('header-chat-toggle'))
  }, [])

  const load = useCallback((group: GroupId) => {
    setIsLoaded(false)
    loadScoresForGroup(group).then((s) => {
      setScores(s)
      setIsLoaded(true)
    })
  }, [])

  useEffect(() => {
    load(activeGroup)
  }, [activeGroup, load])

  useEffect(() => {
    const id = setInterval(() => load(activeGroup), 60_000)
    return () => clearInterval(id)
  }, [activeGroup, load])

  const hasScores = scores.some((s) => s.total > 0)
  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <>
      <div>
        <div className="relative flex items-center justify-center mb-1">
          <h1 className="font-accent font-bold text-3xl text-white">Overzicht</h1>
          {activeTab === 'stand' && (
            <div className="absolute right-0">
              <button
                onClick={() => load(activeGroup)}
                className="text-xs text-[#555] hover:text-[#FF6B00] transition-colors font-bold uppercase tracking-wide"
              >
                ↻ Vernieuwen
              </button>
            </div>
          )}
        </div>
        <p className="font-accent font-light text-white text-xs mb-3 text-center">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
          {TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={[
                'flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all',
                activeTab === value ? 'bg-[#FF6B00] text-white' : 'text-white hover:text-[#FF6B00]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Stand */}
        {activeTab === 'stand' && (
          <>
            {!isLoaded && (
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center mb-6">
                <div className="text-[#555] text-sm">Laden…</div>
              </div>
            )}

            {isLoaded && !hasScores && (
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center mb-6">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-[#888] text-sm">
                  Scores worden berekend na de eerste wedstrijden
                </div>
              </div>
            )}

            {isLoaded && hasScores && <Podium top3={top3} />}

            {isLoaded && (
              <RankList
                participants={hasScores ? rest : scores}
                currentInitials={mijnInitials}
                startRank={hasScores ? 4 : 1}
              />
            )}
          </>
        )}

        {/* Tab: Inzet */}
        {activeTab === 'inzet' && (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-[#888] text-sm">Toernooiweddenschappen komen hier</div>
          </div>
        )}

        {/* Tab: Pot */}
        {activeTab === 'pot' && (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-[#888] text-sm">Overzicht van de pot komt hier</div>
          </div>
        )}
      </div>

      {headerToggleEl && isDualGroup && createPortal(
        <div className="flex rounded-full bg-[#1E1E1E] border border-[#333] p-0.5 gap-0.5">
          {(['og', 'asc'] as GroupId[]).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeGroup === g ? 'bg-[#FF6B00] text-white' : 'text-[#888] hover:text-white'
              }`}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>,
        headerToggleEl,
      )}
    </>
  )
}
