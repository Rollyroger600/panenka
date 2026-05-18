'use client'
import { useState, useMemo, useEffect } from 'react'
import { MATCHES } from '@/lib/data/matches'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { FlagImage } from '@/components/ui/FlagImage'
import { ScorePicker } from '@/components/matches/ScorePicker'
import { MATCH_ODDS } from '@/lib/data/odds'
import { abbrevCountry } from '@/lib/helpers'
import {
  saveResult, deleteResult, saveKoResults, saveOranjeResults, computeAndSaveScores,
  updateOranjeVraag, saveOranjeCorrect, saveOranjeBeoordeling,
  saveFantasyStats, setAdminGroup,
} from '@/app/actions/admin'
import { getMatchesForMatchday } from '@/lib/data/matchdayMap'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { FantasyStats } from '@/lib/scoring'
import type { MatchResult, OranjeResult } from '@/lib/scoring'
import type { ParticipantScore } from '@/app/leaderboard/types'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { PARTICIPANTS } from '@/lib/participants'
import type { OranjeVragenMap, OranjeCorrectMap, OranjeBeoordeling, OranjeAntwoordenMap, AntwoordType } from '@/lib/types/oranjeVragen'
import { ANTWOORD_TYPE_LABELS, MINUUT_OPTIES } from '@/lib/types/oranjeVragen'
import { WK_PLAYERS } from '@/lib/data/players'

const MUTED = '#7e7667'

const NED_MATCHES = [
  { id: 10, label: 'NED – JPN (14 jun)' },
  { id: 33, label: 'NED – ZWE (20 jun)' },
  { id: 58, label: 'TUN – NED (26 jun)' },
]

type Tab = 'matches' | 'knockout' | 'vragen' | 'fantasy' | 'scores' | 'links' | 'matchday'

interface Props {
  groupId: GroupId
  initialResults: Record<number, MatchResult>
  initialKoResults: Record<string, string[]>
  initialOranjeResults: Record<number, OranjeResult>
  initialOranjeVragen: OranjeVragenMap
  initialOranjeCorrect: OranjeCorrectMap
  initialOranjeBeoordeling: OranjeBeoordeling
  initialAlleAntwoorden: Record<string, OranjeAntwoordenMap>
  initialFantasyStats: FantasyStats
}

export function AdminClient({ groupId, initialResults, initialKoResults, initialOranjeResults, initialOranjeVragen, initialOranjeCorrect, initialOranjeBeoordeling, initialAlleAntwoorden, initialFantasyStats }: Props) {
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
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [fantasyStats, setFantasyStats] = useState<FantasyStats>(initialFantasyStats)
  const [fantasySearch, setFantasySearch] = useState('')

  const filteredMatches = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? MATCHES.filter((m) => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || `${m.id}` === q)
      : MATCHES
  }, [search])

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

  async function handleFantasyStat(playerName: string, field: 'goals' | 'assists', value: number) {
    const current = fantasyStats[playerName] ?? { goals: 0, assists: 0 }
    const updated = { ...fantasyStats, [playerName]: { ...current, [field]: value } }
    setFantasyStats(updated)
    await saveFantasyStats(updated)
  }

  async function handleFantasyRemove(playerName: string) {
    const updated = { ...fantasyStats }
    delete updated[playerName]
    setFantasyStats(updated)
    await saveFantasyStats(updated)
  }

  async function handleCompute() {
    setComputing(true)
    const s = await computeAndSaveScores(groupId)
    setScores(s)
    setComputing(false)
    setTab('scores')
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
    const next: OranjeBeoordeling = JSON.parse(JSON.stringify(oranjeBeoordeling))
    if (!next[matchId]) next[matchId] = {}
    if (!next[matchId][questionKey]) next[matchId][questionKey] = {}
    if (correct === null) {
      delete next[matchId][questionKey][participantKey]
    } else {
      next[matchId][questionKey][participantKey] = correct
    }
    setOranjeBeoordeling(next)
    await saveOranjeBeoordeling(next, groupId)
  }

  async function handleAdminType(matchId: number, initials: string, adminType: Exclude<AntwoordType, 'anders'>) {
    await updateOranjeVraag(matchId, initials, { adminType }, groupId)
    setOranjeVragen((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [initials.toLowerCase()]: { ...prev[matchId]?.[initials.toLowerCase()], adminType } },
    }))
  }

  async function handleCorrectAntwoord(matchId: number, initials: string, waarde: string | null) {
    const next: OranjeCorrectMap = {
      ...oranjeCorrect,
      [matchId]: { ...(oranjeCorrect[matchId] ?? {}), [initials.toLowerCase()]: waarde },
    }
    setOranjeCorrect(next)
    await saveOranjeCorrect(next, groupId)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'matches',  label: `Uitslagen (${Object.keys(results).length}/72)` },
    { id: 'knockout', label: 'KO Resultaten' },
    { id: 'vragen',   label: 'Oranje Vragen' },
    { id: 'fantasy',  label: `Fantasy (${Object.keys(fantasyStats).length})` },
    { id: 'scores',   label: 'Scores' },
    { id: 'links',    label: 'Links' },
    { id: 'matchday', label: '📅 Matchday' },
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
                                <p className="text-sm text-white leading-snug">{vraag.tekst}</p>
                              ) : (
                                <p className="text-xs text-[#333] italic">Nog geen vraag ingediend</p>
                              )}
                            </div>
                            {vraag && (
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
                              {vraag.type === 'anders' && (
                                <>
                                  {vraag.suggestie && (
                                    <span className="text-[10px] text-[#555] italic">"{vraag.suggestie}"</span>
                                  )}
                                  <select
                                    value={vraag.adminType ?? ''}
                                    onChange={(e) => handleAdminType(id, key, e.target.value as Exclude<AntwoordType, 'anders'>)}
                                    className="bg-[#252525] border border-[#2a2a2a] text-[10px] text-white rounded-lg px-2 py-1 outline-none focus:border-[#FF6B00]"
                                  >
                                    <option value="">→ Kies type</option>
                                    {(['ja_nee', 'nl_opp', 'speler_nl', 'speler_opp', 'percentage', 'minuut', 'open'] as const).map((t) => (
                                      <option key={t} value={t}>{ANTWOORD_TYPE_LABELS[t]}</option>
                                    ))}
                                  </select>
                                </>
                              )}
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

        {/* ── Scores ─────────────────────────────────────────────────────────────── */}
        {tab === 'scores' && (
          <div>
            {!scores ? (
              <p className="text-[#555] text-sm">Klik op "Bereken scores" om de tussenstand te berekenen.</p>
            ) : (
              <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
                <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3rem_4rem] gap-1 px-3 py-2 text-[10px] text-[#444] uppercase" style={{ background: 'rgba(10,10,10,0.75)' }}>
                  <span>#</span><span>Naam</span>
                  <span className="text-right">Poule</span>
                  <span className="text-right">KO</span>
                  <span className="text-right">Oranje</span>
                  <span className="text-right font-bold">Totaal</span>
                </div>
                {Object.values(scores)
                  .sort((a, b) => b.total - a.total)
                  .map((s, i) => (
                    <div key={s.initials}
                      className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3rem_4rem] gap-1 px-3 py-2.5 border-t border-[#1a1a1a] items-center"
                    >
                      <span className="text-sm text-[#555]">{i + 1}</span>
                      <span className="text-sm font-bold text-white">{s.name}</span>
                      <span className="text-xs text-[#888] text-right">{s.poulefase}</span>
                      <span className="text-xs text-[#888] text-right">{s.knockout}</span>
                      <span className="text-xs text-[#888] text-right">{s.oranje}</span>
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
  const [potStandOg, setPotStandOg] = useState('')
  const [potStandAsc, setPotStandAsc] = useState('')
  const [rotations, setRotations] = useState<{ og: string[]; asc: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load existing config + rotation when matchday changes
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
        setQuotes(
          matchIds.map((id) => {
            const existing = cfg.quotes.find((q: { matchId: number }) => q.matchId === id)
            return {
              matchId: id,
              totoOdds: existing ? String(existing.totoOdds) : '',
              uitslagOdds: existing ? String(existing.uitslagOdds) : '',
            }
          })
        )
        setPotStandOg(String(cfg.og.potStand))
        setPotStandAsc(String(cfg.asc.potStand))
      } else {
        setQuotes(matchIds.map((id) => ({ matchId: id, totoOdds: '', uitslagOdds: '' })))
        setPotStandOg('')
        setPotStandAsc('')
      }
    }).finally(() => setLoading(false))
  }, [matchdayId])

  async function handleSave() {
    setLoading(true)
    const payload = {
      quotes: quotes.map((q) => ({
        matchId: q.matchId,
        totoOdds: parseFloat(q.totoOdds) || 0,
        uitslagOdds: parseFloat(q.uitslagOdds) || 0,
      })),
      og: { potStand: parseFloat(potStandOg) || 0 },
      asc: { potStand: parseFloat(potStandAsc) || 0 },
    }
    await fetch(`/api/matchday/${matchdayId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaved(true)
    setLoading(false)
  }

  const matchIds = getMatchesForMatchday(matchdayId)

  const totoOgName = rotations
    ? (PARTICIPANTS.find((p) => p.initials === rotations.og[matchdayId - 1])?.name ?? '–')
    : '...'
  const totoAscName = rotations
    ? (PARTICIPANTS.find((p) => p.initials === rotations.asc[matchdayId - 1])?.name ?? '–')
    : '...'

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

      {/* Toto van de dag */}
      <div className="rounded-xl border border-[#2a2a2a] p-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
        <p className="text-xs text-[#555] uppercase font-heading tracking-wide mb-2">Toto van de dag</p>
        <div className="flex gap-6">
          <div>
            <span className="text-[#FF6B00] text-xs font-bold uppercase mr-1">OG:</span>
            <span className="text-white text-sm font-bold">{totoOgName}</span>
          </div>
          <div>
            <span className="text-[#FF6B00] text-xs font-bold uppercase mr-1">ASC:</span>
            <span className="text-white text-sm font-bold">{totoAscName}</span>
          </div>
        </div>
        <p className="text-[10px] text-[#444] mt-1.5">
          Rotatie wordt automatisch gegenereerd. Zet de bets op Unibet op basis van de voorspellingen van deze deelnemer.
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
            return (
              <div key={q.matchId} className="px-3 py-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#555] text-[10px] w-5">#{q.matchId}</span>
                  <span className="text-white text-sm font-bold">
                    {match ? `${match.home} – ${match.away}` : `Wedstrijd ${q.matchId}`}
                  </span>
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

      {/* Pot stand */}
      <div className="rounded-xl border border-[#2a2a2a] p-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
        <p className="font-heading text-sm font-bold text-white mb-2">Stand van de pot</p>
        <div className="flex gap-4">
          {(['og', 'asc'] as const).map((g) => (
            <div key={g} className="flex flex-col gap-0.5">
              <label className="text-[10px] text-[#555] uppercase font-bold">{g.toUpperCase()}</label>
              <div className="flex items-center gap-1">
                <span className="text-[#888] text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={g === 'og' ? potStandOg : potStandAsc}
                  onChange={(e) => g === 'og' ? setPotStandOg(e.target.value) : setPotStandAsc(e.target.value)}
                  placeholder="0.00"
                  className="bg-[#252525] border border-[#2a2a2a] text-white text-sm rounded-lg px-2 py-1.5 w-28 outline-none focus:border-[#FF6B00] [appearance:textfield]"
                />
              </div>
            </div>
          ))}
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

// ── MatchResultRow ─────────────────────────────────────────────────────────────

function MatchResultRow({ match, result, saving, onSave, onDelete }: {
  match: typeof MATCHES[0]
  result: MatchResult | null
  saving: boolean
  onSave: (toto: '1' | 'X' | '2', uitslag: string) => void
  onDelete: () => void
}) {
  const [toto, setToto] = useState<'1' | 'X' | '2'>(result?.toto ?? '1')
  const [uitslag, setUitslag] = useState(result?.uitslag ?? '')
  const [showPicker, setShowPicker] = useState(false)
  const [customUitslag, setCustomUitslag] = useState('')

  const hasOdds = Object.keys(MATCH_ODDS[match.id]?.scores ?? {}).length > 0

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
          {uitslag || 'Uitslag'}
        </button>

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
  if (type === 'ja_nee') {
    return (
      <div className="flex gap-1">
        {(['ja', 'nee'] as const).map((opt) => (
          <button key={opt} onClick={() => onChange(waarde === opt ? null : opt)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt === 'ja' ? 'Ja' : 'Nee'}</button>
        ))}
        {waarde && <span className="text-[10px] text-[#555] self-center ml-1">Correct: <b className="text-white">{waarde}</b></span>}
      </div>
    )
  }
  if (type === 'nl_opp') {
    return (
      <div className="flex gap-1">
        {(['NL', 'OPP'] as const).map((opt) => (
          <button key={opt} onClick={() => onChange(waarde === opt ? null : opt)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
          >{opt === 'NL' ? 'Nederland' : opponent}</button>
        ))}
      </div>
    )
  }
  if (type === 'speler_nl' || type === 'speler_opp') {
    const spelers = type === 'speler_nl' ? nedPlayers : oppPlayers
    return (
      <select value={waarde ?? ''} onChange={(e) => onChange(e.target.value || null)}
        className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 outline-none focus:border-[#FF6B00] max-w-[200px]"
      >
        <option value="">— Correct antwoord</option>
        {spelers.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
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
  if (type === 'minuut') {
    return (
      <div className="flex flex-wrap gap-1">
        {MINUUT_OPTIES.map((opt) => (
          <button key={opt} onClick={() => onChange(waarde === opt ? null : opt)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'}`}
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

function FantasyStatsTab({ stats, search, onSearchChange, onStatChange, onRemove }: {
  stats: FantasyStats
  search: string
  onSearchChange: (v: string) => void
  onStatChange: (name: string, field: 'goals' | 'assists', value: number) => void
  onRemove: (name: string) => void
}) {
  const q = search.toLowerCase()
  const filtered = q
    ? WK_PLAYERS.filter((p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)).slice(0, 20)
    : []

  const withStats = Object.entries(stats)
    .filter(([, s]) => s.goals > 0 || s.assists > 0)
    .sort((a, b) => (b[1].goals + b[1].assists) - (a[1].goals + a[1].assists))

  return (
    <div className="flex flex-col gap-4">
      {withStats.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
            <span className="font-heading text-sm font-bold text-white">Statistieken ingevoerd</span>
            <span className="text-xs text-[#FF6B00] font-bold">{withStats.length} speler{withStats.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {withStats.map(([name, s]) => {
              const player = WK_PLAYERS.find((p) => p.name === name)
              return (
                <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                  {player && <FlagImage country={player.country} size={16} />}
                  <span className="text-sm font-bold text-white flex-1 truncate">{name}</span>
                  {player && <span className="text-xs text-[#555]">{player.country}</span>}
                  <span className="text-xs text-[#888]">⚽ {s.goals}</span>
                  <span className="text-xs text-[#888]">🅰 {s.assists}</span>
                  <button onClick={() => onRemove(name)} className="text-[10px] text-[#E74C3C] hover:text-[#E74C3C]/80 ml-1">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              const s = stats[player.name] ?? { goals: 0, assists: 0 }
              return (
                <div key={player.name} className="flex items-center gap-3 px-4 py-2.5">
                  <FlagImage country={player.country} size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{player.name}</div>
                    <div className="text-[10px] text-[#555]">{player.country} · {player.club}</div>
                  </div>
                  <StatStepper label="⚽" value={s.goals} onChange={(v) => onStatChange(player.name, 'goals', v)} />
                  <StatStepper label="🅰" value={s.assists} onChange={(v) => onStatChange(player.name, 'assists', v)} />
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
