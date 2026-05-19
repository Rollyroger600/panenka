'use client'
import { useState } from 'react'
import { MatchdayDrawer } from '@/components/matchday/MatchdayDrawer'
import type { FullMatchdayData, LiveMatchData } from '@/lib/types/matchday'

const OG = [
  { name: 'Michiel',  initials: 'MG'  },
  { name: 'Bob',      initials: 'BH'  },
  { name: 'Thom',     initials: 'TW'  },
  { name: 'Henk Jan', initials: 'HP'  },
  { name: 'Rogier',   initials: 'RH'  },
  { name: 'Daan',     initials: 'DM'  },
  { name: 'Barthold', initials: 'BM'  },
  { name: 'Robert',   initials: 'RA'  },
  { name: 'Tom',      initials: 'TdL' },
  { name: 'Willem',   initials: 'WP'  },
  { name: 'Bert',     initials: 'BS'  },
  { name: 'Wouter',   initials: 'WS'  },
  { name: 'Tim',      initials: 'TvL' },
  { name: 'Timo',     initials: 'TG'  },
  { name: 'Laurens',  initials: 'LV'  },
]

const TOTOS: Array<'1' | 'X' | '2'> = ['1', '1', '2', 'X', '1', '2', '1', 'X', '2', '1', '1', 'X', '2', '1', '2']
const UITSLAGEN = ['2-1', '1-0', null, null, '3-1', null, '2-0', null, null, '1-1', '2-1', null, null, '1-0', null]
const TOKENS    = [8, 5, 3, 6, 4, 7, 2, 9, 5, 3, 6, 4, 7, 5, 3]

const fantasyHome = ['Van Dijk', 'De Bruyne', 'Messi', 'Ronaldo', 'Mbappé', 'Haaland', 'Vinicius', 'Pedri', 'Bellingham', 'Salah', 'Kane', 'Modric', 'Lewandowski', 'Neymar', 'Müller']
const fantasyAway = ['Neuer', 'Oblak', 'Alisson', 'Courtois', 'Ter Stegen', 'Donnarumma', 'Ederson', 'Pickford', 'Lloris', 'Navas', 'De Gea', 'Sommer', 'Flekken', 'Rochet', 'Musso']

function buildParticipantRows(matchIdx: number) {
  return OG.map((p, i) => ({
    initials: p.initials,
    name: p.name,
    tokens: TOKENS[(i + matchIdx) % TOKENS.length],
    toto: TOTOS[(i + matchIdx) % TOTOS.length],
    uitslag: UITSLAGEN[(i + matchIdx) % UITSLAGEN.length],
    uitslagQuote: UITSLAGEN[(i + matchIdx) % UITSLAGEN.length] ? 6.5 + (i % 4) : null,
    fantasyHome: fantasyHome[(i + matchIdx * 3) % fantasyHome.length],
    fantasyAway: fantasyAway[(i + matchIdx * 2) % fantasyAway.length],
  }))
}

const MOCK_DATA: FullMatchdayData = {
  matchdayId: 7,
  config: {
    matchdayId: 7,
    quotes: [
      { matchId: 1, totoOdds: 2.10, uitslagOdds: 6.50 },
      { matchId: 2, totoOdds: 2.80, uitslagOdds: 7.00 },
      { matchId: 3, totoOdds: 1.90, uitslagOdds: 8.50 },
      { matchId: 4, totoOdds: 2.40, uitslagOdds: 6.00 },
    ],
    og:  { potStand: 138.50 },
    asc: { potStand: 97.00 },
    savedAt: '2026-06-14T18:00:00Z',
  },
  totoVanDeDagInitials: 'RH',
  totoVanDeDagName: 'Rogier',
  matchSlides: [
    [
      {
        matchId: 1,
        match: { id: 1, poule: 'A', round: 1, date: '11 jun', home: 'Mexico', away: 'Zuid-Afrika', stadium: 'Estadio Azteca Mexico City' },
        odds: { home: 2.10, draw: 3.40, away: 3.20, scores: { '2-1': 8, '1-0': 6.5, '0-0': 10, '1-1': 7 } },
        participantRows: buildParticipantRows(0),
      },
      {
        matchId: 2,
        match: { id: 2, poule: 'A', round: 1, date: '12 jun', home: 'Zuid-Korea', away: 'Tsjechië', stadium: 'Estadio Guadalajara' },
        odds: { home: 2.80, draw: 3.10, away: 2.40, scores: { '1-2': 9.5, '0-1': 7, '1-1': 6.5, '2-1': 9 } },
        participantRows: buildParticipantRows(1),
      },
    ],
    [
      {
        matchId: 3,
        match: { id: 3, poule: 'B', round: 1, date: '12 jun', home: 'Canada', away: 'Bosnië en Herzegovina', stadium: 'Toronto Stadium' },
        odds: { home: 1.90, draw: 3.50, away: 3.80, scores: { '2-0': 7.5, '1-0': 6.25, '2-1': 8, '3-1': 14 } },
        participantRows: buildParticipantRows(2),
      },
      {
        matchId: 4,
        match: { id: 4, poule: 'D', round: 1, date: '13 jun', home: 'Verenigde Staten', away: 'Paraguay', stadium: 'Los Angeles Stadium' },
        odds: { home: 2.40, draw: 3.20, away: 2.90, scores: { '2-1': 8.5, '1-0': 7, '0-1': 10.5, '1-1': 6.25 } },
        participantRows: buildParticipantRows(3),
      },
    ],
  ],
  scores: OG.map((p, i) => ({
    initials: p.initials,
    name: p.name,
    poulefase:  [42, 38, 35, 31, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8][i],
    kofase:     [15, 12, 10,  8,  8,  6,  6,  4,  4,  2,  2,  0,  0,  0, 0][i],
    doorgaandeLanden: [8, 6, 6, 4, 4, 4, 2, 2, 2, 0, 0, 0, 0, 0, 0][i],
    fantasy:    [22, 18, 16, 14, 12, 12, 10,  8,  8,  6,  6,  4,  4,  2, 0][i],
    total:      [87, 74, 67, 57, 52, 48, 42, 36, 34, 26, 24, 18, 16, 12, 8][i],
    totoGoed:   [ 5,  4,  4,  3,  3,  3,  2,  2,  2,  1,  1,  1,  0,  0, 0][i],
    uitslagGoed:[ 2,  1,  1,  1,  0,  1,  0,  0,  1,  0,  0,  0,  0,  0, 0][i],
    koR32:      [ 4,  3,  3,  2,  2,  1,  1,  1,  1,  0,  0,  0,  0,  0, 0][i],
    koR16:      [ 3,  2,  2,  2,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0, 0][i],
    koKF:       [ 2,  2,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0, 0][i],
    koHF:       [ 2,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0][i],
    koFinale:   [ 2,  2,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0, 0][i],
    koWinnaar:  [ 2,  2,  2,  1,  2,  2,  2,  2,  3,  2,  2,  0,  0,  0, 0][i],
  })),
  potHistory: [
    { matchdayId: 1, potStand: 15.00 },
    { matchdayId: 2, potStand: 32.50 },
    { matchdayId: 3, potStand: 47.00 },
    { matchdayId: 4, potStand: 63.50 },
    { matchdayId: 5, potStand: 89.00 },
    { matchdayId: 6, potStand: 112.00 },
    { matchdayId: 7, potStand: 138.50 },
  ],
  scoreHistory: [1, 2, 3, 4, 5, 6, 7].map((md) => ({
    matchdayId: md,
    scores: Object.fromEntries(
      OG.map((p, i) => [
        p.initials,
        Math.round([87, 74, 67, 57, 52, 48, 42, 36, 34, 26, 24, 18, 16, 12, 8][i] * (md / 7) + (i % 3) * md)
      ])
    ),
  })),
}

const MOCK_LIVE: LiveMatchData[] = [
  {
    matchId: 1,
    status: 'IN_PLAY',
    score: { home: 2, away: 1 },
    minute: 67,
    goals: [
      { scorer: 'M. Depay', minute: 23, team: 'home', type: 'REGULAR' },
      { scorer: 'L. Martinez', minute: 45, team: 'away', type: 'PENALTY' },
      { scorer: 'C. Gakpo', minute: 67, team: 'home', type: 'REGULAR' },
    ],
    participantRows: OG.map((p, i) => {
      const totos: Array<'1' | 'X' | '2'> = ['1', '1', 'X', '2', '1', '1', 'X', '2', '1', '1', 'X', '2', '1', '1', '2']
      const uitslagen = ['2-1', '2-0', null, null, '1-0', '2-1', null, null, '3-1', '2-1', null, null, '1-0', null, null]
      const toto = totos[i]
      const uitslag = uitslagen[i]
      const totoCorrect = toto === '1'
      const uitslagCorrect = uitslag === '2-1'
      const tokens = TOKENS[i]
      return {
        initials: p.initials,
        name: p.name,
        toto,
        totoCorrect,
        potentialTotoPoints: totoCorrect ? Math.round(tokens * 2.1 * 100) / 100 : 0,
        uitslag,
        uitslagCorrect,
        potentialUitslagPoints: uitslagCorrect ? Math.round(tokens * 6.5 * 100) / 100 : 0,
        fantasyGoals: i === 0 ? 1 : 0,
        fantasyAssists: i === 2 ? 1 : 0,
        potentialFantasyPoints: i === 0 ? 3.2 : i === 2 ? 2.1 : 0,
        totalPotential: 0,
      }
    }).map((r) => ({ ...r, totalPotential: Math.round((r.potentialTotoPoints + r.potentialUitslagPoints + r.potentialFantasyPoints) * 100) / 100 }))
      .sort((a, b) => b.totalPotential - a.totalPotential),
  },
]

export default function MatchdayPreviewPage() {
  const [open, setOpen] = useState(true)
  const [group, setGroup] = useState<'og' | 'asc'>('og')
  const [showLive, setShowLive] = useState(false)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>MATCHDAY PREVIEW — DEMO DATA</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['og', 'asc'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: '1px solid #333',
              background: group === g ? '#FF6B00' : '#1a1a1a',
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {g.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => setShowLive((v) => !v)}
          style={{
            padding: '6px 16px',
            borderRadius: 4,
            border: `1px solid ${showLive ? '#ef4444' : '#333'}`,
            background: showLive ? 'rgba(239,68,68,0.15)' : '#1a1a1a',
            color: showLive ? '#ef4444' : '#888',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {showLive ? '● LIVE aan' : '○ LIVE uit'}
        </button>
      </div>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 24px',
          borderRadius: 4,
          background: '#FF6B00',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 14,
          cursor: 'pointer',
          border: 'none',
        }}
      >
        Open matchday preview
      </button>
      <MatchdayDrawer
        open={open}
        onClose={() => setOpen(false)}
        group={group}
        mockData={MOCK_DATA}
        mockLiveData={showLive ? MOCK_LIVE : undefined}
      />
    </div>
  )
}
