'use client'
import { useMemo, useState } from 'react'
import { FlagImage } from '@/components/ui/FlagImage'
import { abbrevCountry } from '@/lib/helpers'
import { PARTICIPANTS } from '@/lib/participants'
import { WK_PLAYERS } from '@/lib/data/players'
import { parseCorrectWaarden, isAntwoordCorrect } from '@/lib/types/oranjeVragen'
import type { Participant } from '@/lib/participants'
import type { Match } from '@/lib/data/matches'
import type { OranjeVraag, OranjeAntwoordenMap, OranjeBeoordeling } from '@/lib/types/oranjeVragen'
import { MINUUT_OPTIES } from '@/lib/types/oranjeVragen'
import { getWKSquadStatus } from '@/lib/wkSquadCheck'

interface Props {
  match: Match
  vragen: Record<string, OranjeVraag>          // authorInitials → vraag
  antwoorden: OranjeAntwoordenMap              // mijn eigen antwoorden
  correctMap: Record<string, string | null>    // questionAuthorKey → correct antwoord
  beoordeling: Record<string, Record<string, boolean>>  // questionAuthorKey → participantKey → isCorrect
  alleAntwoorden: Record<string, OranjeAntwoordenMap>  // initials → antwoordenMap
  groupParticipants: Participant[]
  mijnInitials: string
  onAntwoord: (matchId: number, authorInitials: string, waarde: string | null) => void
  readOnly: boolean
}

export function VragenBeantwoordenCard({
  match, vragen, antwoorden, correctMap, beoordeling, alleAntwoorden, groupParticipants,
  mijnInitials, onAntwoord, readOnly,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const opponent = match.home === 'Nederland' ? match.away : match.home

  const nedPlayers = useMemo(
    () => WK_PLAYERS.filter((p) => p.country === 'Nederland' && getWKSquadStatus(p) === 'confirmed').sort((a, b) => b.overall - a.overall),
    [],
  )
  const oppPlayers = useMemo(
    () => WK_PLAYERS.filter((p) => p.country === opponent && getWKSquadStatus(p) === 'confirmed').sort((a, b) => b.overall - a.overall),
    [opponent],
  )

  const gepubliceerdeVragen = PARTICIPANTS.filter(
    (p) => vragen[p.initials.toLowerCase()]?.gepubliceerd,
  )

  const matchAntwoorden = antwoorden[match.id] ?? {}

  if (gepubliceerdeVragen.length === 0) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] p-4 text-center text-xs text-[#444]" style={{ background: 'rgba(22,22,22,0.82)' }}>
        Nog geen vragen gepubliceerd voor{' '}
        <span className="text-[#666]">
          {abbrevCountry(match.home)} – {abbrevCountry(match.away)}
        </span>
      </div>
    )
  }

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {gepubliceerdeVragen.map((auteur) => {
        const key = auteur.initials.toLowerCase()
        const vraag = vragen[key]!
        const effectiefType = vraag.adminType ?? (vraag.type !== 'anders' ? vraag.type : null)
        const huidigAntwoord = matchAntwoorden[key] ?? null
        const isExpanded = expandedKeys.has(key)

        const correctAntwoord = correctMap?.[key] ?? null
        const correctValues = parseCorrectWaarden(correctAntwoord)
        const heeftCorrectAntwoord = correctValues.length > 0
        const participantKey = mijnInitials.toLowerCase()
        const beoordelingVoorVraag = beoordeling?.[key]
        const heeftBeoordeling = beoordelingVoorVraag?.[participantKey] !== undefined
        const isCorrect = heeftCorrectAntwoord
          ? huidigAntwoord !== null && isAntwoordCorrect(huidigAntwoord, correctValues, effectiefType ?? null)
          : heeftBeoordeling && beoordelingVoorVraag[participantKey] === true
        const isWrong = heeftCorrectAntwoord
          ? huidigAntwoord !== null && !isAntwoordCorrect(huidigAntwoord, correctValues, effectiefType ?? null)
          : heeftBeoordeling && beoordelingVoorVraag[participantKey] === false

        return (
          <div
            key={key}
            className="rounded-xl border border-[#2a2a2a] p-4 flex flex-col gap-3"
            style={{ background: 'rgba(22,22,22,0.82)' }}
          >
            {/* Vraagregel */}
            <div className="flex items-start gap-2">
              <FlagImage country="Nederland" size={16} className="shrink-0 mt-0.5 opacity-60" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#555] font-bold">{auteur.name}</span>
                <p className="text-sm text-white leading-snug">{vraag.tekst}</p>
              </div>
            </div>

            {/* Antwoordinvoer (answering phase) */}
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

            {/* Read-only: eigen antwoord + indicator + expand */}
            {readOnly && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {huidigAntwoord ? (
                    <span className="text-xs text-[#FF6B00] font-bold bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-0.5 rounded-lg">
                      {formatAntwoord(huidigAntwoord, effectiefType, opponent)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#333]">— niet ingevuld</span>
                  )}
                  {isCorrect && <span className="text-[#4adf8a] text-sm font-bold">✓</span>}
                  {isWrong && <span className="text-[#f44] text-sm font-bold">✗</span>}
                  {heeftCorrectAntwoord && (
                    <span className="text-[10px] text-[#4adf8a] bg-[#4adf8a]/10 border border-[#4adf8a]/20 px-2 py-0.5 rounded-lg">
                      ✓ {formatAntwoord(correctValues[0], effectiefType, opponent)}
                    </span>
                  )}

                  <button
                    onClick={() => toggleExpand(key)}
                    className="ml-auto text-[10px] text-[#555] hover:text-[#888] border border-[#2a2a2a] px-2 py-0.5 rounded-lg transition-colors"
                  >
                    {isExpanded ? '▲' : '▼'} anderen
                  </button>
                </div>

                {/* Uitklapbaar: antwoorden andere deelnemers */}
                {isExpanded && (
                  <div className="border-t border-[#1e1e1e] pt-2.5 flex flex-col gap-1.5">
                    {groupParticipants
                      .filter((p) => p.initials.toLowerCase() !== mijnInitials.toLowerCase())
                      .map((p) => {
                        const pKey = p.initials.toLowerCase()
                        const pAntwoord = alleAntwoorden[pKey]?.[match.id]?.[key] ?? null
                        const pBeoordeeld = beoordelingVoorVraag?.[pKey] !== undefined
                        const pCorrect = heeftCorrectAntwoord
                          ? pAntwoord !== null && isAntwoordCorrect(pAntwoord, correctValues, effectiefType ?? null)
                          : pBeoordeeld && beoordelingVoorVraag![pKey] === true
                        const pWrong = heeftCorrectAntwoord
                          ? pAntwoord !== null && !isAntwoordCorrect(pAntwoord, correctValues, effectiefType ?? null)
                          : pBeoordeeld && beoordelingVoorVraag![pKey] === false

                        return (
                          <div key={pKey} className="flex items-center justify-between">
                            <span className="text-[11px] text-[#666]">{p.name}</span>
                            <div className="flex items-center gap-1.5">
                              {pAntwoord ? (
                                <span className="text-[11px] text-[#888]">
                                  {formatAntwoord(pAntwoord, effectiefType, opponent)}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#444]">—</span>
                              )}
                              {pCorrect && <span className="text-[#4adf8a] text-xs font-bold">✓</span>}
                              {pWrong && <span className="text-[#f44] text-xs font-bold">✗</span>}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Hulpfunctie: formatteer antwoordwaarde voor display ───────────────────

function formatAntwoord(
  waarde: string,
  type: Exclude<import('@/lib/types/oranjeVragen').AntwoordType, 'anders'> | null,
  opponent: string,
): string {
  if (type === 'percentage') return `${waarde}%`
  if (type === 'nl_opp') return waarde === 'NL' ? 'Nederland' : opponent
  return waarde
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

  if (type === 'links_rechts') {
    return (
      <div className="flex gap-2">
        {(['links', 'rechts'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(waarde === opt ? null : opt)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
              waarde === opt ? 'bg-[#FF6B00] text-white' : 'bg-[#252525] text-[#555] hover:text-[#888]'
            }`}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
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
        <option value="geen">Geen</option>
        {spelers.map((naam) => (
          <option key={naam} value={naam}>{naam}</option>
        ))}
      </select>
    )
  }

  if (type === 'speler_beide') {
    return (
      <select
        value={waarde ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]"
      >
        <option value="">— Kies een speler</option>
        <option value="geen">Geen</option>
        <optgroup label="Nederland">
          {nedPlayers.map((naam) => (
            <option key={naam} value={naam}>{naam}</option>
          ))}
        </optgroup>
        <optgroup label={opponent}>
          {oppPlayers.map((naam) => (
            <option key={naam} value={naam}>{naam}</option>
          ))}
        </optgroup>
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

  if (type === 'exact_aantal' || type === 'exact_aantal_hoog' || type === 'aantal_marge') {
    const isHoog = type === 'exact_aantal_hoog'
    const MIN = isHoog ? 22 : 0
    const MAX = isHoog ? 32 : 22
    const num = waarde !== null ? parseInt(waarde, 10) : null
    function clamp(v: number) { return Math.min(MAX, Math.max(MIN, v)) }
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(num !== null && num > MIN ? String(clamp(num - 1)) : null)}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >−</button>
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={waarde ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            onChange(isNaN(v) ? null : String(clamp(v)))
          }}
          placeholder={`${MIN}–${MAX}`}
          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-sm text-white text-center outline-none focus:border-[#FF6B00] [appearance:textfield]"
        />
        {type === 'aantal_marge' && (
          <span className="text-[10px] text-[#555] shrink-0">±1</span>
        )}
        <button
          onClick={() => onChange(String(clamp((num ?? MIN - 1) + 1)))}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >+</button>
      </div>
    )
  }

  if (type === 'decimaal') {
    const num = waarde !== null ? parseFloat(waarde) : null
    function clamp(v: number) { return Math.min(20, Math.max(0, v)) }
    function fmt(v: number) { return v.toFixed(2) }
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(num !== null ? fmt(clamp(num - 0.5)) : null)}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >−½</button>
        <input
          type="number"
          min={0}
          max={20}
          step={0.01}
          value={waarde ?? ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            onChange(isNaN(v) ? null : fmt(clamp(v)))
          }}
          placeholder="0.00"
          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-sm text-white text-center outline-none focus:border-[#FF6B00] [appearance:textfield]"
        />
        <span className="text-[10px] text-[#555] shrink-0">±0.33</span>
        <button
          onClick={() => onChange(fmt(clamp((num ?? 0) + 0.5)))}
          className="px-3 py-1.5 bg-[#252525] text-[#888] rounded-lg text-sm font-bold hover:text-white transition-colors"
        >+½</button>
      </div>
    )
  }

  if (type === 'minuut') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {([...MINUUT_OPTIES, 'geen'] as const).map((opt) => (
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
