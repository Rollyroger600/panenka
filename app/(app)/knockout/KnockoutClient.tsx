'use client'
import { useState, useMemo } from 'react'
import { useKnockoutPicks } from '@/hooks/useKnockoutPicks'
import { usePredictions } from '@/hooks/usePredictions'
import { useDeadline } from '@/hooks/useDeadline'
import { useKoMatchBudget } from '@/hooks/useTokenBudget'
import { useKoMatchLocks } from '@/hooks/useKoMatchDeadline'
import { Ronde32Section } from '@/components/knockout/Ronde32Section'
import { RoundSection } from '@/components/knockout/RoundSection'
import { KoMatchCard } from '@/components/matches/KoMatchCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ScheduleView } from '@/components/knockout/ScheduleView'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { MATCHES } from '@/lib/data/matches'
import type { KoRound } from '@/lib/data/matches'
import type { MatchResult } from '@/lib/scoring'
import type { KoMatchTeams } from '@/app/actions/admin'
import { APP_PHASE } from '@/lib/config'

type MainTab = 'landen' | 'wedstrijden'

const LANDEN_TABS = [
  { id: 'ronde32', label: 'R 32' },
  { id: 'r16',    label: 'R 16' },
  { id: 'r8',     label: '1/4' },
  { id: 'r4',     label: '1/2' },
  { id: 'finale', label: 'Fin' },
  { id: 'winner', label: 'Win' },
]

const KO_MATCH_FILTERS: { label: string; rounds: KoRound[] }[] = [
  { label: 'R 32', rounds: ['rv32'] },
  { label: 'R 16', rounds: ['rv16'] },
  { label: '1/4',  rounds: ['kf'] },
  { label: '1/2',  rounds: ['hf'] },
  { label: 'FIN',  rounds: ['brons', 'finale'] },
]

const NON32_ROUNDS = KNOCKOUT_ROUNDS.filter((r) => r.uiTab !== 'ronde32')

function groupKoMatches() {
  const rounds: Partial<Record<KoRound, typeof MATCHES>> = {}
  for (const m of MATCHES) {
    if (m.phase !== 'knockout' || !m.koRound) continue
    rounds[m.koRound] ??= []
    rounds[m.koRound]!.push(m)
  }
  return rounds
}

function formatKickoffTime(kickoff: string): string {
  const d = new Date(kickoff)
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
}

function formatKickoffDate(kickoff: string): string {
  const d = new Date(kickoff)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
}

interface Props {
  koResults: Record<string, string[]>
  results: Record<number, MatchResult>
  koMatchTeams: KoMatchTeams
  oranjeTokens: number
}

export function KnockoutClient({ koResults, results, koMatchTeams, oranjeTokens }: Props) {
  const { isLoaded: koPicksLoaded } = useKnockoutPicks()
  const { isLoaded: predsLoaded } = usePredictions()
  const { isPast } = useDeadline()
  const landenReadOnly = APP_PHASE >= 2

  const availableMatchCount = Object.keys(koMatchTeams).length
  const { remaining: koRemaining } = useKoMatchBudget(oranjeTokens, availableMatchCount)
  const locks = useKoMatchLocks(koMatchTeams)

  const [mainTab, setMainTab] = useState<MainTab>('wedstrijden')
  const [landenTab, setLandenTab] = useState('ronde32')
  const [matchTab, setMatchTab] = useState(0)

  const koRounds = useMemo(groupKoMatches, [])
  const activeLandenRound = NON32_ROUNDS.find((r) => r.uiTab === landenTab)

  const visibleKoMatches = KO_MATCH_FILTERS[matchTab].rounds.flatMap((r) => koRounds[r] ?? [])

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Knockout</h1>

      {/* Hoofd-tabs: Landen / Wedstrijden */}
      {APP_PHASE >= 3 && (
        <div className="flex gap-2 mb-3 px-1">
          {([
            { id: 'wedstrijden' as MainTab, label: 'Wedstrijden' },
            { id: 'landen' as MainTab, label: 'Landen' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl font-heading text-sm font-bold tracking-widest uppercase transition-all ${
                mainTab === tab.id
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#888] hover:text-white'
              }`}
              style={mainTab !== tab.id ? { background: 'rgba(22,22,22,0.82)' } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── WEDSTRIJDEN TAB ──────────────────────────────────────────── */}
      {mainTab === 'wedstrijden' && APP_PHASE >= 3 && (
        <>
          <p className="font-accent font-light text-white text-xs mb-3 text-center">
            Voorspel de KO-wedstrijden · stand na 90 min
          </p>

          {/* Ronde tabs */}
          <div className="flex gap-1.5 mb-4 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
            {KO_MATCH_FILTERS.map(({ label }, i) => (
              <button
                key={label}
                onClick={() => setMatchTab(i)}
                className={[
                  'flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all',
                  matchTab === i ? 'bg-[#FF6B00] text-white' : 'text-white hover:text-[#FF6B00]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {!predsLoaded ? (
            <SkeletonList count={4} />
          ) : (
            <div className="flex flex-col gap-2">
              {visibleKoMatches.map((match) => {
                const teams = koMatchTeams[match.id]
                if (!teams) {
                  return (
                    <div key={match.id} className="rounded-xl border border-[#2a2a2a] overflow-hidden opacity-50" style={{ background: 'rgba(22,22,22,0.82)' }}>
                      <div className="relative flex flex-col items-center px-3 py-4" style={{ background: 'rgba(10,10,10,0.75)' }}>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
                          style={{ background: 'rgba(37,37,37,0.8)' }}>
                          #{match.id}
                        </div>
                        <span className="font-heading text-sm" style={{ color: '#555' }}>Teams nog niet bekend</span>
                        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: '#444' }}>{match.date}</p>
                      </div>
                    </div>
                  )
                }
                const isLocked = locks[match.id] ?? true
                return (
                  <KoMatchCard
                    key={match.id}
                    matchId={match.id}
                    home={teams.home}
                    away={teams.away}
                    date={teams.kickoff ? formatKickoffDate(teams.kickoff) : match.date}
                    time={teams.kickoff ? formatKickoffTime(teams.kickoff) : undefined}
                    remainingBudget={koRemaining}
                    readOnly={isLocked}
                    result={results[match.id]}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── LANDEN TAB ───────────────────────────────────────────────── */}
      {(mainTab === 'landen' || APP_PHASE < 3) && (
        <>
          <p className="font-accent font-light text-white text-xs mb-4 text-center">
            {landenReadOnly ? 'Jouw doorgaande landen' : 'Voorspel welke landen doorgaan per ronde'}
          </p>

          {/* Round tabs */}
          <div className="flex gap-1.5 mb-5 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
            {LANDEN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLandenTab(tab.id)}
                className={`flex-1 py-2 rounded-lg font-heading text-xs font-bold tracking-widest uppercase transition-all ${
                  landenTab === tab.id
                    ? 'bg-[#FF6B00] text-white'
                    : 'text-white hover:text-[#FF6B00]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {landenTab !== 'ronde32' && <ScheduleView activeTab={landenTab} />}

          {!koPicksLoaded ? (
            <SkeletonList count={4} />
          ) : (
            <>
              {landenTab === 'ronde32' && <Ronde32Section readOnly={landenReadOnly} koResults={koResults} />}
              {activeLandenRound && <RoundSection round={activeLandenRound} readOnly={landenReadOnly} koResults={koResults} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
