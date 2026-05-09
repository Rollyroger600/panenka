# Panenka — WK 2026 Pool App

## What is this?

Panenka is a **private betting pool app** for 15 friends to compete during the FIFA World Cup 2026 (hosted by USA/Canada/Mexico, June–July 2026). Each participant fills in predictions before the tournament starts and earns points based on how accurate they are. There is no real money involved — this is purely for bragging rights.

A **working visual mockup** exists at `panenka_wk2026.html` in this folder. Open it in a browser to see the exact design, layout, and interactions. The mockup is a single-file HTML/CSS/JS prototype with all screens implemented. **Use it as the definitive visual reference.** This document describes what the real app needs to do and how it should be structured.

---

## Participants (fixed list, no registration)

Initials in parentheses are the internal short codes used in the Excel master.

| Naam | Ref | Basis | Extra | Totaal |
|------|-----|-------|-------|--------|
| Michiel | MG | 335 | +9 | 344 |
| Bob | BH | 335 | +5 | 340 |
| Thom | TW | 335 | +4 | 339 |
| Henk Jan | HP | 335 | +2 | 337 |
| Rogier | RH | 335 | +10 | 345 |
| Daan | DM | 335 | +9 | 344 |
| Barthold | BM | 335 | +5 | 340 |
| Robert | RA | 335 | +3 | 338 |
| Tom | TdL | 335 | +1 | 336 |
| Willem | WP | 335 | +4 | 339 |
| Bert | BS | 335 | +7 | 342 |
| Wouter | WS | 335 | +6 | 341 |
| Tim | TvL | 335 | +5 | 340 |
| Timo | TG | 335 | +9 | 344 |
| Laurens | LV | 335 | +3 | 338 |

Extra tokens are fixed per participant (sourced from `Poule_{ref}` cel (3,11) in the Excel master). They are part of the total token budget from the start, not earned during the app.

In the mockup and real app, users simply tap their name on the landing screen. This sets a cookie that identifies them throughout the session. All data is scoped per participant using their initials as the KV key prefix.

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

> **Replacing the mockup fonts:** The mockup (`panenka_wk2026.html`) uses Barlow Condensed + Barlow via Google Fonts. In the real app these are replaced by self-hosted commercial fonts: Built Titling (headings), Sporty Pro (prominent numbers), Chalky/Tomatoes (fantasy team name). Inter remains for body text.

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
| Persistence | **Upstash Redis** (via Vercel integration) — one JSON blob per participant per data type; no SQL |
| Auth | **Name selector + cookie** — tap name on landing → cookie set → redirect to app |
| Deployment | **Vercel** — zero-config for Next.js, auto-deploys on push; KV built-in |
| Client state | **Zustand** — predictions / fantasy picks before auto-save to KV |
| Version control | **GitHub** — shared repo for collaborative development |

The app is mobile-first, max content width 700px centered.

### Authentication

No auth provider needed. The landing screen shows all 15 names as buttons. Tapping a name sets two cookies:
- `participant` = initials (e.g. `RH`) — used as the KV key prefix
- `participantName` = display name (e.g. `Rogier`) — shown in the header

`middleware.ts` reads the `participant` cookie and redirects to `/` if missing on any `/(app)/*` route.

- The leaderboard (`/leaderboard`) is publicly readable — no cookie required
- All prediction writes check that a valid participant cookie is present and that the deadline has not passed
- After the deadline, all writes return 403

### Deadline

All predictions must be submitted before **9 juni 2026, 17:00** (one hour before the opening match). Enforced in `middleware.ts` — after this timestamp all inputs become read-only and API writes return 403.

### Data Storage (Vercel KV)

No SQL schema. Each participant's data is stored as a JSON blob per key. All keys use lowercase initials as the suffix.

```
KV key                  Value type          Description
─────────────────────────────────────────────────────────────────────────────
predictions:{initials}  JSON object         { [matchId]: { toto, uitslag, tokens } }
knockout:{initials}     JSON object         see structure below
oranje:{initials}       JSON object         { [matchId]: { q1..q9 } }  (q1-q4: "NED"|"OPP", q5-q9: player name)
fantasy:{initials}      JSON object         { slots: PlayerObject[], teamName: string, confirmed: boolean }
results                 JSON object         { [matchId]: { toto, uitslag } }  ← written by admin
scores                  JSON object         { [initials]: { poulefase, knockout, fantasy, total } }  ← written by scoring engine
```

**Knockout KV structure** — slots are indexed because w1/w2 each have exactly 12 slots (one per group A–L), and w3 has 8 slots in ranked order:
```
knockout:rh → {
  // w1: one slot per group (index 0-11 = groups A-L)
  "w1_0": { country: "Mexico",    tok: 3 },   // Poule A winner
  "w1_1": { country: "Canada",    tok: 4 },   // Poule B winner
  ...
  "w1_11": { country: "Engeland", tok: 2 },   // Poule L winner

  // w2: same indexed structure, excluding w1 choice per group
  "w2_0": { country: "Zuid-Korea", tok: 2 },

  // w3: 8 slots (best 3rd-place finishers, order = picking order)
  "w3_0": { country: "Turkije", tok: 3 },

  // r16–winner: slots are free-pick (any country)
  "r16_0": { country: "Nederland", tok: 5 },
  ...
}
```

Examples (other keys):
```
predictions:rh   → { "1": { toto: "1", uitslag: "2-0", tokens: 4 }, "2": { ... } }
fantasy:rh       → { slots: [{ name: "Mbappé", country: "Frankrijk", ... }, ...], teamName: "FC Rogier" }
scores           → { "rh": { poulefase: 142, knockout: 87, fantasy: 0, total: 229 }, ... }
```

Match data (72 matches), player pool, odds, and knockout quotes are all **static TypeScript files** — they are never stored in KV.

### Key Technical Decisions

1. **Auto-save, not manual save.** Every prediction change is debounced 500ms and written to Vercel KV. The "Bevestigen" button in Overzicht only sets `confirmed: true` inside the participant's KV blob — data is never at risk of being lost by forgetting to press save.

2. **Match odds stay client-side.** The seeded RNG (`sr()` + `generateMatchOdds()`) runs entirely in the browser. All 72 × 26 score odds are computed in milliseconds — no API call, no database column. The actual odds values come from `Quoteringen_toto_uitslag_test` in the Excel master (48+ score options per match, pre-computed).

3. **Knockout quotes are static data.** The per-country, per-round quotes (from `Quotes doorgaande landen` tab in the Excel) are seeded as a static TypeScript object — no database table needed. They never change after the tournament starts.

4. **Standings are derived, not stored.** `computeStandings()` is a pure function over the local predictions state. No standings table needed — recalculated whenever an uitslag changes.

5. **Player list lives in code, not KV.** The full WK 2026 player pool (from sofifa dataset) is a static TypeScript array in `lib/data/players.ts`. Only slot assignments (`slot_key → player object`) are stored in KV under the `fantasy:{initials}` key.

6. **Scoring formula is multiplicative, not additive.**
   - `toto_score = tokens × toto_quote` (if toto correct)
   - `uitslag_score = tokens × uitslag_quote` (if exact score correct — much higher multiplier)
   - `knockout_score = tokens_per_team × round_quote` (if team correctly picked)
   - Fantasy XV: based on player performance during tournament (separate scoring)

---

## Token System

### Total Budget
Each participant starts with a fixed token budget (335 base + their personal extra, see participants table). The Overzicht tab shows total available tokens and how many have been allocated.

### Per-Section Token Constraints

| Section | Id | Slots | Min per pick | Max per pick |
|---------|-----|-------|-------------|-------------|
| Poulefase (72 matches) | — | 72 | 1 | 6 |
| Knock-out: Poulewinnaars | `w1` | 12 | 2 | 9 |
| Knock-out: Nummers 2 | `w2` | 12 | 2 | 9 |
| Knock-out: Beste nummers 3 | `w3` | 8 | 2 | 9 |
| Knock-out: Ronde van 16 | `r16` | 16 | 3 | 9 |
| Knock-out: Kwartfinales | `r8` | 8 | 4 | 9 |
| Knock-out: Halve finales | `r4` | 4 | 5 | 9 |
| Knock-out: Finalisten | `finale` | 2 | 5 | 9 |
| Knock-out: WK Winnaar | `winner` | 1 | 6 | 9 |

w1 + w2 + w3 together predict which 32 teams advance from the group stage (12 group winners + 12 runners-up + 8 best 3rd-place finishers). All sections share the same personal token pool. The participant decides how to distribute tokens within the constraints above.

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

**Behavior:** Clicking a name selects it (button turns orange). Clicking "Invullen →" sets the `participant` and `participantName` cookies and redirects directly to `/poulefase`. No email, no magic link.

---

### 2. App Screen

The main app shell contains:
- **Deadline banner** at top: `⏰ Deadline: 9 juni 2026 · 17:00` (full-width orange strip)
- **Sticky header**: Logo (left) + selected participant name with token count (right)
- **Tab bar** (sticky, below header): 5 tabs — `Poulefase`, `Oranje`, `Knock-out`, `Fantasy XV`, `Overzicht`
- **Tab content area** — switches between the 5 sections
- **Bottom navigation bar** (fixed): same 5 tabs with icons

**Header compact mode** (triggered at `scrollY > 50`):
- Normal state: logo 56px, page title + subtitle visible, name + `| 🪙 X tokens over` on one row
- Compact state: logo shrinks to 34px, page title and subtitle hidden (`display:none`), name + token count stay visible at all times
- Use a CSS class (e.g. `.compact`) toggled via a `scroll` event listener

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

**Toto odds** and **score odds** come from the `Quoteringen_toto_uitslag_test` Excel tab. The mockup (`panenka_wk2026.html`) uses a seeded RNG to approximate these; in the real app the actual values from that tab are loaded as static data in `lib/data/odds.ts`.

---

### 4. Tab: Oranje Voorspelling

**Purpose:** Extra predictions for the 3 Netherlands group-stage matches. 9 specific questions per match (27 questions total).

**NL matches:**
- Match #10: NED – JPN (14-06)
- Match #33: NED – SWE (20-06)
- Match #58: TUN – NED (26-06)

**Per match: 9 questions**

Each question has a fixed set of answer options:

| Vraag | Antwoordtype |
|-------|-------------|
| Eerste ingooi | NED of tegenstander |
| Eerste corner | NED of tegenstander |
| Eerste vrije trap | NED of tegenstander |
| Eerste kaart | NED of tegenstander |
| Meeste km gelopen | NED-speler (dropdown) |
| Meeste passes | NED-speler (dropdown) |
| Meeste tackles | NED-speler (dropdown) |
| Meeste schoten op doel | NED-speler (dropdown) |
| Meeste buitenspelval | NED-speler (dropdown) |

Questions 1–4: answer is either NED or the opponent (two-option toggle). Questions 5–9: answer is a NED player selected from a dropdown of the NL squad.

**No tokens** — these are bonus predictions, not part of the token system. Scoring/bonus rules TBD (see Claude.docx for the exact bonus mechanism).

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

**8 data sections, 6 UI tabs:**

The knockout screen has 6 navigation tabs: `Ronde van 32` / `Ronde van 16` / `Kwartfinales` / `Halve finales` / `Finale` / `Winnaar`. The first tab ("Ronde van 32") bundles three sub-sections: w1 + w2 + w3.

| Section | Id | UI tab | Slots | Token min | Token max | Excel qkey |
|---------|-----|--------|-------|-----------|-----------|------------|
| Poulewinnaars | `w1` | Ronde van 32 | 12 | 2 | 9 | `winnaar_poule` |
| Nummers 2 | `w2` | Ronde van 32 | 12 | 2 | 9 | `tweede` |
| Beste nummers 3 | `w3` | Ronde van 32 | 8 | 2 | 9 | `derde` |
| Ronde van 16 | `r16` | Ronde van 16 | 16 | 3 | 9 | `r16` |
| Kwartfinales | `r8` | Kwartfinales | 8 | 4 | 9 | `r8` |
| Halve finales | `r4` | Halve finales | 4 | 5 | 9 | `r4` |
| Finalisten | `finale` | Finale | 2 | 5 | 9 | `finale` |
| WK Winnaar | `winner` | Winnaar | 1 | 6 | 9 | `winnaar` |

**w1 (Poulewinnaars):** 12 slots, one per group (A–L). Pick 1 country per group from the 4 teams in that group. Suggestion = standings leader.

**w2 (Nummers 2):** 12 slots, one per group. Same selection logic as w1, excluding the chosen w1-winner per group. Suggestion = standings #2.

**w3 (Beste nummers 3):** 8 slots from the pool of all 12 third-place finishers. Suggestion = ranked by pts + goal difference.

**Uniqueness rule (w1/w2/w3):** A country can appear in only one of w1/w2/w3. If the same country is selected in a second slot, the first occurrence is automatically cleared.

**Lege slots:** w1/w2 tonen alleen de pouleletters (A–L). r16 toont bracketverwijzingen (bijv. "2A vs 3ABCDF"). Overige lege slots tonen "+".

**Per-slot picker:** Opens as an overlay. Shows two sections: "Keuze op basis van je voorspelde uitslagen" (orange — smart suggestion based on standings/bracket) and "Overige opties" (grey — all other valid countries).

**Per-team token assignment:** Below each selected country chip, a token input row:
```
[Flag] Country Name    [___] tokens
```
Number input with round-specific min/max. Stored per team per round in KV.

**Bracket view:** A toggle button reveals a full bracket overview (M73–M103) showing both sides, arrows, and the participant's chosen winner per match. Unfilled slots show "?".

**Knockout quotes** (from `Quotes doorgaande landen` tab — stored in `lib/data/knockoutQuotes.ts`):

Sample values (Poulewinnaar | 2e in poule | 3e plek | r16 | r8 | r4 | finale | winnaar):
```
Spanje:       1.17 | 1 | ... | 1.02 | 1.28 | 1.72 | 2.37 | 3.25 | 5.5
Engeland:     1.25 | 1 | ... | 1.02 | 1.30 | 1.80 | 2.75 | 4.00 | 7.0
Brazilië:     1.13 | 1 | ... | 1.02 | 1.40 | 2.00 | 3.25 | 5.00 | 9.0
Nederland:    1.69 | 1 | ... | 1.07 | 1.72 | 2.75 | 4.75 | 9.00 | 21
Mexico:       2.10 | 1 | ... | 1.11 | 2.25 | 5.50 | 12.0 | 26.0 | 81
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
- Max 1 speler per club

Each rule row shows: status icon (✓ / ✗ / ! / —), rule text, detail (e.g. "UEFA: 4" or "2 conflicten").

**Player list — 11 regular slots** (`p0` through `p10`), **4 talent slots** (`t0`–`t3`), **20 kladblok slots** (`k0`–`k19`):

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
- Rule 3: Max 1 player per `club`
- Rule 4 (structural): Slots t0–t3 are talent-only — only players with `age < 22` (born after June 2004) can fill them. Min 4 talents is enforced by requiring all 4 talent slots to be filled.

---

### 7. Tab: Overzicht (Submit)

**Purpose:** Summary before confirming submission. Shows total token status including bonus tokens.

**Token summary card:**
- Basis tokens: 335
- Extra tokens (persoonlijk, vast): +X
- Totaal beschikbaar: 335 + X
- Tokens gebruikt in Poulefase: Y
- Tokens gebruikt in Knock-out: Z
- Tokens over: (335 + X) − Y − Z

**Completion summary card** showing:
- Deelnemer: [name]
- Wedstrijden ingevuld: X / 72
- Tokens gebruikt: Y / (335 + X)
- Oranje Voorspelling: X / 27 vragen ingevuld
- Knock-out: X / 8 secties ingevuld
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

## WK 2026 Poules

| Poule | Teams |
|-------|-------|
| A | Mexico, Zuid-Afrika, Zuid-Korea, Tsjechië |
| B | Canada, Bosnië en Herzegovina, Qatar, Zwitserland |
| C | Brazilië, Marokko, Haïti, Schotland |
| D | Verenigde Staten, Paraguay, Australië, Turkije |
| E | Duitsland, Curaçao, Ivoorkust, Ecuador |
| F | Nederland, Japan, Zweden, Tunesië |
| G | België, Egypte, Iran, Nieuw-Zeeland |
| H | Spanje, Kaapverdië, Saoedi-Arabië, Uruguay |
| I | Frankrijk, Senegal, Irak, Noorwegen |
| J | Argentinië, Algerije, Oostenrijk, Jordanië |
| K | Portugal, DR Congo, Oezbekistan, Colombia |
| L | Engeland, Kroatië, Ghana, Panama |

Nederland-wedstrijden (relevant voor Oranje Voorspelling tab): #10 NED–JPN (14-06), #33 NED–SWE (20-06), #58 TUN–NED (26-06).

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

> **Note:** The full fixtures must be extracted from the `Matchday_01`–`Matchday_27` tabs in the Excel master and verified against the official WK 2026 schedule.

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

The seeded RNG (`sr()` + `generateMatchOdds()`) in `panenka_wk2026.html` was an approximation for prototyping. The real app uses the actual Excel values.

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

Slot keys: `p0`–`p10` (regular, 11 slots), `t0`–`t3` (talents, 4 slots), `k0`–`k19` (kladblok/scratchpad, 20 slots).

```javascript
let scratchpad = {};  // slotKey (k0–k19) → player object | null
```

Scratchpad persists alongside the squad in KV under the `fantasy:{initials}` key as `{ squad, teamName, scratchpad }`.

---

## Asset Files

All image assets live in the project root and must be copied into `public/` in the Next.js project. Once there, reference them with a leading `/` (e.g. `/Background/1a@4x.png`).

```
Source location                    → Next.js public/ path
─────────────────────────────────────────────────────────────────
panenka_wk2026.html                ← working prototype, open in browser — NOT copied to public/
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

---

## Implemented UX Deviations from Spec

The following decisions were made during implementation that deviate from or extend the original spec:

- **Quote fields** in match cards show only the raw odds value (e.g. `7.30`), not `tokens × odds`. The calculated max score is shown separately at the bottom of the card as `Max. score X.X pts = (tokens × toto_odds) + (tokens × uitslag_odds)`.
- **Uitslag chip** uses orange background (same as token/toto) rather than green.
- **Poule standings** are integrated as a fifth filter button ("Standen") in the round filter bar, not as a separate collapsible panel above the match list.
- **Best 8 third-place teams** in the standings overview also receive a green left border, in addition to group winners and runners-up.

---

## Changelog

### 2026-05-04 — UI session (Claude Code)

#### Lokale ontwikkelomgeving
- `.env.local` aangemaakt voor Upstash Redis credentials (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)
- `npm install` uitgevoerd; dev server draait via `npm run dev` op `http://localhost:3000`

#### Landingspagina (`app/page.tsx`)
- Bovenbadge (`🏆 WK 2026 · VS / Canada / Mexico`) verwijderd
- Subtitel gewijzigd naar `WK 2026 | Mexico | Canada | USA` in wit
- 15-knoppengrid en "Wie ben jij?" prompt vervangen door één "Selecteer naam" dropdown-knop
- Link naar tussenstand verwijderd
- Dropdown-tekst gecentreerd in knop; pijltje absoluut gepositioneerd rechts
- Twee knoppen (dropdown + Invullen) verticaal gecentreerd op de pagina

#### App header (`components/layout/AppHeader.tsx`)
- Logo gecentreerd (was links); groter bij uitgevouwen staat (3rem → 1.75rem compact)
- Naam en token-teller gecentreerd gestapeld onder het logo, altijd zichtbaar
- Harde scheidingslijn onderaan vervangen door een gradient-verloop naar transparant
- Achtergrond: `rgba(13,13,13,0.75)` met `backdrop-blur`

#### Token-teller (`components/layout/TokenCount.tsx`)
- 🪙 emoji verwijderd; format gewijzigd naar `{remaining} tokens over`

#### Navigatie (`components/layout/BottomNav.tsx`)
- Volgorde gewijzigd: Poule → **KO** → Oranje → Fantasy → Overzicht
- Emoji-iconen vervangen door kleurloze Unicode-symbolen (◎ ◈ ◆ ★ ≡) die CSS-kleur overnemen
- Inactieve tabs: `#444`; actief tabblad: oranje
- Achtergrond: `rgba(13,13,13,0.75)` met `backdrop-blur`

#### Globale stijl (`app/globals.css`)
- `background-size: contain` → `background-size: cover` (geen zwarte zijbalken meer)

#### Poulefase — filter en standen (`app/(app)/poulefase/PoulefaseClient.tsx`)
- Rondefilter uitgebreid van 4 naar 5 knoppen: Alle · Ronde 1 · Ronde 2 · Ronde 3 · **Standen**
- "Standen"-knop toont volledige poulestanden-weergave (vervangt oude uitklapbare StandingsPanel)
- Paginatitel en subtitel gecentreerd

#### Poulestanden (`components/matches/StandingsPanel.tsx`)
- Herontworpen als volledige niet-inklapbare weergave: 2-koloms grid, oranje poulewinnaar-headers
- Kolommen: G (gespeeld) · DS (doelsaldo) · Pt (punten)
- Top 2 per poule: groen linkerbalkje
- **Beste 8 nummers-3-finishers** (over alle 12 poules gerangschikt): ook groen balkje
- `PouleGrid` geëxporteerd als herbruikbare component (gebruikt in SuggestionsPanel)

#### Wedstrijdkaarten (`components/matches/MatchCard.tsx`, `TotoButtons.tsx`)
- **Header**: wedstrijdnummer als vierkant wit badge linksboven; landen wit + 24px vlaggen gecentreerd; datum · stadion in `#7e7667`
- **Separator**: `—` → `-` (smaller)
- **Kolomlabels** (TOKENS · TOTO · QUOTE · UITSLAG · QUOTE) boven elke knopgroep
- Alle knoppen `h-9`, `rounded-lg`, gecentreerd als groep
- Quote-chips: oranje rand + oranje tekst; tonen alleen de odds-waarde (niet tokens × odds)
- Uitslag gevuld: oranje achtergrond (was groen)
- Secundaire teksten (`#7e7667`): labels, "Kies", datum, stadion, "Max. score"-label
- Max. score-regel: label in `#7e7667`, puntenaantal in oranje
- Extra ruimte na Token-knop en na eerste Quote-chip
- Kaartachtergrond: `rgba(22,22,22,0.82)` (licht transparant)

#### Knockout-tabblad (`app/(app)/knockout/KnockoutClient.tsx`)
- "X landen gekozen"-tekst verwijderd
- Rondetabbladen hernoemd: Ronde van 32 · Ronde van 16 · Kwartfinales · Halve Finales · Finale · Winnaar
- Tabbladen gecentreerd als groep (`flex-wrap justify-center`)
- Inactieve tabbladtekst: wit (was grijs)

#### Knockout suggesties (`components/knockout/SuggestionsPanel.tsx`)
- 📊 icoon verwijderd vóór de titel
- Interne weergave herontworpen: zelfde opmaak als Poulestanden (oranje headers, G/DS/Pt kolommen, vlaggen + afkortingen)
- "Beste derde-plaatsers" hernoemd naar **Beste nummers 3**, zelfde kaartopmaak
- "Stel alles in"-knop bewaard
- `PouleGrid` hergebruikt vanuit StandingsPanel

#### Overige pagina-subtitels
- Subtitels op Knockout, Oranje, Overzicht: `text-[#888]` → `text-white`

---

### 2026-05-05 — Knockout quoteringen & lay-out (Claude Code)

#### Wedstrijdkaarten — knoprij (`components/matches/MatchCard.tsx`, `TotoButtons.tsx`)
- Knoprij omgezet van `justify-center` naar `justify-between`: knoppen verdeeld over volledige breedte
- Zijmarge rij verkleind: `px-3` → `px-2`
- Breedtes aangepast aan smartphonescherm: Tokens `w-11`, Toto `w-9`, Quote `w-9`, Uitslag `w-16`, Quote `w-9`
- Alle handmatige `mr-x`/`ml-x` marges tussen groepen verwijderd

#### Knockout — quoteringen (`lib/data/knockoutQuotes.ts`)
- Kolom "Door naar 1/16e" toegevoegd als `derde`-sleutel (was niet geëxtraheerd bij eerste import)
- Waarden ingelezen uit Excel-tabblad "Quotes doorgaande landen" (`260428_WK 2026_Master.xlsx`)
- Interface `CountryKOQuotes` uitgebreid met `derde: number`

#### Knockout — sleutelkoppeling gecorrigeerd (`lib/data/knockoutRounds.ts`)
- `r16`-ronde: `qkey` gecorrigeerd van `'r16'` naar `'r16'` (toont "door naar 1/8e"-odds)
- Correct bevestigde koppeling: `r16` → "Door naar 1/8e" · `r8` → "1/4e finalisten" · `derde` → "Door naar 1/16e"

#### Knockout — tabnamen hernoemd (`app/(app)/knockout/KnockoutClient.tsx`)
- "Ronde van 32" → **"Ronde van 16"**
- "Ronde van 16" → **"Ronde van 8"**
- Bijbehorend label in `knockoutRounds.ts` meegenomen

#### Knockout — quoteringen zichtbaar (`components/knockout/RoundSection.tsx`, `Ronde32Section.tsx`)
- Quoteringen zichtbaar naast landnamen in selectiechips (geel `#FFB800`, oranje-licht bij selectie)
- Quoteringen zichtbaar in token-rijen na het kiezen van een land
- Poulewinnaars: `poulewinnaar`-kolom · Nummers 2: `tweede`-kolom · Beste nummers 3: `derde`-kolom
- Ronde van 8 t/m Winnaar: sleutel direct uit `qkey` van de ronde

#### Knockout — Beste nummers 3 verwijderknop (`components/knockout/Ronde32Section.tsx`)
- ✕-knop toegevoegd naast TokenStepper per gekozen land, identiek aan Poulewinnaars/Nummers 2

---

### 2026-05-05 — KO UI-overhaul: kaartgrid, sliders en UX-verbeteringen (Claude Code)

#### Wedstrijdkaarten — wedstrijdnummer (`components/matches/MatchCard.tsx`)
- `#` toegevoegd voor elk wedstrijdnummer in het badge (bijv. `#1`)
- Badge vergroot: `w-8 h-8` → `w-10 h-9`, uitlijning aangepast naar `left-2` (gelijk aan `px-2` van knoprij)

#### Wedstrijdkaarten — knoprij groepering (`components/matches/MatchCard.tsx`, `TotoButtons.tsx`)
- Toto-knoppen (1, X, 2) en eerste quote-knop in één `flex items-end gap-1` wrapper geplaatst: aparte kolommen met eigen labels, 4px tussenruimte
- Uitslag-knop en tweede quote-knop eveneens in eigen `flex items-end gap-1` wrapper

#### Knockout — kaartgrid layout (`components/knockout/Ronde32Section.tsx`)
- `SlotSection` (Poulewinnaars, Nummers 2) volledig herontworpen: van lijstweergave naar **4-koloms kaartgrid**
  - Lege kaart: groepsletter gecentreerd in donker vierkant
  - Geselecteerde kaart: vlag (28px) + afkorting + quote, oranje rand
  - TokenStepper altijd zichtbaar onder elke kaart
- Beste nummers 3 eveneens omgezet naar 4-koloms kaartgrid (2 rijen van 4)

#### Knockout — inline picker (`components/knockout/Ronde32Section.tsx`)
- Picker verschijnt nu **direct onder de rij** van de aangeklikte kaart (niet meer onderaan de sectie)
- Picker-opties in dezelfde kaartgridstijl als de hoofdgrid (vlag + afkorting + quote)
- Niet-gekozen landen: `opacity-60` (geen grayscale), quotes grijs
- Al gekozen elders: amber rand + oranje bolletje rechtsboven
- Geselecteerd land: oranje rand, volle kleur

#### Knockout — horizontale slider picker (`components/knockout/Ronde32Section.tsx`)
- Beste nummers 3: picker omgezet naar horizontaal scrollbare slider (swipe links/rechts)
- Alle 48 landen zichtbaar; al genomen landen gemarkeerd met oranje bolletje

#### Knockout — globale uniqueness & steal-logica (`components/knockout/Ronde32Section.tsx`)
- Eén land mag maar één keer gekozen worden over alle 32 slots (w1 + w2 + w3)
- `pickCountry` doorzoekt alle slots en wist het land elders bij een nieuwe keuze ("steal")
- `excluded` voor w1/w2 pickers uitgebreid met w3-picks van dezelfde groep

#### Knockout — overige rondes kaartgrid (`components/knockout/RoundSection.tsx`)
- `RoundSection` volledig herschreven: zelfde kaartgrid + inline slider picker als Ronde32Section
- Kolomaantal dynamisch op basis van slotaantal: 4 kolommen (≥4 slots), 2 kolommen (2 slots), 1 kolom (1 slot)
- Finale en Winnaar: kaartgrid gecentreerd, picker gebruikt volle breedte
- Uniqueness binnen dezelfde ronde (steal-logica per ronde)

#### Knockout — WK Winnaar (`components/knockout/RoundSection.tsx`, `lib/data/winnerPhrases.ts`)
- Onder de geselecteerde winnaar verschijnt "Goede keuze maat!" in de taal van het gekozen land
- Vertaald voor alle 48 landen in `lib/data/winnerPhrases.ts`
- Weergave: volledige breedte, `text-base`, wit

#### Knockout — tokenlimieten (`lib/data/knockoutRounds.ts`)
- Finalisten: minTokens `5` → `6`
- WK Winnaar: minTokens `6` → `7`

#### Knockout — tabbladnavigatie (`app/(app)/knockout/KnockoutClient.tsx`)
- Tabnamen gecorrigeerd: "Ronde van 16" → "Ronde van 32", "Ronde van 8" → "Ronde van 16"
- Korte labels voor mobiel toegevoegd: R 32 · R 16 · 1/4 · 1/2 · Fin · Win (via responsive `sm:` klassen)
- Tabstijl gelijkgetrokken met poulefase: `bg-[#161616] rounded-xl p-1`, `flex-1`, geen achtergrond op inactieve knoppen

#### Knockout — bracket overzicht (`components/knockout/BracketView.tsx`, `KnockoutClient.tsx`)
- BracketView verplaatst naar **onder** het tabbladmenu (was erboven)
- BracketView verborgen op het R 32 tabblad, zichtbaar op alle overige rondes
- Beker-icoon (🏆) verwijderd uit de header en de winnaar-kolom van BracketView

---

### 2026-05-05 — Spelersdata rebuild & Kladblok feature (Claude Code)

#### Spelersdata (`lib/data/players.ts`)
- Volledig herbouwd vanuit sofifa Excel-bestand (`sheet181.xml` + `sheet184.xml` Nat_TR)
- Nationaliteitsvertaling via dubbele EN+NL opzoeking in Nat_TR-tabblad (kolom B=EN, D=NL, E=Conf, F=3-lettercode)
- 4 byte-level aliassen toegevoegd voor sofifa-specifieke schrijfwijzen (bijv. Saudi Arabia → Saoedi-Arabië)
- **Twee-pass filtering:** pass 1 = overall ≥ 68 voor alle spelers; pass 2 = álle spelers van landen met < 20 resultaten na pass 1
- Resultaat: **5882 spelers** (was 5732 met alleen threshold), **alle 48 WK-landen** aanwezig
- Kleine landen die volledig zijn opgenomen: Tunesië (14), Qatar (14), Nieuw-Zeeland (13), Kaapverdië (12), Haïti (10), Panama (9), Egypte (7), Zuid-Afrika (7), Curaçao (6), Iran (6), Irak (4), Jordanië (2), Oezbekistan (2)

#### Fantasy — Kladblok (`store/gameStore.ts`, `app/actions/fantasy.ts`, `hooks/useFantasyXV.ts`)
- Kladblok-state toegevoegd: 20 slots (`k0`–`k19`), type `Scratchpad = Record<string, Player | null>`
- Store-acties: `setScratchpadPlayer(key, player)`, `initScratchpad(data)`
- KV-structuur uitgebreid: `FantasyKV = { squad, teamName, scratchpad? }`
- `loadFantasy` en `saveFantasy` laden/slaan scratchpad op naast squad
- `useFantasyXV` hook: scratchpad meegenomen in laad- en sla-cyclus en in `useEffect`-afhankelijkheden

#### Fantasy — Kladblok UI (`components/fantasy/ScratchpadRow.tsx` — nieuw)
- Visueel onderscheiden van squad: `border-dashed`, `bg-[#0d0d0d]`, vlag 60% opacity, gedempte tekstkleuren
- Inline info-kaart bij klikken: zelfde 3×3 grid als squad, maar donkerder stijl
- Knop **"↑ Zet in team"**: groen, plaatst speler in eerste lege squad-slot (voorkeur talent-slots voor U22-spelers)
- Knop **"✕ Verwijder"**: verwijdert speler van kladblok
- Uitgeschakeld bij vol squad (`disabled` + muted stijl)

#### Fantasy — "Naar kladblok" knop (`components/fantasy/PlayerInfoCard.tsx`)
- Optionele `onMoveToScratchpad?`-prop toegevoegd
- Blauw knop ("↓ Naar kladblok") zichtbaar wanneer prop aanwezig is
- Knop verborgen wanneer kladblok vol is (prop niet doorgegeven vanuit `PlayerRow`)

#### Fantasy — squad-naar-kladblok (`components/fantasy/PlayerRow.tsx`)
- `moveToScratchpad()`-functie: verplaatst speler naar eerste lege kladblok-slot, wist squad-slot
- `scratchpadFull`-controle: "Naar kladblok" knop verborgen wanneer kladblok vol
- `onMoveToScratchpad` doorgegeven aan `PlayerInfoCard`

#### Fantasy — kladblok spelersmodal (`app/(app)/fantasy/FantasyClient.tsx`, `components/fantasy/PlayerModal.tsx`)
- `PlayerModal` uitgebreid met optionele `onSelect?: (player: Player) => void` prop
- Bij kladblok-modal: `onSelect` slaat speler op kladblok-slot zonder squad-validatie
- `FantasyClient`: apart modal-slot (`scratchpadModalSlot`) voor kladblok-selectie
- "+ Speler toevoegen aan kladblok"-knop verschijnt wanneer kladblok niet vol is

#### Fantasy — UI-tweaks (`app/(app)/fantasy/FantasyClient.tsx`)
- Sectietitels (Spelers · Talents · Kladblok): allemaal gecentreerd, zelfde stijl (`text-xl font-bold text-[#ccc] tracking-wide`)
- Rij-tussenruimte verkleind: `gap-2` → `gap-1` in alle drie secties
- Subtitels verwijderd uit de Fantasy-pagina
- "Coach: [naam]"-label: `text-white` (was gedimde kleur)

---

### 2026-05-06 — Persoonlijke uitnodigingslinks, toernooisschema & nummers-3-toewijzing (Claude Code)

#### Authenticatie — persoonlijke uitnodigingslinks (`lib/participants.ts`, `app/actions/auth.ts`)
- `token: string`-veld toegevoegd aan `Participant`-interface
- 15 unieke 10-karakter tokens gegenereerd per deelnemer (URL-veilig, willekeurig)
- `selectParticipant(token)` Server Action rewritten: valideert token server-side, stelt cookies in (`participant`, `participantName`), redirect naar `/poulefase`
- Dropdown en naamgrid verwijderd — geen deelnemer kiest meer zelf een naam

#### Landingspagina (`app/page.tsx`, `app/LoginButton.tsx`)
- Omgebouwd naar Server Component: leest `searchParams.t`, controleert bestaand cookie, redirect bij geldige sessie
- Welkomstkaart toont naam + tokenbudget bij geldige token; foutmelding bij ontbrekende link
- `LoginButton.tsx` (nieuw): minimale Client Component voor de inlogknop met laadstatus
- Alle teksten op de landingspagina gecentreerd (`items-center text-center`)

#### Admin — uitnodigingslinks-paneel (`app/admin/AdminClient.tsx`)
- Tabblad "Links" toegevoegd naast bestaande admin-tabs
- `LinksPanel`-component: toont alle 15 deelnemersnamen met hun volledige uitnodigings-URL
- Kopieerknop per link (clipboard API)

#### Toernooisschema (`lib/data/bracketSchedule.ts` — nieuw)
- R32-wedstrijden M73–M88 gedefinieerd met `home`/`away` als getypte `Qualifier` (w1 / w2 / w3)
- `BRACKET_HALVES`: 4 brackets met bijbehorende KF- en SF-nummers
- `R16_DATES`: datumstring per R16-wedstrijd (89–96)
- `GROUP_INDEX`: mapping groepsletter (A–L) → slotindex (0–11)

#### Toernooisschema UI (`components/knockout/ScheduleView.tsx` — nieuw)
- Inklapbare component op R 16 t/m Winnaar-tabbladen (verborgen op Ronde van 32)
- 4 bracket-helften elk met 2 R16-blokken; per blok 2 R32-wedstrijden
- `QualChip`: vlag + naam + badge (oranje `1X`, grijs `2X`, goud `3X`) bij bekende picks; `?` placeholder bij onbekend
- W3-slots: tonen pool-label in grijs totdat alle poulewedstrijden ingevuld zijn
- Teller "X/24 gepickt" in header

#### Nummers-3-toewijzing (`lib/data/thirdPlaceAssignment.ts` — nieuw)
- Alle 495 combinaties uit FIFA Annexe C geïmplementeerd als readonly string-array (8 tekens per optie)
- Kolom-volgorde: matches 79, 85, 81, 74, 82, 77, 87, 80 (officiële FIFA-toewijzingsvolgorde)
- Runtime-verificatie: gooit Error als array niet precies 495 items bevat
- Voorberekende `ASSIGNMENT_MAP`: gesorteerde groepssleutel → `{matchNr: groepsletter}`
- `getThirdPlaceAssignment(groups)`: O(1) opzoekfunctie, geeft null bij ongeldige invoer
- Smoke test bevestigd: rij 1, 45 en 495 matchen de FIFA-PDF exact

#### ScheduleView — W3-resolutie (`components/knockout/ScheduleView.tsx`)
- `computeW3Map()`: berekent `standings` via `computeStandings()`, controleert of alle 12 poules volledig gespeeld zijn (elk team `played === 3`), rangschikt nummers-3, roept `getThirdPlaceAssignment()` aan
- Bij volledig ingevulde poulefase: vlag + land + groepsbadge zichtbaar per W3-slot
- "3e bepaald"-indicator in header van het inklapbare schema
- `useMemo` op `predictions`-store-slice

---

### 2026-05-06 — Horizontaal scrollbaar bracket in ScheduleView (Claude Code)

#### Bracket overzicht verwijderd (`app/(app)/knockout/KnockoutClient.tsx`)
- `BracketView` verwijderd van R16 t/m Winnaar-tabbladen (import + render)
- `ScheduleView` blijft; krijgt nu `activeTab`-prop doorgegeven

#### 3-letter landafkortingen (`lib/data/countries.ts`)
- `COUNTRY_ABB`-export toegevoegd: alle 48 WK 2026-landen met FIFA 3-letter codes (NED, GER, ARG, etc.)
- Aliassen voor alternatieve schrijfwijzen (`VS` → `USA`, `Bosnië` → `BIH`)

---

### 2026-05-08 — Fantasy UX, achtergrond, popups & nieuw Oranje-vragenssysteem (Claude Code)

#### Fantasy — PlayerModal: geen autofocus bij openen (`components/fantasy/PlayerModal.tsx`)
- `autoFocus`-prop verwijderd van het zoekveld — toetsenbord opent niet meer automatisch bij "Speler toevoegen"

#### Fantasy — PlayerModal: vaste hoogte (`components/fantasy/PlayerModal.tsx`)
- Modal omgezet van bottom-sheet (`fixed bottom-0 max-h-[90vh]`) naar vaste rechthoek (`fixed top-24 left-0 right-0 bottom-20`)
- Hoogte verandert niet meer afhankelijk van het aantal weergegeven spelers
- Handle-bar verwijderd; lijst scrollbaar via `overflow-y-auto flex-1`
- `pb-24` vervangen door `pb-4`

#### Fantasy — Filters: wis-knop reset ook zoekveld (`components/fantasy/PlayerModal.tsx`)
- "Wis filters"-knop reset nu ook de zoektekst en sluit het open filterpaneel
- `hasFilters` controleert nu ook of `search.trim()` gevuld is

#### Achtergrond — breed-scherm variant (`app/globals.css`)
- CSS `@media (min-width: 768px)` toegevoegd: wisselt naar `Background/Background_wide.png` op niet-smartphone schermen
- `@keyframes popup-shrink` toegevoegd (voor PopupToast voortgangsbalk)

#### PopupToast — random in-app popups (`components/ui/PopupToast.tsx`, `lib/popups.ts`)
- Nieuw: `lib/popups.ts` — berichtenconfiguratiebestand met `global`-lijst en pagina-specifieke lijsten (`/fantasy`, `/poulefase`, `/knockout`, `/oranje`)
- `{naam}` in berichten wordt vervangen door een willekeurige andere deelnemersnaam (uit `PARTICIPANTS`)
- Timing: eerste popup na 2–5 minuten; daarna elke 20–30 minuten; `popup_next_time` in localStorage
- Popup verdwijnt na 5 seconden of bij klikken op ✕; oranje voortgangsbalk toont resterende tijd
- Slide-in animatie (`translate-y-4 → 0`, `opacity-0 → 100`) via Tailwind transitions
- `PopupToast` toegevoegd aan `app/(app)/layout.tsx` met `currentUserName`-prop

#### Oranje — volledig nieuw vragenssysteem (vervangt 9 vaste vragen)

##### Types (`lib/types/oranjeVragen.ts` — nieuw)
- `AntwoordType`: `'ja_nee' | 'nl_opp' | 'speler_nl' | 'speler_opp' | 'percentage' | 'minuut' | 'anders'`
- `OranjeVraag`: `{ tekst, type, suggestie?, adminType?, gepubliceerd }`
- `OranjeVragenMap`, `OranjeAntwoordenMap`, `OranjeCorrectMap`, `MINUUT_OPTIES`, `ANTWOORD_TYPE_LABELS`

##### Server actions (`app/actions/oranjeVragen.ts` — nieuw)
- `loadOranjeVragen()` / `saveOranjeVraag(matchId, vraag)` — globale KV-sleutel `oranje_vragen`
- `loadOranjeAntwoorden()` / `saveOranjeAntwoorden(data)` — per-deelnemer KV-sleutel `oranje_antwoorden:{initials}`
- `loadOranjeCorrect()` — globale KV-sleutel `oranje_correct`

##### Deadlines (`hooks/useDeadline.ts`)
- `VRAAG_DEADLINE = new Date('2026-05-31T21:59:00Z')` toegevoegd (31 mei 23:59 CEST)
- Hook retourneert nu ook `isVraagPast` en `vraagDeadline`

##### VraagIndienenCard (`components/oranje/VraagIndienenCard.tsx` — nieuw)
- Formulier per wedstrijd: tekstveld + 7 type-knoppen + optioneel suggestiefield bij `anders`
- Opslaan-knop met `saving → saved` status; bijwerken mogelijk tot vraagdeadline
- Na deadline: read-only weergave van ingediende vraag

##### VragenBeantwoordenCard (`components/oranje/VragenBeantwoordenCard.tsx` — nieuw)
- Toont alle gepubliceerde vragen per wedstrijd (alleen wat admin heeft gepubliceerd)
- Antwoordinvoer per type: Toggle (ja_nee / nl_opp), Dropdown (speler_nl / speler_opp), Nummerinvoer +/−5 (percentage), 10-minutenvensterselector (minuut)
- Progress-teller per wedstrijd; read-only modus na antwoorddeadline

##### OranjeClient herschreven (`app/(app)/oranje/OranjeClient.tsx`)
- 3 fasen op basis van deadlines: vraag indienen → vragen beantwoorden → alleen lezen
- Debounced auto-save van antwoorden (500ms)
- Progress: `X/3 vragen ingediend` (fase 1) of `X/Y antwoorden ingevuld` (fase 2+3)
- Uitlegblok zichtbaar in fase 1
- `app/(app)/oranje/page.tsx` geeft `mijnInitials` door via cookie

##### Scoring (`lib/scoring.ts`)
- Nieuwe functie `scoreOranjeNieuw()`: 0,5 punt per correct antwoord
- `percentage`-type: correct als `|gegeven − correct| ≤ 5`
- `minuut`-type: exacte venster-match
- `scoreParticipant()` accepteert optionele `oranjeAntwoorden` + `oranjeCorrect`; gebruikt nieuw systeem als `oranje_correct` gevuld is, anders legacy fallback

##### Admin (`app/actions/admin.ts`, `app/admin/AdminClient.tsx`, `app/admin/page.tsx`)
- Nieuwe admin-acties: `loadOranjeVragenAdmin()`, `updateOranjeVraag()`, `loadOranjeCorrectAdmin()`, `saveOranjeCorrect()`
- `computeAndSaveScores()` laadt ook `oranje_antwoorden:{initials}` en `oranje_correct`
- Admin-tab "Oranje" vervangen door "Oranje Vragen":
  - Per wedstrijd: alle 15 deelnemers met hun ingediende vraag
  - Per vraag: Publiceer/Depubliceer-knop; voor `anders`-type: dropdown om te converteren naar geldig type
  - Invoerveld voor correct antwoord per vraag na de wedstrijd (`AdminCorrectInvoer`)
- `app/admin/page.tsx` laadt `initialOranjeVragen` + `initialOranjeCorrect`

### 2026-05-08 — Vaste breedte & FIFA-kritiek drawer (Claude Code)

#### Content breedte — smartphone-breedte op alle schermen (`app/layout.tsx`)
- Alle content gewikkeld in `max-w-[430px] mx-auto min-h-screen` container
- App blijft er op brede schermen exact hetzelfde uitzien als op een smartphone; achtergrond vult de rest van het scherm

#### FIFA-kritiek info-drawer (nieuw)
- `components/layout/FifaInfoDrawer.tsx` — nieuw: slide-up drawer (90dvh) met thematische secties over de WK-organisatie (mensenrechten, corruptie, locatiekeuze, persoonlijk statement, wat kun je doen); teksten zijn placeholders die door de gebruiker worden ingevuld
- `components/layout/AppShell.tsx` — nieuw: client-wrapper die `isOpen`-state beheert voor de drawer en `AppHeader` + `FifaInfoDrawer` combineert
- `components/layout/AppHeader.tsx` — `onInfoClick?`-prop toegevoegd; subtiel ℹ-knop (40% opaciteit) toegevoegd naast de token-teller
- `app/(app)/layout.tsx` — `AppHeader` vervangen door `AppShell`; server component blijft ongewijzigd

---

### 2026-05-08 — Typografie, transparantie & KO UX (Claude Code)

#### Font-systeem opgeschoond

- **Sporty Pro Shadow** (`font-accent font-bold`, weight 700): uitsluitend paginatitels (`h1`); alle andere `font-accent font-bold` vervangen door `font-heading`
- **Sporty Pro Light** (`font-accent font-light`, weight 300): 3-lettercodes op matchcards, Oranje-kaarten, KO-tegels, ScheduleView, SuggestionsPanel en StandingsPanel
- `sporty-pro-regular.woff2` (weight 400) vervangen door `sporty-pro-light.otf` in `globals.css` — bestand kan verwijderd worden
- **Built Titling** (`font-heading`): token-teller, quote-badges, token-waarden Overzicht, KO-quoteringen, alle tekst in TokenPicker / ScorePicker / TotoButtons / matchcard-labels
- "Talents" sectielabel: `font-script` → `font-heading` (gelijk aan Spelers / Kladblok)
- Paginaondertitels: `font-accent font-light text-xs` op alle tabs; Fantasy XV-ondertitel "Stel je eigen droomteam samen" toegevoegd

#### Matchcard-knoprij (`components/matches/MatchCard.tsx`, `TotoButtons.tsx`, `TokenPicker.tsx`, `ScorePicker.tsx`)

- Knomlabels (Tokens · Toto · Quote · Uitslag): `text-[9px]` → `text-[11px]`
- Uitslag-knop breder: `w-16` → `w-14`
- Quoteringen onder 1 / X / 2 toto-knoppen verwijderd; overbodige `matchId`-prop en `MATCH_ODDS`-import in `TotoButtons` opgeruimd
- Alle tekst (labels, knoppen, cijfers) in `TotoButtons`, `TokenPicker` en `ScorePicker`: `font-heading` toegevoegd

#### TeamNameEditor (`components/fantasy/TeamNameEditor.tsx`)

- Hoogte verlaagd: `py-3` → `py-2`
- `flex items-center justify-center` toegevoegd voor verticale centrering tekst
- Coach-label: `text-xl` → `text-2xl` (gelijk aan teamnaam)

#### Poulefase — rondeheaders en tabknoppen

- Rondeheaders: stijl gelijkgetrokken met "Spelers" in Fantasy — `font-heading text-xl font-bold text-[#ccc] tracking-wide text-center` (was kleine oranje uppercase)
- Tab-knoppen Poulefase en Knockout: `text-[10px]` → `text-xs`
- `TokenBanner` verwijderd uit het poulefase-tabblad

#### Transparantie op alle containers

- Alle primaire card-containers in Fantasy, Oranje, Overzicht, Knockout: `rgba(22,22,22,0.82)` (zelfde als MatchCard)
- KO-secties (`Ronde32Section`, `RoundSection`, `BracketView`, `ScheduleView`): outer containers en card-headers transparant (`rgba(10,10,10,0.75)` voor headers)
- Tab bars Poulefase en Knockout: `rgba(22,22,22,0.82)`

#### KO ScheduleView — header vereenvoudigd (`components/knockout/ScheduleView.tsx`)

- Header toont nu alleen gecentreerde tekst "Toernooischema" + pijltje
- "3e bepaald"-indicator en "x/24 gepickt"-teller verwijderd; overbodige variabelen opgeruimd

#### KO SuggestionsPanel (`components/knockout/SuggestionsPanel.tsx`)

- Stijl gelijkgetrokken met ScheduleView: transparante container, witte tekst, gecentreerde header
- `last:border-0` → `last:border-b-0` — groen linkerbalkje op laatste "beste nummer 3"-rij bleef nu correct zichtbaar
- Bevestigingsdialoog bij "Stel alles in op basis van suggesties" wanneer er al picks aanwezig zijn; bij bevestiging worden alle slots overschreven (ook gevulde)

---

### 2026-05-08 — Oranje matchcard UI-verbeteringen (Claude Code)

#### Oranje matchcard headers — identiek aan poulefase MatchCard (`components/oranje/VraagIndienenCard.tsx`, `components/oranje/VragenBeantwoordenCard.tsx`)
- Header vervangen door exacte kopie van poulefase `MatchCard`-header: wedstrijdnummer als absoluut badge links, vlaggen + 3-letter landcodes gecentreerd, datum & stadion eronder in gedempte kleur
- Kaartrand gewijzigd van `border-[#2a2a2a]` naar `border-[#FF6B00]/30`
- `abbrevCountry()` en `FlagImage` toegevoegd aan beide kaarten

#### Oranje — antwoordtype knoppen (`components/oranje/VraagIndienenCard.tsx`, `lib/types/oranjeVragen.ts`)
- Knoppen gecentreerd via `justify-center`
- Labels dynamisch via nieuwe `getAntwoordTypeLabel(type, opponent)`: toont landnaam i.p.v. "tegenstander" (bijv. "Nederland / Japan", "Speler Japan")
- Label `anders` hernoemd naar "Alternatieve suggestie, te beoordelen door admin"

#### Oranje — uitlegblok (`app/(app)/oranje/OranjeClient.tsx`)
- Zin ④ aangepast: "0,5 punt" → "0,5 token op voor de KO fase"

---

### 2026-05-08 — UI-polish: filters, header, fonts (Claude Code)

#### Fantasy — filter-tegeltjes (`components/fantasy/PlayerModal.tsx`)
- Alle filter-tiles verkleind van `w-14 h-14` naar `w-12 h-12` zodat 6 confederatie-tegeltjes naast elkaar passen op een 375px smartphone (6×48 + 5×8gap = 328px < 343px beschikbaar)
- CONF-panel: `overflow-x-auto` verwijderd; alle 6 confederaties zichtbaar zonder scrollen
- Niet-geselecteerde tiles: frosted glass stijl `bg-white/30 backdrop-blur border-[#666]` (van `bg-[#1a1a1a]`) zodat donkere logos zichtbaar zijn
- Positie-iconen kleur: `#555` → `#222` voor zichtbaarheid op lichtere achtergrond

#### App header — gradient fade (`components/layout/AppHeader.tsx`)
- Achtergrond verplaatst naar apart absoluut element dat 3rem onder de header doorloopt
- `mask-image: linear-gradient(to bottom, black 55%, transparent 100%)` op achtergrondlaag: blur stopt niet langer abrupt maar fadeout geleidelijk
- Content (logo, naam) staat relatief boven de achtergrondlaag en wordt niet beïnvloed door mask

#### Typografie — fonts consequent toegepast (Claude Code)
- **Built Titling** (`font-heading`): paginatitels, filtertabs (Poulefase + Knockout), ronde-labels, wedstrijdnummer-badge, "Spelers"/"Kladblok" sectieheaders, FIFA-drawer titels
- **Sporty Pro Shadow** (`font-accent font-bold`, weight 700): paginatitels (Poulewedstrijden, Knockout, Oranje, Fantasy XV, Overzicht)
- **Sporty Pro Regular** (`font-accent`, weight 400): token-teller in header, quote-chips in matchcards, token-waarden in Overzicht
- **Sporty Pro Light** (`font-accent font-light`, weight 300): 3-letter landcodes in match- en oranje-kaarten
- **Chalk Board** (`font-script`): teamnaam, coach-label, "Talents" sectieheader; inline `style` vervangen door Tailwind `font-script` klasse
- `globals.css`: `@font-face` bijgewerkt — Sporty Pro Light (`.otf`, weight 300), Regular (`.woff2`, weight 400), Shadow (`.otf`, weight 700); Chalky vervangen door Chalk Board (`.ttf`, `format('truetype')`)
- **Datum & stadion** in matchcards: `font-heading font-light` (Built Titling Light)

#### Matchcards — kleine tweaks (`components/matches/MatchCard.tsx`)
- Spatie toegevoegd tussen `#` en wedstrijdnummer: `# {match.id}`

#### Paginatitels — grootte & font
- Alle paginatitels: `text-2xl` → `text-3xl`
- Teamnaam: `text-lg` → `text-2xl`; coach-label: `text-base` → `text-xl`
- "Oranje Voorspelling" hernoemd naar "Oranje"

#### ScheduleView — volledig herschreven als horizontaal bracket (`components/knockout/ScheduleView.tsx`)
- Accepteert `activeTab: string` prop; collapsible header ongewijzigd
- Horizontaal scrollbaar (`overflow-x-auto`); 6 kolommen: R 32 · R 16 · 1/4 · 1/2 · Fin · Win
- Vaste hoogte-constanten: `SLOT=24px`, `INNER=2px`, `MATCH_GAP=8px`, `GROUP_GAP=14px`, `GROUP_H=108px`, totale bracket-hoogte `962px`
- `BRACKET_GROUPS`: 8 visuele groepen in bracket-volgorde (boven→onder), elk met 2 R32-wedstrijden
- `TeamChip`: vlag (11px) + 3-letter afkorting; `?` bij lege pick; donker app-thema
- `ColHeader`: actieve kolom gemarkeerd met oranje onderlijn en tekst
- Inferentie per ronde-overgang via `infer(a, b, set)`: kijkt welke R32-deelnemer in de volgende ronde-set (r16_*/r8_*/r4_*/finale_*) staat — puur visueel, picks in RoundSection ongewijzigd
- Bracket-data via `useMemo`: resolveert R32-teams uit w1/w2/w3-picks + w3Map; berekent r16A/r16B per group, qf per group, sfTeams (4), finalists (2), winner
- Automatisch scrollen: bij uitklappen en bij tabwisseling springt de bijbehorende kolom gecentreerd in beeld
- W3-slots: tonen resolvede landen zodra alle poulewedstrijden zijn ingevuld (bestaande w3Map-logica hergebruikt)

---

### 2026-05-08 — UI-polish: quoteringen, uitlegblokken & correcties (Claude Code)

#### Oranje matchcard headers — `font-heading` gelijkgetrokken met MatchCard (`components/oranje/VraagIndienenCard.tsx`, `components/oranje/VragenBeantwoordenCard.tsx`)
- `font-heading` toegevoegd aan het wedstrijdnummer-badge (was zonder)
- Spatie toegevoegd tussen `#` en wedstrijdnummer: `#{id}` → `# {id}`
- `font-heading` toegevoegd aan het streepje-separator tussen landen

#### Fantasy — quote-badge stijl gelijkgetrokken met poulefase matchcards (`components/fantasy/PlayerRow.tsx`, `components/fantasy/PlayerModal.tsx`)
- Badge: `font-heading` toegevoegd, border opacity verhoogd van `/30` naar vol (`border-[#FF6B00]`), achtergrondvulling (`bg-[#FF6B00]/10`) verwijderd
- PlayerModal-lijst: badge toegevoegd (was alleen tekst zonder rand)

#### Font-fix Built Titling (`app/globals.css`)
- `@font-face` voor Built Titling verwees naar niet-bestaande `.woff2` bestanden; gecorrigeerd naar de aanwezige `.otf` bestanden (`built titling rg.otf` / `built titling lt.otf`)

#### Fantasy — puntenstelsel uitlegblok (`app/(app)/fantasy/FantasyClient.tsx`)
- Uitlegblok toegevoegd onderaan de pagina (na kladblok), zelfde stijl als Oranje-uitlegblok
- Legt uit hoe spelers punten verdienen (goals × quote) en hoe de quote wordt berekend (EA FC rating, FIFA ranking, toernooiverwachting)

#### Overzicht — maxima gecorrigeerd (`app/(app)/overzicht/OverzichtClient.tsx`)
- Knockout landen: max 61 → **63**
- Oranje vragen: max 27 → **45**

---

### 2026-05-09 — UI-polish: tekstgroottes, dropdown UX & toernooischema verbeteringen (Claude Code)

#### Poulefase — tekstgroottes vergroot (`components/matches/MatchCard.tsx`, `TotoButtons.tsx`)
- Datum & stadion: `text-[10px]` → `text-xs` (12px)
- Kolomtitels (Tokens · Toto · Quote · Uitslag · Quote): `text-[11px]` → `text-sm` (14px)
- Max score tekst: `text-[10px]` → `text-sm` (14px)
- Knoppen (tokens, uitslag, quotes, toto-buttons): `text-xs` → `text-sm` (14px)

#### ScorePicker — dropdown verbeteringen (`components/matches/ScorePicker.tsx`)
- Kolomtitels: `text-[10px]` → `text-xs` (12px)
- Zijpadding knoppen: `px-2` → `px-3.5` (14px)
- Selectiekleur: groen (`#2ECC71`) → oranje (`#FF6B00`)
- Quoteringskleur: goud (`#FFB800`) → gedempte toon (`#7E7667`)

#### Knockout — quoteringen vergroot (`components/knockout/RoundSection.tsx`, `Ronde32Section.tsx`)
- Quoteringstekst per land: `text-[10px]` → `text-xs` (12px)

#### TokenStepper — Built Titling font (`components/knockout/TokenStepper.tsx`)
- Token-getal: `font-heading` toegevoegd

#### StandingsPanel — kolombreedte (`components/matches/StandingsPanel.tsx`)
- Landkolom: `min-w-0` + `truncate` → `min-w-[36px]` zonder truncate (3-letter codes passen beter)
- G-kolom: `w-4` → `w-3` (compacter)
- Zelfde wijziging doorgevoerd in "Beste nummers 3"-tabel in SuggestionsPanel

#### SuggestionsPanel — sticky + scrollbaar (`components/knockout/SuggestionsPanel.tsx`)
- Uitklapinhoud scrollbaar: `overflow-y-auto max-h-[45vh]`
- Content als absolute overlay gerenderd zodat de rest van de pagina niet verdrongen wordt
- Toggle-knop sticky (`sticky top-20 z-20`) zodat deze altijd bereikbaar is bij scrollen
- KnockoutClient laadt nu ook `usePredictions()` zodat suggesties zichtbaar zijn zonder eerst de Poule-tab te bezoeken

#### ScheduleView — reeks verbeteringen (`components/knockout/ScheduleView.tsx`)
- Uitklapinhoud scrollbaar: `overflow-y-auto max-h-[45vh]`
- Inhoud vergroot: SLOT 24 → 30px; vlaggen 11 → 14px; tekst 9 → 11px; kolomtitels 9 → 11px
- Lege chip: rand `#1a1a1a` → `#333`; vraagteken `#2a2a2a` → `#555` (leesbaarder)
- Inactieve kolomtitels: tekst `#444` → `#777`; onderlijn `#222` → `#444`
- Chip-containers: `rounded-sm` → `rounded-md` (afgeronde hoeken)
- Kolomafstand: `gap: 4` → `gap: 12` (COL_GAP)
- Verticaal scrollen bij tabwisseling: eerste chip van actieve kolom gecentreerd in beeld
- Connector-lijntjes toegevoegd (`<BracketLines />` SVG overlay): laat zien welk land naar de volgende ronde gaat; vork-patroon (twee horizontalen + vertikaal + uitgang) per ronde-overgang

#### Oranje — statistiekregel restyled (`app/(app)/oranje/OranjeClient.tsx`)
- Oranje tekst (`text-[#FF6B00]`) vervangen door donkere container met witte tekst (zelfde stijl als toernooischema-container)

#### Overzicht — dynamisch maximum Oranje vragen (`app/(app)/overzicht/OverzichtClient.tsx`)
- Vóór 31 mei: max Oranje vragen = 3 (één vraag indienen per wedstrijd)
- Na 31 mei: max Oranje vragen = 45 (alle gepubliceerde vragen beantwoorden)
