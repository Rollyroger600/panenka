'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Prediction } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'
import { R32_MATCHES, GROUP_INDEX } from '@/lib/data/bracketSchedule'
import type { Qualifier } from '@/lib/data/bracketSchedule'
import { POULES } from '@/lib/data/knockoutRounds'
import { computeStandings } from '@/lib/standings'
import { getThirdPlaceAssignment } from '@/lib/data/thirdPlaceAssignment'
import { COUNTRY_ABB } from '@/lib/data/countries'

// ─── Layout constants (px) ───────────────────────────────────────────────────
const SLOT = 24       // height of one team chip
const INNER = 2       // gap between the 2 teams of the same R32 match
const MATCH_GAP = 8   // gap between the 2 R32 matches inside a bracket group
const GROUP_GAP = 14  // gap between bracket groups
const GROUP_H = 4 * SLOT + 2 * INNER + MATCH_GAP  // 108 px per bracket group

function blockH(n: number) { return n * GROUP_H + (n - 1) * GROUP_GAP }
const TOTAL_H = blockH(8)  // 962 px — same for every column

// ─── Bracket order: 8 groups, each = 2 R32 matches that feed 1 R16 match ────
const BRACKET_GROUPS: [number, number][] = [
  [74, 77], [73, 75],   // → R16 M89, M90 → KF M97 → SF M101
  [83, 84], [81, 82],   // → R16 M93, M94 → KF M98 → SF M101
  [76, 78], [79, 80],   // → R16 M91, M92 → KF M99 → SF M102
  [86, 88], [85, 87],   // → R16 M95, M96 → KF M100 → SF M102
]

const TAB_COL: Record<string, number> = { r16: 1, r8: 2, r4: 3, finale: 4, winner: 5 }

const COL_LABELS = ['R 32', 'R 16', '1/4', '1/2', 'Fin', 'Win']
const COL_TABS   = [null, 'r16', 'r8', 'r4', 'finale', 'winner']

// ─── Types ───────────────────────────────────────────────────────────────────
type Picks = Record<string, { country: string | null; tok: number }>
type ResolvedW3 = { country: string; group: string }
type W3Map = Record<number, ResolvedW3>

// ─── Resolve a qualifier to a country ────────────────────────────────────────
function resolveTeam(q: Qualifier, matchNum: number, picks: Picks, w3Map: W3Map | null): string | null {
  if (q.kind === 'w3') return w3Map?.[matchNum]?.country ?? null
  return picks[`${q.kind}_${GROUP_INDEX[q.group]}`]?.country ?? null
}

// ─── Infer which team advances based on a set of picks ───────────────────────
function infer(a: string | null, b: string | null, set: Set<string>): string | null {
  if (a && set.has(a)) return a
  if (b && set.has(b)) return b
  return null
}

// ─── Compute w3Map from group-stage standings ─────────────────────────────────
function computeW3Map(predictions: Record<number, Prediction>): W3Map | null {
  const standings = computeStandings(predictions)
  for (const poule of POULES) {
    const rows = standings[poule]
    if (!rows || rows.length < 4) return null
    for (const row of rows) { if (row.played !== 3) return null }
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

// ─── Team chip ────────────────────────────────────────────────────────────────
function TeamChip({ country }: { country: string | null }) {
  const abb = country ? (COUNTRY_ABB[country] ?? country.slice(0, 3).toUpperCase()) : null
  return (
    <div
      className={`flex items-center gap-0.5 px-1 rounded-sm border w-full overflow-hidden ${
        country
          ? 'bg-[#161616] border-[#2a2a2a] text-[#ccc]'
          : 'bg-[#0d0d0d] border-[#1a1a1a] text-[#2a2a2a]'
      }`}
      style={{ height: SLOT, minHeight: SLOT, maxHeight: SLOT, fontSize: 9 }}
    >
      {country ? (
        <>
          <FlagImage country={country} size={11} className="shrink-0" />
          <span className="font-accent font-light truncate leading-none">{abb}</span>
        </>
      ) : (
        <span className="w-full text-center">?</span>
      )}
    </div>
  )
}

// ─── Column header ─────────────────────────────────────────────────────────────
function ColHeader({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`text-center pb-1 mb-1.5 text-[9px] font-bold uppercase tracking-widest border-b whitespace-nowrap ${
        active ? 'text-[#FF6B00] border-[#FF6B00]' : 'text-[#444] border-[#222]'
      }`}
    >
      {label}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ScheduleView({ activeTab }: { activeTab: string }) {
  const [open, setOpen] = useState(false)
  const knockoutPicks = useGameStore((s) => s.knockoutPicks)
  const predictions   = useGameStore((s) => s.predictions)

  const scrollRef = useRef<HTMLDivElement>(null)
  const colRefs   = useRef<(HTMLDivElement | null)[]>([])

  const w3Map = useMemo(() => computeW3Map(predictions), [predictions])

  // ── Bracket data ──────────────────────────────────────────────────────────
  const bracket = useMemo(() => {
    const makeSet = (id: string, n: number) =>
      new Set(
        Array.from({ length: n }, (_, i) => knockoutPicks[`${id}_${i}`]?.country)
          .filter(Boolean) as string[]
      )
    const r16Set    = makeSet('r16', 16)
    const r8Set     = makeSet('r8', 8)
    const r4Set     = makeSet('r4', 4)
    const finaleSet = makeSet('finale', 2)

    const matchByNum = Object.fromEntries(R32_MATCHES.map((m) => [m.num, m]))

    const groups = BRACKET_GROUPS.map(([numA, numB]) => {
      const mA = matchByNum[numA]
      const mB = matchByNum[numB]
      const homeA = resolveTeam(mA.home, numA, knockoutPicks, w3Map)
      const awayA = resolveTeam(mA.away, numA, knockoutPicks, w3Map)
      const homeB = resolveTeam(mB.home, numB, knockoutPicks, w3Map)
      const awayB = resolveTeam(mB.away, numB, knockoutPicks, w3Map)
      const r16A  = infer(homeA, awayA, r16Set)
      const r16B  = infer(homeB, awayB, r16Set)
      const qf    = infer(r16A, r16B, r8Set)
      return { homeA, awayA, homeB, awayB, r16A, r16B, qf }
    })

    const sfTeams = [0, 1, 2, 3].map((pi) =>
      infer(groups[pi * 2].qf, groups[pi * 2 + 1].qf, r4Set)
    )
    const finalists = [
      infer(sfTeams[0], sfTeams[1], finaleSet),
      infer(sfTeams[2], sfTeams[3], finaleSet),
    ]
    const winner = knockoutPicks['winner_0']?.country ?? null

    return { groups, sfTeams, finalists, winner }
  }, [knockoutPicks, w3Map])

  // ── Scroll active column into view ────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const colIdx = TAB_COL[activeTab] ?? 1
    const el    = colRefs.current[colIdx]
    const scr   = scrollRef.current
    if (!el || !scr) return
    const elLeft       = el.offsetLeft
    const elWidth      = el.offsetWidth
    const scrWidth     = scr.clientWidth
    const targetScroll = elLeft - scrWidth / 2 + elWidth / 2
    scr.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' })
  }, [open, activeTab])

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden mb-4" style={{ background: 'rgba(22,22,22,0.82)' }}>
      {/* ── Collapsed header ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3"
      >
        <span className="text-sm font-bold text-white">Toernooisschema</span>
        <span className="text-[#555] text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Bracket ── */}
      {open && (
        <div className="px-2 pb-3">
          <div ref={scrollRef} className="overflow-x-auto">
            <div className="flex" style={{ minWidth: 'max-content', gap: 4 }}>

              {/* ─ R32 column ─ */}
              <div ref={(el) => { colRefs.current[0] = el }} style={{ width: 76, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[0]} active={COL_TABS[0] === activeTab} />
                <div style={{ height: TOTAL_H }}>
                  {bracket.groups.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex flex-col" style={{ height: GROUP_H }}>
                        <div style={{ height: SLOT }}><TeamChip country={g.homeA} /></div>
                        <div style={{ height: INNER }} />
                        <div style={{ height: SLOT }}><TeamChip country={g.awayA} /></div>
                        <div style={{ height: MATCH_GAP }} />
                        <div style={{ height: SLOT }}><TeamChip country={g.homeB} /></div>
                        <div style={{ height: INNER }} />
                        <div style={{ height: SLOT }}><TeamChip country={g.awayB} /></div>
                      </div>
                      {gi < 7 && <div style={{ height: GROUP_GAP }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ R16 column ─ */}
              <div ref={(el) => { colRefs.current[1] = el }} style={{ width: 68, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[1]} active={COL_TABS[1] === activeTab} />
                <div style={{ height: TOTAL_H }}>
                  {bracket.groups.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex flex-col" style={{ height: GROUP_H }}>
                        {/* r16A centered over match A */}
                        <div className="flex items-center" style={{ height: SLOT + INNER + SLOT }}>
                          <TeamChip country={g.r16A} />
                        </div>
                        <div style={{ height: MATCH_GAP }} />
                        {/* r16B centered over match B */}
                        <div className="flex items-center" style={{ height: SLOT + INNER + SLOT }}>
                          <TeamChip country={g.r16B} />
                        </div>
                      </div>
                      {gi < 7 && <div style={{ height: GROUP_GAP }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ QF column ─ */}
              <div ref={(el) => { colRefs.current[2] = el }} style={{ width: 68, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[2]} active={COL_TABS[2] === activeTab} />
                <div style={{ height: TOTAL_H }}>
                  {bracket.groups.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex items-center justify-center" style={{ height: GROUP_H }}>
                        <TeamChip country={g.qf} />
                      </div>
                      {gi < 7 && <div style={{ height: GROUP_GAP }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ SF column ─ */}
              <div ref={(el) => { colRefs.current[3] = el }} style={{ width: 68, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[3]} active={COL_TABS[3] === activeTab} />
                <div style={{ height: TOTAL_H }}>
                  {[0, 1, 2, 3].map((si) => (
                    <div key={si}>
                      <div className="flex items-center justify-center" style={{ height: blockH(2) }}>
                        <TeamChip country={bracket.sfTeams[si]} />
                      </div>
                      {si < 3 && <div style={{ height: GROUP_GAP }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ Final column ─ */}
              <div ref={(el) => { colRefs.current[4] = el }} style={{ width: 68, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[4]} active={COL_TABS[4] === activeTab} />
                <div style={{ height: TOTAL_H }}>
                  {[0, 1].map((fi) => (
                    <div key={fi}>
                      <div className="flex items-center justify-center" style={{ height: blockH(4) }}>
                        <TeamChip country={bracket.finalists[fi]} />
                      </div>
                      {fi === 0 && <div style={{ height: GROUP_GAP }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ Winner column ─ */}
              <div ref={(el) => { colRefs.current[5] = el }} style={{ width: 68, flexShrink: 0 }}>
                <ColHeader label={COL_LABELS[5]} active={COL_TABS[5] === activeTab} />
                <div className="flex items-center justify-center" style={{ height: TOTAL_H }}>
                  <TeamChip country={bracket.winner} />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
