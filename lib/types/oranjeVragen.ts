export type AntwoordType =
  | 'ja_nee'
  | 'nl_opp'
  | 'speler_nl'
  | 'speler_opp'
  | 'percentage'
  | 'minuut'
  | 'open'
  | 'anders'

export interface OranjeVraag {
  tekst: string
  type: AntwoordType
  suggestie?: string                           // alleen bij type === 'anders'
  adminType?: Exclude<AntwoordType, 'anders'>  // admin converteert 'anders' naar geldig type
  gepubliceerd: boolean
}

// matchId → authorInitials → antwoordwaarde
export type OranjeAntwoordenMap = Record<number, Record<string, string | null>>

// matchId → authorInitials → OranjeVraag
export type OranjeVragenMap = Record<number, Record<string, OranjeVraag>>

// matchId → authorInitials → correct antwoord
export type OranjeCorrectMap = Record<number, Record<string, string | null>>

// matchId → questionAuthorKey → participantKey → isCorrect (voor 'open' type vragen)
export type OranjeBeoordeling = Record<number, Record<string, Record<string, boolean>>>

export const MINUUT_OPTIES = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90+'] as const
export type MinuutOptie = (typeof MINUUT_OPTIES)[number]

export const ANTWOORD_TYPE_LABELS: Record<AntwoordType, string> = {
  ja_nee:     'Ja / Nee',
  nl_opp:     'Nederland / Tegenstander',
  speler_nl:  'Speler Nederland',
  speler_opp: 'Speler tegenstander',
  percentage: 'Percentage (%)',
  minuut:     'Tijdvak (10 min.)',
  open:       'Open antwoord',
  anders:     'Alternatieve suggestie, te beoordelen door admin',
}

export function getAntwoordTypeLabel(type: AntwoordType, opponent: string): string {
  switch (type) {
    case 'nl_opp':     return `Nederland / ${opponent}`
    case 'speler_opp': return `Speler ${opponent}`
    default:           return ANTWOORD_TYPE_LABELS[type]
  }
}
