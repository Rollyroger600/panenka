'use client'
import { useMemo } from 'react'
import { useOranjeVoorspelling } from '@/hooks/useOranjeVoorspelling'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore } from '@/store/gameStore'
import { OranjeMatchCard } from '@/components/oranje/OranjeMatchCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'
import { WK_PLAYERS } from '@/lib/data/players'

const NED_MATCH_IDS = [10, 33, 58]
const NED_MATCHES = MATCHES.filter((m) => NED_MATCH_IDS.includes(m.id))

export function OranjeClient() {
  const { isLoaded } = useOranjeVoorspelling()
  const { isPast } = useDeadline()
  const oranjeVoorspelling = useGameStore((s) => s.oranjeVoorspelling)

  const nedPlayers = useMemo(
    () =>
      WK_PLAYERS.filter((p) => p.country === 'Nederland')
        .sort((a, b) => b.overall - a.overall)
        .map((p) => p.name),
    [],
  )

  const totalFilled = Object.values(oranjeVoorspelling).reduce(
    (sum, ans) => sum + Object.values(ans).filter((v) => v !== null).length,
    0,
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1 text-center">Oranje Voorspelling</h1>
      <p className="text-white text-sm mb-1 text-center">9 bonus vragen per wedstrijd · geen tokens</p>
      <p className="text-[#FF6B00] text-xs font-bold mb-5">
        {totalFilled} / 27 vragen ingevuld
      </p>

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      {!isLoaded ? (
        <SkeletonList count={3} />
      ) : (
        NED_MATCHES.map((match) => (
          <OranjeMatchCard key={match.id} match={match} nedPlayers={nedPlayers} />
        ))
      )}
    </div>
  )
}
