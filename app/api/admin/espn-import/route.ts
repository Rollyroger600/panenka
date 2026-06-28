import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ESPN_MATCH_IDS } from '@/lib/data/espnMatchIds'
import { ESPN_PLAYER_MAP } from '@/lib/data/espnPlayerMap'
import { WK_PLAYERS } from '@/lib/data/players'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'

export interface EspnImportPreview {
  uitslag: string
  toto: '1' | 'X' | '2'
  status: string
  // KO-wedstrijden: totale score na verlenging (verschilt van uitslag als er verlengd is)
  totalUitslag?: string
  // Team dat de strafschoppenserie won ('home' | 'away'), null als er geen penalties waren
  penaltyWinner?: 'home' | 'away' | null
  matched: Array<{
    espnName: string
    internalName: string
    internalId: number
    country: string
    goals: number
    assists: number
  }>
  unmatched: Array<{
    espnName: string
    goals: number
    assists: number
  }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGoalPhase(clockDisplay: string, isPenaltyKick: boolean): 'regular' | 'extratime' | 'shootout' {
  const s = clockDisplay.replace("'", '').trim()
  if (s.includes('+')) {
    const base = parseInt(s.split('+')[0])
    return base <= 90 ? 'regular' : 'extratime'
  }
  const minute = parseInt(s) || 0
  if (minute <= 90) return 'regular'
  if (minute > 120 && isPenaltyKick) return 'shootout'
  return 'extratime'
}

function isPenaltyStatus(status: string): boolean {
  return ['After Pen.', 'Final/Penalties'].includes(status)
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const store = await cookies()
  if (store.get('admin')?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matchId = parseInt(req.nextUrl.searchParams.get('matchId') ?? '')
  if (isNaN(matchId)) {
    return NextResponse.json({ error: 'Ongeldig match ID' }, { status: 400 })
  }

  const espnId = ESPN_MATCH_IDS[matchId]
  if (!espnId) {
    return NextResponse.json({ error: 'Geen ESPN ID voor deze wedstrijd' }, { status: 404 })
  }

  const isKo = matchId > 72

  let summary: Record<string, unknown>
  try {
    const res = await fetch(
      `${ESPN_BASE}/fifa.world/summary?event=${espnId}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return NextResponse.json({ error: `ESPN: HTTP ${res.status}` }, { status: 502 })
    summary = await res.json()
  } catch {
    return NextResponse.json({ error: 'ESPN niet bereikbaar' }, { status: 502 })
  }

  const comp = (summary.header as any)?.competitions?.[0]
  if (!comp) return NextResponse.json({ error: 'Geen wedstrijddata van ESPN' }, { status: 404 })

  const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away')
  const scoreHome = parseInt(homeComp?.score ?? '0') || 0
  const scoreAway = parseInt(awayComp?.score ?? '0') || 0
  const status: string = comp.status?.type?.description ?? 'Onbekend'

  // Doelpunten en assists extraheren uit rosters
  const rosters: any[] = (summary.rosters as any[]) ?? []
  const goalsByScorer: Record<string, number> = {}
  const assistsByScorer: Record<string, number> = {}
  const reguliereScore = { home: 0, away: 0 }

  for (const roster of rosters) {
    const team: string = roster.homeAway
    for (const player of roster.roster ?? []) {
      const name: string = player.athlete?.displayName ?? ''
      for (const play of player.plays ?? []) {
        const clockDisplay: string = play.clock?.displayValue ?? '0'
        const phase = isKo ? getGoalPhase(clockDisplay, play.penaltyKick ?? false) : 'regular'

        if (play.didAssist) {
          if (phase !== 'shootout') {
            assistsByScorer[name] = (assistsByScorer[name] ?? 0) + 1
          }
        }
        if (play.didScore) {
          // Reguliere score bijhouden (voor toto/uitslag)
          if (phase === 'regular') {
            const isOwn = play.ownGoal ?? false
            if (team === 'home') { isOwn ? reguliereScore.away++ : reguliereScore.home++ }
            else                { isOwn ? reguliereScore.home++ : reguliereScore.away++ }
          }
          // Fantasy: reguliere + verlenging, geen strafschoppenserie
          if (phase !== 'shootout') {
            goalsByScorer[name] = (goalsByScorer[name] ?? 0) + 1
          }
        }
      }
    }
  }

  // KO-wedstrijden: toto/uitslag op basis van reguliere stand
  const effectiveHome = isKo ? reguliereScore.home : scoreHome
  const effectiveAway = isKo ? reguliereScore.away : scoreAway
  const uitslag = `${effectiveHome}-${effectiveAway}`
  const toto: '1' | 'X' | '2' = effectiveHome > effectiveAway ? '1' : effectiveAway > effectiveHome ? '2' : 'X'

  // Totale score na verlenging (als die afwijkt van reguliere stand)
  const totalDiffers = isKo && (scoreHome !== effectiveHome || scoreAway !== effectiveAway)
  const totalUitslag = totalDiffers ? `${scoreHome}-${scoreAway}` : undefined

  // Strafschoppenserie: wie won?
  let penaltyWinner: 'home' | 'away' | null = null
  if (isKo && isPenaltyStatus(status)) {
    if (homeComp?.winner === true) penaltyWinner = 'home'
    else if (awayComp?.winner === true) penaltyWinner = 'away'
  }

  // ESPN displayName → interne spelersnaam
  const espnToPlayer = new Map<string, { id: number; name: string; country: string }>()
  for (const p of WK_PLAYERS) {
    const espnName = ESPN_PLAYER_MAP[p.id]
    if (espnName) espnToPlayer.set(espnName.toLowerCase().trim(), { id: p.id, name: p.name, country: p.country })
  }
  for (const p of WK_PLAYERS) {
    const mid  = p.middleName.toLowerCase().trim()
    const full = p.fullName.toLowerCase().trim()
    if (mid  && !espnToPlayer.has(mid))  espnToPlayer.set(mid,  { id: p.id, name: p.name, country: p.country })
    if (full && !espnToPlayer.has(full)) espnToPlayer.set(full, { id: p.id, name: p.name, country: p.country })
  }

  const allNames = new Set([...Object.keys(goalsByScorer), ...Object.keys(assistsByScorer)])
  const matched: EspnImportPreview['matched'] = []
  const unmatched: EspnImportPreview['unmatched'] = []

  for (const espnName of allNames) {
    const goals = goalsByScorer[espnName] ?? 0
    const assists = assistsByScorer[espnName] ?? 0
    if (goals === 0 && assists === 0) continue

    const found = espnToPlayer.get(espnName.toLowerCase().trim())
    if (found) {
      matched.push({ espnName, internalName: found.name, internalId: found.id, country: found.country, goals, assists })
    } else {
      unmatched.push({ espnName, goals, assists })
    }
  }

  matched.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
  unmatched.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))

  const result: EspnImportPreview = {
    uitslag, toto, status, matched, unmatched,
    ...(totalUitslag ? { totalUitslag } : {}),
    ...(penaltyWinner != null ? { penaltyWinner } : {}),
  }

  return NextResponse.json(result)
}
