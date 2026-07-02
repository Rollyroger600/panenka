'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { FlagImage } from '@/components/ui/FlagImage'
import { resolveTotoOdds, resolveUitslagOdds } from '@/lib/matchday'
import type { MatchdayQuote, CustomBet } from '@/lib/matchday'
import type { MatchSlideData } from '@/lib/types/matchday'
import { MATCHES } from '@/lib/data/matches'
import { COUNTRY_ABB } from '@/lib/data/countries'

interface Props {
  matchdayId: number
  totoVanDeDagName: string | null
  matchData: Array<{
    match: MatchSlideData['match']
    quote: MatchdayQuote
    participantToto: '1' | 'X' | '2' | null
    participantUitslag: string | null
  }>
  customBets?: CustomBet[]
  exporting?: boolean
}

export const InzetSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, totoVanDeDagName, matchData, customBets, exporting = false }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    if (customBets && customBets.length > 0) {
      return (
        <SlideWrapper ref={ref} title={`INZET ${padded}`} titleFont="accent" minHeight={720}>
          <div className="flex flex-col gap-5 mt-4 mx-2">
            {customBets.map((bet, idx) => {
              // backward compat: oude data heeft matchId (single), nieuwe heeft matchIds (array)
              const resolvedMatchIds = bet.matchIds
                ?? ((bet as unknown as { matchId?: number }).matchId != null
                  ? [(bet as unknown as { matchId: number }).matchId]
                  : [])
              return (
              <div
                key={idx}
                className="rounded-2xl px-5 py-5 flex flex-col gap-4"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,107,0,0.25)',
                }}
              >
                {resolvedMatchIds.length > 0 && (
                  <div className="flex flex-col gap-2 items-center">
                    {resolvedMatchIds.map((mid) => {
                      // matchData bevat de live samengevoegde teamnamen (incl. KO-teams uit KV);
                      // de statische MATCHES-fallback heeft voor KO-wedstrijden nog 'TBD'.
                      const m = matchData.find((d) => d.match.id === mid)?.match ?? MATCHES.find((x) => x.id === mid)
                      if (!m) return null
                      return (
                        <div key={mid} className="flex items-center gap-2">
                          <FlagImage country={m.home} size={24} />
                          <span className="font-accent font-light text-sm text-white">
                            {COUNTRY_ABB[m.home] ?? m.home}
                          </span>
                          <span className="font-heading text-white opacity-30">–</span>
                          <span className="font-accent font-light text-sm text-white">
                            {COUNTRY_ABB[m.away] ?? m.away}
                          </span>
                          <FlagImage country={m.away} size={24} />
                        </div>
                      )
                    })}
                  </div>
                )}

                <p className="font-heading text-[20px] text-white tracking-wide leading-snug text-center">
                  {bet.description}
                </p>

                <div
                  className="flex justify-between items-center pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <div className="flex flex-col items-center flex-1">
                    <span className="font-heading text-[11px] text-[#888] tracking-wider uppercase">Inzet</span>
                    <span className="font-heading text-[22px] text-white mt-1">
                      € {bet.inzet.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="font-heading text-[20px] text-white opacity-30">×</div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="font-heading text-[11px] text-[#888] tracking-wider uppercase">Quotering</span>
                    <span className="font-heading text-[22px] text-[#FF6B00] mt-1">
                      {bet.quotering.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </SlideWrapper>
      )
    }

    return (
      <SlideWrapper ref={ref} title={`INZET ${padded}`} titleFont="accent" minHeight={720}>

        {/* Subtitle — één regel, alles wit */}
        <p className="text-center mb-4 leading-snug" style={{ paddingTop: 8 }}>
          <span className="font-heading text-[18px] text-white tracking-wider uppercase">
            TOTO VAN DE DAG — DE SPEELRONDE VAN{' '}
          </span>
          <span className="font-script text-[26px] text-white leading-none">
            {totoVanDeDagName ?? '–'}
          </span>
        </p>

        {/* 3-kolommen tabel */}
        <div className="mb-3 mx-8">
          {/* Kolomkoppen — enige horizontale lijn */}
          <div
            className="flex font-heading text-[18px] text-white tracking-wider uppercase pb-2 mb-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div style={{ flex: 1 }} className="text-center">TOTO</div>
            <div style={{ flex: 3 }} className="text-center">WEDSTRIJD</div>
            <div style={{ flex: 1 }} className="flex items-center justify-center">UITSLAG</div>
          </div>

          {/* €1,00 rij */}
          <div className="flex font-heading text-[18px] text-white py-3">
            <div style={{ flex: 1 }} className="text-center">€ 1,00</div>
            <div style={{ flex: 3 }} />
            <div style={{ flex: 1 }} className="flex items-center justify-center">€ 1,00</div>
          </div>

          {/* 'x' tussen €1,00-rij en eerste wedstrijd */}
          <div className="flex leading-none">
            <div style={{ flex: 1 }} className="font-heading text-[20px] text-white opacity-50 text-center">×</div>
            <div style={{ flex: 3 }} />
            <div style={{ flex: 1 }} className="font-heading text-[20px] text-white opacity-50 flex items-center justify-center">×</div>
          </div>

          {/* Per-wedstrijd rijen met 'x' tussendoor in de TOTO-kolom */}
          {matchData.flatMap(({ match, quote, participantToto, participantUitslag }, idx) => {
            const isLast = idx === matchData.length - 1
            const homeOpacity = participantToto === '2' ? 0.40 : 0.85
            const awayOpacity = participantToto === '1' ? 0.40 : 0.85
            const row = (
              <div key={match.id} className={`flex items-center py-1 ${isLast ? 'pb-4' : ''}`}>
                {/* Kolom 1: toto quotering */}
                <div style={{ flex: 1 }} className="font-heading text-[18px] text-white text-center">
                  {resolveTotoOdds(quote, participantToto).toFixed(2)}
                </div>

                {/* Kolom 2: vlag thuis — uitslag — vlag uit */}
                <div style={{ flex: 3 }} className="flex items-center justify-center">
                  <div style={{ width: 56, opacity: homeOpacity }} className="flex justify-center items-center">
                    <FlagImage country={match.home} size={50} />
                  </div>
                  <div style={{ width: 52, textAlign: 'center' }} className="font-heading text-[18px] text-white">
                    {participantUitslag
                      ? participantUitslag.replace('-', ' - ')
                      : '–'}
                  </div>
                  <div style={{ width: 56, opacity: awayOpacity }} className="flex justify-center items-center">
                    <FlagImage country={match.away} size={50} />
                  </div>
                </div>

                {/* Kolom 3: uitslag quotering */}
                <div style={{ flex: 1 }} className="font-heading text-[18px] text-white flex items-center justify-center">
                  {resolveUitslagOdds(quote, participantUitslag).toFixed(2)}
                </div>
              </div>
            )

            if (idx < matchData.length - 1) {
              return [row, (
                <div key={`sep-${match.id}`} className="flex leading-none">
                  <div style={{ flex: 1 }} className="font-heading text-[20px] text-white opacity-50 text-center">×</div>
                  <div style={{ flex: 3 }} />
                  <div style={{ flex: 1 }} />
                </div>
              )]
            }
            return [row]
          })}
        </div>


      </SlideWrapper>
    )
  }
)

InzetSlide.displayName = 'InzetSlide'
