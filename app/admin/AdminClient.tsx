'use client'
import { useState, useMemo, useEffect } from 'react'
import { MATCHES } from '@/lib/data/matches'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { FlagImage } from '@/components/ui/FlagImage'
import { ScorePicker } from '@/components/matches/ScorePicker'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_MATCH_ODDS } from '@/lib/data/koMatchOdds'
import { abbrevCountry } from '@/lib/helpers'
import {
  saveResult, deleteResult, saveKoResults, saveKoMatchTeams,
  saveOranjeResults, computeAndSaveScores,
  updateOranjeVraag, saveOranjeCorrect, saveOranjeBeoordeling,
  mergeFantasyStat, removeFantasyStat, mergeEspnStats,
  setAdminGroup, loadAllTokenUsage, loadKoTokenUsage, loadVoortgang,
  loadParticipantPredictions,
} from '@/app/actions/admin'
import type { KoMatchTeams, TokenUsageEntry, KoTokenUsageEntry, VoortgangEntry } from '@/app/actions/admin'
import type { Prediction } from '@/store/gameStore'
import { getMatchesForMatchday } from '@/lib/data/matchdayMap'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { FIRST_CUSTOM_BET_MATCHDAY } from '@/lib/matchday'
import type { CustomBet } from '@/lib/matchday'
import type { FantasyStats } from '@/lib/scoring'
import type { MatchResult, OranjeResult } from '@/lib/scoring'
import type { ParticipantScore } from '@/app/leaderboard/types'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { PARTICIPANTS } from '@/lib/participants'
import type { OranjeVragenMap, OranjeCorrectMap, OranjeBeoordeling, OranjeAntwoordenMap, AntwoordType } from '@/lib/types/oranjeVragen'
import { ANTWOORD_TYPE_LABELS, MINUUT_OPTIES, parseCorrectWaarden } from '@/lib/types/oranjeVragen'
import { WK_PLAYERS } from '@/lib/data/players'
import { ESPN_MATCH_IDS } from '@/lib/data/espnMatchIds'
import type { EspnImportPreview } from '@/app/api/admin/espn-import/route'

const MUTED = '#7e7667'

const NED_MATCHES = [
  { id: 10, label: 'NED – JPN (14 jun)' },
  { id: 33, label: 'NED – ZWE (20 jun)' },
  { id: 58, label: 'TUN – NED (26 jun)' },
  { id: 75, label: 'NED – MAR (30 jun)' },
]

type Tab = 'matches' | 'knockout' | 'ko_matches' | 'vragen' | 'fantasy' | 'scores' | 'links' | 'matchday' | 'tokens' | 'ko_tokens' | 'voortgang'

interface Props {
  groupId: GroupId
  initialResults: Record<number, MatchResult>
  initialKoResults: Record<string, string[]>
  initialOranjeResults: Record<number, OranjeResult>
  initialOranjeVragen: OranjeVragenMap
  initialOranjeCorrect: OranjeCorrectMap
  initialOranjeBeoordeling: OranjeBeoordeling
  initialAlleAntwoorden: Record<string, OranjeAntwoordenMap>
  initialKoMatchTeams: KoMatchTeams
  initialFantasyStats: FantasyStats
}

export function AdminClient({ groupId, initialResults, initialKoResults, initialKoMatchTeams, initialOranjeResults, initialOranjeVragen, initialOranjeCorrect, initialOranjeBeoordeling, initialAlleAntwoorden, initialFantasyStats }: Props) {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  const [tab, setTab] = useState<Tab>('matches')
  const [results, setResults] = useState(initialResults)
  const [koResults, setKoResults] = useState(initialKoResults)
  const [oranjeResults, setOranjeResults] = useState(initialOranjeResults)
  const [oranjeVragen, setOranjeVragen] = useState<OranjeVragenMap>(initialOranjeVragen)
  const [oranjeCorrect, setOranjeCorrect] = useState<OranjeCorrectMap>(initialOranjeCorrect)
  const [oranjeBeoordeling, setOranjeBeoordeling] = useState<OranjeBeoordeling>(initialOranjeBeoordeling)
  const alleAntwoorden = initialAlleAntwoorden
  const [scores, setScores] = useState<Record<string, ParticipantScore> | null>(null)
  const [computing, setComputing] = useState(false)
  const [tokenUsage, setTokenUsage] = useState<TokenUsageEntry[] | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [voortgang, setVoortgang] = useState<VoortgangEntry[] | null>(null)
  const [loadingVoortgang, setLoadingVoortgang] = useState(false)
  const [koTokenUsage, setKoTokenUsage] = useState<KoTokenUsageEntry[] | null>(null)
  const [loadingKoTokens, setLoadingKoTokens] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [fantasyStats, setFantasyStats] = useState<FantasyStats>(initialFantasyStats)
  const [fantasySearch, setFantasySearch] = useState('')
  const [editingVraag, setEditingVraag] = useState<{ matchId: number; key: string } | null>(null)
  const [editTekst, setEditTekst] = useState('')
  const [koMatchTeams, setKoMatchTeams] = useState<KoMatchTeams>(initialKoMatchTeams)
  const [savingKoTeam, setSavingKoTeam] = useState<number | null>(null)

  const groupMatches = useMemo(() => MATCHES.filter((m) => m.id <= 72), [])
  const koMatchList  = useMemo(() => MATCHES.filter((m) => m.id >= 73), [])

  const filteredMatches = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? groupMatches.filter((m) => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || `${m.id}` === q)
      : groupMatches
  }, [search, groupMatches])

  async function handleSaveResult(matchId: number, toto: '1' | 'X' | '2', uitslag: string) {
    setSaving(matchId)
    await saveResult(matchId, toto, uitslag)
    setResults((r) => ({ ...r, [matchId]: { toto, uitslag } }))
    setSaving(null)
  }

  async function handleDeleteResult(matchId: number) {
    await deleteResult(matchId)
    setResults((r) => { const n = { ...r }; delete n[matchId]; return n })
  }

  async function handleSaveKoTeam(matchId: number, home: string, away: string) {
    setSavingKoTeam(matchId)
    const updated = { ...koMatchTeams, [matchId]: { home: home.trim(), away: away.trim() } }
    setKoMatchTeams(updated)
    await saveKoMatchTeams(updated)
    setSavingKoTeam(null)
  }

  async function handleDeleteKoTeam(matchId: number) {
    const updated = { ...koMatchTeams }
    delete updated[matchId]
    setKoMatchTeams(updated)
    await saveKoMatchTeams(updated)
  }

  async function toggleKoCountry(roundId: string, country: string, max: number) {
    const current = koResults[roundId] ?? []
    const next = current.includes(country)
      ? current.filter((c) => c !== country)
      : current.length < max ? [...current, country] : current
    const updated = { ...koResults, [roundId]: next }
    setKoResults(updated)
    await saveKoResults(updated)
  }

  async function setOranjeQ(matchId: number, key: string, value: string | null) {
    const current = oranjeResults[matchId] ?? {}
    const updated = { ...oranjeResults, [matchId]: { ...current, [key]: value } }
    setOranjeResults(updated as Record<number, OranjeResult>)
    await saveOranjeResults(updated as Record<number, OranjeResult>)
  }

  async function handleFantasyStat(playerId: string, field: 'goals' | 'assists', value: number) {
    const current = fantasyStats[playerId] ?? { goals: 0, assists: 0 }
    setFantasyStats({ ...fantasyStats, [playerId]: { ...current, [field]: value } })
    const fresh = await mergeFantasyStat(playerId, field, value)
    setFantasyStats(fresh)
  }

  async function handleFantasyRemove(playerId: string) {
    const updated = { ...fantasyStats }
    delete updated[playerId]
    setFantasyStats(updated)
    const fresh = await removeFantasyStat(playerId)
    setFantasyStats(fresh)
  }

  async function handleEspnImport(delta: Record<string, { goals: number; assists: number }>) {
    const optimistic = { ...fantasyStats }
    for (const [id, stats] of Object.entries(delta)) {
      const existing = optimistic[id] ?? { goals: 0, assists: 0 }
      optimistic[id] = { goals: existing.goals + stats.goals, assists: existing.assists + stats.assists }
    }
    setFantasyStats(optimistic)
    const fresh = await mergeEspnStats(delta)
    setFantasyStats(fresh)
  }

  async function handleCompute() {
    setComputing(true)
    const s = await computeAndSaveScores(groupId)
    setScores(s)
    setComputing(false)
    setTab('scores')
  }

  async function handleLoadTokens() {
    setLoadingTokens(true)
    const data = await loadAllTokenUsage(groupId)
    setTokenUsage(data)
    setLoadingTokens(false)
    setTab('tokens')
  }

  async function handleLoadKoTokens() {
    setLoadingKoTokens(true)
    const data = await loadKoTokenUsage(groupId)
    setKoTokenUsage(data)
    setLoadingKoTokens(false)
    setTab('ko_tokens')
  }

  async function handleLoadVoortgang() {
    setLoadingVoortgang(true)
    const data = await loadVoortgang(groupId)
    setVoortgang(data)
    setLoadingVoortgang(false)
  }

  async function handleExport() {
    const res = await fetch(`/api/export?group=${groupId}`)
    if (!res.ok) { alert(`Export mislukt (HTTP ${res.status}):\n${await res.text() || '(geen foutmelding)'}`) ; return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename="([^"]+)"/)
    a.href = url
    a.download = match?.[1] ?? 'export.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePubliceer(matchId: number, initials: string, gepubliceerd: boolean) {
    await updateOranjeVraag(matchId, initials, { gepubliceerd }, groupId)
    setOranjeVragen((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [initials.toLowerCase()]: { ...prev[matchId]?.[initials.toLowerCase()], gepubliceerd } },
    }))
  }

  async function handleBeoordeling(matchId: number, questionKey: string, participantKey: string, correct: boolean | null) {
    setOranjeBeoordeling(prev => {
      const next: OranjeBeoordeling = JSON.parse(JSON.stringify(prev))
      if (!next[matchId]) next[matchId] = {}
      if (!next[matchId][questionKey]) next[matchId][questionKey] = {}
      if (correct === null) {
        delete next[matchId][questionKey][participantKey]
      } else {
        next[matchId][questionKey][participantKey] = correct
      }
      saveOranjeBeoordeling(next, groupId)
      return next
    })
  }

  async function handleEditTekst(matchId: number, initials: string, tekst: string) {
    await updateOranjeVraag(matchId, initials, { tekst }, groupId)
    setOranjeVragen((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [initials.toLowerCase()]: { ...prev[matchId]?.[initials.toLowerCase()], tekst } },
    }))
    setEditingVraag(null)
  }

  async function handleAdminType(matchId: number, initials: string, adminType: Exclude<AntwoordType, 'anders'>) {
    await updateOranjeVraag(matchId, initials, { adminType }, groupId)
    setOranjeVragen((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [initials.toLowerCase()]: { ...prev[matchId]?.[initials.toLowerCase()], adminType } },
    }))
  }

  async function handleCorrectAntwoord(matchId: number, initials: string, waarde: string | null) {
    setOranjeCorrect(prev => {
      const next: OranjeCorrectMap = {
        ...prev,
        [matchId]: { ...(prev[matchId] ?? {}), [initials.toLowerCase()]: waarde },
      }
      saveOranjeCorrect(next, groupId)
      return next
    })
  }

  const koMatchesWithTeams = Object.keys(koMatchTeams).length
  const koMatchResults = Object.keys(results).filter((id) => parseInt(id) >= 73).length

  const TABS: { id: Tab; label: string }[] = [
    { id: 'matches',    label: `Uitslagen (${Object.keys(results).filter((id) => parseInt(id) <= 72).length}/72)` },
    { id: 'knockout',   label: 'KO Landen' },
    { id: 'ko_matches', label: `KO Wedstrijden (${koMatchesWithTeams}/32)` },
    { id: 'vragen',     label: 'Oranje Vragen' },
    { id: 'fantasy',    label: `Fantasy (${Object.keys(fantasyStats).length})` },
    { id: 'scores',     label: 'Scores' },
    { id: 'links',      label: 'Links' },
    { id: 'matchday',   label: '📅 Matchday' },
    { id: 'tokens',     label: '🪙 Tokens' },
    { id: 'ko_tokens',  label: '🪙 KO Tokens' },
    { id: 'voortgang',  label: '✅ Voortgang' },
  ]

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Sticky admin header */}
      <div className="sticky top-0 z-50 border-b border-[#2a2a2a]/60" style={{ background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[700px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo/Artboard 1@4x.png" alt="Panenka" style={{ height: '1.75rem' }} />
            <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-[#555]">Admin</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-[#1e1e1e] border border-[#333] text-white text-xs font-bold hover:bg-[#2a2a2a] transition-colors"
            >
              📥 Excel
            </button>
            <button
              onClick={handleCompute}
              disabled={computing}
              className="px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-bold hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
            >
              {computing ? 'Bezig…' : '🔢 Bereken'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-4 py-4">

        {/* Groeptoggle */}
        <div className="flex gap-1 mb-4">
          {(['og', 'asc'] as const).map((g) => (
            <form key={g} action={setAdminGroup.bind(null, g)}>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  groupId === g
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#1e1e1e] text-[#555] hover:text-[#888] border border-[#2a2a2a]'
                }`}
              >
                {g.toUpperCase()}
              </button>
            </form>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t.id ? 'bg-[#FF6B00] text-white' : 'bg-[#1e1e1e] text-[#555] hover:text-[#888]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Match results ──────────────────────────────────────────────────────── */}
        {tab === 'matches' && (
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op land of match-ID…"
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00] mb-4"
            />
            <div className="flex flex-col gap-3">
              {filteredMatches.map((m) => (
                <MatchResultRow
                  key={m.id}
                  match={m}
                  result={results[m.id] ?? null}
                  saving={saving === m.id}
                  onSave={(toto, uitslag) => handleSaveResult(m.id, toto, uitslag)}
                  onDelete={() => handleDeleteResult(m.id)}
                  onEspnImport={handleEspnImport}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── KO results ─────────────────────────────────────────────────────────── */}
        {tab === 'knockout' && (
          <div className="flex flex-col gap-4">
            {KNOCKOUT_ROUNDS.map((round) => {
              const picked = koResults[round.id] ?? []
              return (
                <div key={round.id} className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
                    <span className="font-heading text-sm font-bold text-white">{round.label}</span>
                    <span className="text-xs text-[#FF6B00] font-bold">{picked.length} / {round.slots}</span>
                  </div>
                  <div className="p-3 grid grid-cols-6 gap-2 sm:grid-cols-8">
                    {ALL_COUNTRIES.map((country) => {
                      const isSelected = picked.includes(country)
                      const isFull = !isSelected && picked.length >= round.slots
                      return (
                        <button
                          key={country}
                          onClick={() => !isFull && toggleKoCountry(round.id, country, round.slots)}
                          disabled={isFull}
                          className={`flex flex-col items-center justify-center gap-0.5 aspect-square rounded-xl border transition-colors ${
                            isSelected
                              ? 'border-[#FF6B00] bg-[#FF6B00]/10'
                              : isFull
                              ? 'border-[#2a2a2a] bg-[#111] opacity-25 cursor-not-allowed'
                              : 'border-[#333] bg-[#1a1a1a] hover:border-[#555]'
                          }`}
                        >
                          <FlagImage country={country} size={20} />
                          <span className={`font-accent text-[8px] leading-none mt-0.5 ${isSelected ? 'text-white' : 'text-[#555]'}`}>
                            {abbrevCountry(country)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── KO Wedstrijden (teams + uitslagen) ────────────────────────────────── */}
        {tab === 'ko_matches' && (
          <KoMatchesTab
            koMatchList={koMatchList}
            koMatchTeams={koMatchTeams}
            results={results}
            saving={savingKoTeam}
            onSaveTeam={handleSaveKoTeam}
            onDeleteTeam={handleDeleteKoTeam}
            onSaveResult={(matchId, toto, uitslag) => handleSaveResult(matchId, toto, uitslag)}
            onDeleteResult={(matchId) => handleDeleteResult(matchId)}
            savingResult={saving}
            onEspnImport={handleEspnImport}
          />
        )}

        {/* ── Oranje vragen ──────────────────────────────────────────────────────── */}
        {tab === 'vragen' && (
          <div className="flex flex-col gap-6">
            {NED_MATCHES.map(({ id, label }) => {
              const nedMatch = MATCHES.find((m) => m.id === id)!
              const opponent = nedMatch.home === 'Nederland' ? nedMatch.away : nedMatch.home
              const nedPlayers = WK_PLAYERS.filter((p) => p.country === 'Nederland').map((p) => p.name)
              const oppPlayers = WK_PLAYERS.filter((p) => p.country === opponent).map((p) => p.name)
              const matchVragen = oranjeVragen[id] ?? {}
              const matchCorrect = oranjeCorrect[id] ?? {}

              return (
                <div key={id} className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
                    <span className="font-heading text-sm font-bold text-white">{label}</span>
                    <span className="text-xs text-[#555]">
                      {Object.values(matchVragen).filter((v) => v.gepubliceerd).length} / {Object.keys(matchVragen).length} gepubliceerd
                    </span>
                  </div>
                  <div className="divide-y divide-[#1e1e1e]">
                    {groupParticipants.map((p) => {
                      const key = p.initials.toLowerCase()
                      const vraag = matchVragen[key]
                      const effectiefType = vraag?.adminType ?? (vraag?.type !== 'anders' ? vraag?.type : null)
                      const correctWaarde = matchCorrect[key] ?? null

                      return (
                        <div key={key} className="px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-[#555]">{p.name}</span>
                              {vraag ? (
                                editingVraag?.matchId === id && editingVraag?.key === key ? (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    <textarea
                                      value={editTekst}
                                      onChange={(e) => setEditTekst(e.target.value)}
                                      rows={2}
                                      className="w-full bg-[#1e1e1e] border border-[#FF6B00]/50 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleEditTekst(id, key, editTekst)}
                                        disabled={!editTekst.trim()}
                                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#FF6B00] text-white disabled:opacity-40"
                                      >Opslaan</button>
                                      <button
                                        onClick={() => setEditingVraag(null)}
                                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#252525] text-[#888]"
                                      >Annuleer</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5">
                                    <p className="text-sm text-white leading-snug flex-1">{vraag.tekst}</p>
                                    <button
                                      onClick={() => { setEditingVraag({ matchId: id, key }); setEditTekst(vraag.tekst) }}
                                      className="shrink-0 text-[#444] hover:text-[#888] transition-colors mt-0.5"
                                      title="Bewerk vraag"
                                    >✏️</button>
                                  </div>
                                )
                              ) : (
                                <p className="text-xs text-[#333] italic">Nog geen vraag ingediend</p>
                              )}
                            </div>
                            {vraag && !(editingVraag?.matchId === id && editingVraag?.key === key) && (
                              <button
                                onClick={() => handlePubliceer(id, key, !vraag.gepubliceerd)}
                                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                  vraag.gepubliceerd
                                    ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30'
                                    : 'bg-[#252525] text-[#555] hover:text-[#888]'
                                }`}
                              >
                                {vraag.gepubliceerd ? '✓ Gepubliceerd' : 'Publiceer'}
                              </button>
                            )}
                          </div>

                          {vraag && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                vraag.type === 'anders' && !vraag.adminType
                                  ? 'bg-[#E74C3C]/20 text-[#E74C3C]'
                                  : 'bg-[#252525] text-[#888]'
                              }`}>
                                {ANTWOORD_TYPE_LABELS[vraag.adminType ?? vraag.type]}
                              </span>
                              {vraag.suggestie && (
                                <span className="text-[10px] text-[#555] italic">"{vraag.suggestie}"</span>
                              )}
                              <select
                                value={vraag.adminType ?? ''}
                                onChange={(e) => handleAdminType(id, key, e.target.value as Exclude<AntwoordType, 'anders'>)}
                                className="bg-[#252525] border border-[#2a2a2a] text-[10px] text-white rounded-lg px-2 py-1 outline-none focus:border-[#FF6B00]"
                              >
                                <option value="">→ Override type</option>
                                {(['ja_nee', 'nl_opp', 'speler_nl', 'speler_opp', 'speler_beide', 'links_rechts', 'percentage', 'exact_aantal', 'exact_aantal_hoog', 'aantal_marge', 'aantal_marge_groot', 'decimaal', 'minuut', 'open'] as const).map((t) => (
                                  <option key={t} value={t}>{ANTWOORD_TYPE_LABELS[t]}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {vraag && effectiefType && effectiefType !== 'open' && (
                            <AdminCorrectInvoer
                              type={effectiefType}
                              waarde={correctWaarde}
                              opponent={opponent}
                              nedPlayers={nedPlayers}
                              oppPlayers={oppPlayers}
                              onChange={(v) => handleCorrectAntwoord(id, key, v)}
                            />
                          )}

                          {vraag && effectiefType === 'open' && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              {groupParticipants.map((deelnemer) => {
                                const dKey = deelnemer.initials.toLowerCase()
                                const antwoord = alleAntwoorden[dKey]?.[id]?.[key] ?? null
                                const verdict = oranjeBeoordeling[id]?.[key]?.[dKey] ?? null
                                if (!antwoord) return null
                                return (
                                  <div key={dKey} className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#555] w-14 shrink-0">{deelnemer.name}</span>
                                    <span className="flex-1 text-xs text-white truncate">"{antwoord}"</span>
                                    <button
                                      onClick={() => handleBeoordeling(id, key, dKey, verdict === true ? null : true)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${verdict === true ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30' : 'bg-[#252525] text-[#555] hover:text-[#2ECC71]'}`}
                                    >✓</button>
                                    <button
                                      onClick={() => handleBeoordeling(id, key, dKey, verdict === false ? null : false)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${verdict === false ? 'bg-[#E74C3C]/20 text-[#E74C3C] border border-[#E74C3C]/30' : 'bg-[#252525] text-[#555] hover:text-[#E74C3C]'}`}
                                    >✗</button>
                                  </div>
                                )
                              })}
                              {groupParticipants.every((d) => !alleAntwoorden[d.initials.toLowerCase()]?.[id]?.[key]) && (
                                <span className="text-[10px] text-[#333] italic">Nog geen antwoorden ingevuld</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Fantasy statistieken ───────────────────────────────────────────────── */}
        {tab === 'fantasy' && (
          <FantasyStatsTab
            stats={fantasyStats}
            search={fantasySearch}
            onSearchChange={setFantasySearch}
            onStatChange={handleFantasyStat}
            onRemove={handleFantasyRemove}
          />
        )}

        {/* ── Uitnodigingslinks ──────────────────────────────────────────────────── */}
        {tab === 'links' && <LinksPanel />}

        {/* ── Matchday beheer ────────────────────────────────────────────────────── */}
        {tab === 'matchday' && <MatchdayAdminTab groupId={groupId} />}

        {/* ── Token diagnose ──────────────────────────────────────────────────────── */}
        {tab === 'tokens' && (
          <div>
            {!tokenUsage ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-[#555] text-sm">Laad tokengebruik voor alle deelnemers in deze groep.</p>
                <button
                  onClick={handleLoadTokens}
                  disabled={loadingTokens}
                  className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
                >
                  {loadingTokens ? 'Laden…' : '🪙 Laad token overzicht'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#555] text-xs">
                    Budget = 335 + bonus. Poule = wedstrijden 1–72. KO = landen picks.
                  </p>
                  <button
                    onClick={handleLoadTokens}
                    disabled={loadingTokens}
                    className="text-[10px] px-2 py-1 rounded bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white transition-colors"
                  >
                    ↺ Herlaad
                  </button>
                </div>
                <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                  <div className="grid grid-cols-[1fr_2.5rem_3rem_3rem_3rem_3.5rem] gap-1 px-3 py-2 text-[10px] text-[#444] uppercase" style={{ background: 'rgba(10,10,10,0.75)' }}>
                    <span>Naam</span>
                    <span className="text-right">Budget</span>
                    <span className="text-right">Poule</span>
                    <span className="text-right">KO</span>
                    <span className="text-right">Totaal</span>
                    <span className="text-right font-bold">Over/Onder</span>
                  </div>
                  {tokenUsage.map((entry) => {
                    const isOver = entry.over > 0
                    const isUnder = entry.over < 0
                    return (
                      <div
                        key={entry.initials}
                        className="grid grid-cols-[1fr_2.5rem_3rem_3rem_3rem_3.5rem] gap-1 px-3 py-2 border-t border-[#1a1a1a] text-sm"
                      >
                        <span className="font-medium text-white">
                          {entry.name} <span className="text-[#555] text-xs">{entry.initials}</span>
                        </span>
                        <span className="text-right text-[#888]">{entry.budget}</span>
                        <span className="text-right text-[#aaa]">{entry.poule}</span>
                        <span className="text-right text-[#aaa]">{entry.koPicks}</span>
                        <span className="text-right text-[#ccc] font-semibold">{entry.used}</span>
                        <span className={`text-right font-bold ${isOver ? 'text-[#E74C3C]' : isUnder ? 'text-[#2ECC71]' : 'text-[#555]'}`}>
                          {isOver ? `+${entry.over}` : entry.over === 0 ? '±0' : `${entry.over}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-[10px] text-[#444]">
                  Rood = te veel ingezet • Groen = nog ruimte over • {tokenUsage.filter(e => e.over > 0).length} deelnemer(s) over budget
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── KO Token diagnose ─────────────────────────────────────────────────── */}
        {tab === 'ko_tokens' && (
          <div>
            {!koTokenUsage ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-[#555] text-sm">Laad KO-wedstrijden tokengebruik voor alle deelnemers.</p>
                <button
                  onClick={handleLoadKoTokens}
                  disabled={loadingKoTokens}
                  className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
                >
                  {loadingKoTokens ? 'Laden…' : '🪙 Laad KO token overzicht'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#555] text-xs">
                    Budget = 65 + oranje bonus. Gereserveerd = min. 1 per toekomstige wedstrijd.
                  </p>
                  <button
                    onClick={handleLoadKoTokens}
                    disabled={loadingKoTokens}
                    className="text-[10px] px-2 py-1 rounded bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white transition-colors"
                  >
                    ↺ Herlaad
                  </button>
                </div>
                <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                  <div className="grid grid-cols-[1fr_2.5rem_2.5rem_3rem_3rem_2.5rem_3rem] gap-1 px-3 py-2 text-[10px] text-[#444] uppercase" style={{ background: 'rgba(10,10,10,0.75)' }}>
                    <span>Naam</span>
                    <span className="text-right">Base</span>
                    <span className="text-right">Bonus</span>
                    <span className="text-right">Budget</span>
                    <span className="text-right">Ingezet</span>
                    <span className="text-right">Res.</span>
                    <span className="text-right font-bold">Over</span>
                  </div>
                  {koTokenUsage.map((entry) => {
                    const isNeg = entry.remaining < 0
                    const isPos = entry.remaining > 0
                    return (
                      <div
                        key={entry.initials}
                        className="grid grid-cols-[1fr_2.5rem_2.5rem_3rem_3rem_2.5rem_3rem] gap-1 px-3 py-2 border-t border-[#1a1a1a] text-sm"
                      >
                        <span className="font-medium text-white">
                          {entry.name} <span className="text-[#555] text-xs">{entry.initials}</span>
                        </span>
                        <span className="text-right text-[#888]">{entry.base}</span>
                        <span className="text-right text-[#aaa]">{entry.oranjeBonus}</span>
                        <span className="text-right text-[#ccc]">{entry.budget}</span>
                        <span className="text-right text-[#aaa]">{entry.used}</span>
                        <span className="text-right text-[#666]">{entry.reserved}</span>
                        <span className={`text-right font-bold ${isNeg ? 'text-[#E74C3C]' : isPos ? 'text-[#2ECC71]' : 'text-[#555]'}`}>
                          {entry.remaining}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-[10px] text-[#444]">
                  Res. = gereserveerd voor wedstrijden zonder teams • Rood = te veel ingezet • {koTokenUsage.filter(e => e.remaining < 0).length} deelnemer(s) over budget
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Voortgang deelnemers ───────────────────────────────────────────────── */}
        {tab === 'voortgang' && (
          <div>
            {!voortgang ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-[#555] text-sm">Laad voortgang voor alle deelnemers in deze groep.</p>
                <button
                  onClick={handleLoadVoortgang}
                  disabled={loadingVoortgang}
                  className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
                >
                  {loadingVoortgang ? 'Laden…' : '✅ Laad voortgang'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#555] text-xs">Groen = klaar · Oranje = deels · Grijs = nog niet begonnen</p>
                  <button
                    onClick={handleLoadVoortgang}
                    disabled={loadingVoortgang}
                    className="text-[10px] px-2 py-1 rounded bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white transition-colors"
                  >
                    ↺ Herlaad
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <div className="rounded-xl border border-[#2a2a2a] overflow-hidden min-w-[580px]" style={{ background: 'rgba(22,22,22,0.82)' }}>
                    <div className="grid grid-cols-[1fr_3.5rem_3.5rem_4.5rem_3.5rem_3.5rem_2.5rem] gap-1 px-3 py-2 text-[10px] text-[#444] uppercase" style={{ background: 'rgba(10,10,10,0.75)' }}>
                      <span>Naam</span>
                      <span className="text-center">Toto</span>
                      <span className="text-center">Uitsl</span>
                      <span className="text-center">Tokens</span>
                      <span className="text-center">KO</span>
                      <span className="text-center">Fantasy</span>
                      <span className="text-center">🟠</span>
                    </div>
                    {voortgang.map((entry) => {
                      const cel = (count: number, total: number) => {
                        const done = count === total
                        const none = count === 0
                        const color = done ? 'text-[#2ECC71]' : none ? 'text-[#444]' : 'text-[#F39C12]'
                        return <span className={`text-center text-xs font-semibold tabular-nums ${color}`}>{count}/{total}</span>
                      }
                      const tokenColor = entry.tokensUsed > entry.tokensBudget ? 'text-[#E74C3C]' : entry.tokensUsed === entry.tokensBudget ? 'text-[#2ECC71]' : entry.tokensUsed === 0 ? 'text-[#444]' : 'text-[#F39C12]'
                      return (
                        <div
                          key={entry.initials}
                          className="grid grid-cols-[1fr_3.5rem_3.5rem_4.5rem_3.5rem_3.5rem_2.5rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center"
                        >
                          <span className="text-sm font-medium text-white">
                            {entry.name} <span className="text-[#555] text-xs">{entry.initials}</span>
                          </span>
                          {cel(entry.totoCount, 72)}
                          {cel(entry.uitslagCount, 72)}
                          <span className={`text-center text-xs font-semibold tabular-nums ${tokenColor}`}>{entry.tokensUsed}/{entry.tokensBudget}</span>
                          {cel(entry.koLandenCount, 63)}
                          {cel(entry.fantasyCount, 15)}
                          {cel(entry.oranjeCount, entry.oranjeTotal)}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-[#444]">
                  KO = 63 landen-slots (w1/w2/w3/r16/r8/r4/finale/winner) · Fantasy = 15 spelers · 🟠 = gepubliceerde vragen van anderen beantwoord
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Scores ─────────────────────────────────────────────────────────────── */}
        {tab === 'scores' && (
          <div>
            {!scores ? (
              <p className="text-[#555] text-sm">Klik op "Bereken scores" om de tussenstand te berekenen.</p>
            ) : (
              <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_2.5rem_4rem] gap-1 px-3 py-2 text-[10px] text-[#444] uppercase" style={{ background: 'rgba(10,10,10,0.75)' }}>
                  <span>#</span><span>Naam</span>
                  <span className="text-right">Poule</span>
                  <span className="text-right">KO</span>
                  <span className="text-right">KO W</span>
                  <span className="text-right">🟠</span>
                  <span className="text-right font-bold">Totaal</span>
                </div>
                {Object.values(scores)
                  .sort((a, b) => b.total - a.total)
                  .map((s, i) => (
                    <div key={s.initials}
                      className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_2.5rem_4rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center"
                    >
                      <span className="text-sm text-[#555]">{i + 1}</span>
                      <span className="text-sm font-bold text-white">{s.name}</span>
                      <span className="text-xs text-[#888] text-right">{s.poulefase}</span>
                      <span className="text-xs text-[#888] text-right">{s.knockout}</span>
                      <span className="text-xs text-[#888] text-right">{s.koWedstrijden ?? 0}</span>
                      <span className="text-xs text-[#555] text-right" title={`${s.oranjeTokens ?? 0} bonus tokens`}>{s.oranjeTokens ?? 0}t</span>
                      <span className="text-sm font-bold text-[#FF6B00] text-right">{s.total}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MatchdayAdminTab ──────────────────────────────────────────────────────────

function MatchdayAdminTab({ groupId }: { groupId: GroupId }) {
  const [matchdayId, setMatchdayId] = useState(1)
  const [quotes, setQuotes] = useState<Array<{ matchId: number; totoOdds: string; uitslagOdds: string }>>([])
  const [potStand, setPotStand] = useState('')
  const [rotations, setRotations] = useState<{ og: string[]; asc: string[] } | null>(null)
  const [rotationDirty, setRotationDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totoPredictions, setTotoPredictions] = useState<Record<number, Prediction>>({})
  const [customBets, setCustomBets] = useState<Array<{ description: string; matchIds: number[]; inzet: string; quotering: string }>>([])

  const useCustomBets = matchdayId >= (FIRST_CUSTOM_BET_MATCHDAY[groupId] ?? Infinity)

  useEffect(() => {
    setLoading(true)
    setSaved(false)
    const matchIds = getMatchesForMatchday(matchdayId)
    Promise.all([
      fetch(`/api/matchday/${matchdayId}`).then((r) => r.json()),
      fetch('/api/matchday/rotation').then((r) => r.json()),
    ]).then(([mdData, rotData]) => {
      setRotations(rotData)
      if (mdData.config) {
        const cfg = mdData.config
        const groupQuotes: Array<{ matchId: number; totoOdds?: number; uitslagOdds?: number }> =
          cfg[groupId]?.quotes ?? cfg.quotes ?? []
        setQuotes(
          matchIds.map((id) => {
            const existing = groupQuotes.find((q) => q.matchId === id)
            return {
              matchId: id,
              totoOdds: existing ? String(existing.totoOdds) : '',
              uitslagOdds: existing ? String(existing.uitslagOdds) : '',
            }
          })
        )
        setPotStand(String(cfg[groupId]?.potStand ?? ''))
        const existingBets: CustomBet[] = cfg[groupId]?.customBets ?? []
        setCustomBets(
          existingBets.length > 0
            ? existingBets.map((b) => ({
                description: b.description,
                matchIds: b.matchIds ?? [],
                inzet: String(b.inzet),
                quotering: String(b.quotering),
              }))
            : [{ description: '', matchIds: [], inzet: '', quotering: '' }]
        )
      } else {
        setQuotes(matchIds.map((id) => ({ matchId: id, totoOdds: '', uitslagOdds: '' })))
        setPotStand('')
        setCustomBets([{ description: '', matchIds: [], inzet: '', quotering: '' }])
      }
      const totoInit = rotData?.[groupId]?.[matchdayId - 1] ?? ''
      if (totoInit) {
        loadParticipantPredictions(totoInit).then(setTotoPredictions)
      } else {
        setTotoPredictions({})
      }
    }).finally(() => setLoading(false))
  }, [matchdayId, groupId])

  async function handleSave() {
    setLoading(true)
    const payload: Record<string, unknown> = {
      group: groupId,
      quotes: quotes.map((q) => {
        const totoOddsVal = parseFloat(q.totoOdds)
        const uitslagOddsVal = parseFloat(q.uitslagOdds)
        return {
          matchId: q.matchId,
          ...(isNaN(totoOddsVal) ? {} : { totoOdds: totoOddsVal }),
          ...(isNaN(uitslagOddsVal) ? {} : { uitslagOdds: uitslagOddsVal }),
        }
      }),
      potStand: parseFloat(potStand) || 0,
    }
    if (useCustomBets) {
      payload.customBets = customBets
        .filter((b) => b.description.trim() !== '')
        .map((b) => ({
          description: b.description,
          ...(b.matchIds.length > 0 ? { matchIds: b.matchIds } : {}),
          inzet: parseFloat(b.inzet) || 0,
          quotering: parseFloat(b.quotering) || 0,
        }))
    }
    const saves: Promise<unknown>[] = [
      fetch(`/api/matchday/${matchdayId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ]
    if (rotationDirty && rotations) {
      saves.push(
        fetch('/api/matchday/rotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group: groupId, rotation: rotations[groupId] }),
        })
      )
    }
    await Promise.all(saves)
    setRotationDirty(false)
    setSaved(true)
    setLoading(false)
  }

  const matchIds = getMatchesForMatchday(matchdayId)

  const totoInitials = rotations ? (rotations[groupId][matchdayId - 1] ?? '') : ''
  const totoName = totoInitials
    ? (PARTICIPANTS.find((p) => p.initials === totoInitials)?.name ?? '–')
    : '–'
  const groupParticipants = PARTICIPANTS.filter((p) => GROUP_MEMBERS[groupId].includes(p.initials))

  return (
    <div className="flex flex-col gap-4">
      {/* Matchday selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-[#888] font-heading uppercase tracking-wide shrink-0">Matchday</label>
        <select
          value={matchdayId}
          onChange={(e) => setMatchdayId(parseInt(e.target.value))}
          className="bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#FF6B00]"
        >
          {Array.from({ length: 27 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              MD {String(i + 1).padStart(2, '0')} — Wedstrijden {matchIds[0] || '?'}–{matchIds[matchIds.length - 1] || '?'}
            </option>
          ))}
        </select>
      </div>

      {useCustomBets ? (
        /* ── Custom bets (OG, MD15+) ── */
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
          <div className="px-3 py-2" style={{ background: 'rgba(10,10,10,0.75)' }}>
            <p className="font-heading text-sm font-bold text-white">Weddenschappen</p>
            <p className="text-[10px] text-[#555] mt-0.5">Voer 1 of 2 weddenschappen in voor deze matchday.</p>
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {customBets.map((bet, idx) => (
              <div key={idx} className="px-3 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B00] text-xs font-bold">#{idx + 1}</span>
                  {customBets.length > 1 && (
                    <button
                      onClick={() => setCustomBets((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-auto text-[10px] text-red-400 hover:text-red-300"
                    >
                      Verwijder
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] text-[#555]">Beschrijving</label>
                  <input
                    type="text"
                    value={bet.description}
                    onChange={(e) => setCustomBets((prev) => prev.map((b, i) => i === idx ? { ...b, description: e.target.value } : b))}
                    placeholder="bv. Duitsland wint van Brazilië"
                    className="bg-[#252525] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 w-full outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-[#555]">Wedstrijd(en)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {matchIds.map((id) => {
                      const m = MATCHES.find((x) => x.id === id)
                      const selected = bet.matchIds.includes(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCustomBets((prev) => prev.map((b, i) => i === idx ? {
                            ...b,
                            matchIds: selected ? b.matchIds.filter((mid) => mid !== id) : [...b.matchIds, id],
                          } : b))}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            selected
                              ? 'bg-[#FF6B00]/20 border-[#FF6B00]/50 text-[#FF6B00]'
                              : 'bg-[#252525] border-[#2a2a2a] text-[#888] hover:border-[#444]'
                          }`}
                        >
                          {m ? `${m.home} – ${m.away}` : `#${id}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-[#555]">Inzet (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bet.inzet}
                      onChange={(e) => setCustomBets((prev) => prev.map((b, i) => i === idx ? { ...b, inzet: e.target.value } : b))}
                      placeholder="1.00"
                      className="bg-[#252525] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 w-24 outline-none focus:border-[#FF6B00] [appearance:textfield]"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-[#555]">Quotering</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={bet.quotering}
                      onChange={(e) => setCustomBets((prev) => prev.map((b, i) => i === idx ? { ...b, quotering: e.target.value } : b))}
                      placeholder="bv. 3.50"
                      className="bg-[#252525] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 w-24 outline-none focus:border-[#FF6B00] [appearance:textfield]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {customBets.length < 2 && (
            <button
              onClick={() => setCustomBets((prev) => [...prev, { description: '', matchIds: [], inzet: '', quotering: '' }])}
              className="w-full py-2 text-xs text-[#FF6B00] hover:text-[#FF8C33] font-bold border-t border-[#1e1e1e]"
            >
              + Weddenschap toevoegen
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Toto van de dag */}
          <div className="rounded-xl border border-[#2a2a2a] p-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs text-[#555] uppercase font-heading tracking-wide mb-2">Toto van de dag</p>
            <select
              value={totoInitials}
              disabled={!rotations}
              onChange={(e) => {
                if (!rotations) return
                const updated = [...rotations[groupId]]
                updated[matchdayId - 1] = e.target.value
                setRotations({ ...rotations, [groupId]: updated })
                setRotationDirty(true)
              }}
              className="bg-[#252525] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-2 py-1.5 outline-none focus:border-[#FF6B00] w-full"
            >
              {groupParticipants.map((p) => (
                <option key={p.initials} value={p.initials}>{p.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-[#444] mt-1.5">
              Zet de bets op Unibet op basis van de voorspellingen van deze deelnemer.
            </p>
          </div>

          {/* Matches + quotes */}
          <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <div className="px-3 py-2" style={{ background: 'rgba(10,10,10,0.75)' }}>
              <p className="font-heading text-sm font-bold text-white">Unibet quoteringen</p>
              <p className="text-[10px] text-[#555] mt-0.5">Voer de live odds in op het moment van inzetten.</p>
            </div>
            <div className="divide-y divide-[#1e1e1e]">
              {quotes.map((q, idx) => {
                const match = MATCHES.find((m) => m.id === q.matchId)
                const pred = totoPredictions[q.matchId] ?? null
                return (
                  <div key={q.matchId} className="px-3 py-2.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#555] text-[10px] w-5">#{q.matchId}</span>
                      <span className="text-white text-sm font-bold">
                        {match ? `${match.home} – ${match.away}` : `Wedstrijd ${q.matchId}`}
                      </span>
                      {pred?.toto && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                          {pred.toto}
                        </span>
                      )}
                      {pred?.uitslag && (
                        <span className="text-[10px] font-heading font-bold text-white">
                          {pred.uitslag}
                        </span>
                      )}
                      {match && <span className="text-[#555] text-[10px] ml-auto">{match.date}</span>}
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] text-[#555]">Toto odds</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={q.totoOdds}
                          onChange={(e) => setQuotes((prev) => prev.map((x, i) => i === idx ? { ...x, totoOdds: e.target.value } : x))}
                          placeholder="bv. 3.50"
                          className="bg-[#252525] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 w-24 outline-none focus:border-[#FF6B00] [appearance:textfield]"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] text-[#555]">Uitslag odds</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={q.uitslagOdds}
                          onChange={(e) => setQuotes((prev) => prev.map((x, i) => i === idx ? { ...x, uitslagOdds: e.target.value } : x))}
                          placeholder="bv. 8.00"
                          className="bg-[#252525] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 w-24 outline-none focus:border-[#FF6B00] [appearance:textfield]"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Pot stand */}
      <div className="rounded-xl border border-[#2a2a2a] p-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
        <p className="font-heading text-sm font-bold text-white mb-2">Stand van de pot</p>
        <div className="flex items-center gap-1">
          <span className="text-[#888] text-sm">€</span>
          <input
            type="number"
            step="0.01"
            value={potStand}
            onChange={(e) => setPotStand(e.target.value)}
            placeholder="0.00"
            className="bg-[#252525] border border-[#2a2a2a] text-white text-sm rounded-lg px-2 py-1.5 w-28 outline-none focus:border-[#FF6B00] [appearance:textfield]"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="py-3 rounded-xl font-bold text-sm transition-colors"
        style={{
          background: saved ? '#2ECC71' : '#FF6B00',
          color: '#fff',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Opslaan...' : saved ? '✓ Opgeslagen' : 'Opslaan & activeren'}
      </button>
    </div>
  )
}

// ── KoMatchesTab ───────────────────────────────────────────────────────────────

const KO_ROUND_LABELS: Record<string, string> = {
  rv32: 'Ronde van 32',
  rv16: 'Ronde van 16',
  kf:   'Kwartfinales',
  hf:   'Halve finales',
  brons: '3e plaats',
  finale: 'Finale',
}

function KoMatchesTab({
  koMatchList, koMatchTeams, results, saving, onSaveTeam, onDeleteTeam, onSaveResult, onDeleteResult, savingResult, onEspnImport,
}: {
  koMatchList: import('@/lib/data/matches').Match[]
  koMatchTeams: KoMatchTeams
  results: Record<number, import('@/lib/scoring').MatchResult>
  saving: number | null
  onSaveTeam: (matchId: number, home: string, away: string) => Promise<void>
  onDeleteTeam: (matchId: number) => Promise<void>
  onSaveResult: (matchId: number, toto: '1' | 'X' | '2', uitslag: string) => Promise<void>
  onDeleteResult: (matchId: number) => Promise<void>
  savingResult: number | null
  onEspnImport?: (delta: Record<string, { goals: number; assists: number }>) => Promise<void>
}) {
  const [editHome, setEditHome] = useState<Record<number, string>>({})
  const [editAway, setEditAway] = useState<Record<number, string>>({})

  const rounds = ['rv32', 'rv16', 'kf', 'hf', 'brons', 'finale'] as const
  const byRound = Object.fromEntries(
    rounds.map((r) => [r, koMatchList.filter((m) => m.koRound === r)])
  )

  return (
    <div className="flex flex-col gap-6">
      {rounds.map((round) => {
        const matches = byRound[round] ?? []
        if (matches.length === 0) return null
        const assigned = matches.filter((m) => koMatchTeams[m.id]).length
        return (
          <div key={round} className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
              <span className="font-heading text-sm font-bold text-white">{KO_ROUND_LABELS[round]}</span>
              <span className="text-xs text-[#FF6B00] font-bold">{assigned} / {matches.length} teams</span>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {matches.map((m) => {
                const teams = koMatchTeams[m.id]
                const home = editHome[m.id] ?? teams?.home ?? ''
                const away = editAway[m.id] ?? teams?.away ?? ''
                const hasTeams = !!teams
                const result = results[m.id] ?? null

                return (
                  <div key={m.id} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#444] w-6 text-right">{m.id}</span>
                      <span className="text-[10px] text-[#555]">{m.date}</span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          value={home}
                          onChange={(e) => setEditHome((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="Thuis"
                          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
                        />
                        <span className="text-[10px] text-[#444]">vs</span>
                        <input
                          value={away}
                          onChange={(e) => setEditAway((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="Uit"
                          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!home.trim() || !away.trim()) return
                          await onSaveTeam(m.id, home, away)
                          setEditHome((prev) => { const n = { ...prev }; delete n[m.id]; return n })
                          setEditAway((prev) => { const n = { ...prev }; delete n[m.id]; return n })
                        }}
                        disabled={saving === m.id || !home.trim() || !away.trim()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FF6B00] text-white disabled:opacity-40 whitespace-nowrap"
                      >
                        {saving === m.id ? '…' : 'Sla op'}
                      </button>
                      {hasTeams && (
                        <button
                          onClick={() => onDeleteTeam(m.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#252525] text-[#888] hover:text-red-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {hasTeams && (
                      <div className="ml-8">
                        <MatchResultRow
                          match={{ ...m, home: teams.home, away: teams.away }}
                          result={result}
                          saving={savingResult === m.id}
                          onSave={(toto, uitslag) => onSaveResult(m.id, toto, uitslag)}
                          onDelete={() => onDeleteResult(m.id)}
                          onEspnImport={onEspnImport}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── MatchResultRow ─────────────────────────────────────────────────────────────

function MatchResultRow({ match, result, saving, onSave, onDelete, onEspnImport }: {
  match: typeof MATCHES[0]
  result: MatchResult | null
  saving: boolean
  onSave: (toto: '1' | 'X' | '2', uitslag: string) => void
  onDelete: () => void
  onEspnImport?: (delta: Record<string, { goals: number; assists: number }>) => Promise<void>
}) {
  const [toto, setToto] = useState<'1' | 'X' | '2'>(result?.toto ?? '1')
  const [uitslag, setUitslag] = useState(result?.uitslag ?? '')
  const [showPicker, setShowPicker] = useState(false)
  const [customUitslag, setCustomUitslag] = useState('')
  const [espnState, setEspnState] = useState<'idle' | 'loading' | 'preview' | 'error'>('idle')
  const [espnData, setEspnData] = useState<EspnImportPreview | null>(null)
  const [espnErr, setEspnErr] = useState('')
  const [importing, setImporting] = useState(false)

  const hasEspnId = !!ESPN_MATCH_IDS[match.id]
  const odds = match.id > 72 ? KO_MATCH_ODDS[match.id] : MATCH_ODDS[match.id]
  const hasOdds = Object.keys(odds?.scores ?? {}).length > 0

  async function fetchEspn() {
    setEspnState('loading')
    setEspnData(null)
    try {
      const res = await fetch(`/api/admin/espn-import?matchId=${match.id}`)
      const data = await res.json()
      if (!res.ok) { setEspnErr(data.error ?? 'Onbekende fout'); setEspnState('error'); return }
      setEspnData(data)
      setEspnState('preview')
    } catch {
      setEspnErr('Netwerk fout')
      setEspnState('error')
    }
  }

  async function applyEspnStats() {
    if (!espnData || !onEspnImport) return
    const delta: Record<string, { goals: number; assists: number }> = {}
    for (const p of espnData.matched) {
      delta[String(p.internalId)] = { goals: p.goals, assists: p.assists }
    }
    setImporting(true)
    await onEspnImport(delta)
    setImporting(false)
    setEspnState('idle')
  }

  function handleSelect(score: string) {
    setUitslag(score)
    setShowPicker(false)
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${result ? 'border-[#FF6B00]' : 'border-[#2a2a2a]'}`} style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Header — zelfde opbouw als MatchCard */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}
        >
          #{match.id}
        </div>

        {result && (
          <button
            onClick={onDelete}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-xs font-bold text-[#666] hover:border-red-500/40 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(37,37,37,0.8)' }}
          >
            wis
          </button>
        )}

        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.home)}</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date} · {match.stadium}
        </p>
      </div>

      {/* Controls row */}
      <div className="px-3 py-2.5 flex items-center gap-2">

        {/* Toto knoppen */}
        <div className="flex gap-1">
          {(['1', 'X', '2'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setToto(t)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors font-heading text-sm font-bold ${
                toto === t
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                  : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
              }`}
              style={toto !== t ? { color: MUTED } : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Uitslag knop — opent picker */}
        <button
          onClick={() => setShowPicker((p) => !p)}
          className={`font-heading h-9 px-3 rounded-lg text-sm font-bold transition-colors border flex items-center ${
            uitslag
              ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
              : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#FF6B00]'
          }`}
          style={!uitslag ? { color: MUTED } : undefined}
        >
          {uitslag ? uitslag.trim().replace(/\s*-\s*/, ' - ') : 'Uitslag'}
        </button>

        {/* ESPN knop */}
        {hasEspnId && (
          <button
            onClick={() => espnState === 'idle' || espnState === 'error' ? fetchEspn() : setEspnState('idle')}
            disabled={espnState === 'loading'}
            className={`h-9 px-2.5 rounded-lg border text-xs font-bold transition-colors ${
              espnState === 'preview'
                ? 'bg-[#1a6b8a]/20 border-[#1a6b8a]/60 text-[#4db8d4]'
                : 'bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#4db8d4] text-[#555]'
            }`}
          >
            {espnState === 'loading' ? '⏳' : '📡'}
          </button>
        )}

        {/* Opslaan */}
        <button
          onClick={() => uitslag.trim() && onSave(toto, uitslag.trim())}
          disabled={saving || !uitslag.trim()}
          className="ml-auto px-3 py-1.5 rounded-lg bg-[#2ECC71]/20 text-[#2ECC71] text-xs font-bold disabled:opacity-40 hover:bg-[#2ECC71]/30 transition-colors"
        >
          {saving ? '…' : result ? '↑ Update' : '+ Opslaan'}
        </button>
      </div>

      {/* Score picker */}
      {showPicker && (
        <div className="px-3 pb-3">
          {hasOdds ? (
            <ScorePicker matchId={match.id} toto={null} selected={uitslag || null} onSelect={handleSelect} />
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-[#2a2a2a]" style={{ background: 'rgba(10,10,10,0.75)' }}>
              <input
                value={customUitslag}
                onChange={(e) => setCustomUitslag(e.target.value)}
                placeholder="bijv. 2 - 1"
                className="flex-1 bg-[#252525] border border-[#2a2a2a] text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#FF6B00] text-center font-heading"
              />
              <button
                onClick={() => { if (customUitslag.trim()) { setUitslag(customUitslag.trim()); setCustomUitslag(''); setShowPicker(false) } }}
                disabled={!customUitslag.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-bold disabled:opacity-40 transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

      {/* ESPN preview panel */}
      {espnState === 'error' && (
        <div className="px-3 pb-3">
          <p className="text-xs text-[#E74C3C] px-1">{espnErr}</p>
        </div>
      )}
      {espnState === 'preview' && espnData && (
        <div className="px-3 pb-3 border-t border-[#1a1a1a]">
          <div className="rounded-xl border border-[#1a6b8a]/30 p-3" style={{ background: 'rgba(10,20,26,0.85)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#4db8d4] uppercase font-heading tracking-wide">ESPN · {espnData.status}</span>
              <button onClick={() => setEspnState('idle')} className="text-[#444] hover:text-[#888] text-xs leading-none">✕</button>
            </div>

            {/* Uitslag */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-heading text-lg font-bold text-white">{espnData.uitslag}</span>
              <span className="text-[10px] bg-[#FF6B00]/20 text-[#FF6B00] font-bold px-2 py-0.5 rounded">{espnData.toto}</span>
              {espnData.totalUitslag && (
                <span className="text-[10px] text-[#888]">n.v. {espnData.totalUitslag}</span>
              )}
              {espnData.penaltyWinner && (
                <span className="text-[10px] bg-[#4db8d4]/20 text-[#4db8d4] font-bold px-2 py-0.5 rounded">
                  P → {espnData.penaltyWinner === 'home' ? 'thuis' : 'uit'}
                </span>
              )}
              <button
                onClick={() => { setToto(espnData.toto); setUitslag(espnData.uitslag) }}
                className="ml-auto text-[10px] bg-[#1e1e1e] border border-[#333] text-white px-2 py-1 rounded-lg hover:border-[#FF6B00] transition-colors"
              >
                Uitslag overnemen
              </button>
            </div>

            {/* Gematchte spelers */}
            {espnData.matched.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {espnData.matched.map((p) => (
                  <div key={p.espnName} className="flex items-center gap-2 text-xs">
                    <span className="text-white font-bold flex-1 truncate">{p.internalName}</span>
                    {p.goals > 0 && <span className="text-[#FF6B00]">⚽ {p.goals}</span>}
                    {p.assists > 0 && <span className="text-[#888]">🅰 {p.assists}</span>}
                    <span className="text-[10px] text-[#444] shrink-0">{p.country}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Niet gematchte spelers */}
            {espnData.unmatched.length > 0 && (
              <div className="flex flex-col gap-1 mb-2 pt-2 border-t border-[#1a2a30]">
                <span className="text-[9px] text-[#E74C3C] uppercase font-heading tracking-wide">Niet gevonden in WK-spelers</span>
                {espnData.unmatched.map((p) => (
                  <div key={p.espnName} className="flex items-center gap-2 text-xs">
                    <span className="text-[#444] flex-1 truncate">{p.espnName}</span>
                    {p.goals > 0 && <span className="text-[#555]">⚽ {p.goals}</span>}
                    {p.assists > 0 && <span className="text-[#555]">🅰 {p.assists}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Geen goals */}
            {espnData.matched.length === 0 && espnData.unmatched.length === 0 && (
              <p className="text-xs text-[#444] italic mb-2">Geen doelpunten of assists gevonden</p>
            )}

            {/* Fantasy stats importeren */}
            {espnData.matched.length > 0 && onEspnImport && (
              <button
                onClick={applyEspnStats}
                disabled={importing}
                className="w-full mt-1 py-2 rounded-lg bg-[#2ECC71]/15 text-[#2ECC71] text-xs font-bold hover:bg-[#2ECC71]/25 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Bezig…' : `+ Fantasy stats toevoegen (${espnData.matched.length} speler${espnData.matched.length !== 1 ? 's' : ''})`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── AdminCorrectInvoer ────────────────────────────────────────────────────────

function AdminCorrectInvoer({ type, waarde, opponent, nedPlayers, oppPlayers, onChange }: {
  type: Exclude<AntwoordType, 'anders'>
  waarde: string | null
  opponent: string
  nedPlayers: string[]
  oppPlayers: string[]
  onChange: (v: string | null) => void
}) {
  const values = parseCorrectWaarden(waarde)
  function toggle(v: string) {
    const next = values.includes(v) ? values.filter((x) => x !== v) : [...values, v]
    onChange(next.length ? next.join('|') : null)
  }
  function addSpeler(v: string) {
    if (!v || values.includes(v)) return
    const next = [...values, v]
    onChange(next.join('|'))
  }
  function removeSpeler(v: string) {
    const next = values.filter((x) => x !== v)
    onChange(next.length ? next.join('|') : null)
  }

  if (type === 'ja_nee') {
    return (
      <div className="flex gap-1">
        {(['ja', 'nee'] as const).map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${values.includes(opt) ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt === 'ja' ? 'Ja' : 'Nee'}</button>
        ))}
      </div>
    )
  }
  if (type === 'nl_opp') {
    return (
      <div className="flex gap-1">
        {(['NL', 'OPP'] as const).map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${values.includes(opt) ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt === 'NL' ? 'Nederland' : opponent}</button>
        ))}
      </div>
    )
  }
  if (type === 'speler_nl' || type === 'speler_opp' || type === 'speler_beide') {
    const spelers = type === 'speler_nl' ? nedPlayers : type === 'speler_opp' ? oppPlayers : [...nedPlayers, ...oppPlayers]
    const remaining = ['geen', ...spelers].filter((n) => !values.includes(n))
    return (
      <div className="flex flex-col gap-1.5">
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.map((v) => (
              <span key={v} className="flex items-center gap-1 bg-[#FF6B00]/20 text-[#FF6B00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {v}
                <button onClick={() => removeSpeler(v)} className="hover:text-white leading-none">×</button>
              </span>
            ))}
          </div>
        )}
        {remaining.length > 0 && (
          <select value="" onChange={(e) => addSpeler(e.target.value)}
            className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 outline-none focus:border-[#FF6B00] max-w-[220px]"
          >
            <option value="">+ Voeg antwoord toe</option>
            {type === 'speler_beide' ? (
              <>
                <optgroup label="Nederland">{nedPlayers.filter((n) => !values.includes(n)).map((n) => <option key={n} value={n}>{n}</option>)}</optgroup>
                <optgroup label={opponent}>{oppPlayers.filter((n) => !values.includes(n)).map((n) => <option key={n} value={n}>{n}</option>)}</optgroup>
              </>
            ) : (
              remaining.map((n) => <option key={n} value={n}>{n}</option>)
            )}
          </select>
        )}
      </div>
    )
  }
  if (type === 'links_rechts') {
    return (
      <div className="flex gap-1">
        {(['links', 'rechts'] as const).map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${values.includes(opt) ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
        ))}
      </div>
    )
  }
  if (type === 'percentage') {
    return (
      <div className="flex items-center gap-2">
        <input type="number" min={0} max={100} value={waarde ?? ''} placeholder="0–100"
          onChange={(e) => { const v = parseInt(e.target.value, 10); onChange(isNaN(v) ? null : String(Math.min(100, Math.max(0, v)))) }}
          className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-20 outline-none focus:border-[#FF6B00] text-center [appearance:textfield]"
        />
        <span className="text-xs text-[#555]">% (deelnemers scoren bij ±5%)</span>
      </div>
    )
  }
  if (type === 'exact_aantal' || type === 'exact_aantal_hoog' || type === 'aantal_marge') {
    const MIN = type === 'exact_aantal_hoog' ? 22 : 0
    const MAX = type === 'exact_aantal_hoog' ? 32 : 22
    return (
      <div className="flex items-center gap-2">
        <input type="number" min={MIN} max={MAX} value={waarde ?? ''} placeholder={`${MIN}–${MAX}`}
          onChange={(e) => { const v = parseInt(e.target.value, 10); onChange(isNaN(v) ? null : String(Math.min(MAX, Math.max(MIN, v)))) }}
          className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-20 outline-none focus:border-[#FF6B00] text-center [appearance:textfield]"
        />
        <span className="text-xs text-[#555]">{type === 'aantal_marge' ? 'getal (deelnemers scoren bij ±1)' : 'exact getal'}</span>
      </div>
    )
  }
  if (type === 'aantal_marge_groot') {
    return (
      <div className="flex items-center gap-2">
        <input type="number" min={0} step={100000} value={waarde ?? ''} placeholder="bijv. 1200000"
          onChange={(e) => { const v = parseInt(e.target.value, 10); onChange(isNaN(v) ? null : String(Math.max(0, v))) }}
          className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-28 outline-none focus:border-[#FF6B00] text-center [appearance:textfield]"
        />
        <span className="text-xs text-[#555]">getal (deelnemers scoren bij ±100.000)</span>
      </div>
    )
  }
  if (type === 'decimaal') {
    return (
      <div className="flex items-center gap-2">
        <input type="number" min={0} max={20} step={0.01} value={waarde ?? ''} placeholder="0.00"
          onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? null : String(Math.min(20, Math.max(0, v)).toFixed(2))) }}
          className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-24 outline-none focus:border-[#FF6B00] text-center [appearance:textfield]"
        />
        <span className="text-xs text-[#555]">getal (deelnemers scoren bij ±0.33)</span>
      </div>
    )
  }
  if (type === 'minuut') {
    return (
      <div className="flex flex-wrap gap-1">
        {([...MINUUT_OPTIES, 'geen'] as const).map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${values.includes(opt) ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt}</button>
        ))}
      </div>
    )
  }
  // 'open' wordt afgehandeld via de beoordeling-UI, niet hier
  return null
}

// ── LinksPanel ─────────────────────────────────────────────────────────────────

function LinksPanel() {
  const [copied, setCopied] = useState<string | null>(null)
  const base = typeof window !== 'undefined' ? window.location.origin : ''

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${base}/?t=${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <div className="px-4 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <p className="font-heading text-sm font-bold text-white">Persoonlijke uitnodigingslinks</p>
        <p className="text-xs text-[#555] mt-0.5">Kopieer elke link en stuur via WhatsApp.</p>
      </div>
      <div className="divide-y divide-[#1e1e1e]">
        {PARTICIPANTS.map((p) => {
          const url = `${base}/?t=${p.token}`
          const isCopied = copied === p.token
          return (
            <div key={p.initials} className="flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-bold text-white w-20 shrink-0">{p.name}</span>
              <span className="text-xs text-[#555] flex-1 truncate font-mono">{url}</span>
              <button
                onClick={() => copyLink(p.token)}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  isCopied
                    ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                    : 'bg-[#252525] text-[#888] hover:text-white'
                }`}
              >
                {isCopied ? '✓ Gekopieerd' : 'Kopieer'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── StatStepper ────────────────────────────────────────────────────────────────

function StatStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-[10px] text-[#555] w-4">{label}</span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded-md bg-[#252525] text-[#888] text-xs font-bold hover:bg-[#333] hover:text-white transition-colors flex items-center justify-center"
      >−</button>
      <span className="w-5 text-center text-xs font-bold text-white">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-md bg-[#252525] text-[#888] text-xs font-bold hover:bg-[#333] hover:text-white transition-colors flex items-center justify-center"
      >+</button>
    </div>
  )
}

// ── FantasyStatsTab ────────────────────────────────────────────────────────────

type FantasySortKey = 'name' | 'country' | 'goals' | 'assists'
type FantasySortDir = 'asc' | 'desc'

function FantasyStatsTab({ stats, search, onSearchChange, onStatChange, onRemove }: {
  stats: FantasyStats
  search: string
  onSearchChange: (v: string) => void
  onStatChange: (playerId: string, field: 'goals' | 'assists', value: number) => void
  onRemove: (playerId: string) => void
}) {
  const [sortKey, setSortKey] = useState<FantasySortKey>('goals')
  const [sortDir, setSortDir] = useState<FantasySortDir>('desc')

  function toggleSort(key: FantasySortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' || key === 'country' ? 'asc' : 'desc') }
  }

  const q = search.toLowerCase()
  const filtered = q
    ? WK_PLAYERS.filter((p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)).slice(0, 20)
    : []

  const playerById = useMemo(() => {
    const map = new Map<string, typeof WK_PLAYERS[0]>()
    for (const p of WK_PLAYERS) map.set(String(p.id), p)
    return map
  }, [])

  const withStats = Object.entries(stats)
    .filter(([, s]) => s.goals > 0 || s.assists > 0)
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const pa = playerById.get(a[0])
      const pb = playerById.get(b[0])
      switch (sortKey) {
        case 'name': return dir * (pa?.name ?? a[0]).localeCompare(pb?.name ?? b[0])
        case 'country': return dir * (pa?.country ?? '').localeCompare(pb?.country ?? '')
        case 'goals': return dir * (a[1].goals - b[1].goals)
        case 'assists': return dir * (a[1].assists - b[1].assists)
      }
    })

  return (
    <div className="flex flex-col gap-4">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Zoek speler op naam of land…"
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
      />

      {q && filtered.length === 0 && (
        <p className="text-xs text-[#555] text-center py-2">Geen spelers gevonden</p>
      )}

      {filtered.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
          <div className="divide-y divide-[#1e1e1e]">
            {filtered.map((player) => {
              const pid = String(player.id)
              const s = stats[pid] ?? { goals: 0, assists: 0 }
              return (
                <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FlagImage country={player.country} size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{player.name}</div>
                    <div className="text-[10px] text-[#555]">{player.country} · {player.club}</div>
                  </div>
                  <StatStepper label="⚽" value={s.goals} onChange={(v) => onStatChange(pid, 'goals', v)} />
                  <StatStepper label="🅰" value={s.assists} onChange={(v) => onStatChange(pid, 'assists', v)} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {withStats.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
            <span className="font-heading text-sm font-bold text-white">Statistieken ingevoerd</span>
            <span className="text-xs text-[#FF6B00] font-bold">{withStats.length} speler{withStats.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#2a2a2a]" style={{ background: 'rgba(10,10,10,0.5)' }}>
            <span className="w-4" />
            <button onClick={() => toggleSort('name')} className="flex-1 text-left text-[10px] font-bold uppercase tracking-wider text-[#555] hover:text-[#FF6B00]">
              Naam {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button onClick={() => toggleSort('country')} className="text-[10px] font-bold uppercase tracking-wider text-[#555] hover:text-[#FF6B00] w-16 text-right">
              Land {sortKey === 'country' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button onClick={() => toggleSort('goals')} className="text-[10px] font-bold uppercase tracking-wider text-[#555] hover:text-[#FF6B00] w-10 text-right">
              ⚽ {sortKey === 'goals' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button onClick={() => toggleSort('assists')} className="text-[10px] font-bold uppercase tracking-wider text-[#555] hover:text-[#FF6B00] w-10 text-right">
              🅰 {sortKey === 'assists' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <span className="w-4" />
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {withStats.map(([id, s]) => {
              const player = playerById.get(id)
              return (
                <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                  {player && <FlagImage country={player.country} size={16} />}
                  <span className="text-sm font-bold text-white flex-1 truncate">{player?.name ?? id}</span>
                  {player && <span className="text-xs text-[#555] w-16 text-right">{player.country}</span>}
                  <span className="text-xs text-[#888] w-10 text-right">⚽ {s.goals}</span>
                  <span className="text-xs text-[#888] w-10 text-right">🅰 {s.assists}</span>
                  <button onClick={() => onRemove(id)} className="text-[10px] text-[#E74C3C] hover:text-[#E74C3C]/80 w-4 text-center">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!q && withStats.length === 0 && (
        <p className="text-xs text-[#555] text-center py-4">Zoek een speler om statistieken in te voeren</p>
      )}
    </div>
  )
}
