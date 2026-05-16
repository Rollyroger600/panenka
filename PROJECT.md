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

### 2026-05-16 — Admin restyling + quoteringen nulmeting + TypeScript fix (Claude Code)

#### Admin pagina restyling (`app/admin/AdminClient.tsx`)
- **Header**: tekst-titel vervangen door Panenka logo in sticky header met blur-achtergrond (identiek aan AppHeader)
- **MatchResultRow**: volledig herschreven naar MatchCard-stijl — match-nummer badge, vlaggen + teamnamen, datum/stadion, toto-knoppen (1/X/2), "Uitslag"-knop die ScorePicker dropdown opent (gesorteerd in thuis/gelijk/uit kolommen); fallback text-input voor wedstrijden zonder odds-data
- **KO Resultaten**: van tekst-buttons naar vierkante vlag-tegels met landafkorting in grid van 6 kolommen — geselecteerd = oranje border + tint, vol = dimmed + disabled; identieke stijl als deelnemers KO-picker
- **Kaarthoofden**: `bg-[#111]` vervangen door `rgba(10,10,10,0.75)` — consistent met rest van de app
- **Container**: `max-w-2xl` → `max-w-[700px]` conform app-breedte
- Ongebruikte imports `loadOranjeVragenAdmin` / `loadOranjeCorrectAdmin` opgeruimd

#### TypeScript fix — `MatchTrends.scores` (`lib/data/odds_trends.ts`, `scripts/scrape-odds.mjs`)
- `scores: Record<string, OddsTrend>` toegevoegd aan `MatchTrends` interface — het veld werd al gegenereerd maar miste in de type-definitie
- Scraper-script bijgewerkt zodat de interface bij volgende run correct wordt gegenereerd

#### Quoteringen nulmeting (launch dag)
- `npm run update_quoteringen` twee keer uitgevoerd: eerste run laadt verse Kambi-data, tweede run vergelijkt identieke waarden → alle trends `same` → geen trend-icoontjes zichtbaar bij launch
- 49 wedstrijden + 48 landen bijgewerkt; 23 wedstrijden nog niet op Kambi (app toont '—')

---

### 2026-05-16 — Multi-groep implementatie Fase 1: OG + ASC (Claude Code)

#### Groepsinfrastructuur (`lib/groups.ts` — nieuw)
- Nieuw bestand met `GroupId` type (`'og' | 'asc'`), `GROUP_MEMBERS` ledenlijsten per groep, `DUAL_GROUP_INITIALS` (`['WS', 'RA']`) en `getGroupForParticipant()` helper
- OG: 15 bestaande deelnemers; ASC: 16 deelnemers (14 nieuw + WS en RA als dual-group)

#### ASC-deelnemers (`lib/participants.ts`)
- 14 ASC-only deelnemers toegevoegd: Jan (JS), Christian (CV), Bregt (BV), Lex (AR), Mark (MB), Jelle (JH), Jorn (JK), Niels (NS), Peter (PN), Thomas (TWo), Coen (CB), David (DK), Wiger (WW), Vincent (VH)
- Alle ASC-deelnemers krijgen `extra: 6` bonus tokens — maakt Wouter's budget identiek in beide groepen

#### KV-sleutel helper (`lib/kv/kv.ts`)
- `groupKey(section, groupId, initials?)` toegevoegd — genereert sleutels als `oranje_vragen:og` of `oranje_antwoorden:asc:ws`

#### Login: group cookie (`app/actions/auth.ts`)
- Bij login wordt `group=og|asc` cookie gezet op basis van `getGroupForParticipant()`
- ASC-only deelnemers krijgen `group=asc`; dual-group en OG-only krijgen standaard `group=og`

#### Oranje actions groepsbestendig (`app/actions/oranjeVragen.ts`, `app/actions/admin.ts`)
- Alle Oranje-lees/schrijf functies lezen nu de `group` cookie en gebruiken `groupKey`
- `computeAndSaveScores(groupId)` filtert deelnemers op groep, slaat op als `scores:og` of `scores:asc`
- Admin: `setAdminGroup(groupId)` action toegevoegd voor OG/ASC toggle

#### Admin OG/ASC toggle (`app/admin/page.tsx`, `app/admin/AdminClient.tsx`)
- OG- en ASC-knoppen bovenaan de adminpagina; schakelen via `admin_group` cookie + redirect
- Vragen-tab toont deelnemers van de geselecteerde groep
- "Bereken scores" en "Download Excel" werken per groep

#### Export groepsbestendig (`app/api/export/route.ts`)
- Leest `?group=og|asc` query param (of `admin_group` cookie)
- OG: selecteert master Excel zonder 'ASC' in bestandsnaam; ASC: selecteert bestand met 'ASC'
- Aparte sheet-mappings voor ASC (`Poule_JS`, `FT_JS`, etc.)
- Export-bestandsnaam bevat groepslabel: `export_OG_...xlsx` / `export_ASC_...xlsx`

#### Leaderboard groepsbestendig (`app/leaderboard/page.tsx`)
- Laadt `scores:og` of `scores:asc` op basis van `group` cookie
- Backward compat: valt terug op oude `scores` sleutel voor OG als nieuwe key nog leeg is
- Subtitel toont actieve groep (bijv. "WK 2026 Poule · OG")

#### Migratie Redis-sleutels (`scripts/migrate-groups.mjs` — nieuw)
- Script kopieert bestaande OG-data naar nieuwe groepsspecifieke sleutels (originelen blijven)
- Uitgevoerd: `oranje_vragen → oranje_vragen:og` ✓, `scores → scores:og` ✓

#### Token-strategie dual-group deelnemers
- Wouter (WS): identiek budget in OG en ASC (+6 in beide) — predictions volledig gedeeld, geen toggle nodig in Fase 1
- Robert (RA): vult ASC-predictions zelf in via ASC-context met eigen ASC-budget (+6)

---

### 2026-05-16 — Reset-script, popup per groep, export cleanup & welkomstscherm (Claude Code)

#### Reset-script (`scripts/reset-all-data.mjs` — nieuw)
- Eenmalig script dat alle deelnemersdata uit Redis wist: `predictions`, `knockout`, `fantasy`, `oranje`, `confirmed` per deelnemer; `oranje_vragen`, `oranje_antwoorden`, `oranje_correct`, `scores` per groep (og + asc)
- Gebruik: `node --env-file=.env.local scripts/reset-all-data.mjs`
- Logt per key of er data was (✓) of de key al leeg was

#### Excel export — wedstrijd-tabs leegruimen (`app/api/export/route.ts`)
- Na het schrijven van uitslag-quoteringen worden de 35 rijen daarna in kolommen B en C expliciet leeggemaakt (`.value(null)`)
- Voorkomt dat oude/langere placeholder-data zichtbaar blijft als de nieuwe dataset kleiner is

#### Popups per groep (`lib/popups.ts`, `components/ui/PopupToast.tsx`, `app/(app)/layout.tsx`)
- `POPUPS` geherstructureerd naar `Record<GroupId, Record<string, string[]>>` — OG en ASC hebben elk hun eigen berichten per pagina
- `PopupToast` krijgt nu `groupId` prop; willekeurige naam wordt alleen gekozen uit deelnemers van de eigen groep
- `layout.tsx` bepaalt groep via `getGroupForParticipant(initials)` en geeft deze door

#### ASC Excel (`260516_WK 2026_Master_ASC.xlsx`)
- Master Excel voor de ASC-groep aangemaakt; export-route pikt deze automatisch op via de `ASC`-filter

#### Welkomstscherm (`app/page.tsx`, `app/LoginButton.tsx`)
- Containers op welkomstscherm: `bg-[#1a1a1a]` → `bg-[#1a1a1a]/70` zodat de achtergrondafbeelding licht doorschijnt
- Knoptekst gewijzigd: "Invullen →" → "Start Panenka →"

---

### 2026-05-15 — npm shortcut, multi-groep plan & pull analytics (Claude Code)

#### npm shortcut `update_quoteringen` (`package.json`)
- Script toegevoegd: `npm run update_quoteringen` draait `scrape-match-odds` + `scrape-ko-odds` sequentieel — handige alias voor dagelijks bijwerken van quoteringen

#### Multi-groep plan OG + ASC (nog niet geïmplementeerd)
- Volledig plan uitgewerkt voor multi-groep ondersteuning (groep OG + groep ASC)
- Opgeslagen in `C:\Users\r.akerboom\.claude\plans\onderwerp-multi-groep-ik-flickering-metcalfe.md`
- Kernarchitectuur: cookie `group=og|asc` bepaalt context; gedeelde data (wedstrijden, fantasy, KO, Oranje-vraag) blijft groepsonafhankelijk; Oranje-antwoorden en leaderboard worden groepsspecifiek
- Wouter (WS) + Robert (RA) zitten in beide groepen; groeptoggle verschijnt alleen op Oranje-pagina en Overzicht

#### Pull co-auteur commits
- Binnengehaald: PostHog analytics (`components/PostHogProvider.tsx`), Vercel Analytics en Vercel Speed Insights

### 2026-05-15 — Token teller fix, toernooischema verbeteringen & Excel export uitgebreid (Claude Code)

#### Token teller fix — globale data-loader (`components/layout/GlobalDataLoader.tsx`, `app/(app)/layout.tsx`)
- Nieuw component `GlobalDataLoader` toegevoegd aan de app-layout: laadt `predictions` en `knockoutPicks` bij elke pagina-mount, ongeacht welke pagina geopend wordt
- Fix: op pagina's zonder eigen data-hook (oranje, fantasy) toonde de token-teller het volle budget i.p.v. het resterende; door de store leeg was werd `used = 0` berekend

#### Toernooischema (`components/knockout/ScheduleView.tsx`)
- **Bugfix R32-lijntjes**: `hbY` en `abY` misten een `SLOT`-term (30 px), waardoor de verbindingslijnen slot 2 én 3 verbonden in plaats van 3 én 4
- **Titel** gewijzigd naar "Toernooischema op basis van ingevulde uitslagen"
- **Poule-positielabels** toegevoegd links van elk R32-chip: toont positie als `E1`, `A2`, `C3` (bij beste nr. 3: `C3` zodra standings bekend zijn, anders `?3`); label 11px monospace, kleur #555
- R32-kolombreedte uitgebreid van 76 px naar 104 px voor de label-ruimte; COLS en SVG-breedte bijgewerkt

#### Excel export (`app/api/export/route.ts`)
- **'Quotes doorgaande landen' tabblad**: schrijft KO-quoteringen (poulewinnaar t/m winnaar) in kolommen B–I, rijen 2–49; volgorde bepaald door landnamen in kolom A van het sheet (niet alfabetisch)
- **Wedstrijd-tabbladen ('1' t/m '72')**: schrijft toto-quoteringen in G5/G6/G7 (thuis/gelijk/uit) en alle uitslag-quoteringen in B6:C… (gesorteerd van laagste naar hoogste quotering)
- **Fantasy fix**: spelers worden nu opgezocht via `PLAYER_BY_ID[stored.id]` i.p.v. direct het opgeslagen object te gebruiken; voorkomt lege cellen als een squad is opgeslagen vóórdat het `middleName`-veld bestond

#### Popup-teksten (`lib/popups.ts`)
- Diverse popup-berichten herschreven met meer humor en specifieke verwijzingen naar de groep

---

### 2026-05-15 — Excel FT-namen, KO-teksten & oranje telling fix (Claude Code)

#### Excel export FT-tabbladen (`app/api/export/route.ts`)
- **Naam deelnemer → G2** en **teamnaam → G4** worden nu geschreven op elk Fantasy-tabblad (`FT_*`)
- `teamName` wordt voortaan opgeslagen in `participantData` (was alleen `squad`); G2 wordt altijd geschreven als het sheet bestaat, G4 alleen als er een teamnaam is

#### KO-pagina teksten (`components/knockout/SuggestionsPanel.tsx`, `components/knockout/ScheduleView.tsx`)
- **R32 suggesties**: tekst gewijzigd van "Suggesties op basis van jouw voorspellingen" naar "Suggesties op basis van jouw uitslagen"
- **R16–WIN schema**: tekst gewijzigd van "Toernooischema op basis van ingevulde uitslagen" naar "Toernooischema op basis van jouw uitslagen"

#### Overzicht oranje telling fix (`app/(app)/overzicht/OverzichtClient.tsx`)
- **Bugfix**: overzicht toonde altijd 0/3 voor "Oranje vragen" omdat het `oranjeVoorspelling` (KV-sleutel `oranje:<initials>`) telde — een lege store die niets met het oranje vragenssysteem te maken heeft
- Fix: laadt nu direct `oranje_vragen` en `oranje_antwoorden` via de bestaande server actions
- Vóór vraagdeadline: telt hoeveel van de 3 wedstrijden de deelnemer een vraag heeft ingediend (max 3)
- Na vraagdeadline: telt ingevulde antwoorden vs. gepubliceerde vragen (dynamisch, niet hardcoded 45)
- `useOranjeVoorspelling` hook verwijderd uit overzicht; ongebruikte `ORANJE_KEYS` constante verwijderd

---

### 2026-05-13 — Overzicht statusbar fix & onboarding uitbreiding (Claude Code)

#### Overzicht statusbar (`app/(app)/overzicht/OverzichtClient.tsx`)
- Poulетelling telt nu alleen wedstrijden waarbij zowel `toto` als `uitslag` zijn ingevuld (`toto !== null && uitslag !== null`); was `tokens !== null` waardoor gewiste wedstrijden nog steeds meegeteld werden

#### Onboarding slides (`components/onboarding/OnboardingSlides.tsx`)
- Nieuwe slide **Tokens** ingevoegd na Welkom: uitleg over tokenbudget, visuele header-demo (naam | tokens over | ?-knop), subtekst over zichtbaarheid in header
- Slides Fantasy en Oranje omgewisseld (Fantasy nu vóór Oranje)
- **DemoMatchCard**: "Groepsfase · Poulefase" vervangen door "15 jun · Rose Bowl"
- **Tokens-slide**: pijl + label "Jouw resterend budget" verwijderd uit header-demo
- **Wedstrijden-slide**: uitlegblok over Unibet-quoteringen en deadline 9 juni toegevoegd na de visual; puntentelling uitgesplitst in twee regels (toto / uitslag) met totaalformule en vraag "of ga je all-in?"
- **Knockout-slide**: introductietekst bijgewerkt (poulewinnaars → R16 → winnaar); uitlegblok over quoteringen + deadline toegevoegd; puntentelling voorzien van titel "Puntentelling voorspelde landen" en twee scenario's (juiste plek vs. troostquote) zonder dikgedrukte labels
- **Fantasy-slide**: selectiecriteria-blok toegevoegd (max 1 per land/club, max 3 per conf/competitie, min 4 U22); speler-demo Xavi Simons toegevoegd als PlayerRow + uitklapkaart (Overall, Positie, Club, etc.); criteria-blok toont drie factoren met concrete waarden plus formule `(100 / overall)² × teamQuote × (1 + r16 / 6.5)`; labels "(overall)" en "(teamQuote)" toegevoegd achter criteria

---

### 2026-05-13 — ScorePicker per wedstrijd, wis-knop, achtergrond-fix & quoteringen (Claude Code)

#### ScorePicker dynamisch per wedstrijd (`components/matches/ScorePicker.tsx`)
- Hardcoded score-lijsten (`HOME_WIN_SCORES`, `DRAW_SCORES`, `AWAY_WIN_SCORES`) vervangen door dynamische groupering op basis van `MATCH_ODDS[matchId].scores`
- Scores worden automatisch ingedeeld op thuis/gelijk/uit op basis van scorewaarden en gesorteerd op totaal doelpunten
- Elke wedstrijd toont nu exact de uitslagen die Unibet aanbiedt

#### Wis-knop op MatchCard (`components/matches/MatchCard.tsx`)
- Wis-knop toegevoegd rechtsboven in de header, gespiegeld t.o.v. het wedstrijdnummer-badge
- Knop alleen zichtbaar als toto of uitslag is ingevuld
- Bij klikken: toto, uitslag én tokens worden gereset (tokens naar 1)

#### Score-quote trend-indicator (`components/matches/MatchCard.tsx`, `lib/data/odds_trends.ts`, `scripts/scrape-odds.mjs`)
- `MatchTrends` interface uitgebreid met optioneel `scores?: Record<string, OddsTrend>` veld
- Scraper berekent nu ook trend per scorelijn t.o.v. vorige run (`parsePrevOdds` parseert ook scores-map)
- `TrendIndicator` toegevoegd op de score-quote container in MatchCard (naast de toto-quote trend die er al was)

#### Odds scraper run (`lib/data/odds.ts`, `lib/data/odds_trends.ts`)
- 49 wedstrijden bijgewerkt; 15 met gewijzigde quoteringen
- Match 69 (Colombia vs Portugal): geen scoremarkt op Kambi
- Wedstrijden 38, 49–68, 70–72 nog niet beschikbaar op Unibet

#### KO-tabbladen altijd korte tekst (`app/(app)/knockout/KnockoutClient.tsx`)
- Lange labels (`Ronde van 32`, `Kwartfinales`, etc.) en responsive `sm:hidden`/`sm:inline` spans verwijderd
- Tabbladen tonen nu altijd de korte variant: R 32, R 16, 1/4, 1/2, Fin, Win

#### Paginatitel Wedstrijden (`app/(app)/poulefase/PoulefaseClient.tsx`)
- `text-[min(1.875rem,7vw)]` vervangen door `text-3xl` — consistent met alle andere pagina's; arbitrary value liet line-height afwijken

#### Achtergrond fixed-positie fix (`app/globals.css`)
- `background-attachment: fixed` verwijderd van `body` (veroorzaakte schaalbugs op sommige mobiele browsers)
- Vervangen door `body::before` pseudo-element met `position: fixed; inset: 0; z-index: -1` — zelfde visueel effect, consistent cross-browser
- `@media (min-width: 768px)` media query mee verplaatst naar `body::before`

#### Fantasy speler-quotering (`lib/helpers.ts`)
- `computePlayerQuote`: factor `verwacht` gebruikt nu `KO_QUOTES[country].r16` i.p.v. `derde`
- `getPlayerTrend`: trend-indicator volgt nu ook `KO_TRENDS[country].r16` i.p.v. `derde`

---

### 2026-05-13 — Onboarding intro-slides & UI tweaks (Claude Code)

#### Footer hoogte (`components/layout/BottomNav.tsx`)
- Nav-links padding verhoogd van `py-2.5` naar `py-4` voor hogere footer

#### TO-DO tab leesbaarheid (`app/(app)/poulefase/PoulefaseClient.tsx`)
- 'Alles ingevuld ✓' tekst helderder gemaakt: `text-[#555]` → `text-[#aaa]`

#### Onboarding intro-slides — nieuw (`components/onboarding/`)
- Nieuw: `OnboardingSlides.tsx` — 6-staps overlay met uitleg hoe de app werkt
  - Slide 1: Welkom (logo + titel)
  - Slide 2: Wedstrijden — demo-MatchCard (NED vs ARG), uitleg Tokens/Toto/Uitslag + puntentelling
  - Slide 3: Knockout — demo KO-tegels (4 landen), uitleg Ronde 32 consolatieregels + quotelogica
  - Slide 4: Oranje — deadline-flow (3 vragen → 45 invullen), 0,5 token per goed antwoord
  - Slide 5: Fantasy — selectiecriteria, (goals + assists) × speler-quote, quoteopbouw
  - Slide 6: Puntentelling — Wedstrijden + Knockout + Fantasy; Oranje geeft tokens
  - Navigatie: terug/volgende knoppen + stip-indicator; sluit met "Let's go!"
  - Styling conform FifaInfoDrawer: `z-[60]`, dark backdrop, slideUp animatie
- Nieuw: `OnboardingController.tsx` — client component; checkt `localStorage.onboarding_seen`, toont slides na 1s vertraging bij eerste bezoek

#### AppHeader (`components/layout/AppHeader.tsx`)
- `?`-icoon knop toegevoegd naast naam/tokens; opent onboarding-slides altijd opnieuw

#### Zustand store (`store/gameStore.ts`)
- `onboardingOpen: boolean` en `setOnboardingOpen` actie toegevoegd

#### App layout (`app/(app)/layout.tsx`)
- `<OnboardingController />` gemount naast SaveIndicator/PopupToast

---

### 2026-05-13 — Wedstrijden pagina redesign & MatchCard UX (Claude Code)

#### Footer (`components/layout/BottomNav.tsx`)
- Label 'Poule' hernoemd naar 'Wedstrijden'
- Alle tekstlabels verwijderd uit de footer — alleen icoontjes zichtbaar

#### Footer icoontjes (`components/icons/NavIcons.tsx`)
- IconPoule vervangen door nieuw SVG (schoen/voetbal, `icon-poule.svg`)
- IconKO vervangen door nieuw SVG (wereldbol, `icon-ko.svg`)
- IconFantasy vervangen door nieuw SVG (mensen/sterren, `icon-fantasy.svg`)

#### Wedstrijden pagina (`app/(app)/poulefase/PoulefaseClient.tsx`)
- Paginatitel gewijzigd van 'Poulewedstrijden' naar 'Wedstrijden'
- '72 wedstrijden ·' verwijderd uit ondertitel
- Toggle-infrastructuur gebouwd voor Poulefase/Knockout fase (knop nog verborgen tot na start toernooi)
- KO-fase tabs: R 32 · R 16 · 1/4 · 1/2 · FIN — KO-wedstrijden (phase: 'knockout') worden weergegeven via MatchCard
- Tab 'Alle' verwijderd; starttab is nu Ronde 1
- Tab 'TO-DO' toegevoegd na Ronde 3: toont wedstrijden waar toto of uitslag nog ontbreekt; bij volledig ingevuld verschijnt 'Alles ingevuld ✓'

#### MatchCard (`components/matches/MatchCard.tsx`)
- Oranje randje rondom kaart zodra toto én uitslag beide zijn ingevuld
- Token container altijd oranje met wit getal (standaard 1 token); geen dropdown meer
- Quoteringen (home/draw/away) zichtbaar onder de 1 · X · 2 toto-buttons
- Stepper (− / +) in de onderste balk, gecentreerd onder de token container (zelfde breedte 40px)
- Steppers en max. score staan in dezelfde rij — kaarthoogte blijft compact

#### TotoButtons (`components/matches/TotoButtons.tsx`)
- Optionele `odds` prop toegevoegd; quoteringen verschijnen onder elk toto-label
- Afmetingen gestandaardiseerd naar 36×36 px (w-9 h-9), gelijk aan quote- en uitslag-containers
- Token container: 40×36 px (w-10 h-9)

### 2026-05-12 — Max. score zichtbaar in KO-containers (Claude Code)

#### KO pagina — max score per container (`components/knockout/RoundSection.tsx`, `Ronde32Section.tsx`)
- Rechtsonder in elke KO-container wordt nu — zodra er minstens één slot gevuld is — de potentiële max. score getoond, identiek aan de stijl op de MatchCard: `Max. score X.X pts` in grijs met de score in oranje
- Formule per slot: `tok × getQuote(country, qkey)`; de container toont de som van alle gevulde slots
- Toegevoegd aan: **Poulewinnaars** (W1), **Nummers 2** (W2), **Beste nummers 3** (W3) in `Ronde32Section`; **R16, Kwartfinales, Halve finales, Finalisten, WK Winnaar** in `RoundSection`
- Max score verschijnt als `maxScore > 0` (één geldig slot volstaat); verdwijnt automatisch bij leegmaken

---

### 2026-05-12 — KO-wedstrijdpredictions infrastructuur voorbereid (Claude Code)

#### Match interface uitgebreid (`lib/data/matches.ts`)
- Nieuw type `KoRound = 'rv32' | 'rv16' | 'kf' | 'hf' | 'brons' | 'finale'`
- `Match` interface uitgebreid met optionele velden: `phase?: 'group' | 'knockout'`, `koRound?: KoRound`, `active?: boolean`

#### 32 KO-wedstrijden toegevoegd als placeholder (`lib/data/matches.ts`)
- Wedstrijden #73–#104 toegevoegd aan `MATCHES`-array met `phase: 'knockout'` en `active: false`
- Structuur: #73–88 `rv32` (Ronde van 32, 16 wedstrijden), #89–96 `rv16` (Ronde van 16, 8 wedstrijden), #97–100 `kf` (Kwartfinales, 4 wedstrijden), #101–102 `hf` (Halve finales, 2 wedstrijden), #103 `brons` (3e/4e plaatsmatch), #104 `finale`
- `home` en `away` staan op `'TBD'`; worden ingevuld + `active: true` gezet bij redeploy zodra bracket bekend is
- Datum-placeholders op basis van verwacht WK 2026-schema (1–4 jul, 5–6 jul, 9–10 jul, 13–14 jul, 18 jul, 19 jul)
- KV-structuur hoeft niet gewijzigd: `predictions:{initials}` werkt al met willekeurige match-IDs

#### PoulefaseClient gefilterd op group-fase (`app/(app)/poulefase/PoulefaseClient.tsx`)
- `groupMatches()` slaat matches met `phase === 'knockout'` over zodat KO-wedstrijden niet in de poulewedstrijden-weergave verschijnen

#### Standings gefilterd op group-fase (`lib/standings.ts`)
- Beide loops in `computeStandings()` skippen nu `phase === 'knockout'`-matches zodat er geen "KO"-groep in de poulestanden aangemaakt wordt

#### Nog te doen (later)
- UI bouwen voor KO-wedstrijdpredictions (zelfde MatchCard-component, gefilterd op `phase === 'knockout'`, per `koRound` gegroepeerd)
- Per-ronde deadline opslaan in KV (`deadline:{koRound}`) — admin stelt in
- `useDeadline` uitbreiden zodat het per `koRound` een aparte KV-deadline controleert

---

### 2026-05-12 — Fantasy bijhouding, KO scoring & UI fixes (Claude Code)

#### Fantasy XV — Admin statistieken tab (`app/admin/AdminClient.tsx`, `app/admin/page.tsx`, `app/actions/admin.ts`)
- Nieuwe admin-tab "Fantasy" met spelers zoekfunctie en stepper-invoer voor goals (⚽) en assists (🅰)
- Goals/assists worden direct opgeslagen in Redis (`fantasy_stats`) na elke `+`/`−` klik
- Overzicht van spelers met statistieken zichtbaar boven de zoekbalk
- ✕-knop per speler om statistieken te wissen

#### Fantasy XV — Scoringsfunctie (`lib/scoring.ts`)
- Nieuw type `FantasyStats = Record<string, { goals: number; assists: number }>`
- Nieuwe functie `scoreFantasy(squad, stats)`: `Σ (goals + assists) × computePlayerQuote(player)` per speler in squad (exclusief kladblok)
- `computeAndSaveScores()` laadt nu fantasy squads + stats en berekent fantasy-score per deelnemer
- Totaalformule bijgewerkt: `poulefase + knockout + fantasy` (Oranje is bonus-tokens, geen score)

#### KO scoring — R32 consolatieregels (`lib/scoring.ts`)
- **Nieuw**: land gaat door maar in andere R32-rol → altijd `tokens × quote_derde` als consolatie
  - W1 (poulewinnaar) correct → `tokens × quote_poulewinnaar`
  - W1 incorrect, maar land door als nr2/beste nr3 → `tokens × quote_derde`
  - W2 (nummer 2) correct → `tokens × quote_tweede`
  - W2 incorrect, maar land door als poulewinnaar/beste nr3 → `tokens × quote_derde`
  - W3 (beste nr3), ongeacht correctheid → `tokens × quote_derde` als land doorgaat
- **Bugfix**: `QKEY_MAP.derde` was incorrectly `'tweede'` → gecorrigeerd naar `'derde'`
- R16 t/m Winnaar: ongewijzigd (alleen punten bij correcte voorspelling)

#### Fantasy XV — Leesbaarheid PlayerRow (`components/fantasy/PlayerRow.tsx`)
- Spelernummer `#N`: `text-[#555]` → `text-[#888]`
- Ondertitel (land · club): `text-[#666]` → `text-[#888]`

#### KO tabblad — label fix (`lib/data/knockoutRounds.ts`)
- `'Ronde van 8'` → `'Ronde van 16'` (was incorrect gelabeld)

#### KO tabblad — spacing R32 (`components/knockout/Ronde32Section.tsx`, `SuggestionsPanel.tsx`)
- Suggesties-knop had te grote afstand tot container eronder vergeleken met Toernooischema-knop
- `mb-4` verwijderd van `SuggestionsPanel` sticky wrapper; `gap-6` → `gap-4` in `Ronde32Section`
- Beide knoppen nu consistent 16px afstand tot container eronder

---

### 2026-05-12 — KO & UI polish (Claude Code)

#### DeadlineBanner (`components/layout/DeadlineBanner.tsx`, `public/icons/icon_stopwatch.svg` — nieuw)
- Achtergrond vervangen door oranje onderbrand: `bg-[#FF6B00]` → `border-b border-[#FF6B00]` met oranje tekst op transparante achtergrond
- ⏰ emoji vervangen door custom SVG stopwatch-icoon (geüpload door user als `icon_stopwatch.svg`)
- SVG opgeslagen in `public/icons/icon_stopwatch.svg`; inline gerenderd als `<StopwatchIcon>` React-component met `fill="currentColor"` zodat het de oranje tekstkleur erft

#### KO tabblad — sticky suggesties-knop (`components/knockout/SuggestionsPanel.tsx`)
- `sticky top-20` → `sticky top-24` (16px extra ruimte onder header-opacity bij scrollen in R32)

#### Poulefase — titelcentrering mobiel (`app/(app)/poulefase/PoulefaseClient.tsx`)
- "Poulewedstrijden" was te breed voor smallere mobiele schermen (390px − 32px padding = 358px container) en overflowde rechts, waardoor het er niet-gecentreerd uitzag
- `text-3xl` → `text-[min(1.875rem,7vw)]`: schaalt mee met viewport, blijft 30px op 430px+, krimpt op smallere schermen

#### KO tabblad — rode verwijder-knoppen weg (`components/knockout/Ronde32Section.tsx`, `RoundSection.tsx`)
- "✕ Verwijder"-knop in uitklapbare picker-header verwijderd (3 locaties); er is al een ✕ op de tegel zelf
- `subtitle` prop volledig verwijderd uit `SlotSection` (was alleen nog in definitie aanwezig)

#### KO tabblad — subteksten weg (`components/knockout/Ronde32Section.tsx`)
- "12 groepswinnaars", "12 runners-up" en "8 beste derde-plaatsers" verwijderd uit sectie-headers

#### KO tabblad — lege tegel leesbaarheid (`components/knockout/Ronde32Section.tsx`, `RoundSection.tsx`)
- Lege tegel border: `border-[#2a2a2a]` → `border-[#444]`, hover: `hover:border-[#666]`
- Poule-letter/nummer kleur: `#333` → `#777`
- "Kies land" en "Groep X" header tekst: `text-[#555]` → `text-[#999]`

#### KO tabblad — quoteringen gecentreerd (`components/knockout/Ronde32Section.tsx`, `RoundSection.tsx`)
- `TrendIndicator` was `absolute top-0 right-0` in een `relative pr-2` span, waardoor `pr-2` de quotering uit het midden trok
- Opgelost: TrendIndicator nu inline; quote-span van `relative pr-2` → `inline-flex items-center gap-0.5`

#### Quoteringen groter — KO & Fantasy XV
- KO: quote op landenkaartjes `text-xs` (12px) → `text-sm` (14px) in `Ronde32Section.tsx` en `RoundSection.tsx`
- Fantasy XV: quote in `PlayerRow.tsx` en `ScratchpadRow.tsx` eveneens `text-xs` → `text-sm`

---

### 2026-05-11 — Kambi KO-quoteringen scraper & Fantasy XV trendpijltjes (Claude Code)

#### Nieuw: KO-outright scraper (`scripts/scrape-ko-odds.mjs` — nieuw)
- Scraper geschreven die WK 2026 KO-outright quoteringen ophaalt via Kambi REST API (Unibet NL), groep-ID `2010133908`
- **Winnaar/finale/r4/r8/r16**: 5× "Eindpositie" betOffers in event "WK 2026" — gesorteerd op gemiddelde odds (hoog→laag = moeilijkste→makkelijkste ronde)
- **Poulewinnaar**: "Eindpositie Groep" per groep A–L (12 aparte events)
- **Derde** (kwalificeert voor KO-fase): "Kwalificeert zich voor knockout-fase" (Ja-outcome) uit "{Land} Markten 2026" events
- **Tweede** (nummer 2 in groep): berekend via formule `1 / (p_qualify − p_win)`, waar `p = 1/odds`; geclamped op [1.01, 501]
- Schrijft `lib/data/knockoutQuotes.ts` (48 landen, alle 8 velden) en `lib/data/knockoutQuotes_trends.ts` (trendtracking t.o.v. vorige run)
- Naamcorrectie NAME_MAP: `Bosnië-Herzegovina → Bosnië en Herzegovina`, `Saudi-Arabië → Saoedi-Arabië`

#### `lib/data/knockoutQuotes.ts` — gegenereerd bestand (was: handmatig)
- Overschreven door scraper; interface uitgebreid naar `number | null` (i.p.v. altijd `number`)
- `tweede`-veld had altijd waarde `1` als placeholder; nu echte berekende waarden

#### `lib/scoring.ts`
- `quote`-lookup null-safe gemaakt: `quotes[field] ?? 1` i.p.v. directe vermenigvuldiging (TypeScript fix)

#### `package.json` — nieuwe npm-scripts
- `scrape-match-odds`: `node scripts/scrape-odds.mjs`
- `scrape-ko-odds`: `node scripts/scrape-ko-odds.mjs`
- `scrape`: beide scrapers na elkaar

#### KO-pagina — trendpijltjes (`components/knockout/Ronde32Section.tsx`, `RoundSection.tsx`)
- `KO_TRENDS` geïmporteerd; `getTrend(country, qkey)` helper toegevoegd
- `TrendIndicator` component: `▲` oranje (odds gestegen) / `▼` groen (odds gedaald)
- Pijltjes zichtbaar op geselecteerde landenkaartjes in W1/W2/W3 (R32) en R16 t/m Winnaar

#### Fantasy XV — `verwacht`-factor nu live uit Kambi (`lib/helpers.ts`)
- `computePlayerQuote` berekent `verwacht` niet meer uit hardgecodeerde `teamQuotes.ts` maar via: `1 + (KO_QUOTES[land].derde / 6.5)` — overeenkomstig de formule die de user eerder had opgesteld
- Fallback `1.5` als Kambi-data ontbreekt voor een land
- Nieuwe export `getPlayerTrend(country)`: geeft `KO_TRENDS[country].derde` terug

#### Fantasy XV — trendpijltjes (`components/fantasy/PlayerRow.tsx`, `ScratchpadRow.tsx`, `PlayerModal.tsx`)
- `TrendIndicator` en `getPlayerTrend` toegevoegd aan alle drie bestanden
- Pijltje zichtbaar naast spelersquotering in squad-rij, kladblok-rij en zoekmodal

---

### 2026-05-11 — UX verbeteringen overzicht, fantasy & KO (Claude Code)

#### Overzicht tabblad (`app/(app)/overzicht/OverzichtClient.tsx`)
- Bevestigingsknop altijd zichtbaar (was: verdween na eerste klik); na bevestigen toont tijdelijke toast "✓ Wijzigingen ontvangen!" die na 3 seconden automatisch verdwijnt
- Knop alleen klikbaar als alle vier secties volledig zijn ingevuld (poule 72/72, oranje 3 of 45, knockout 63/63, fantasy 15/15); anders `disabled` met hint-tekst
- Progress bars drie staten: grijs (leeg) / licht oranje `#FFC49A` (deels) / oranje `#FF6B00` (compleet) — geel verwijderd
- `color` prop van `StatRow` verwijderd; `oranjeTotal` variabele hergebruikt voor zowel StatRow als isComplete-check
- `confirmed`-state en `loadConfirmed()` verwijderd (niet meer nodig)

#### Fantasy XV — lettertype & grootte (`app/layout.tsx`, `tailwind.config.ts`, `components/fantasy/TeamNameEditor.tsx`, `app/(app)/fantasy/FantasyClient.tsx`)
- Caveat (Google Font) toegevoegd via `next/font/google` als CSS-variabele `--font-caveat`
- `font-script` in tailwind.config.ts wijst nu naar `var(--font-caveat)` i.p.v. Chalky
- Teamnaam en coach: handgeschreven stijl Chalky vervangen door Caveat
- Tekstgrootte teamnaam en coach: `text-2xl` (24px) → `text-[28px]`

#### Fantasy XV — kaart UX (`components/fantasy/PlayerInfoCard.tsx`, `PlayerRow.tsx`, `ScratchpadRow.tsx`)
- Label-kleur in info-kaartje (Overall, Positie(s), etc.): `#555` → `#888`
- "Naar kladblok"-knop: blauw → oranje (consistent met kleurschema)
- Directe ✕ verwijder-knop toegevoegd rechts van quotering in `PlayerRow` (subtiel grijs, hover naar `#999`)
- "Verwijder"-knop verwijderd uit `PlayerInfoCard`; `onRemove` prop verwijderd; "Naar kladblok" neemt volledige breedte
- Zelfde ✕ knop en verwijder-logica toegepast op `ScratchpadRow`; "Verwijder"-knop uit kladblok info-kaartje verwijderd; "Zet in team" neemt volledige breedte
- Kaart `<button>` omgebouwd naar `relative div` + inner button om nesting van buttons te vermijden

#### KO tabblad — directe verwijder-knop (`components/knockout/RoundSection.tsx`, `Ronde32Section.tsx`)
- Directe ✕ rechtsboven op geselecteerde landenkaartjes in `RoundSection` (R16 t/m finale)
- Zelfde ✕ toegevoegd aan alle drie secties in `Ronde32Section`: poulewinnaars, nummers 2, beste nummers 3
- Kaart `<button>` vervangen door `relative div` + inner button + absoluut gepositioneerde ✕ button

---

### 2026-05-11 — Navigatie SVG-iconen & UI leesbaarheid (Claude Code)

#### Navigatie — custom SVG-iconen (`components/icons/NavIcons.tsx` — nieuw, `components/layout/BottomNav.tsx`, `AppHeader.tsx`, `AppShell.tsx`)
- FIFA-info knop verplaatst van header naar footer (BottomNav); drawer-state mee verplaatst
- `NavIcons.tsx` aangemaakt met 6 inline SVG-componenten: `IconPoule`, `IconKO`, `IconOranje`, `IconFantasy`, `IconOverzicht`, `IconBeker` — allemaal met `currentColor` zodat oranje bij selectie automatisch werkt
- KO-icoon gebruikt `stroke="currentColor"`; overige `fill="currentColor"`
- Beker-icoon permanent oranje (`text-[#FF6B00]`), groter (`w-8 h-8`)
- `AppHeader.tsx`: `onInfoClick`-prop en ℹ-knop verwijderd; `AppShell.tsx`: drawer-state en `FifaInfoDrawer` verwijderd

#### Oranje tabblad — leesbaarheid (`components/oranje/VraagIndienenCard.tsx`, `VragenBeantwoordenCard.tsx`)
- Labels "Jouw vraag" / "Antwoordtype": `#555` → `#888`
- Placeholder: `#444` → `#666`
- Input/textarea borders: `#2a2a2a` → `#444`
- Disabled indien-knop: border toegevoegd, tekst `#444` → `#666`
- Antwoordtype-buttons (inactief): warm donkerbruin achtergrond `#231f1a` + oranje-getinte rand `#3d3020`
- Datum/stadion tekst: `10px` → `12px` (beide kaarten)
- Uitleg-tekst: body `#555` → `#888`, koptekst `#666` → `#aaa`

#### Fantasy tabblad — leesbaarheid (`app/(app)/fantasy/FantasyClient.tsx`)
- Uitleg puntentelling: body `#555` → `#888`, koptekst `#666` → `#aaa`

#### Overzicht tabblad (`app/(app)/overzicht/OverzichtClient.tsx`)
- Alle groene accenten (`#2ECC71`) vervangen door oranje (`#FF6B00`): vinkjes, progress bars, "Inzending bevestigd"-kaart
- Subtekst onder "Inzending bevestigd" verwijderd
- Deadline-tekst: `#444` → `#888`; `(9 jun 17:00)` verwijderd

---

### 2026-05-11 — Excel export verbeterd & Fantasy U22 auto-placement (Claude Code)

#### Export — opmaakbehoud (`app/api/export/route.ts`, `package.json`, `types/xlsx-populate.d.ts` — nieuw)
- SheetJS (`xlsx`) vervangen door **xlsx-populate**: template-gebaseerde aanpak waarbij alleen celwaarden worden geschreven en alle bestaande opmaak (kleuren, borders, conditional formatting, merges) volledig intact blijft
- ExcelJS geprobeerd maar verworpen: crashte op conditional formatting rules (`CfRuleXform.renderExpression`)
- `types/xlsx-populate.d.ts` aangemaakt voor TypeScript type declarations (geen `@types/xlsx-populate` beschikbaar)

#### Export — toto-labels (`app/api/export/route.ts`)
- Toto-waarden `'1'`/`'2'`/`'X'` vervangen door leesbare teamnamen: `'1'` → thuisteam, `'2'` → uitteam, `'X'` → `'-'`
- `MATCHES` geïmporteerd uit `lib/data/matches.ts`; `MATCH_BY_ID` lookup toegevoegd

#### Export — fantasy spelersnamen (`app/api/export/route.ts`, `lib/data/players.ts`, `scripts/build_players.ps1`)
- `build_players.ps1` uitgebreid: leest nu kolom C (`middle_name`) uit het sofifa-bronbestand als `middleName`
- `Player` interface uitgebreid met `middleName: string`; `players.ts` geregenereerd (5671 spelers)
- Export gebruikt nu `player.middleName` (bijv. "Thibaut Courtois") i.p.v. `player.name` ("T. Courtois")

#### Export — beste nummers 3 quoteringen (`app/api/export/route.ts`)
- Bug opgelost: `QKEY_TO_QUOTE_FIELD` voor `derde` verwees naar `'tweede'` (altijd 1.0); gecorrigeerd naar `'derde'`

#### Fantasy — U22 auto-placement (`components/fantasy/PlayerModal.tsx`)
- `select()` uitgebreid: U22-speler (dob ≥ 2004-06-11) gekozen voor een regular slot (`p*`) wordt automatisch geplaatst in het eerste lege talent slot (`t0`–`t3`)
- Fallback: als alle talent slots vol zijn, gaat de speler naar het aangevraagde regular slot
- Directe keuze voor talent slot of kladblok: onveranderd gedrag

---

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

---

### 2026-05-09 — Redis → Excel export (Claude Code)

#### Exceljs geïnstalleerd (`package.json`)
- `exceljs` toegevoegd als dependency voor het lezen en schrijven van `.xlsx`-bestanden inclusief opmaak

#### Export API-route (`app/api/export/route.ts` — nieuw)
- Beveiligd eindpunt (`GET /api/export`): controleert `admin`-cookie, retourneert 401 als niet ingelogd
- Zoekt automatisch het meest recente bestand dat voldoet aan `*_WK 2026_Master.xlsx` in de projectroot — de datum in de bestandsnaam maakt niet uit
- Laadt alle deelnemersdata parallel uit Redis (`predictions`, `knockout`, `fantasy`, `oranje_antwoorden`)
- **Poule-tabblad per deelnemer** (`Poule_MG`, `Poule_BH`, …, `Poule_LV`):
  - K1: naam deelnemer
  - Wedstrijden 1–72: B = tokens, Q = toto, R = quote toto, S = uitslag, T = quote uitslag (quotes opgehaald uit `MATCH_ODDS`)
  - Rijen: matches 1–24 → rijen 10–33; 25–48 → 35–58; 49–72 → 60–83
  - KO-picks per ronde: tokens (W/AE/AK/AQ/AW/BC), landen (Z/AG/AM/AS/AY/BE), quotes (AA/AH/AN/AT/AZ/BF) — quotes via `KO_QUOTES[country][quoteField]`
- **Fantasy-tabblad per deelnemer** (`FT_MG`, `FT_BH`, …, `FT_LV`):
  - D13:D23 → 11 basisspelers (`player.name`)
  - D24:D27 → 4 talenten (`player.name`)
- **Gedeeld `Oranje_Voorspelling`-tabblad** (één voor alle deelnemers):
  - Deelnemersinitials als kolomkoppen in rij 6/25/44 (kolommen E–S)
  - Vraagteksten per wedstrijd in kolom D, auteur-initialen in kolom C
  - Antwoorden per deelnemer per vraag in kolommen E–S
  - 3 wedstrijden: matchId 10 (rijen 7–21), matchId 33 (26–40), matchId 58 (45–59)
- Retourneert bestand als `export_{bestandsnaam}.xlsx` zonder het origineel te overschrijven

#### Admin UI (`app/admin/AdminClient.tsx`)
- Knop "📥 Download Excel" toegevoegd naast "Bereken scores" in de admin-header
- Klikt → `fetch('/api/export')` → blob → automatische browserdownload met de juiste bestandsnaam

#### Vercel-fixes (`next.config.ts`, `260509_WK 2026_Master.xlsx`)
- Vercel bundelt grote binaire bestanden niet automatisch mee in serverless functions (`process.cwd()` = `/var/task`, geen xlsx gevonden)
- `260509_WK 2026_Master.xlsx` toegevoegd aan git-repo zodat Vercel het kan deployen
- `outputFileTracingIncludes` toegevoegd aan `next.config.ts`: vertelt Next.js om `*_WK 2026_Master.xlsx` expliciet mee te bundelen in de `/api/export` function
- Foutmelding uitgebreid met debug-info (`cwd` + gevonden xlsx-bestanden) voor diagnose
- **Status:** fix gepusht en werking op Vercel bevestigd (2026-05-12)

### 2026-05-11 — Echte Unibet-quoteringen & trendpijltjes (Claude Code)

#### Kambi odds scraper (`scripts/scrape-odds.mjs` — nieuw)
- Scraper geschreven die WK 2026-quoteringen ophaalt via de Kambi REST API (backend van Unibet NL)
- Endpoint: `eu-offering-api.kambicdn.com/offering/v2018/ubnl/listView/football/world_cup_2026.json`
- Haalt per event de **1X2-quotes** op (criterion "Reguliere Speeltijd") en de **correcte score-quotes** (criterion "Correcte Score") via een afzonderlijke betoffer-call per wedstrijd
- Naam-normalisatie: `VS` → `Verenigde Staten`, `Haiti` → `Haïti`, `Bosnië-Herzegovina` → `Bosnië en Herzegovina`
- Odds in Kambi-formaat (integer ×1000) worden omgezet naar decimaal (bijv. 1520 → 1.52)
- Score-sleutels `"2-0"` → `"2 - 0"` (spaties toegevoegd); `"Overige"`-uitkomsten overgeslagen
- **Trendvergelijking:** leest huidige `odds.ts` vóór overschrijven, berekent per wedstrijd of home/draw/away gestegen (`'up'`), gedaald (`'down'`) of gelijk is (`'same'`), drempel 0,01 om float-ruis te filteren
- Uitvoer: 250ms vertraging per API-call; samenvatting toont aantal bijgewerkte wedstrijden, gewijzigde quotes en ontbrekende events
- Gebruik: `node scripts/scrape-odds.mjs`; herbruikbaar voor dagelijkse updates — vorige run dient automatisch als trendbaseline

#### `lib/data/odds.ts` — echte quoteringen
- 49 wedstrijden bijgewerkt met echte Unibet-quoteringen (was random Excel-data): matches 1–37, 39–48 (ronde 1+2) + matches 51 en 69 (ronde 3, al beschikbaar)
- Match 38 (België vs Iran) en matches 49–72 minus 51 en 69: **niet opgenomen** — app toont automatisch `—` via bestaande optional-chaining logica in `MatchCard` / `ScorePicker` / `scoring.ts`
- Aantal correct score-combinaties per wedstrijd: 27–34 (afhankelijk van wat Kambi aanbiedt)

#### `lib/data/odds_trends.ts` — nieuw, gegenereerd door scraper
- Exporteert `OddsTrend = 'up' | 'down' | 'same' | null`, interface `MatchTrends { home, draw, away }`, `ODDS_UPDATED_AT` (ISO-timestamp) en `ODDS_TRENDS: Record<number, MatchTrends>`
- Eerste run: alle trends `'same'` (geen vorige baseline); pijltjes worden zichtbaar na de tweede scraper-run

#### `components/matches/MatchCard.tsx` — trendpijltjes
- `TrendIndicator`-component toegevoegd: toont `▲` (oranje `#FF6B00`) of `▼` (groen `emerald-400`) als tiny superscript (`text-[7px]`) in de rechterbovenhoek van de toto-quote-badge
- Pijltje volgt de geselecteerde toto-optie: `'1'` → home-trend, `'X'` → draw-trend, `'2'` → away-trend
- Geen indicator bij `'same'` of `null`; quote-badge `relative` gemaakt voor absolute positionering

---

### 2026-05-11 — Export debugged & werkend op Vercel (Claude Code)

Doel: de Excel-exportknop werkend krijgen op Vercel. Er waren drie onafhankelijke bugs.

#### Bug 1: `'use client'`-module in server route (`app/api/export/route.ts`)
- `REGULAR_SLOTS` en `TALENT_SLOTS` werden geïmporteerd uit `store/gameStore.ts`, dat `'use client'` bovenaan heeft
- In een server route (App Router) levert dit onbetrouwbare exports op — de waarden kwamen als `undefined` aan, waardoor `REGULAR_SLOTS.forEach is not a function` crashte
- **Fix:** constanten direct gedefinieerd in `route.ts` (niet geïmporteerd uit een client-module)

#### Bug 2: ExcelJS crasht op `writeBuffer()` (`app/api/export/route.ts`)
- ExcelJS 4.4.0 bevat een bug in `CfRuleXform.renderExpression()`: bij Excel-bestanden met conditionele opmaak die formule-expressies gebruiken, probeert het `model.formulae[0]` te lezen terwijl `formulae` `undefined` is
- Dit leidde tot `TypeError: Cannot read properties of undefined (reading '0')` bij élke write, ook zonder datawijzigingen
- **Fix:** volledig overgestapt op **SheetJS** (`xlsx`-pakket) dat het bestand round-trippen zonder de conditionele opmaak aan te raken. SheetJS leest alle XML-onderdelen as-is en wijzigt alleen de cellen die expliciet worden gezet
- `exceljs` verwijderd uit dependencies; `xlsx@0.18.5` toegevoegd
- Hulpfunctie `cv(ws, addr, val)` schrijft een celwaarde via SheetJS API

#### Bug 3: TypeScript build-fout blokkeert alle Vercel-deploys (`app/api/export/route.ts`)
- `XLSX.write()` retourneert `Buffer<ArrayBufferLike>`; TypeScript accepteert dit niet als `BodyInit` voor `new NextResponse()`
- Dit veroorzaakte een build-fout (`Failed to compile`) waardoor Vercel stilletjes de oude versie bleef serveren — de foutmelding in de browser bleef leeg omdat het nieuwe JS nooit werd gedeployd
- **Fix:** `raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer` — `.slice()` garandeert een echte `ArrayBuffer` zonder `SharedArrayBuffer`-ambiguïteit

#### Overige verbeteringen
- `handleExport` in `AdminClient.tsx`: foutmelding toont nu het HTTP-statusnummer (`HTTP 404`, `HTTP 500`, etc.) voor makkelijkere diagnose
- `next.config.ts` `outputFileTracingIncludes`: naast de glob ook expliciete bestandsnamen om spaties in bestandsnamen betrouwbaar te bundelen

---

### 2026-05-12 — ✕-knoopjes zichtbaarder & FIFA-infopanel gevuld (Claude Code)

#### ✕-knoopjes wissen selectie (`components/fantasy/PlayerRow.tsx`, `ScratchpadRow.tsx`, `components/knockout/RoundSection.tsx`, `Ronde32Section.tsx`)
- Basiskleur van wis-knoopjes gewijzigd van `text-[#444]` naar `text-[#777]` — beter zichtbaar op donkere achtergrond
- Hover gewijzigd van `text-[#999]` naar `text-white` voor duidelijker visuele feedback
- Van toepassing op alle vijf locaties: Fantasy player rows, scratchpad rows, KO round slots (RoundSection + Ronde32Section W3/W1-W2)

#### `components/layout/FifaInfoDrawer.tsx` — inhoud & layout volledig ingevuld
- **Header:** titel gewijzigd naar "FIFA & de USA, a match made in hell"; layout gecentreerd (`justify-center`) met × knop `absolute right-5`
- **Intro:** placeholder vervangen door definitieve tekst over de context van het WK
- **Sectie "Amnesty International | Enkele feiten":** 8 citaten uit Amnesty International-rapport toegevoegd als string-array; elk citaat renderen als aparte `<p>`; bronvermelding "Amnesty International" onderaan
- **Sectie "Waarom toch meedoen?":** verwijderd
- **Sectie "Links":** titel gewijzigd; twee klikbare links toegevoegd via nieuw `links`-veld (`{ text, url }[]`): Amnesty International-rapport en Sports & Rights Alliance
- **Rendering:** `text-center` op scroll-container; links als oranje `<a>` met `target="_blank"`; `source`- en `links`-velden optioneel per sectie
- **TypeScript-fix:** sectie-type uitgebreid naar `{ title, body, source?, links? }`; string-delimiter probleem (curly quotes) opgelost via PowerShell-write met ASCII single quotes
- `maxDuration = 60` weer verwijderd (overschrijdt Hobby-plan limiet van 10s en veroorzaakte build-failures)

---

### 2026-05-14 — Fantasy regels, header layout, nav-volgorde & onboarding herschreven (Claude Code)

#### Fantasy — Min 4 spelers U22 (`lib/validation.ts`, `components/fantasy/RulesPanel.tsx`)
- Nieuwe validatieregel: `u22Count` = aantal spelers met `age <= 22` in de volledige squad (ALL_SLOTS)
- Violation toegevoegd: `Min 4 U22: slechts ${u22Count} speler(s) ≤22 jaar` wanneer `u22Count < 4`
- `ValidationResult` uitgebreid met `u22Count: number`
- RulesPanel toont nieuwe regel "Min 4 spelers U22" met ✓/✗ en detail `(X / 4)` bij rood

#### Header layout (`components/layout/AppHeader.tsx`)
- Naam en tokens gecentreerd in de header via `justify-center` op een `relative` container
- '?'-knop absoluut gepositioneerd (`absolute right-4`) zodat naam/tokens niet verschuiven
- `px-8` op de container voorkomt overlap van gecentreerde tekst met de knop

#### Bottom nav volgorde (`components/layout/BottomNav.tsx`)
- Volgorde gewijzigd: Wedstrijden → KO → **Fantasy → Oranje** → Overzicht (was: …KO → Oranje → Fantasy…)

#### PWA manifest (`public/manifest.json`)
- `"name"` gewijzigd van `"Panenka WK 2026"` naar `"Panenka"` — verwijdert "WK 2026" van het PWA-opstartscherm

#### Onboarding slides — volledig herschreven (`components/onboarding/OnboardingSlides.tsx`)

**Slide 0 (Welkom):** "Deze korte uitleg..." begint op een nieuwe regel (`<br />`)

**Slide 1 (Tokens):** Header-demo bijgewerkt naar nieuwe layout (naam+tokens gecentreerd, '?' rechts); tekst uitgebreid met zin over deadline en minimale inzet

**Slide 2 (Wedstrijden):** Volledige herstructurering — nieuwe intro met deadline 9 juni | 17:00, bullet points met `|`-separator en bijgewerkte omschrijvingen, nieuwe tekst na visual, puntentelling-formule oranje (was wit)

**Slide 3 (Knockout):** "—" na "9 juni" vervangen door `|`; puntentelling herschreven met regeleinden vóór `→`, bijv.-toelichting op eigen regel; "kwalificeert zich voor knockoutfase" → "land behaald de ronde van 16"

**Slide 4 (Fantasy XV):** Titel gewijzigd naar "Fantasy XV"; nieuwe intro-tekst; volgorde herordend (selectiecriteria → visual → hoe verdien je punten → hoe wordt quote bepaald); visual bijgewerkt naar **Donyell Malen** (overall 79, Roma, Serie A, leeftijd 27, quote 2.47); "Hoe verdien je punten" uitgebreid met opmerking over keepers; "Hoe wordt de speler-quote bepaald?" herschreven met 3 genummerde factoren + resulterende waarden (1.60 / 1.22 / 1.27 → 2.47)

**Slide 5 (Oranje):** Volledig herschreven — titel "Oranje voorspellingen", nieuwe intro, Stap 1 met twee voorbeeldvragen, Stap 2 bijgewerkt, puntentelling-blok met uitleg over tokens en `Correct antwoord → 0.5 token`

**Slide 6 (Puntentelling):** Intro-tekst bijgewerkt; labels en omschrijvingen van de drie onderdelen herschreven ("Fantasy XV" i.p.v. "Fantasy"); tekst onderaan verwijderd

**Slide 7 (Inleg en winnen) — nieuw:** Uitleg over de 20 euro inleg, halvering van de pot en uitbetalingstabel (7 categorieën met percentages); percentages `text-sm` voor betere leesbaarheid
