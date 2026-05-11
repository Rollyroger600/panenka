'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDeadline } from '@/hooks/useDeadline'
import { loadOranjeVragen, loadOranjeAntwoorden, saveOranjeAntwoorden } from '@/app/actions/oranjeVragen'
import { VraagIndienenCard } from '@/components/oranje/VraagIndienenCard'
import { VragenBeantwoordenCard } from '@/components/oranje/VragenBeantwoordenCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'
import type { OranjeVragenMap, OranjeAntwoordenMap } from '@/lib/types/oranjeVragen'

const NED_MATCH_IDS = [10, 33, 58]
const NED_MATCHES = MATCHES.filter((m) => NED_MATCH_IDS.includes(m.id))

interface Props {
  mijnInitials: string
}

export function OranjeClient({ mijnInitials }: Props) {
  const { isPast, isVraagPast } = useDeadline()
  const [isLoaded, setIsLoaded] = useState(false)
  const [vragen, setVragen] = useState<OranjeVragenMap>({})
  const [antwoorden, setAntwoorden] = useState<OranjeAntwoordenMap>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    Promise.all([loadOranjeVragen(), loadOranjeAntwoorden()]).then(([v, a]) => {
      setVragen(v)
      setAntwoorden(a)
      setIsLoaded(true)
    })
  }, [])

  const handleAntwoord = useCallback((matchId: number, authorInitials: string, waarde: string | null) => {
    setAntwoorden((prev) => {
      const next: OranjeAntwoordenMap = {
        ...prev,
        [matchId]: { ...(prev[matchId] ?? {}), [authorInitials]: waarde },
      }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveOranjeAntwoorden(next), 500)
      return next
    })
  }, [])

  const totalGepubliceerd = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(vragen[id] ?? {}).filter((v) => v.gepubliceerd).length
  }, 0)

  const totalBeantwoord = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(antwoorden[id] ?? {}).filter(Boolean).length
  }, 0)

  const aantalIngediend = NED_MATCH_IDS.filter((id) => !!vragen[id]?.[mijnInitials.toLowerCase()]).length

  if (!isLoaded) return <SkeletonList count={3} />

  return (
    <div>
      <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Oranje</h1>

      {!isVraagPast ? (
        <>
          <p className="font-accent font-light text-white text-xs mb-2 text-center">Dien jouw vraag in per wedstrijd</p>
          <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-5 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
            {aantalIngediend} / 3 vragen ingediend · deadline 31 mei
          </div>
        </>
      ) : (
        <>
          <p className="font-accent font-light text-white text-xs mb-2 text-center">
            {isPast ? 'Deadline verstreken · alleen lezen' : 'Beantwoord alle vragen van de deelnemers'}
          </p>
          <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-5 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
            {totalBeantwoord} / {totalGepubliceerd} antwoorden ingevuld
          </div>
        </>
      )}

      {isPast && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#333] p-3 mb-4 text-center text-xs text-[#555] font-bold uppercase tracking-widest">
          🔒 Deadline verstreken · alleen lezen
        </div>
      )}

      {NED_MATCHES.map((match) => {
        const key = mijnInitials.toLowerCase()
        const matchVragen = vragen[match.id] ?? {}
        const mijnVraag = matchVragen[key] ?? null

        return (
          <div key={match.id}>
            {(!isVraagPast || mijnVraag) && (
              <VraagIndienenCard
                match={match}
                bestaandeVraag={mijnVraag}
                isPast={isVraagPast}
              />
            )}
            {isVraagPast && (
              <VragenBeantwoordenCard
                match={match}
                vragen={matchVragen}
                antwoorden={antwoorden}
                mijnInitials={mijnInitials}
                onAntwoord={handleAntwoord}
                readOnly={isPast}
              />
            )}
          </div>
        )
      })}

      {!isVraagPast && (
        <div className="mt-4 rounded-xl bg-[#111] border border-[#2a2a2a] p-4 text-xs text-[#888] space-y-1">
          <p className="font-bold text-[#aaa] mb-2">Hoe werkt het?</p>
          <p>① Dien vóór 31 mei één vraag in per wedstrijd.</p>
          <p>② Na de deadline publiceert de admin de vragen.</p>
          <p>③ Beantwoord alle vragen vóór 9 juni.</p>
          <p>④ Elk goed antwoord levert 0,5 token op voor de KO fase.</p>
        </div>
      )}
    </div>
  )
}
