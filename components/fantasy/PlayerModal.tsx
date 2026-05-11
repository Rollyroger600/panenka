'use client'
import { useState, useMemo } from 'react'
import { useGameStore, ALL_SLOTS, TALENT_SLOTS } from '@/store/gameStore'
import { WK_PLAYERS } from '@/lib/data/players'
import { FLAG_PATHS } from '@/lib/data/countries'
import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote, abbrevCountry, getPlayerTrend } from '@/lib/helpers'
import type { OddsTrend } from '@/lib/data/knockoutQuotes_trends'

function TrendIndicator({ trend }: { trend: OddsTrend }) {
  if (!trend || trend === 'same') return null
  return (
    <span className={`absolute top-0 right-0 text-[7px] leading-none font-bold ${
      trend === 'up' ? 'text-[#FF6B00]' : 'text-emerald-400'
    }`}>
      {trend === 'up' ? '▲' : '▼'}
    </span>
  )
}
import type { Player } from '@/lib/data/players'

const WK_START = new Date('2026-06-11')

const ALL_COUNTRIES = [...new Set(WK_PLAYERS.map((p) => p.country))].sort((a, b) => a.localeCompare(b, 'nl'))
const IS_TALENT = (p: Player) => p.dob >= '2004-06-11'

const CONFEDERATIONS = ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC']

const CONF_LOGO: Record<string, string> = {
  UEFA:     '/Confederaties/uefa.png',
  CONMEBOL: '/Confederaties/Conmebol.png',
  CONCACAF: '/Confederaties/Concacaf.png',
  AFC:      '/Confederaties/AFC.png',
  CAF:      '/Confederaties/CAF.png',
  OFC:      '/Confederaties/OFC.png',
}

// Leagues sorted by number of players in the dataset
const LEAGUES_BY_COUNT = ['Liga Profesional de Fútbol', 'La Liga', 'Premier League', 'Bundesliga', 'Championship', 'Ligue 1', 'Pro League', 'Serie A', 'Série A', 'La Liga 2', 'Primeira Liga', 'Super League', '2. Bundesliga', 'Eredivisie', 'Süper Lig', 'Major League Soccer', 'Ligue 2', 'Premiership', 'K League 1', 'Categoría Primera A', 'Eliteserien', 'Ekstraklasa', 'Serie B', 'Superliga', 'Primera División', 'První liga', 'Allsvenskan', 'División Profesional', 'League One', 'Hrvatska nogometna liga', 'A-League Men', 'Liga 1', 'Liga I', 'Primera Division', '3. Liga', 'Liga MX', 'Nemzeti Bajnokság I', 'Qatar Stars League', 'División de Fútbol Profesional', 'Saudi Second Division League', 'Premyer Liqa', '1. Division', 'League Two', 'Russian Premier League', 'Egyptian Premier League', 'Kuwaiti Premier League', 'Botola Pro', 'Premier Soccer League', 'Thai League 1', 'Premier Division']

const LEAGUE_LOGO_ID: Record<string, string> = {
  'Premier League': '13', 'La Liga': '53', 'Ligue 1': '16', 'Bundesliga': '19',
  'Serie A': '31', 'Major League Soccer': '39', 'Pro League': '4', 'Süper Lig': '68',
  'Primeira Liga': '308', 'Série A': '7', 'Liga Profesional de Fútbol': '353',
  'Eredivisie': '10', 'Hrvatska nogometna liga': '317', 'Super League': '189',
  'První liga': '319', 'Primera División': '338', 'Premiership': '50',
  'Eliteserien': '41', 'La Liga 2': '54', 'Championship': '14', 'Ligue 2': '17',
  'Superliga': '1', 'K League 1': '83', '2. Bundesliga': '20', 'Primera Division': '335',
  'Serie B': '32', 'Ekstraklasa': '66', 'Allsvenskan': '56', 'Nemzeti Bajnokság I': '64',
  'Liga I': '330', 'Liga 1': '2020', '3. Liga': '2076', 'League One': '60',
  'A-League Men': '351', 'League Two': '61', 'Premier Division': '65', '1. Division': '318',
  'División de Fútbol Profesional': '2017',
  'Categoría Primera A': '336', 'División Profesional': '337', 'Liga MX': 'liga-mx',
  'Qatar Stars League': '888889', 'Saudi Second Division League': '888888',
  'Premyer Liqa': '313', 'Russian Premier League': 'russian-pl',
  'Egyptian Premier League': 'egyptian-pl', 'Kuwaiti Premier League': 'kuwaiti-pl',
  'Botola Pro': 'botola', 'Premier Soccer League': 'psl', 'Thai League 1': '100003',
}

const POS_GROUPS: Record<string, string[]> = {
  GK:  ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['ST', 'CF', 'LW', 'RW'],
}
const POS_PRIORITY = ['ATT', 'MID', 'DEF', 'GK']

function posGroup(positions: string[]): string {
  for (const group of POS_PRIORITY) {
    if (positions.some((p) => POS_GROUPS[group].includes(p))) return group
  }
  return positions[0]
}

function playerAge(dob: string): number {
  return Math.floor((WK_START.getTime() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

type PanelKey = 'land' | 'conf' | 'comp' | 'pos' | null

interface Props {
  slotKey: string
  talentOnly: boolean
  onClose: () => void
  onSelect?: (player: Player) => void
}

export function PlayerModal({ slotKey, talentOnly, onClose, onSelect }: Props) {
  const { fantasySquad, setFantasyPlayer, setActiveInfoSlot } = useGameStore()
  const [search, setSearch] = useState('')
  const [filterConf, setFilterConf] = useState<string | null>(null)
  const [filterU22, setFilterU22] = useState(talentOnly)
  const [filterPos, setFilterPos] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<string | null>(null)
  const [filterLeague, setFilterLeague] = useState<string | null>(null)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)

  const alreadyPicked = useMemo(
    () => new Set(ALL_SLOTS.map((k) => fantasySquad[k]?.id).filter(Boolean) as number[]),
    [fantasySquad],
  )

  const results = useMemo(() => {
    let pool = WK_PLAYERS
    if (filterU22) pool = pool.filter(IS_TALENT)
    if (filterConf) pool = pool.filter((p) => p.confederation === filterConf)
    if (filterPos) pool = pool.filter((p) => POS_GROUPS[filterPos].some((pos) => p.positions.includes(pos)))
    if (filterCountry) pool = pool.filter((p) => p.country === filterCountry)
    if (filterLeague) pool = pool.filter((p) => p.league === filterLeague)
    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(
        (p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.country.toLowerCase().includes(q),
      )
    }
    return pool
  }, [search, filterConf, filterU22, filterPos, filterCountry, filterLeague])

  function select(player: Player) {
    if (onSelect) {
      onSelect(player)
    } else {
      let targetSlot = slotKey
      if (!slotKey.startsWith('t') && IS_TALENT(player)) {
        const emptyTalentSlot = TALENT_SLOTS.find((k) => !fantasySquad[k])
        if (emptyTalentSlot) targetSlot = emptyTalentSlot
      }
      setFantasyPlayer(targetSlot, player)
      setActiveInfoSlot(null)
    }
    onClose()
  }

  function togglePanel(key: PanelKey) {
    setOpenPanel((prev) => (prev === key ? null : key))
  }

  function pill(label: string, active: boolean, panel: PanelKey) {
    return (
      <button
        key={label}
        onClick={() => togglePanel(panel)}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
          active || openPanel === panel
            ? 'bg-[#FF6B00] text-white'
            : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
        }`}
      >
        {label} <span className="text-[8px]">▾</span>
      </button>
    )
  }

  const hasFilters = !!(search.trim() || filterConf || filterPos || filterCountry || filterLeague || (filterU22 && !talentOnly))

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-24 left-0 right-0 bottom-20 z-50 flex flex-col bg-[#111] rounded-xl border border-[#2a2a2a]">

        {/* Search + close */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek speler…"
            className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
          />
          <button onClick={onClose} className="text-[#555] hover:text-white text-xl px-1">✕</button>
        </div>

        {/* Filter pills */}
        <div className="px-4 pb-4 shrink-0 flex gap-1.5 justify-center">
          {pill('LAND', !!filterCountry, 'land')}
          {pill('CONF', !!filterConf, 'conf')}
          {pill('COMP', !!filterLeague, 'comp')}
          {pill('POS', !!filterPos, 'pos')}
          <button
            onClick={() => { if (!talentOnly) setFilterU22((v) => !v) }}
            disabled={talentOnly}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
              filterU22 ? 'bg-[#FF6B00] text-white' : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
            } ${talentOnly ? 'opacity-50 cursor-default' : ''}`}
          >
            U22
          </button>
        </div>

        {/* LAND slicer */}
        {openPanel === 'land' && (
          <div className="px-4 pb-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ALL_COUNTRIES.map((country) => {
                const selected = filterCountry === country
                return (
                  <button
                    key={country}
                    onClick={() => { setFilterCountry(selected ? null : country); setFilterConf(null) }}
                    className={`shrink-0 flex flex-col items-center gap-1`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                      selected ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-[#666] bg-white/30 backdrop-blur hover:border-[#888]'
                    }`}>
                      <img src={FLAG_PATHS[country]} alt={country} width={30} height={30} className="rounded-full object-cover" />
                    </div>
                    <span className={`text-[9px] font-bold ${selected ? 'text-[#FF6B00]' : 'text-[#555]'}`}>
                      {abbrevCountry(country)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CONF slicer */}
        {openPanel === 'conf' && (
          <div className="px-4 pb-3 shrink-0">
            <div className="flex gap-2 justify-center">
              {CONFEDERATIONS.map((conf) => {
                const selected = filterConf === conf
                return (
                  <button
                    key={conf}
                    onClick={() => { setFilterConf(selected ? null : conf); setFilterCountry(null) }}
                    className="shrink-0 flex flex-col items-center gap-1"
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                      selected ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-[#666] bg-white/30 backdrop-blur hover:border-[#888]'
                    }`}>
                      <img src={CONF_LOGO[conf]} alt={conf} width={30} height={30} className="object-contain" />
                    </div>
                    <span className={`text-[9px] font-bold ${selected ? 'text-[#FF6B00]' : 'text-[#555]'}`}>{conf}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* COMP slicer */}
        {openPanel === 'comp' && (
          <div className="px-4 pb-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {LEAGUES_BY_COUNT.map((league) => {
                const selected = filterLeague === league
                const logoId = LEAGUE_LOGO_ID[league]
                return (
                  <button
                    key={league}
                    onClick={() => { setFilterLeague(selected ? null : league) }}
                    className="shrink-0 flex flex-col items-center gap-1"
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                      selected ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-[#666] bg-white/30 backdrop-blur hover:border-[#888]'
                    }`}>
                      {logoId
                        ? <img src={`/Competities/${logoId}.png`} alt={league} width={24} height={24} className="object-contain" />
                        : <span className="text-[9px] font-bold text-[#555]">{league.slice(0, 3).toUpperCase()}</span>
                      }
                    </div>
                    <span className={`text-[9px] font-bold max-w-[44px] text-center leading-tight ${selected ? 'text-[#FF6B00]' : 'text-[#555]'}`}>{league}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* POS slicer */}
        {openPanel === 'pos' && (
          <div className="px-4 pb-3 shrink-0">
            <div className="flex gap-2 justify-center">
              {(['GK', 'DEF', 'MID', 'ATT'] as const).map((group) => {
                const selected = filterPos === group
                return (
                  <button
                    key={group}
                    onClick={() => { setFilterPos(selected ? null : group) }}
                    className="shrink-0 flex flex-col items-center gap-1"
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                      selected ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-[#666] bg-white/30 backdrop-blur hover:border-[#888]'
                    }`}>
                      <PosIcon group={group} active={selected} size={28} />
                    </div>
                    <span className={`text-[9px] font-bold ${selected ? 'text-[#FF6B00]' : 'text-[#555]'}`}>{group}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Count + clear */}
        <div className="px-4 pb-1 shrink-0 flex items-center gap-3">
          <span className="text-[10px] text-[#444]">{results.length} spelers</span>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('')
                setFilterConf(null); setFilterPos(null)
                setFilterCountry(null); setFilterLeague(null)
                setOpenPanel(null)
                if (!talentOnly) setFilterU22(false)
              }}
              className="text-[10px] text-[#FF6B00] hover:underline"
            >
              Wis filters
            </button>
          )}
        </div>

        {/* Player list */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {results.map((player) => {
            const isPicked = alreadyPicked.has(player.id)
            const quote = computePlayerQuote(player)
            const group = posGroup(player.positions)
            const age = playerAge(player.dob)
            return (
              <button
                key={player.id}
                onClick={() => !isPicked && select(player)}
                disabled={isPicked}
                className={`w-full flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] text-left transition-colors ${
                  isPicked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <FlagImage country={player.country} size={24} className="shrink-0" />
                <span className="text-sm font-bold text-white w-6 shrink-0">{player.overall}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{player.name}</div>
                  <div className="text-[10px] text-[#555] truncate">
                    {player.country} · {player.club} · {age}jr
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#555] bg-[#1e1e1e] px-1.5 py-0.5 rounded shrink-0">{group}</span>
                <span className="relative font-heading text-xs font-bold text-[#FF6B00] border border-[#FF6B00] px-2 py-0.5 rounded-lg shrink-0">{formatQuote(quote)}<TrendIndicator trend={getPlayerTrend(player.country)} /></span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function PosIcon({ group, active, size = 28 }: { group: string; active: boolean; size?: number }) {
  const color = active ? '#FF6B00' : '#222'
  if (group === 'GK') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="8" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/>
      <rect x="4" y="8" width="6" height="14" fill={color} fillOpacity="0.3"/>
      <rect x="18" y="8" width="6" height="14" fill={color} fillOpacity="0.3"/>
      <line x1="4" y1="15" x2="24" y2="15" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
  if (group === 'DEF') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 4L22 8V16C22 20 14 24 14 24C14 24 6 20 6 16V8L14 4Z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15"/>
    </svg>
  )
  if (group === 'MID') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="9" stroke={color} strokeWidth="2"/>
      <line x1="5" y1="14" x2="23" y2="14" stroke={color} strokeWidth="1.5"/>
      <ellipse cx="14" cy="14" rx="4.5" ry="9" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
  // ATT
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,4 22,22 14,18 6,22" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" strokeLinejoin="round"/>
    </svg>
  )
}
