'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PlayerInfoCard } from '@/components/fantasy/PlayerInfoCard'
import { useFantasyXV } from '@/hooks/useFantasyXV'
import { useDeadline } from '@/hooks/useDeadline'
import { useGameStore, REGULAR_SLOTS, TALENT_SLOTS, SCRATCHPAD_SLOTS } from '@/store/gameStore'
import { TeamNameEditor } from '@/components/fantasy/TeamNameEditor'
import { RulesPanel } from '@/components/fantasy/RulesPanel'
import { PlayerRow } from '@/components/fantasy/PlayerRow'
import { EmptySlot } from '@/components/fantasy/EmptySlot'
import { ScratchpadRow } from '@/components/fantasy/ScratchpadRow'
import { PlayerModal } from '@/components/fantasy/PlayerModal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { FlagImage } from '@/components/ui/FlagImage'
import { computePlayerQuote, formatQuote } from '@/lib/helpers'
import type { FantasyStats } from '@/lib/scoring'
import type { Player } from '@/lib/data/players'
import type { ParticipantSquadData } from '@/app/actions/admin'
import type { GroupId } from '@/lib/groups'

interface Props {
  participantName: string
  participantInitials: string
  fantasyStats: FantasyStats
  ogPlayerCounts: Record<string, number>
  ascPlayerCounts: Record<string, number> | null
  ogSquads: ParticipantSquadData[]
  ascSquads: ParticipantSquadData[] | null
  isDualGroup: boolean
  defaultGroup: GroupId
}

const MUTED = '#555'

function toRoman(n: number): string {
  if (n <= 0) return ''
  const vals = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
  const syms = ['X', 'IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}

function EyesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 110.32 89.79" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M41.13,86.29c-6.94,4.48-15.36,4.66-22.37.52-8.26-4.86-13.56-14.11-16.17-23.28C-2.03,47.37-.71,27.24,8.57,12.99c2.45-3.76,5.42-6.92,9.13-9.37,7.19-4.75,16.11-4.82,23.36-.16,7.96,5.11,13.05,14.32,15.54,23.42,3.26,11.92,3.23,24.51-.11,36.4-2.48,8.86-7.5,17.92-15.37,23ZM36.55,80.01c8.43-5.37,12.71-16.75,14.11-26.59-4.55,2.9-10.12,2.06-13.49-1.77s-3.4-9.68,0-13.52,8.94-4.66,13.49-1.77c-1.39-9.76-5.55-20.76-13.6-26.26-8.25-5.36-16.35-1.14-21.53,6.49-10.49,15.44-10.46,41.38.1,56.74,4.98,7.24,12.76,11.55,20.91,6.68Z"/>
      <path d="M81.03,82.11c3.89-.17,7.11-1.86,9.86-4.4,6.4-5.92,9.89-15.7,11.08-24.28-4.64,2.92-10.17,2.01-13.52-1.81-3.36-3.83-3.36-9.61,0-13.45s8.88-4.73,13.52-1.81c-1.2-8.64-4.72-18.48-11.21-24.4-2.68-2.44-5.79-4.01-9.43-4.29-6.61.46-12.36,4.29-15.48,10.43-1.2-2.7-2.42-5.33-3.84-8.05C66.57,3.79,73.66.09,81.34,0c10.04.35,17.58,7.48,22.22,15.99,6.84,12.58,8.2,28.79,5.38,42.73-1.97,9.7-6.48,19.72-14.22,25.93-3.83,3.07-8.24,4.9-13.16,5.13-7.74-.03-14.93-3.73-19.54-10.05,1.39-2.64,2.56-5.13,3.82-8.08,2.96,5.85,8.48,9.83,15.19,10.46Z"/>
    </svg>
  )
}

function Phase2PlayerRow({ slotIndex, player, stats, counts }: { slotIndex: number; player: Player; stats: FantasyStats; counts: Record<string, number> }) {
  const [isOpen, setIsOpen] = useState(false)
  const quote = computePlayerQuote(player)
  const s = stats[String(player.id)] ?? { goals: 0, assists: 0 }
  const pts = (s.goals + s.assists) * quote
  const count = counts[player.name] ?? 0

  return (
    <>
      <div
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 p-2 rounded-xl border border-[#2a2a2a] cursor-pointer hover:bg-white/5 transition-colors"
        style={{ background: isOpen ? '#252525' : 'rgba(22,22,22,0.82)' }}
      >
        <span className="text-sm font-bold text-[#888] w-6 shrink-0 text-right">#{slotIndex}</span>
        <FlagImage country={player.country} size={24} className="shrink-0" />
        <span className="text-sm font-bold text-white flex-1 min-w-0 truncate">{player.name}</span>
        <span className="font-heading text-sm font-bold text-[#FF6B00] border border-[#FF6B00] px-2 py-0.5 rounded-lg shrink-0 w-[38px] text-center">
          {formatQuote(quote)}
        </span>
        <span className="w-8 text-center text-xs font-bold shrink-0" style={{ color: count > 0 ? '#888' : MUTED }}>
          {count > 0 ? toRoman(count) : '–'}
        </span>
        <span className="w-7 text-center text-sm font-bold text-white shrink-0">{s.goals > 0 ? s.goals : <span style={{ color: MUTED }}>–</span>}</span>
        <span className="w-7 text-center text-sm font-bold text-white shrink-0">{s.assists > 0 ? s.assists : <span style={{ color: MUTED }}>–</span>}</span>
        <span className="w-[38px] text-right text-sm font-bold shrink-0" style={{ color: pts > 0 ? '#FF6B00' : MUTED }}>
          {pts > 0 ? pts.toFixed(2) : '–'}
        </span>
      </div>
      {isOpen && <PlayerInfoCard player={player} />}
    </>
  )
}

function Phase2ScratchpadRow({ player, stats, counts }: { player: Player; stats: FantasyStats; counts: Record<string, number> }) {
  const quote = computePlayerQuote(player)
  const s = stats[String(player.id)] ?? { goals: 0, assists: 0 }
  const pts = (s.goals + s.assists) * quote
  const count = counts[player.name] ?? 0

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-[#222]" style={{ background: '#0d0d0d' }}>
      <FlagImage country={player.country} size={24} className="shrink-0 opacity-60" />
      <span className="text-sm font-medium text-[#888] flex-1 min-w-0 truncate">{player.name}</span>
      <span className="font-heading text-sm font-bold text-[#555] border border-[#333] px-2 py-0.5 rounded-lg shrink-0 w-[38px] text-center">
        {formatQuote(quote)}
      </span>
      <span className="w-8 text-center text-xs font-bold shrink-0" style={{ color: count > 0 ? '#666' : MUTED }}>
        {count > 0 ? toRoman(count) : '–'}
      </span>
      <span className="w-7 text-center text-sm font-bold shrink-0" style={{ color: s.goals > 0 ? '#aaa' : MUTED }}>{s.goals > 0 ? s.goals : '–'}</span>
      <span className="w-7 text-center text-sm font-bold shrink-0" style={{ color: s.assists > 0 ? '#aaa' : MUTED }}>{s.assists > 0 ? s.assists : '–'}</span>
      <span className="w-[38px] text-right text-sm font-bold shrink-0" style={{ color: pts > 0 ? '#FF6B00' : MUTED }}>
        {pts > 0 ? pts.toFixed(2) : '–'}
      </span>
    </div>
  )
}

function ColHeader() {
  return (
    <div className="flex items-center gap-2 px-2 pb-1 text-xs uppercase tracking-widest font-heading text-white">
      <span className="w-6 shrink-0" />
      <span className="w-6 shrink-0" />
      <span className="flex-1" />
      <span className="w-[38px] shrink-0" />
      <span className="w-8 shrink-0" />
      <span className="w-7 text-center shrink-0">G</span>
      <span className="w-7 text-center shrink-0">A</span>
      <span className="w-[38px] text-right shrink-0">Pts</span>
    </div>
  )
}

function TotalScoreBar({ squad, stats }: { squad: Record<string, Player | null>; stats: FantasyStats }) {
  const total = [...REGULAR_SLOTS, ...TALENT_SLOTS].reduce((sum, key) => {
    const player = squad[key]
    if (!player) return sum
    const s = stats[String(player.id)] ?? { goals: 0, assists: 0 }
    return sum + (s.goals + s.assists) * computePlayerQuote(player)
  }, 0)

  return (
    <div className="flex items-center justify-end px-3 py-2.5 rounded-xl border border-[#2a2a2a] mb-6" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
        Score{' '}
        {total > 0
          ? <span className="text-[#FF6B00]">{total.toFixed(2)} pts</span>
          : <span style={{ color: MUTED }}>0.00 pts</span>
        }
      </span>
    </div>
  )
}

// ── TeamViewer ─────────────────────────────────────────────────────────────────

function TeamViewer({
  ogSquads, ascSquads, activeGroup, participantInitials,
  fantasyStats, ogPlayerCounts, ascPlayerCounts, onClose,
}: {
  ogSquads: ParticipantSquadData[]
  ascSquads: ParticipantSquadData[] | null
  activeGroup: GroupId
  participantInitials: string
  fantasyStats: FantasyStats
  ogPlayerCounts: Record<string, number>
  ascPlayerCounts: Record<string, number> | null
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const squads = (activeGroup === 'og' ? ogSquads : ascSquads ?? ogSquads)
    .filter(s => s.initials !== participantInitials)
  const counts = activeGroup === 'og' ? ogPlayerCounts : (ascPlayerCounts ?? ogPlayerCounts)

  useEffect(() => { setIndex(0) }, [activeGroup])

  const current = squads[index]

  function goNext() { setIndex(i => Math.min(i + 1, squads.length - 1)) }
  function goPrev() { setIndex(i => Math.max(i - 1, 0)) }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(10,10,10,0.88)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] shrink-0" style={{ background: 'rgba(13,13,13,0.75)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={onClose}
          className="text-[#888] hover:text-white transition-colors text-xl leading-none w-8 shrink-0"
        >
          ✕
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] font-heading text-lg font-bold text-[#888] hover:text-white disabled:opacity-25 transition-colors"
          >
            ‹
          </button>
          <span className="font-heading text-xs text-[#555] tabular-nums w-10 text-center">
            {squads.length > 0 ? `${index + 1} / ${squads.length}` : '–'}
          </span>
          <button
            onClick={goNext}
            disabled={index === squads.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] font-heading text-lg font-bold text-[#888] hover:text-white disabled:opacity-25 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      {current ? (
        <div
          key={current.initials}
          className="flex-1 overflow-y-auto px-4 py-4"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            const dy = e.changedTouches[0].clientY - touchStartY.current
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
              if (dx < 0) goNext(); else goPrev()
            }
          }}
        >
          {/* Teamnaam */}
          <div className="w-full rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] px-4 py-2 mb-4 text-center">
            <span className="font-script text-[28px] text-white block">{current.teamName || current.name}</span>
          </div>

          {/* Spelers */}
          <div className="mb-2 text-center">
            <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Spelers</span>
          </div>
          <ColHeader />
          <div className="flex flex-col gap-1 mb-6">
            {REGULAR_SLOTS.map((key, idx) => {
              const player = current.squad[key]
              if (!player) return null
              return <Phase2PlayerRow key={key} slotIndex={idx + 1} player={player} stats={fantasyStats} counts={counts} />
            })}
          </div>

          {/* Talents */}
          <div className="mb-2 text-center">
            <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Talents</span>
          </div>
          <ColHeader />
          <div className="flex flex-col gap-1 mb-4">
            {TALENT_SLOTS.map((key, idx) => {
              const player = current.squad[key]
              if (!player) return null
              return <Phase2PlayerRow key={key} slotIndex={REGULAR_SLOTS.length + idx + 1} player={player} stats={fantasyStats} counts={counts} />
            })}
          </div>

          <TotalScoreBar squad={current.squad} stats={fantasyStats} />

          {/* Coach */}
          <div className="mt-2 mb-8 text-center">
            <span className="font-script text-[28px] text-white">Coach: {current.name}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#555] text-sm">Geen teams beschikbaar</p>
        </div>
      )}
    </div>
  )
}

// ── FantasyClient ──────────────────────────────────────────────────────────────

export function FantasyClient({
  participantName, participantInitials, fantasyStats,
  ogPlayerCounts, ascPlayerCounts,
  ogSquads, ascSquads, isDualGroup, defaultGroup,
}: Props) {
  const { isLoaded } = useFantasyXV(participantName)
  const { isPast } = useDeadline()
  const { fantasySquad, scratchpad, teamName, setScratchpadPlayer, setActiveInfoSlot } = useGameStore()
  const [modalSlot, setModalSlot] = useState<string | null>(null)
  const [scratchpadModalSlot, setScratchpadModalSlot] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<GroupId>(defaultGroup)
  const [headerToggleEl, setHeaderToggleEl] = useState<Element | null>(null)

  useEffect(() => {
    setHeaderToggleEl(document.getElementById('header-chat-toggle'))
  }, [])

  const openModal = (slotKey: string) => { if (!isPast) setModalSlot(slotKey) }
  const closeModal = () => setModalSlot(null)
  const isTalentSlot = (key: string) => key.startsWith('t')
  const firstEmptyScratchpadSlot = SCRATCHPAD_SLOTS.find((k) => !scratchpad[k])

  // Counts voor de eigen groep (eigen overzicht)
  const ownCounts = defaultGroup === 'og' ? ogPlayerCounts : (ascPlayerCounts ?? ogPlayerCounts)

  const hasViewerSquads =
    ogSquads.some(s => s.initials !== participantInitials) ||
    (ascSquads ?? []).some(s => s.initials !== participantInitials)

  const eyesButton = hasViewerSquads ? (
    <button
      onClick={() => setViewerOpen(true)}
      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-white hover:text-[#FF6B00] transition-colors"
      title="Bekijk andere teams"
    >
      <EyesIcon className="w-6 h-auto" style={{ transform: 'scaleX(-1)' }} />
    </button>
  ) : null

  const viewerEl = viewerOpen ? (
    <TeamViewer
      ogSquads={ogSquads}
      ascSquads={ascSquads}
      activeGroup={activeGroup}
      participantInitials={participantInitials}
      fantasyStats={fantasyStats}
      ogPlayerCounts={ogPlayerCounts}
      ascPlayerCounts={ascPlayerCounts}
      onClose={() => setViewerOpen(false)}
    />
  ) : null

  const headerToggle = headerToggleEl && isDualGroup ? createPortal(
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
  ) : null

  if (!isLoaded) return <SkeletonList count={8} />

  // ── Fase 2: read-only weergave met goals/assists/punten ──────────────────
  if (isPast) {
    const scratchpadPlayers = SCRATCHPAD_SLOTS.map((k) => scratchpad[k]).filter(Boolean) as Player[]

    return (
      <div>
        {viewerEl}
        {headerToggle}

        <div className="relative flex items-center justify-center mb-1">
          <h1 className="font-accent font-bold text-3xl text-white">Fantasy XV</h1>
          {eyesButton}
        </div>
        <p className="font-accent font-light text-white text-xs mb-4 text-center">Jouw droomteam</p>
        <div className="w-full rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] px-4 py-2 mb-4 text-center">
          <span className="font-script text-[28px] text-white block">{teamName || 'Naamloos'}</span>
        </div>

        <div className="mb-2 text-center">
          <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Spelers</span>
        </div>
        <ColHeader />
        <div className="flex flex-col gap-1 mb-6">
          {REGULAR_SLOTS.map((key, idx) => {
            const player = fantasySquad[key]
            if (!player) return null
            return <Phase2PlayerRow key={key} slotIndex={idx + 1} player={player} stats={fantasyStats} counts={ownCounts} />
          })}
        </div>

        <div className="mb-2 text-center">
          <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Talents</span>
        </div>
        <ColHeader />
        <div className="flex flex-col gap-1 mb-4">
          {TALENT_SLOTS.map((key, idx) => {
            const player = fantasySquad[key]
            if (!player) return null
            return <Phase2PlayerRow key={key} slotIndex={REGULAR_SLOTS.length + idx + 1} player={player} stats={fantasyStats} counts={ownCounts} />
          })}
        </div>

        <TotalScoreBar squad={fantasySquad} stats={fantasyStats} />

        <div className="mt-2 mb-8 text-center">
          <span className="font-script text-[28px] text-white">Coach: {participantName}</span>
        </div>

        {scratchpadPlayers.length > 0 && (
          <>
            <div className="mb-2 text-center">
              <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Kladblok</span>
            </div>
            <ColHeader />
            <div className="flex flex-col gap-1 mb-6">
              {scratchpadPlayers.map((player, i) => (
                <Phase2ScratchpadRow key={i} player={player} stats={fantasyStats} counts={ownCounts} />
              ))}
            </div>
          </>
        )}

        <div className="mt-4 rounded-xl bg-[#111] border border-[#2a2a2a] p-4 text-xs text-[#888] space-y-1 mb-6">
          <p className="font-bold text-[#aaa] mb-2">Hoe werkt de puntentelling?</p>
          <p>Spelers verdienen punten met doelpunten en assists. Het totaal aan goals en assists wordt per speler vermenigvuldigd met de quotering van de betreffende speler (oranje getal rechts) en toegevoegd aan je puntentotaal.</p>
          <p className="mt-2">De quotering wordt bepaald door de kwaliteit van de speler (rating EA FC), de kwaliteit van het land (FIFA ranking) en de verwachting van het land in het toernooi (gebaseerd op quoteringen voor behalen volgende ronde).</p>
        </div>
      </div>
    )
  }

  // ── Fase 1: interactieve weergave ────────────────────────────────────────
  return (
    <div>
      {viewerEl}
      {headerToggle}

      <div className="relative flex items-center justify-center mb-1">
        <h1 className="font-accent font-bold text-3xl text-white">Fantasy XV</h1>
        {eyesButton}
      </div>
      <p className="font-accent font-light text-white text-xs mb-4 text-center">Stel je eigen droomteam samen</p>
      <TeamNameEditor />

      <RulesPanel />

      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Spelers</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {REGULAR_SLOTS.map((key, idx) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} slotIndex={idx + 1} player={player} />
          ) : (
            <EmptySlot key={key} isTalent={false} slotIndex={idx + 1} onClick={() => openModal(key)} />
          )
        })}
      </div>

      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Talents</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {TALENT_SLOTS.map((key, idx) => {
          const player = fantasySquad[key]
          return player ? (
            <PlayerRow key={key} slotKey={key} slotIndex={REGULAR_SLOTS.length + idx + 1} player={player} />
          ) : (
            <EmptySlot key={key} isTalent slotIndex={REGULAR_SLOTS.length + idx + 1} onClick={() => openModal(key)} />
          )
        })}
      </div>

      <div className="mt-2 mb-8 text-center">
        <span className="font-script text-[28px] text-white">Coach: {participantName}</span>
      </div>

      <div className="mb-2 text-center">
        <span className="font-heading text-xl font-bold text-[#ccc] tracking-wide">Kladblok</span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        {SCRATCHPAD_SLOTS.map((key) => {
          const player = scratchpad[key]
          return player ? <ScratchpadRow key={key} slotKey={key} player={player} /> : null
        })}
        {firstEmptyScratchpadSlot && (
          <button
            onClick={() => { setActiveInfoSlot(null); setScratchpadModalSlot(firstEmptyScratchpadSlot) }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#222] bg-[#0d0d0d] hover:border-[#333] transition-colors text-[#333] text-sm"
          >
            + Speler toevoegen aan kladblok
          </button>
        )}
        {SCRATCHPAD_SLOTS.every((k) => !scratchpad[k]) && (
          <p className="text-xs text-[#333] text-center py-2">Geen spelers op kladblok</p>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-[#111] border border-[#2a2a2a] p-4 text-xs text-[#888] space-y-1 mb-6">
        <p className="font-bold text-[#aaa] mb-2">Hoe werkt de puntentelling?</p>
        <p>Spelers verdienen punten met doelpunten en assists. Het totaal aan goals en assists wordt per speler vermenigvuldigd met de quotering van de betreffende speler (oranje getal rechts) en toegevoegd aan je puntentotaal.</p>
        <p className="mt-2">De quotering wordt bepaald door de kwaliteit van de speler (rating EA FC), de kwaliteit van het land (FIFA ranking) en de verwachting van het land in het toernooi (gebaseerd op quoteringen voor behalen volgende ronde).</p>
      </div>

      {modalSlot && (
        <PlayerModal
          slotKey={modalSlot}
          talentOnly={isTalentSlot(modalSlot)}
          onClose={closeModal}
        />
      )}
      {scratchpadModalSlot && (
        <PlayerModal
          slotKey={scratchpadModalSlot}
          talentOnly={false}
          onClose={() => setScratchpadModalSlot(null)}
          onSelect={(player) => {
            setScratchpadPlayer(scratchpadModalSlot, player)
            setActiveInfoSlot(null)
          }}
        />
      )}
    </div>
  )
}
