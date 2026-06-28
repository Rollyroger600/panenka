import type { Match } from '@/lib/data/matches'
import type { MatchOdds } from '@/lib/data/odds'
import type { MatchdayConfig, MatchdayScoreRow, CustomBet } from '@/lib/matchday'

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
  assister?: string
}

export interface LiveBookingEvent {
  minute: number
  player: string
  team: 'home' | 'away'
  card: 'YELLOW' | 'RED' | 'YELLOW_RED'
}

export interface LiveSubstitutionEvent {
  minute: number
  playerOut: string
  playerIn: string
  team: 'home' | 'away'
}

export interface LivePenaltyEvent {
  player: string
  team: 'home' | 'away'
  scored: boolean
}

export interface LivePlayer {
  name: string
  position: string | null
  shirtNumber: number | null
}

export interface LiveMatchStats {
  possession: number | null
  shots: number | null
  shotsOnTarget: number | null
  corners: number | null
  fouls: number | null
  yellowCards: number | null
  redCards: number | null
}

export interface LiveParticipantRow {
  initials: string
  name: string
  tokens: number
  toto: '1' | 'X' | '2' | null
  totoCorrect: boolean
  totoOdds: number
  potentialTotoPoints: number
  uitslag: string | null
  uitslagCorrect: boolean
  uitslagPossible: boolean
  uitslagImpossible: boolean
  uitslagOdds: number
  potentialUitslagPoints: number
  fantasyGoals: number
  fantasyAssists: number
  potentialFantasyPoints: number
  fantasyHomePlayer: { name: string; goals: number; assists: number } | null
  fantasyAwayPlayer: { name: string; goals: number; assists: number } | null
  totalPotential: number
}

export interface LiveMatchData {
  matchId: number
  status: 'IN_PLAY' | 'PAUSED' | 'FINISHED'
  score: { home: number; away: number }
  minute: number | null
  goals: LiveGoalEvent[]
  participantRows: LiveParticipantRow[]
  venue?: string | null
  attendance?: number | null
  bookings?: LiveBookingEvent[]
  substitutions?: LiveSubstitutionEvent[]
  penalties?: LivePenaltyEvent[]
  homeLineup?: LivePlayer[]
  awayLineup?: LivePlayer[]
  homeBench?: LivePlayer[]
  awayBench?: LivePlayer[]
  homeFormation?: string | null
  awayFormation?: string | null
  homeStats?: LiveMatchStats | null
  awayStats?: LiveMatchStats | null
  // ESPN-provided team display info (overschrijft landvlag/afkorting bij club-wedstrijden)
  homeTeamAbbr?: string | null
  awayTeamAbbr?: string | null
  homeTeamLogo?: string | null
  awayTeamLogo?: string | null
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
  customBets?: CustomBet[]        // OG MD15+, ASC MD19+: custom bets instead of toto van de dag
}
