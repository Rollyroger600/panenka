# Panenka — WK 2026 Pool App

## What is this?

Panenka is a **private betting pool app** for 15 friends to compete during the FIFA World Cup 2026 (hosted by USA/Canada/Mexico, June–July 2026). Each participant fills in predictions before the tournament starts and earns points based on how accurate they are. There is no real money involved — this is purely for bragging rights.

A **working visual mockup** exists at `panenka_mockup.html` in this folder. Open it in a browser to see the exact design, layout, and interactions. The mockup is a single-file HTML/CSS/JS prototype with all screens implemented. **Use it as the definitive visual reference.** This document describes what the real app needs to do and how it should be structured.

---

## Participants (fixed list, no registration)

Initials in parentheses are the internal short codes used in the Excel master.

```
Michiel (MG), Bob (BH), Thom (TW), Henk Jan (HP), Rogier (RH),
Daan (DM), Barthold (BM), Robert (RA), Tom (TdL), Willem (WP),
Bert (BS), Wouter (WS), Tim (TvL), Timo (TG), Laurens (LV)
```

In the mockup, users simply tap their name. In the real app, the landing screen sends a **magic link** to the participant's email — clicking it logs them in automatically. All data is scoped to the authenticated participant.

---

## Design System

### Colors
```
--oranje:       #FF6B00   (primary accent, CTAs)
--oranje-light: #FF8C33
--oranje-dark:  #CC5500
--bg:           #0D0D0D   (page background)
--bg2:          #161616
--bg3:          #1E1E1E
--bg4:          #252525   (input backgrounds)
--text:         #F0F0F0
--text-muted:   #888888
--border:       #2A2A2A
--green:        #2ECC71   (success, qualifiers)
--red:          #E74C3C   (errors, violations)
--gold:         #FFB800   (odds/quotes)
```

### Typography

All fonts are **commercial, not available on Google Fonts**. They must be **self-hosted** — place `.woff2` / `.otf` files in `public/fonts/` and declare them with `@font-face` in `app/globals.css`. Do not use `next/font/google`.

| Font | Role | Style |
|------|------|-------|
| **Built Titling Regular** | All headings, match numbers, round badges, leaderboard ranks | Condensed all-caps, clean strokes |
| **Built Titling Light** | Lighter variant of the above for secondary headings | Condensed, thinner weight |
| **Sporty Pro Shadow** | Primary accent display font — token counts, big score chips | Bold with 3D shadow/outline effect |
| **Sporty Pro Light** | Lighter accent display — sub-labels, less prominent numbers | Lighter sporty variant |
| **Chalky** or **Tomatoes** | Fantasy team name, "Talents" section header, coach label | Handwritten / cursive texture |

> **Replacing the mockup fonts:** Built Titling replaces Bebas Neue. Chalky/Tomatoes replaces Dancing Script. Inter (system/web-safe) remains for body text. Sporty Pro is an addition — use it for the most prominent numeric elements (token count, final quote result).

Font file placement in Next.js:
```
public/
  fonts/
    BuiltTitling-Regular.woff2
    BuiltTitling-Light.woff2
    SportyPro-Shadow.woff2
    SportyPro-Light.woff2
    Chalky.woff2          (or Tomatoes.woff2)
```

CSS `@font-face` block in `app/globals.css`:
```css
@font-face {
  font-family: 'Built Titling';
  src: url('/fonts/BuiltTitling-Regular.woff2') format('woff2');
  font-weight: 400;
}
@font-face {
  font-family: 'Built Titling';
  src: url('/fonts/BuiltTitling-Light.woff2') format('woff2');
  font-weight: 300;
}
@font-face {
  font-family: 'Sporty Pro';
  src: url('/fonts/SportyPro-Shadow.woff2') format('woff2');
  font-weight: 700;
}
@font-face {
  font-family: 'Sporty Pro';
  src: url('/fonts/SportyPro-Light.woff2') format('woff2');
  font-weight: 300;
}
@font-face {
  font-family: 'Chalky';
  src: url('/fonts/Chalky.woff2') format('woff2');
  font-weight: 400;
}
```

Tailwind config mappings:
```js
fontFamily: {
  heading: ['Built Titling', 'sans-serif'],
  accent:  ['Sporty Pro', 'sans-serif'],
  script:  ['Chalky', 'cursive'],      // or Tomatoes
  body:    ['Inter', 'system-ui', 'sans-serif'],
}
```

### Background
Full-page background image: `Background/1a@4x.png` (a stylized footballer silhouette in warm orange/brown tones). Use `background-size: contain`, `background-attachment: fixed`, `background-position: center top`, `background-repeat: no-repeat`. The image should be visible behind all screens without cropping.

### Logo
`Logo/Artboard 1@4x.png` — the Panenka wordmark. Used in the landing screen (large, centered) and the app header (small, 32px height).

### Country Flags

Round flag images are in `Landen/`. In Next.js, copy this folder to `public/Landen/` and reference as `/Landen/filename.png`. Each image is a round-cropped PNG, used at:
- **26×26px** — match card team headers
- **18×18px** — country chips, player rows, knockout selections, standings

If no flag file exists for a country, fall back to a circle with the first 2 letters of the country name.

Complete Dutch country name → filename mapping (implement as `FLAG_PATHS` in `lib/data/countries.ts`):

```typescript
export const FLAG_PATHS: Record<string, string> = {
  'Mexico':                '/Landen/mexico-flag-round-xl.png',
  'Zuid-Afrika':           '/Landen/south-africa-flag-round-xl.png',
  'Zuid-Korea':            '/Landen/south-korea-flag-round-xl.png',
  'Tsjechië':              '/Landen/czech-republic-flag-round-xl.png',
  'Canada':                '/Landen/canada-flag-round-xl.png',
  'Bosnië':                '/Landen/bosnia-and-herzegovina-flag-round-xl.png',
  'Bosnië en Herzegovina': '/Landen/bosnia-and-herzegovina-flag-round-xl.png',
  'VS':                    '/Landen/united-states-of-america-flag-round-xl.png',
  'Verenigde Staten':      '/Landen/united-states-of-america-flag-round-xl.png',
  'Paraguay':              '/Landen/paraguay-flag-round-xl.png',
  'Qatar':                 '/Landen/qatar-flag-round-xl.png',
  'Zwitserland':           '/Landen/switzerland-flag-round-xl.png',
  'Brazilië':              '/Landen/brazil-flag-round-xl.png',
  'Marokko':               '/Landen/morocco-flag-round-xl.png',
  'Haïti':                 '/Landen/haiti-flag-round-xl.png',
  'Schotland':             '/Landen/scotland-flag-round-xl.png',
  'Australië':             '/Landen/australia-flag-round-xl.png',
  'Turkije':               '/Landen/turkey-flag-round-xl.png',
  'Duitsland':             '/Landen/germany-flag-round-xl.png',
  'Curaçao':               '/Landen/curacao-flag-round-xl.png',
  'Nederland':             '/Landen/netherlands-flag-round-xl.png',
  'Japan':                 '/Landen/japan-flag-round-xl.png',
  'Ivoorkust':             '/Landen/cote-d-ivoire-flag-round-xl.png',
  'Ecuador':               '/Landen/ecuador-flag-round-xl.png',
  'Zweden':                '/Landen/sweden-flag-round-xl.png',
  'Tunesië':               '/Landen/tunisia-flag-round-xl.png',
  'Spanje':                '/Landen/spain-flag-round-xl.png',
  'Kaapverdië':            '/Landen/cape-verde-flag-round-xl.png',
  'België':                '/Landen/belgium-flag-round-xl.png',
  'Egypte':                '/Landen/egypt-flag-round-xl.png',
  'Saoedi-Arabië':         '/Landen/saudi-arabia-flag-round-xl.png',
  'Uruguay':               '/Landen/uruguay-flag-round-xl.png',
  'Iran':                  '/Landen/iran-flag-round-xl.png',
  'Nieuw-Zeeland':         '/Landen/new-zealand-flag-round-xl.png',
  'Senegal':               '/Landen/senegal-flag-round-xl.png',
  'Irak':                  '/Landen/iraq-flag-round-xl.png',
  'Argentinië':            '/Landen/argentina-flag-round-xl.png',
  'Jordanië':              '/Landen/jordan-flag-round-xl.png',
  'Noorwegen':             '/Landen/norway-flag-round-xl.png',
  'Frankrijk':             '/Landen/france-flag-round-xl.png',
  'Algerije':              '/Landen/algeria-flag-round-xl.png',
  'Oostenrijk':            '/Landen/austria-flag-round-xl.png',
  'Colombia':              '/Landen/colombia-flag-round-xl.png',
  'DR Congo':              '/Landen/congo-democratic-republic-of-the-flag-round-xl.png',
  'Engeland':              '/Landen/england-flag-round-xl.png',
  'Panama':                '/Landen/panama-flag-round-xl.png',
  'Portugal':              '/Landen/portugal-flag-round-xl.png',
  'Oezbekistan':           '/Landen/uzbekistan-flag-round-xl.png',
  'Kroatië':               '/Landen/croatia-flag-round-xl.png',
  'Ghana':                 '/Landen/ghana-flag-round-xl.png',
};
```

### Style References

The `Style/` folder contains **visual reference images only** — open them in Preview or an image viewer, do not import them into the app. They show the intended UI design, color palette, card layouts, and typography in use.

| File | Contents |
|------|----------|
| `Style/Artboard 1@4x.png` | Landing screen + overall app aesthetic |
| `Style/Artboard 2@4x.png` | Match card design, toto buttons, token UI |
| `Style/Artboard 3@4x.png` | Fantasy XV list, player rows, talent section |
| `Style/Artboard 4@4x.png` | Knockout screen, country chips, leaderboard |
| `Style/1a@4x.png` | Background image variant (same footballer artwork) |
| `Style/Fonts.png` | Font specimens for the 6 custom fonts listed above |

---

## Architecture

### Tech Stack (decided)

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** — App Router, TypeScript |
| Styling | **Tailwind CSS** — extend with Panenka design tokens |
| Database | **Supabase** — Postgres + Row Level Security + Realtime |
| Auth | **Supabase Magic Link** — passwordless, one email per participant |
| Deployment | **Vercel** — zero-config for Next.js, auto-deploys on push |
| Client state | **Zustand** — predictions / fantasy picks before auto-save |
| Version control | **GitHub** — shared repo for collaborative development |

The app is mobile-first, max content width 700px centered.

### Authentication

Each of the 15 participants has a pre-created Supabase account (name + email). Before the tournament, everyone receives one magic-link email — they click it and are permanently logged in on that device. No passwords, no registration form.

- The leaderboard (`/leaderboard`) is publicly readable — no auth required
- All prediction write routes require an active session
- After the deadline, all writes are blocked server-side regardless of auth state

### Deadline

All predictions must be submitted before **9 juni 2026, 17:00** (one hour before the opening match). Enforced in `middleware.ts` — after this timestamp all inputs become read-only and API writes return 403.

### Database Schema

```sql
-- Seeded once: the 15 fixed participants
CREATE TABLE participants (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT UNIQUE NOT NULL,        -- 'Rogier', 'Michiel', etc.
  initials TEXT UNIQUE NOT NULL,        -- 'RH', 'MG', etc.
  email    TEXT UNIQUE NOT NULL,
  auth_id  UUID REFERENCES auth.users(id)
);

-- Seeded once: all 72 group-stage matches
CREATE TABLE matches (
  id           INT PRIMARY KEY,         -- 1 through 72
  poule        TEXT NOT NULL,           -- 'A' through 'L'
  round        INT NOT NULL,            -- 1, 2, or 3
  match_date   TEXT NOT NULL,           -- '11 jun'
  home         TEXT NOT NULL,           -- Dutch country name
  away         TEXT NOT NULL,
  stadium      TEXT,
  -- Filled post-match by admin for scoring:
  actual_toto    TEXT,                  -- '1', 'X', or '2'
  actual_uitslag TEXT                   -- '2-1'
);

-- One row per participant per match (upserted on every change)
CREATE TABLE predictions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  match_id       INT  NOT NULL REFERENCES matches(id),
  toto           TEXT CHECK (toto IN ('1','X','2')),
  uitslag        TEXT,                  -- e.g. '2-1'
  tokens         INT  CHECK (tokens BETWEEN 1 AND 6),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, match_id)
);

-- One row per participant per round per selected country
CREATE TABLE knockout_picks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  round_id       TEXT NOT NULL,         -- 'r16', 'r8', 'qf', 'sf', 'final', 'winner'
  country        TEXT NOT NULL,
  tokens         INT  CHECK (tokens >= 1),
  UNIQUE(participant_id, round_id, country)
);

-- Oranje Voorspelling: NL-specific extra predictions that earn bonus tokens
CREATE TABLE oranje_picks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  match_id       INT  NOT NULL REFERENCES matches(id),
  toto           TEXT CHECK (toto IN ('1','X','2')),
  uitslag        TEXT,
  UNIQUE(participant_id, match_id)
);

-- Fantasy team name (one per participant)
CREATE TABLE fantasy_teams (
  participant_id UUID PRIMARY KEY REFERENCES participants(id),
  team_name      TEXT NOT NULL DEFAULT 'FC Panenka'
);

-- Fantasy player selections (up to 15 slots per participant)
CREATE TABLE fantasy_players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  slot_key       TEXT NOT NULL,         -- 'p0'–'p10', 't0'–'t3'
  player_id      INT,                   -- sofifa player_id
  player_name    TEXT NOT NULL,
  UNIQUE(participant_id, slot_key)
);
```

Row Level Security: every participant can only read/write their own rows. Leaderboard aggregates are publicly readable.

### Key Technical Decisions

1. **Auto-save, not manual save.** Every prediction change is debounced 500ms and upserted to Supabase. The "Bevestigen" button in Overzicht only sets a `confirmed_at` timestamp — data is never at risk of being lost by forgetting to press save.

2. **Match odds stay client-side.** The seeded RNG (`sr()` + `generateMatchOdds()`) runs entirely in the browser. All 72 × 26 score odds are computed in milliseconds — no API call, no database column. The actual odds values come from `Quoteringen_toto_uitslag_test` in the Excel master (48+ score options per match, pre-computed).

3. **Knockout quotes are static data.** The per-country, per-round quotes (from `Quotes doorgaande landen` tab in the Excel) are seeded as a static TypeScript object — no database table needed. They never change after the tournament starts.

4. **Standings are derived, not stored.** `computeStandings()` is a pure function over the local predictions state. No standings table needed — recalculated whenever an uitslag changes.

5. **Player list lives in code, not the database.** The full WK 2026 player pool (from sofifa dataset) is a static TypeScript array in `lib/data/players.ts`. Only slot assignments (`slot_key → player_id`) are stored in Supabase.

6. **Scoring formula is multiplicative, not additive.**
   - `toto_score = tokens × toto_quote` (if toto correct)
   - `uitslag_score = tokens × uitslag_quote` (if exact score correct — much higher multiplier)
   - `knockout_score = tokens_per_team × round_quote` (if team correctly picked)
   - Fantasy XV: based on player performance during tournament (separate scoring)

---

## Token System

### Total Budget
Each participant starts with **335 base tokens**. Additional tokens can be earned through the **Oranje Voorspelling** section (for correctly predicting Netherlands matches). The Overzicht tab shows the total available tokens and how many have been allocated.

### Per-Section Token Constraints

| Section | Min per bet | Max per bet |
|---------|------------|------------|
| Poulefase (72 matches) | 1 | 6 |
| Knock-out: 1/16 | 2 | 9 |
| Knock-out: 1/8 | 3 | 9 |
| Knock-out: Kwartfinale | 4 | 9 |
| Knock-out: Halve Finale | 5 | 9 |
| Knock-out: Finale | 5 | 9 |
| Knock-out: Winnaar | 6 | 9 |

All sections share the same 335-token pool. The participant decides how to distribute tokens within the constraints above.

---

## Screens & Navigation

### 1. Landing Screen

**Visual:** Fullscreen with background image visible, dark gradient overlay, centered content.

**Layout (top to bottom):**
- Orange badge: `🏆 WK 2026 · VS / Canada / Mexico`
- Logo image (large, ~260px wide)
- Subtitle: `Poule — WK 2026` (muted, uppercase, letter-spaced)
- Orange divider line
- Description text about the deadline
- "Wie ben jij?" label
- **Name grid** (3 columns) — all 15 participant names as clickable buttons. Tapping one selects it (button turns orange). Only one can be selected at a time.
- Primary CTA button: `Invullen →` — disabled until a name is selected
- Secondary link: `📊 Bekijk tussenstand` — opens the leaderboard screen

**Behavior:** Clicking "Invullen →" triggers a magic link email to the participant's address. Shows "Check je email!" confirmation state.

---

### 2. App Screen

The main app shell contains:
- **Deadline banner** at top: `⏰ Deadline: 9 juni 2026 · 17:00` (full-width orange strip)
- **Sticky header**: Logo (left) + selected participant name with icon (right)
- **Tab bar** (sticky, below header): 5 tabs — `Poulefase`, `Oranje`, `Knock-out`, `Fantasy XV`, `Overzicht`
- **Tab content area** — switches between the 5 sections
- **Bottom navigation bar** (fixed): same 5 tabs with icons

---

### 3. Tab: Poulefase

**Purpose:** Predict the result of all 72 group-stage matches and allocate tokens.

**Header section:**
- Title: `Poulewedstrijden`
- Description with token constraints (1–6 tokens per match)
- **Token banner**: shows "Tokens over" (remaining) + progress bar + "Gebruikt" (used) — counts against the global 335-token pool

**Standings panel** (hidden until at least one uitslag is filled):
- Toggle button: `📊 Poulestanden (X/12 poules)`
- When expanded: 2-column grid showing all 12 groups (A–L)
- Each group table shows 4 teams ranked by Pts → GD → GF
- Top 2 teams in each group have a green left border (likely qualifiers)
- Stats shown per team: position, flag, abbreviated name, GD (±), Pts

**Match cards** (72 total, grouped by round and date):

Round headers: `Ronde 1` (matches #1–24), `Ronde 2` (matches #25–48), `Ronde 3` (matches #49–72).

Each match card has:
```
#[id]   [Flag] ABB — ABB [Flag]   Poule X · DD mmm
```

Then a horizontal input row with 5 columns:

| Column | Label | Content |
|--------|-------|---------|
| 1 | Tokens | Orange chip showing selected amount, or "Kies" if empty. Click opens token picker bar |
| × | sep | |
| 2 | Toto | Three buttons: `1` / `X` / `2`, each with the seeded odds shown below in gold |
| = | sep | |
| 3 | Quote | Calculated result: `tokens × toto_odds`. Gold chip. Shows `—` if incomplete |
| · | sep | |
| 4 | Uitslag | Green chip showing selected score (e.g. `2-1`) or "Kies". Click opens score picker panel |
| = | sep | |
| 5 | Quote | Calculated result: `tokens × uitslag_odds`. Gold chip. Shows `—` if incomplete |

**Token picker:** A row of number chips (1, 2, 3, 4, 5, 6) — poulefase max is 6. The selected number is highlighted orange. Minimum 1 token.

**Score picker (uitslag):** A panel that slides open below the card showing correct-score odds in 3 columns (home wins / draws / away wins). Clicking a score fills it in, highlights it, and closes the panel.

**Toto odds** and **score odds** come from the `Quoteringen_toto_uitslag_test` Excel tab. The mockup uses a seeded RNG to approximate these; in the real app the actual values from that tab should be loaded as static data in `lib/data/odds.ts`.

---

### 4. Tab: Oranje Voorspelling

**Purpose:** Extra predictions specifically for Netherlands matches. Correct answers earn **bonus tokens** that are added to the participant's total pool for use in the Knock-out phase.

**Structure:**
- Shows only the Netherlands matches (from Poules containing Nederland)
- Each NL match: predict toto (1/X/2) and optionally exact score
- No token allocation here — these are bonus predictions
- Correct toto prediction → +X bonus tokens added to knockout budget
- Correct uitslag prediction → +Y bonus tokens (higher bonus)
- Bonus tokens are shown in Overzicht tab as "+ X extra tokens"

**Visual:** Same match card layout as Poulefase but without the token column. Lighter treatment.

---

### 5. Tab: Knock-out

**Purpose:** Predict which teams advance through each knockout round and allocate tokens per team.

**Background:** WK 2026 has 48 teams in 12 groups of 4. Each group plays 3 rounds. The top 2 from each group (24 teams) plus the 8 best 3rd-place teams (8 teams) = **32 teams** advance to the 1/16 round. The knockout then proceeds: 32 → 16 → 8 → 4 → 2 → 1.

**3-Tier Quote System:** When a team advances, the quote applied depends on how they finished in their group:
- Finished **1st (Poulewinnaar)**: gets the Poulewinnaar quote (higher reward for predicting a stronger run)
- Finished **2nd**: gets the 2e in poule quote (= 1.0 baseline — no multiplier for predicting 2nd)
- Finished **3rd (best 3rd-place)**: gets a reduced/3rd-place quote

If a participant predicted a team to advance as group winner but they actually advanced as runner-up, they still score but at the lower runner-up rate. The per-country, per-round quotes are in `lib/data/knockoutQuotes.ts` (sourced from `Quotes doorgaande landen` tab).

**Info box:** Explains the mechanic and tier system.

**Suggestions banner** (appears when poulefase uitslags are filled): Shows the projected qualifiers based on the current standings.

**6 knockout rounds**, each rendered as a section:

| Round | Badge | Slots | Token min | Token max |
|-------|-------|-------|-----------|-----------|
| Kwalificatie 1/16 | `1/16` | 32 | 2 | 9 |
| 1/8 Finale | `1/8` | 16 | 3 | 9 |
| Kwartfinale | `1/4` | 8 | 4 | 9 |
| Halve Finale | `1/2` | 4 | 5 | 9 |
| Finale | `Finale` | 2 | 5 | 9 |
| Winnaar | `🏆` | 1 | 6 | 9 |

**Team selection:** For each round, a grid of country chips (all 48 WK 2026 countries). Each chip shows a round flag + country name. Tapping selects it (turns orange). Max `slots` teams can be selected; selecting more automatically deselects the oldest.

**Per-team token assignment:** Below the chips, each selected team gets its own row:
```
[Flag] Country Name    [___] tokens
```
Input is a number field with round-specific min/max. Stored separately per team per round.

**Knockout quotes** (from `Quotes doorgaande landen` tab — full table stored in `lib/data/knockoutQuotes.ts`):

Sample values (Poulewinnaar quote | 2e in poule | 1/16 | 1/8 | 1/4 | 1/2 | Finale | Winnaar):
```
Spanje:       1.17 | 1 | 1.02 | 1.28 | 1.72 | 2.37 | 3.25 | 5.5
Engeland:     1.25 | 1 | 1.02 | 1.30 | 1.80 | 2.75 | 4.00 | 7.0
Brazilië:     1.13 | 1 | 1.02 | 1.40 | 2.00 | 3.25 | 5.00 | 9.0
Nederland:    1.69 | 1 | 1.07 | 1.72 | 2.75 | 4.75 | 9.00 | 21
Mexico:       2.10 | 1 | 1.11 | 2.25 | 5.50 | 12.0 | 26.0 | 81
... (full 49-country table in lib/data/knockoutQuotes.ts)
```

---

### 6. Tab: Fantasy XV

**Purpose:** Build a 15-player fantasy squad from WK 2026 players.

**Header:** `FANTASY XV` (Built Titling, large) + subtitle

**Team name:** Editable in Chalky/Tomatoes font. Click to edit, press Enter or blur to save. Defaults to `FC [ParticipantName]`.

**Rules panel** (always visible, updates in real time):
- Max 1 speler per land
- Max 3 spelers per confederatie
- Max 3 spelers per competitie
- Max 1 speler per club
- Min 4 spelers jonger dan 22 (talents)

Each rule row shows: status icon (✓ / ✗ / ! / —), rule text, detail (e.g. "UEFA: 4" or "2 conflicten").

**Player list — 11 regular slots** (`p0` through `p10`):

Each filled slot shows a row:
```
[Abbreviated Name]    [Flag]  [violation tag if any]  [Quote]
```
- Name abbreviated: "Kylian Mbappé" → "K. Mbappé"
- Flag: 18×18px round flag image
- Quote: computed from real formula (see below)
- Clicking a filled row toggles an **inline info card** below it

**Inline info card** (when a player row is expanded):
- "SPELER INFO" header with "✕ Verwijder" button
- 3×3 grid: last name | Leeftijd | Rating (sofifa overall) | Flag+Country | Confederation | Quote | Club | Competition | Positions

**Empty slot:**
```
[+]  SPELER TOEVOEGEN
```
Clicking opens the player selection modal.

**Talents section** (after the 11 regular slots):
- Section header: "Talents" in Chalky font with horizontal line
- 4 slots (`t0` through `t3`) — same layout as regular slots
- Empty slots show: `[+]  TALENT (U22)`
- When modal opens for a talent slot, only players under 22 are shown

**Coach label** at bottom in Chalky/Tomatoes font.

**Player selection modal** (bottom sheet, 80vh):
- Title: "Kies een speler" or "Kies een talent (jonger dan 22)"
- Search input: searches name, country, club, competition
- Filter chips by: Positie (GK/DEF/MID/ATT), Confederatie (UEFA/CONMEBOL/CONCACAF/AFC/CAF), Competitie
- Player count: "X spelers gevonden"
- Player list: each card shows flag | name + meta | badges (U22 if applicable, position, gold quote)
- Already-selected players shown as greyed out with "Al gekozen" label
- Talent-only filter active for talent slots (age < 22 as of June 2026)

**Player data:** Sourced from the `sofifa_260421_output_RH_WK_land` tab in the Excel master. Key fields: `player_id`, `name`, `nationality` (Dutch name), `overall` (sofifa rating), `positions`, `dob` (for age calculation), `league_name`, `club_name`, `confederation`.

**Real player quote formula:**
```
quote = (100 / overall)² × team_quote × verwachtingsquote_team
```

Where:
- `overall` = sofifa overall rating (e.g. 91 for top players)
- `team_quote` = FIFA ranking-based team strength ratio (from `Quotes Fantasy XI` tab, col C) — France = 1.0 (best), lower-ranked teams have higher quotes
- `verwachtingsquote_team` = advancement expectation multiplier (col D), based on how far team is expected to advance

Example (France player with overall 91):
```
quote = (100/91)² × 1.0 × 1.16 = 1.20 × 1.16 ≈ 1.40
```

The full team_quote and verwachtingsquote values are stored in `lib/data/teamQuotes.ts`.

**Team validation (`validateFantasyXV`):**
- Rule 1: Max 1 player per `country`
- Rule 2: Max 3 players per `confederation`
- Rule 3: Max 3 players per `competition`
- Rule 4: Max 1 player per `club`
- Rule 5: Min 4 players with `age < 22` (in the talent slots t0–t3)

---

### 7. Tab: Overzicht (Submit)

**Purpose:** Summary before confirming submission. Shows total token status including bonus tokens.

**Token summary card:**
- Base tokens: 335
- Extra tokens earned (Oranje Voorspelling): +X
- Total available: 335 + X
- Tokens used in Poulefase: Y (of which max 6/match across 72 matches)
- Tokens used in Knock-out: Z
- Tokens remaining: (335 + X) − Y − Z

**Completion summary card** showing:
- Deelnemer: [name]
- Wedstrijden ingevuld: X / 72
- Tokens gebruikt: Y / (335 + X)
- Oranje Voorspelling: X / [NL match count] ingevuld
- Knock-out rondes: X / 6 ingevuld
- Fantasy XV: X / 15 spelers

**Primary button:** `✓ Bevestigen & Insturen` — on click, locks submission and shows confirmation.

**Secondary button:** `← Nog aanpassen` — goes back to Poulefase tab.

---

### 8. Leaderboard Screen

**Purpose:** Show the current standings of all 15 participants.

**Layout:**
- Header with "TUSSENSTAND" label and "Overzicht 2026" title
- Category tags: Poulefase / Knock-out / Fantasy XV
- **Podium** (top 3): positions 2/1/3 displayed left/center/right, center slightly taller, gold border on #1
- **Rank list** (positions 4–15): each row shows rank, avatar initials, name, breakdown by category, total score
- Current participant highlighted with orange border ("me")
- Back button to landing

---

## Match Data (72 Poulefase Matches)

WK 2026 has 48 teams in **12 groups (A–L)** of 4 teams each. Every team plays 3 group-stage matches (each team plays the other 3 teams in its group once). Total: 12 groups × (3+2+1) = 12 × 6 = 72 matches.

Grouped by round:

**Ronde 1 (matches #1–24):**
- Poule A: #1 Mexico vs Zuid-Afrika (Estadio Azteca), #2 [next A match]
- Poule B: #3 Canada vs Bosnië en Herzegovina (Toronto Stadium), #4 ...
- Poule C: #5, #6 · Poule D: #7, #8 · Poule E: #9, #10
- Poule F: #11, #12 · Poule G: #13 (Seattle), #14 · Poule H: #15, #16
- Poule I: #17, #18 · Poule J: #19, #20 · Poule K: #21, #22 · Poule L: #23, #24

**Ronde 2 (matches #25–48):** Same groups, remaining pairs (2nd match of each group's schedule).

**Ronde 3 (matches #49–72):** Final round (within each group, 2 simultaneous matches per group).

Full match schedule is in the `Matchday_01` through `Matchday_27` tabs of `260428_WK 2026_Master.xlsx`. Extract all 72 match rows from these tabs and seed them into `lib/data/matches.ts` and the `matches` database table.

> **Note:** The mockup currently only contains 24 matches (first 2 per group). The real app needs all 72. The full fixtures must be extracted from the Excel master.

---

## Odds Generation

**Toto odds (1/X/2)** and **score odds (uitslag)** for all 72 group-stage matches come from the `Quoteringen_toto_uitslag_test` tab in the Excel master. This tab has:
- Row 1: match numbers (#1 through #72+ in columns)
- Row 2: Thuis (home win) odds
- Row 3: Gelijk (draw) odds
- Row 4: Uit (away win) odds
- Rows 6+: score odds (e.g. '1-0': 6.85, '2-0': 4.41, etc.)

These values are **fixed, pre-computed** — not seeded RNG. Store them as a static object in `lib/data/odds.ts`:

```typescript
export const MATCH_ODDS: Record<number, {
  home: number; draw: number; away: number;
  scores: Record<string, number>;
}> = {
  1: { home: 7.30, draw: 9.43, away: 7.52,
       scores: { '1-0': 6.85, '2-0': 4.41, '2-1': 1.40, ... } },
  2: { home: 3.23, draw: 6.90, away: 9.64,
       scores: { '1-0': 1.62, '2-0': 5.78, ... } },
  // ... all 72 matches
}
```

The seeded RNG (`sr()` + `generateMatchOdds()`) from the mockup was an approximation for prototyping. The real app uses the actual Excel values.

---

## Scoring Logic

All scoring happens **post-deadline** once actual match results are known.

### Poulefase
```
toto_correct:   score += tokens × toto_quote        (if predicted_toto == actual_toto)
uitslag_correct: score += tokens × uitslag_quote    (if predicted_uitslag == actual_uitslag)
```
Both can score on the same match (toto bonus is separate from uitslag bonus).

### Knock-out
For each selected team per round:
```
score += tokens_for_team × round_quote_for_team
```
The `round_quote_for_team` depends on which tier the team qualified through:
- Group winner: use `Poulewinnaar` column quote
- Runner-up: use `2e in poule` quote (= 1.0 for all teams)
- Best 3rd-place: use the 3rd-place-tier quote (lower than group winner)

### Fantasy XV
Separate scoring system based on tournament performance of selected players (goals, assists, clean sheets, etc.). Implementation TBD — tracked separately.

---

## Key State Variables

```javascript
let selectedPlayer = null;            // active participant name
let predictions = {};                 // matchId → {toto, uitslag, tokens}
let knockoutPicks = {};               // roundId → [countries], roundId_tok_Country → tokens
let oranjeVoorspelling = {};          // matchId → {toto, uitslag} (no tokens)
let fantasyXV = {};                   // slotKey → player object
let activeInfoSlot = null;            // which fantasy XV slot has info card open
let teamName = 'FC Panenka';          // editable fantasy team name
let baseTokens = 335;                 // fixed base budget
let bonusTokens = 0;                  // earned from Oranje Voorspelling
let currentModalSlot = null;          // {key, type} for player modal
let modalFilters = {};                // pos, competition, confederation
```

Slot keys: `p0`–`p10` (regular, 11 slots), `t0`–`t3` (talents, 4 slots).

---

## Asset Files

All image assets live in the project root and must be copied into `public/` in the Next.js project. Once there, reference them with a leading `/` (e.g. `/Background/1a@4x.png`).

```
Source location                    → Next.js public/ path
─────────────────────────────────────────────────────────────────
panenka_mockup.html                ← working prototype, open in browser — NOT copied to public/
Background/1a@4x.png               → public/Background/1a@4x.png
Logo/Artboard 1@4x.png             → public/Logo/Artboard 1@4x.png
Landen/algeria-flag-round-xl.png   → public/Landen/algeria-flag-round-xl.png
Landen/argentina-flag-round-xl.png → public/Landen/argentina-flag-round-xl.png
Landen/australia-flag-round-xl.png → public/Landen/australia-flag-round-xl.png
Landen/austria-flag-round-xl.png   → public/Landen/austria-flag-round-xl.png
Landen/belgium-flag-round-xl.png   → public/Landen/belgium-flag-round-xl.png
Landen/bosnia-and-herzegovina-flag-round-xl.png
Landen/brazil-flag-round-xl.png
Landen/canada-flag-round-xl.png
Landen/cape-verde-flag-round-xl.png
Landen/colombia-flag-round-xl.png
Landen/congo-democratic-republic-of-the-flag-round-xl.png
Landen/cote-d-ivoire-flag-round-xl.png
Landen/croatia-flag-round-xl.png
Landen/curacao-flag-round-xl.png
Landen/czech-republic-flag-round-xl.png
Landen/ecuador-flag-round-xl.png
Landen/egypt-flag-round-xl.png
Landen/england-flag-round-xl.png
Landen/france-flag-round-xl.png
Landen/germany-flag-round-xl.png
Landen/ghana-flag-round-xl.png
Landen/haiti-flag-round-xl.png
Landen/iran-flag-round-xl.png
Landen/iraq-flag-round-xl.png
Landen/japan-flag-round-xl.png
Landen/jordan-flag-round-xl.png
Landen/mexico-flag-round-xl.png
Landen/morocco-flag-round-xl.png
Landen/netherlands-flag-round-xl.png
Landen/new-zealand-flag-round-xl.png
Landen/norway-flag-round-xl.png
Landen/panama-flag-round-xl.png
Landen/paraguay-flag-round-xl.png
Landen/portugal-flag-round-xl.png
Landen/qatar-flag-round-xl.png
Landen/saudi-arabia-flag-round-xl.png
Landen/scotland-flag-round-xl.png
Landen/senegal-flag-round-xl.png
Landen/south-africa-flag-round-xl.png
Landen/south-korea-flag-round-xl.png
Landen/spain-flag-round-xl.png
Landen/sweden-flag-round-xl.png
Landen/switzerland-flag-round-xl.png
Landen/tunisia-flag-round-xl.png
Landen/turkey-flag-round-xl.png
Landen/united-states-of-america-flag-round-xl.png
Landen/uruguay-flag-round-xl.png
Landen/uzbekistan-flag-round-xl.png
─────────────────────────────────────────────────────────────────
Style/Artboard 1–4@4x.png          ← visual reference only, do NOT copy to public/
Style/1a@4x.png                    ← visual reference only
Style/Fonts.png                    ← font reference only, do NOT copy to public/
260428_WK 2026_Master.xlsx         ← source data, do NOT copy to public/
```

---

## Important UX Details

1. **Token picker** for match cards: clicking the token chip opens an inline number bar (1–6 for poulefase, round-specific min–9 for knockout). No free-text input.
2. **Uitslag selection**: clicking the "Kies" uitslag chip opens the score odds panel. Selecting a score closes it and shows `tokens × score_odds` calculated live.
3. **Minimum 1 token** on all bets; per-section minimum enforced (see token table above).
4. **Fantasy modal** is a bottom sheet (slides up from bottom) with 80vh max height and search + filter chips.
5. **Poule standings** panel appears automatically above match cards as soon as any uitslag is filled. Collapsed by default.
6. **Knockout suggestions** banner appears in the Knock-out tab based on standings from filled uitslags.
7. **Real-time validation** on Fantasy XV — violations highlighted immediately when a conflicting player is added.
8. **Country chip deselection** in knockout: when max teams reached and a new one is added, the oldest is automatically removed.
9. All screens have `backdrop-filter: blur(8px)` on the sticky header/tabs to keep the background visible.
10. **Oranje Voorspelling** tab is only meaningful for participants — it shows Netherlands group-stage matches. Bonus tokens are credited to the participant's total automatically.
