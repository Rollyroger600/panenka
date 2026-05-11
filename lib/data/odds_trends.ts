export type OddsTrend = 'up' | 'down' | 'same' | null

export interface MatchTrends {
  home: OddsTrend
  draw: OddsTrend
  away: OddsTrend
}

export const ODDS_UPDATED_AT = '2026-05-11T17:10:36.828Z'

export const ODDS_TRENDS: Record<number, MatchTrends> = {
  1: { home: "same", draw: "same", away: "same" },
  2: { home: "same", draw: "same", away: "same" },
  3: { home: "same", draw: "same", away: "same" },
  4: { home: "same", draw: "same", away: "same" },
  5: { home: "same", draw: "same", away: "same" },
  6: { home: "same", draw: "same", away: "same" },
  7: { home: "same", draw: "same", away: "same" },
  8: { home: "same", draw: "same", away: "same" },
  9: { home: "same", draw: "same", away: "same" },
  10: { home: "same", draw: "same", away: "same" },
  11: { home: "same", draw: "same", away: "same" },
  12: { home: "same", draw: "same", away: "same" },
  13: { home: "same", draw: "same", away: "same" },
  14: { home: "same", draw: "same", away: "same" },
  15: { home: "same", draw: "same", away: "same" },
  16: { home: "same", draw: "same", away: "same" },
  17: { home: "same", draw: "same", away: "same" },
  18: { home: "same", draw: "same", away: "same" },
  19: { home: "same", draw: "same", away: "same" },
  20: { home: "same", draw: "same", away: "same" },
  21: { home: "same", draw: "same", away: "same" },
  22: { home: "same", draw: "same", away: "same" },
  23: { home: "same", draw: "same", away: "same" },
  24: { home: "same", draw: "same", away: "same" },
  25: { home: "same", draw: "same", away: "same" },
  26: { home: "same", draw: "same", away: "same" },
  27: { home: "same", draw: "same", away: "same" },
  28: { home: "same", draw: "same", away: "same" },
  29: { home: "same", draw: "same", away: "same" },
  30: { home: "same", draw: "same", away: "same" },
  31: { home: "same", draw: "same", away: "same" },
  32: { home: "same", draw: "same", away: "same" },
  33: { home: "same", draw: "same", away: "same" },
  34: { home: "same", draw: "same", away: "same" },
  35: { home: "same", draw: "same", away: "same" },
  36: { home: "same", draw: "same", away: "same" },
  37: { home: "same", draw: "same", away: "same" },
  39: { home: "same", draw: "same", away: "same" },
  40: { home: "same", draw: "same", away: "same" },
  41: { home: "same", draw: "same", away: "same" },
  42: { home: "same", draw: "same", away: "same" },
  43: { home: "same", draw: "same", away: "same" },
  44: { home: "same", draw: "same", away: "same" },
  45: { home: "same", draw: "same", away: "same" },
  46: { home: "same", draw: "same", away: "same" },
  47: { home: "same", draw: "same", away: "same" },
  48: { home: "same", draw: "same", away: "same" },
  51: { home: "up", draw: "up", away: "down" },
  69: { home: "down", draw: "down", away: "down" },
}
