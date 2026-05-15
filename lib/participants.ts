export interface Participant {
  name: string
  initials: string
  extra: number
  token: string
}

export const PARTICIPANTS: Participant[] = [
  // ── OG ──────────────────────────────────────────────────────────────────
  { name: 'Michiel',  initials: 'MG',  extra: 9,  token: 'JylvPmTIji' },
  { name: 'Bob',      initials: 'BH',  extra: 5,  token: 'kHOIXn3uWo' },
  { name: 'Thom',     initials: 'TW',  extra: 4,  token: 'E3bWhhx3IS' },
  { name: 'Henk Jan', initials: 'HP',  extra: 2,  token: '3AKaYpYOer' },
  { name: 'Rogier',   initials: 'RH',  extra: 10, token: 'APM1qt41Cm' },
  { name: 'Daan',     initials: 'DM',  extra: 9,  token: 'CFHby83vWE' },
  { name: 'Barthold', initials: 'BM',  extra: 5,  token: 'RiXBASlUbu' },
  { name: 'Robert',   initials: 'RA',  extra: 3,  token: 'DEbcLvondx' },
  { name: 'Tom',      initials: 'TdL', extra: 1,  token: 'ovaNvswUu7' },
  { name: 'Willem',   initials: 'WP',  extra: 4,  token: '9lOW3oj68N' },
  { name: 'Bert',     initials: 'BS',  extra: 7,  token: 'QW7fgfHllK' },
  { name: 'Wouter',   initials: 'WS',  extra: 6,  token: 'zUoErZXeSU' },
  { name: 'Tim',      initials: 'TvL', extra: 5,  token: 'QefZ4skwoN' },
  { name: 'Timo',     initials: 'TG',  extra: 9,  token: 'LKb9WaQBcV' },
  { name: 'Laurens',  initials: 'LV',  extra: 3,  token: '0XBOeyJpLF' },
  // ── ASC-only (extra = 6 bonus tokens) ───────────────────────────────────
  { name: 'Jan',      initials: 'JS',  extra: 6,  token: 'mNpQ7xKaLv' },
  { name: 'Christian',initials: 'CV',  extra: 6,  token: 'hT3fYwBsOi' },
  { name: 'Bregt',    initials: 'BV',  extra: 6,  token: 'rGjC8dMuZe' },
  { name: 'Lex',      initials: 'AR',  extra: 6,  token: 'xL4nWoFpRk' },
  { name: 'Mark',     initials: 'MB',  extra: 6,  token: 'tA9sEqHvJc' },
  { name: 'Jelle',    initials: 'JH',  extra: 6,  token: 'bU2zNmKyPd' },
  { name: 'Jorn',     initials: 'JK',  extra: 6,  token: 'wI6rCxBfTg' },
  { name: 'Niels',    initials: 'NS',  extra: 6,  token: 'qO5aVlJeHn' },
  { name: 'Peter',    initials: 'PN',  extra: 6,  token: 'yR8kMuGdSp' },
  { name: 'Thomas',   initials: 'TWo', extra: 6,  token: 'iF3bXwNzQt' },
  { name: 'Coen',     initials: 'CB',  extra: 6,  token: 'cP7vLrAoKm' },
  { name: 'David',    initials: 'DK',  extra: 6,  token: 'uE4hQjZxBs' },
  { name: 'Wiger',    initials: 'WW',  extra: 6,  token: 'oJ1mTyVfIe' },
  { name: 'Vincent',  initials: 'VH',  extra: 6,  token: 'aK9cRwDgUn' },
]
