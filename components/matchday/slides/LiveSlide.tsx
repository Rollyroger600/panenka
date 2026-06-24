'use client'
import { forwardRef, useState, useEffect, useRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import { COUNTRY_ABB } from '@/lib/data/countries'
import { MATCHES } from '@/lib/data/matches'
import type { LiveMatchData, LiveGoalEvent, LiveBookingEvent, LiveSubstitutionEvent, LivePenaltyEvent, LivePlayer, LiveMatchStats } from '@/lib/types/matchday'
import type { Match } from '@/lib/data/matches'
import { normalizeUitslag } from '@/lib/helpers'

interface Props {
  matchdayId: number
  liveMatch: LiveMatchData
  exporting?: boolean
}

const HDR_BOTTOM = '1px solid rgba(255,255,255,0.15)'
const ROW_BOTTOM = '1px solid rgba(255,255,255,0.05)'
const MUTED = 'rgba(255,255,255,0.35)'

function totoLabel(t: '1' | 'X' | '2' | null) {
  if (!t) return '—'
  return t
}

function goalTypeLabel(type: string) {
  if (type === 'PENALTY') return ' (P)'
  if (type === 'OWN') return ' (OG)'
  return ''
}

function fmtAttendance(n: number): string {
  return n.toLocaleString('nl-NL')
}

const POSITION_ORDER: Record<string, number> = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Forward: 3,
}

function positionSort(a: LivePlayer, b: LivePlayer): number {
  return (POSITION_ORDER[a.position ?? ''] ?? 99) - (POSITION_ORDER[b.position ?? ''] ?? 99)
}

// ─── TimelineTab ─────────────────────────────────────────────────────────────

function TimelineTab({ lm }: { lm: LiveMatchData }) {
  type TimelineEvent =
    | { kind: 'goal';    minute: number; data: LiveGoalEvent }
    | { kind: 'booking'; minute: number; data: LiveBookingEvent }
    | { kind: 'sub';     minute: number; data: LiveSubstitutionEvent }

  const events: TimelineEvent[] = [
    ...(lm.goals ?? []).map((g) => ({ kind: 'goal' as const, minute: g.minute, data: g })),
    ...(lm.bookings ?? []).map((b) => ({ kind: 'booking' as const, minute: b.minute, data: b })),
    ...(lm.substitutions ?? []).map((s) => ({ kind: 'sub' as const, minute: s.minute, data: s })),
  ].sort((a, b) => a.minute - b.minute)

  const hasPenalties = (lm.penalties ?? []).length > 0

  if (events.length === 0 && !hasPenalties) {
    return (
      <div className="text-center font-heading text-[12px]" style={{ color: MUTED }}>
        Nog geen events
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-1.5">
      {events.map((ev, i) => {
        const isHome = ev.data.team === 'home'

        if (ev.kind === 'goal') {
          const g = ev.data as LiveGoalEvent
          return (
            <div key={i} className="grid" style={{ gridTemplateColumns: '1fr 20px 1fr' }}>
              {isHome ? (
                <div className="flex flex-col items-end pr-2">
                  <span className="font-heading text-[13px] text-white">
                    {g.minute}' {g.scorer}{goalTypeLabel(g.type)}
                  </span>
                  {g.assister && (
                    <span className="font-heading text-[11px] pr-2" style={{ color: '#888' }}>
                      ↳ {g.assister}
                    </span>
                  )}
                </div>
              ) : <span />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-ball.svg" width={14} height={14} alt="" style={{ display: 'block', margin: '0 auto', marginTop: 3, opacity: 0.55 }} />
              {!isHome ? (
                <div className="flex flex-col items-start pl-2">
                  <span className="font-heading text-[13px] text-white">
                    {g.scorer}{goalTypeLabel(g.type)} {g.minute}'
                  </span>
                  {g.assister && (
                    <span className="font-heading text-[11px] pl-2" style={{ color: '#888' }}>
                      ↳ {g.assister}
                    </span>
                  )}
                </div>
              ) : <span />}
            </div>
          )
        }

        if (ev.kind === 'booking') {
          const b = ev.data as LiveBookingEvent
          const cardColor = b.card === 'YELLOW' ? '#facc15' : b.card === 'RED' ? '#f87171' : '#f97316'
          const cardIcon = (
            <div style={{ width: 9, height: 12, background: cardColor, borderRadius: 1, margin: '0 auto' }} />
          )
          return (
            <div key={i} className="grid items-center" style={{ gridTemplateColumns: '1fr 20px 1fr' }}>
              {isHome ? (
                <span className="font-heading text-[12px] text-right pr-2" style={{ color: MUTED }}>
                  {b.minute}' {b.player}
                </span>
              ) : <span />}
              {cardIcon}
              {!isHome ? (
                <span className="font-heading text-[12px] text-left pl-2" style={{ color: MUTED }}>
                  {b.player} {b.minute}'
                </span>
              ) : <span />}
            </div>
          )
        }

        if (ev.kind === 'sub') {
          const s = ev.data as LiveSubstitutionEvent
          const subIcon = (
            <div className="flex flex-col items-center justify-center" style={{ gap: 1 }}>
              <span style={{ color: '#4ade80', fontSize: 12, lineHeight: 1 }}>↑</span>
              <span style={{ color: '#f87171', fontSize: 12, lineHeight: 1 }}>↓</span>
            </div>
          )
          return (
            <div key={i} className="grid items-start" style={{ gridTemplateColumns: '1fr 20px 1fr' }}>
              {isHome ? (
                <div className="flex flex-col items-end pr-2">
                  <span className="font-heading text-[12px]" style={{ color: '#4ade80' }}>{s.minute}' {s.playerIn}</span>
                  <span className="font-heading text-[12px]" style={{ color: '#f87171' }}>{s.playerOut}</span>
                </div>
              ) : <span />}
              <div className="flex items-center justify-center pt-0.5">{subIcon}</div>
              {!isHome ? (
                <div className="flex flex-col items-start pl-2">
                  <span className="font-heading text-[11px]" style={{ color: '#4ade80' }}>{s.playerIn} {s.minute}'</span>
                  <span className="font-heading text-[11px]" style={{ color: '#f87171' }}>{s.playerOut}</span>
                </div>
              ) : <span />}
            </div>
          )
        }

        return null
      })}

      {hasPenalties && (
        <div className="mt-2">
          <div className="text-center font-heading text-[12px] uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>
            Strafschoppenreeks
          </div>
          {(lm.penalties ?? []).map((p, i) => {
            const isHome = p.team === 'home'
            const dot = (
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: p.scored ? '#4ade80' : '#f87171',
                margin: '0 auto',
              }} />
            )
            return (
              <div key={i} className="grid items-center" style={{ gridTemplateColumns: '1fr 20px 1fr' }}>
                {isHome ? (
                  <span className="font-heading text-[12px] text-right text-white pr-2">{p.player}</span>
                ) : <span />}
                {dot}
                {!isHome ? (
                  <span className="font-heading text-[12px] text-left text-white pl-2">{p.player}</span>
                ) : <span />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OpstellingenTab ─────────────────────────────────────────────────────────

function OpstellingenTab({ lm, homeAbb, awayAbb }: { lm: LiveMatchData; homeAbb: string; awayAbb: string }) {
  const homeLineup = [...(lm.homeLineup ?? [])].sort(positionSort)
  const awayLineup = [...(lm.awayLineup ?? [])].sort(positionSort)
  const homeBench  = lm.homeBench ?? []
  const awayBench  = lm.awayBench ?? []

  if (homeLineup.length === 0 && awayLineup.length === 0) {
    return (
      <div className="text-center font-heading text-[12px]" style={{ color: MUTED }}>
        Nog geen opstellingen beschikbaar
      </div>
    )
  }

  const maxRows  = Math.max(homeLineup.length, awayLineup.length)
  const maxBench = Math.max(homeBench.length, awayBench.length)

  return (
    <div>
      <div className="grid mb-1" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="font-heading text-[14px] text-white text-center">
          {homeAbb}{lm.homeFormation ? ` (${lm.homeFormation})` : ''}
        </div>
        <div className="font-heading text-[14px] text-white text-center">
          {awayAbb}{lm.awayFormation ? ` (${lm.awayFormation})` : ''}
        </div>
      </div>

      {Array.from({ length: maxRows }, (_, i) => {
        const hp = homeLineup[i]
        const ap = awayLineup[i]
        return (
          <div key={i} className="grid" style={{ gridTemplateColumns: '1fr 1fr', borderBottom: ROW_BOTTOM, paddingTop: 2, paddingBottom: 2 }}>
            <span className="font-heading text-[12px] text-white text-center truncate px-1">
              {hp ? `${hp.shirtNumber != null ? hp.shirtNumber + ' ' : ''}${hp.name}` : ''}
            </span>
            <span className="font-heading text-[12px] text-white text-center truncate px-1">
              {ap ? `${ap.shirtNumber != null ? ap.shirtNumber + ' ' : ''}${ap.name}` : ''}
            </span>
          </div>
        )
      })}

      {maxBench > 0 && (
        <div className="text-center font-heading text-[14px] uppercase tracking-wider my-1.5" style={{ color: MUTED }}>
          Bank
        </div>
      )}

      {Array.from({ length: maxBench }, (_, i) => {
        const hp = homeBench[i]
        const ap = awayBench[i]
        return (
          <div key={i} className="grid" style={{ gridTemplateColumns: '1fr 1fr', borderBottom: ROW_BOTTOM, paddingTop: 1, paddingBottom: 1 }}>
            <span className="font-heading text-[12px] text-center truncate px-1" style={{ color: MUTED }}>
              {hp ? `${hp.shirtNumber != null ? hp.shirtNumber + ' ' : ''}${hp.name}` : ''}
            </span>
            <span className="font-heading text-[12px] text-center truncate px-1" style={{ color: MUTED }}>
              {ap ? `${ap.shirtNumber != null ? ap.shirtNumber + ' ' : ''}${ap.name}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── StatsTab ─────────────────────────────────────────────────────────────────

const STAT_ROWS: Array<{ key: keyof LiveMatchStats; label: string; pct?: boolean }> = [
  { key: 'possession',    label: 'Balbezit',       pct: true },
  { key: 'shots',         label: 'Schoten' },
  { key: 'shotsOnTarget', label: 'Op doel' },
  { key: 'corners',       label: 'Hoekschoppen' },
  { key: 'fouls',         label: 'Overtredingen' },
  { key: 'yellowCards',   label: 'Gele kaarten' },
  { key: 'redCards',      label: 'Rode kaarten' },
]

function StatsTab({ lm, homeAbb, awayAbb }: { lm: LiveMatchData; homeAbb: string; awayAbb: string }) {
  const hs = lm.homeStats
  const as_ = lm.awayStats

  if (!hs && !as_) {
    return (
      <div className="text-center font-heading text-[12px]" style={{ color: MUTED }}>
        Statistieken niet beschikbaar
      </div>
    )
  }

  return (
    <div>
      <div className="grid font-heading text-[12px] text-white mb-1" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
        <span className="text-center">{homeAbb}</span>
        <span />
        <span className="text-center">{awayAbb}</span>
      </div>

      {STAT_ROWS.map(({ key, label, pct }) => {
        const hv = hs?.[key] ?? null
        const av = as_?.[key] ?? null
        if (hv === null && av === null) return null
        const hvStr = hv != null ? (pct ? `${hv}%` : String(hv)) : '–'
        const avStr = av != null ? (pct ? `${av}%` : String(av)) : '–'
        return (
          <div
            key={key}
            className="grid items-center"
            style={{ gridTemplateColumns: '1fr 2fr 1fr', borderBottom: ROW_BOTTOM, paddingTop: 3, paddingBottom: 3 }}
          >
            <span className="font-heading text-[12px] text-white text-center">{hvStr}</span>
            <span className="font-heading text-[12px] text-center uppercase tracking-wide" style={{ color: MUTED }}>{label}</span>
            <span className="font-heading text-[12px] text-white text-center">{avStr}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── TeamLogo ─────────────────────────────────────────────────────────────────

function TeamLogo({ lm, side, match, size }: { lm: LiveMatchData; side: 'home' | 'away'; match: Match; size: number }) {
  const logo = side === 'home' ? lm.homeTeamLogo : lm.awayTeamLogo
  const country = side === 'home' ? match.home : match.away
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={country}
        width={size}
        height={size}
        className="rounded-full object-contain"
        style={{ minWidth: size, background: 'rgba(255,255,255,0.08)' }}
      />
    )
  }
  return <FlagImage country={country} size={size} />
}

// ─── LiveMatchPanel ───────────────────────────────────────────────────────────

type PanelKey = 'timeline' | 'opstellingen' | 'stats'

const PANEL_LABELS: Record<PanelKey, string> = {
  timeline:     'Timeline',
  opstellingen: 'Opstellingen',
  stats:        'Stats',
}

type Trend = 'up' | 'down' | 'same'

function LiveMatchPanel({ lm, match, exporting }: { lm: LiveMatchData; match: Match; exporting: boolean }) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null)

  const prevOrderRef = useRef<string[]>([])
  const [trends, setTrends] = useState<Map<string, Trend>>(new Map())

  useEffect(() => {
    const currentOrder = lm.participantRows.map((r) => r.initials)
    const prevOrder = prevOrderRef.current
    if (prevOrder.length > 0 && currentOrder.join(',') !== prevOrder.join(',')) {
      const next = new Map<string, Trend>()
      currentOrder.forEach((initials, ci) => {
        const pi = prevOrder.indexOf(initials)
        next.set(initials, pi === -1 ? 'same' : ci < pi ? 'up' : ci > pi ? 'down' : 'same')
      })
      setTrends(next)
    }
    prevOrderRef.current = currentOrder
  }, [lm.participantRows])

  const togglePanel = (key: PanelKey) =>
    setOpenPanel((prev) => (prev === key ? null : key))

  const homeAbb = lm.homeTeamAbbr ?? COUNTRY_ABB[match.home] ?? match.home
  const awayAbb = lm.awayTeamAbbr ?? COUNTRY_ABB[match.away] ?? match.away
  const minuteStr = lm.status === 'PAUSED' ? 'HT' : lm.status === 'FINISHED' ? 'FT' : lm.minute != null ? `${lm.minute}'` : ''

  return (
    <div className="relative mb-4">

      {/* Score header */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <TeamLogo lm={lm} side="home" match={match} size={28} />
        <span className="font-accent font-light text-base text-white">{homeAbb}</span>
        <span className="font-heading text-white text-xl" style={{ minWidth: 48, textAlign: 'center' }}>
          {lm.score.home} – {lm.score.away}
        </span>
        <span className="font-accent font-light text-base text-white">{awayAbb}</span>
        <TeamLogo lm={lm} side="away" match={match} size={28} />
      </div>

      {/* Venue + attendance */}
      {(lm.venue || lm.attendance != null) && (
        <div className="text-center font-heading text-[12px] mt-1" style={{ color: MUTED }}>
          {[lm.venue, lm.attendance != null ? fmtAttendance(lm.attendance) : null]
            .filter(Boolean)
            .join(' • ')}
        </div>
      )}

      {/* Minuut */}
      {minuteStr && (
        <div className="text-center font-heading text-[14px] text-white mt-1">
          {minuteStr}
        </div>
      )}

      {/* Doelpunten */}
      {lm.goals.length > 0 && (
        <div className="flex flex-col gap-y-1.5 mt-3">
          {lm.goals.map((g, i) => (
            <div key={i} className="grid" style={{ gridTemplateColumns: '1fr 20px 1fr' }}>
              {g.team === 'home' ? (
                <div className="flex flex-col items-end pr-2">
                  <span className="font-heading text-[14px] text-white">
                    {g.minute}' {g.scorer}{goalTypeLabel(g.type)}
                  </span>
                  {g.assister && (
                    <span className="font-heading text-[11px] pr-2" style={{ color: '#888' }}>
                      ↳ {g.assister}
                    </span>
                  )}
                </div>
              ) : <span />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-ball.svg" width={16} height={16} alt="" style={{ display: 'block', margin: '0 auto', marginTop: 3, opacity: 0.55 }} />
              {g.team === 'away' ? (
                <div className="flex flex-col items-start pl-2">
                  <span className="font-heading text-[14px] text-white">
                    {g.scorer}{goalTypeLabel(g.type)} {g.minute}'
                  </span>
                  {g.assister && (
                    <span className="font-heading text-[11px] pl-2" style={{ color: '#888' }}>
                      ↳ {g.assister}
                    </span>
                  )}
                </div>
              ) : <span />}
            </div>
          ))}
        </div>
      )}

      {/* Knoppen */}
      {!exporting && (
        <div className="flex justify-center gap-1 mt-5 mb-2">
          {(['timeline', 'opstellingen', 'stats'] as PanelKey[]).map((key) => (
            <button
              key={key}
              onClick={() => togglePanel(key)}
              className="font-heading text-[13px] px-2.5 py-1 rounded"
              style={{
                background: openPanel === key ? 'rgba(255,107,0,0.85)' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: openPanel === key ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {PANEL_LABELS[key]}
            </button>
          ))}
        </div>
      )}

      {/* Deelnemerstabel + zwevend panel (overlay over de tabel, knoppen blijven zichtbaar) */}
      <div className="relative">

        {/* Zwevend panel */}
        {!exporting && openPanel && (
          <div
            className="absolute inset-0 z-10 overflow-y-auto rounded"
            style={{ background: 'rgba(14,16,26,0.97)', padding: '10px 12px 12px' }}
          >
            <button
              onClick={() => setOpenPanel(null)}
              className="absolute top-1.5 right-2 font-heading text-[28px] leading-none"
              style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
            >
              ×
            </button>
            {openPanel === 'timeline'     && <TimelineTab    lm={lm} />}
            {openPanel === 'opstellingen' && <OpstellingenTab lm={lm} homeAbb={homeAbb} awayAbb={awayAbb} />}
            {openPanel === 'stats'        && <StatsTab        lm={lm} homeAbb={homeAbb} awayAbb={awayAbb} />}
          </div>
        )}

      {/* Deelnemerstabel */}
      {(() => {
        const TG = '14px 45px 22px 20px 22px 36px 22px minmax(0,1fr) minmax(0,1fr) 32px'
        const VL = '1px solid rgba(255,255,255,0.14)'
        return (
          <>
            <div style={{ borderBottom: HDR_BOTTOM, paddingBottom: 3, marginBottom: 3 }}>
              <div className="grid font-heading text-[12px] uppercase tracking-wider text-white" style={{ gridTemplateColumns: TG }}>
                <span />
                <span />
                <span className="text-center" style={{ borderLeft: VL }}>Inzet</span>
                <span className="text-center" style={{ gridColumn: 'span 2', borderLeft: VL }}>Toto</span>
                <span className="text-center" style={{ gridColumn: 'span 2', borderLeft: VL }}>Uitslag</span>
                <span className="text-center" style={{ gridColumn: 'span 2', borderLeft: VL }}>Fantasy XV</span>
                <span className="text-right" style={{ borderLeft: VL }}>Ptn</span>
              </div>
            </div>

            {lm.participantRows.map((row) => {
              const totoColor = row.totoCorrect ? '#4ade80' : '#f87171'
              const uitslagColor = row.uitslagCorrect ? '#4ade80'
                : row.uitslagImpossible ? '#f87171'
                : row.uitslagPossible ? '#f97316'
                : MUTED
              const uitslagPrefix = row.uitslagCorrect ? '✓ ' : row.uitslagImpossible ? '✗ ' : ''
              const hp = row.fantasyHomePlayer
              const ap = row.fantasyAwayPlayer
              const homeScored = hp && (hp.goals > 0 || hp.assists > 0)
              const awayScored = ap && (ap.goals > 0 || ap.assists > 0)
              const homeLabel = hp ? `${homeScored ? '✓ ' : ''}${hp.name}` : ''
              const awayLabel = ap ? `${awayScored ? '✓ ' : ''}${ap.name}` : ''

              return (
                <div
                  key={row.initials}
                  className="grid items-center"
                  style={{ gridTemplateColumns: TG, borderBottom: ROW_BOTTOM, paddingTop: 3, paddingBottom: 3 }}
                >
                  {/* Trend */}
                  {(() => {
                    const t = trends.get(row.initials)
                    return t === 'up'
                      ? <span className="font-heading text-[11px] text-center leading-none" style={{ color: '#4ade80' }}>↑</span>
                      : t === 'down'
                      ? <span className="font-heading text-[11px] text-center leading-none" style={{ color: '#f87171' }}>↓</span>
                      : <span />
                  })()}

                  {/* Naam */}
                  <span className="font-heading font-normal text-[12px] text-white truncate">
                    {row.name.split(' ')[0]}
                  </span>

                  {/* Inzet */}
                  <span className="font-heading text-[12px] text-white" style={{ borderLeft: VL, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {row.tokens}
                  </span>

                  {/* Toto voorspelling */}
                  <span className="font-heading text-[12px]" style={{ color: totoColor, borderLeft: VL, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {row.totoCorrect ? `${row.toto} ✓` : (row.toto ?? '')}
                  </span>

                  {/* Toto odds */}
                  <span className="font-heading text-[12px] text-center" style={{ color: row.totoCorrect ? '#4ade80' : MUTED }}>
                    {row.totoOdds.toFixed(2)}
                  </span>

                  {/* Uitslag voorspelling */}
                  <span className="font-heading text-[12px]" style={{ color: uitslagColor, borderLeft: VL, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uitslagPrefix}{row.uitslag ? normalizeUitslag(row.uitslag) : ''}
                  </span>

                  {/* Uitslag odds */}
                  <span className="font-heading text-[12px] text-center" style={{ color: row.uitslagCorrect ? '#4ade80' : MUTED }}>
                    {row.uitslagOdds.toFixed(2)}
                  </span>

                  {/* Fantasy thuisland */}
                  <span className="font-heading text-[12px]" style={{ color: homeScored ? '#4ade80' : MUTED, borderLeft: VL, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <span className="truncate">{homeLabel}</span>
                  </span>

                  {/* Fantasy uitland */}
                  <span className="font-heading text-[12px] text-center truncate" style={{ color: awayScored ? '#4ade80' : MUTED }}>
                    {awayLabel}
                  </span>

                  {/* Virtueel totaal */}
                  <span className="font-heading text-[12px]" style={{ color: row.totalPotential > 0 ? '#FF6B00' : MUTED, borderLeft: VL, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {row.totalPotential > 0 ? row.totalPotential.toFixed(2) : '—'}
                  </span>
                </div>
              )
            })}
          </>
        )
      })()}

      </div> {/* einde relative wrapper */}
    </div>
  )
}

// ─── LiveSlide ────────────────────────────────────────────────────────────────

export const LiveSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, liveMatch, exporting = false }, ref) => {
    void String(matchdayId).padStart(2, '0')

    const match = MATCHES.find((m) => m.id === liveMatch.matchId)

    return (
      <SlideWrapper
        ref={ref}
        title="LIVE MATCH"
        titleFont="accent"
        titleDecoration={<span className="live-pulse-dot" />}
        minHeight={720}
      >
        {match ? (
          <LiveMatchPanel lm={liveMatch} match={match} exporting={exporting} />
        ) : (
          <div className="flex items-center justify-center flex-1">
            <span className="font-heading text-[12px]" style={{ color: MUTED }}>
              Wedstrijd niet gevonden
            </span>
          </div>
        )}
      </SlideWrapper>
    )
  }
)

LiveSlide.displayName = 'LiveSlide'
