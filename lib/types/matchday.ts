import type { Match } from '@/lib/data/matches'
import type { MatchOdds } from '@/lib/data/odds'
import type { MatchdayConfig, MatchdayScoreRow } from '@/lib/matchday'

export interface MatchParticipantRow {
  initials: string
  name: string
  tokens: number | null
  toto: '1' | 'X' | '2' | null
  uitslag: string | null
  uitslagQuote: number | null
  fantasyHome: string | null
  fantasyAway: string | null
}

export interface MatchSlideData {
  matchId: number
  match: Match
  odds: MatchOdds | null
  participantRows: MatchParticipantRow[]
}

export interface PotPoint {
  matchdayId: number
  potStand: number
}

export interface ScoreHistoryPoint {
  matchdayId: number
  scores: Record<string, number>  // initials → total score
}

export interface LiveGoalEvent {
  scorer: string
  minute: number
  team: 'home' | 'away'
  type: 'REGULAR' | 'PENALTY' | 'OWN'
}

export interface LiveParticipantRow {
  initials: string
  name: string
  toto: '1' | 'X' | '2' | null
  totoCorrect: boolean
  potentialTotoPoints: number
  uitslag: string | null
  uitslagCorrect: boolean
  potentialUitslagPoints: number
  fantasyGoals: number
  fantasyAssists: number
  potentialFantasyPoints: number
  totalPotential: number
}

export interface LiveMatchData {
  matchId: number
  status: 'IN_PLAY' | 'PAUSED' | 'FINISHED'
  score: { home: number; away: number }
  minute: number | null
  goals: LiveGoalEvent[]
  participantRows: LiveParticipantRow[]
}

export interface FullMatchdayData {
  matchdayId: number
  config: MatchdayConfig
  totoVanDeDagInitials: string | null
  totoVanDeDagName: string | null
  matchSlides: MatchSlideData[][]  // 1 or 2 slides; each slide contains 2 (or fewer) matches
  scores: MatchdayScoreRow[]
  potHistory: PotPoint[]          // pot stand for all saved matchdays up to this one
  scoreHistory: ScoreHistoryPoint[] // total per deelnemer per matchday (for line chart)
}
