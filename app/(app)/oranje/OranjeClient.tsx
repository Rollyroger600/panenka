'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDeadline, KO_ORANJE_VRAAG_DEADLINE, KO_ORANJE_ANTWOORD_DEADLINE } from '@/hooks/useDeadline'
import {
  loadOranjeVragen, loadOranjeVragenForGroup,
  loadOranjeAntwoorden, loadOranjeAntwoordenForGroup,
  saveOranjeAntwoorden, saveOranjeAntwoordenForGroup,
  loadOranjeCorrect, loadOranjeCorrectForGroup,
  loadOranjeBeoordeling, loadOranjeBeoordelingForGroup,
  loadAllOranjeAntwoorden, loadAllOranjeAntwoordenForGroup,
} from '@/app/actions/oranjeVragen'
import { VraagIndienenCard } from '@/components/oranje/VraagIndienenCard'
import { VragenBeantwoordenCard } from '@/components/oranje/VragenBeantwoordenCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { FlagImage } from '@/components/ui/FlagImage'
import { MATCHES } from '@/lib/data/matches'
import { DUAL_GROUP_INITIALS, GROUP_MEMBERS, getGroupForParticipant } from '@/lib/groups'
import { PARTICIPANTS } from '@/lib/participants'
import { parseCorrectWaarden, isAntwoordCorrect } from '@/lib/types/oranjeVragen'
import type { GroupId } from '@/lib/groups'
import type { OranjeVragenMap, OranjeAntwoordenMap, OranjeCorrectMap, OranjeBeoordeling } from '@/lib/types/oranjeVragen'

const NED_MATCH_IDS = [10, 33, 58, 75]
const NED_MATCHES = MATCHES.filter((m) => NED_MATCH_IDS.includes(m.id))

interface Props {
  mijnInitials: string
}

export function OranjeClient({ mijnInitials }: Props) {
  const { isPast, isVraagPast, isVraagGracePast, now } = useDeadline()
  const isDualGroup = DUAL_GROUP_INITIALS.includes(mijnInitials.toUpperCase())
  const [activeGroup, setActiveGroup] = useState<GroupId>('og')
  const [activeMatchId, setActiveMatchId] = useState<number>(
    new Date() < KO_ORANJE_ANTWOORD_DEADLINE ? 75 : NED_MATCH_IDS[0],
  )
  const [isLoaded, setIsLoaded] = useState(false)
  const [vragen, setVragen] = useState<OranjeVragenMap>({})
  const [antwoorden, setAntwoorden] = useState<OranjeAntwoordenMap>({})
  const [correctMap, setCorrectMap] = useState<OranjeCorrectMap>({})
  const [beoordeling, setBeoordeling] = useState<OranjeBeoordeling>({})
  const [alleAntwoorden, setAlleAntwoorden] = useState<Record<string, OranjeAntwoordenMap>>({})
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

  useEffect(() => {
    if (!isPast) return
    const correctLoader = isDualGroup ? loadOranjeCorrectForGroup(activeGroup) : loadOranjeCorrect()
    const beoordelingLoader = isDualGroup ? loadOranjeBeoordelingForGroup(activeGroup) : loadOranjeBeoordeling()
    const alleLoader = isDualGroup ? loadAllOranjeAntwoordenForGroup(activeGroup) : loadAllOranjeAntwoorden()
    Promise.all([correctLoader, beoordelingLoader, alleLoader]).then(([cm, bm, aa]) => {
      setCorrectMap(cm)
      setBeoordeling(bm)
      setAlleAntwoorden(aa)
    })
  }, [isPast, activeGroup, isDualGroup])

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

  const aantalIngediend = NED_MATCH_IDS.filter((id) => !!vragen[id]?.[mijnInitials.toLowerCase()]).length
  const inGracePeriod = isVraagPast && !isVraagGracePast && aantalIngediend < 3

  const totalGepubliceerd = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(vragen[id] ?? {}).filter((v) => v.gepubliceerd).length
  }, 0)

  const totalBeantwoord = NED_MATCH_IDS.reduce((sum, id) => {
    return sum + Object.values(antwoorden[id] ?? {}).filter(Boolean).length
  }, 0)

  const participantKey = mijnInitials.toLowerCase()
  const totalCorrect = NED_MATCH_IDS.reduce((sum, id) => {
    const matchCorrect = correctMap[id] ?? {}
    const matchAntwoorden = antwoorden[id] ?? {}
    const matchBeoordeling = beoordeling[id] ?? {}
    const matchVragen = vragen[id] ?? {}
    const allKeys = new Set([...Object.keys(matchCorrect), ...Object.keys(matchBeoordeling)])
    let count = 0
    for (const key of allKeys) {
      const gegeven = matchAntwoorden[key]
      if (!gegeven) continue
      const correctWaarden = parseCorrectWaarden(matchCorrect[key] ?? null)
      if (correctWaarden.length > 0) {
        const vraag = matchVragen[key]
        const effectiefType = vraag?.adminType ?? (vraag?.type !== 'anders' ? vraag?.type : null) ?? null
        if (isAntwoordCorrect(gegeven, correctWaarden, effectiefType)) count++
      } else if (matchBeoordeling[key]?.[participantKey] === true) {
        count++
      }
    }
    return sum + count
  }, 0)

  const tokensVerdiend = Math.ceil(totalCorrect * 0.5)

  // Deelnemers van de actieve groep voor "andere antwoorden"
  const groupId: GroupId = isDualGroup ? activeGroup : getGroupForParticipant(mijnInitials.toUpperCase())
  const groupParticipants = PARTICIPANTS.filter((p) =>
    GROUP_MEMBERS[groupId].includes(p.initials),
  )

  if (!isLoaded) return <SkeletonList count={3} />

  const isKoVraagPast = now >= KO_ORANJE_VRAAG_DEADLINE
  const isKoAntwoordPast = now >= KO_ORANJE_ANTWOORD_DEADLINE
  const isFase2 = isVraagPast && !inGracePeriod
  const allMatchesDone = isPast && isKoAntwoordPast

  return (
    <>
      <div>
        <h1 className="font-accent font-bold text-3xl text-white mb-1 text-center">Oranje</h1>

        {/* Subtitle + balk */}
        {!isFase2 ? (
          <>
            <p className="font-accent font-light text-white text-xs mb-2 text-center">Dien jouw vraag in per wedstrijd</p>
            <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-5 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {aantalIngediend} / 3 vragen ingediend · deadline {inGracePeriod ? '3 juni (verlengd)' : '31 mei'}
            </div>
          </>
        ) : !allMatchesDone ? (
          <>
            <p className="font-accent font-light text-white text-xs mb-2 text-center">
              Jouw oranje antwoorden
            </p>
            <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-4 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {totalBeantwoord} / {totalGepubliceerd} antwoorden ingevuld
            </div>
          </>
        ) : (
          <>
            <p className="font-accent font-light text-white text-xs mb-2 text-center">
              Jouw oranje antwoorden
            </p>
            <div className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 mb-4 text-center text-xs text-white font-bold" style={{ background: 'rgba(22,22,22,0.82)' }}>
              {totalCorrect} / {totalGepubliceerd} antwoorden correct
              <span className="text-[#FF6B00] ml-2">
                · {String(tokensVerdiend).replace('.', ',')} token{tokensVerdiend !== 1 ? 's' : ''} verdiend
              </span>
            </div>
          </>
        )}

        {/* FASE 1 / GRACE: toon VraagIndienenCard per wedstrijd */}
        {!isFase2 && NED_MATCHES.map((match) => {
          const key = mijnInitials.toLowerCase()
          const mijnVraag = vragen[match.id]?.[key] ?? null
          const graceVoorDezeWedstrijd = inGracePeriod && !mijnVraag

          return (
            <div key={match.id}>
              {(!isVraagPast || graceVoorDezeWedstrijd) && (
                <VraagIndienenCard
                  match={match}
                  bestaandeVraag={mijnVraag}
                  isPast={isVraagPast && !graceVoorDezeWedstrijd}
                />
              )}
            </div>
          )
        })}

        {/* FASE 2: match-navigatie + actieve wedstrijd */}
        {isFase2 && (
          <>
            {/* Match-navigatie */}
            <div className="flex gap-2 mb-4">
              {NED_MATCHES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMatchId(m.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors ${
                    activeMatchId === m.id
                      ? 'bg-[#FF6B00]'
                      : 'bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#3a3a3a]'
                  }`}
                >
                  <FlagImage country={m.home} size={20} />
                  <span className={activeMatchId === m.id ? 'text-white/60 text-xs' : 'text-[#555] text-xs'}>&nbsp;&nbsp;–&nbsp;&nbsp;</span>
                  <FlagImage country={m.away} size={20} />
                </button>
              ))}
            </div>

            {/* Actieve wedstrijd */}
            {(() => {
              const activeMatch = NED_MATCHES.find((m) => m.id === activeMatchId)!
              const isKoMatch = activeMatchId === 75

              if (isKoMatch && !isKoVraagPast) {
                const key = mijnInitials.toLowerCase()
                const mijnVraag = vragen[activeMatch.id]?.[key] ?? null
                const heeftGepubliceerdeVragen = Object.values(vragen[activeMatch.id] ?? {}).some(v => v.gepubliceerd)
                return (
                  <>
                    <VraagIndienenCard
                      match={activeMatch}
                      bestaandeVraag={mijnVraag}
                      isPast={false}
                    />
                    {heeftGepubliceerdeVragen && (
                      <div className="mt-4">
                        <VragenBeantwoordenCard
                          match={activeMatch}
                          vragen={vragen[activeMatch.id] ?? {}}
                          antwoorden={antwoorden}
                          correctMap={correctMap[activeMatch.id] ?? {}}
                          beoordeling={beoordeling[activeMatch.id] ?? {}}
                          alleAntwoorden={alleAntwoorden}
                          groupParticipants={groupParticipants}
                          mijnInitials={mijnInitials}
                          onAntwoord={handleAntwoord}
                          readOnly={false}
                        />
                      </div>
                    )}
                  </>
                )
              }

              return (
                <VragenBeantwoordenCard
                  match={activeMatch}
                  vragen={vragen[activeMatch.id] ?? {}}
                  antwoorden={antwoorden}
                  correctMap={correctMap[activeMatch.id] ?? {}}
                  beoordeling={beoordeling[activeMatch.id] ?? {}}
                  alleAntwoorden={alleAntwoorden}
                  groupParticipants={groupParticipants}
                  mijnInitials={mijnInitials}
                  onAntwoord={handleAntwoord}
                  readOnly={isKoMatch ? isKoAntwoordPast : isPast}
                />
              )
            })()}
          </>
        )}

        {/* How it works (alleen fase 1) */}
        {!isFase2 && (
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
        headerToggleEl,
      )}
    </>
  )
}
