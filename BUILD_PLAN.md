# Panenka — Build Plan

> This document is the **execution guide**. For feature specs, design system, and data structures see `PROJECT.md`. For the visual reference open `panenka_mockup.html` in a browser.

---

## How to Use This Document

Work through phases in order. Each phase ends with a clear deliverable you can verify in the browser. When prompting Claude to build, reference both files:

> *"Read `PROJECT.md` for the full spec and `BUILD_PLAN.md` for the folder structure and implementation approach. The visual reference is `panenka_mockup.html` — open it in a browser side by side."*

Mark phases done as you complete them. The plan becomes a progress tracker.

---

## GitHub & Collaboration Setup

Before writing any code, set up the repository:

```bash
# Create repo on github.com (private, no template)
# Then locally:
git init panenka
cd panenka
git remote add origin git@github.com:YOURUSER/panenka.git

# Branching strategy:
# main       — production (auto-deploys to Vercel)
# dev        — integration branch, merge PRs here before main
# feature/*  — individual feature branches
```

**Typical workflow:**
```bash
git checkout -b feature/poulefase-tab
# ... make changes ...
git add .
git commit -m "feat: poulefase match card with token + toto + uitslag"
git push origin feature/poulefase-tab
# Open PR on GitHub: feature/poulefase-tab → dev
# After review: merge dev → main to deploy
```

**Vercel connection:** Connect the GitHub repo to Vercel. Set `dev` as the "preview" branch and `main` as production. Every PR gets a unique preview URL.

**Environment variables** — never commit `.env.local`. Both collaborators set up their own:
```
.env.local:
  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
Also add all three to the Vercel dashboard for production deploys.

---

## Project Folder Structure

```
panenka/
├── app/
│   ├── layout.tsx                  # Root layout: fonts (@font-face), background image, body styles
│   ├── page.tsx                    # Landing screen: name buttons + magic link flow
│   ├── auth/
│   │   └── callback/route.ts       # Supabase magic link callback handler
│   ├── leaderboard/
│   │   └── page.tsx                # Public leaderboard — no auth required
│   └── (app)/                      # Route group: auth-protected
│       ├── layout.tsx              # App shell: deadline banner + header + tabs + bottom nav
│       ├── poulefase/
│       │   └── page.tsx
│       ├── oranje/
│       │   └── page.tsx
│       ├── knockout/
│       │   └── page.tsx
│       ├── fantasy/
│       │   └── page.tsx
│       └── overzicht/
│           └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx           # Logo (left) + participant name (right)
│   │   ├── TabBar.tsx              # Sticky top tab navigation (5 tabs)
│   │   ├── BottomNav.tsx           # Fixed bottom icon navigation (5 tabs)
│   │   └── DeadlineBanner.tsx      # Orange full-width deadline strip
│   ├── matches/
│   │   ├── MatchCard.tsx           # Full match card assembling all sub-components
│   │   ├── TotoButtons.tsx         # 1 / X / 2 buttons with odds below
│   │   ├── TokenChip.tsx           # Clickable orange token display chip
│   │   ├── TokenPicker.tsx         # Inline number bar (round-specific range)
│   │   ├── ResultQuote.tsx         # Gold calculated result chip (tokens × odds)
│   │   ├── UitslagChip.tsx         # Green score chip (shows "Kies" or "2-1")
│   │   ├── ScorePicker.tsx         # Collapsible odds panel: home / draw / away columns
│   │   └── StandingsPanel.tsx      # Collapsible 2-col group standings grid
│   ├── oranje/
│   │   └── OranjeMatchCard.tsx     # Simplified match card (no tokens — toto + uitslag only)
│   ├── knockout/
│   │   ├── RoundSection.tsx        # One round: badge + chip grid + team token rows
│   │   ├── CountryChip.tsx         # Flag + country name, selectable
│   │   ├── TeamTokenRow.tsx        # Per-team token input row (min/max per round)
│   │   └── SuggestionsPanel.tsx    # Green banner: projected qualifiers from standings
│   ├── fantasy/
│   │   ├── PlayerRow.tsx           # Filled slot: abbrev name + flag + quote
│   │   ├── EmptySlot.tsx           # "+ Speler toevoegen" or "+ Talent (U22)"
│   │   ├── PlayerInfoCard.tsx      # Expandable inline 3×3 info grid
│   │   ├── RulesPanel.tsx          # 5 rules with live OK / error / warn states
│   │   ├── PlayerModal.tsx         # Bottom-sheet: search + filters + player list
│   │   └── TeamNameEditor.tsx      # Editable Chalky-font team name
│   ├── leaderboard/
│   │   ├── Podium.tsx              # Top 3 podium
│   │   └── RankList.tsx            # Positions 4–15 with breakdown
│   └── ui/
│       ├── FlagImage.tsx           # Round flag img with letter fallback
│       ├── Badge.tsx               # Generic pill badge
│       └── TokenBanner.tsx         # Tokens remaining + progress bar (global pool)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient (for Client Components)
│   │   ├── server.ts               # createServerClient (for Server Components + actions)
│   │   └── middleware.ts           # Auth check + deadline enforcement
│   ├── data/
│   │   ├── matches.ts              # MATCHES array (72 rows — all group stage)
│   │   ├── players.ts              # WK_PLAYERS array (from sofifa tab in Excel)
│   │   ├── countries.ts            # ALL_COUNTRIES list (48) + FLAG_PATHS map
│   │   ├── knockoutRounds.ts       # KNOCKOUT_ROUNDS config (6 rounds, slots, token min/max)
│   │   ├── knockoutQuotes.ts       # KO_QUOTES per country per round (from Excel)
│   │   └── teamQuotes.ts           # TEAM_QUOTES: team_quote + verwacht_quote per country
│   ├── odds.ts                     # MATCH_ODDS: static object from Quoteringen tab
│   ├── standings.ts                # computeStandings() — pure function over predictions
│   ├── validation.ts               # validateFantasyXV() — the 5 squad rules
│   └── helpers.ts                  # abbrevName(), abbrevCountry(), computePlayerQuote()
│
├── hooks/
│   ├── usePredictions.ts           # Load from Supabase + auto-save with 500ms debounce
│   ├── useKnockoutPicks.ts         # Load + auto-save knockout selections + tokens
│   ├── useOranjeVoorspelling.ts    # Load + auto-save Oranje picks (no tokens)
│   ├── useFantasyXV.ts             # Load + auto-save fantasy squad
│   ├── useTokenBudget.ts           # Computes: base(335) + bonus − used = remaining
│   └── useDeadline.ts              # Returns { isPast, timeRemaining }
│
├── store/
│   └── gameStore.ts                # Zustand: predictions, knockoutPicks, fantasyXV, oranjeVoorspelling
│
├── public/
│   ├── Background/
│   │   └── 1a@4x.png               # Full-page background footballer image
│   ├── Logo/
│   │   └── Artboard 1@4x.png       # Panenka wordmark (white on transparent)
│   ├── fonts/                      # Self-hosted custom fonts (NOT Google Fonts)
│   │   ├── BuiltTitling-Regular.woff2
│   │   ├── BuiltTitling-Light.woff2
│   │   ├── SportyPro-Shadow.woff2
│   │   ├── SportyPro-Light.woff2
│   │   └── Chalky.woff2            # or Tomatoes.woff2
│   └── Landen/                     # 48 round flag PNGs — see FLAG_PATHS in PROJECT.md
│       ├── netherlands-flag-round-xl.png
│       ├── france-flag-round-xl.png
│       └── ... (48 total)
│
├── middleware.ts                   # Redirect unauthenticated users away from /app/*
├── tailwind.config.ts              # Panenka colors + Built Titling / Sporty Pro / Chalky / Inter
└── .env.local                      # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Phase 0 — Repository & Tooling Setup

**Goal:** Empty app deployed on Vercel with correct fonts, colors, and background image.

```bash
npx create-next-app@latest panenka \
  --typescript --tailwind --app --src-dir=false \
  --import-alias "@/*"
cd panenka
git init && git remote add origin git@github.com:YOURUSER/panenka.git
git push -u origin main
```

**1. Copy assets into `public/`**

```bash
# Run from inside the Next.js project root
cp -r "/path/to/Panenka/Background" public/
cp -r "/path/to/Panenka/Logo"       public/
cp -r "/path/to/Panenka/Landen"     public/
# Manually place font files:
mkdir -p public/fonts
# Copy BuiltTitling-Regular.woff2, SportyPro-Shadow.woff2, Chalky.woff2, etc.
```

**2. Self-hosted fonts in `app/globals.css`**

```css
@font-face {
  font-family: 'Built Titling';
  src: url('/fonts/BuiltTitling-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Built Titling';
  src: url('/fonts/BuiltTitling-Light.woff2') format('woff2');
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'Sporty Pro';
  src: url('/fonts/SportyPro-Shadow.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Sporty Pro';
  src: url('/fonts/SportyPro-Light.woff2') format('woff2');
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'Chalky';
  src: url('/fonts/Chalky.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

> **Important:** Do NOT use `next/font/google` — all fonts are self-hosted. Import them only via `@font-face` in `globals.css`.

**3. Tailwind font config in `tailwind.config.ts`**

```ts
fontFamily: {
  heading: ['"Built Titling"', 'sans-serif'],
  accent:  ['"Sporty Pro"', 'sans-serif'],
  script:  ['Chalky', 'cursive'],
  body:    ['Inter', 'system-ui', 'sans-serif'],
},
colors: {
  oranje:       '#FF6B00',
  'oranje-light':'#FF8C33',
  'oranje-dark': '#CC5500',
  bg:           '#0D0D0D',
  bg2:          '#161616',
  bg3:          '#1E1E1E',
  bg4:          '#252525',
  gold:         '#FFB800',
  green:        '#2ECC71',
  red:          '#E74C3C',
}
```

**4. Global body styles in `app/globals.css`**

```css
body {
  background-color: #0D0D0D;
  background-image: url('/Background/1a@4x.png');
  background-size: contain;
  background-attachment: fixed;
  background-position: center top;
  background-repeat: no-repeat;
}
```

**5. Supabase + Vercel**

- Create Supabase project at supabase.com (free tier)
- Copy URL + anon key into `.env.local`
- Connect GitHub repo to Vercel; set `main` = production, `dev` = preview
- Add env vars in Vercel dashboard

**Verify:** Visit the Vercel preview URL — you should see the background footballer image, the dark background color, and all custom fonts loading (check in DevTools → Network → Fonts).

---

## Phase 1 — Database, Seeding & Auth

**Goal:** All 15 participants can log in via magic link. Route protection works.

Steps:
1. Run the full SQL schema from PROJECT.md in the Supabase SQL editor
2. Enable Row Level Security on all tables; write policies:
   - `participants`: read for all authenticated users
   - `predictions`, `knockout_picks`, `oranje_picks`, `fantasy_players`, `fantasy_teams`: read/write own rows only
   - Leaderboard aggregate view: public read
3. **Seed `matches` table (72 rows):**
   - Extract all 72 matches from `Matchday_01` through `Matchday_27` tabs in the Excel master
   - Each match needs: id, poule (A–L), round (1/2/3), date, home, away, stadium
   - Use the `Toernooi` tab as a reference for the full match schedule structure
   - Write a one-time seed script or run the INSERT statements directly in Supabase SQL editor
4. Seed `participants` table (15 rows — name, initials, email for each person)
5. In Supabase Auth → invite all 15 participants by email (sends magic link)
6. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` using `@supabase/ssr`
7. Create `app/auth/callback/route.ts` to handle the magic link redirect
8. Build landing page (`app/page.tsx`):
   - Show the 15 name buttons
   - Clicking a name triggers a magic link email to their pre-seeded address
   - After submitting: show "Check je email!" confirmation state
9. Write `middleware.ts`: redirect unauthenticated requests from `/(app)/*` to `/`
10. Write `useDeadline.ts` hook

**Verify:** Click your name on landing → receive magic link email → click link → arrive at `/poulefase` (even if empty). Visiting `/poulefase` without auth redirects to `/`.

---

## Phase 2 — Static Data Files

**Goal:** All static data (matches, odds, quotes, players, countries) in TypeScript before building UI.

This phase is mainly data extraction from the Excel master. Do it once, then all UI phases can reference the static files.

1. **`lib/data/matches.ts`** — 72 match rows extracted from `Matchday_01`–`Matchday_27` tabs:
   ```typescript
   export const MATCHES: Match[] = [
     { id: 1, poule: 'A', round: 1, date: '11 jun', home: 'Mexico', away: 'Zuid-Afrika', stadium: 'Estadio Azteca Mexico City' },
     { id: 2, poule: 'A', round: 1, date: '11 jun', home: '...', away: '...', stadium: '...' },
     // ... all 72
   ]
   ```

2. **`lib/odds.ts`** — full odds table from `Quoteringen_toto_uitslag_test` tab:
   ```typescript
   export const MATCH_ODDS: Record<number, MatchOdds> = {
     1: { home: 7.30, draw: 9.43, away: 7.52,
          scores: { '1-0': 6.85, '2-0': 4.41, '2-1': 1.40, '3-0': 3.20, ... } },
     // ... all 72 matches
   }
   ```

3. **`lib/data/knockoutQuotes.ts`** — from `Quotes doorgaande landen` tab:
   ```typescript
   export const KO_QUOTES: Record<string, CountryQuotes> = {
     'Spanje':    { poulewinnaar: 1.17, tweede: 1.0, r16: 1.02, r8: 1.28, qf: 1.72, sf: 2.37, final: 3.25, winner: 5.5 },
     'Engeland':  { poulewinnaar: 1.25, tweede: 1.0, r16: 1.02, r8: 1.30, qf: 1.80, sf: 2.75, final: 4.00, winner: 7.0 },
     'Brazilië':  { poulewinnaar: 1.13, tweede: 1.0, r16: 1.02, r8: 1.40, qf: 2.00, sf: 3.25, final: 5.00, winner: 9.0 },
     'Nederland': { poulewinnaar: 1.69, tweede: 1.0, r16: 1.07, r8: 1.72, qf: 2.75, sf: 4.75, final: 9.00, winner: 21  },
     // ... all 49 countries
   }
   ```

4. **`lib/data/teamQuotes.ts`** — from `Quotes Fantasy XI` tab (for player quote calculation):
   ```typescript
   export const TEAM_QUOTES: Record<string, { teamQuote: number; verwacht: number }> = {
     'Frankrijk':       { teamQuote: 1.000, verwacht: 1.160 },
     'Spanje':          { teamQuote: 1.001, verwacht: 1.157 },
     'Nederland':       { teamQuote: 1.218, verwacht: 1.165 },
     // ... all 49 countries
   }
   ```

5. **`lib/data/countries.ts`** — `ALL_COUNTRIES` array (all 48 WK participants) + `FLAG_PATHS` map (from PROJECT.md)

6. **`lib/data/knockoutRounds.ts`** — 6-round config:
   ```typescript
   export const KNOCKOUT_ROUNDS = [
     { id: 'r16',    label: '1/16', slots: 32, minTokens: 2, maxTokens: 9 },
     { id: 'r8',     label: '1/8',  slots: 16, minTokens: 3, maxTokens: 9 },
     { id: 'qf',     label: '1/4',  slots:  8, minTokens: 4, maxTokens: 9 },
     { id: 'sf',     label: '1/2',  slots:  4, minTokens: 5, maxTokens: 9 },
     { id: 'final',  label: 'Finale', slots: 2, minTokens: 5, maxTokens: 9 },
     { id: 'winner', label: 'Winnaar', slots: 1, minTokens: 6, maxTokens: 9 },
   ]
   ```

7. **`lib/data/players.ts`** — full WK 2026 player pool from `sofifa_260421_output_RH_WK_land` tab:
   ```typescript
   export interface Player {
     player_id: number;
     name: string;
     country: string;       // Dutch name
     overall: number;       // sofifa overall rating
     positions: string[];   // ['GK'], ['CB', 'LB'], etc.
     dob: string;           // for age calculation
     club: string;
     league: string;
     confederation: string;
   }
   ```

8. **`lib/helpers.ts`** — utility functions:
   ```typescript
   export function computePlayerQuote(player: Player): number {
     const { overall, country } = player;
     const { teamQuote, verwacht } = TEAM_QUOTES[country] ?? { teamQuote: 3, verwacht: 1.5 };
     return (100 / overall) ** 2 * teamQuote * verwacht;
   }
   export function abbrevName(fullName: string): string { /* K. Mbappé */ }
   export function abbrevCountry(name: string): string { /* NED, ARG */ }
   ```

**Verify:** Import matches.ts in a test page and `console.log(MATCHES.length)` — should be 72. Same for odds (72 keys). Spot-check a few values against the Excel.

---

## Phase 3 — Poulefase Tab

**Goal:** Full match prediction UI working end-to-end with persistence.

> **Visual reference:** Open `panenka_mockup.html` in a browser for the exact match card layout. For design close-ups, open `Style/Artboard 2@4x.png` in an image viewer.

This is the most complex screen — build component by component:

1. **`store/gameStore.ts`** — Zustand store with `predictions` map: `matchId → {toto, uitslag, tokens}`
2. **`usePredictions` hook** — on mount: fetch all rows for current user from `predictions` table, populate store; on change: debounce 500ms → upsert to Supabase
3. **`useTokenBudget` hook** — computes `{ base: 335, bonus: 0, used, remaining }` from store state
4. **`TokenChip`** + **`TokenPicker`** — chip shows current token count (orange if set, muted "Kies" if not); clicking opens inline number bar; poulefase range: 1–6
5. **`TotoButtons`** — three buttons (1, X, 2) in a flex row; odds from `MATCH_ODDS[id]` displayed below each in gold; selected button turns orange
6. **`ResultQuote`** — gold chip: computes `tokens × odds` client-side, shows `—` if either is missing
7. **`UitslagChip`** + **`ScorePicker`** — chip shows score or "Kies"; clicking toggles the odds panel below; selecting a score closes panel, updates chip green, triggers calculation
8. **`MatchCard`** — assembles all above into the 5-column row: `Tokens × Toto = Quote · Uitslag = Quote`
9. **`TokenBanner`** — sums all `tokens` from store across all 72 matches; shows remaining / used / progress bar (against global 335-token pool)
10. **`lib/standings.ts`** — port `computeStandings()` and `parseScore()` from mockup
11. **`StandingsPanel`** — collapsible; appears once any uitslag is filled; 2-column grid of 12 group tables; top-2 per group have green left border
12. Render matches grouped by round (Ronde 1 / Ronde 2 / Ronde 3) with date sub-labels

**Token constraint:** The `TokenPicker` for poulefase shows chips 1–6 only. Enforce `tokens >= 1 && tokens <= 6` in the store update and the database CHECK constraint.

**Verify:** Fill in a match — token chip, toto button, uitslag score. Gold quote chips update live. Reload the page — picks are still there (fetched from Supabase). Token banner updates correctly.

---

## Phase 4 — Oranje Voorspelling Tab

**Goal:** Netherlands-specific bonus prediction screen. No tokens, just toto + score.

Steps:
1. Filter `MATCHES` for matches where `home === 'Nederland' || away === 'Nederland'` — these are the NL matches
2. **`OranjeMatchCard`** — simplified version of MatchCard: no token chip, just toto (1/X/2) + uitslag score picker; same odds display
3. **`store/gameStore.ts`** — add `oranjeVoorspelling` map: `matchId → {toto, uitslag}`
4. **`useOranjeVoorspelling` hook** — load + auto-save to `oranje_picks` table
5. **Bonus token calculation** — for display purposes, show estimated bonus tokens based on fills. Actual bonus tokens only credited post-match by the scoring engine.
6. Show an info banner explaining: "Vul hier de NL-wedstrijden in. Goede voorspellingen leveren extra tokens op voor de Knock-out fase."

**Verify:** Fill in a NL match toto and uitslag. Reload — picks persist. The Overzicht tab shows "Oranje Voorspelling: X / Y ingevuld".

---

## Phase 5 — Knockout Tab

**Goal:** Full knockout round UI with per-team token assignment persisted.

Steps:
1. **`store/gameStore.ts`** — add `knockoutPicks` map: `roundId → string[]` and `roundId_tok_Country → number`
2. **`useKnockoutPicks` hook** — load + auto-save (same debounce pattern as predictions)
3. **`CountryChip`** — flag image + country name; selected = orange; clicking toggles selection; when max slots reached, oldest is auto-removed
4. **`TeamTokenRow`** — renders for each selected country: flag + name + number input (min/max from KNOCKOUT_ROUNDS config); shows the knockout quote for that country at that round in gold
5. **`RoundSection`** — round badge + slot count info + `CountryChip` grid (all 48 countries) + "Tokens per team" subheader + `TeamTokenRow` list + running quote calculation
6. **`SuggestionsPanel`** — reads standings from `gameStore`; shows top-2 per group with flags as suggestion chips; hidden until standings exist
7. **Token validation** — each round enforces its own min/max per team; the total knockout tokens also count against the global 335-token pool
8. **3-tier quote display** — when hovering a country chip, show a tooltip: `Poulewinnaar: 1.XX · 2e: 1.00 · 3e-plek: X.XX`

**Verify:** Select 32 teams for 1/16 round — token rows appear below. Assign tokens per team (min 2, max 9). Reload — all selections and tokens persist. Token banner reflects knockout tokens used.

---

## Phase 6 — Fantasy XV Tab

**Goal:** Full 15-player squad builder with live validation, modal, and persistence.

Steps:
1. **`lib/validation.ts`** — port `validateFantasyXV()` from mockup; returns `{ violations, countryMap, confedMap, compMap, clubMap, talentCount }`
2. **`store/gameStore.ts`** — add `fantasyXV` map (`slotKey → player`), `teamName`, `activeInfoSlot`
3. **`useFantasyXV` hook** — load squad + team name from Supabase; auto-save on change
4. **`RulesPanel`** — 5 rule rows; reads violations from store; shows ✓ / ✗ / ! / — with detail text
5. **`PlayerRow`** — abbreviated name + flag + violation tag (if any) + computed quote (`computePlayerQuote(player)`); clicking toggles info card
6. **`EmptySlot`** — `+` icon + "Speler toevoegen" or "Talent (U22)"; clicking opens modal
7. **`PlayerInfoCard`** — inline 3×3 grid; shows overall rating, positions, dob (age), club, league, confederation, flag, quote; "✕ Verwijder" removes player
8. **`TeamNameEditor`** — Chalky-font editable name; click to edit → input appears → blur/Enter saves
9. **`PlayerModal`** — bottom sheet (80vh, slides up); search input + filter chips (position, confederation, competition); player count; scrollable player list with computed quotes; already-selected players greyed out; talent-only mode for t0–t3 slots (age < 22)
10. Wire up the regular list (p0–p10) and talent list (t0–t3) with section header "Talents" in Chalky font

**Player quote formula** (implement in `lib/helpers.ts`):
```typescript
export function computePlayerQuote(player: Player): number {
  const tq = TEAM_QUOTES[player.country] ?? { teamQuote: 3.0, verwacht: 1.5 };
  return (100 / player.overall) ** 2 * tq.teamQuote * tq.verwacht;
}
```

**Verify:** Add 15 players. Trigger a violation (two from same country) — rows turn red. Open the modal and use filters. Remove a player from the info card. Reload — squad persists.

---

## Phase 7 — Overzicht Tab + Leaderboard

**Goal:** Summary screen works. Leaderboard is publicly accessible.

Steps:
1. **Overzicht page** — reads from store:
   - Count filled poulefase matches (out of 72)
   - Sum poulefase tokens used
   - Count Oranje Voorspelling fills (out of NL match count)
   - Count knockout rounds with at least 1 pick
   - Count fantasy players (out of 15)
   - Show global token budget: `335 base + X bonus − Y used = Z remaining`
   - "Bevestigen" button sets `confirmed_at` on a `submissions` table and shows locked state
2. **`/leaderboard` page** — server component, no auth needed; fetches computed scores from Supabase; renders Podium + RankList
3. **`Podium`** — top 3 in 2/1/3 visual order; gold border + larger on #1
4. **`RankList`** — positions 4–15; current user row highlighted orange; shows breakdown: Poulefase / Knockout / Fantasy XV columns
5. **Supabase Realtime** — subscribe to leaderboard data; auto-refreshes during tournament without page reload

**Verify:** Open leaderboard at `/leaderboard` without being logged in — it works. Multiple participants' scores appear once scoring engine runs.

---

## Phase 8 — Scoring Engine *(post-deadline, during tournament)*

**Goal:** Real scores appear on the leaderboard as matches are played.

**Option A — Manual admin (recommended):**
- Hidden page at `/admin` protected by a separate Supabase role
- Form to enter actual result per match (`actual_toto`, `actual_uitslag`)
- Supabase Edge Function `compute-scores` reads all predictions + actual results + knockout picks + KO_QUOTES, writes totals to a `scores` table
- Trigger manually after each matchday

**Scoring formula:**
```
// Poulefase — for each match where actual result is known:
toto_points = (predicted_toto == actual_toto) ? tokens × toto_odds : 0
uitslag_points = (predicted_uitslag == actual_uitslag) ? tokens × score_odds : 0

// Knockout — for each selected team that actually advanced:
tier = 'poulewinnaar' | 'tweede' | 'derde'  // based on how they qualified
ko_points = tokens_for_team × KO_QUOTES[country][round][tier]

// Oranje bonus: credited when actual NL results are known
bonus_tokens = COUNT(correct_oranje_totos) × TOTO_BONUS + COUNT(correct_uitslags) × UITSLAG_BONUS
(bonus_tokens retroactively added to participant's knockout budget)
```

**Verify:** Enter a test result for match #1. Check leaderboard updates correctly for participants who predicted it right.

---

## Phase 9 — Polish & Launch

**Goal:** App is stable, tested on real devices, and ready for all 15 participants.

Checklist:
- [ ] Loading skeletons while Supabase data is fetching (prevent layout shift)
- [ ] Optimistic UI: show state changes immediately, revert silently on save failure
- [ ] Toast/snackbar: subtle confirmation when auto-save succeeds; clear error if it fails
- [ ] Read-only mode: after deadline, disable all inputs; show "Inzending gesloten" banner
- [ ] Test on iOS Safari (check `backdrop-filter`, sticky positioning, bottom nav safe area)
- [ ] Test on Android Chrome
- [ ] Verify all 15 magic links work end-to-end
- [ ] Verify two participants cannot see or overwrite each other's data (RLS test)
- [ ] Verify deadline enforcement: manually set system clock past deadline, confirm writes fail
- [ ] Verify font loading: check all 5 custom fonts render correctly (DevTools → Network → Fonts)
- [ ] Set up custom domain on Vercel (e.g. `panenka.nl`) if desired

---

## Deployment

```bash
# Every feature:
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# Open PR → review → merge to dev → test preview URL → merge dev to main → auto-deploys
```

Environment variables to set in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL          = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...   # server-only, for Edge Functions
```

Every pull request gets a unique preview URL for testing before merging.

---

## Phase Summary & Effort Estimate

| Phase | What | Effort |
|-------|------|--------|
| 0 | Project setup, fonts (self-hosted), Tailwind config, Vercel + GitHub | 2–3 hrs |
| 1 | Database schema (72 matches), seeding, magic link auth | 3–4 hrs |
| 2 | Static data files (matches, odds, quotes, players) — Excel extraction | 2–3 hrs |
| 3 | Poulefase tab — full match card UI + persistence | 5–7 hrs |
| 4 | Oranje Voorspelling tab — simplified NL predictions | 1–2 hrs |
| 5 | Knockout tab — country selection + per-team tokens + 3-tier quotes | 3–4 hrs |
| 6 | Fantasy XV tab — squad builder + real quote formula + modal | 4–5 hrs |
| 7 | Overzicht + leaderboard + Realtime | 2–3 hrs |
| 8 | Scoring engine *(post-deadline)* | 3–5 hrs |
| 9 | Polish, mobile testing, launch | 2–3 hrs |
| **Total** | | **~27–39 hrs** |

---

## Things to Collect Before Phase 1

1. **Email addresses of all 15 participants** — needed to seed `participants` table and send Supabase invites
2. **Font files** — `.woff2` files for Built Titling, Sporty Pro, and Chalky/Tomatoes (commercial — must obtain licenses)
3. **Full match schedule confirmation** — verify the 72-match extraction from Excel matches the official WK 2026 fixture list (fixtures finalized closer to tournament)
4. **Bonus token values** — exact number of bonus tokens awarded per correct Oranje Voorspelling toto/uitslag (check with pool creator)
