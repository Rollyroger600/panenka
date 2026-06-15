'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadScoresForGroup } from '@/app/actions/scores'
import { RankList } from '@/components/leaderboard/RankList'
import { DUAL_GROUP_INITIALS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { ParticipantScore } from '@/app/leaderboard/types'

type Tab = 'stand' | 'inzet' | 'pot'
type StandView = 'totaal' | 'poule' | 'fxv' | 'landen' | 'toto' | 'uitsl'

const STAND_VIEWS: { label: string; value: StandView; scoreKey: keyof ParticipantScore; scoreLabel: string }[] = [
  { label: 'Totaal', value: 'totaal', scoreKey: 'total',         scoreLabel: 'Tot.'   },
  { label: 'Poule',  value: 'poule',  scoreKey: 'poulefase',     scoreLabel: 'Poule'  },
  { label: 'FXV',    value: 'fxv',    scoreKey: 'fantasy',       scoreLabel: 'FXV'    },
  { label: 'Landen', value: 'landen', scoreKey: 'knockout',      scoreLabel: 'Landen' },
  { label: 'TOTO',   value: 'toto',   scoreKey: 'totoCorrect',   scoreLabel: 'TOTO'   },
  { label: 'UITSL',  value: 'uitsl',  scoreKey: 'uitslagCorrect',scoreLabel: 'UITSL'  },
]

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
    { weddenschap: 'Frankrijk winnaar WK', inzet: '€ 5,00', quotering: 6, maxWinst: '€ 30,00' },
    { weddenschap: 'Brazilië winnaar WK', inzet: '€ 5,00', quotering: 10, maxWinst: '€ 50,00' },
    { weddenschap: 'Nederland winnaar WK', inzet: '€ 5,00', quotering: 19, maxWinst: '€ 95,00' },
    { weddenschap: 'Kane Topscoorder WK', inzet: '€ 3,00', quotering: 7, maxWinst: '€ 21,00' },
    { weddenschap: 'Haaland Topscoorder WK', inzet: '€ 2,00', quotering: 15, maxWinst: '€ 30,00' },
  ],
  asc: [
    { weddenschap: 'Duitsland wint van Curacao', inzet: '€ 1,00', quotering: 100, maxWinst: '€ 100,00', gewonnen: true },
    { weddenschap: 'Spanje winnaar WK', inzet: '€ 5,00', quotering: 5.5, maxWinst: '€ 27,50' },
    { weddenschap: 'Frankrijk winnaar WK', inzet: '€ 5,00', quotering: 6, maxWinst: '€ 30,00' },
    { weddenschap: 'Nederland winnaar WK', inzet: '€ 1,00', quotering: 19, maxWinst: '€ 19,00' },
    { weddenschap: 'Kane topscoorder WK', inzet: '€ 3,00', quotering: 7, maxWinst: '€ 21,00' },
    { weddenschap: 'Messi topscoorder WK', inzet: '€ 2,00', quotering: 13, maxWinst: '€ 26,00' },
    { weddenschap: 'Ødegaard assist koning WK', inzet: '€ 1,00', quotering: 51, maxWinst: '€ 51,00' },
    { weddenschap: 'Ferran assist koning WK', inzet: '€ 1,00', quotering: 41, maxWinst: '€ 41,00' },
    { weddenschap: 'Spanje wint WK en Oyarzabal topscoorder', inzet: '€ 1,00', quotering: 34, maxWinst: '€ 34,00' },
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

export function StandClient({ mijnInitials, defaultGroup }: Props) {
  const isDualGroup = DUAL_GROUP_INITIALS.includes(mijnInitials.toUpperCase())
  const [activeGroup, setActiveGroup] = useState<GroupId>(defaultGroup)
  const [activeTab, setActiveTab] = useState<Tab>('stand')
  const [standView, setStandView] = useState<StandView>('totaal')
  const [refreshActive, setRefreshActive] = useState(false)
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
  const activeView = STAND_VIEWS.find((v) => v.value === standView)!
  const sortedScores = [...scores].sort((a, b) => (b[activeView.scoreKey] as number) - (a[activeView.scoreKey] as number))

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
              <RankList
                participants={sortedScores}
                currentInitials={mijnInitials}
                startRank={1}
                scoreKey={standView !== 'totaal' ? activeView.scoreKey : undefined}
                scoreLabel={activeView.scoreLabel}
              />
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
              <div key={i} className={`rounded-xl bg-[#161616] border p-4 ${w.gewonnen ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`}>
                <div className="flex items-start gap-3">
                  <span className="font-heading font-bold text-[#FF6B00] text-sm mt-0.5 shrink-0">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-heading font-semibold text-white text-sm">{w.weddenschap}</span>
                      {w.gewonnen && <span className="text-[#FF6B00] text-sm font-bold">✓</span>}
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
