'use client'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import type { Match } from '@/lib/data/matches'
import type { NedOpp, OranjeAnswer } from '@/store/gameStore'

const TOGGLE_QUESTIONS: { key: keyof OranjeAnswer; label: string }[] = [
  { key: 'q1', label: 'Eerste ingooi' },
  { key: 'q2', label: 'Eerste corner' },
  { key: 'q3', label: 'Eerste vrije trap' },
  { key: 'q4', label: 'Eerste kaart' },
]

const PLAYER_QUESTIONS: { key: keyof OranjeAnswer; label: string }[] = [
  { key: 'q5', label: 'Meeste kilometers' },
  { key: 'q6', label: 'Meeste passes' },
  { key: 'q7', label: 'Meeste tackles' },
  { key: 'q8', label: 'Meeste schoten op doel' },
  { key: 'q9', label: 'Buitenspel vlag' },
]

interface Props {
  match: Match
  nedPlayers: string[]
}

export function OranjeMatchCard({ match, nedPlayers }: Props) {
  const { oranjeVoorspelling, setOranjeAnswer } = useGameStore()
  const answer = oranjeVoorspelling[match.id] ?? {}

  const isNedHome = match.home === 'Nederland'
  const opp = isNedHome ? match.away : match.home
  const oppLabel = opp.slice(0, 3).toUpperCase()

  function set(partial: Partial<OranjeAnswer>) {
    setOranjeAnswer(match.id, partial)
  }

  const filled = Object.values(answer).filter((v) => v !== null && v !== undefined).length

  return (
    <div className="rounded-xl border border-[#FF6B00]/30 overflow-hidden mb-4" style={{ background: 'rgba(22,22,22,0.82)' }}>
      {/* Match header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <FlagImage country="Nederland" size={22} />
          <span className="text-base font-bold text-white">Nederland</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#888] uppercase tracking-widest">Poule {match.poule}</span>
          <span className="text-xs text-[#FF6B00] font-bold">{match.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">{opp}</span>
          <FlagImage country={opp} size={22} />
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] text-[#555] uppercase tracking-widest">Bonus voorspellingen</span>
        <span className="text-[10px] font-bold text-[#FF6B00]">{filled} / 9</span>
      </div>

      {/* Toggle questions Q1–Q4 */}
      <div className="px-4 pb-2 flex flex-col gap-2">
        {TOGGLE_QUESTIONS.map(({ key, label }) => {
          const val = answer[key] as NedOpp | null
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-[#888] flex-1">{label}</span>
              <div className="flex gap-1">
                {(['NED', 'OPP'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => set({ [key]: val === opt ? null : opt })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      val === opt
                        ? opt === 'NED'
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-[#252525] text-white border border-[#555]'
                        : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
                    }`}
                  >
                    {opt === 'OPP' ? oppLabel : 'NED'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[#2a2a2a]" />

      {/* Player questions Q5–Q9 */}
      <div className="px-4 py-2 flex flex-col gap-2">
        {PLAYER_QUESTIONS.map(({ key, label }) => {
          const val = answer[key] as string | null
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#888] flex-1 min-w-0">{label}</span>
              <select
                value={val ?? ''}
                onChange={(e) => set({ [key]: e.target.value || null })}
                className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 max-w-[140px] appearance-none"
              >
                <option value="">Kies speler</option>
                {nedPlayers.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
