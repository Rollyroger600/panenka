# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Taal

Dit project is Nederlandstalig. Alle communicatie, UI-teksten, variabelenamen in databestanden, en commit messages zijn in het Nederlands tenzij technische conventie anders dicteert (bijv. TypeScript interfaces, React component names).

## Commando's

```bash
npm run dev          # Dev server (Turbopack), standaard op localhost:3000
npm run build        # Productie build (gebruikt als type-check + compilatie-verificatie)
npm run lint         # ESLint
npm run scrape       # Update alle quoteringen (groep + KO outright) via Unibet/Kambi
node scripts/scrape-ko-match-odds.mjs   # Update KO-wedstrijd quoteringen + kickoff-tijden → koMatchOdds.ts + KV
```

Er zijn geen tests geconfigureerd (Playwright is geïnstalleerd maar er zijn geen testbestanden).

## Architectuur

Next.js 15 App Router met Turbopack. Alles draait op Vercel. Geen database — **Upstash Redis** (REST API) is de enige backend storage.

### App-fasen

`lib/config.ts` bevat `APP_PHASE` (1 = pre-toernooi, 2 = groepsfase, 3 = knock-outfase). Veel UI-condities zijn hierop gebaseerd (welke tabs zichtbaar zijn, readOnly states, BottomNav labels).

### Route-structuur

- `app/page.tsx` — landing/login (selecteer naam → zet cookies `participant`, `participantName`, `group`)
- `app/(app)/` — beveiligde app-shell (middleware checkt `participant` cookie)
  - `poulefase/` — groepswedstrijden (#1-72) voorspellingen, na deadline readOnly met scores
  - `knockout/` — twee hoofd-tabs: "Landen" (KO-landen picks) en "Wedstrijden" (KO-match predictions #73-104)
  - `fantasy/` — fantasy XV team
  - `oranje/` — oranje vragen (NL-wedstrijden)
  - `stand/` — tussenstand/leaderboard
  - `chat/` — groepschat
- `app/admin/` — admin panel (wachtwoord-beveiligd, niet in app-shell)
- `app/api/` — API routes (matchday data, chat, ESPN import, push notifications)

### Data flow

1. **Geen registratie** — 15 vaste deelnemers, login door naam te selecteren op landing page
2. **Twee groepen**: OG (15 deelnemers) en ASC (15 deelnemers). WS en RA zitten in beide groepen (dual-group)
3. **Client state**: Zustand store (`store/gameStore.ts`) voor predictions, knockout picks, fantasy squad
4. **Persistentie**: Server actions in `app/actions/` lezen/schrijven naar Upstash Redis via `lib/kv/kv.ts`
5. **Auto-save**: `usePredictions` hook debounced (500ms) saves naar Redis bij elke store-wijziging

### KV-sleutels (Redis)

- `predictions:{initials}` — alle wedstrijdvoorspellingen (match 1-104)
- `knockout:{initials}` — KO-landen picks (welke landen gaan door)
- `fantasy:{initials}` — fantasy squad
- `results` — admin-ingevoerde wedstrijduitslagen
- `ko_match_teams` — KO-wedstrijd teams + kickoff-tijden (type: `Record<number, { home, away, kickoff? }>`)
- `ko_results` — welke landen door zijn per ronde
- `scores:{groupId}` — berekende scores per deelnemer (na admin score-run)
- `oranje_vragen:{groupId}`, `oranje_antwoorden:{groupId}:{initials}`, `oranje_correct:{groupId}`, `oranje_beoordeling:{groupId}`

**Let op**: `kvSet` doet `redis.set(key, JSON.stringify(value))`. Bij directe REST API calls naar Upstash: gebruik `body: JSON.stringify(value)` (enkele encoding), NIET `JSON.stringify(JSON.stringify(value))`.

### Scoring

`lib/scoring.ts` — `scoreParticipant()` berekent alles:
- **Poulefase** (match 1-72): `tokens × toto_quote + tokens × uitslag_quote`
- **KO-wedstrijden** (match 73-104): zelfde formule, odds uit `KO_MATCH_ODDS`
- **KO-landen**: tokens × quote per correct voorspeld doorgestomd land
- **Oranje**: levert geen punten op maar bonus tokens (`ceil(correct × 0.5)`)
- **Fantasy**: `(goals + assists) × speler_quote`

### Quoteringen

- `lib/data/odds.ts` — groepswedstrijden (1-72), gegenereerd door `scripts/scrape-odds.mjs`
- `lib/data/koMatchOdds.ts` — KO-wedstrijden (73-104), gegenereerd door `scripts/scrape-ko-match-odds.mjs`
- `lib/data/knockoutQuotes.ts` — KO-landen quoteringen, gegenereerd door `scripts/scrape-ko-odds.mjs`
- Bron: Unibet/Kambi API

### Token budgetten

- **Groepsfase**: 335 + per-deelnemer bonus (1-10) tokens, verdeeld over 72 wedstrijden + KO-landen picks
- **KO-wedstrijden**: 65 + oranje bonus tokens, 1-6 per wedstrijd (minimum 1)

### Deadlines

- Groepsfase: enkele globale deadline (`hooks/useDeadline.ts`)
- KO-wedstrijden: per-match deadline, 2 uur voor aftrap (`hooks/useKoMatchDeadline.ts`). Kickoff-tijden komen uit `ko_match_teams` KV

### Styling

Tailwind CSS. Donker thema met oranje accent (`#FF6B00`). Commerciële self-hosted fonts: Built Titling (headings), Sporty Pro (accent cijfers), Chalk Board (fantasy). Zie `app/globals.css` voor `@font-face` declaraties.

## Einde sessie hook

Bij het commando "einde sessie": werk de changelog in PROJECT.md bij, commit, en push. Dit is geconfigureerd als hook in `.claude/settings.local.json`.
