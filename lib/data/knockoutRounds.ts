export interface KnockoutRound {
  id: string
  label: string
  uiTab: string
  slots: number
  minTokens: number
  maxTokens: number
  qkey: string
}

export const KNOCKOUT_ROUNDS: KnockoutRound[] = [
  { id: 'w1',     label: 'Poulewinnaars',   uiTab: 'ronde32', slots: 12, minTokens: 2, maxTokens: 9, qkey: 'winnaar_poule' },
  { id: 'w2',     label: 'Nummers 2',       uiTab: 'ronde32', slots: 12, minTokens: 2, maxTokens: 9, qkey: 'tweede' },
  { id: 'w3',     label: 'Beste nummers 3', uiTab: 'ronde32', slots:  8, minTokens: 2, maxTokens: 9, qkey: 'derde' },
  { id: 'r16',    label: 'Ronde van 8',     uiTab: 'r16',     slots: 16, minTokens: 3, maxTokens: 9, qkey: 'r16' },
  { id: 'r8',     label: 'Kwartfinales',    uiTab: 'r8',      slots:  8, minTokens: 4, maxTokens: 9, qkey: 'r8' },
  { id: 'r4',     label: 'Halve finales',   uiTab: 'r4',      slots:  4, minTokens: 5, maxTokens: 9, qkey: 'r4' },
  { id: 'finale', label: 'Finalisten',      uiTab: 'finale',  slots:  2, minTokens: 6, maxTokens: 9, qkey: 'finale' },
  { id: 'winner', label: 'WK Winnaar',      uiTab: 'winner',  slots:  1, minTokens: 7, maxTokens: 9, qkey: 'winnaar' },
]

export const POULES = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const
