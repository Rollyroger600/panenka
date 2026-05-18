'use client'
import { useMemo } from 'react'
import { FlagImage } from '@/components/ui/FlagImage'
import { abbrevCountry } from '@/lib/helpers'
import { PARTICIPANTS } from '@/lib/participants'
import { WK_PLAYERS } from '@/lib/data/players'
import type { Match } from '@/lib/data/matches'
import type { OranjeVraag, OranjeAntwoordenMap } from '@/lib/types/oranjeVragen'
import { MINUUT_OPTIES } from '@/lib/types/oranjeVragen'

interface Props {
  match: Match
  vragen: Record<string, OranjeVraag>          // authorInitials → vraag
  antwoorden: OranjeAntwoordenMap
  mijnInitials: string
  onAntwoord: (matchId: number, authorInitials: string, waarde: string | null) => void
  readOnly: boolean
}

export function VragenBeantwoordenCard({ match, vragen, antwoorden, mijnInitials, onAntwoord, readOnly }: Props) {
  const opponent = match.home === 'Nederland' ? match.away : match.home

  const nedPlayers = useMemo(
    () => WK_PLAYERS.filter((p) => p.country === 'Nederland').sort((a, b) => b.overall - a.overall),
    [],
  )
  const oppPlayers = useMemo(
    () => WK_PLAYERS.filter((p) => p.country === opponent).sort((a, b) => b.overall - a.overall),
    [opponent],
  )

  const gepubliceerdeVragen = PARTICIPANTS.filter(
    (p) => vragen[p.initials.toLowerCase()]?.gepubliceerd,
  )

  const matchAntwoorden = antwoorden[match.id] ?? {}

  if (gepubliceerdeVragen.length === 0) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 text-center text-xs text-[#444]" style={{ background: 'rgba(22,22,22,0.82)' }}>
        Nog geen vragen gepubliceerd voor{' '}
        <span className="text-[#666]">
          {match.home === 'Nederland' ? 'Nederland' : match.away} – {opponent}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#FF6B00]/30 overflow-hidden mb-4" style={{ background: 'rgba(22,22,22,0.82)' }}>
      {/* Header */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}>
          # {match.id}
        </div>
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.home)}</span>
          <span className="font-heading font-bold text-[#7e7667]">-</span>
          <span className="font-accent font-light text-sm text-white">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="font-heading font-light text-[12px] uppercase tracking-widest mt-0.5 text-[#7e7667]">
          {match.date} · {match.stadium}
        </p>
        <span className="text-[10px] text-[#555] mt-0.5">
          {Object.values(matchAntwoorden).filter(Boolean).length}/{gepubliceerdeVragen.length} ingevuld
        </span>
      </div>

      <div className="divide-y divide-[#1e1e1e]">
        {gepubliceerdeVragen.map((auteur) => {
          const key = auteur.initials.toLowerCase()
          const vraag = vragen[key]!
          const effectiefType = vraag.adminType ?? (vraag.type !== 'anders' ? vraag.type : null)
          const huidigAntwoord = matchAntwoorden[key] ?? null

          return (
            <div key={key} className="px-4 py-3 flex flex-col gap-2">
              {/* Vraagregel */}
              <div className="flex items-start gap-2">
                <FlagImage country="Nederland" size={16} className="shrink-0 mt-0.5 opacity-60" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#555] font-bold">{auteur.name}</span>
                  <p className="text-sm text-white leading-snug">{vraag.tekst}</p>
                </div>
              </div>

              {/* Antwoordinvoer */}
              {effectiefType && !readOnly && (
                <AntwoordInvoer
                  type={effectiefType}
                  waarde={huidigAntwoord}
                  opponent={opponent}
                  nedPlayers={nedPlayers.map((p) => p.name)}
                  oppPlayers={oppPlayers.map((p) => p.name)}
                  onChange={(v) => onAntwoord(match.id, key, v)}
                />
              )}

              {/* Read-only weergave */}
              {readOnly && huidigAntwoord && (
                <span className="text-xs text-[#FF6B00] font-bold bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-0.5 rounded-lg self-start">
                  {huidigAntwoord}{effectiefType === 'percentage' ? '%' : ''}
                </span>
              )}
              {readOnly && !huidigAntwoord && (
                <span className="text-xs text-[#333]">— niet ingevuld</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Invoerveld per type ───────────────────────────────────────────────────

interface InvoerProps {
  type: Exclude<import('@/lib/types/oranjeVragen').AntwoordType, 'anders'>
  waarde: string | null
  opponent: string
  nedPlayers: string[]
  oppPlayers: string[]
  onChange: (v: string | null) => void
}

function AntwoordInvoer({ type, waarde, opponent, nedPlayers, oppPlayers, onChange }: InvoerProps) {
  if (type === 'ja_nee') {
    return (
      <div className="flex gap-2">
        {(['ja', 'nee'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(waarde === opt ? null : opt)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
              waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'
            }`}
          >
            {opt === 'ja' ? 'Ja' : 'Nee'}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'nl_opp') {
    return (
      <div className="flex gap-2">
        {(['NL', 'OPP'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(waarde === opt ? null : opt)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'
            }`}
          >
            {opt === 'NL' ? 'Nederland' : opponent}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'speler_nl' || type === 'speler_opp') {
    const spelers = type === 'speler_nl' ? nedPlayers : oppPlayers
    return (
      <select
        value={waarde ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]"
      >
        <option value="">— Kies een speler</option>
        {spelers.map((naam) => (
          <option key={naam} value={naam}>{naam}</option>
        ))}
      </select>
    )
  }

  if (type === 'percentage') {
    const num = waarde ? parseInt(waarde, 10) : null
    function clamp(v: number) { return Math.min(100, Math.max(0, v)) }
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(String(clamp((num ?? 50) - 5)))}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >−5</button>
        <input
          type="number"
          min={0}
          max={100}
          value={waarde ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            onChange(isNaN(v) ? null : String(clamp(v)))
          }}
          placeholder="0–100"
          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-sm text-white text-center outline-none focus:border-[#FF6B00] [appearance:textfield]"
        />
        <span className="text-sm text-[#555]">%</span>
        <button
          onClick={() => onChange(String(clamp((num ?? 50) + 5)))}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >+5</button>
      </div>
    )
  }

  if (type === 'minuut') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {MINUUT_OPTIES.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(waarde === opt ? null : opt)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'open') {
    return (
      <input
        type="text"
        value={waarde ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Typ jouw antwoord…"
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#666] outline-none focus:border-[#FF6B00]"
      />
    )
  }

  return null
}
