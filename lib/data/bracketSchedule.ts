export type Qualifier =
  | { kind: 'w1'; group: string }
  | { kind: 'w2'; group: string }
  | { kind: 'w3'; pool: string }

export interface R32Match {
  num: number
  r16: number
  home: Qualifier
  away: Qualifier
}

// Groep A=0, B=1, ..., L=11
export const GROUP_INDEX: Record<string, number> = {
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5,
  G: 6, H: 7, I: 8, J: 9, K: 10, L: 11,
}

export const R32_MATCHES: R32Match[] = [
  { num: 73, r16: 90, home: { kind: 'w2', group: 'A' }, away: { kind: 'w2', group: 'B' } },
  { num: 74, r16: 89, home: { kind: 'w1', group: 'E' }, away: { kind: 'w3', pool: 'A·B·C·D·F' } },
  { num: 75, r16: 90, home: { kind: 'w1', group: 'F' }, away: { kind: 'w2', group: 'C' } },
  { num: 76, r16: 91, home: { kind: 'w1', group: 'C' }, away: { kind: 'w2', group: 'F' } },
  { num: 77, r16: 89, home: { kind: 'w1', group: 'I' }, away: { kind: 'w3', pool: 'C·D·F·G·H' } },
  { num: 78, r16: 91, home: { kind: 'w2', group: 'E' }, away: { kind: 'w2', group: 'I' } },
  { num: 79, r16: 92, home: { kind: 'w1', group: 'A' }, away: { kind: 'w3', pool: 'C·E·F·H·I' } },
  { num: 80, r16: 92, home: { kind: 'w1', group: 'L' }, away: { kind: 'w3', pool: 'E·H·I·J·K' } },
  { num: 81, r16: 94, home: { kind: 'w1', group: 'D' }, away: { kind: 'w3', pool: 'B·E·F·I·J' } },
  { num: 82, r16: 94, home: { kind: 'w1', group: 'G' }, away: { kind: 'w3', pool: 'A·E·H·I·J' } },
  { num: 83, r16: 93, home: { kind: 'w2', group: 'K' }, away: { kind: 'w2', group: 'L' } },
  { num: 84, r16: 93, home: { kind: 'w1', group: 'H' }, away: { kind: 'w2', group: 'J' } },
  { num: 85, r16: 96, home: { kind: 'w1', group: 'B' }, away: { kind: 'w3', pool: 'E·F·G·I·J' } },
  { num: 86, r16: 95, home: { kind: 'w1', group: 'J' }, away: { kind: 'w2', group: 'H' } },
  { num: 87, r16: 96, home: { kind: 'w1', group: 'K' }, away: { kind: 'w3', pool: 'D·E·I·J·L' } },
  { num: 88, r16: 95, home: { kind: 'w2', group: 'D' }, away: { kind: 'w2', group: 'G' } },
]

// 4 bracket-helften, elk met 2 R16-wedstrijden; helften 1+2 → SF M101, helften 3+4 → SF M102
export const BRACKET_HALVES = [
  { kf: 97, sf: 101, r16: [89, 90] },
  { kf: 98, sf: 101, r16: [93, 94] },
  { kf: 99, sf: 102, r16: [91, 92] },
  { kf: 100, sf: 102, r16: [95, 96] },
]

export const R16_DATES: Record<number, string> = {
  89: '4 jul', 90: '4 jul',
  91: '5 jul', 92: '6 jul',
  93: '6 jul', 94: '7 jul',
  95: '7 jul', 96: '7 jul',
}
