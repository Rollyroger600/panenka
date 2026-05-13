'use client'
import { useState } from 'react'
import { usePredictions } from '@/hooks/usePredictions'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore } from '@/store/gameStore'
import { MatchCard } from '@/components/matches/MatchCard'
import { StandingsPanel } from '@/components/matches/StandingsPanel'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'
import type { KoRound } from '@/lib/data/matches'

interface Props { initials: string }

type Phase = 'poule' | 'knockout'
type PouleFilter = number | 'standen' | 'todo'

function groupPouleMatches() {
  const rounds: Record<number, typeof MATCHES> = {}
  for (const m of MATCHES) {
    if (m.phase === 'knockout') continue
    rounds[m.round] ??= []
    rounds[m.round].push(m)
  }
  return rounds
}

function groupKoMatches() {
  const rounds: Partial<Record<KoRound, typeof MATCHES>> = {}
  for (const m of MATCHES) {
    if (m.phase !== 'knockout' || !m.koRound) continue
    rounds[m.koRound] ??= []
    rounds[m.koRound]!.push(m)
  }
  return rounds
}

const POULE_FILTERS: { label: string; value: PouleFilter }[] = [
  { label: 'Ronde 1', value: 1 },
  { label: 'Ronde 2', value: 2 },
  { label: 'Ronde 3', value: 3 },
  { label: 'TO-DO',   value: 'todo' },
  { label: 'Standen', value: 'standen' },
]

const ROUND_LABEL: Record<number, string> = { 1: 'Ronde 1', 2: 'Ronde 2', 3: 'Ronde 3' }

const KO_FILTERS: { label: string; rounds: KoRound[] }[] = [
  { label: 'R 32', rounds: ['rv32'] },
  { label: 'R 16', rounds: ['rv16'] },
  { label: '1/4',  rounds: ['kf'] },
  { label: '1/2',  rounds: ['hf'] },
  { label: 'FIN',  rounds: ['brons', 'finale'] },
]

export function PoulefaseClient({ initials }: Props) {
  const { isLoaded } = usePredictions()
  const { isPast } = useDeadline()
  const { predictions } = useGameStore()
  const pouleRounds = groupPouleMatches()
  const koRounds = groupKoMatches()

  const [phase, setPhase] = useState<Phase>('poule')
  const [pouleTab, setPouleTab] = useState<PouleFilter>(1)
  const [koTab, setKoTab] = useState(0)

  const showStandings = phase === 'poule' && pouleTab === 'standen'
  const showTodo = phase === 'poule' && pouleTab === 'todo'

  const visiblePouleRounds = phase === 'poule' && typeof pouleTab === 'number'
    ? [pouleTab]
    : []

  const todoMatches = MATCHES.filter((m) => {
    if (m.phase === 'knockout') return false
    const pred = predictions[m.id]
    return !pred || pred.toto === null || pred.uitslag === null
  })

  const visibleKoMatches = phase === 'knockout'
    ? KO_FILTERS[koTab].rounds.flatMap((r) => koRounds[r] ?? [])
    : []

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Wedstrijden</h1>
      <p className="font-accent font-light text-white text-xs mb-3 text-center">kies tokens, toto en uitslag</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-white font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      {/* Tabs */}
      {phase === 'poule' ? (
        <div className="flex gap-1.5 mb-4 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
          {POULE_FILTERS.map(({ label, value }) => (
            <button
              key={String(value)}
              onClick={() => setPouleTab(value)}
              className={[
                'flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all',
                pouleTab === value ? 'bg-[#FF6B00] text-white' : 'text-white hover:text-[#FF6B00]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-1.5 mb-4 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
          {KO_FILTERS.map(({ label }, i) => (
            <button
              key={label}
              onClick={() => setKoTab(i)}
              className={[
                'flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all',
                koTab === i ? 'bg-[#FF6B00] text-white' : 'text-white hover:text-[#FF6B00]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {showStandings ? (
        <StandingsPanel />
      ) : showTodo ? (
        <>
          {!isLoaded ? (
            <SkeletonList count={4} />
          ) : todoMatches.length === 0 ? (
            <p className="text-center font-heading text-sm text-[#aaa] uppercase tracking-widest mt-8">
              Alles ingevuld ✓
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {todoMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </>
      ) : phase === 'poule' ? (
        <>
          {!isLoaded ? (
            <SkeletonList count={6} />
          ) : (
            visiblePouleRounds.map((round) => (
              <div key={round} className="mb-6">
                <div className="flex flex-col gap-2">
                  {(pouleRounds[round] ?? []).map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          {!isLoaded ? (
            <SkeletonList count={4} />
          ) : (
            <div className="flex flex-col gap-2">
              {visibleKoMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
