'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDeadline } from '@/hooks/useDeadline'
import {
  loadOranjeVragen, loadOranjeVragenForGroup,
  loadOranjeAntwoorden, loadOranjeAntwoordenForGroup,
  saveOranjeAntwoorden, saveOranjeAntwoordenForGroup,
} from '@/app/actions/oranjeVragen'
import { VraagIndienenCard } from '@/components/oranje/VraagIndienenCard'
import { VragenBeantwoordenCard } from '@/components/oranje/VragenBeantwoordenCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MATCHES } from '@/lib/data/matches'
import { DUAL_GROUP_INITIALS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import type { OranjeVragenMap, OranjeAntwoordenMap } from '@/lib/types/oranjeVragen'

const NED_MATCH_IDS = [10, 33, 58]
const NED_MATCHES = MATCHES.filter((m) => NED_MATCH_IDS.includes(m.id))

interface Props {
  mijnInitials: string
}

export function OranjeClient({ mijnInitials }: Props) {
  const { isPast, isVraagPast, isVraagGracePast } = useDeadline()
  const isDualGroup = DUAL_GROUP_INITIALS.includes(mijnInitials.toUpperCase())
  const [activeGroup, setActiveGroup] = useState<GroupId>('og')
  const [isLoaded, setIsLoaded] = useState(false)
  const [vragen, setVragen] = useState<OranjeVragenMap>({})
  const [antwoorden, setAntwoorden] = useState<OranjeAntwoordenMap>({})
  const [headerToggleEl, setHeaderToggleEl] = useState<Element | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setHeaderToggleEl(document.getElementById('header-chat-toggle'))
  }, [])

  useEffect(() => {
    setIsLoaded(false)
    const vragenLoader = isDualGroup ? loadOranjeVragenForGroup(activeGroup) : loadOranjeVragen()
    const antwoordenLoader = isDualGroup ? loadOranjeAntwoordenForGroup(activeGroup) : loadOranjeAntwoorden()
    Promise.all([vragenLoader, antwoordenLoader]).then(([v, a]) => {
      setVragen(v)
      setAntwoorden(a)
      setIsLoaded(true)
    })
  }, [activeGroup, isDualGroup])

  const handleAntwoord = useCallback((matchId: number, authorInitials: string, waarde: string | null) => {
    setAntwoorden((prev) => {
      const next: OranjeAntwoordenMap = {
        ...prev,
        [matchId]: { ...(prev[matchId] ?? {}), [authorInitials]: waarde },
      }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        if (isDualGroup) {
          saveOranjeAntwoordenForGroup(next, activeGroup)
        } else {
          saveOranjeAntwoorden(next)
        }
      }, 500)
      return next
    })
  }, [isDualGroup, activeGroup])

  const totalGepubliceerd = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(vragen[id] ?? {}).filter((v) => v.gepubliceerd).length
  }, 0)

  const totalBeantwoord = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(antwoorden[id] ?? {}).filter(Boolean).length
  }, 0)

  const aantalIngediend = NED_MATCH_IDS.filter((id) => !!vragen[id]?.[mijnInitials.toLowerCase()]).length

  // Grace period: vraagdeadline verstreken maar nog niet alle 3 vragen ingediend → tot 3 juni
  const inGracePeriod = isVraagPast && !isVraagGracePast && aantalIngediend < 3

  if (!isLoaded) return <SkeletonList count={3} />

  return (
    <>
      <div>
        <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Oranje</h1>

        {!isVraagPast || inGracePeriod ? (
          <>
            <p className="font-accent font-light text-white text-xs mb-2 text-center">Dien jouw vraag in per wedstrijd</p>
            <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-5 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {aantalIngediend} / 3 vragen ingediend · deadline {inGracePeriod ? '3 juni (verlengd)' : '31 mei'}
            </div>
          </>
        ) : (
          <>
            <p className="font-accent font-light text-white text-xs mb-2 text-center">
              {'Beantwoord alle vragen van de deelnemers'}
            </p>
            <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-5 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {totalBeantwoord} / {totalGepubliceerd} antwoorden ingevuld
            </div>
          </>
        )}

        {NED_MATCHES.map((match) => {
          const key = mijnInitials.toLowerCase()
          const matchVragen = vragen[match.id] ?? {}
          const mijnVraag = matchVragen[key] ?? null

          // Grace period: toon formulier voor wedstrijden waarvoor nog geen vraag is ingediend
          const graceVoorDezeWedstrijd = inGracePeriod && !mijnVraag

          return (
            <div key={match.id}>
              {(!isVraagPast || mijnVraag || graceVoorDezeWedstrijd) && (
                <VraagIndienenCard
                  match={match}
                  bestaandeVraag={mijnVraag}
                  isPast={isVraagPast && !graceVoorDezeWedstrijd}
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

        {(!isVraagPast || inGracePeriod) && (
          <div className="mt-4 rounded-xl bg-[#111] border border-[#2a2a2a] p-4 text-xs text-[#888] space-y-1">
            <p className="font-bold text-[#aaa] mb-2">Hoe werkt het?</p>
            <p>① Dien vóór {inGracePeriod ? '3 juni' : '31 mei'} één vraag in per wedstrijd.</p>
            <p>② Na de deadline publiceert de admin de vragen.</p>
            <p>③ Beantwoord alle vragen vóór 9 juni.</p>
            <p>④ Elk goed antwoord levert 0,5 token op voor de KO fase.</p>
          </div>
        )}
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
        headerToggleEl
      )}
    </>
  )
}
