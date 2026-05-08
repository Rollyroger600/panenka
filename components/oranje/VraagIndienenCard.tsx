'use client'
import { useState } from 'react'
import { saveOranjeVraag } from '@/app/actions/oranjeVragen'
import type { AntwoordType, OranjeVraag } from '@/lib/types/oranjeVragen'
import { getAntwoordTypeLabel } from '@/lib/types/oranjeVragen'
import { FlagImage } from '@/components/ui/FlagImage'
import { abbrevCountry } from '@/lib/helpers'
import type { Match } from '@/lib/data/matches'

const TYPES_KEUZE: AntwoordType[] = ['ja_nee', 'nl_opp', 'speler_nl', 'speler_opp', 'percentage', 'minuut', 'anders']

interface Props {
  match: Match
  bestaandeVraag: OranjeVraag | null
  isPast: boolean  // vraagdeadline verstreken
}

export function VraagIndienenCard({ match, bestaandeVraag, isPast }: Props) {
  const opponent = match.home === 'Nederland' ? match.away : match.home

  const [tekst, setTekst] = useState(bestaandeVraag?.tekst ?? '')
  const [type, setType] = useState<AntwoordType>(bestaandeVraag?.type ?? 'ja_nee')
  const [suggestie, setSuggestie] = useState(bestaandeVraag?.suggestie ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function opslaan() {
    if (!tekst.trim()) return
    setStatus('saving')
    const vraag: OranjeVraag = {
      tekst: tekst.trim(),
      type,
      gepubliceerd: false,
      ...(type === 'anders' && suggestie.trim() ? { suggestie: suggestie.trim() } : {}),
    }
    await saveOranjeVraag(match.id, vraag)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  const ingediend = !!bestaandeVraag

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
        <p className="font-heading font-light text-[10px] uppercase tracking-widest mt-0.5 text-[#7e7667]">
          {match.date} · {match.stadium}
        </p>
        {ingediend && (
          <span className="text-[10px] font-bold text-[#4adf8a] bg-[#1a3a2a] border border-[#4adf8a]/20 px-2 py-0.5 rounded-lg mt-1">
            ✓ Ingediend
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {isPast ? (
          <p className="text-xs text-[#555] text-center py-2">
            🔒 Vraagdeadline verstreken
            {ingediend && <span className="block mt-1 text-[#444]">"{bestaandeVraag!.tekst}"</span>}
          </p>
        ) : (
          <>
            {/* Vraagtekst */}
            <div>
              <label className="text-[10px] text-[#555] uppercase tracking-wide font-bold block mb-1">
                Jouw vraag
              </label>
              <textarea
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                placeholder="Bijv. 'Wie scoort het eerste doelpunt?'"
                rows={2}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00] resize-none"
              />
            </div>

            {/* Antwoordtype */}
            <div>
              <label className="text-[10px] text-[#555] uppercase tracking-wide font-bold block mb-1.5">
                Antwoordtype
              </label>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {TYPES_KEUZE.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      type === t
                        ? 'bg-[#FF6B00] text-white'
                        : 'bg-[#252525] text-[#666] hover:text-[#999]'
                    }`}
                  >
                    {getAntwoordTypeLabel(t, opponent)}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestieveld voor 'anders' */}
            {type === 'anders' && (
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wide font-bold block mb-1">
                  Jouw suggestie voor de admin
                </label>
                <input
                  value={suggestie}
                  onChange={(e) => setSuggestie(e.target.value)}
                  placeholder="Beschrijf hoe jouw vraag beantwoord kan worden"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-[#FF6B00]"
                />
              </div>
            )}

            {/* Opslaan */}
            <button
              onClick={opslaan}
              disabled={!tekst.trim() || status === 'saving'}
              className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                status === 'saved'
                  ? 'bg-[#1a3a2a] text-[#4adf8a] border border-[#4adf8a]/20'
                  : tekst.trim()
                  ? 'bg-[#FF6B00] text-white hover:bg-[#e55e00]'
                  : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed'
              }`}
            >
              {status === 'saving' ? 'Opslaan…' : status === 'saved' ? '✓ Opgeslagen' : ingediend ? 'Vraag bijwerken' : 'Vraag indienen'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
