'use client'
import { useState } from 'react'
import { usePredictions } from '@/hooks/usePredictions'
import { useDeadline } from '@/hooks/useDeadline'
import { TokenBanner } from '@/components/ui/TokenBanner'
import { MatchCard } from '@/components/matches/MatchCard'
import { StandingsPanel } from '@/components/matches/StandingsPanel'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'

interface Props { initials: string }

function groupMatches() {
  const rounds: Record<number, typeof MATCHES> = {}
  for (const m of MATCHES) {
    rounds[m.round] ??= []
    rounds[m.round].push(m)
  }
  return rounds
}

const ROUND_LABEL: Record<number, string> = { 1: 'Ronde 1', 2: 'Ronde 2', 3: 'Ronde 3' }

type ActiveFilter = number | 'standen' | null

const FILTERS: { label: string; value: ActiveFilter }[] = [
  { label: 'Alle',    value: null },
  { label: 'Ronde 1', value: 1 },
  { label: 'Ronde 2', value: 2 },
  { label: 'Ronde 3', value: 3 },
  { label: 'Standen', value: 'standen' },
]

export function PoulefaseClient({ initials }: Props) {
  const { isLoaded } = usePredictions()
  const { isPast } = useDeadline()
  const rounds = groupMatches()
  const [active, setActive] = useState<ActiveFilter>(null)

  const showStandings = active === 'standen'
  const visibleRounds = !showStandings
    ? (typeof active === 'number' ? [active] : [1, 2, 3])
    : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1 text-center">Poulewedstrijden</h1>
      <p className="text-white text-sm mb-4 text-center">72 wedstrijden · kies tokens, toto en uitslag</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-white font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 bg-[#161616] rounded-xl p-1">
        {FILTERS.map(({ label, value }) => (
          <button
            key={String(value)}
            onClick={() => setActive(value)}
            className={[
              'flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all',
              active === value
                ? 'bg-[#FF6B00] text-white'
                : 'text-white hover:text-[#FF6B00]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {showStandings ? (
        <StandingsPanel />
      ) : (
        <>
          <TokenBanner initials={initials} />

          {!isLoaded ? (
            <SkeletonList count={6} />
          ) : (
            visibleRounds.map((round) => (
              <div key={round} className="mb-6">
                <h2 className="text-xs font-bold text-[#FF6B00] uppercase tracking-widest mb-3">
                  {ROUND_LABEL[round]}
                </h2>
                <div className="flex flex-col gap-2">
                  {(rounds[round] ?? []).map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
