'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import type { MatchdayConfig, MatchdayQuote } from '@/lib/matchday'
import type { MatchSlideData, PotPoint } from '@/lib/types/matchday'
import { PotChart } from '@/components/matchday/charts/PotChart'

interface Props {
  matchdayId: number
  config: MatchdayConfig
  group: 'og' | 'asc'
  totoVanDeDagName: string | null
  totoVanDeDagInitials: string | null
  // Each match: the "toto van de dag" participant's predictions
  matchData: Array<{
    match: MatchSlideData['match']
    quote: MatchdayQuote
    // prediction from toto van de dag participant
    participantToto: '1' | 'X' | '2' | null
    participantUitslag: string | null
  }>
  potHistory: PotPoint[]
}

function TotoRow({
  match,
  quote,
  toto,
}: {
  match: Props['matchData'][number]['match']
  quote: MatchdayQuote
  toto: '1' | 'X' | '2' | null
}) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-[#ffffff0d] text-xs">
      <FlagImage country={match.home} size={16} />
      <span className="text-[#aaa] text-[10px]">vs</span>
      <FlagImage country={match.away} size={16} />
      <span className="ml-auto font-bold text-white">
        {toto ?? '–'}
      </span>
      <span
        className="rounded px-1.5 py-0.5 font-bold text-xs"
        style={{ background: 'rgba(255,107,0,0.3)', color: '#FF8C33' }}
      >
        x {quote.totoOdds.toFixed(2)}
      </span>
    </div>
  )
}

function UitslagRow({
  match,
  quote,
  uitslag,
}: {
  match: Props['matchData'][number]['match']
  quote: MatchdayQuote
  uitslag: string | null
}) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-[#ffffff0d] text-xs">
      <FlagImage country={match.home} size={16} />
      <span className="text-[#aaa] text-[10px]">vs</span>
      <FlagImage country={match.away} size={16} />
      <span className="ml-auto font-bold text-white">{uitslag ?? '–'}</span>
      <span
        className="rounded px-1.5 py-0.5 font-bold text-xs"
        style={{ background: 'rgba(255,107,0,0.3)', color: '#FF8C33' }}
      >
        x {quote.uitslagOdds.toFixed(2)}
      </span>
    </div>
  )
}

export const InzetSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, config, group, totoVanDeDagName, matchData, potHistory }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')
    const potStand = group === 'og' ? config.og.potStand : config.asc.potStand

    return (
      <SlideWrapper ref={ref} title={`INZET ${padded}`}>
        {/* Toto van de dag header */}
        <div className="text-center mb-3">
          <p className="text-[#aaa] text-[11px] font-heading tracking-wider uppercase">
            Toto van de dag — de speelronde van
          </p>
          <p
            className="font-script text-2xl mt-0.5"
            style={{ color: '#FF6B00' }}
          >
            {totoVanDeDagName ?? '–'}
          </p>
        </div>

        {/* Toto bets (€1,00 combinatie) */}
        <div className="rounded-lg p-2 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-heading text-white text-xs tracking-wide">TOTO</span>
            <span className="text-[#FF6B00] font-bold text-xs">€ 1,00</span>
          </div>
          {matchData.map(({ match, quote, participantToto }) => (
            <TotoRow key={match.id} match={match} quote={quote} toto={participantToto} />
          ))}
        </div>

        {/* Uitslag bets (€1,00 per wedstrijd) */}
        <div className="rounded-lg p-2 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-heading text-white text-xs tracking-wide">UITSLAG</span>
            <span className="text-[#FF6B00] font-bold text-xs">€ 1,00 <span className="text-[#888] text-[10px]">× {matchData.length}</span></span>
          </div>
          {matchData.map(({ match, quote, participantUitslag }) => (
            <UitslagRow key={match.id} match={match} quote={quote} uitslag={participantUitslag} />
          ))}
        </div>

        {/* Pot stand */}
        <div className="flex items-center justify-between rounded-lg px-3 py-2 mb-3"
          style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.4)' }}
        >
          <span className="font-heading text-white text-xs tracking-wide">STAND VAN DE POT</span>
          <span className="font-bold text-[#FF6B00] text-lg">
            € {potStand.toFixed(2)}
          </span>
        </div>

        {/* Pot evolution chart */}
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <PotChart data={potHistory} totalMatchdays={27} />
        </div>
      </SlideWrapper>
    )
  }
)

InzetSlide.displayName = 'InzetSlide'
