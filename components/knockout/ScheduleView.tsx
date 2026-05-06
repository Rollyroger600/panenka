'use client'
import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Prediction } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import {
  R32_MATCHES, BRACKET_HALVES, R16_DATES, GROUP_INDEX,
} from '@/lib/data/bracketSchedule'
import type { Qualifier, R32Match } from '@/lib/data/bracketSchedule'
import { POULES } from '@/lib/data/knockoutRounds'
import { computeStandings } from '@/lib/standings'
import { getThirdPlaceAssignment } from '@/lib/data/thirdPlaceAssignment'

type Picks = Record<string, { country: string | null; tok: number }>
type ResolvedW3 = { country: string; group: string }
type W3Map = Record<number, ResolvedW3>

function getCountry(q: Qualifier, picks: Picks): string | null {
  if (q.kind === 'w3') return null
  return picks[`${q.kind}_${GROUP_INDEX[q.group]}`]?.country ?? null
}

// Resolve which country plays in each of the 8 R32 slots that involve a
// best-3rd qualifier, based on the participant's group-stage predictions.
// Returns null if the group stage isn't fully filled in.
function computeW3Map(predictions: Record<number, Prediction>): W3Map | null {
  const standings = computeStandings(predictions)
  for (const poule of POULES) {
    const rows = standings[poule]
    if (!rows || rows.length < 4) return null
    for (const row of rows) {
      if (row.played !== 3) return null
    }
  }

  const thirds = POULES.map((poule) => {
    const row = standings[poule][2]
    return { poule, country: row.country, pts: row.pts, gd: row.gd, gf: row.gf }
  })
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

  const top8 = thirds.slice(0, 8)
  const assignment = getThirdPlaceAssignment(top8.map((t) => t.poule))
  if (!assignment) return null

  const result: W3Map = {}
  for (const [matchStr, groupLetter] of Object.entries(assignment)) {
    const third = thirds.find((t) => t.poule === groupLetter)
    if (third) result[Number(matchStr)] = { country: third.country, group: groupLetter }
  }
  return result
}

function QualChip({
  q, country, resolvedW3,
}: {
  q: Qualifier
  country: string | null
  resolvedW3?: ResolvedW3 | null
}) {
  if (q.kind === 'w3') {
    if (resolvedW3) {
      return (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[9px] font-bold shrink-0 text-[#FFB800]">3{resolvedW3.group}</span>
          <FlagImage country={resolvedW3.country} size={11} />
          <span className="text-[10px] text-white font-bold truncate max-w-[64px]">{resolvedW3.country}</span>
        </div>
      )
    }
    return (
      <span className="text-[10px] text-[#3a3a3a] italic leading-none">
        3e · {q.pool}
      </span>
    )
  }
  const badge = q.kind === 'w1' ? `1${q.group}` : `2${q.group}`
  const badgeColor = q.kind === 'w1' ? 'text-[#FF6B00]' : 'text-[#666]'
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className={`text-[9px] font-bold shrink-0 ${badgeColor}`}>{badge}</span>
      {country ? (
        <>
          <FlagImage country={country} size={11} />
          <span className="text-[10px] text-white font-bold truncate max-w-[64px]">{country}</span>
        </>
      ) : (
        <span className="text-[10px] text-[#2a2a2a]">?</span>
      )}
    </div>
  )
}

function R32Row({
  match, picks, w3Map,
}: {
  match: R32Match
  picks: Picks
  w3Map: W3Map | null
}) {
  const homeCountry = getCountry(match.home, picks)
  const awayCountry = getCountry(match.away, picks)
  const homeW3 = match.home.kind === 'w3' ? w3Map?.[match.num] ?? null : null
  const awayW3 = match.away.kind === 'w3' ? w3Map?.[match.num] ?? null : null
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#181818] last:border-0">
      <span className="text-[9px] text-[#333] w-7 shrink-0">M{match.num}</span>
      <QualChip q={match.home} country={homeCountry} resolvedW3={homeW3} />
      <span className="text-[9px] text-[#2a2a2a] shrink-0">×</span>
      <QualChip q={match.away} country={awayCountry} resolvedW3={awayW3} />
    </div>
  )
}

export function ScheduleView() {
  const [open, setOpen] = useState(false)
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)
  const predictions = useGameStore((s) => s.predictions)

  const w3Map = useMemo(() => computeW3Map(predictions), [predictions])

  const filledW1 = Array.from({ length: 12 }, (_, i) => knockoutPicks[`w1_${i}`]?.country).filter(Boolean).length
  const filledW2 = Array.from({ length: 12 }, (_, i) => knockoutPicks[`w2_${i}`]?.country).filter(Boolean).length
  const filled = filledW1 + filledW2

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] overflow-hidden mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-white">Toernooisschema</span>
        <div className="flex items-center gap-2">
          {w3Map && (
            <span className="text-[10px] text-[#FFB800] font-bold">3e bepaald</span>
          )}
          <span className="text-xs text-[#555]">{filled}/24 gepickt</span>
          <span className="text-[#555] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <p className="text-[10px] text-[#3a3a3a] mb-3 leading-relaxed">
            {w3Map
              ? 'Zestiende finales met jouw poulewinnaars, nummers 2 en de 8 beste nummers 3.'
              : 'Zestiende finales op basis van jouw groepeindstanden. Beste nr.3-slots verschijnen zodra alle pouleuitslagen zijn ingevuld.'}
          </p>

          {BRACKET_HALVES.map((half, hi) => {
            const sfLabel = `SF M${half.sf}`
            const kfLabel = `KF M${half.kf}`
            return (
              <div key={half.kf} className={hi < 3 ? 'mb-4' : ''}>
                {/* Half-separator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-[#222]" />
                  <span className="text-[9px] text-[#3a3a3a] uppercase tracking-wider shrink-0">
                    {kfLabel} · {sfLabel} · Finale
                  </span>
                  <div className="h-px flex-1 bg-[#222]" />
                </div>

                {half.r16.map((r16num) => {
                  const matches = R32_MATCHES.filter((m) => m.r16 === r16num)
                  return (
                    <div
                      key={r16num}
                      className="rounded-lg bg-[#111] border border-[#1e1e1e] mb-2 last:mb-0 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 bg-[#0D0D0D] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#666]">R16 · M{r16num}</span>
                        <span className="text-[9px] text-[#333]">{R16_DATES[r16num]}</span>
                      </div>
                      <div className="px-3 pt-1 pb-0.5">
                        {matches.map((m) => (
                          <R32Row key={m.num} match={m} picks={knockoutPicks} w3Map={w3Map} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
