'use client'
import { useState, useMemo } from 'react'
import { MATCHES } from '@/lib/data/matches'
import { ALL_COUNTRIES } from '@/lib/data/countries'
import { FlagImage } from '@/components/ui/FlagImage'
import {
  saveResult, deleteResult, saveKoResults, saveOranjeResults, computeAndSaveScores,
} from '@/app/actions/admin'
import type { MatchResult, OranjeResult } from '@/lib/scoring'
import type { ParticipantScore } from '@/app/leaderboard/types'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { PARTICIPANTS } from '@/lib/participants'

const NED_MATCHES = [
  { id: 10, label: 'NED – JPN (14 jun)' },
  { id: 33, label: 'NED – ZWE (20 jun)' },
  { id: 58, label: 'TUN – NED (26 jun)' },
]
const TOGGLE_QS = ['q1','q2','q3','q4'] as const
const PLAYER_QS = ['q5','q6','q7','q8','q9'] as const
const Q_LABELS: Record<string, string> = {
  q1: 'Eerste ingooi', q2: 'Eerste corner', q3: 'Eerste vrije trap', q4: 'Eerste kaart',
  q5: 'Meeste km', q6: 'Meeste passes', q7: 'Meeste tackles', q8: 'Meeste schoten', q9: 'Buitenspel',
}

type Tab = 'matches' | 'knockout' | 'oranje' | 'scores' | 'links'

interface Props {
  initialResults: Record<number, MatchResult>
  initialKoResults: Record<string, string[]>
  initialOranjeResults: Record<number, OranjeResult>
}

export function AdminClient({ initialResults, initialKoResults, initialOranjeResults }: Props) {
  const [tab, setTab] = useState<Tab>('matches')
  const [results, setResults] = useState(initialResults)
  const [koResults, setKoResults] = useState(initialKoResults)
  const [oranjeResults, setOranjeResults] = useState(initialOranjeResults)
  const [scores, setScores] = useState<Record<string, ParticipantScore> | null>(null)
  const [computing, setComputing] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<number | null>(null)

  const filteredMatches = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? MATCHES.filter((m) => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || `${m.id}` === q)
      : MATCHES
  }, [search])

  // ── Match result handlers ──────────────────────────────────────────────────

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

  // ── KO results handler ────────────────────────────────────────────────────

  async function toggleKoCountry(roundId: string, country: string, max: number) {
    const current = koResults[roundId] ?? []
    const next = current.includes(country)
      ? current.filter((c) => c !== country)
      : current.length < max ? [...current, country] : current
    const updated = { ...koResults, [roundId]: next }
    setKoResults(updated)
    await saveKoResults(updated)
  }

  // ── Oranje results handler ─────────────────────────────────────────────────

  async function setOranjeQ(matchId: number, key: string, value: string | null) {
    const current = oranjeResults[matchId] ?? {}
    const updated = { ...oranjeResults, [matchId]: { ...current, [key]: value } }
    setOranjeResults(updated as Record<number, OranjeResult>)
    await saveOranjeResults(updated as Record<number, OranjeResult>)
  }

  // ── Compute scores ────────────────────────────────────────────────────────

  async function handleCompute() {
    setComputing(true)
    const s = await computeAndSaveScores()
    setScores(s)
    setComputing(false)
    setTab('scores')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'matches',  label: `Uitslagen (${Object.keys(results).length}/72)` },
    { id: 'knockout', label: 'KO Resultaten' },
    { id: 'oranje',   label: 'Oranje' },
    { id: 'scores',   label: 'Scores' },
    { id: 'links',    label: 'Uitnodigingslinks' },
  ]

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#FF6B00]">⚽ Admin — Panenka WK 2026</h1>
        <button
          onClick={handleCompute}
          disabled={computing}
          className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
        >
          {computing ? 'Bezig…' : '🔢 Bereken scores'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
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

      {/* ── Match results ──────────────────────────────────────────────────── */}
      {tab === 'matches' && (
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op land of match-ID…"
            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00] mb-4"
          />
          <div className="flex flex-col gap-2">
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

      {/* ── KO results ─────────────────────────────────────────────────────── */}
      {tab === 'knockout' && (
        <div className="flex flex-col gap-4">
          {KNOCKOUT_ROUNDS.map((round) => {
            const picked = koResults[round.id] ?? []
            return (
              <div key={round.id} className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#111] flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{round.label}</span>
                  <span className="text-xs text-[#FF6B00] font-bold">{picked.length} / {round.slots}</span>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {ALL_COUNTRIES.map((country) => (
                    <button
                      key={country}
                      onClick={() => toggleKoCountry(round.id, country, round.slots)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                        picked.includes(country)
                          ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                          : picked.length >= round.slots
                          ? 'text-[#333] cursor-not-allowed'
                          : 'bg-[#252525] text-[#888] hover:text-white'
                      }`}
                    >
                      <FlagImage country={country} size={12} />
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Oranje results ─────────────────────────────────────────────────── */}
      {tab === 'oranje' && (
        <div className="flex flex-col gap-4">
          {NED_MATCHES.map(({ id, label }) => {
            const ans = (oranjeResults[id] ?? {}) as unknown as Record<string, string | null>
            const nedMatch = MATCHES.find((m) => m.id === id)!
            const opp = nedMatch.home === 'Nederland' ? nedMatch.away : nedMatch.home
            return (
              <div key={id} className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#111]">
                  <span className="text-sm font-bold text-white">{label}</span>
                </div>
                <div className="p-3 flex flex-col gap-3">
                  {TOGGLE_QS.map((k) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-[#888]">{Q_LABELS[k]}</span>
                      <div className="flex gap-1">
                        {(['NED', 'OPP'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setOranjeQ(id, k, ans[k] === opt ? null : opt)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              ans[k] === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'
                            }`}
                          >
                            {opt === 'OPP' ? opp.slice(0, 3).toUpperCase() : 'NED'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {PLAYER_QS.map((k) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#888] flex-1">{Q_LABELS[k]}</span>
                      <input
                        value={ans[k] ?? ''}
                        onChange={(e) => setOranjeQ(id, k, e.target.value || null)}
                        placeholder="Spelernaam"
                        className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-36 outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Uitnodigingslinks ──────────────────────────────────────────────── */}
      {tab === 'links' && (
        <LinksPanel />
      )}

      {/* ── Scores ─────────────────────────────────────────────────────────── */}
      {tab === 'scores' && (
        <div>
          {!scores ? (
            <p className="text-[#555] text-sm">Klik op "Bereken scores" om de tussenstand te berekenen.</p>
          ) : (
            <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3rem_4rem] gap-1 px-3 py-2 bg-[#111] text-[10px] text-[#444] uppercase">
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
  )
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
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#111]">
        <p className="text-sm font-bold text-white">Persoonlijke uitnodigingslinks</p>
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

  return (
    <div className={`rounded-xl border p-3 ${result ? 'bg-[#161616] border-[#2ECC71]/20' : 'bg-[#111] border-[#2a2a2a]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#555]">#{match.id} · Poule {match.poule} · {match.date}</span>
        {result && (
          <button onClick={onDelete} className="text-[10px] text-[#E74C3C] hover:text-[#E74C3C]/80">✕ verwijder</button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-white flex-1 truncate">{match.home}</span>
        <span className="text-[#444] text-xs">vs</span>
        <span className="text-sm font-bold text-white flex-1 truncate text-right">{match.away}</span>
      </div>
      <div className="flex items-center gap-2">
        {(['1', 'X', '2'] as const).map((t) => (
          <button key={t} onClick={() => setToto(t)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              toto === t ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#888]'
            }`}
          >
            {t === '1' ? match.home.slice(0, 3) : t === '2' ? match.away.slice(0, 3) : 'X'}
          </button>
        ))}
        <input
          value={uitslag}
          onChange={(e) => setUitslag(e.target.value)}
          placeholder="2 - 1"
          className="bg-[#252525] border border-[#2a2a2a] text-xs text-white rounded-lg px-2 py-1.5 w-20 outline-none focus:border-[#FF6B00] text-center"
        />
        <button
          onClick={() => uitslag.trim() && onSave(toto, uitslag.trim())}
          disabled={saving || !uitslag.trim()}
          className="ml-auto px-3 py-1.5 rounded-lg bg-[#2ECC71]/20 text-[#2ECC71] text-xs font-bold disabled:opacity-40 hover:bg-[#2ECC71]/30 transition-colors"
        >
          {saving ? '…' : result ? '↑ Update' : '+ Sla op'}
        </button>
      </div>
    </div>
  )
}
