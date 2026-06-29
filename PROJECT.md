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
| Bob | BH | 335 | +5 | 340 [|
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

### 2026-06-29e — KO deadline override wedstrijd 76 voor RA (Claude Code)

**Robert (RA) mag alsnog wedstrijd 76 invullen ondanks verstreken deadline**
- **`hooks/useKoMatchDeadline.ts`**: `DEADLINE_OVERRIDES` map opnieuw toegevoegd met wedstrijd 76 → `['RA']`. `useKoMatchLocks` slaat de lock over als de deelnemer in de override-lijst staat.

---

### 2026-06-29d — Admin matchday TBD fix + stand KO Wed subtab (Claude Code)

**KO-wedstrijden correct tonen in admin matchday-tab + nieuw subtabblad op stand-pagina**
- **`app/admin/AdminClient.tsx`**: `MatchdayAdminTab` ontvangt nu `koMatchTeams` als prop. Wedstrijdnamen in custom bets en quoteringen-tabel resolven eerst uit `koMatchTeams` (Redis), fallback naar statische `MATCHES` data. Voorheen toonden KO-wedstrijden altijd "TBD".
- **`app/(app)/stand/StandClient.tsx`**: subtabblad "KO Wed" toegevoegd aan de stand-pagina (tussen FXV en Landen). Toont `koWedstrijden` score (punten uit KO-wedstrijden #73-104) met `kofase` history voor de grafiek. Score was al berekend maar niet zichtbaar.

---

### 2026-06-29c — Oranje vragen: antwoordtype "aantal met marge ±100.000" (Claude Code)

**Nieuw antwoordtype voor grote getallen (bijv. stadionbezoekers, TV-kijkers)**
- **`lib/types/oranjeVragen.ts`**: `aantal_marge_groot` toegevoegd aan `AntwoordType`, label "Aantal met marge ±100.000", scoring marge ±100.000 in `isAntwoordCorrect`.
- **`components/oranje/VraagIndienenCard.tsx`**: type toegevoegd aan keuze-buttons.
- **`components/oranje/VragenBeantwoordenCard.tsx`**: invoer-UI met −100k/+100k knoppen, vrij numeriek veld. Display formatteert met `toLocaleString('nl-NL')`.
- **`app/admin/AdminClient.tsx`**: type toegevoegd aan admin override dropdown en correct-antwoord invoer.

---

### 2026-06-29b — KO deadline override verwijderd + quoteringen bijgewerkt (Claude Code)

**Tijdelijke deadline-lift voor wedstrijd 73 verwijderd, KO-quoteringen ververst**
- **`hooks/useKoMatchDeadline.ts`**: `DEADLINE_OVERRIDES` map en bijbehorende participant-check verwijderd. RA, TdL en RH vallen weer onder de standaard deadline (2 uur voor aftrap).
- **`lib/data/koMatchOdds.ts`**: quoteringen bijgewerkt voor wedstrijden #74–#88 via `scrape-ko-match-odds.mjs`. Wedstrijd #73 (al gespeeld) ongewijzigd behouden. Kickoff-tijden gesynct naar KV.

---

### 2026-06-29a — Oranje vragen 4e wedstrijd NED-MAR (Claude Code)

**Oranje pagina uitgebreid met 4e wedstrijd: Nederland – Marokko (#75)**
- **`lib/data/matches.ts`**: match 75 bijgewerkt met `home: 'Nederland', away: 'Marokko'`, datum 30 jun 03:00, `active: true`.
- **`hooks/useDeadline.ts`**: nieuwe exports `KO_ORANJE_VRAAG_DEADLINE` (29 jun 19:00 CEST) en `KO_ORANJE_ANTWOORD_DEADLINE` (30 jun 01:00 CEST). `now` toegevoegd aan return value.
- **`app/(app)/oranje/OranjeClient.tsx`**: NED_MATCH_IDS uitgebreid met 75. Default tab is NED-MAR zolang relevant. Per-match deadline logica: vóór 19:00 toont VraagIndienenCard + eventueel VragenBeantwoordenCard als admin al vragen heeft vrijgegeven. Na 19:00 alleen beantwoorden. Na 01:00 readOnly. Summary bar toont "ingevuld" zolang KO-match open is.
- **`lib/scoring.ts`**: NED_MATCH_IDS uitgebreid met 75 — oranje tokens tellen mee in scoring.
- **`app/(app)/overzicht/OverzichtClient.tsx`**: NED_MATCH_IDS uitgebreid met 75.
- **`app/admin/AdminClient.tsx`**: NED-MAR toegevoegd aan admin oranje vragen panel.

---

### 2026-06-28i — Admin ESPN import KO-aware + score picker fix (Claude Code)

**Admin ESPN-import toont nu reguliere-tijd score voor KO-wedstrijden**
- **`app/api/admin/espn-import/route.ts`**: volledig herschreven voor KO-wedstrijden. Toto/uitslag gebaseerd op reguliere stand (90'+blessuretijd). Goals/assists inclusief verlenging, exclusief strafschoppenserie. Nieuw: `totalUitslag` (na verlenging) en `penaltyWinner` ('home'/'away') in response.
- **`app/admin/AdminClient.tsx`**: ESPN preview toont "n.v. X-Y" bij verlenging en "P → thuis/uit" bij penalties. `hasOdds` check gebruikt nu ook `KO_MATCH_ODDS` voor score picker bij KO-wedstrijden.

---

### 2026-06-28h — KO verlenging/penalties scoring regels (Claude Code)

**Live match slides: toto/uitslag op reguliere stand, fantasy inclusief verlenging**
- **`lib/types/matchday.ts`**: `LiveGoalEvent` heeft nu een `phase` veld: `'regular' | 'extratime' | 'shootout'`.
- **`app/api/matchday/live/route.ts`**: `getGoalPhase()` helper bepaalt per doelpunt de fase op basis van clock display (base ≤90 = regular, >90 zonder + = extratime, >120 + penalty = shootout). `extractGoals()` retourneert nu ook `reguliereScore`. `totoNow`/`uitslagNow` gebruiken de reguliere stand. `isReguliereTijdVoorbij()` detecteert extra time/shootout status. `computeUitslagState` behandelt reguliere stand als definitief zodra verlenging begint. Fantasy goals/assists tellen reguliere + verlenging, geen shootout.
- **`app/api/match/[id]/goals/route.ts`**: `phase` veld toegevoegd aan goal events.
- **`app/matchday-preview/page.tsx`**: mock data bijgewerkt met `phase` veld.

---

### 2026-06-28g — KO matchday slides voorspellingen verbergen + live match slide fixes (Claude Code)

**Matchday slides: voorspellingen pas zichtbaar vanaf 2u voor aftrap**
- **`lib/types/matchday.ts`**: `MatchSlideData` heeft nu `locked?: boolean`. `LiveMatchData` heeft nu `homeTeamName`/`awayTeamName`.
- **`app/api/matchday/[id]/full/route.ts`**: voor KO-wedstrijden wordt de kickoff-tijd uit `ko_match_teams` KV vergeleken met `now - 2u`. Locked wedstrijden krijgen geblankeerde voorspellingen.
- **`components/matchday/slides/MatchSlide.tsx`**: locked wedstrijden tonen "Voorspellingen verborgen tot 2u voor aftrap" header met 🔒 icoon per deelnemer.

**Live match slide werkt nu voor KO-wedstrijden**
- **`lib/data/espnMatchIds.ts`**: ESPN event IDs toegevoegd voor alle 16 rv32 wedstrijden (73-88).
- **`app/api/matchday/live/route.ts`**: gebruikt nu `KO_MATCH_ODDS` voor KO-wedstrijden. Laadt `ko_match_teams` uit KV voor correcte team names + fantasy matching. Extra-time/penalty ESPN statussen toegevoegd aan `espnStatusToInternal`.
- **`components/matchday/slides/LiveSlide.tsx`**: gebruikt `homeTeamName`/`awayTeamName` uit API response i.p.v. statische TBD matches.

---

### 2026-06-28f — ASC groep matchday custom bets vanaf MD19 (Claude Code)

**ASC-groep InzetSlide krijgt hetzelfde custom bets format als OG (admin-ingevoerde weddenschappen i.p.v. 4 wedstrijden met toto/uitslag)**
- **`lib/matchday.ts`**: `FIRST_CUSTOM_BET_MATCHDAY` is nu een per-groep record (`{ og: 15, asc: 19 }`). `asc`-type in `MatchdayConfig` heeft nu ook `customBets?: CustomBet[]`.
- **`app/api/matchday/[id]/full/route.ts`**: `useCustomBets` logica is nu groep-aware — leest custom bets uit `config[group]` i.p.v. hardcoded `config.og`.
- **`app/admin/AdminClient.tsx`**: admin-interface toont weddenschappen-formulier ook voor ASC vanaf MD19, leest/schrijft naar de juiste groep-config.
- **`lib/types/matchday.ts`**: comment bijgewerkt.

---

### 2026-06-28e — KO deadline override voor specifieke deelnemers (Claude Code)

**RA, TdL en RH mogen alsnog wedstrijd 73 invullen ondanks verstreken deadline**
- **`hooks/useKoMatchDeadline.ts`**: `DEADLINE_OVERRIDES` map toegevoegd (matchId → lijst van initialen). `useKoMatchLocks` accepteert nu een `participant` parameter; als de deelnemer in de override-lijst staat voor een wedstrijd, wordt de lock overgeslagen.
- **`app/(app)/knockout/KnockoutClient.tsx`**: `participantInitials` uit Zustand store gehaald en doorgegeven aan `useKoMatchLocks`.

---

### 2026-06-28d — Oranje vragen: type-aware antwoordvergelijking + beoordeling display (Claude Code)

**Oranje antwoorden werden verkeerd beoordeeld — marge-logica hield geen rekening met vraagtype**
- **`lib/types/oranjeVragen.ts`**: nieuwe gedeelde `isAntwoordCorrect(gegeven, correctValues, type)` helper. Past marge toe per type: `percentage` ±5, `aantal_marge` ±1, `decimaal` ±0.33, alle overige types exact match. Voorheen kreeg elk numeriek antwoord ±5 marge, waardoor bijv. `exact_aantal`-vragen altijd vinkjes gaven.
- **`components/oranje/VragenBeantwoordenCard.tsx`**: gebruikt nu `isAntwoordCorrect` met het effectieve vraagtype. Toont ook beoordeling-resultaten (goed/fout) voor `open`-type vragen die via admin-beoordeling worden beoordeeld (voorheen ontbrak dit).
- **`app/(app)/oranje/OranjeClient.tsx`**: header-teller ("X / Y correct") gebruikt nu dezelfde type-aware logica. Geeft `beoordeling` data door aan VragenBeantwoordenCard.
- **`lib/scoring.ts`**: `scoreOranjeNieuw` en `scoreOranjeTokens` accepteren nu `oranjeVragen` parameter en gebruiken `isAntwoordCorrect` — score-berekening is nu consistent met de weergave.
- **`app/actions/admin.ts`**: `computeAndSaveScores` laadt en geeft `oranjeVragen` door aan de scoring engine.

**Race condition gefixt in admin correct-antwoorden**
- **`app/admin/AdminClient.tsx`**: `handleCorrectAntwoord` en `handleBeoordeling` gebruiken nu de callback-variant van `setState` i.p.v. stale closure state. Voorheen kon snel achter elkaar antwoorden instellen eerdere antwoorden overschrijven.

---

### 2026-06-28c — Admin KO Tokens tab (Claude Code)

**Nieuw admin tabblad "KO Tokens" — overzicht tokengebruik KO-wedstrijden per deelnemer**
- **`app/actions/admin.ts`**: nieuwe server action `loadKoTokenUsage()` + type `KoTokenUsageEntry`. Berekent per deelnemer: base (65), oranje bonus, budget, ingezet (wedstrijden 73-104), gereserveerd (toekomstige wedstrijden zonder teams), remaining.
- **`app/admin/AdminClient.tsx`**: nieuw tab "KO Tokens" met lazy-load patroon (zelfde als bestaand Tokens tab). Toont per deelnemer een overzicht met kolommen Base, Bonus, Budget, Ingezet, Res., Over. Rood/groen kleuring bij over/onder budget.

---

### 2026-06-28b — KO token reservering + datumfix + fantasy stats race condition (Claude Code)

**KO-wedstrijden tokenbudget: reservering voor toekomstige wedstrijden**
- **`hooks/useTokenBudget.ts`**: `TOTAL_KO_MATCHES = 32` constant. Budget reserveert nu `32 - availableMatchCount` tokens voor wedstrijden waarvan de teams nog niet bekend zijn (elk min. 1 token). Voorkomt dat deelnemers te veel tokens inzetten op de R32 en niet genoeg overhouden voor latere rondes.

**KO-wedstrijden datums gecorrigeerd naar officieel FIFA-schema**
- **`lib/data/matches.ts`**: R32 28 jun – 3 jul (was 1–4 jul), R16 4–7 jul (was 5–6 jul), KF 9–11 jul (was 9–10 jul), HF 14–15 jul (was 13–14 jul)
- **`app/(app)/knockout/KnockoutClient.tsx`**: wedstrijdkaarten tonen nu de datum uit de KV kickoff-tijd (de echte bron) i.p.v. de hardcoded fallback-datum. Nieuwe `formatKickoffDate()` helper.

**Fantasy stats race condition gefixt — data kon verdwijnen bij meerdere admin tabs**
- **Oorzaak**: admin panel sloeg bij elke statwijziging de HELE React state op naar KV. Als de admin pagina eerder was geopend met verouderde data, werden tussentijds toegevoegde stats (incl. Vini Jr.) overschreven.
- **`app/actions/admin.ts`**: drie nieuwe server actions `mergeFantasyStat()`, `removeFantasyStat()`, `mergeEspnStats()` — doen read-modify-write op de server zodat bestaande KV-data nooit verloren gaat.
- **`app/admin/AdminClient.tsx`**: handlers gebruiken nu de nieuwe merge-actions i.p.v. `saveFantasyStats()` met volledige state overschrijving. React state wordt bijgewerkt met de verse server-data na elke operatie.

---

### 2026-06-28 — KO-wedstrijden voorspellingen geactiveerd (Claude Code)

**Knockout wedstrijden (#73-104) zijn nu speelbaar voor deelnemers.**

- **`lib/config.ts`**: `APP_PHASE` van 2 naar 3
- **`app/(app)/knockout/KnockoutClient.tsx`**: twee hoofd-tabs "Wedstrijden" (default) en "Landen". Wedstrijden-tab toont KoMatchCards per ronde (R32, R16, 1/4, 1/2, FIN) met token budget, per-match deadlines, en TBD placeholders
- **`app/(app)/knockout/page.tsx`**: laadt nu ook `results`, `koMatchTeams`, `oranjeTokens` via server actions
- **`components/matches/KoMatchCard.tsx`**: uitgebreid met `readOnly`, `result`, `time` props. Toont earned score na wedstrijd, details dropdown met doelpunten, vergrendeld 2u voor aftrap
- **`hooks/useKoMatchDeadline.ts`**: nieuw — `isKoMatchLocked()` utility + `useKoMatchLocks()` hook. Wedstrijd open als geen kickoff-tijd, locked 2u voor aftrap
- **`hooks/usePredictions.ts`**: `isPast` save-guard verwijderd — UI readOnly props zijn nu de enforcement, zodat KO predictions opslaanbaar blijven na de groepsdeadline
- **`hooks/useTokenBudget.ts`**: `useKoMatchBudget` telt nu minimale 1 token per beschikbare wedstrijd mee in het budget. Base verhoogd van 50 naar 65 tokens
- **`components/layout/TokenCount.tsx`**: route-aware — toont KO-budget op `/knockout`, poulefase-budget elders
- **`components/layout/BottomNav.tsx`**: fase 3 tab-set met "Knockout" label (was "Landen")
- **`app/actions/admin.ts`**: `KoMatchTeams` type uitgebreid met `kickoff?: string`
- **`scripts/scrape-ko-match-odds.mjs`**: haalt nu ook kickoff-tijden op uit Kambi API (`event.start`) en slaat op in `ko_match_teams` KV. Leest `.env.local` voor Upstash credentials
- **`lib/data/koMatchOdds.ts`**: gevuld met quoteringen voor alle 16 R32 wedstrijden (matches 73-88)
- **`scripts/ko-match-teams.json`**: 16 R32 wedstrijden met teams, gebruikt door scraper

**Oranje pagina tokens-berekening gefixt:**
- **`app/(app)/oranje/OranjeClient.tsx`**: `totalCorrect` berekening gebruikt nu dezelfde logica als `scoreOranjeNieuw()` — numerieke marge (±5), admin-beoordeelde open vragen. Was: simpele string match (15 correct), nu: volledige scoring (23 correct, 12 tokens)
- **`app/actions/oranjeVragen.ts`**: publieke `loadOranjeBeoordeling()` en `loadOranjeBeoordelingForGroup()` toegevoegd

**CLAUDE.md** aangemaakt voor toekomstige sessies.

---

### 2026-06-26 — Chat infinite scroll (Claude Code)

#### Chat — oudere berichten laden bij omhoog scrollen
- `lib\kv\chat.ts`: nieuwe `chatGetOlder()` functie — haalt berichten op vóór een timestamp via Redis ZRANGE REV, retourneert in chronologische volgorde.
- `app\api\chat\messages\route.ts`: GET accepteert nu `before` parameter naast bestaande `since`. `before > 0` roept `chatGetOlder()` aan voor het laden van historie.
- `components\chat\ChatPage.tsx`: infinite scroll naar boven — als gebruiker binnen 100px van bovenkant scrollt, worden automatisch 50 oudere berichten geladen. Scrollpositie behouden na prepend. Oranje spinner bovenaan tijdens laden. Stopt automatisch als er geen oudere berichten meer zijn. Reset bij groepswisseling.

---

### 2026-06-29 — Pot updates MD18/19 + admin max bets verhoogd (Claude Code)

#### Stand pagina — Pot tab OG
- `app\(app)\stand\StandClient.tsx`: OG: Toto's en uitslagen matchday 19 (-10,00).

#### Stand pagina — Pot tab ASC
- `app\(app)\stand\StandClient.tsx`: ASC: Toto's en uitslagen matchday 18 (-5,00) en 19 (-5,00). Winst Matchday 16 (+11,14), 17 (+6,10) en 18 (+15,87).

#### Admin — max weddenschappen verhoogd
- `app\admin\AdminClient.tsx`: maximaal aantal custom weddenschappen per matchday verhoogd van 2 naar 10.

---

### 2026-06-26 — Token fix PN + MD17 rotation fix + pot updates (Claude Code)

#### Redis data fix — PN tokens wedstrijd 58/61
- `scripts\fix_pn_tokens.mjs`: eenmalig script. PN had 7 tokens op wedstrijd 58 (max 6). Tokens 58: 7→6, tokens 61: 3→4. Scores herberekend via admin panel.

#### Redis data fix — ASC rotation MD17
- `scripts\fix_md17_rotation.mjs`: eenmalig script. ASC rotation voor MD17 stond op BV (geen voorspellingen), gecorrigeerd naar RA. Inzet slide toonde daardoor geen naam/voorspellingen/quoteringen.

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 16 en 17 (-5,00 elk).

#### Stand pagina — Pot tab ASC
- `app\(app)\stand\StandClient.tsx`: ASC: Winst Matchday 15 (+49,15) toegevoegd, Winst Matchday 14 (+13,80) verwijderd, Winst Matchday 05 gecorrigeerd (3,45→3,52).

---star

### 2026-06-26 — Custom bets (OG MD15+) + pot MD15 + winst MD13/14 (Claude Code)

#### Matchday slides — custom weddenschappen (OG, MD15+)
- `lib\matchday.ts`: nieuw `CustomBet` interface (`description`, `matchIds?`, `inzet`, `quotering`) + `FIRST_CUSTOM_BET_MATCHDAY = 15` constante. `MatchdayConfig.og` uitgebreid met optioneel `customBets` veld.
- `lib\types\matchday.ts`: `FullMatchdayData` uitgebreid met optioneel `customBets` veld.
- `app\api\matchday\[id]\route.ts`: POST accepteert en persisteert `customBets` in matchday config.
- `app\api\matchday\[id]\full\route.ts`: stuurt `customBets` mee in response voor OG MD≥15, zet `totoVanDeDag` op null.
- `components\matchday\slides\InzetSlide.tsx`: cards-variant voor custom bets met beschrijving, gekoppelde wedstrijden (vlaggen + 3-letter landcodes), inzet en quotering. Backward-compatibel met oud `matchId` formaat.
- `components\matchday\MatchdayDrawer.tsx`: geeft `data.customBets` door aan InzetSlide.

#### Admin — custom bets invoer (OG, MD15+)
- `app\admin\AdminClient.tsx`: voor OG + MD≥15 toont "Weddenschappen" sectie i.p.v. "Toto van de dag" + "Unibet quoteringen". Per weddenschap: beschrijving (vrije tekst), wedstrijd-toggle-buttons (meerdere selecteerbaar), inzet (€), quotering. Max 2 weddenschappen.

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 15 (-5,00).

#### Stand pagina — Pot tab OG
- `app\(app)\stand\StandClient.tsx`: OG: Winst Matchday 14 (+8,00).

#### Stand pagina — Pot tab ASC
- `app\(app)\stand\StandClient.tsx`: ASC: Winst Matchday 13 (+5,24) en Winst Matchday 14 (+13,80).

---

### 2026-06-24 — Multi live slides + dynamische matchday + stand tokens + pot MD13/14 (Claude Code)

#### Matchday drawer — meerdere gelijktijdige live wedstrijden
- `components\matchday\slides\LiveSlide.tsx`: omgebouwd van array (`liveMatches`) naar enkelvoud (`liveMatch`) — één slide per wedstrijd.
- `components\matchday\MatchdayDrawer.tsx`: rendert nu aparte LiveSlide per actieve wedstrijd. Slide refs dynamisch (Map i.p.v. 4 vaste refs). `liveOffset` = aantal actieve live wedstrijden i.p.v. vast 1. Dots en swipe werken correct met variabel aantal live slides.

#### Matchday drawer — dynamische default matchday
- `lib\data\matchdayMap.ts`: nieuwe functie `getCurrentMatchday()` — berekent de huidige matchday op basis van laatste aftrap + 120 min. Werkt automatisch voor het hele toernooi.
- `components\matchday\MatchdayDrawer.tsx`: gebruikt `getCurrentMatchday()` als fallback i.p.v. hardcoded waarde.

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 13 (-5,00) en matchday 14 (-5,00).

#### Stand pagina — Pot tab ASC
- `app\(app)\stand\StandClient.tsx`: ASC: Winst Matchday 12 (+5,50).

#### Stand pagina — Totaal overzicht (tokens & punten per token)
- `app\leaderboard\types.ts`: `tokensUsed` veld toegevoegd aan `ParticipantScore`.
- `app\actions\admin.ts`: `computeAndSaveScores()` berekent `tokensUsed` — alleen tokens van verwerkte wedstrijden (met resultaat) en verwerkte landenslots (met doorgestuurde landen).
- `app\actions\scores.ts`, `app\leaderboard\page.tsx`: `tokensUsed: 0` als default.
- `components\leaderboard\RankList.tsx`: Totaal-overzicht: kolommen Poule/Landen/Fantasy verwijderd (staan in eigen tabbladen). Nieuwe kolommen: Tokens (gebruikte tokens) en P/T (punten per token).

---

### 2026-06-23 — Pot MD12 + winst ASC MD11 + drawer default matchday 12 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 12 (-5,00).

#### Stand pagina — Pot tab ASC
- `app\(app)\stand\StandClient.tsx`: ASC: Winst Matchday 11 (+12,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 11 naar 12.

---

### 2026-06-22 — Fantasy stats player-ID keys + pot MD11 + admin fantasy sortering (Claude Code)

#### Fix: Fantasy stats duplicate spelernaam (M. Galarza bug)
- `FantasyStats` gebruikt nu speler-ID als key i.p.v. spelernaam. Hierdoor worden spelers met dezelfde naam (bv. M. Galarza van Argentinië en Paraguay) correct onderscheiden.
- `lib\scoring.ts`: `scoreFantasy` lookup op `player.id` i.p.v. `player.name`.
- `app\(app)\fantasy\FantasyClient.tsx`: alle stats-lookups op `player.id`.
- `app\admin\AdminClient.tsx`: `handleFantasyStat`, `handleFantasyRemove`, ESPN import, zoekresultaten en stats-tabel allemaal op player-ID.
- `app\api\admin\espn-import\route.ts`: retourneert nu ook `internalId` per gematchte speler.
- `app\actions\admin.ts`: `loadFantasyStats` migreert automatisch bestaande naam-keys naar ID-keys bij eerste load.

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 11 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 10 naar 11.

#### Admin — Fantasy tab
- `app\admin\AdminClient.tsx`: zoekbalk verplaatst naar bovenaan. Zoekresultaten direct onder zoekbalk geplaatst (was onderaan). Sorteerbare kolomkoppen (naam, land, goals, assists) toegevoegd aan de ingevoerde-statistieken lijst.

---

### 2026-06-21 — Pot MD10 + drawer default matchday 10 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 10 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 9 naar 10.

---

### 2026-06-20 — Pot MD09 + drawer default matchday 09 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 09 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 8 naar 9.

---

### 2026-06-19 — Pot MD08 + drawer default matchday 08 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG en ASC: Toto's en uitslagen matchday 08 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 7 naar 8.

---

### 2026-06-18 — Pot MD07 + drawer default matchday 07 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: OG: Toto's en uitslagen matchday 07 (-5,00) en Winst Matchday 06 (+6,40). ASC: Toto's en uitslagen matchday 07 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 6 naar 7.

---

### 2026-06-17 — Pot MD06 + drawer default matchday 06 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app\(app)\stand\StandClient.tsx`: voor beide groepen toegevoegd: Winst Matchday 05 (+3,45) en Toto's en uitslagen matchday 06 (-5,00).

#### Matchday drawer — default matchday
- `components\matchday\MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 5 naar 6.

---

### 2026-06-17 — Admin matchday: voorspellingen toto-van-de-dag per wedstrijd (Claude Code)

#### Admin matchday tab — toto/uitslag deelnemer zichtbaar per wedstrijd
- `app/actions/admin.ts`: nieuwe server action `loadParticipantPredictions(initials)` — haalt `Record<number, Prediction>` op uit Redis voor een opgegeven deelnemer.
- `app/admin/AdminClient.tsx` (`MatchdayAdminTab`): bij het laden van matchday-data worden meteen ook de voorspellingen van de "toto van de dag"-deelnemer opgehaald. Per wedstrijd in de "Unibet quoteringen" lijst verschijnen nu het toto-badge (1/X/2) en de voorspelde uitslag naast de wedstrijdnaam, zodat direct zichtbaar is waarop ingezet moet worden.

### 2026-06-16 — Stand: lijngrafieken + matchday 05 updates + score-bugfix (Claude Code)

#### Stand — lijngrafiek ranglijst + pot
- `app/actions/history.ts` — nieuw: `loadScoreHistoryForGroup()` (score per deelnemer per matchday, alle metrics tegelijk via `computeMatchdayScores`) en `loadPotHistoryForGroup()` (pot-stand per matchday uit het admin-`potStand`-veld, dezelfde bron als de bestaande drawer-`PotChart`).
- `app/(app)/stand/StandClient.tsx`: Stand-tab krijgt een lijngrafiek onderaan (hergebruikt `ProgressChart`), gekoppeld aan de actieve filter (Totaal/Poule/FXV/Landen/TOTO/UITSL) via een `historyKey`-mapping per `STAND_VIEWS`-entry. Pot-tab krijgt een lijngrafiek (hergebruikt `PotChart`) tussen "Huidige pot" en de eerste regel. `load()` haalt nu ook score- en pot-historie op (parallel aan de scores).
- `components/matchday/charts/ProgressChart.tsx`: nieuwe `highlightInitials?` prop — wanneer gezet, worden alle lijnen behalve die van de meegegeven deelnemer dun/grijs, en die ene lijn oranje/dik en op de voorgrond. Bestaand gedrag (regenboogkleuren, voor de matchday-export) blijft ongewijzigd wanneer de prop niet gezet is.
- Pot-ledger (`POT_REGELS`) en grafiek-databron (admin-`potStand`) zijn twee gescheiden systemen die handmatig synchroon gehouden moeten worden.

#### Bugfix — `computeMatchdayScores` weken af van de officiële scoreberekening
- `lib/matchday.ts`: `computeMatchdayScores()` (gebruikt door matchday-drawer én de nieuwe Stand-grafiek) week op 3 punten af van `scoreParticipant()` (de officiële, live score-berekening in `lib/scoring.ts`):
  1. Uitslag-vergelijking gebeurde zonder `normalizeUitslag()` — `"2 - 0"` (voorspelling) vs `"2-0"` (opgeslagen uitslag) telde niet als match, terwijl de officiële score dit wél normaliseert. Was de hoofdoorzaak van een geconstateerd verschil (Robert: 94.99 officieel vs 51.3 in de grafiek).
  2. Quoteringen voor knockout-wedstrijden (matchId ≥ 73) kwamen altijd uit `MATCH_ODDS` i.p.v. `KO_MATCH_ODDS`.
  3. ASC-bonustokens (`ascBonusTokens` per deelnemer/wedstrijd) telden niet mee in de tokenberekening.
  Alle drie gefixt zodat `computeMatchdayScores` exact dezelfde logica volgt als `scoreParticipant`. Geverifieerd tegen live data: grafiekscore = officiële score.

#### Matchday drawer — standaard matchday 05
- `components/matchday/MatchdayDrawer.tsx`: Default matchday bij openen gewijzigd van 4 naar 5.

#### Trend pijltjes — baseline nu persistent
- `app/(app)/stand/StandClient.tsx`: De rank-baseline voor de trend-pijltjes (matchday 04 feature) stond alleen in een `useRef` en reset bij elke page-load, waardoor pijltjes in de praktijk nooit zichtbaar werden. Nu opgeslagen in `localStorage` per groep (`panenka:stand:ranks:<group>`), zodat vergeleken wordt met de laatst bekende stand i.p.v. alleen binnen de huidige sessie.

#### Pot — OG en ASC bijgewerkt
- `app/(app)/stand/StandClient.tsx`: OG pot: toegevoegd Winst Matchday 04 (+7,00) en Toto's en uitslagen matchday 05 (-5,00). ASC pot: toegevoegd Toto's en uitslagen matchday 05 (-5,00).

### 2026-06-15 — Inzet slide MD04 ASC: Iran - Nieuw-Zeeland uitslag override (Claude Code)

#### Inzet slide — eenmalige override MD04 ASC
- `components/matchday/MatchdayDrawer.tsx`: `buildInzetMatchData()` aangepast. Voor MD04 ASC wordt de uitslag van Iran - Nieuw-Zeeland hardcoded overschreven naar `1-1` (ingezette weddenschap; de 2-4 voorspelling van NS was niet beschikbaar als bet). TOTO-voorspelling (`'2'` = NZ wint) blijft automatisch uit NS's pouledata komen. Geen effect op andere matchdays of groepen.

### 2026-06-15 — Stand: trend pijltjes bij positiewisselingen ranglijst (Claude Code)

#### Stand — trend arrows op de ranglijst

- `components/leaderboard/RankList.tsx`: Nieuw `positionDeltas?: Record<string, number>` prop. `TrendArrow` component toegevoegd: ▲{n} groen (gestegen) of ▼{n} rood (gedaald), pijltje naast het rangnummer. Grid eerste kolom verbreed van `2rem` naar `3.5rem` voor beide views (single + multi).
- `app/(app)/stand/StandClient.tsx`: `prevRanksRef` (ranks vóór laatste refresh) + `lastLoadedGroupRef` + `allDeltas` state toegevoegd. `load` callback berekent bij elke refresh per view (Totaal, Poule, FXV, Landen, TOTO, UITSL) de positiedelta's t.o.v. de vorige load. Eerste load: geen arrows (baseline opslaan). Tweede load+: arrows zichtbaar. Groepwissel reset de baseline. `positionDeltas` (voor huidige standView) doorgegeven aan `RankList`.

### 2026-06-15 — Matchday 04 updates: pot/inzet regels + drawer default (Claude Code)

#### Pot — OG en ASC bijgewerkt
- `app/(app)/stand/StandClient.tsx`: OG pot: toegevoegd Toto's en uitslagen matchday 04 (-5,00). ASC pot: toegevoegd Toto's en uitslagen matchday 04 (-5,00) en Winst welkomstbonus (+100,00).

#### Inzet — gewonnen weddenschap ASC
- `app/(app)/stand/StandClient.tsx`: "Duitsland wint van Curacao" (ASC) gemarkeerd als gewonnen (`gewonnen: true` → oranje rand + ✓ vinkje).

#### Matchday drawer — standaard matchday 04
- `components/matchday/MatchdayDrawer.tsx`: Default matchday bij openen gewijzigd van 3 naar 4.

### 2026-06-14 — Matchday 03 updates: pot/inzet regels + auto-scroll poulefase + drawer default (Claude Code)

#### Pot — OG en ASC bijgewerkt
- `app/(app)/stand/StandClient.tsx`: OG pot: toegevoegd Winst Matchday 02 (+19,50), Winst welkomstbonus (+100,00), Toto's en uitslagen matchday 03 (-5,00). ASC pot: toegevoegd Winst Matchday 02 (+6,75), Toto's en uitslagen matchday 03 (-5,00).

#### Inzet — gewonnen weddenschap markering
- `app/(app)/stand/StandClient.tsx`: `gewonnen?: boolean` veld toegevoegd aan `Weddenschap` interface. Bij `gewonnen: true` krijgt de kaart een oranje rand en ✓ vinkje. "Brazilië scoort tegen Marokko" (OG) gemarkeerd als gewonnen.

#### Poulefase — auto-scroll naar laatste afgeronde wedstrijd
- `app/(app)/poulefase/PoulefaseClient.tsx`: Bij openen in fase 2 wordt automatisch de ronde-tab geselecteerd van de laatste afgeronde wedstrijd, en scrollt de pagina naar die match card (`scrollIntoView block: center`). Scroll gebeurt eenmalig per page load.

#### Matchday drawer — standaard matchday 03
- `components/matchday/MatchdayDrawer.tsx`: Default matchday bij openen gewijzigd van 2 naar 3.

### 2026-06-14 — Admin: "Toto van de dag" dropdown editeerbaar per matchday (Claude Code)

#### Admin — Matchday tab
- `app/admin/AdminClient.tsx`: "Toto van de dag" blok is nu een dropdown (ipv statische tekst). Je kunt per matchday kiezen wie de toto van de dag is. Bij opslaan wordt de volledige rotatie-array voor de groep (OG of ASC) opgeslagen in Redis via `POST /api/matchday/rotation`. Wijzigingen worden alleen opgeslagen als er daadwerkelijk iets is aangepast (`rotationDirty` state).

### 2026-06-13 — MatchCard details dropdown: uitslag + doelpunten on click (Claude Code)

#### Poulefase: resultaatrij vervangen door klikbare dropdown

- `components/matches/MatchCard.tsx`: resultaatrij (pijl + score) verwijderd. Zodra de admin een uitslag bevestigt, wordt de header klikbaar (cursor-pointer + ▼ chevron rechts). Klik opent `MatchDetailsDropdown`: toont bevestigde uitslag (groen als correct), Toto ✓ badge, en ESPN-doelpunten chronologisch (thuisteam links, uitteam rechts; penalty/eigen doel gelabeld; assist ingesprongen).
- `app/api/match/[id]/goals/route.ts`: nieuwe GET endpoint — haalt ESPN wedstrijddata op voor één wedstrijd via `ESPN_MATCH_IDS`, extraheert doelpunten + assists, retourneert `{ goals: LiveGoalEvent[] }`. Next.js cache 1 uur (afgespeelde wedstrijden veranderen niet meer).

### 2026-06-13 — Aanvangstijden toegevoegd aan match cards (Claude Code)

#### Poulefase: aanvangstijd zichtbaar in ondertitel match card
- `lib/data/matches.ts`: `time?: string` veld toegevoegd aan `Match` interface; alle 72 groepsfase-wedstrijden (id 1–72) voorzien van aanvangstijd in Nederlandse tijd (CEST) op basis van officieel WK-schema.
- `components/matches/MatchCard.tsx`: ondertitel toont nu `{datum} · {tijd} · {stadion}` wanneer `match.time` aanwezig is.

### 2026-06-13 — Pot OG + ASC: Toto's en uitslagen matchday 02 (Claude Code)

#### Stand pagina — Pot tab OG en ASC
- `app/(app)/stand/StandClient.tsx`: regel toegevoegd aan `POT_REGELS.og` én `POT_REGELS.asc`: `Toto's en uitslagen matchday 02, -5.00` (datum 2026-06-13).

### 2026-06-13 — Pot OG: Winst Matchday 01 + drawer default matchday 02 (Claude Code)

#### Stand pagina — Pot tab OG groep
- `app/(app)/stand/StandClient.tsx`: regel toegevoegd aan `POT_REGELS.og`: `Winst Matchday 01, +9.50` (datum 2026-06-13).

#### Matchday drawer — standaard matchday 02
- `components/matchday/MatchdayDrawer.tsx`: default matchday bij openen gewijzigd van 1 naar 2.

### 2026-06-12 — Uitslag opmaak in resultaatrij (Claude Code)

#### Poulefase: werkelijke uitslag getoond met spaties
- `components/matches/MatchCard.tsx`: `result.uitslag` in de resultaatrij toont nu `2 - 0` i.p.v. `2-0` (`.replace('-', ' - ')`).

### 2026-06-12 — Uitslag normalisatie + score-berekening fix + stand layout (Claude Code)

#### Score-berekening: uitslag met/zonder spaties worden nu als gelijk herkend
- `lib/helpers.ts`: nieuwe `normalizeUitslag(s)` helper — normaliseert `"2-0"`, `"2- 0"`, `"2 - 0"` allemaal naar `"2 - 0"` (odds-key formaat).
- `lib/scoring.ts`: `scoreParticipant` normaliseert beide kanten vóór vergelijking en gebruikt genormaliseerde uitslag voor de odds-lookup.
- `components/matches/MatchCard.tsx`: `earnedScore` berekening, uitslag-knop label, resultaatrij-tekst en groen/wit kleurcheck — alles genormaliseerd.
- `app/admin/AdminClient.tsx`: uitslag-knop in MatchResultRow normaliseert display.
- `components/matchday/slides/LiveSlide.tsx`: `row.uitslag` genormaliseerd in display.
- `components/matchday/slides/MatchSlide.tsx`: `fmtUitslag()` herschreven via `normalizeUitslag` (ook bug gerepareerd: dubbele spaties bij al-genormaliseerde input).
- `app/api/matchday/[id]/full/route.ts`: `uitslag` + `uitslagQuote` lookup genormaliseerd.
- `app/api/matchday/live/route.ts`: `uitslag` genormaliseerd vóór `uitslagCorrect` vergelijking.

#### /stand pagina: top 3 in tabel (geen apart podiumblok)
- `app/(app)/stand/StandClient.tsx`: `<Podium>` component verwijderd; `<RankList>` toont nu alle deelnemers (incl. #1–3) met `startRank={1}`.

### 2026-06-11 — Live slide bugfixes: tokens, quoteringen, fantasy namen (Claude Code)

#### 4 bugs opgelost in de live matchday slide

**Bug 1 – Tokens toonden 0**
- `app/api/matchday/live/route.ts`: fallback `pred?.tokens ?? 0` → `pred?.tokens ?? 1`.

**Bug 2 – Uitslag-punten nooit correct (Laurens 1-0 kreeg geen virtuele punten)**
- `app/api/matchday/live/route.ts`: `uitslagNow` format gecorrigeerd: `"1-0"` → `"1 - 0"` (spaties, conform ScorePicker opslag).
- `lib/matchday.ts`: `resolveUitslagOdds` en `resolveTotoOdds`: `?? 1` → `|| 1` zodat opgeslagen 0 (lege admin-velden) correct terugvalt naar 1 in plaats van 0 te gebruiken.
- `app/admin/AdminClient.tsx`: admin-save slaat geen `0` meer op voor lege odds-velden (via `isNaN` check).

**Bug 3 – Iedereen zag dezelfde quoteringen (4.70 toto, 20.00 uitslag)**
- `app/api/matchday/live/route.ts`: `MATCH_ODDS` (statische data) geïmporteerd. `effectiveQuote` opgebouwd per wedstrijd: combineert admin-quote (Redis) met statische odds als fallback. Per-uitkomst toto-odds (1/X/2) en per-uitslag uitslagOddsMap worden nu correct per deelnemer gebruikt.

**Bug 4 – Fantasy-spelers niet herkend (Quiñones scoorde, geen vinkje)**
- `app/api/matchday/live/route.ts`: namen van ESPN API (bijv. "Julian Quiñones") matchen niet altijd met onze players.ts (`name`: "J. Quiñones", `middleName`: "Julian Quiñones"). Oplossing: 4-niveau fallback via `lookupGoals`/`lookupAssists`: middleName exact → name exact → genormaliseerde middleName (diacrieten gestript) → genormaliseerde name. `normName` helper met `\p{M}` Unicode regex.

### 2026-06-11 — Matchday slides OG/ASC toggle (Claude Code)

#### Matchday drawer: groep-toggle voor Robert en Wouter
- `app/(app)/layout.tsx`: `isDualGroup` berekend via `DUAL_GROUP_INITIALS` en doorgegeven aan `AppShell`.
- `AppShell.tsx` → `AppHeader.tsx` → `MatchdayButton.tsx`: `isDualGroup` prop doorgesluisd.
- `MatchdayDrawer.tsx`: intern `activeGroup` state (geïnitialiseerd vanuit `group` prop); OG/ASC toggle pill linksboven in de top bar — alleen zichtbaar voor WS en RA. Bij wisselen herlaadt de data automatisch voor het gekozen groep. Stijl identiek aan de chat toggle (oranje pill actief, grijs inactief).

### 2026-06-11 — Matchday slides live + bugfixes (Claude Code)

#### Fantasy fase 2: kolombreedtes & padding
- `FantasyClient.tsx`: quotering-container en PTS-kolom verkleind naar 38px (was 40px), rij-padding naar 8px — naam-kolom krijgt meer ruimte op kleine schermen.

#### MatchdayButton in header
- `AppHeader.tsx`: `MatchdayButton` toegevoegd links naast de beker-knop; `groupId` prop correct gedestructureerd.
- `MatchdayButton.tsx`: border/rondje verwijderd, bal vergroot naar 24px, opacity verhoogd naar 0.85.

#### Matchday slides: data-flow bugfixes
- `lib/matchday.ts`: import `ALL_SLOTS` gewijzigd van `@/store/gameStore` naar `@/lib/data/slots` — was server-side niet itereerbaar (Turbopack crash).
- `lib/matchday.ts` + `full/route.ts`: null-tokens behandeld als 1 (minimale inzet), consistent met admin-export. Scoring sloeg eerder null-token voorspellingen ten onrechte over.

#### Live slide: alleen tijdens actieve wedstrijden
- `MatchdayDrawer.tsx`: `hasLive` checkt nu alleen `IN_PLAY` / `PAUSED` — FINISHED matches tonen de live slide niet meer.
- `.env.local`: `ESPN_TEST_MATCH` uitgecommentarieerd.

#### InzetSlide: pot en grafiek verwijderd
- `InzetSlide.tsx`: "Stand van de pot" en `PotChart` verwijderd; `potHistory`, `config`, `group` props verwijderd.

#### SlideWrapper: padding en export-logica opgeruimd
- `SlideWrapper.tsx`: `paddingBottom: 80` verwijderd (was alleen nodig voor PNG-export, nu niet meer relevant). `exporting` prop verwijderd uit interface en alle slide-aanroepen.
- `MatchdayDrawer.tsx`: logo + dots voorzien van `paddingBottom: calc(5rem + env(safe-area-inset-bottom))` zodat ze boven de navigatiebalk vallen.

---

### 2026-06-11 — Stand pagina fase 2: Inzet, Pot, sub-toggle Stand (Claude Code)

**Tabblad Inzet (OG)**
- `StandClient.tsx`: weddenschappen data-structuur toegevoegd (`WEDDENSCHAPPEN`), elke weddenschap eigen card met #nummer, omschrijving, inzet, quotering (2 decimalen), max winst
- 6 weddenschappen ingevoerd voor OG: Brazilië scoort/Marokko, Frankrijk/Brazilië/Nederland winnaar WK, Kane/Haaland topscoorder

**Tabblad Pot (OG)**
- `StandClient.tsx`: potbalans data-structuur (`POT_REGELS`) + huidige potstand bovenin (groot, dynamisch berekend)
- Lopende balans: elke regel eigen card, 3-koloms grid (70px | 1fr | 70px), + links groen / − rechts grijs, omschrijving gecentreerd
- Beginbedrag €300 + 3 uitgaven ingevoerd: welkomstbonus (−€1), matchday 01 toto's (−€5), toernooi weddenschappen (−€20) → pot = €274

**Sub-toggle Stand-tabblad**
- `StandClient.tsx`: 6 views: Totaal / Poule / FXV / Landen / TOTO / UITSL
- Ranglijst sorteert per geselecteerde view; Podium en RankList tonen bijbehorende score
- `RankList.tsx`: enkelvoudige scorekolom bij niet-totaal views; kolomkop "KO" → "Landen"; headers lichter (#888)
- `Podium.tsx`: `scoreKey` prop toegevoegd
- Vernieuwen-knop: tekst weg, alleen pijltje (wit → oranje bij klik, 600ms)
- Placeholder "Scores worden berekend…" verwijderd

**totoCorrect / uitslagCorrect — nieuw scoreveld**
- `lib/scoring.ts` + `ScoreBreakdown`: totoCorrect en uitslagCorrect geteld per wedstrijd (poule + KO), tellen NIET mee in totaalscore
- `app/leaderboard/types.ts`, `app/actions/scores.ts`, `app/actions/admin.ts`, `app/leaderboard/page.tsx`: nieuwe velden doorgevoerd

**Matchday slides**
- `MatchdayDrawer.tsx`: RanglijstSlide en OverzichtSlide verwijderd uit active slides (bestanden bewaard); slide refs 4+5 weg; totalSlides bijgewerkt

### 2026-06-11 — Poll max opties uitgebreid naar 6 (Claude Code)

- `PollCreatorPanel.tsx`: limiet verhoogd van 4 naar 6 opties per poll

### 2026-06-10 — Oranje fase 2 UI, Overzicht-tabblad, ondertitels (Claude Code)

**Oranje tabblad fase 2 — volledig herontworpen**
- `VraagIndienenCard` (eigen vraag + ingediend-melding) verwijderd uit fase 2
- Match-navigatie: 3 knoppen (🇳🇱–🇯🇵 / 🇳🇱–🇸🇪 / 🇹🇳–🇳🇱) met vlaggen, volledige breedte, gecentreerd
- Balk: toont "ingevuld" tijdens antwoordfase; "correct · tokens verdiend" na deadline
- Per-vraag eigen container (afgeronde kaart)
- Read-only: groen ✓ / rood ✗ als goed antwoord bekend; goed antwoord als groen badge
- "▼ anderen" uitklapknop per vraag: antwoorden + indicatoren van alle groepsdeelnemers
- Bug fix: Tom (TdL) en Tim (TvL) misten bij "anderen" door `.toUpperCase()` vergelijkingsfout
- Nieuwe server actions: `loadAllOranjeAntwoorden`, `loadAllOranjeAntwoordenForGroup`, `loadOranjeCorrectForGroup`

**Overzicht-tabblad (was: Stand)**
- Tabblad omgebouwd naar client component (`StandClient.tsx`)
- Titel → "Overzicht", ondertitel → datum van de dag (Nederlands)
- 3 sub-tabs in poulefase-stijl: **Stand**, **Inzet** (placeholder), **Pot** (placeholder)
- OG/ASC-toggle in app-header voor Wouter en Robert (via portal, identiek aan Oranje/Chat)
- Nieuwe server action: `loadScoresForGroup`

**Fantasy XV fase 2**
- OG/ASC-toggle verplaatst van TeamViewer-modal naar app-header (via portal)
- Quotering-breedte: `w-11` → `w-10`; Pts-breedte: `w-12` → `w-10`
- Ondertitel → "Jouw droomteam"

**Ondertitels aangepast voor fase 2**
- Poulefase: "Jouw tokens, toto en uitslag"
- Knockout: "Jouw doorgaande landen"
- Oranje: "Jouw oranje antwoorden"

### 2026-06-10 — Fantasy XV fase 2 + Team Viewer (Claude Code)

**Fantasy fase 2 (read-only weergave na deadline)**
- Spelers kunnen niet meer worden gewisseld of verwijderd
- `RulesPanel` verwijderd uit fase 2
- Spelerstegels vereenvoudigd: `#` · vlag · naam · quotering · aantal (Romeins) · G · A · Pts
- Kolomkoppen wit en groter; quoteringsbadge `w-11` (vaste breedte); pts-kolom `w-12`
- Nieuwe kolom met Romeinse cijfers: hoe vaak de speler is gekozen in de eigen groep (kladblok telt niet mee)
- Goals/assists uit `FantasyStats`; punten = `(goals + assists) × quote`; dashboard-style totaalscore onderaan
- Klikken op speler opent nog steeds `PlayerInfoCard`-dropdown (zelfde als fase 1)
- Teamnaam statisch weergegeven (niet meer bewerkbaar na deadline)
- Trend-pijltjes verwijderd

**Team Viewer (ogen-icoon)**
- SVG ogen-icoon (`public/icons/eyes.svg`) naast "Fantasy XV" koptekst — wit en horizontaal gespiegeld
- Klikken opent volledig-scherm overlay met teams van andere deelnemers (eigen team uitgesloten)
- Zelfde layout als fase 2 minus koptekst/ondertitel/kladblok/uitleg puntentelling
- Links/rechts swipen (touch) of pijltjesknopjes (desktop) navigeren tussen deelnemers
- WS/RA krijgen OG/ASC-toggle (zelfde patroon als chat); overige deelnemers zien alleen eigen groep
- Achtergrondafbeelding zichtbaar door semi-transparante overlay (`rgba(10,10,10,0.88)`)
- Spelersaantal per Romeins cijfer gescheiden per groep (OG vs. ASC), uitgerekend uit `ogSquads`/`ascSquads`
- Scroll-positie reset bij navigeren naar nieuw team (`key={current.initials}`)

**Technisch**
- `app/actions/admin.ts`: `ParticipantSquadData` type + `loadSquadsForGroup()` + `_hydrateSquad()` helper
- `app/(app)/fantasy/page.tsx`: server component laadt squads per groep, berekent `ogPlayerCounts`/`ascPlayerCounts`
- `app/(app)/fantasy/FantasyClient.tsx`: major rewrite — `Phase2PlayerRow`, `TeamViewer`, `EyesIcon` componenten

### 2026-06-10 — Fase 2 read-only UI voor poulefase en knockout (Claude Code)

**MatchCard (poulefase, fase 2)**
- Oranje randje alleen zichtbaar als wedstrijd gespeeld (result known), niet meer altijd
- "Max. score" vervangen door "Score" met verdiende punten (`earnedScore`); standaard 0.00 pts
- Trend-pijltjes en token-steppers verborgen in `readOnly`
- Score-label rechtuit (`justify-end`) nu steppers weg zijn
- Nieuwe resultaatrij onder knoprij: ↑ bij juiste toto + uitslag; groen = correct, wit = fout

**DeadlineBanner**: geeft `null` terug als deadline verstreken — banner verdwijnt automatisch

**BottomNav**: tab 'Stand' gebruikt `IconOverzicht` in fase 2 (was `IconBeker`)

**PoulefaseClient**
- TO-DO-filter verwijderd in fase 2 (geen nieuwe voorspellingen)
- Standen-tabblad toont echte WK-stand via `computeStandingsFromResults()` (niet uit voorspellingen)
- "Deadline verstreken — alleen lezen" banner verwijderd

**Alle tabbladen**: "🔒 Deadline verstreken · alleen lezen" banners verwijderd uit poulefase, knockout, fantasy en oranje

**Knockout read-only (fase 2)**
- Landen-picker uitgeschakeld, wis-knop verborgen, trend-pijltjes weg, token-steppers weg
- Token-aantal zichtbaar als statisch getal
- Max. score → Score met verdiende punten (zelfde logica als MatchCard)
- `SuggestionsPanel` verborgen in readOnly
- **Slimme tegel-indicatoren** (RoundSection + Ronde32Section):
  - Correct: oranje randje + groen ✓
  - Incorrect: geen randje + rood ✗
  - Onbekend: geen randje, geen indicatie
  - R32 partieel (land door, maar andere rol): wit randje + oranje ✓

**Nieuwe/gewijzigde bestanden**
- `lib/standings.ts`: `computeStandingsFromResults()` toegevoegd
- `components/matches/StandingsPanel.tsx`: `results` prop; gebruikt nieuwe functie als results aanwezig
- `app/(app)/knockout/page.tsx`: server component laadt `koResults` via `loadKoResults()`
- `app/(app)/knockout/KnockoutClient.tsx`: `koResults` prop doorgegeven aan `Ronde32Section` en `RoundSection`
- `components/knockout/RoundSection.tsx`: `getSlotStatus()` + readOnly props
- `components/knockout/Ronde32Section.tsx`: `getSlotStatusR32()` met partial-logica + readOnly props

### 2026-06-10 — Fase 2 navigatie + poulefase read-only (Claude Code)

- **`lib/config.ts`**: `APP_PHASE` constante (nu `2`); naar `3` zetten voor knock-outfase
- **Fase 2 tabs** in `BottomNav`: Wedstrijden · Landen · Fantasy · Oranje · **Stand** · Chat (vervangt: KO → Landen, Overzicht weg, Stand nieuw)
- **`/stand` pagina** (`app/(app)/stand/page.tsx`): tussenstand ingebakken in app-shell met bottom nav, auto-refresh elke 60 sec, group afgeleid van participant-cookie
- **`middleware.ts`**: `/stand` beveiligd met participant-cookie check
- **Fix poulefase read-only**: `MatchCard` knoppen (toto, uitslag, token +/−, wis) waren na deadline nog klikbaar ondanks de banner — `readOnly=isPast` nu doorgegeven vanuit `PoulefaseClient`; `TotoButtons` krijgt `disabled` prop

### 2026-06-10 — ESPN match IDs groepsfase + deadline gesloten (Claude Code)

- **ESPN event IDs ingevuld**: alle 72 groepsfase-wedstrijden gemapped in `lib/data/espnMatchIds.ts` (IDs 760414–760485) — live-feature is nu volledig operationeel voor speelronde 1 t/m 3
- Script `scripts/fetch_espn_ids.py` toegevoegd om IDs op te halen via ESPN scoreboard API; knock-out IDs (~73–104) aanvullen zodra ESPN ze publiceert (verwacht ~1 jul)
- **Deadline overrides verwijderd**: `deadlineOverride` velden voor Daan (DM), Robert (RA) en Mark (MB) verwijderd uit `lib/participants.ts` — iedereen heeft ingevuld, deur staat voor alle deelnemers dicht (globale deadline 2026-06-09T21:59:00Z)

### 2026-06-10 — ASC bonus-tokens Robert (Claude Code)

- **3 extra scoring-tokens voor RA in ASC-groep**: wedstrijden 10, 33 en 58 (= Nederland-wedstrijden) tellen elk +1 token bij ASC-scoring
- `Participant` interface krijgt optioneel veld `ascBonusTokens?: Record<number, number>`
- RA: `ascBonusTokens: { 10: 1, 33: 1, 58: 1 }` — admin-geconfigureerd, niet door deelnemer instelbaar
- `scoreParticipant` in `lib/scoring.ts` accepteert optionele `ascBonusTokens` parameter; telt de bonus op bij `effectiveTokens` voor de betreffende wedstrijd
- `computeAndSaveScores` in `app/actions/admin.ts` geeft `p.ascBonusTokens` mee bij ASC-run, `undefined` bij OG-run
- Roberts zichtbare tokenbudget (338) en OG-scoring zijn ongewijzigd

### 2026-06-10 — Teamnaam gecentreerd bij meerdere regels (Claude Code)

- `block text-center` toegevoegd aan teamnaam-`<span>` in `FantasyClient.tsx` (leesweergave + eigen view) en `TeamNameEditor.tsx`
- Lange namen zoals "Het bestuur van ASC staat achter Wiger Wijnen" zijn nu gecentreerd over meerdere regels
- Tevens teamnamen ingevuld voor 8 deelnemers via Redis (LV, TdL, MG, BH, RH, DK, PN, AR)

### 2026-06-10 — Token-correctie WS (admin)

- Tokens van Wouter (WS) handmatig gecorrigeerd via `scripts/fix_ws_tokens.mjs`
- Wedstrijden 1–24 → 1 token elk; diverse wedstrijden 25–63 verlaagd (6→5, 5→4, 4→3, 3→2)
- Totaal: 120 poulefase + 221 KO = 341 tokens (exact op budget)
- Correctie: in instructie stond wedstrijd 33, bedoeld was wedstrijd 32 (5→4)

### 2026-06-10 — Deadline-override per deelnemer (Claude Code)

- **Per-deelnemer deadline**: `Participant` interface in `lib/participants.ts` krijgt optioneel veld `deadlineOverride?: string` (ISO UTC)
- Daan (DM) en Mark (MB) krijgen `deadlineOverride: '2026-06-10T15:00:00Z'` (= 17:00 CEST) zodat zij hun invulformulier nog kunnen bijwerken
- `useDeadline.ts` leest `participantInitials` uit Zustand store en gebruikt de participant-specifieke deadline als die aanwezig is — alle call sites ongewijzigd

### 2026-06-09 — Admin voortgangstabel deelnemers (Claude Code)

- **Nieuw tabblad "✅ Voortgang"** toegevoegd aan admin dashboard
- Tabel toont per deelnemer de voortgang op 6 kolommen: Toto (x/72), Uitsl (x/72), Tokens (gebruikt/budget), KO landen (x/63), Fantasy (x/15), Oranje vragen (x/n)
- **Oranje vragen**: telt hoeveel gepubliceerde vragen van andere deelnemers beantwoord zijn (totaal dynamisch per persoon, eigen vraag telt niet mee)
- Kleurcodering: groen = klaar, oranje = deels, grijs = niet begonnen, rood = tokens over budget
- Lazy loading via knop + herlaad-knop; horizontaal scrollbaar op smalle schermen
- Nieuwe server action `loadVoortgang` in `app/actions/admin.ts`

### 2026-06-09 — Token bugfix ASC-bonus + deadline 23:59 (Claude Code)

- **ASC bonus tokens niet meegeteld**: `useTokenBudget` had een hardcoded `EXTRA_TOKENS`-map die alleen OG-deelnemers bevatte; ASC-deelnemers (JS/CV/BV/AR/MB/JH/JK/NS/PN/CB/DK/WW/VH) kregen daardoor budget 335 i.p.v. 341 — zij zagen 6 tokens "over" maar konden die niet inzetten. Fix: map vervangen door `PARTICIPANTS.find(...)` uit `lib/participants.ts` (single source of truth)
- **Deadline bijgewerkt van 17:00 naar 23:59**: `useDeadline.ts`, `DeadlineBanner.tsx` (2x), `leaderboard/page.tsx` en `OnboardingSlides.tsx` bijgewerkt

### 2026-06-09 — Token bugfix: overspending hersteld en geblokkeerd (Claude Code)

**Diagnose & fix van token-overspending door 6 OG + 5 ASC deelnemers**

- **Grondoorzaak gevonden**: `useTokenBudget` gebruikte `pred.tokens ?? 0` terwijl de UI `pred.tokens ?? 1` toont — deelnemers zagen meer ruimte dan er was, waardoor de banner overspending niet correct signaleerde
- **Fix**: `?? 0` → `?? 1` in `useTokenBudget.ts` (poule-berekening) én `loadAllTokenUsage` (admin-diagnostiek); export-route was al correct
- **Admin diagnose-tab**: Nieuwe "🪙 Tokens" tab in admin toont per deelnemer: budget, poule tokens, KO picks, totaal ingezet, over/onder — gesorteerd van meest over naar minst
- **TokenBanner**: Toont nu rood kader + `"X te veel — verlaag je tokens"` bij negatief restbudget; balk kleurt rood
- **Blokkering bij remaining ≤ 0**: `+` knop uitgeschakeld in `MatchCard` (groepsfase), `Ronde32Section` (w1/w2/w3 TokenSteppers) en `RoundSection` (KO-rondes) — verlaging blijft altijd mogelijk
- **initials in store**: `participantInitials` opgeslagen in Zustand store via `GlobalDataLoader` — `useTokenBudget()` werkt nu zonder prop-drilling vanuit elk component

### 2026-06-09 — Deadline poule vastgesteld (admin)

- Deadline deelnemers: 2026-06-09 23:59
- Deadline admin (RA): 2026-06-10 — nog veel voorbereidend adminwerk te doen

### 2026-06-09 — Quoteringen bijgewerkt (260609) (Claude Code)

- `npm run update_quoteringen` uitgevoerd: 72 wedstrijden + 48 landen KO-outrights bijgewerkt
- 46 wedstrijden met gewijzigde match-quotes; 32 landen met gewijzigde KO-quotes

### 2026-06-09 — WK-selectiewijzigingen n.a.v. nieuwe FIFA PDF (260609) (Claude Code)

**WK-selectiewijzigingen n.a.v. nieuwe officiële FIFA PDF (6 landen)**
- `lib/data/wkOfficialSquads.ts` + `lib/data/players.ts` bijgewerkt:
  - **Brazilië**: WESLEY (DF) vervangen door EDERSON SILVA (MF, dob 1999-07-07, id 266866)
  - **Ghana**: ISSAHAKU Fatawu → FATAWU Abdul (zelfde speler, naamspresentatie FIFA; dob ongewijzigd)
  - **Irak**: AHMED YAHYA (DF) vervangen door AHMED MAKNAZI (DF, dob 2001-09-24); nieuw toegevoegd als id 999999 in players.ts
  - **Jordanië**: IBRAHIM SABRA (FW) vervangen door MOHAMMAD ABUGHOUSH (MF, dob 2005-07-13); nieuw toegevoegd als id 999998 in players.ts
  - **Algerije**: TITRAOUI geboortedatum gecorrigeerd: 2003-08-26 → 2003-07-26
  - **Paraguay**: AVALOS Gabriel geboortedatum gecorrigeerd: 1990-10-12 → 1991-07-09
- **NED Timber-tweeling fix**: `sofifaId: 251806` toegevoegd aan TIMBER Quinten — voorkomt dat J. Timber (verwijderd) nog een vinkje toont via DOB-match
- Controle: alle 48 landen hebben nog exact 26 spelers

### 2026-06-09 — Features: ESPN auto-import, klikbare links in chat, WK-selectie Nederland gewijzigd (Claude Code)

**ESPN auto-import in admin (optie 1)**
- Nieuwe API route `app/api/admin/espn-import/route.ts`: haalt ESPN-data op voor een wedstrijd (auth-beveiligd, no-cache), mapt spelernamen via `WK_PLAYERS.middleName`/`fullName`, geeft uitslag + doelpuntenmakers/assists terug
- 📡 knop in elke `MatchResultRow` (verschijnt zodra `ESPN_MATCH_IDS[matchId]` is ingevuld)
- Inline preview panel: uitslag, toto, gematchte spelers (met intern naam + land), ongematchte spelers apart in rood
- "Uitslag overnemen" → vult toto/uitslag-velden in; "Fantasy stats toevoegen" → mergt delta in cumulatieve `fantasy_stats` KV
- Werkt in zowel het Uitslagen-tab als KO Wedstrijden-tab

**Klikbare links in chat**
- `components/chat/ChatMessage.tsx`: `renderMessageText()` helper splitst tekst op URLs (`https?://...`) én `@mentions`
- URLs worden als `<a target="_blank">` gerenderd; styling past bij berichtkleur (wit bij eigen, oranje bij anderen)

**WK-selectie Nederland: Timber → Geertruida**
- `lib/data/wkOfficialSquads.ts`: `TIMBER Jurrien` vervangen door `GEERTRUIDA Lutsharel` (dob: 2000-07-18)
- `scripts/wk_override_ids.txt`: ID 251805 → 241187

### 2026-06-08 — Fix: Fantasy squad hydratatie bij laden (stale KV data) (Claude Code)

**Probleem:** De KV store slaat volledige Player-objecten op (inclusief `leagueId`, `league`, `club`). Na een spelerstransfer die in `players.ts` werd bijgewerkt, bevatte het opgeslagen squad verouderde data — waardoor validatie foutief een competitie-overtreding meldde.

**Oplossing in `app/actions/fantasy.ts`:**
- Bij `loadFantasy()` worden alle Player-objecten nu gehydrateerd vanuit `WK_PLAYERS` op basis van `player.id`
- `PLAYER_BY_ID` lookup-map aangemaakt als module-level constante
- `hydrateSquad()` helper: per slot opzoeken in current `WK_PLAYERS`; onbekende spelers (niet meer in lijst) vallen terug op opgeslagen data
- Resultaat: validatie en weergave gebruiken altijd actuele club/league/leagueId, ook als squad vóór een transfer werd opgeslagen

### 2026-06-08 — Chat uitbreidingen: verwijderen/bewerken, wedstrijdberichten, leesbevestiging, kopiëren, vastzetten (Claude Code)

**Verwijderen + bewerken van eigen berichten**
- Long-press menu toont acties per berichttype: 📋 Kopiëren, ✏️ Bewerken (tekst), 📌 Vastzetten (admin), 🗑️ Verwijderen (eigen of admin)
- Verwijderd bericht toont "Bericht verwijderd" (context van replies intact)
- Bewerken: banner + pre-gevuld tekstvak, na opslaan staat "(bewerkt)" achter de timestamp
- `lib/types/chat.ts`: `deleted?`, `editedAt?`, `pinned?` toegevoegd; type `'system'` toegevoegd
- `lib/kv/chat.ts`: `chatUpdateMessage`, `chatDeleteMessage`, `chatSetPinned`, `chatGetPinned`, `chatSetRead`, `chatGetReadMap` toegevoegd; generieke `chatReplaceMessage` helper
- `app/api/chat/messages/route.ts`: PATCH (bewerken + vastzetten) en DELETE endpoints toegevoegd; GET geeft ook `pinnedMsgId` en `readMap` terug
- `app/api/chat/read/route.ts`: nieuw — GET + POST voor read receipts

**Automatische wedstrijdberichten**
- Bij opslaan van een nieuw wedstrijdresultaat in de admin → automatisch een systeem-bericht in beide groepen (`og` + `asc`)
- Weergegeven als gecentreerde pill: `⚽ **Nederland – Argentinië**: 2–1`
- `app/actions/admin.ts`: `saveResult` post bot-bericht bij nieuwe eindstanden

**Leesbevestiging**
- Eigen berichten tonen "Gezien door Naam1, Naam2" als anderen het gelezen hebben
- Read receipts opgeslagen in Redis per deelnemer/groep; gepolld elke ~30 sec

**Vastzetten (admin)**
- Admin kan bericht vastzetten via long-press menu → banner bovenaan de chat
- Admin kan losmaken via ✕ in de banner

**ChatInput edit-mode**
- `editingMsg` prop + banner "Bericht bewerken"; annuleren via ✕ of versturen slaat op
- `components/chat/ChatInput.tsx`, `components/chat/ChatPage.tsx`, `components/chat/ChatMessage.tsx`: alle props en handlers bijgewerkt

---

### 2026-06-08 — Chat icoon vervangen (Claude Code)

Navigatie-icoon voor de chat-tab vervangen door custom SVG (drie cirkels in een spreekballon).

- `components/icons/NavIcons.tsx`: `IconChat` — nieuw SVG-pad op basis van `icon-chat.svg`, `viewBox` aangepast naar `0 0 91.23 91.32`, `fill="currentColor"` zodat actief/inactief kleuren behouden blijven.

---

### 2026-06-08 — Export tokens fix + chat upload error handling + Vercel Blob geconfigureerd (Claude Code)

**Bugfix: tokens ontbraken in export bij standaardwaarde (1)**

Deelnemers die de tokenschuifregelaar niet aanpassen laten `tokens: null` in de store staan. De UI toont dit als `1` via `pred.tokens ?? 1`, maar de export schreef niks naar kolom B en de scoring sloeg deze voorspellingen volledig over.

- `app/api/export/route.ts`: `if (pred.tokens != null) cv(...)` → `cv(pouleSheet, \`B${row}\`, pred.tokens ?? 1)` — schrijft altijd de effectieve tokenwaarde.
- `lib/scoring.ts`: `!pred.tokens` → `effectiveTokens = pred.tokens ?? 1` — voorspellingen met null-tokens worden nu correct gescoord met 1 token.

**Chat: zichtbare foutmelding bij mislukte foto-upload**

Fouten in `onSendImage` werden stilzwijgend geslikt — de gebruiker zag niets als de upload mislukte.

- `components/chat/ChatInput.tsx`: `try/finally` uitgebreid met `catch` → rode foutbanner boven de inputbalk, verdwijnt na 5 seconden.
- `app/api/chat/upload/route.ts`: `put()` gewrapped in try/catch → geeft nu een leesbare foutmelding terug als de Blob-upload faalt.

**Vercel Blob store aangemaakt en gekoppeld**

De root cause van het niet kunnen versturen van afbeeldingen: `BLOB_READ_WRITE_TOKEN` ontbrak in de Vercel-projectconfiguratie. Blob store `panenka-blob` aangemaakt (regio FRA1, Public) en `BLOB_READ_WRITE_TOKEN` + `BLOB_STORE_ID` toegevoegd als environment variables.

---

### 2026-06-07 — KO bugfix: alle landenpickers omgezet naar verticale grid (Claude Code)

**Bugfix: landenpickers R16 t/m Winnaar waren onbruikbaar op sommige apparaten**

Dezelfde horizontale scroll-bug als bij W3 zat ook in de pickers voor R16, kwartfinale, halve finale, finale en winnaar (`RoundSection.tsx`). Omgezet naar dezelfde verticale grid-oplossing.

- `components/knockout/RoundSection.tsx`: `CountryPicker` — `overflow-x-auto flex` → `overflow-y-auto max-h-64 grid grid-cols-4`; button-grootte van `w-[72px] h-[72px] flex-shrink-0` → `aspect-square`.

---

### 2026-06-07 — KO bugfix: W3 landenpicker toont nu alle 48 landen (Claude Code)

**Bugfix: beste nummers 3-picker was onbruikbaar op mobiel**

Deelnemers zagen bij het kiezen van "Beste nummers 3" slechts 4 landen in plaats van alle 48. Oorzaak: de picker gebruikte een horizontale flex-scroll (`overflow-x-auto`), waardoor op een mobiel scherm (~375px) precies 4 landen naast elkaar pasten. iOS onderschept touch-events voor de pagina-scroll, waardoor de horizontale scroll in de picker niet werkte.

Opgelost door de picker om te bouwen naar een verticaal scrollbare 4-koloms grid (`grid grid-cols-4` + `overflow-y-auto max-h-64`), consistent met de W1/W2-pickers.

- `components/knockout/Ronde32Section.tsx`: `W3CountryPicker` — `overflow-x-auto flex` → `overflow-y-auto max-h-64 grid grid-cols-4`; button-grootte van `w-[72px] h-[72px] flex-shrink-0` → `aspect-square`.

---

### 2026-06-07 — Chat: Enter = nieuwe regel + foto upload fix iOS/Android + quoteringen bijgewerkt (Claude Code)

**Chat input: Enter gedrag gewijzigd**

Enter maakte voorheen direct een bericht aan. Nu springt Enter naar een nieuwe regel en verstuurt Shift+Enter (of de verzendknop) het bericht. De `enterKeyHint` is ook aangepast van `"send"` naar `"enter"` zodat mobiele toetsenborden de juiste hint tonen.

- `components/chat/ChatInput.tsx`: `handleKeyDown` — conditie omgedraaid van `!e.shiftKey` naar `e.shiftKey`; `enterKeyHint` aangepast.

**Chat: foto versturen gerepareerd op iOS en Android**

Op zowel iOS als Android kon je een foto selecteren maar werd er niets verstuurd. Oorzaak: `display: none` op het verborgen `<input type="file">` onderdrukt het `change` event op mobiele browsers nadat de gebruiker een foto kiest. Opgelost door het element off-screen te positioneren in plaats van te verbergen.

- `components/chat/ChatInput.tsx`: `openFilePicker()` — `display: none` vervangen door `position: fixed; top: -200px; left: -200px; opacity: 0; pointerEvents: none`; `onchange` vervangen door `addEventListener('change', ...)`.

**Quoteringen bijgewerkt via `npm run update_quoteringen`**

- `lib/data/odds.ts` + `lib/data/odds_trends.ts`: 72 groepswedstrijden bijgewerkt, 44 gewijzigd t.o.v. vorige run.
- `lib/data/knockoutQuotes.ts` + `lib/data/knockoutQuotes_trends.ts`: 48 landen bijgewerkt, 18 gewijzigd t.o.v. vorige run.

---

### 2026-06-05 — WK-spelersdata compleet: 1248/1248 vinkjes (Claude Code)

**Alle 1.248 officiële WK-spelers hebben nu een vinkje in de Fantasy XV-selector.**

**Wat er gedaan is**

- **315 nieuwe spelers toegevoegd** aan `lib/data/players.ts` (250 + 49 + 16 fixes + correcties): totaal van 5.779 naar 6.094 spelers.
- **16 spelers gecorrigeerd**: land of geboortedatum klopte niet (bijv. Bonny stond als "Frankrijk" i.p.v. "Ivoorkust", Qatar-spelers hadden transposities in de dob). Allemaal gefixed zodat de WK-check aansluit.
- **19 spelers toegevoegd vanuit bronbestand** die ontbraken maar er wel in zaten.
- **2 spelers handmatig toegevoegd**: Hussein Ali (252736, Irak) en Amer Jamous (15694223, Jordanië) — beide gevonden in master Excel.
- **wkSquadCheck.ts herschreven** met `sofifaId`-logica: bij gelijke `dob|country` (twee verschillende spelers, zelfde verjaardag + land) wordt de juiste speler via sofifaId geïdentificeerd. 15 entries in `wkOfficialSquads.ts` voorzien van `sofifaId`.
- **9 datafouten opgelost**: dubbele player_ids verwijderd, verkeerde landen gecorrigeerd (o.a. Benarous van Jordanië naar Engeland), dob-correcties.
- **Al Owais (210923)** stond twee keer in de database — verkeerd duplicaat verwijderd.
- **Irak gefix via sofifaId**: HUSSEIN ALI en ALI ALHAMADI deelden dob 2002-03-01; beide voorzien van sofifaId zodat ze elk apart worden herkend → Irak 26/26.

**Eindstand**

| | Aantal |
|---|---|
| Totaal spelers in app | 6.094 |
| WK-spelers met vinkje | 1.248 / 1.248 |
| Landen volledig (26/26) | 48 / 48 |

**Nieuwe scripts (in `scripts/`)**

`import_players_250.py`, `import_players_49.py`, `fix_and_add_35.py`, `fix_duplicates.py`, `fix_9_duplicates.py`, `fix_benarous.py`, `fix_dob_corrections.py`, `add_irak_jordan_players.py`, `check_wk_coverage.py`, `find_missing_wk_players.py`, `write_leagues.py`

---

### 2026-06-05 — Geautomatiseerde sofifa-scraper voor ontbrekende WK-spelers (Claude Code)

**299 ontbrekende WK-spelers verwerkt via sofifa.com squad-pagina's en officiële FIFA PDF.**

**Aanpak**

Tweedelig proces: (1) sofifa.com scrapen voor player-IDs en basisdata, (2) DOB + club verrijken vanuit de officiële FIFA PDF.

**Nieuwe bestanden**

- `scripts/fetch_sofifa_squads.py` — Python-script dat squad/team-pagina's van sofifa.com scrapet voor 36 WK-landen. Naam-matching in drie lagen:
  - *Exacte match* op genormaliseerde woorden (zonder diacritics, volgorde-onafhankelijk)
  - *Fuzzy match* via `difflib.SequenceMatcher` — handelt afgekorte voornamen (`A. Amanov`), Arabische Al-prefixen (`ALDAWSARI` → `Al Dawsari`), gesplitste namen (`Wi Je Cho`) en kleine transliteratieverschillen af
  - *DOB-match* als fallback voor spelers die al in `players.ts` zitten maar niet op naam matchen
  - Deduplicatie: elke sofifa-ID wordt maar één keer toegewezen (greedy op hoogste confidence)
- `scripts/enrich_from_pdf.py` — parseert de officiële FIFA PDF (`docs/reference/SquadLists-English.pdf`, 1.248 spelers) en koppelt DOB (YYYY-MM-DD) en club aan alle spelers via exacte fifa_name matching.

**Resultaten scraper**

| Tabblad | Aantal |
|---|---|
| Gevonden (zekere matches) | 197 |
| Beste gok (fuzzy, ter review) | 63 |
| Niet gevonden | 39 |

Tussenresultaat opgeslagen in `scripts/sofifa_found_players.xlsx` met tabbladen *Gevonden*, *Beste gok*, *Niet gevonden* en *Totaal* (handmatig samengesteld). Alle 299 spelers in de *Totaal*-tab zijn voorzien van DOB en club vanuit de PDF (299/299 gematcht).

**Openstaand (volgende sessie)**

- `name`/`fullName` controleren (soms identiek, fullName ontbreekt soms)
- `league` en `leagueId` invullen voor handmatig toegevoegde spelers
- Import-script schrijven om goedgekeurde rijen toe te voegen aan `lib/data/players.ts`

---

### 2026-06-04 — Geboortedatum fixes WK-selectiecheck (Claude Code)

8 spelers hadden een verkeerde geboortedatum in `lib/data/players.ts`, waardoor ze als "niet in WK-selectie" werden gemarkeerd terwijl ze er wel in zitten. De matchinglogica in `lib/wkSquadCheck.ts` werkt op `dob|country`, dus een kleine typfout in de datum is genoeg om de check te laten falen.

**Gecorrigeerde spelers:**

| ID | Speler | Land | Was | Nu |
|----|--------|------|-----|----|
| 259480 | I. Saibari | Marokko | 2001-07-18 | 2001-01-28 |
| 228092 | S. Berge | Noorwegen | 1998-02-18 | 1998-02-14 |
| 273651 | J. Quansah | Engeland | 2003-01-28 | 2003-01-29 |
| 277975 | P. Guiagon | Ivoorkust | 2001-02-20 | 2001-02-22 |
| 73456 | Š. Chaloupek | Tsjechië | 2003-03-01 | 2003-03-08 |
| 213884 | R. Christie | Schotland | 1995-02-12 | 1995-02-22 |
| 222429 | A. Cubas | Paraguay | 1996-05-22 | 1996-05-11 |
| 73348 | Y. Titraoui | Algerije | 2003-07-26 | 2003-08-26 |

Gevonden via systematische vergelijking van alle spelers in een WK-selectieland tegen de FIFA-data in `wkOfficialSquads.ts`: match op exacte achternaam + zelfde jaar + datumverschil ≤ 60 dagen.

---

### 2026-06-04 — KO-wedstrijden toto/uitslag voorbereid + quoteringen bijgewerkt (Claude Code)

**KO-wedstrijden toto/uitslag volledig voorbereid (nog niet zichtbaar voor deelnemers).**

De 32 KO-wedstrijden (matchId 73–104) krijgen een eigen toto/uitslag-systeem naast het bestaande KO-landen systeem. Alles is gebouwd en klaarstaand; de deelnemers-UI wordt geactiveerd zodra de poulefase is afgerond en de teams bekend zijn.

**Scoremodel**
- `lib/scoring.ts` — `ScoreBreakdown` uitgebreid met `koWedstrijden` en `oranjeTokens`. KO-wedstrijden scoren via dezelfde formule als de poulefase: `tokens × toto_quote` + `tokens × uitslag_quote` (stand na 90 minuten). Oranje telt **niet** meer mee in het totaal — het levert bonus tokens op.
- `scoreOranjeTokens()` toegevoegd: `ceil(correct × 0.5)` tokens per deelnemer.
- `app/leaderboard/types.ts` — `ParticipantScore` uitgebreid met `koWedstrijden` en `oranjeTokens`.
- `app/leaderboard/page.tsx` — backward-compatible fallback voor opgeslagen scores zonder nieuwe velden.

**Data**
- `lib/data/koMatchOdds.ts` — nieuw leeg odds-bestand voor KO-wedstrijden, gevuld door scraper.
- `components/matches/ScorePicker.tsx` — valt terug op `KO_MATCH_ODDS` voor matches 73–104.

**Token budget**
- `hooks/useTokenBudget.ts` — groepsfase (1–72) en KO-wedstrijden (73–104) gesplitst. Nieuw: `useKoMatchBudget(oranjeTokens)` — 50 basis tokens + Oranje bonus.

**Admin**
- `app/actions/admin.ts` — `loadKoMatchTeams` / `saveKoMatchTeams` (KV-key `ko_match_teams`). `computeAndSaveScores` berekent en slaat `koWedstrijden` en `oranjeTokens` op.
- `app/actions/predictions.ts` — `loadKoMatchTeamsPublic` en `loadMyOranjeTokens` toegevoegd.
- `app/admin/page.tsx` + `AdminClient.tsx` — nieuw tabblad "KO Wedstrijden": per ronde (rv32→finale) teams invoeren en uitslagen na 90 min registreren. Scorestabel toont `koWedstrijden` en Oranje-tokens.

**Scraper**
- `scripts/scrape-ko-match-odds.mjs` — Unibet/Kambi scraper voor KO-wedstrijden. Leest teams uit `scripts/ko-match-teams.json` (aan te maken per blok na de poulefase), mergt met bestaande entries, schrijft naar `lib/data/koMatchOdds.ts`.

**Deelnemer-UI (klaar, nog verborgen)**
- `components/matches/KoMatchCard.tsx` — match card voor KO-wedstrijden (toto + uitslag, budget-bewust).
- `app/(app)/knockout/KnockoutClient.tsx` — voorbereid voor twee hoofd-tabs (Landen / Wedstrijden); Wedstrijden-tab nu verborgen tot na de poulefase.

**Quoteringen bijgewerkt**
- 72 groepswedstrijden bijgewerkt (39 met gewijzigde quote t.o.v. gisteren).
- KO-outright quotes bijgewerkt (11 landen gewijzigd).

---

### 2026-06-04 — Matchday admin per groep + assists in live slide (Claude Code)

**Admin matchday tab gesplitst per OG/ASC groep.**

De matchday input-tab volgde al de OG/ASC-toggle, maar toonde altijd beide groepen tegelijk. Nu worden quotes en pot stand apart per groep opgeslagen en getoond: wie in OG-modus zit vult alleen OG-data in, ASC idem. Backward compatible: bestaande configs met gedeelde `quotes` werken als fallback.

**Gewijzigde bestanden**

- `lib/matchday.ts` — `MatchdayConfig` uitgebreid: `og.quotes` + `asc.quotes` per groep; helper `getGroupQuotes()` toegevoegd; legacy `quotes?` blijft als fallback.
- `app/api/matchday/[id]/route.ts` — POST accepteert `{ group, quotes, potStand }` en merget alleen de actieve groep in de bestaande config.
- `app/api/matchday/[id]/full/route.ts` — resolved groep-specifieke quotes vóór teruggave aan de client.
- `app/api/matchday/live/route.ts` — gebruikt `getGroupQuotes()` voor groep-specifieke inzet-quotes.
- `app/admin/AdminClient.tsx` — `MatchdayAdminTab`: één pot stand input (actieve groep), quotes per groep, toto van de dag alleen actieve groep.
- `components/matchday/MatchdayDrawer.tsx` — defensief `?? []` bij `config.quotes`.

**InzetSlide: '×' toegevoegd in uitslag-kolom**

Onder de `€ 1,00` rij staat nu ook een `×` in de uitslag-kolom (alleen de bovenste, niet tussen wedstrijden).

- `components/matchday/slides/InzetSlide.tsx`

**LiveSlide: assists zichtbaar in goals-samenvatting en timeline**

Assists worden gekoppeld aan het bijbehorende doelpunt op minuut + team. Onder elke doelpuntenmaker verschijnt `↳ [naam]` in kleinere grijze tekst.

- `lib/types/matchday.ts` — `LiveGoalEvent` uitgebreid met `assister?: string`.
- `app/api/matchday/live/route.ts` — twee-pass extractie: assisters per minuut/team verzamelen, dan koppelen aan goals.
- `components/matchday/slides/LiveSlide.tsx` — goals-samenvatting en timeline tonen assist-regel wanneer aanwezig.

---

### 2026-06-03 — 44 ontbrekende WK-spelers toegevoegd: Bosnië en Herzegovina + Saoedi-Arabië (Claude Code)

**Eerste batch van handmatig opgezochte sofifa-data verwerkt.**

`build_players.ps1` uitgebreid zodat het naast het hoofdbestand ook automatisch `scripts/wk_not_in_excel.xlsx` inleest. Alle datasheets worden verwerkt (de eerste summarytab "WK Missing Players" wordt overgeslagen). Duplicaten op basis van player_id worden automatisch gefilterd. Het bestand mag open staan in Excel tijdens de build (shadow-copy via `FileShare.ReadWrite`).

**Gewijzigde bestanden**

- `scripts/build_players.ps1` — extra sectie toegevoegd die `wk_not_in_excel.xlsx` inleest; alias `'Bosnië en Herzegovina'` toegevoegd aan nat-lookup; `Add-Type` verplaatst naar het begin zodat `ZipFile` altijd beschikbaar is.
- `lib/data/players.ts` — **5.722 → 5.766 spelers** (+44):
  - Tabblad `BIH`: 20 spelers Bosnië en Herzegovina (o.a. Džeko, Demirović, Kolašinac, Dedić)
  - Tabblad `SAU`: 24 spelers Saoedi-Arabië (o.a. S. Al Dawsari overall 82, Abdulhamid, Al Juwair)

**Nieuw bestand**

- `scripts/fetch_sofifa_missing.ps1` — script voor geautomatiseerde sofifa.com lookup (naam → DOB-match → data-extractie). Momenteel geblokkeerd door Cloudflare-protectie op sofifa.com; staat klaar voor later gebruik.

**Werkwijze voor volgende batches**

Vul sofifa-data in de relevante tabblade(n) van `scripts/wk_not_in_excel.xlsx`, run daarna `scripts/build_players.ps1`. Geen andere stappen nodig.

**Openstaande landen (deel van de 362 ontbrekende spelers)**

Irak (~24), Jordanië (~24), Iran (~16), Egypte (~21), Haïti (~16), Curaçao (~20), Oezbekistan (~20), en kleinere groepen uit Algerije, Australië, Ecuador, Ghana, Japan, Kaapverdië, etc.

---

### 2026-06-03 — WK-selecties verwerkt + squad-validatie badges (Claude Code)

**Officiële WK-selecties (48 landen × 26 spelers) verwerkt in de app.**

**Nieuwe bestanden**

- `lib/data/wkOfficialSquads.ts` — volledige officiële WK 2026-selecties (1.248 spelers), geëxtraheerd uit het FIFA-PDF. Per speler: `fifaName`, `position`, `dob`. Landnamen in het Nederlands.
- `lib/wkSquadCheck.ts` — utility `getWKSquadStatus(player)` → `'confirmed' | 'not_in_squad' | 'unknown'`. Matching op DOB + land (O(1) Set-lookup).
- `scripts/find_wk_gaps.ps1` — cross-referentie PDF vs `players.ts`. Resultaat: 886/1.248 gevonden, 362 ontbrekend. Output: `scripts/wk_gaps_result.md`.
- `scripts/check_excel_gaps.ps1` — checkt ontbrekende spelers in het Excel-bronbestand (geen overall-filter). Resultaat: 51 gevonden (overall < 68), 299 afwezig in sofifa-data.
- `scripts/export_missing_to_excel.ps1` — exporteert missing-lijst naar `wk_not_in_excel.xlsx`.
- `scripts/wk_excel_override_ids.txt` — 51 sofifa-IDs die altijd meegenomen worden.
- `scripts/wk_not_in_excel.xlsx` — 299 spelers voor handmatige sofifa.com lookup (volgende stap).

**Gewijzigde bestanden**

- `scripts/build_players.ps1` — `$WKOverrideIds` parameter toegevoegd; IDs uit `wk_excel_override_ids.txt` worden meegenomen ongeacht overall-drempel.
- `lib/data/players.ts` — herbouwd: **5.684 → 5.722 spelers** (+38 nieuwe WK-spelers met overall < 68).
- `components/fantasy/PlayerRow.tsx` — WK-selectie badge naast spelersnaam: ✓ groen (bevestigd), ⚠ oranje (niet in selectie).
- `components/fantasy/PlayerModal.tsx` — zelfde badge in de spelerskeuze-lijst.

**Openstaande stap (volgende sessie)**

`scripts/wk_not_in_excel.xlsx` bevat 299 spelers die volledig afwezig zijn in de sofifa-dataset. Grootste groepen: Bosnië en Herzegovina (26), Saoedi-Arabië (26), Irak (~22), Jordanië (~24), Iran (~22), Oezbekistan (~20). Gegevens ophalen via sofifa.com en toevoegen aan `players.ts`.

---

### 2026-06-03 — 3 spelers toegevoegd + quoteringen bijgewerkt (Claude Code)

**Fantasy XV — 3 spelers handmatig toegevoegd aan `lib/data/players.ts`**

Drie spelers handmatig toegevoegd vanuit het bronbestand (`260603_WK 2026_Master.xlsx`, tabblad `sofifa_260421_output_RH_WK_land`):

| ID | Naam | Overall | Land | Club | Positie(s) |
|---|---|---|---|---|---|
| 190871 | Neymar Jr. | 83 | Brazilië | Santos | CM, CAM, LW, ST |
| 184200 | M. Arnautović | 77 | Oostenrijk | FK Crvena zvezda | ST |
| 83494 | Rayan | 76 | Brazilië | AFC Bournemouth | RM, RW, ST |

**Quoteringen bijgewerkt via `npm run update_quoteringen`**

- `lib/data/odds.ts` + `lib/data/odds_trends.ts`: 72 wedstrijden bijgewerkt, 23 gewijzigd t.o.v. vorige run.
- `lib/data/knockoutQuotes.ts` + `lib/data/knockoutQuotes_trends.ts`: 48 landen bijgewerkt, 11 gewijzigd t.o.v. vorige run.

### 2026-06-02 — Chat: favoriete emoji's onthouden in picker (Claude Code)

De emoji-picker onthoudt nu welke emoji's de gebruiker het meest gebruikt en toont deze bovenaan bij het openen.

- `components/chat/EmojiGifPanel.tsx`: gebruiksfrequentie bijgehouden in `emojiFreq` state (`Record<string, number>`), geladen vanuit en opgeslagen in `localStorage` onder sleutel `chat-emoji-freq`. Bij elke emoji-selectie via `handleSelectEmoji()` telt de teller op. Op basis van de frequentie worden maximaal 24 emoji's gesorteerd als `favoriteEmojis`. Zolang er geen zoekterm is ingetypt verschijnt een "Favorieten" sectie als eerste groep bovenaan de emoji-lijst; bij een actieve zoekopdracht verdwijnt die sectie en zijn alleen de zoekresultaten zichtbaar.

### 2026-06-01 — Deelnemer Thomas (TWo) verwijderd + bugfix toernooischema w3 (Claude Code)

**Deelnemer Thomas (TWo) verwijderd uit ASC**

Thomas heeft besloten niet mee te doen. Verwijderd uit alle relevante bestanden.

- `lib/participants.ts`: entry `Thomas / TWo` verwijderd.
- `lib/groups.ts`: `TWo` verwijderd uit `GROUP_MEMBERS.asc`. ASC telt nu 15 deelnemers.
- `app/api/export/route.ts`: `TWo` verwijderd uit `POULE_SHEET_ASC` en `FT_SHEET_ASC`.

**Bugfix: toernooischema bracket-weergave toonde landen dubbel**

De bracket-weergave (`ScheduleView`) berekende de w3-slots (beste nummers 3) opnieuw uit de groepsfase-voorspellingen, terwijl hij die gewoon uit de opgeslagen w3-picks had moeten halen — net zoals hij dat doet voor w1 en w2. Door het gebruik van twee onafhankelijke databronnen kon hetzelfde land tegelijk als w1/w2 (handmatig gekozen) én als w3 (herberekend) in de bracket verschijnen.

Fix: `computeW3Map(predictions)` vervangen door `computeW3MapFromPicks(knockoutPicks)`. De nieuwe functie leest `w3_0` t/m `w3_7` uit de opgeslagen picks, zoekt per land de bijbehorende poulegroep op via `GROUP_TEAMS`, en past daarmee de FIFA-verdeelsleutel toe. De knop "Stel alles in op basis van suggesties" in `SuggestionsPanel` is niet gewijzigd — die berekent nog steeds correct de beste nummers 3 op basis van groepsfase-uitslagen en slaat ze op in de w3-slots.

- `components/knockout/ScheduleView.tsx`: `computeW3Map` + imports (`Prediction`, `computeStandings`, `POULES`) vervangen door `computeW3MapFromPicks` + `GROUP_TEAMS`; `predictions` store-selector verwijderd; `w3Map` useMemo bijgewerkt.

### 2026-06-01 — Chat: notificatiebel toggle + reply-preview visueel samengevoegd met ballon (Claude Code)

**Notificatiebel — toggle aan/uit**

De bel-knop in de chat-header schakelde notificaties wel in maar kon ze niet meer uitschakelen. Opgelost door de abonnementsstatus bij te houden in `isSubscribed` (gebaseerd op `pushManager.getSubscription()`) in plaats van `Notification.permission`. Een tweede klik op de bel roept nu `disableNotifications()` aan: de push-subscription wordt via de browser uitgeschreven en verwijderd via `DELETE /api/push/subscribe`.

- `components/chat/ChatPage.tsx`: `notifStatus` state vervangen door `isSubscribed`; `disableNotifications()` toegevoegd; `handleBellClick` togglet nu op basis van `isSubscribed`; knop-tooltip bijgewerkt naar "Notificaties aan — klik om uit te zetten".

**Reply-preview — zelfde breedte als ballon + naadloos visueel blok**

Reply-preview en berichtballon hadden elk een onafhankelijke breedte. Nu zitten ze samen in een inner wrapper (`flex flex-col max-w-full`) waardoor de breedste van de twee de breedte van beide bepaalt. Bovendien sluiten ze visueel naadloos op elkaar aan: geen afronding op de aangrenzende hoeken en geen bottom-padding op de preview.

- `components/chat/ChatMessage.tsx`: inner wrapper toegevoegd om reply-preview en swipeable bubble; reply-preview `rounded-lg` → `rounded-t-lg`, `py-1` → `pt-1 pb-0`, `mb-1` en kantmarge verwijderd; ballon conditioneel `rounded-tl-none rounded-tr-none` wanneer `msg.replyTo` aanwezig is.

### 2026-06-01 — Oranje vragen: nieuwe antwoordtypes + dual-group (WS/RA) + admin vraag bewerken (Claude Code)

**Nieuwe antwoordtypes:**
- `aantal_marge` — Aantal 0–22 met marge ±1; zelfde stepper-UI als `exact_aantal`, badge "±1" zichtbaar voor de deelnemer.
- `decimaal` — Getal 0.00–20.00 met marge ±0.33; −½/+½ stapknoppen + vrij invoerveld (step 0.01).
- `links_rechts` — Twee knoppen Links / Rechts.
- `speler_beide` — Eén dropdown met spelers van beide teams (optgroups NL + tegenstander).
- "Geen" toegevoegd als eerste keuze bij `speler_nl`, `speler_opp` en `speler_beide` (zowel deelnemer als admin).

**Dual-group (Wouter WS / Robert RA):**
- `saveOranjeVraag` slaat bij indiening automatisch op in zowel OG als ASC.
- `OranjeClient` toont een OG/ASC toggle voor dual-group users; bij wisseling herladen vragen én antwoorden voor de gekozen groep; antwoorden worden per groep apart opgeslagen.
- Nieuwe server actions: `loadOranjeVragenForGroup`, `loadOranjeAntwoordenForGroup`, `saveOranjeAntwoordenForGroup`.

**Admin vraag bewerken:**
- ✏️-knop naast elke ingediende vraag; klik opent inline textarea + Opslaan/Annuleer. Publiceer-knop blijft zichtbaar voor andere vragen.

### 2026-06-01 — Oranje vragen: antwoordtype 'Exact aantal (0–22)' + admin type-override voor alle vragen (Claude Code)

Nieuw antwoordtype `exact_aantal` toegevoegd voor vragen waarbij een getal tussen 0 en 22 het antwoord is (bijv. aantal doelpunten, schoten etc.). Tevens is de admin type-override dropdown nu zichtbaar voor **alle** vragen, niet alleen vragen met type `anders` — zodat de admin het type achteraf kan corrigeren.

- `lib/types/oranjeVragen.ts`: `exact_antal` toegevoegd aan `AntwoordType` union en `ANTWOORD_TYPE_LABELS` (`'Exact aantal (0–22)'`).
- `components/oranje/VraagIndienenCard.tsx`: `exact_aantal` opgenomen in `TYPES_KEUZE`.
- `components/oranje/VragenBeantwoordenCard.tsx`: `AntwoordInvoer` uitgebreid met −/+ stepper + invoerveld voor `exact_aantal` (bereik 0–22).
- `app/admin/AdminClient.tsx`: `AdminCorrectInvoer` uitgebreid met correct-antwoord invoer voor `exact_aantal`; admin override-dropdown nu zichtbaar voor alle vragen (niet alleen type `anders`); `exact_aantal` ook als optie in de override-dropdown.

### 2026-06-01 — Oranje vragen: grace periode tot 3 juni (Claude Code)

Deadline voor het indienen van Oranje vragen was 31 mei, maar deelnemers die nog niet alle 3 vragen hadden ingediend krijgen tot en met woensdag 3 juni de tijd.

- `hooks/useDeadline.ts`: `VRAAG_GRACE_DEADLINE` toegevoegd (3 juni 23:59 CEST = `2026-06-03T21:59:00Z`); `isVraagGracePast` geëxporteerd naast de bestaande `isVraagPast`.
- `app/(app)/oranje/OranjeClient.tsx`: `inGracePeriod` berekend als `isVraagPast && !isVraagGracePast && aantalIngediend < 3`. Per wedstrijd wordt `graceVoorDezeWedstrijd` bepaald (`inGracePeriod && !mijnVraag`). Formulier blijft open voor wedstrijden zonder ingediende vraag; `isPast` prop wordt `false` doorgegeven zodat het formulier actief is. Badge toont "deadline 3 juni (verlengd)". Instructiebox zichtbaar tijdens grace periode met bijgewerkte datumvermelding.

### 2026-06-01 — Fantasy XV: sorteren op spelerszoekers + 6 spelers toegevoegd (Claude Code)

**Fantasy XV — sorteren op spelerslijst**

In de `PlayerModal` is een sorteer-header toegevoegd boven de spelerslijst met drie klikbare kolommen: **OVR** (overall score), **NAAM** (alfabetisch) en **QUOT** (quotering). Eerste klik sorteert, tweede klik keert de richting om. Standaard gesorteerd op OVR hoog→laag. De OVR-kolom is verbreed van `w-6` naar `w-10` zodat het pijl-icoon op één regel past.

- `components/fantasy/PlayerModal.tsx`: `sortBy`/`sortDir` state; `handleSort`/`SortArrow` helpers; sort-logica in `useMemo`; sort-header `<div>` boven de spelerslijst.

**Fantasy XV — 6 spelers handmatig toegevoegd aan `lib/data/players.ts`**

Zes spelers die buiten de automatische MinOverall-drempel vielen zijn handmatig toegevoegd vanuit het bronbestand (`260601_WK 2026_Master.xlsx`, tabblad `sofifa_260421_output_RH_WK_land`):

| ID | Naam | Overall | Land |
|---|---|---|---|
| 198710 | J. Rodríguez (James) | 80 | Colombia |
| 220295 | E. Valencia (Enner) | 75 | Ecuador |
| 84061 | A. González (Armando) | 74 | Mexico |
| 80304 | A. Fayzullaev (Abbosbek) | 67 | Oezbekistan |
| 277568 | K. Alikulov (Khusniddin) | 66 | Oezbekistan |
| 79458 | M. Urinboev (Mukhammadali) | 63 | Oezbekistan |

### 2026-05-28 — Chat toggle + bel naar header; club-filter Fantasy XV (Claude Code)

**Chat — toggle en bel verplaatst naar AppHeader**

De OG/ASC pill-toggle (voor Robert en Wouter) en de notificatiebel zijn verplaatst uit de chat-subheader naar de algemene `AppHeader`. De toggle verschijnt rechts naast het logo (via React portal naar `#header-chat-toggle`), de bel verschijnt naast de `?`-knop (via portal naar `#header-chat-extras`). Beide worden geleegd zodra de gebruiker de chatpagina verlaat. De chat-subheader is daarmee verwijderd, waardoor het berichtenvenster groter wordt.

Push-notificatie bug op Android/iOS PWA opgelost: `Notification.requestPermission()` werd eerder aangeroepen na twee `await`-operaties, waardoor Android Chrome het niet meer als user-gesture beschouwde en de permissievraag oversloeg. Fix: permission request als eerste call in `enableNotifications()`. Bell-klik roept nu altijd `enableNotifications()` aan (ook als status al `granted` is, voor hernieuwd abonnement).

- `components/layout/AppHeader.tsx`: `<div id="header-chat-toggle">` toegevoegd rechts naast logo; `<div id="header-chat-extras">` als slot naast `?`-knop.
- `components/chat/ChatPage.tsx`: sub-header verwijderd; twee portals toegevoegd voor toggle en bel; `Notification.requestPermission()` naar boven verplaatst in `enableNotifications()`; `handleBellClick` altijd `enableNotifications()` aanroepen.

**Fantasy XV — club-filter toegevoegd**

Nieuw filter `CLUB` toegevoegd tussen `COMP` en `POS` in de spelersmodal. Clubs worden dynamisch afgeleid uit de huidige gefilterde pool (vóór club-filter), gesorteerd op spelercount — zodat na selectie van een competitie alleen clubs uit die competitie verschijnen.

- `components/fantasy/PlayerModal.tsx`: `filterClub` state; `clubAbbrev()` helper voor 3-letter afkorting; `useMemo` splitst pool-berekening en club-derivatie; CLUB slicer panel toegevoegd; `hasFilters` en "Wis filters" bijgewerkt.

### 2026-05-28 — Chat push notificaties gerepareerd + bell-knop + iOS-instructie (Claude Code)

Push notificaties werkten op geen enkel platform omdat `setupPush()` nooit werd aangeroepen. Opgelost door service worker-registratie te automatiseren en permission-aanvraag te koppelen aan een expliciete gebruikersinteractie (bell-knop).

- `components/chat/ChatPage.tsx`: `setupPush()` gesplitst in `registerServiceWorker()` (module-scope, auto bij mount via `useEffect`) en `enableNotifications()` (component-functie, aangeroepen bij klik op bell-knop). Bell-knop toegevoegd in chat-header rechts — grijs als notificaties uit, oranje als aan. Op iOS buiten PWA-modus toont de knop een instructie-tooltip: open in Safari → Delen → Zet op beginscherm.
- `lib/push.ts`: case-mismatch opgelost in sender-filter — Redis slaat initials lowercase op maar de cookie geeft uppercase terug. Verzender ontving hierdoor zijn eigen notificaties. Fix: `payload.senderInitials.toLowerCase()`.
- `public/sw.js`: `install`/`activate` handlers met `skipWaiting()` en `clients.claim()` toegevoegd zodat een bijgewerkte service worker direct actief wordt na deployment.

**Platformbeperking iOS:** push notificaties werken op iOS uitsluitend als de app is geïnstalleerd als PWA (Add to Home Screen in Safari, vereist iOS 16.4+). De bell-knop legt dit uit voor iOS-gebruikers buiten standalone-modus.

### 2026-05-28 — Chat gesplitst in OG- en ASC-groepschat met toggle (Claude Code)

Bestaande gedeelde chat opgesplitst in twee groepsspecifieke chats. Wouter (WS) en Robert (RA) krijgen als dual-group members een pill-toggle `[OG] [ASC]` om te wisselen. Andere deelnemers zien alleen hun eigen groepschat. Actieve groepskeuze wordt onthouden in localStorage.

- `lib/kv/chat.ts`: `MESSAGES_KEY` vervangen door `messagesKey(group)` functie → Redis keys `chat:messages:og` en `chat:messages:asc`. Alle chat-functies krijgen `group: GroupId` als eerste parameter.
- `lib/push.ts`: `sendPushToAll` → `sendPushToGroup(group, payload)` — filtert push notifications op leden van de betreffende groep via `GROUP_MEMBERS[group]`.
- `app/api/chat/messages/route.ts`, `react/route.ts`, `poll/route.ts`: lezen `group` parameter uit request (GET: query string, POST: body) en geven deze door aan KV-functies.
- `app/(app)/chat/page.tsx`: leest `group` cookie en `DUAL_GROUP_INITIALS`; geeft `defaultGroup` en `isDualGroup` als props mee aan `ChatPage`.
- `components/chat/ChatPage.tsx`: `activeGroup` state geïnitialiseerd vanuit localStorage (`chat-active-group-${initials}`). Last-read key is nu groepsspecifiek (`chat-last-read-${initials}-${group}`). Alle fetch-calls bevatten `group`. Pill-toggle zichtbaar alleen voor dual-group users. Bij groepswisseling worden messages gereset en opnieuw geladen.
- `scripts/migrate-chat-to-og.mjs`: éénmalig script dat `chat:messages` kopieert naar `chat:messages:og` via `ZUNIONSTORE` (14 bestaande berichten gemigreerd op 2026-05-28).

### 2026-05-27 — Chat: lang indrukken voor emoji-reactie (Claude Code)

Dropdown bij klikken op berichtje vervangen door lang-indruk-interactie voor emoji-reacties.

- `components/chat/ChatMessage.tsx`: `handleBubbleClick`, `showActions` en `showReactions` verwijderd. Lange druk (500ms) via `touchStart`/`touchMove`/`touchEnd` toegevoegd — beweging > 10px annuleert de lange druk, zodat swipe-to-reply ongestoord werkt. Bij lange druk verschijnt een zwevende balk (via `createPortal` op `document.body`) met de 5 meest gebruikte emojis van de gebruiker + een `+`-knop. `+` opent `EmojiPickerPanel` als een fixed sheet onderaan het scherm. `onContextMenu` preventDefault toegevoegd om het native iOS lang-druk-menu te blokkeren.
- `components/chat/ChatPage.tsx`: `topEmojis` berekend via `useMemo` — telt per emoji hoe vaak de huidige gebruiker die heeft gebruikt in alle berichtreacties, sorteert aflopend. Valt terug op standaard (⚽ 🔥 😂 👏 ❤️) als de gebruiker nog geen reactiehistorie heeft. `topEmojis` als prop doorgegeven aan elke `ChatMessageBubble`.

### 2026-05-27 — Chat: iOS keyboard fix + tikken-om-te-sluiten + emoji zoek uitgebreid (Claude Code)

iOS-toetsenbord reparatie, UX-verbeteringen en betere emoji-zoekopdracht.

- `components/chat/ChatPage.tsx`: `overflow: hidden` verwijderd van `document.documentElement` — dit blokkeerde `visualViewport` resize-events op iOS Safari waardoor `--chat-kb-h` nooit werd gezet en de input achter het toetsenbord bleef. Keyboard-hoogte formule vereenvoudigd naar `window.innerHeight - window.visualViewport.height` (betrouwbaarder dan de max-tracking aanpak). Ongebruikte `maxVpHeightRef` en `maxInnerHeightRef` refs verwijderd. `onClick` toegevoegd op de berichtenlijst om het toetsenbord te sluiten bij tikken (zoals WhatsApp).
- `components/chat/ChatInput.tsx`: `tabIndex={-1}` toegevoegd op emoji-knop, plus-knop en verzendknop zodat iOS de ^ v navigatiepijlen uit de keyboard-accessory-bar weglaat (textarea is enige tabbable element).
- `components/chat/EmojiGifPanel.tsx`: Nederlandse zoekindex `SEARCH_MAP` toegevoegd met ~50 trefwoordgroepen. Zoeken werkt nu op semantische termen (`liefde` → harten, `huilen` → tranemoji's, `feest` → confetti/taart/bier, `kaart` → geel/rood, `kampioen` → trofeeën). Gedeeltelijke matching: `lief` vindt `liefde`, `hart` vindt `hartje`/`harten`. Zoekresultaten worden als platte grid getoond.

### 2026-05-27 — Chat iOS keyboard fixes: scroll preventie + accessory bar (Claude Code)

iOS-specifieke problemen opgelost bij het openen van het toetsenbord in de chat.

- `components/chat/ChatPage.tsx`: `document.documentElement.style.overflow = 'hidden'` toegevoegd (naast body) zodat iOS niet meer de html-scrollcontainer kan verschuiven. Scroll reset listener toegevoegd (`window.addEventListener('scroll', () => scrollTo(0,0))`) die elke iOS keyboard-scroll direct terugzet zodat de `visualViewport.height` correct daalt → `kbH > 0` → `chat-kb-open` gezet → BottomNav verborgen. Cleanup bijgewerkt.
- `components/chat/ChatInput.tsx`: `window.scrollTo(0, 0)` als eerste regel in `handleTextareaFocus` als directe back-up bij focus. Persistente `<input type="file">` volledig verwijderd uit DOM; vervangen door dynamische aanmaak in `openFilePicker()` — hierdoor detecteert iOS geen tweede form field meer en verdwijnen de ↑ ↓ pijlen uit de keyboard accessory bar. `fileRef` useRef verwijderd.
- `app/layout.tsx`: `viewport` export toegevoegd (`width: device-width, initialScale: 1`) — Next.js 13+ best practice voor correcte viewport meta tag.

### 2026-05-27 — Chat UI mobiele fixes: Android + iOS (Claude Code)

Meerdere mobiele verbeteringen aan de in-app groepschat.

- `components/chat/ChatInput.tsx`: emoji/GIF-panel en poll-panel verplaatst naar **onder** de invoerbalk (was: erboven) zodat de invoerbalk visueel op dezelfde hoogte blijft als het toetsenbord — identiek aan WhatsApp. Monochrome SVG-iconen (camera, staafdiagram) in het plus-menu ter vervanging van gekleurde emoji-iconen. Textarea `fontSize: 16px` om iOS-inzoom bij focus te voorkomen. `tabIndex={-1}` op de verborgen file-input om de iOS-pijltjesbalk boven het toetsenbord te onderdrukken. `enterKeyHint="send"` toegevoegd.
- `components/chat/EmojiGifPanel.tsx`: zoekfunctie toegevoegd aan het emoji-tab (zelfde stijl als GIF-zoek). Filtert op groepsnaam; toont "Geen resultaten" bij geen treffer.
- `components/chat/ChatPage.tsx`: `chat-kb-open` class-beheer en `--chat-nav-h` CSS-variabele hersteld en vereenvoudigd.

### 2026-05-27 — Groepschat bugfixes + @mention feature + mobiel toetsenbord (Claude Code)

Drie verbeteringen aan de groepschat.

- `components/chat/ChatInput.tsx`: tekst wordt pas gewist ná succesvolle verzending (niet meer vóór) zodat bij een fout de inhoud bewaard blijft. Textarea-hoogte wordt gereset na verzenden. @mention-functie toegevoegd: typ `@` (aan het begin of na een spatie) om een dropdown te zien met deelnemers; selecteer via klik of sluit met Escape. Deelnemers worden afgeleid uit berichten die al geladen zijn. `participants` prop toegevoegd.
- `components/chat/ChatMessage.tsx`: @mentions worden oranje getoond in berichttekst (`@Naam` → `#FF8C33`).
- `components/chat/ChatPage.tsx`: race-condition in de initiële lading opgelost — `setMessages` doet nu een merge i.p.v. een replace, zodat optimistisch toegevoegde berichten niet verloren gaan als de server-response eerder teruggaat dan het POST. `handleSendText` gooit nu een error bij een mislukt verzoek. `useMemo` voor deelnemerslijst. Keyboard-handler via `window.visualViewport` resize-event: zet CSS-variabele `--chat-kb-h` (toetsenbordhoogte in px). Body-scroll vergrendeld terwijl de chatpagina actief is zodat de header niet verschuift bij openen toetsenbord op mobiel.
- `app/(app)/chat/page.tsx`: `bottom` style gebruikt nu `var(--chat-kb-h, 0px)` zodat de chat-container automatisch boven het toetsenbord blijft op iOS en Android.

### 2026-05-27 — In-app groepschat (Claude Code)

Volledige WhatsApp-vervanging gebouwd als 6e tab in de navigatie.

- `lib/types/chat.ts`: `ChatMessage` type (tekst/afbeelding/GIF, replyTo, reactions)
- `lib/kv/chat.ts`: Redis sorted set voor berichten (max 2000) + push subscription index
- `lib/push.ts`: web-push helper — stuurt notificatie naar alle subscribers behalve de verzender
- `public/sw.js`: service worker voor push notificaties (ontvangt + toont, navigeert naar /chat bij klik)
- `app/api/chat/messages/route.ts`: GET (poll nieuwe berichten) + POST (stuur bericht)
- `app/api/chat/react/route.ts`: emoji-reacties toggle per deelnemer
- `app/api/chat/upload/route.ts`: afbeelding upload via Vercel Blob (max 10MB)
- `app/api/chat/gif/route.ts`: GIPHY search proxy (trending + zoeken)
- `app/api/push/subscribe/route.ts`: Web Push subscribe/unsubscribe
- `app/api/push/vapid-public-key/route.ts`: geeft VAPID public key terug aan client
- `components/chat/ChatPage.tsx`: hoofdcomponent — polling elke 5s, push setup, stuur/ontvang berichten
- `components/chat/ChatMessage.tsx`: berichtbubbels met datum-dividers, reply-preview, emoji-reacties
- `components/chat/ChatInput.tsx`: invoerbalk met afbeelding/GIF/emoji knoppen + send
- `components/chat/EmojiPickerPanel.tsx`: voetbal-thematische emoji groepen
- `components/chat/GifPickerPanel.tsx`: GIPHY zoekpanel (3-koloms grid)
- `app/(app)/chat/page.tsx`: 6e tab in navigatie
- `components/layout/BottomNav.tsx`: Beker-knop verwijderd, `IconChat` toegevoegd als 6e tab
- `components/layout/AppHeader.tsx`: Beker-knop (+ FifaInfoDrawer) verplaatst naar header links
- `components/icons/NavIcons.tsx`: `IconChat` (speech bubble SVG) toegevoegd
- Dependencies toegevoegd: `@vercel/blob`, `web-push`, `@types/web-push`
- VAPID keys gegenereerd en in `.env.local` gezet (ook in Vercel dashboard instellen)
- GIPHY API key in `.env.local` (ook in Vercel dashboard instellen)

### 2026-05-27 — Groepschat UI verfijning + poll feature (Claude Code)

Uitgebreide verbeteringen aan de groepschat-interface en een volledig poll-systeem toegevoegd.

- `app/(app)/chat/page.tsx`: layout omgezet naar `position: fixed` zodat de invoerbalk altijd zichtbaar is boven de navigatie (geen scroll meer nodig); Helvetica Neue lettertype ingesteld voor de chat
- `components/icons/NavIcons.tsx`: `IconCamera` en `IconSmile` SVG-iconen toegevoegd ter vervanging van emoji-iconen in de invoerbalk
- `components/chat/ChatMessage.tsx`: naam afzender als eerste regel in het berichtbubbel; datumscheider-lijn en -tekst lichter gemaakt (`#aaa`); chat-header volledig verwijderd; hover-knoppen vervangen door tap-op-bericht interactie (`showActions` state); swipe-rechts (anderen) / swipe-links (eigen) om te reageren op een bericht (swipe-drempel 50px, `preventNextClick` guard); `PollBubble` component toegevoegd met voortgangsbalken, procentages, meerkeuze-ondersteuning
- `components/chat/ChatInput.tsx`: `onSendPoll` prop toegevoegd; `IconPoll` staafdiagram SVG; `PollCreatorPanel` geïntegreerd
- `components/chat/PollCreatorPanel.tsx`: nieuw component — vraag-invoer, 2–4 opties, "meerdere antwoorden mogelijk" toggle, verstuurknop
- `components/chat/ChatPage.tsx`: `handleSendPoll` en `handleVotePoll` toegevoegd; chat-header volledig verwijderd
- `lib/types/chat.ts`: `ChatMessageType` uitgebreid met `'poll'`; `PollOption` interface toegevoegd (`text`, `votes: string[]`); `ChatMessage` uitgebreid met `pollQuestion?`, `pollOptions?`, `pollMultiple?`
- `lib/kv/chat.ts`: `chatUpdatePoll` functie toegevoegd — toggle-stemmen (enkelvoudig: klik zelfde = unstem; meervoudig: per optie togglen)
- `app/api/chat/poll/route.ts`: nieuw POST-endpoint voor stemmen op polls
- `app/api/chat/messages/route.ts`: POST verwerkt nu ook `type: 'poll'` inclusief push-notificatie (`📊 vraag`)

### 2026-05-24 — Fantasy XV speler toegevoegd: R. Bounida (Claude Code)

- `lib/data/players.ts`: R. Bounida (player_id 76944) handmatig toegevoegd. Was gefilterd door de ≥68 overall-drempel in het build-script (overall: 66). Data opgehaald uit `260524_WK 2026_Master.xlsx` (sofifa sheet). Club: Ajax, Eredivisie. Land: Marokko (CAF). Posities: LW, CAM, LM.

### 2026-05-24 — Export + UX fixes (Claude Code)

- `app/api/export/route.ts`: kladblokspelers (scratchpad) worden nu geëxporteerd per deelnemer in het `FT_` tabblad, startend vanaf cel D34. Zelfde `middleName` format als de 15 basisspelers. Werkt voor zowel OG als ASC.
- `components/oranje/VraagIndienenCard.tsx`: knoptekst bleef "Vraag indienen" na eerste submit (verwarring). Fix: lokale `localIngediend` state wordt `true` na succesvolle save, waardoor knop permanent wisselt naar "Vraag bijwerken" en de "✓ Ingediend" badge in de header zichtbaar blijft.

### 2026-05-24 — Quoteringen update (Claude Code)

- `npm run update_quoteringen` uitgevoerd: 50 wedstrijden + 48 landen bijgewerkt
- 7 match-odds gewijzigd t.o.v. vorige run; 2 KO-outright quotes gewijzigd
- Match 69 (Colombia vs Portugal): nog geen "Correcte Score" markt op Kambi
- 22 wedstrijden (ronde 3 groepsfase) nog niet beschikbaar op Kambi

### 2026-05-24 — Data-herstel: restore-predictions.mjs script (Claude Code)

#### Incident samenvatting
Op 2026-05-23 overschreef `scripts/seed-live-test.mjs` alle `predictions:*` en `fantasy:*` keys in Redis met testdata voor de ESPN live-test (Valencia-Barcelona). De echte WK-voorspellingen gingen verloren.

#### Herstelstrategie
- Gebruiker had een Excel export van ~3 dagen oud (vóór het incident)
- CSVs aangemaakt: `c:\RA\WK 2026\Recovery\Recovery_OG.csv` en `Recovery_ASC.csv`
- Deelnemers met data in de export: BS, WP, RA, WS (OG) + JH, NS, PN, WW, VH, JS (ASC)

#### `scripts/restore-predictions.mjs` (nieuw)
- Leest beide Recovery CSVs vanuit `c:\RA\WK 2026\Recovery\`
- Converteert teamnamen → `1`/`X`/`2` via embedded wedstrijdschema (wedstrijden 1-72)
- Embedded lookup van alle Fantasy XV spelers (middleName → Player object)
- Schrijft `predictions:{initials}` en `fantasy:{initials}` (incl. `teamName`, lege `scratchpad`)
- Veiligheidscheck: GET per key vóór SET, waarschuwt als key al gevuld is
- Vraagt bevestiging vóór uitvoering

#### Correcte volgorde voor herstel
1. `node scripts/cleanup-live-test.mjs` — verwijdert testdata keys
2. `node scripts/restore-predictions.mjs` — schrijft originele data terug

#### Uitgevoerd (2026-05-24) — volledig afgerond
- `cleanup-live-test.mjs` → 24 testkeys verwijderd uit Redis
- `restore-predictions.mjs` → 16 keys succesvol hersteld (BS, WP, RA, WS / JH, NS, PN, WW, VH, JS)
- Score-formaat bug gevonden: `normalizeScore` in restore-script produceerde `"1-1"` (geen spaties), waardoor `parseScore` in `lib/standings.ts` de uitslag niet kon parsen
- Fix 1: `lib/standings.ts` — `parseScore` splitst nu op `/\s*-\s*/` i.p.v. `' - '` (robuust voor beide formaten)
- Fix 2: `scripts/restore-predictions.mjs` — `normalizeScore` produceert nu `"1 - 1"` (met spaties)
- Restore opnieuw gedraaid na score-formaat fix; alle deelnemers bevestigd werkend

#### Nog te doen
- LiveSlide ESPN code pushen naar git (staat nog alleen lokaal)

### 2026-05-22 — FDO live test knop + ALL_SLOTS bugfix (Claude Code)

#### `lib/data/slots.ts` (nieuw)
- Slot-constanten (`REGULAR_SLOTS`, `TALENT_SLOTS`, `ALL_SLOTS`, `SCRATCHPAD_SLOTS`) verplaatst naar aparte lib file zonder `'use client'`
- Oplossing voor Turbopack-bug waarbij `ALL_SLOTS is not iterable` in server-side API routes die `gameStore.ts` importeerden

#### `store/gameStore.ts`
- Slot-constanten verwijderd; re-exporteert ze nu vanuit `@/lib/data/slots`

#### `app/api/matchday/live/route.ts`
- Import van `ALL_SLOTS` gewijzigd van `@/store/gameStore` naar `@/lib/data/slots` — live API route geeft nu 200 in plaats van 500

#### `app/matchday-preview/page.tsx`
- **"FDO LIVE" knop** toegevoegd naast "MOCK LIVE" — haalt echte football-data.org data op via polling
- MOCK LIVE en FDO LIVE zijn wederzijds exclusief (één tegelijk actief)
- `FDO_TEST_MATCH` initieel getest met Fiorentina vs Atalanta (`537185`), daarna omgezet naar Valencia vs Barcelona (`544589`, 23 mei 21:00 CET)

#### `components/matchday/MatchdayDrawer.tsx`
- `fdoLiveEnabled?: boolean` prop toegevoegd
- Live polling draait nu ook als `mockData` aanwezig is maar `fdoLiveEnabled=true` — dit was geblokkeerd voor de preview pagina
- `mockLiveData` effect reset `liveMatches` naar `[]` als FDO live wordt uitgeschakeld

### 2026-05-22 — Handmatig spelers toevoegen + nieuwe competitie (Claude Code)

#### `lib/data/players.ts`
- J. Locadia (id 204366) toegevoegd: Curaçao, ST/LW/LM, Miami FC, overall 69, dob 1993-11-07
- A. Jahanbakhsh (id 215871) toegevoegd: Iran, LM/RM/RW, FCV Dender EH, overall 69, dob 1993-08-11
- Beide ingevoegd op correcte alfabetische positie binnen overall: 69 sectie

#### `components/fantasy/PlayerModal.tsx`
- `LEAGUE_LOGO_ID` uitgebreid met `'USL Championship': '888880'`

#### `public/Competities/888880.png`
- Logo toegevoegd voor USL Championship (nieuw aangemaakt, leagueId 888880)

### 2026-05-20 — LiveSlide uitbreidingen: extra panels, 9-koloms tabel, FDO live test (Claude Code)

#### `lib/types/matchday.ts`
- Nieuwe interfaces: `LiveBookingEvent`, `LiveSubstitutionEvent`, `LivePenaltyEvent`, `LivePlayer`, `LiveMatchStats`
- `LiveMatchData` uitgebreid met optionele velden: `venue`, `attendance`, `bookings`, `substitutions`, `penalties`, `homeLineup`/`awayLineup`, `homeBench`/`awayBench`, `homeFormation`/`awayFormation`, `homeStats`/`awayStats`
- `LiveParticipantRow` uitgebreid: `tokens`, `totoOdds`, `uitslagOdds`, `uitslagPossible`, `uitslagImpossible`, `fantasyHomePlayer`, `fantasyAwayPlayer`

#### `app/api/matchday/live/route.ts`
- **FDO_TEST_MATCH env var**: `internalId:fdoId` koppeling via `.env.local` — overschrijft `FDO_MATCH_IDS` lokaal zonder code-aanpassing; nooit gecommit/deployed
- Venue en attendance uitgelezen uit FDO `/matches/{id}` en doorgegeven
- Boekingen, wissels en penalties uitgelezen en genormaliseerd naar typed interfaces
- Opstellingen (home/awayLineup, home/awayBench) en formaties uitgelezen
- Matchstats (bezit, schoten, corners, kaarten) uitgelezen via `extractStat()` helper
- `computeUitslagState()` helper: bepaalt `uitslagImpossible` en `uitslagPossible` op basis van live score en status
- Fantasy-speler loop gesplitst in home/away (max 1 per land per spelregel); `fantasyHomePlayer`/`fantasyAwayPlayer` object met `{ name, goals, assists }`
- `goalsByScorer`/`assistsByScorer` maps opgebouwd uit `goals[].scorer.name` en `goals[].assist.name`
- Twee-tier sortering: `totalPotential > 0` op punten desc, `totalPotential === 0` op remainingPotential (uitslag+home+away kansen) desc

#### `components/matchday/slides/LiveSlide.tsx`
- **Floating overlay panels**: 3 knoppen (Timeline, Opstellingen, Stats) openen zwevend venster over de slide; zelfde knop sluit weer; X-knop in overlay
- **Standaardweergave**: titel → vlaggen/score → stadion+toeschouwers → minuut → doelpunten → 3 knoppen → deelnemerstabel
- **Timeline panel**: doelpunten, kaarten, wissels in chronologische volgorde met iconen
- **Opstellingen panel**: twee kolommen (thuis/uit) met formatie + speelsters per positie
- **Stats panel**: bezit, schoten, corners, kaarten in vergelijkingsrijen
- **9-koloms tabel**: `45px 22px | 20px 22px | 36px 22px | 1fr 1fr | 32px` — naam, inzet, toto (voorspelling+quote), uitslag (voorspelling+quote), fantasy XV (thuis+uit), punten
- **Merged headers**: "Toto" span 2, "Uitslag" span 2, "Fantasy XV" span 2; witte 12px tekst
- **Kleurlogica**: toto correct=groen/fout=rood; uitslag correct=groen/impossible=rood/possible=oranje; fantasy gescoord=groen/actief=muted
- **Verticale gridlijnen**: `1px solid rgba(255,255,255,0.14)` — zelfde stijl als MatchSlide; `alignSelf: stretch` + flex op grenskolommen zodat lijn ook zichtbaar is bij lege cellen

#### `app/matchday-preview/page.tsx`
- Mock `LiveParticipantRow` data bijgewerkt met alle nieuwe velden

---

### 2026-05-19 — LiveSlide visuele verfijningen (Claude Code)

#### SlideWrapper (`components/matchday/SlideWrapper.tsx`)
- `titleDecoration?: React.ReactNode` prop toegevoegd — rendert inline naast de `<h1>` in een flex-container; gebruikt door LiveSlide voor de pulserende rode stip

#### LiveSlide (`components/matchday/slides/LiveSlide.tsx`)
- **Titel**: eigen titel-div vervangen door `SlideWrapper title="LIVE MATCH" titleFont="accent"` — zelfde stijl als alle andere slides (Sporty Pro Bold, 3xl)
- **Rode stip**: via `titleDecoration={<span className="live-pulse-dot" />}` naast de titel
- **Score-rij**: `pt-2` padding boven de vlaggen/score-rij
- **Minuut**: gecentreerd op eigen regel onder de score, 14px font-heading wit; `mt-1` padding erboven
- **Doelpunten**: verticaal gestapeld (was horizontaal); 3-koloms grid (`1fr 20px 1fr`) — thuisteam rechts uitgelijnd links, uitteam links uitgelijnd rechts, voetbalicoon gecentreerd; `gap-y-1.5` tussen rijen; tekst 14px wit
- **Voetbalicoon doelpunten**: `icon-ball.svg` (was inline SVG), 16px, `opacity: 0.55`
- **Tabelkoppen**: wit + 12px (was muted + 9px)
- **Tabelcontent**: alle cellen 12px (was 9–10px)

#### MatchdayButton (`components/matchday/MatchdayButton.tsx`)
- Geanimeerd voetbalicoon vervangen door `icon-ball.svg` (was inline SVG circle+polygon); bounce + spin animaties behouden; `opacity: 0.6 + brightness(0.7)` voor grijzige look

---

### 2026-05-19 — Matchday export-rework + LiveSlide + visuele verfijningen (Claude Code)

#### Export-architectuur (robuust, uniform, WhatsApp HD)
- **`display: none` vervangen door off-screen positionering** in MatchdayDrawer: inactieve slides zijn `position: absolute; left: -9999px` zodat html-to-image altijd correcte layout vindt
- **SlideWrapper `exporting` prop**: bij export `height: 844px; overflow: hidden; paddingTop: 16px` — alle slides zijn identiek 390×844px logisch → 1290×2792px fysiek (@ratio 1290/390)
- **`captureSlide`** gebruikt altijd vaste dimensies (`EXPORT_W=390, EXPORT_H=844, EXPORT_RATIO=1290/390`); dubbele toPng-aanroep voor font-embedding
- **`handleExportAll`**: iterates van `liveOffset` tot `totalSlides`; geen display-toggle workaround meer; 120ms wacht op React re-render vóór capture
- **LiveSlide uitgesloten** van export (zowel "Slide" als "Alles"); "Slide"-knop disabled op live slide
- **Logo `bottom: 24px`** (was 10px) voor meer ruimte onder logo in export
- `exporting` prop toegevoegd aan MatchSlide, InzetSlide, OverzichtSlide (was al in RanglijstSlide)

#### LiveSlide (`components/matchday/slides/LiveSlide.tsx`) — nieuw
- Slide 0, verschijnt automatisch bij actieve live wedstrijd
- Per live wedstrijd: vlaggen + live score + minuut + doelpuntenmakers (⚽)
- Tabel: naam | toto ✓/✗ | uitslag | FXV goals/assists | potentiële punten
- Groen (#4ade80) = correct, rood (#f87171) = fout, oranje (#FF6B00) = punten
- Pulserende rode stip via `.live-pulse-dot` CSS-klasse
- Data via `/api/matchday/live` (football-data.org, Redis-cache 25s TTL, 30s polling)

#### Live API (`app/api/matchday/live/route.ts`) — nieuw
- `GET /api/matchday/live?matchday={id}&group={og|asc}`
- Redis-cache per match met 25s TTL; module-level `retryAfterMs` voor 429-afhandeling
- Berekent `LiveParticipantRow` per deelnemer: toto/uitslag correctheid, fantasy goals/assists

#### MatchdayButton animatie
- Voetbalicoontje: `matchday-bounce` (alternate 0.7s) + `matchday-spin` (1.4s lineair)
- Kleur #999, grootte w-8/h-8; '?'-knop gespiegeld naar rechts

#### AppHeader layout
- MatchdayButton absoluut links (`left-4`), '?'-knop absoluut rechts (`right-4`)
- MatchdayButton gecommentarieerd tot toernooistart

#### Chart-centrering (alle grafieken)
- `YAxis width` expliciet gezet (26px voor getallen, 34px voor €-labels)
- `margin.left: 4`, `margin.right` gelijkgesteld aan linkse dode ruimte → plot-area symmetrisch gecentreerd
- `PotChart`: ResponsiveContainer vervangen door vaste breedte (340px); zelfde aanpak als andere charts

#### ProgressChart (`components/matchday/charts/ProgressChart.tsx`)
- `width` prop (default 350) + vaste `LineChart width={width}` (geen ResponsiveContainer)
- `showLineLabels`: voornaam als SVG-tekst bij laatste datapunt
- Rechter margin 36px (was 44) met labels

#### ScoreStackedChart (`components/matchday/charts/ScoreStackedChart.tsx`)
- `width` prop + vaste `BarChart width={width}`; centering-div toegevoegd

#### Visuele verfijningen slides
- **MatchSlide (1&2)**: datum/stadion kleur `rgba(255,255,255,0.28)` (lichter); rijpadding 1px→0px
- **InzetSlide (3)**: uitslag-kolom cellen `flex items-center justify-center`; vlagopacity op basis van toto-voorspelling (thuiswinst: uitvlag 40%, uitwinst: thuisvlag 40%, gelijkspel/geen: beide 85%)
- **OverzichtSlide (4)**: scores 2 decimalen (`toFixed(2)`); rijpadding 1px→0px
- **RanglijstSlide (5)**: tussenstand scores 2 decimalen; chart-hoogte 525px

#### font-bold italic verwijderd
- Alle Built Titling elementen in alle slides: geen `font-bold` of `italic`/`skewX`

---

### 2026-05-19 — RanglijstSlide (slide 5) redesign + ProgressChart uitbreidingen (Claude Code)

#### RanglijstSlide (`components/matchday/slides/RanglijstSlide.tsx`) — volledig herschreven
- Geen card-containers; content direct op achtergrond
- ProgressChart: hoogte 500px, `showLegend` (5-koloms grid, gekleurde blokjes + voornamen) en `showLineLabels` (voornaam bij laatste datapunt per lijn)
- Toggle voor 7 statistieken: Totaal | Poule | KO | FXV | Landen | Toto's | Uitsl. (standaard: Totaal); 12px font-heading knoppen
- Toggle verborgen bij export (`exporting` prop); statistiek geforceerd op Totaal bij export
- Tussenstand: 4-koloms kolom-major grid (posities 1→4 kolom 1, 5→8 kolom 2, etc.)
- Stijl identiek aan andere slides: `VLINE`, `HDR_BOTTOM`, `ROW_BOTTOM`; 9px font-heading tekst
- Rank | voornaam | score per cel; lege cellen bij waarde 0
- `gap-3` + `borderLeft VLINE` als scheiding tussen de 4 blokken

#### ProgressChart (`components/matchday/charts/ProgressChart.tsx`)
- `showLineLabels` prop: voornaam als SVG `<text>` op het laatste non-null datapunt per lijn, in lijnkleur (7px, Built Titling)
- Rechter margin 44px wanneer `showLineLabels` actief; anders 4px
- `showLegend` prop: 5-koloms grid met gekleurde blokjes + voornamen (8px)

#### MatchdayDrawer (`components/matchday/MatchdayDrawer.tsx`)
- `exporting={exporting}` doorgegeven aan RanglijstSlide

---

### 2026-05-19 — OverzichtSlide (slide 4) redesign + logo-architectuur (Claude Code)

#### MatchdayDrawer (`components/matchday/MatchdayDrawer.tsx`)
- Logo verplaatst uit SlideWrapper naar MatchdayDrawer als vaste UI-rij boven de dot-indicators — altijd op dezelfde schermhoogte ongeacht slide-content
- `addExportLogo()` / `removeExportLogo()`: logo tijdelijk als absoluut element in de slide-div geïnjecteerd vóór PNG-capture
- Logo zweeft boven content; content mag achter logo schuiven

#### SlideWrapper (`components/matchday/SlideWrapper.tsx`)
- Logo volledig verwijderd uit SlideWrapper
- `logoPaddingTop` prop verwijderd
- `minHeight` prop behouden; `flex: 1` op content-area
- Alle 5 slides: `minHeight={720}`

#### InzetSlide (slide 3) — verfijningen
- Subtitel: 8px padding boven; naam deelnemer 26px script
- `×` separators 20px
- Stand van de pot gecentreerd
- Minder ruimte onder tabel en potstand
- PotChart: hoogte 140px, witte gridlijnen doorlopend (`rgba(255,255,255,0.15)`, `strokeDasharray="0"`), witte astekst

#### OverzichtSlide (slide 4) — volledig herschreven
- Zelfde stijl als MatchSlide: flex-rijen, vaste pixel-breedtes, witte tekst, geen card-containers
- Eerste kolom vaste breedte 50px (`NAAM`); overige kolommen `flex: 1` gelijkmatig verdeeld
- `HdrNaam` / `DataNaam` / `HdrCell` / `DataCell` helper-componenten met identieke stijl → verticale gridlijnen liggen in lijn
- Geen Naam-label in kolomtitel (cel leeg); lege cellen bij waarde 0
- Tabel 1: (leeg) | Poule | KO | FXV | Toto | Uitsl — 8px padding boven
- Tabel 2: (leeg) | R 32 | R 16 | KF | HF | Fin | Win | **Totaal** (bold)
- Beide tabellen: `VLINE = rgba(255,255,255,0.14)`, header-bottom `rgba(255,255,255,0.15)`, rij-bottom `rgba(255,255,255,0.05)`

#### ScoreStackedChart (`components/matchday/charts/ScoreStackedChart.tsx`)
- Initialen deelnemers ipv voornamen op X-as
- Witte astekst (7px), doorlopende witte gridlijnen (identiek aan PotChart)
- `Legend` import verwijderd (ongebruikt)
- Hoogte: 120px

---

### 2026-05-18 — Matchday slides redesign: MatchSlide (slides 1 & 2) + drawer UX (Claude Code)

#### SlideWrapper (`components/matchday/SlideWrapper.tsx`)
- Achtergrond verplaatst van SlideWrapper naar MatchdayDrawer (`fixed inset-0`) zodat de achtergrond niet meebeweegt bij scrollen
- PNG-export: achtergrond tijdelijk via `applyExportBackground()` op het element gezet vóór `toPng()`
- Dark overlay (rgba 35%) verwijderd
- `minHeight: 844` verwijderd — slide krimpt naar werkelijke content-hoogte
- `flex-1` verwijderd van content-div — logo volgt direct na content (geen lege ruimte)
- Logo: 28px → 48px hoogte, 20px ruimte boven logo
- Titel: `font-accent font-bold text-3xl text-white tracking-widest` (identiek aan poulefase-titels, geen oranje stroke/shadow)
- `titleFont="accent"` toegevoegd aan InzetSlide, OverzichtSlide en RanglijstSlide

#### MatchSlide (`components/matchday/slides/MatchSlide.tsx`) — volledig herschreven
- Donkere card-containers verwijderd — content direct op achtergrond
- Landen tonen als 3-letter code via `COUNTRY_ABB` lookup
- Vlaggen: 24×24px (identiek aan MatchCard)
- Wedstrijdnummer-badge: `w-10 h-9 text-sm`, transparant met witte omlijning
- Datum/stadion: `font-heading font-light text-xs uppercase tracking-widest` (identiek aan MatchCard)
- Kolommen: naam (38px) | inzet (20px) | toto 1/X/2 (elk 26px) | uitslag (34px) | quote (26px) | fantasy thuis+uit (flex-1 elk)
- TOTO: merged header "1 / X / 2"; per deelnemer toont de overeenkomende toto-quotering in de juiste sub-kolom
- "Uitslag Voorspelling": merged header over uitslag + quote kolommen
- Fantasy XV header: vlag thuisland gecentreerd boven thuis-kolom, "Fantasy XV" absoluut gecentreerd, vlag uitland gecentreerd boven uit-kolom
- Verticale lijnen doorlopend via `div`-cellen met `alignSelf: stretch`; geen interne toto-lijnen, geen lijn tussen uitslag/quote, geen lijn tussen fantasy sub-kolommen
- Kolomtitels 9px, wit
- Namen links uitgelijnd
- Spelersnamen via `middleName()` lookup in `WK_PLAYERS`
- Quoteringen 2 decimalen (`toFixed(2)`)
- Uitslag-format: "2 - 1" (spaties rondom streepje)
- Lege cellen tonen leeg (geen `–`)
- Laatste wedstrijd: `mb-0` (geen ruimte na tabel)

#### MatchdayDrawer (`components/matchday/MatchdayDrawer.tsx`)
- Achtergrondafbeelding op drawer-root (`fixed inset-0`) — beweegt niet mee bij scrollen
- Tabbladen vervangen door swipe-navigatie (touch left/right, threshold 50px)
- Dot-indicators: pill-vorm (actief = breed/oranje), verplaatst naar onderkant scherm
- Matchday-selector: dropdown vervangen door `‹ MATCHDAY 01 ›` pijltjesnavigatie met witte omlijning, geen donkere achtergrond, 20px ruimte boven
- "Groep OG" balk verwijderd
- "MATCHDAY" tekst uit header verwijderd
- Exportknoppen (Download slide + Alles exporteren) verwijderd — export via Claude Code chat
- Alle `border-b`/`border-t` separatorlijnen in drawer verwijderd

---

### 2026-05-18 — InzetSlide (slide 3) redesign naar Artboard 2 referentie (Claude Code)

#### InzetSlide (`components/matchday/slides/InzetSlide.tsx`) — volledig herschreven
- `TotoRow` en `UitslagRow` helpers verwijderd
- Subtitle op één regel, alles wit: `TOTO VAN DE DAG — DE SPEELRONDE VAN [naam in script 18px]`
- `titleFont="accent"` behouden (Sporty Pro, identiek aan andere slides)
- 3-kolommen tabel: **TOTO** (flex 1) | **WEDSTRIJD** (flex 2) | **UITSLAG** (flex 1), alles gecentreerd
- Enige horizontale lijn: direct onder kolomkoppen; alle rij-borders verwijderd
- Eerste datarij: `€ 1,00` in kolom 1 en 3, midden leeg
- `×` separator na `€ 1,00`-rij én tussen elke wedstrijdrij in kolom 1 (`leading-none`, minimale hoogte); kolom 3 geen separator
- Per wedstrijd: quotering zonder prefix | vlag thuis (50×50) — uitslag — vlag uit (50×50) | quotering
- Vlagcontainers vaste breedte (56px) zodat vlaggen verticaal uitlijnen ongeacht uitslag-tekst
- Quoteringen: geen `x`-prefix, gewoon getal met 2 decimalen
- Alle Built Titling tekst 18px
- Tabel `mx-8` voor smalle marge
- Stand van de pot: plain tekst `STAND VAN DE POT:` + bedrag (geen oranje box)
- Decimaal punt → komma bij potstand

---

### 2026-05-16 — Matchday feature: dagelijkse visuals + export (Claude Code)

#### Architectuur
- 27 matchdays (MD 1–25: 4 wedstrijden, MD 26–27: 2 wedstrijden); elke matchday heeft 5 slides (4 voor MD 26–27)
- Aparte visuals per groep (OG en ASC): eigen deelnemers, eigen "toto van de dag" rotatie, eigen pot stand
- Slides: Match 1-2, Match 3-4, Inzet, Overzicht, Ranglijst

#### Nieuwe packages
- `recharts` — grafieken (lijndiagram, gestapelde staafgrafiek)
- `html-to-image` — PNG export per slide voor WhatsApp

#### Data & logica (`lib/data/matchdayMap.ts`, `lib/matchday.ts`, `lib/types/matchday.ts`)
- `MATCHDAY_MAP`: statische map matchday ID → match IDs
- `getOrCreateRotation(group)`: genereert 27-slot deelnemersrotatie (deterministisch via seed), slaat op in Redis als `matchday_rotation_og` / `matchday_rotation_asc`
- `computeMatchdayScores()`: berekent per deelnemer poulefase, KO fase (wedstrijden 73–104), fantasy, doorgaande landen, toto's goed, uitslagen goed, en KO per ronde (R32/R16/KF/HF/finale/winnaar)
- `getFantasyPlayersForMatch()`: zoekt welke fantasy speler een deelnemer heeft voor thuis-/uitland

#### API routes
- `GET/POST /api/matchday/[id]` — laadt of slaat matchday config op (quotes + pot stand)
- `GET /api/matchday/[id]/full?group=og|asc` — alles-in-één endpoint: config, rotatie, match data met voorspellingen, scores, pot history, score history voor de drawer
- `GET /api/matchday/scores?matchday=N&group=og|asc` — standalone scoreberekening
- `GET/POST /api/matchday/rotation` — rotatiebeheer

#### Slide components (`components/matchday/`)
- `SlideWrapper` — gedeelde achtergrond/stijl/logo wrapper voor alle slides (390×844px portrait)
- `MatchSlide` — per deelnemer: naam, tokens, toto (1/X/2 highlighted), uitslag, quote uitslag, fantasy speler thuis- en uitland
- `InzetSlide` — "Toto van de dag" naam, per wedstrijd toto+uitslag odds (live Unibet), stand van de pot, lijndiagram pot evolutie
- `OverzichtSlide` — twee tabellen (match scores + KO breakdown per ronde), gestapelde staafgrafiek per deelnemer
- `RanglijstSlide` — lijndiagram totaalscore progressie per matchday, ranglijsttabel
- `PotChart`, `ScoreStackedChart`, `ProgressChart` — Recharts-gebaseerde grafieken met Panenka kleuren

#### MatchdayDrawer + button (`components/matchday/`)
- `MatchdayButton` — voetbalicoontje rechts in AppHeader naast de `?` knop
- `MatchdayDrawer` — fullscreen overlay met matchday-selector (1–27), slide-tabs, PNG export per slide of alle slides tegelijk

#### AppHeader / AppShell integratie
- `AppShell` en `AppHeader` krijgen `groupId` prop
- `groupId` doorgegeven vanuit `app/(app)/layout.tsx` (al berekend)
- `MatchdayButton` toont per groep de juiste data

#### Admin tabblad "Matchday" (`app/admin/AdminClient.tsx`)
- Nieuw tabblad "📅 Matchday" met matchday-selector (1–27)
- Toont automatisch wie "toto van de dag" is voor OG en ASC (uit gegenereerde rotatie)
- Invoervelden: live Unibet toto odds + uitslag odds per wedstrijd (2 of 4 afhankelijk van matchday)
- Pot stand per groep (OG en ASC apart)
- Opslaan activeert de matchday — slides worden zichtbaar voor alle deelnemers

---

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

### 2026-05-16 — Matchday preview & MatchSlide redesign (Claude Code)

#### Matchday-icoontje verborgen (`components/layout/AppHeader.tsx`)

`MatchdayButton` uitgecommentarieerd met TODO. Wordt opnieuw geactiveerd na toernooistart (9 juni 2026).

#### Preview-pagina voor matchday visuals (`app/matchday-preview/page.tsx` — nieuw)

Standalone preview met ingebakken mock data (echte OG-deelnemers, echte wedstrijdnamen). Doel: visuele iteratie vóór toernooistart zonder live Redis-data nodig te hebben.

#### `MatchdayDrawer` — `mockData` prop (`components/matchday/MatchdayDrawer.tsx`)

Optionele `mockData?: FullMatchdayData` prop toegevoegd. Als aanwezig: skipt API-fetch en gebruikt de meegegeven data direct. Preview-pagina maakt hier gebruik van.

#### `SlideWrapper` — `titleFont` prop (`components/matchday/SlideWrapper.tsx`)

Optionele `titleFont?: 'heading' | 'accent'` prop. Default blijft Built Titling (`heading`); MatchSlide geeft `accent` mee voor Sporty Pro.

#### MatchSlide redesign (`components/matchday/slides/MatchSlide.tsx`)

Visuele revisie conform nieuwe stijlrichtlijnen:
- **Titel**: Sporty Pro Bold (`font-accent font-bold`) met oranje glow — identiek aan andere titelpagina's
- **Wedstrijd-container**: zelfde card-stijl als MatchCard — `rounded-xl border-[#2a2a2a]`, donkere header (`rgba(10,10,10,0.75)`) met matchnummer-badge links, vlaggen + teamnamen in Sporty Pro Light, datum/stadion in muted kleurtje
- **Contenttabel**: Built Titling (`font-heading`) voor alle rij-inhoud
- **Deelnemersnamen**: vet + cursief (`font-bold italic`)

### 2026-05-18 — Export fix ASC master & quoteringen update (Claude Code)

#### Quoteringen bijgewerkt (`lib/data/odds.ts`, `lib/data/odds_trends.ts`, `lib/data/knockoutQuotes.ts`, `lib/data/knockoutQuotes_trends.ts`)

`npm run update_quoteringen` uitgevoerd — 49 wedstrijden en 48 landen bijgewerkt via Kambi/Unibet API. Geen gewijzigde quotes t.o.v. vorige run; odds zijn stabiel.

#### Fix: ASC master Excel ontbrak op Vercel (`next.config.ts`)

**Bug**: export voor ASC-groep gaf HTTP 404 "Master Excel voor groep 'ASC' niet gevonden". Het bestand `260516_WK 2026_Master_ASC.xlsx` stond wél in git maar ontbrak op Vercel.

**Oorzaak**: `outputFileTracingIncludes` in `next.config.ts` gebruikte het glob-patroon `./*_WK 2026_Master.xlsx`, dat alleen bestanden matcht die eindigen op `_Master.xlsx`. De ASC-variant eindigt op `_Master_ASC.xlsx` en viel daarmee buiten de bundle.

**Fix**: tweede glob toegevoegd: `./*_WK 2026_Master_ASC.xlsx`. Ook twee redundante expliciete bestandsnamen verwijderd (al gedekt door de OG-glob).

#### Nieuwe master Excel versie 260517 (`260517_WK 2026_Master.xlsx`, `260517_WK 2026_Master_ASC.xlsx`)

Beide bestanden toegevoegd en gepusht naar GitHub zodat Vercel ze meeneemt in de volgende deployment.

### 2026-05-18 — Oranje vragen: antwoordtype 'open' + handmatige beoordeling (Claude Code)

#### Nieuw antwoordtype 'open antwoord' (`lib/types/oranjeVragen.ts`)

`AntwoordType` uitgebreid met `'open'`. Label: "Open antwoord". Beschikbaar voor deelnemers bij het indienen én voor admin bij het omzetten van 'anders'-vragen.

#### Deelnemers-UI: vrij tekstveld (`components/oranje/VragenBeantwoordenCard.tsx`, `components/oranje/VraagIndienenCard.tsx`)

- Deelnemers kunnen "Open antwoord" kiezen als antwoordtype bij het indienen van een vraag
- Bij het beantwoorden van een 'open' vraag verschijnt een vrij tekstveld

#### Admin handmatige beoordeling (`app/admin/AdminClient.tsx`, `app/actions/admin.ts`, `app/admin/page.tsx`)

Omdat open antwoorden niet 1-op-1 vergeleken kunnen worden (bijv. "Gakpo" vs "Cody Gakpo"), beoordeelt de admin elk antwoord handmatig:

- Per gepubliceerde 'open' vraag toont de admin alle ingevulde antwoorden van deelnemers
- Per deelnemer: twee knoppen — ✓ (goed) en ✗ (fout). Klik nogmaals om het oordeel te wissen
- Oordelen worden opgeslagen in Redis onder `oranje_beoordeling_{groupId}` als `OranjeBeoordeling` (`matchId → questionAuthorKey → participantKey → boolean`)
- Nieuwe server actions: `loadOranjeBeoordeling`, `saveOranjeBeoordeling`, `loadAlleOranjeAntwoorden`

#### Scoring uitgebreid (`lib/scoring.ts`)

### 2026-05-26 — Quoteringen update (Claude Code)

#### Wedstrijdquotes bijgewerkt (`lib/data/odds.ts`, `lib/data/odds_trends.ts`)

72 groepswedstrijden gescraped via Unibet/Kambi API; 35 wedstrijden met gewijzigde quotes t.o.v. vorige run.

#### KO-outrights bijgewerkt (`lib/data/knockoutQuotes.ts`, `lib/data/knockoutQuotes_trends.ts`)

48 landen bijgewerkt (winnaar, finale, r4, r8, r16, groepswinnaar, doorstoot KO); 8 landen met gewijzigde quotes.

---

### 2026-05-25 — Handmatig speler G. Mora (79399) toevoegen aan Fantasy XV (Claude Code)

#### Speler toegevoegd (`lib/data/players.ts`)

Gilberto Rafael Mora Zambrano (SoFIFA ID 79399) handmatig toegevoegd aan de spelerlijst. Overall 73, dus boven de automatische drempel van 68, maar niet aanwezig in de huidige master Excel. Speelt voor Club Tijuana in Liga MX (leagueId 888887), positie CAM/LW/CM, Mexico / CONCACAF, geboren 2008-10-14.

---

### 2026-05-27 — Groepschat bugfixes: berichten laden, toetsenbord Android, @all (Claude Code)

#### Berichten laadden niet (`lib/kv/chat.ts`, `app/api/chat/messages/route.ts`)

`@upstash/redis` v1.37+ deserialiseert JSON-members in sorted sets soms automatisch naar JavaScript-objecten. De code deed vervolgens `JSON.parse(object)`, wat een `SyntaxError` gooide. Next.js stuurde dan een HTML-errorpagina terug; de client kon `.json()` daar niet op toepassen en toonde "Kon berichten niet laden".

- Nieuwe `parseMember(raw: unknown)` helper in `lib/kv/chat.ts` — vangt zowel `string` als al-geparsed object op. Toegepast op alle `zrange`-aanroepen in `chatGetMessages`, `chatGetRecent`, `chatGetAllMessages`, `chatUpdateReactions` en `chatUpdatePoll`.
- `GET /api/chat/messages` omgeven met try/catch — bij een serverfout wordt nu altijd `{ error, messages: [] }` met HTTP 500 geretourneerd in plaats van een HTML-crashpagina.
- Client-foutmelding uitgebreid: toont nu ook de technische oorzaak (`Kon berichten niet laden: Opslag niet bereikbaar`).

#### Toetsenbord-gap op Android (`components/chat/ChatPage.tsx`)

De oude formule `window.innerHeight − visualViewport.height` gaf op Android altijd 0: bij `resizes-content`-gedrag (standaard Chrome Android) krimpen layout- én visual-viewport gelijk mee, zodat het verschil nul is. Gevolg: invoerbalk bleef achter het toetsenbord staan.

Nieuwe aanpak: sla het grootste geziene formaat op als referentie en bereken `visualShrink − layoutShrink` als netto toetsenbordhoogte.

- iOS (layout onveranderd, visual krimpt): `kbH = visualShrink` ✓
- Android `resizes-visual` (alleen visual krimpt): zelfde als iOS ✓
- Android `resizes-content` (beide krimpen gelijk): `kbH = 0` — layout viewport handelt het al af ✓

#### @mention: `@all` toegevoegd (`components/chat/ChatInput.tsx`)

`@all` (📢 Iedereen) verschijnt nu altijd als eerste suggestie zodra de query leeg is of begint met "all" of "iedereen". Eerder was de lijst leeg zolang er nog geen berichten geladen waren (participants wordt afgeleid van geladen berichten).

`scoreOranjeNieuw` accepteert nu `participantKey` en `beoordeling`. Voor vragen zonder correcte-antwoord-string (type 'open') wordt de beoordeling gecheckt: `beoordeling[matchId][questionKey][participantKey] === true` → +0,5 token. `scoreParticipant` heeft twee extra optionele parameters gekregen en wordt vanuit `computeAndSaveScores` aangeroepen met participantKey + beoordeling.

---

### 2026-05-27 — Popup uitgeschakeld op /chat (Claude Code)

#### `components/ui/PopupToast.tsx`

De grappige popups (uit `lib/popups.ts`) werden ook getoond op de chat-pagina, wat afleidend is. Twee aanpassingen:

- In de timer-callback: als `pathnameRef.current` begint met `/chat`, wordt de popup overgeslagen.
- Nieuw `useEffect` op `pathname`: bij navigatie naar `/chat` wordt een eventueel al-zichtbare popup direct via `dismiss()` gesloten.

Alle andere tabbladen zijn ongewijzigd.

---

### 2026-05-27 — Groepschat UI redesign: emoji/GIF panel, plus-menu, tab bar verbergen (Claude Code)

#### Gecombineerd emoji/GIF-panel (`components/chat/EmojiGifPanel.tsx`)

Nieuw component dat het aparte `EmojiPickerPanel` en de losse GIF-knop vervangt:

- Twee tabs: **EMOJI** en **GIF** (zoeken via GIPHY, ingebouwd in hetzelfde panel).
- 270+ emoji's in 9 categorieën: Voetbal & Sport, Smileys & Emoties, Mensen & Gebaren, Dieren & Natuur, Eten & Drinken, Reizen & Plekken, Objecten & Activiteiten, Symbolen & Hart, Vlaggen.
- Hoogte = CSS-variabele `--chat-locked-kb-h` (de laatst gemeten toetsenbordhoogte), zodat het scherm niet springt bij wisselen tussen toetsenbord en panel.

#### Nieuwe knoppenstructuur (`components/chat/ChatInput.tsx`)

Van 4 knoppen (📷 GIF 😊 📊) naar 2:

- **😊 / ⌨️**: toggle tussen het emoji/GIF-panel (toetsenbord sluit) en het native toetsenbord. Als het panel open is, verandert het icoon in een toetsenbord-icoon om terug te schakelen.
- **+**: opent een mini-popup met twee opties — "📷 Foto / Camera" en "📊 Poll aanmaken". De `+` verandert in `✕` als het menu open is.
- Textarea-focus sluit een open panel automatisch (toetsenbord neemt over).

#### Tab bar verbergen bij open toetsenbord (`components/layout/BottomNav.tsx`, `components/chat/ChatPage.tsx`, `app/(app)/chat/page.tsx`)

- `ChatPage.tsx` zet class `chat-kb-open` op `document.body` en CSS-variabele `--chat-nav-h: 0px` zodra het toetsenbord zichtbaar is (kbH > 0); bij sluiten wordt `--chat-nav-h: 3.5rem` hersteld.
- `--chat-locked-kb-h` wordt eenmalig opgeslagen als de toetsenbordhoogte > 0 is, zodat het emoji/GIF-panel die hoogte kan overnemen.
- `BottomNav` luistert via `MutationObserver` op de `chat-kb-open` class en schuift weg met `translateY(100%)` + `transition-transform` zodra het toetsenbord opent.
- `chat/page.tsx` gebruikt `var(--chat-nav-h, 3.5rem)` in de `bottom`-berekening van de vaste container, zodat de invoerbalk direct boven het toetsenbord zit zonder gap.

#### Push-notificatie popup verwijderd (`components/chat/ChatPage.tsx`)

De automatische `setupPush()` aanroep (die `Notification.requestPermission()` triggerde) is verwijderd. De push-infrastructuur (service worker, VAPID, API-routes) blijft intact voor later gebruik.

---

### 2026-05-27 — Chat: iOS keyboard fix, poll voter details, last-read, @mention contrast (Claude Code)

#### iOS keyboard fix: height-based aanpak (`components/chat/ChatPage.tsx`, `app/(app)/chat/page.tsx`)

De oude aanpak (`bottom: calc(... + kbH)` waarbij `kbH = window.innerHeight − vv.height`) werkte niet op bepaalde iOS-versies waarbij `window.innerHeight` meeschaalt met het toetsenbord, waardoor `kbH` altijd 0 uitkwam en de invoerbalk achter het toetsenbord verdween.

Nieuwe aanpak:
- `baseHeight` wordt bij mount vastgelegd als `vv.height` (niet `window.innerHeight`) — immuun voor iOS-bugs.
- `kbH = baseHeight − vv.height` is daardoor altijd correct.
- De container gebruikt nu `height: calc(var(--chat-vvp-h) − header − nav − safe-inset)` i.p.v. `bottom: calc(...)` — `vv.height` wordt direct als CSS-variabele `--chat-vvp-h` gezet, zodat de containerhoogte altijd exact de zichtbare viewport vult.
- Bij open toetsenbord wordt `--chat-safe-inset` op `0px` gezet (safe-area zit al verdisconteerd in de toetsenbordhoogte, anders dubbeltelling).

#### Poll voter details (`components/chat/ChatMessage.tsx`)

Onderaan elke poll met minstens één stem staat een oranje "Wie stemde?"-link. Klikken klapt een lijst uit per optie met de namen van alle stemmers als pills. Klikken nogmaals verbergt de lijst. Namen worden opgezocht in de `participantsMap` (initials → naam uit berichtgeschiedenis).

#### Last-read tracking + "Nieuwe berichten" divider + ↓-knop (`components/chat/ChatPage.tsx`)

- Bij elke bezoek aan de chat wordt `localStorage` gelezen voor de laatste geziene timestamp (sleutel `chat-last-read-{initials}`).
- Als er ongelezen berichten zijn, scrolt de chat naar een oranje **"── Nieuwe berichten ──"** divider vóór het eerste ongelezen bericht.
- Als de gebruiker al bij het einde was, wordt direct naar beneden gescrold en als gelezen gemarkeerd.
- Een zwevende **↓-knop** rechtsonder verschijnt zodra de gebruiker niet meer onderaan zit — met een oranje badge met het aantal ongelezen berichten.
- Scrollen naar beneden (of klikken op de knop) markeert alle berichten als gelezen en slaat de nieuwe timestamp op in `localStorage`.

#### @mention contrast in eigen berichten (`components/chat/ChatMessage.tsx`)

In het oranje berichtenvlak (`bg-[#FF6B00]`) was `text-[#FF8C33]` voor @mentions nauwelijks leesbaar. Oplossing: in eigen berichten krijgen mentions nu `font-bold text-white bg-white/25 rounded px-1` (wit tekst met subtiel wit pill-achtergrond); in berichten van anderen blijft de oranje kleur behouden.

### 2026-06-04 — 13 handmatig toegevoegde spelers hersteld na players-rebuild (Claude Code)

Bij de spelersupdate van 2026-06-03 (`players.ts` herbouwd via build-script) zijn 13 eerder handmatig toegevoegde spelers verloren gegaan. Ze zijn teruggehaald uit de git-history en opnieuw toegevoegd aan het einde van `lib/data/players.ts`:

| Speler | Land | ID |
|--------|------|----|
| Neymar Jr. | Brazilië | 190871 |
| Rayan | Brazilië | 83494 |
| Marko Arnautović | Oostenrijk | 184200 |
| James Rodríguez | Colombia | 198710 |
| Enner Valencia | Ecuador | 220295 |
| Armando González | Mexico | 84061 |
| Gilberto Mora | Mexico | 79399 |
| Abbosbek Fayzullaev | Oezbekistan | 80304 |
| Khusniddin Alikulov | Oezbekistan | 277568 |
| Mukhammadali Urinboev | Oezbekistan | 79458 |
| Rayane Bounida | Marokko | 76944 |
| Alireza Jahanbakhsh | Iran | 215871 |
| Jürgen Locadia | Curaçao | 204366 |

**Preventie:** handmatig toegevoegde spelers worden voortaan aan het einde van `players.ts` buiten het build-script geplaatst, zodat een rebuild ze niet overschrijft.

### 2026-06-04 — Oranje vragen: nieuw antwoordtype + meerdere correcte antwoorden + 'geen' bij tijdvak (Claude Code)

#### Nieuw antwoordtype `exact_aantal_hoog` — Exact aantal (22–32)

Zelfde stepper-UI als `exact_aantal` (0–22), maar met bereik 22–32. Toegevoegd aan:
- `lib/types/oranjeVragen.ts`: type union + label
- `components/oranje/VraagIndienenCard.tsx`: `TYPES_KEUZE`
- `components/oranje/VragenBeantwoordenCard.tsx`: stepper met `MIN=22`, `MAX=32`
- `app/admin/AdminClient.tsx`: correct-antwoord invoer + override-dropdown

#### Meerdere correcte antwoorden per vraag

Admin kan nu meerdere correcte antwoorden instellen per Oranje-vraag. Opslag: `|`-gescheiden string in de bestaande `OranjeCorrectMap` (bijv. `"Gakpo|Depay"`). Backward compatible — bestaande enkelvoudige waarden werken ongewijzigd.

- `lib/types/oranjeVragen.ts`: helper `parseCorrectWaarden(s)` toegevoegd
- `lib/scoring.ts`: scoring controleert nu of het antwoord overeenkomt met *een van* de correcte waarden
- `app/admin/AdminClient.tsx` — `AdminCorrectInvoer` per type:
  - **Speler-types** (`speler_nl`, `speler_opp`, `speler_beide`): oranje tags met ×-knop + dropdown om extra spelers toe te voegen
  - **Knop-types** (`ja_nee`, `nl_opp`, `links_rechts`, `minuut`): meerdere knoppen tegelijk actief

#### 'Geen' optie bij tijdvak antwoordtype

`geen` toegevoegd als extra optie bij het `minuut`-antwoordtype, zowel in de deelnemer-UI (`VragenBeantwoordenCard.tsx`) als in de admin correct-invoer (`AdminClient.tsx`).

### 2026-06-06 — WK selectiewijziging Duitsland + Fantasy XV sortering + Oranje spelerslijst (Claude Code)

#### WK selectiewijziging Duitsland (`lib/data/wkOfficialSquads.ts`)

Lennart Karl (SofIFA ID 78063) is geblesseerd uitgevallen en vervangen door Assan Ouédraogo (SofIFA ID 276602). In `wkOfficialSquads.ts` vervangen: `KARL Lennart` (dob 2008-02-22) → `OUEDRAOGO Assan` (dob 2006-05-09). Assan Ouédraogo stond al in `players.ts` als Duitser, waardoor de `dob|country`-matching direct werkt en het vinkje correct wordt toegekend.

#### Fantasy XV: WK-vinkje spelers bovenaan (`components/fantasy/PlayerModal.tsx`)

In de spelersselectie-modal wordt nu altijd primair gesorteerd op WK-status: spelers met een ✓ (confirmed WK-selectie) verschijnen bovenaan, spelers zonder vinkje eronder. Binnen elke groep geldt de gekozen sortering (standaard: overall desc). Wijziging in de `useMemo`-sorteerfunctie (regel 138).

#### Oranje vragen: spelerslijst beperkt tot WK-selectie (`components/oranje/VragenBeantwoordenCard.tsx`)

Bij antwoordtypes `speler_nl`, `speler_opp` en `speler_beide` werden voorheen alle spelers van het betreffende land getoond. Nu worden `nedPlayers` en `oppPlayers` gefilterd op `getWKSquadStatus === 'confirmed'`, zodat alleen de 26 officieel geselecteerde WK-spelers per land beschikbaar zijn.

#### Export WK spelers-ID's (`scripts/export_wk_ids.py`, `scripts/wk_player_ids_2026.xlsx`)

Nieuw Python-script dat alle 1248 WK-spelers matcht via dezelfde `dob|country`-logica als `wkSquadCheck.ts` en de player-ID's exporteert naar Excel (één kolom `id`, gesorteerd op land + geboortedatum). Output: `scripts/wk_player_ids_2026.xlsx`.

---

### 2026-06-06 — Fantasy XV teamnaam opslaan + chat afbeeldingen fix + admin TG-vraag (Claude Code)

#### Fantasy XV: teamnaam opslaan betrouwbaarder (`components/fantasy/TeamNameEditor.tsx`, `app/actions/fantasy.ts`)

**Probleem:** Sommige deelnemers meldden dat hun teamnaam niet werd opgeslagen. Oorzaak: de save verliep via een 500ms debounce in `useFantasyXV`. Als de gebruiker de naam instelde en binnen die 500ms wegnavigeerde, cancelde de `useEffect`-cleanup de `setTimeout` en ging de naam verloren. Dit trof specifiek de teamnaam omdat gebruikers die vaak als laatste invullen vóór het verlaten van de pagina.

**Fix:**
- `TeamNameEditor.tsx`: bij `commit()` wordt nu direct `saveFantasy(fantasySquad, name, scratchpad)` aangeroepen als fire-and-forget. De server action-request is zo al onderweg vóórdat de component eventueel onmount, ongeacht de debounce.
- `app/actions/fantasy.ts`: de lege `catch {}` in `saveFantasy` verwijderd zodat KV-schrijffouten propageren naar de hook en de gebruiker de juiste foutindicator (`error`) ziet in plaats van een vals positief `saved`.

#### Admin: TG-vraag NED-SWE handmatig toegevoegd (KV)

Timo's (TG) vraag voor match 33 (NED–SWE, 20 jun) was niet correct opgeslagen. Via een eenmalig Node.js-script direct in Upstash KV toegevoegd onder `oranje_vragen:og`:

- **Vraag:** "Welke speler is 'Player of the match' volgens de FIFA?"
- **Type:** `speler_beide` (speler NL of tegenstander, 2×26 opties)
- **Status:** `gepubliceerd: false` — te publiceren via admin UI

#### Admin voortgang: oranjeTotal inclusief eigen vraag (`app/actions/admin.ts`)

`oranjeTotal` filterde ten onrechte de eigen gepubliceerde vraag eruit (deelnemers vullen ook hun eigen vraag in). Fix: filter `q.authorKey !== initialsLC` verwijderd uit zowel `oranjeTotal` als `oranjeCount`. Deelnemers zien nu correct 39/39 i.p.v. 36/36.

#### Deelnemer verwijderd: Bregt (BV) ASC (`lib/participants.ts`)

Bregt heeft besloten niet meer mee te doen. Verwijderd uit de deelnemerslijst. Geen KV-data aanwezig.

#### Tokens handmatig opgehoogd via script (KV)

Niels (NS), Peter (PN) en Wiger (WW) hadden nog 6 tokens over na de deadline. Via eenmalig Node.js-script (`scripts/add_tokens.mjs`) elk +2 tokens toegevoegd bij wedstrijden 10, 33 en 58.

### 2026-06-13 — Admin ESPN import gebruikt dezelfde speler-naam mapping (Claude Code)

#### Admin ESPN import: ESPN_PLAYER_MAP als primaire lookup (`app/api/admin/espn-import/route.ts`)

De admin ESPN import route had zijn eigen matching (via middleName/fullName). Nu wordt eerst `ESPN_PLAYER_MAP` geraadpleegd — dezelfde map als de live route — zodat doelpuntenmakers en assistgevers consistent gematcht worden bij handmatig invullen via de ESPN-koppeling in admin.

---

### 2026-06-13 — ESPN speler-naam mapping voor Fantasy XV live scoring (Claude Code)

#### Expliciete mapping player ID → ESPN displayName (`lib/data/espnPlayerMap.ts`, `app/api/matchday/live/route.ts`)

**Probleem:** Fantasy XV punten tijdens live wedstrijden konden mislopen als ESPN een andere spelernaam gebruikt dan de app (bv. `"Son Heung-Min"` vs `"Heung Min Son"`, `"Julio Enciso"` vs `"Julio César Enciso"`).

**Oplossing:** Statisch mapping-bestand `lib/data/espnPlayerMap.ts` met 205 entries (`Record<number, string>`: player ID → ESPN displayName). De live route gebruikt dit als eerste lookup vóór de bestaande string-fallbacks.

**Script:** `scripts/build_espn_player_map.mjs` (`npm run build-espn-player-map`) haalt alle ESPN WK-rosters op, matcht automatisch via normName + sorted-words fallback (voor Koreaanse naamsorde), en schrijft de map + `scripts/espn_unmatched.txt` voor handmatige review. Resultaat eerste run: 198 auto-gematcht, 7 handmatig aangevuld, 3 niet in players.ts (irrelevant voor Fantasy XV).

**Opnieuw draaien:** alleen nodig bij blessure-vervangingen mid-toernooi.

---

### 2026-06-28 — Matchday slides KO-fix + late predictions LV/TG (Claude Code)

#### Matchday slides: KO-wedstrijden tonen nu landen, quoteringen en fantasy spelers (`app/api/matchday/[id]/full/route.ts`)

**Probleem:** Op de matchday slides toonden KO-wedstrijden (73+) "TBD" in plaats van landvlaggen en 3-letter codes. Ook ontbraken de quoteringen en fantasy spelers.

**Oorzaak (3 bugs):**
1. De API route gebruikte alleen de statische `MATCHES` array waar KO-wedstrijden hardcoded als `TBD` staan — de dynamische teams uit Redis (`ko_match_teams`) werden niet gemerged.
2. Odds kwamen alleen uit `MATCH_ODDS` (groepsfase 1-72); `KO_MATCH_ODDS` werd niet geraadpleegd voor wedstrijden 73+.
3. `getFantasyPlayersForMatch()` matcht op landnaam, dus met "TBD" kon het nooit fantasy spelers vinden.

**Fix:** `ko_match_teams` wordt nu geladen uit Redis en gemerged met de statische match data. Voor matchId > 72 worden `KO_MATCH_ODDS` gebruikt i.p.v. `MATCH_ODDS`.

#### Late predictions: LV en TG wedstrijd 73 (Redis)

Laurens (LV) en Timo (TG) hadden hun voorspelling voor wedstrijd 73 te laat ingediend. Handmatig toegevoegd aan Redis:
- LV: 1 token, toto 2, uitslag 1-2
- TG: 1 token, toto 2, uitslag 0-2

---

### 2026-06-13 — Live slide bug: gegevens vorige wedstrijd zichtbaar tijdens nieuwe wedstrijd (Claude Code)

#### Live slide toont nu alleen actieve (IN_PLAY/PAUSED) wedstrijden (`components/matchday/MatchdayDrawer.tsx`)

**Probleem:** Bij de 2e t/m 4e wedstrijd van een matchday toonde de live slide de gegevens van wedstrijd 1. Oorzaak: de ESPN API geeft FINISHED terug voor afgesloten wedstrijden; de `liveMatches` array bevatte daardoor zowel de afgelopen (FINISHED) als de lopende wedstrijd. `hasLive` detecteerde de lopende wedstrijd correct, maar LiveSlide renderde alle items in de array — met wedstrijd 1 bovenaan.

**Fix:** In `MatchdayDrawer` wordt vóór het doorgeven aan `<LiveSlide>` gefilterd op `IN_PLAY | PAUSED`:
```ts
const activeLiveMatches = liveMatches.filter((m) => m.status === 'IN_PLAY' || m.status === 'PAUSED')
```
`hasLive` (de trigger voor het tonen van de slide) bleef ongewijzigd.

---

### 2026-06-12 — Stand scores decimalen & matchday slide centering (Claude Code)

#### Stand pagina: scores altijd met 2 decimalen (`components/leaderboard/RankList.tsx`)

- Totaal-kolom (`p.total`) en sub-view scores (`p[scoreKey]`) tonen nu `.toFixed(2)`
- Poule-kolom (`p.poulefase`) toont ook 2 decimalen
- Uitzondering: TOTO en UITSL sub-views tonen integers (geen decimalen), omdat dit tellers zijn

#### Matchday slides: centering fix op smalle smartphones (`components/matchday/MatchdayDrawer.tsx`)

**Probleem:** Op smartphones smaller dan 390px (b.v. 360–375px viewport) leek de slide-content naar rechts verschoven. De oorzaak: de slide is gefixeerd op 390px breed; `flex justify-center` + `overflow: auto` probeert de slide te centreren maar klipt de LINKERKANT af (negatief scrollen is niet mogelijk), zodat de rechterkant domineert.

**Fix:** `slideScale` state berekend uit `document.documentElement.clientWidth`. Op schermen < 390px wordt `transform: scale(w/390)` toegepast op de slide-wrapper, gecombineerd met negatieve side-margins (`-(390 × (1−scale) / 2)` aan beide kanten) zodat de flex-container de visuele breedte correct ziet en geen overflow meer optreedt. Op ≥ 390px: geen transform.

---

### 2026-06-11 — Stand pagina: ASC Inzet + Pot gevuld (Claude Code)

#### ASC weddenschappen toegevoegd (`app/(app)/stand/StandClient.tsx`)

9 toernooiweddenschappen ingevuld voor de ASC groep in `WEDDENSCHAPPEN.asc`: Duitsland wint van Curacao (100×), Spanje/Frankrijk/Nederland winnaar WK, Kane/Messi topscoorder, Ødegaard/Ferran assist koning, combi Spanje+Oyarzabal.

#### ASC potregels toegevoegd (`app/(app)/stand/StandClient.tsx`)

Beginbedrag €280 + aftrekposten (welkomstbonus -1, matchday 01 toto/uitslag -5, toernooi weddenschappen -19) ingevuld in `POT_REGELS.asc`. Huidige pot: €255,00.

#### Chat: afbeelding uploaden repareerd op iOS (`components/chat/ChatInput.tsx`, `components/chat/ChatPage.tsx`)

**Probleem:** Gebruikers konden op het camera-icoontje drukken en een afbeelding selecteren, maar er gebeurde daarna niets.

**Oorzaak:** In `openFilePicker()` werd een `<input type="file">` aangemaakt en direct geklikt, maar nooit aan de DOM toegevoegd. iOS Safari vereist dat een file-input in de DOM aanwezig is op het moment van `.click()` — anders wordt het `change`-event na bestandskeuze niet gefired.

**Fix:**
- `ChatInput.tsx`: `document.body.appendChild(input)` vóór `.click()`, gevolgd door `document.body.removeChild(input)` in de `onchange`-handler.
- `ChatPage.tsx`: `handleSendImage` gooit nu een `Error` als de upload-API een fout teruggeeft (i.p.v. stil `return`), zodat `uploading`-state correct reset en de fout zichtbaar wordt.

---

### 2026-06-29 — Export: KO-wedstrijden (73-104) toegevoegd (Claude Code)

#### Admin export uitgebreid met KO-wedstrijden (`app/api/export/route.ts`)

**Wat:** De Excel-export vanuit het admin scherm bevatte alleen groepswedstrijden (1-72). Nu worden ook KO-wedstrijden (73-104) geëxporteerd.

**Wijzigingen:**

- **Poule sheet per deelnemer**: KO-wedstrijd voorspellingen (tokens, toto + quote, uitslag + quote) worden geschreven naar rijen 93-128 (kolommen B, Q, R, S, T) — dezelfde kolommen als de groepswedstrijden
- **Wedstrijd-tabs 73-104**: Toto-quoteringen (G5-G7) en uitslagquoteringen (B/C kolommen) worden gevuld uit `KO_MATCH_ODDS`
- **`rowForKoMatch()` helper**: Mapt matchId 73-104 naar Excel-rijen, rekening houdend met scheidingsrijen tussen KO-rondes (1/16, 1/8, 1/4, 1/2, TF, F)
- **KO teamnamen uit KV**: `ko_match_teams` wordt opgehaald zodat toto-labels de echte teamnamen tonen (bijv. "Duitsland") i.p.v. "TBD" uit de statische MATCHES array. Thuisploeg/Uitploeg kolommen (M/O) worden ook ingevuld
