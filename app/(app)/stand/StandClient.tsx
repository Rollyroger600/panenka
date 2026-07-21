'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadScoresForGroup } from '@/app/actions/scores'
import { loadPotHistoryForGroup, loadScoreHistoryForGroup } from '@/app/actions/history'
import type { MatchdayHistoryPoint } from '@/app/actions/history'
import { RankList } from '@/components/leaderboard/RankList'
import { ProgressChart } from '@/components/matchday/charts/ProgressChart'
import { PotChart } from '@/components/matchday/charts/PotChart'
import { MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import { DUAL_GROUP_INITIALS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { ParticipantScore } from '@/app/leaderboard/types'
import type { MatchdayScoreRow } from '@/lib/matchday'
import type { PotPoint, ScoreHistoryPoint } from '@/lib/types/matchday'

type Tab = 'stand' | 'inzet' | 'pot'
type StandView = 'totaal' | 'poule' | 'fxv' | 'kowed' | 'landen' | 'toto' | 'uitsl'

const STAND_VIEWS: { label: string; value: StandView; scoreKey: keyof ParticipantScore; scoreLabel: string; historyKey: keyof MatchdayScoreRow }[] = [
  { label: 'Totaal', value: 'totaal', scoreKey: 'total',         scoreLabel: 'Tot.',   historyKey: 'total'            },
  { label: 'Poule',  value: 'poule',  scoreKey: 'poulefase',     scoreLabel: 'Poule',  historyKey: 'poulefase'        },
  { label: 'FXV',    value: 'fxv',    scoreKey: 'fantasy',       scoreLabel: 'FXV',    historyKey: 'fantasy'          },
  { label: 'KO Wed', value: 'kowed',  scoreKey: 'koWedstrijden', scoreLabel: 'KO',     historyKey: 'kofase'           },
  { label: 'Landen', value: 'landen', scoreKey: 'knockout',      scoreLabel: 'Landen', historyKey: 'doorgaandeLanden' },
  { label: 'TOTO',   value: 'toto',   scoreKey: 'totoCorrect',   scoreLabel: 'TOTO',   historyKey: 'totoGoed'         },
  { label: 'UITSL',  value: 'uitsl',  scoreKey: 'uitslagCorrect',scoreLabel: 'UITSL',  historyKey: 'uitslagGoed'      },
]

// Reshape de ruwe per-matchday rows naar de Record<initials, waarde> vorm die ProgressChart verwacht
function toScoreHistory(history: MatchdayHistoryPoint[], key: keyof MatchdayScoreRow): ScoreHistoryPoint[] {
  return history.map((h) => ({
    matchdayId: h.matchdayId,
    scores: Object.fromEntries(h.rows.map((r) => [r.initials, r[key] as number])),
  }))
}

interface Weddenschap {
  weddenschap: string
  inzet: string
  quotering: number
  maxWinst: string
  gewonnen?: boolean
}

interface PotRegel {
  datum: string
  omschrijving: string
  bedrag: number  // positief = +, negatief = -
}

const POT_REGELS: Record<string, PotRegel[]> = {
  og: [
    // Nieuwste bovenaan
    { datum: '2026-07-18', omschrijving: "Toto's en uitslagen matchday 27", bedrag: -4.50 },
    { datum: '2026-07-13', omschrijving: "Toto's en uitslagen matchday 26", bedrag: -20.00 },
    { datum: '2026-07-12', omschrijving: 'Winst Matchday 25', bedrag: 12.69 },
    { datum: '2026-07-07', omschrijving: "Toto's en uitslagen matchday 25", bedrag: -22.00 },
    { datum: '2026-07-06', omschrijving: "Toto's en uitslagen matchday 24", bedrag: -15.00 },
    { datum: '2026-07-06', omschrijving: 'Winst Matchday 23', bedrag: 25.00 },
    { datum: '2026-07-03', omschrijving: "Toto's en uitslagen matchday 23", bedrag: -12.50 },
    { datum: '2026-07-01', omschrijving: "Toto's en uitslagen matchday 22", bedrag: -10 },
    { datum: '2026-07-01', omschrijving: 'Winst Matchday 21', bedrag: 20.50 },
    { datum: '2026-07-01', omschrijving: "Toto's en uitslagen matchday 21", bedrag: -5 },
    { datum: '2026-07-01', omschrijving: 'Winst Matchday 20', bedrag: 11.41 },
    { datum: '2026-07-01', omschrijving: "Toto's en uitslagen matchday 20", bedrag: -5 },
    { datum: '2026-06-29', omschrijving: "Toto's en uitslagen matchday 19", bedrag: -10 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 17", bedrag: -5 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 16", bedrag: -5 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 15", bedrag: -5 },
    { datum: '2026-06-25', omschrijving: 'Winst Matchday 14', bedrag: 8.00 },
    { datum: '2026-06-25', omschrijving: "Toto's en uitslagen matchday 14", bedrag: -5 },
    { datum: '2026-06-24', omschrijving: "Toto's en uitslagen matchday 13", bedrag: -5 },
    { datum: '2026-06-23', omschrijving: "Toto's en uitslagen matchday 12", bedrag: -5 },
    { datum: '2026-06-22', omschrijving: "Toto's en uitslagen matchday 11", bedrag: -5 },
    { datum: '2026-06-21', omschrijving: "Toto's en uitslagen matchday 10", bedrag: -5 },
    { datum: '2026-06-20', omschrijving: "Toto's en uitslagen matchday 09", bedrag: -5 },
    { datum: '2026-06-19', omschrijving: "Toto's en uitslagen matchday 08", bedrag: -5 },
    { datum: '2026-06-18', omschrijving: "Toto's en uitslagen matchday 07", bedrag: -5 },
    { datum: '2026-06-18', omschrijving: 'Winst Matchday 06', bedrag: 6.40 },
    { datum: '2026-06-17', omschrijving: "Toto's en uitslagen matchday 06", bedrag: -5 },
    { datum: '2026-06-17', omschrijving: 'Winst Matchday 05', bedrag: 3.45 },
    { datum: '2026-06-16', omschrijving: "Toto's en uitslagen matchday 05", bedrag: -5 },
    { datum: '2026-06-16', omschrijving: 'Winst Matchday 04', bedrag: 7.00 },
    { datum: '2026-06-15', omschrijving: "Toto's en uitslagen matchday 04", bedrag: -5 },
    { datum: '2026-06-14', omschrijving: "Toto's en uitslagen matchday 03", bedrag: -5 },
    { datum: '2026-06-14', omschrijving: 'Winst welkomstbonus', bedrag: 100 },
    { datum: '2026-06-14', omschrijving: 'Winst Matchday 02', bedrag: 19.50 },
    { datum: '2026-06-13', omschrijving: "Toto's en uitslagen matchday 02", bedrag: -5 },
    { datum: '2026-06-13', omschrijving: 'Winst Matchday 01', bedrag: 9.50 },
    { datum: '2026-06-11', omschrijving: 'Toernooi weddenschappen', bedrag: -20 },
    { datum: '2026-06-11', omschrijving: "Toto's en uitslagen matchday 01", bedrag: -5 },
    { datum: '2026-06-11', omschrijving: 'Welkomstbonus inzet', bedrag: -1 },
    { datum: '2026-06-10', omschrijving: 'Beginbedrag', bedrag: 300 },
  ],
  asc: [
    // Nieuwste bovenaan
    { datum: '2026-07-20', omschrijving: 'Winst Toernooi weddenschappen', bedrag: 27.50 },
    { datum: '2026-07-18', omschrijving: "Toto's en uitslagen matchday 27", bedrag: -2.50 },
    { datum: '2026-07-13', omschrijving: "Toto's en uitslagen matchday 26", bedrag: -20.00 },
    { datum: '2026-07-07', omschrijving: "Toto's en uitslagen matchday 25", bedrag: -24.50 },
    { datum: '2026-07-06', omschrijving: "Toto's en uitslagen matchday 24", bedrag: -17.00 },
    { datum: '2026-07-06', omschrijving: "Winst Matchday 23", bedrag: 44.38 },
    { datum: '2026-07-03', omschrijving: "Toto's en uitslagen matchday 23", bedrag: -22.50 },
    { datum: '2026-07-02', omschrijving: "Toto's en uitslagen matchday 22", bedrag: -20 },
    { datum: '2026-07-01', omschrijving: "Winst Matchday 21", bedrag: 50.94 },
    { datum: '2026-07-01', omschrijving: "Toto's en uitslagen matchday 21", bedrag: -15 },
    { datum: '2026-07-01', omschrijving: 'Winst Matchday 20', bedrag: 45.63 },
    { datum: '2026-07-01', omschrijving: "Toto's en uitslagen matchday 20", bedrag: -10 },
    { datum: '2026-06-29', omschrijving: "Toto's en uitslagen matchday 19", bedrag: -5 },
    { datum: '2026-06-28', omschrijving: 'Winst Matchday 18', bedrag: 15.87 },
    { datum: '2026-06-28', omschrijving: "Toto's en uitslagen matchday 18", bedrag: -5 },
    { datum: '2026-06-26', omschrijving: 'Winst Matchday 17', bedrag: 6.10 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 17", bedrag: -5 },
    { datum: '2026-06-26', omschrijving: 'Winst Matchday 16', bedrag: 11.14 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 16", bedrag: -5 },
    { datum: '2026-06-26', omschrijving: 'Winst Matchday 15', bedrag: 49.15 },
    { datum: '2026-06-26', omschrijving: "Toto's en uitslagen matchday 15", bedrag: -5 },
    { datum: '2026-06-25', omschrijving: "Toto's en uitslagen matchday 14", bedrag: -5 },
    { datum: '2026-06-24', omschrijving: 'Winst Matchday 13', bedrag: 5.24 },
    { datum: '2026-06-24', omschrijving: "Toto's en uitslagen matchday 13", bedrag: -5 },
    { datum: '2026-06-23', omschrijving: 'Winst Matchday 12', bedrag: 5.50 },
    { datum: '2026-06-23', omschrijving: "Toto's en uitslagen matchday 12", bedrag: -5 },
    { datum: '2026-06-22', omschrijving: 'Winst Matchday 11', bedrag: 12 },
    { datum: '2026-06-22', omschrijving: "Toto's en uitslagen matchday 11", bedrag: -5 },
    { datum: '2026-06-21', omschrijving: "Toto's en uitslagen matchday 10", bedrag: -5 },
    { datum: '2026-06-20', omschrijving: "Toto's en uitslagen matchday 09", bedrag: -5 },
    { datum: '2026-06-19', omschrijving: "Toto's en uitslagen matchday 08", bedrag: -5 },
    { datum: '2026-06-18', omschrijving: "Toto's en uitslagen matchday 07", bedrag: -5 },
    { datum: '2026-06-17', omschrijving: "Toto's en uitslagen matchday 06", bedrag: -5 },
    { datum: '2026-06-17', omschrijving: 'Winst Matchday 05', bedrag: 3.52 },
    { datum: '2026-06-16', omschrijving: "Toto's en uitslagen matchday 05", bedrag: -5 },
    { datum: '2026-06-15', omschrijving: "Toto's en uitslagen matchday 04", bedrag: -5 },
    { datum: '2026-06-15', omschrijving: 'Winst welkomstbonus', bedrag: 100 },
    { datum: '2026-06-14', omschrijving: "Toto's en uitslagen matchday 03", bedrag: -5 },
    { datum: '2026-06-14', omschrijving: 'Winst Matchday 02', bedrag: 6.75 },
    { datum: '2026-06-13', omschrijving: "Toto's en uitslagen matchday 02", bedrag: -5 },
    { datum: '2026-06-11', omschrijving: 'Toernooi weddenschappen', bedrag: -19 },
    { datum: '2026-06-11', omschrijving: "Toto's en uitslagen matchday 01", bedrag: -5 },
    { datum: '2026-06-11', omschrijving: 'Welkomstbonus inzet', bedrag: -1 },
    { datum: '2026-06-10', omschrijving: 'Beginbedrag', bedrag: 280 },
  ],
}

const WEDDENSCHAPPEN: Record<string, Weddenschap[]> = {
  og: [
    { weddenschap: 'Brazilië scoort tegen Marokko', inzet: '€ 1,00', quotering: 100, maxWinst: '€ 100,00', gewonnen: true },
    { weddenschap: 'Frankrijk winnaar WK', inzet: '€ 5,00', quotering: 6, maxWinst: '€ 30,00', gewonnen: false },
    { weddenschap: 'Brazilië winnaar WK', inzet: '€ 5,00', quotering: 10, maxWinst: '€ 50,00', gewonnen: false },
    { weddenschap: 'Nederland winnaar WK', inzet: '€ 5,00', quotering: 19, maxWinst: '€ 95,00', gewonnen: false },
    { weddenschap: 'Kane Topscoorder WK', inzet: '€ 3,00', quotering: 7, maxWinst: '€ 21,00', gewonnen: false },
    { weddenschap: 'Haaland Topscoorder WK', inzet: '€ 2,00', quotering: 15, maxWinst: '€ 30,00', gewonnen: false },
  ],
  asc: [
    { weddenschap: 'Duitsland wint van Curacao', inzet: '€ 1,00', quotering: 100, maxWinst: '€ 100,00', gewonnen: true },
    { weddenschap: 'Spanje winnaar WK', inzet: '€ 5,00', quotering: 5.5, maxWinst: '€ 27,50', gewonnen: true },
    { weddenschap: 'Frankrijk winnaar WK', inzet: '€ 5,00', quotering: 6, maxWinst: '€ 30,00', gewonnen: false },
    { weddenschap: 'Nederland winnaar WK', inzet: '€ 1,00', quotering: 19, maxWinst: '€ 19,00', gewonnen: false },
    { weddenschap: 'Kane topscoorder WK', inzet: '€ 3,00', quotering: 7, maxWinst: '€ 21,00', gewonnen: false },
    { weddenschap: 'Messi topscoorder WK', inzet: '€ 2,00', quotering: 13, maxWinst: '€ 26,00', gewonnen: false },
    { weddenschap: 'Ødegaard assist koning WK', inzet: '€ 1,00', quotering: 51, maxWinst: '€ 51,00', gewonnen: false },
    { weddenschap: 'Ferran assist koning WK', inzet: '€ 1,00', quotering: 41, maxWinst: '€ 41,00', gewonnen: false },
    { weddenschap: 'Spanje wint WK en Oyarzabal topscoorder', inzet: '€ 1,00', quotering: 34, maxWinst: '€ 34,00', gewonnen: false },
  ],
}

const TABS: { label: string; value: Tab }[] = [
  { label: 'Stand',  value: 'stand' },
  { label: 'Inzet',  value: 'inzet' },
  { label: 'Pot',    value: 'pot'   },
]

interface Props {
  mijnInitials: string
  defaultGroup: GroupId
}

type RanksByView = Partial<Record<StandView, Record<string, number>>>

const ranksStorageKey = (group: GroupId) => `panenka:stand:ranks:${group}`

function loadStoredRanks(group: GroupId): RanksByView {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(ranksStorageKey(group))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredRanks(group: GroupId, ranks: RanksByView) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ranksStorageKey(group), JSON.stringify(ranks))
  } catch {
    // localStorage kan ontbreken/vol zijn — trend pijltjes zijn dan niet kritiek
  }
}

export function StandClient({ mijnInitials, defaultGroup }: Props) {
  const isDualGroup = DUAL_GROUP_INITIALS.includes(mijnInitials.toUpperCase())
  const [activeGroup, setActiveGroup] = useState<GroupId>(defaultGroup)
  const [activeTab, setActiveTab] = useState<Tab>('stand')
  const [standView, setStandView] = useState<StandView>('totaal')
  const [refreshActive, setRefreshActive] = useState(false)
  const [scores, setScores] = useState<ParticipantScore[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [headerToggleEl, setHeaderToggleEl] = useState<Element | null>(null)
  const prevRanksRef = useRef<RanksByView>({})
  const lastLoadedGroupRef = useRef<GroupId | null>(null)
  const [allDeltas, setAllDeltas] = useState<RanksByView>({})
  const [scoreHistory, setScoreHistory] = useState<MatchdayHistoryPoint[]>([])
  const [potHistory, setPotHistory] = useState<PotPoint[]>([])

  useEffect(() => {
    setHeaderToggleEl(document.getElementById('header-chat-toggle'))
  }, [])

  const load = useCallback((group: GroupId) => {
    setIsLoaded(false)
    Promise.all([
      loadScoresForGroup(group),
      loadScoreHistoryForGroup(group),
      loadPotHistoryForGroup(group),
    ]).then(([newScores, newScoreHistory, newPotHistory]) => {
      setScoreHistory(newScoreHistory)
      setPotHistory(newPotHistory)
      if (lastLoadedGroupRef.current !== group) {
        prevRanksRef.current = loadStoredRanks(group)
        lastLoadedGroupRef.current = group
      }

      const newAllDeltas: RanksByView = {}
      const newAllRanks: RanksByView = {}
      for (const { value: view, scoreKey } of STAND_VIEWS) {
        const sorted = [...newScores].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number))
        const newRanks: Record<string, number> = {}
        sorted.forEach((p, i) => { newRanks[p.initials] = i + 1 })

        const prevRanks = prevRanksRef.current[view]
        if (prevRanks && Object.keys(prevRanks).length > 0) {
          const deltas: Record<string, number> = {}
          sorted.forEach((p, i) => {
            const prev = prevRanks[p.initials]
            if (prev !== undefined && prev !== i + 1) deltas[p.initials] = prev - (i + 1)
          })
          newAllDeltas[view] = deltas
        }
        newAllRanks[view] = newRanks
      }

      prevRanksRef.current = newAllRanks
      saveStoredRanks(group, newAllRanks)
      setAllDeltas(newAllDeltas)
      setScores(newScores)
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

  const activeView = STAND_VIEWS.find((v) => v.value === standView)!
  const sortedScores = [...scores].sort((a, b) => (b[activeView.scoreKey] as number) - (a[activeView.scoreKey] as number))
  const positionDeltas = allDeltas[standView] ?? {}
  const chartParticipants = scores.map((s) => ({ initials: s.initials, name: s.name }))
  const chartHistory = toScoreHistory(scoreHistory, activeView.historyKey)

  return (
    <>
      <div>
        <div className="relative flex items-center justify-center mb-1">
          <h1 className="font-accent font-bold text-3xl text-white">Overzicht</h1>
          {activeTab === 'stand' && (
            <div className="absolute right-0">
              <button
                onClick={() => {
                  setRefreshActive(true)
                  load(activeGroup)
                  setTimeout(() => setRefreshActive(false), 600)
                }}
                className={`text-xl transition-colors ${refreshActive ? 'text-[#FF6B00]' : 'text-white'}`}
              >
                ↻
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
            {/* Sub-toggle */}
            <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {STAND_VIEWS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStandView(value)}
                  className={[
                    'flex-1 py-1.5 rounded-lg font-heading text-[10px] font-bold tracking-wide uppercase transition-all',
                    standView === value ? 'bg-[#FF6B00] text-white' : 'text-white hover:text-[#FF6B00]',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            {!isLoaded && (
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center mb-6">
                <div className="text-[#555] text-sm">Laden…</div>
              </div>
            )}

{isLoaded && (
              <>
                <RankList
                  participants={sortedScores}
                  currentInitials={mijnInitials}
                  startRank={1}
                  scoreKey={standView !== 'totaal' ? activeView.scoreKey : undefined}
                  scoreLabel={activeView.scoreLabel}
                  positionDeltas={positionDeltas}
                />

                {chartHistory.length > 0 && (
                  <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-3 mt-3">
                    <div className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-1 text-center">
                      Verloop per matchday
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ProgressChart
                        history={chartHistory}
                        participants={chartParticipants}
                        totalMatchdays={MATCHDAY_COUNT}
                        height={160}
                        width={330}
                        highlightInitials={mijnInitials}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Inzet */}
        {activeTab === 'inzet' && (
          <div className="flex flex-col gap-3">
            {(WEDDENSCHAPPEN[activeGroup] ?? []).length === 0 ? (
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-[#888] text-sm">Geen weddenschappen voor deze groep</div>
              </div>
            ) : (WEDDENSCHAPPEN[activeGroup] ?? []).map((w, i) => (
              <div key={i} className={`rounded-xl bg-[#161616] border p-4 ${w.gewonnen === true ? 'border-[#FF6B00]' : w.gewonnen === false ? 'border-red-500/40' : 'border-[#2a2a2a]'}`}>
                <div className="flex items-start gap-3">
                  <span className="font-heading font-bold text-[#FF6B00] text-sm mt-0.5 shrink-0">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-heading font-semibold text-white text-sm">{w.weddenschap}</span>
                      {w.gewonnen === true && <span className="text-[#FF6B00] text-sm font-bold">✓</span>}
                      {w.gewonnen === false && <span className="text-red-500 text-sm font-bold">✗</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-0.5">Inzet</span>
                        <span className="text-white text-sm font-semibold">{w.inzet}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-0.5">Quote</span>
                        <span className="text-white text-sm font-semibold">{w.quotering.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-0.5">Max winst</span>
                        <span className="text-[#FF6B00] text-sm font-bold">{w.maxWinst}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Pot */}
        {activeTab === 'pot' && (() => {
          const regels = POT_REGELS[activeGroup] ?? []
          const totaal = regels.reduce((sum, r) => sum + r.bedrag, 0)
          const fmt = (n: number) =>
            '€ ' + Math.abs(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          return (
            <div className="flex flex-col gap-3">
              {/* Potstand */}
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5 text-center">
                <div className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-1">Huidige pot</div>
                <div className="font-accent font-bold text-4xl text-[#FF6B00]">{fmt(totaal)}</div>
              </div>

              {/* Verloop pot per matchday */}
              {potHistory.length > 0 && (
                <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-3">
                  <div className="text-[#555] text-[10px] font-bold uppercase tracking-wider mb-1 text-center">
                    Verloop per matchday
                  </div>
                  <PotChart data={potHistory} totalMatchdays={MATCHDAY_COUNT} width={330} />
                </div>
              )}

              {/* Balans */}
              <div className="flex flex-col gap-2">
                {regels.length === 0 ? (
                  <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center text-[#888] text-sm">Geen regels</div>
                ) : regels.map((r, i) => (
                  <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] px-4 py-3 grid items-center" style={{ gridTemplateColumns: '70px 1fr 70px' }}>
                    <div className="text-left">
                      {r.bedrag >= 0 && (
                        <span className="text-[#4CAF50] font-bold text-sm">+{fmt(r.bedrag)}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-white text-sm font-semibold">{r.omschrijving}</div>
                      <div className="text-[#555] text-[11px]">{new Date(r.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <div className="text-right">
                      {r.bedrag < 0 && (
                        <span className="text-[#888] font-bold text-sm">−{fmt(r.bedrag)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
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
