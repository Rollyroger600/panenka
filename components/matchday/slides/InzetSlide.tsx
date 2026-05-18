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
  matchData: Array<{
    match: MatchSlideData['match']
    quote: MatchdayQuote
    participantToto: '1' | 'X' | '2' | null
    participantUitslag: string | null
  }>
  potHistory: PotPoint[]
}

export const InzetSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, config, group, totoVanDeDagName, matchData, potHistory }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')
    const potStand = group === 'og' ? config.og.potStand : config.asc.potStand

    return (
      <SlideWrapper ref={ref} title={`INZET ${padded}`} titleFont="accent">

        {/* Subtitle — één regel, alles wit */}
        <p className="text-center mb-4 leading-snug">
          <span className="font-heading text-[18px] text-white tracking-wider uppercase">
            TOTO VAN DE DAG — DE SPEELRONDE VAN{' '}
          </span>
          <span className="font-script text-[18px] text-white leading-none">
            {totoVanDeDagName ?? '–'}
          </span>
        </p>

        {/* 3-kolommen tabel */}
        <div className="mb-5 mx-8">
          {/* Kolomkoppen — enige horizontale lijn */}
          <div
            className="flex font-heading text-[18px] text-white tracking-wider uppercase pb-2 mb-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div style={{ flex: 1 }} className="text-center">TOTO</div>
            <div style={{ flex: 2 }} className="text-center">WEDSTRIJD</div>
            <div style={{ flex: 1 }} className="text-center">UITSLAG</div>
          </div>

          {/* €1,00 rij */}
          <div className="flex font-heading text-[18px] text-white font-bold py-3">
            <div style={{ flex: 1 }} className="text-center">€ 1,00</div>
            <div style={{ flex: 2 }} />
            <div style={{ flex: 1 }} className="text-center">€ 1,00</div>
          </div>

          {/* 'x' tussen €1,00-rij en eerste wedstrijd */}
          <div className="flex leading-none">
            <div style={{ flex: 1 }} className="font-heading text-[14px] text-white opacity-50 text-center">×</div>
            <div style={{ flex: 2 }} />
            <div style={{ flex: 1 }} />
          </div>

          {/* Per-wedstrijd rijen met 'x' tussendoor in de TOTO-kolom */}
          {matchData.flatMap(({ match, quote, participantUitslag }, idx) => {
            const row = (
              <div key={match.id} className="flex items-center py-4">
                {/* Kolom 1: toto quotering */}
                <div style={{ flex: 1 }} className="font-heading text-[18px] text-white font-bold text-center">
                  {quote.totoOdds.toFixed(2)}
                </div>

                {/* Kolom 2: vlag thuis — uitslag — vlag uit */}
                <div style={{ flex: 2 }} className="flex items-center justify-center">
                  <div style={{ width: 56 }} className="flex justify-center items-center">
                    <FlagImage country={match.home} size={50} />
                  </div>
                  <div style={{ width: 52, textAlign: 'center' }} className="font-heading text-[18px] text-white font-bold">
                    {participantUitslag
                      ? participantUitslag.replace('-', ' - ')
                      : '–'}
                  </div>
                  <div style={{ width: 56 }} className="flex justify-center items-center">
                    <FlagImage country={match.away} size={50} />
                  </div>
                </div>

                {/* Kolom 3: uitslag quotering */}
                <div style={{ flex: 1 }} className="font-heading text-[18px] text-white font-bold text-center">
                  {quote.uitslagOdds.toFixed(2)}
                </div>
              </div>
            )

            if (idx < matchData.length - 1) {
              return [row, (
                <div key={`sep-${match.id}`} className="flex leading-none">
                  <div style={{ flex: 1 }} className="font-heading text-[14px] text-white opacity-50 text-center">×</div>
                  <div style={{ flex: 2 }} />
                  <div style={{ flex: 1 }} />
                </div>
              )]
            }
            return [row]
          })}
        </div>

        {/* Stand van de pot */}
        <div className="mb-3">
          <p className="font-heading text-[18px] text-white tracking-wider uppercase mb-1">
            STAND VAN DE POT:
          </p>
          <p className="font-heading text-[18px] text-white font-bold">
            € {potStand.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Pot evolutie grafiek */}
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <PotChart data={potHistory} totalMatchdays={27} />
        </div>

      </SlideWrapper>
    )
  }
)

InzetSlide.displayName = 'InzetSlide'
