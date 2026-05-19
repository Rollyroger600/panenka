'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import { COUNTRY_ABB } from '@/lib/data/countries'
import { WK_PLAYERS } from '@/lib/data/players'
import type { MatchSlideData } from '@/lib/types/matchday'

const MUTED = '#7e7667'
const VLINE = '1px solid rgba(255,255,255,0.14)'
const HDR   = { fontSize: 9, color: '#fff' } as const

const W = {
  name:    38,
  inzet:   20,
  toto1:   26,
  totoX:   26,
  toto2:   26,
  uitslag: 34,
  quote:   26,
}

function fmt(val: number | null | undefined): string {
  if (val == null) return ''
  return val.toFixed(2)
}

function fmtUitslag(uitslag: string | null | undefined): string {
  if (!uitslag) return ''
  return uitslag.replace('-', ' - ')
}

function middleName(name: string): string {
  if (!name) return ''
  return WK_PLAYERS.find((p) => p.name === name)?.middleName ?? name
}

interface Props {
  matchdayId: number
  slideIndex: 1 | 2
  matches: MatchSlideData[]
}

function MatchSection({ data, last }: { data: MatchSlideData; last?: boolean }) {
  const { match, odds, participantRows } = data

  return (
    <div className={last ? 'mb-0' : 'mb-3'}>
      {/* Match header */}
      <div className="relative flex flex-col items-center py-2">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-white font-heading text-sm font-bold text-white"
        >
          # {match.id}
        </div>
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={24} />
          <span className="font-accent font-light text-sm text-white">
            {COUNTRY_ABB[match.home] ?? match.home}
          </span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>–</span>
          <span className="font-accent font-light text-sm text-white">
            {COUNTRY_ABB[match.away] ?? match.away}
          </span>
          <FlagImage country={match.away} size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date} · {match.stadium}
        </p>
      </div>

      {/* Kolomkoppen — single flex row zodat verticale lijnen doorlopend zijn */}
      <div
        className="flex border-b font-heading uppercase"
        style={{ borderColor: 'rgba(255,255,255,0.15)', paddingBottom: 2 }}
      >
        {/* Naam */}
        <div style={{ width: W.name, borderRight: VLINE }} />

        {/* Inzet */}
        <div style={{ width: W.inzet, borderRight: VLINE, ...HDR }} className="flex items-center justify-center">
          Inzet
        </div>

        {/* Toto — sub-koppen 1 / X / 2 */}
        <div style={{ width: W.toto1 + W.totoX + W.toto2, borderRight: VLINE }} className="flex items-center">
          <div style={{ width: W.toto1, ...HDR }} className="flex justify-center">1</div>
          <div style={{ width: W.totoX, ...HDR }} className="flex justify-center">X</div>
          <div style={{ width: W.toto2, ...HDR }} className="flex justify-center">2</div>
        </div>

        {/* Uitslag Voorspelling — merged */}
        <div style={{ width: W.uitslag + W.quote, borderRight: VLINE, ...HDR }} className="flex items-center justify-center">
          Uitslag Voorspelling
        </div>

        {/* Fantasy XV — vlaggen boven eigen kolom, titel gecentreerd */}
        <div style={{ flex: 2, position: 'relative' }} className="flex items-center">
          <div style={{ flex: 1 }} className="flex justify-center">
            <FlagImage country={match.home} size={10} />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 font-heading uppercase" style={HDR}>
            Fantasy XV
          </span>
          <div style={{ flex: 1 }} className="flex justify-center">
            <FlagImage country={match.away} size={10} />
          </div>
        </div>
      </div>

      {/* Deelnemerssrijen */}
      {participantRows.map((row) => (
        <div
          key={row.initials}
          className="flex border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {[
            { w: W.name,    vline: true,  content: <span className="font-heading text-[9px] font-bold italic truncate">{row.name}</span>, left: true  },
            { w: W.inzet,   vline: true,  content: row.tokens ?? '',                              left: false },
            { w: W.toto1,   vline: false, content: row.toto === '1' ? fmt(odds?.home) : '',  left: false },
            { w: W.totoX,   vline: false, content: row.toto === 'X' ? fmt(odds?.draw) : '',  left: false },
            { w: W.toto2,   vline: true,  content: row.toto === '2' ? fmt(odds?.away) : '',  left: false },
            { w: W.uitslag, vline: false, content: fmtUitslag(row.uitslag),                   left: false },
            { w: W.quote,   vline: true,  content: fmt(row.uitslagQuote),                     left: false },
          ].map(({ w, vline, content, left }, i) => (
            <div
              key={i}
              className={`font-heading text-[9px] text-white flex items-center ${left ? 'justify-start' : 'justify-center'}`}
              style={{ width: w, flexShrink: 0, paddingTop: 1, paddingBottom: 1, borderRight: vline ? VLINE : undefined }}
            >
              {content}
            </div>
          ))}
          <div
            className="font-heading text-white flex items-center justify-center truncate px-0.5"
            style={{ flex: 1, fontSize: 8, paddingTop: 1, paddingBottom: 1 }}
          >
            {middleName(row.fantasyHome ?? '')}
          </div>
          <div
            className="font-heading text-white flex items-center justify-center truncate px-0.5"
            style={{ flex: 1, fontSize: 8, paddingTop: 1, paddingBottom: 1 }}
          >
            {middleName(row.fantasyAway ?? '')}
          </div>
        </div>
      ))}

    </div>
  )
}

export const MatchSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, slideIndex, matches }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    return (
      <SlideWrapper ref={ref} title={`MATCHDAY ${padded}`} titleFont="accent" minHeight={720}>
        {matches.map((m, i) => (
          <MatchSection key={m.matchId} data={m} last={i === matches.length - 1} />
        ))}
      </SlideWrapper>
    )
  }
)

MatchSlide.displayName = 'MatchSlide'
