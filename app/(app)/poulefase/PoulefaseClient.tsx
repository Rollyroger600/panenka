'use client'
import { usePredictions } from '@/hooks/usePredictions'
import { useDeadline } from '@/hooks/useDeadline'
import { TokenBanner } from '@/components/ui/TokenBanner'
import { MatchCard } from '@/components/matches/MatchCard'
import { StandingsPanel } from '@/components/matches/StandingsPanel'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'

interface Props {
  initials: string
}

function groupMatches() {
  const rounds: Record<number, typeof MATCHES> = {}
  for (const m of MATCHES) {
    rounds[m.round] ??= []
    rounds[m.round].push(m)
  }
  return rounds
}

const ROUND_LABEL: Record<number, string> = { 1: 'Ronde 1', 2: 'Ronde 2', 3: 'Ronde 3' }

export function PoulefaseClient({ initials }: Props) {
  const { isLoaded } = usePredictions()
  const { isPast } = useDeadline()
  const rounds = groupMatches()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Poulewedstrijden</h1>
      <p className="text-[#888] text-sm mb-4">72 wedstrijden · kies tokens, toto en uitslag</p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      <TokenBanner initials={initials} />
      <StandingsPanel />

      {!isLoaded ? (
        <SkeletonList count={6} />
      ) : (
        [1, 2, 3].map((round) => (
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
    </div>
  )
}
