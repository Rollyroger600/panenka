'use client'
import { useState, useMemo } from 'react'
import { usePredictions } from '@/hooks/usePredictions'
import { useOranjeVoorspelling } from '@/hooks/useOranjeVoorspelling'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { useFantasyXV } from '@/hooks/useFantasyXV'
import { useTokenBudget } from '@/hooks/useTokenBudget'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore, ALL_SLOTS } from '@/store/gameStore'
import { confirmPredictions } from '@/app/actions/overzicht'
import { SkeletonList } from '@/components/ui/Skeleton'

const NED_MATCH_IDS = [10, 33, 58]
const ORANJE_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'] as const

interface Props {
  initials: string
  participantName: string
}

function StatRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0
  const done = value === total
  const barColor = done ? '#FF6B00' : value > 0 ? '#FFC49A' : 'transparent'
  return (
    <div className="py-3 border-b border-[#1a1a1a] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#ccc]">{label}</span>
        <span className={`text-sm font-bold ${done ? 'text-[#FF6B00]' : 'text-white'}`}>
          {done ? '✓ ' : ''}{value} <span className="text-[#444]">/ {total}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-[#2a2a2a]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

export function OverzichtClient({ initials, participantName }: Props) {
  const { isLoaded: pouleLoaded } = usePredictions()
  const { isLoaded: oranjeLoaded } = useOranjeVoorspelling()
  const { isLoaded: koLoaded } = useKnockoutPicks()
  const { isLoaded: fantasyLoaded } = useFantasyXV(participantName)
  const { isPast, isVraagPast } = useDeadline()

  const { total, used, remaining } = useTokenBudget(initials)
  const { predictions, oranjeVoorspelling, knockoutPicks, fantasySquad } = useGameStore()

  const [showSuccess, setShowSuccess] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const isLoaded = pouleLoaded && oranjeLoaded && koLoaded && fantasyLoaded

  const stats = useMemo(() => {
    const poule = Object.values(predictions).filter((p) => p.tokens !== null).length
    const oranje = NED_MATCH_IDS.reduce((sum, id) => {
      const ans = oranjeVoorspelling[id]
      if (!ans) return sum
      return sum + ORANJE_KEYS.filter((k) => ans[k] !== null).length
    }, 0)
    const ko = Object.values(knockoutPicks).filter((s) => s.country).length
    const fantasy = ALL_SLOTS.filter((k) => fantasySquad[k]).length
    return { poule, oranje, ko, fantasy }
  }, [predictions, oranjeVoorspelling, knockoutPicks, fantasySquad])

  const oranjeTotal = isVraagPast ? 45 : 3
  const isComplete =
    stats.poule === 72 &&
    stats.oranje === oranjeTotal &&
    stats.ko === 63 &&
    stats.fantasy === 15

  async function handleConfirm() {
    setConfirming(true)
    await confirmPredictions()
    setConfirming(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Overzicht</h1>
      <p className="font-accent font-light text-white text-xs mb-5 text-center">Jouw inzending, {participantName}</p>

      {!isLoaded ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <div className="rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] px-4 mb-4">
            <StatRow label="Poulewedstrijden" value={stats.poule} total={72} />
            <StatRow label="Oranje vragen" value={stats.oranje} total={oranjeTotal} />
            <StatRow label="Knockout landen" value={stats.ko} total={63} />
            <StatRow label="Fantasy spelers" value={stats.fantasy} total={15} />
          </div>

          <div className="rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] p-4 mb-5">
            <div className="text-xs text-[#888] uppercase tracking-widest mb-3">Token budget</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#111] rounded-lg p-2">
                <div className="text-[10px] text-[#555] uppercase mb-1">Basis</div>
                <div className="font-heading text-lg font-bold text-white">335</div>
              </div>
              <div className="bg-[#111] rounded-lg p-2">
                <div className="text-[10px] text-[#555] uppercase mb-1">Bonus</div>
                <div className="font-heading text-lg font-bold text-[#FF6B00]">+{total - 335}</div>
              </div>
              <div className="bg-[#111] rounded-lg p-2">
                <div className="text-[10px] text-[#555] uppercase mb-1">Gebruikt</div>
                <div className="font-heading text-lg font-bold text-white">{used}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-[#888]">Resterend</span>
              <span className={`font-heading text-xl font-bold ${remaining < 0 ? 'text-[#E74C3C]' : 'text-[#FF6B00]'}`}>
                {remaining < 0 ? '⚠ ' : ''}{remaining} tokens
              </span>
            </div>
          </div>

          {isPast ? (
            <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-4 text-center">
              <div className="text-[#555] text-2xl mb-1">🔒</div>
              <div className="text-[#555] font-bold">Deadline verstreken</div>
              <div className="text-[#444] text-xs mt-1">Geen wijzigingen meer mogelijk</div>
            </div>
          ) : (
            <>
              {showSuccess && (
                <div className="rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 p-3 text-center mb-3">
                  <div className="text-[#FF6B00] font-bold text-sm">✓ Wijzigingen ontvangen!</div>
                </div>
              )}
              <button
                onClick={handleConfirm}
                disabled={confirming || !isComplete}
                className="w-full py-4 rounded-xl font-bold text-base tracking-widest uppercase bg-[#FF6B00] text-white hover:bg-[#FF8C33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {confirming ? 'Bezig…' : 'Bevestig inzending →'}
              </button>
              {!isComplete && (
                <p className="text-center text-[#888] text-xs mt-2">
                  Vul alle onderdelen volledig in om te kunnen bevestigen
                </p>
              )}
            </>
          )}

          {!isPast && (
            <>
              <p className="text-center text-[#888] text-xs mt-3">
                Je kunt altijd nog wijzigingen maken
              </p>
              <div className="flex justify-center mt-3">
                <a
                  href="/poulefase"
                  className="text-sm text-[#FF6B00] hover:text-[#FF8C33] font-bold transition-colors"
                >
                  ← Nog aanpassen
                </a>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
