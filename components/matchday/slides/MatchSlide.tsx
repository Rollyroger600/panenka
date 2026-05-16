'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import type { MatchSlideData } from '@/lib/types/matchday'

const MUTED = '#7e7667'

interface Props {
  matchdayId: number
  slideIndex: 1 | 2
  matches: MatchSlideData[]
}

function MatchSection({ data }: { data: MatchSlideData }) {
  const { match, odds, participantRows } = data

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden mb-2.5" style={{ background: 'rgba(22,22,22,0.82)' }}>

      {/* Match header — same style as MatchCard */}
      <div className="relative flex flex-col items-center px-3 py-2" style={{ background: 'rgba(10,10,10,0.75)' }}>
        {/* Match number badge */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-8 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-xs font-bold text-white"
          style={{ background: 'rgba(37,37,37,0.8)' }}
        >
          #{match.id}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2">
          <FlagImage country={match.home} size={22} />
          <span className="font-accent font-light text-sm text-white tracking-wide">
            {match.home.toUpperCase()}
          </span>
          <span className="font-heading font-bold text-sm" style={{ color: MUTED }}>–</span>
          <span className="font-accent font-light text-sm text-white tracking-wide">
            {match.away.toUpperCase()}
          </span>
          <FlagImage country={match.away} size={22} />
        </div>

        {/* Date & stadium */}
        <p className="font-heading text-[10px] uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          {match.date} · {match.stadium}
        </p>
      </div>

      {/* Content */}
      <div className="px-2 pt-1 pb-1">
        {/* Column headers */}
        {odds && (
          <div className="flex font-heading text-[8px] mb-0.5" style={{ color: MUTED, paddingLeft: 72 }}>
            <span className="w-10 text-center">1 ({odds.home})</span>
            <span className="w-10 text-center">X ({odds.draw})</span>
            <span className="w-10 text-center">2 ({odds.away})</span>
            <span className="w-14 text-center">Uitslag</span>
            <span className="w-9 text-center">Quote</span>
            <span className="flex-1 text-center">Thuis</span>
            <span className="flex-1 text-center">Uit</span>
          </div>
        )}

        {/* Participant rows */}
        {participantRows.map((row) => (
          <div
            key={row.initials}
            className="flex items-center border-b border-[#ffffff08]"
            style={{ paddingTop: 2, paddingBottom: 2 }}
          >
            {/* Token badge */}
            <div className="w-6 shrink-0 mr-1">
              <span
                className="inline-flex items-center justify-center rounded font-heading text-[9px] font-bold w-5 h-5"
                style={{
                  background: row.tokens ? '#FF6B00' : '#2a2a2a',
                  color: row.tokens ? '#fff' : '#555',
                }}
              >
                {row.tokens ?? '–'}
              </span>
            </div>

            {/* Name */}
            <div className="shrink-0" style={{ width: 46 }}>
              <span className="font-heading text-[9px] font-bold italic text-white truncate block">
                {row.name}
              </span>
            </div>

            {/* Toto 1 */}
            <div className="w-10 text-center shrink-0">
              {row.toto === '1' ? (
                <span className="font-heading font-bold text-[9px] px-1 rounded" style={{ background: 'rgba(255,107,0,0.8)', color: '#fff' }}>1</span>
              ) : (
                <span className="font-heading text-[9px]" style={{ color: '#333' }}>·</span>
              )}
            </div>

            {/* Toto X */}
            <div className="w-10 text-center shrink-0">
              {row.toto === 'X' ? (
                <span className="font-heading font-bold text-[9px] px-1 rounded" style={{ background: 'rgba(255,107,0,0.8)', color: '#fff' }}>X</span>
              ) : (
                <span className="font-heading text-[9px]" style={{ color: '#333' }}>·</span>
              )}
            </div>

            {/* Toto 2 */}
            <div className="w-10 text-center shrink-0">
              {row.toto === '2' ? (
                <span className="font-heading font-bold text-[9px] px-1 rounded" style={{ background: 'rgba(255,107,0,0.8)', color: '#fff' }}>2</span>
              ) : (
                <span className="font-heading text-[9px]" style={{ color: '#333' }}>·</span>
              )}
            </div>

            {/* Uitslag */}
            <div className="w-14 text-center shrink-0">
              <span className="font-heading text-[9px]" style={{ color: row.uitslag ? '#e0e0e0' : '#555' }}>
                {row.uitslag ?? '–'}
              </span>
            </div>

            {/* Quote */}
            <div className="w-9 text-center shrink-0">
              <span className="font-heading text-[9px]" style={{ color: row.uitslagQuote != null ? '#FF8C33' : '#555' }}>
                {row.uitslagQuote != null ? row.uitslagQuote : '–'}
              </span>
            </div>

            {/* Fantasy home */}
            <div className="flex-1 text-center truncate px-0.5">
              <span className="font-heading text-[8px]" style={{ color: '#bbb' }}>{row.fantasyHome ?? '–'}</span>
            </div>

            {/* Fantasy away */}
            <div className="flex-1 text-center truncate px-0.5">
              <span className="font-heading text-[8px]" style={{ color: '#bbb' }}>{row.fantasyAway ?? '–'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const MatchSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, slideIndex, matches }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    return (
      <SlideWrapper ref={ref} title={`MATCHDAY ${padded}`} titleFont="accent">
        {matches.map((m) => (
          <MatchSection key={m.matchId} data={m} />
        ))}
      </SlideWrapper>
    )
  }
)

MatchSlide.displayName = 'MatchSlide'
