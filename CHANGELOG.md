# Changelog — Panenka WK 2026

## [Unreleased] — 2026-05-27

### Bugfixes groepschat
- **Berichten laden niet** — `@upstash/redis` v1.37+ deserialiseert JSON-members automatisch naar objecten; `JSON.parse()` daarop gooit een fout. Nieuwe `parseMember()` helper vangt beide gevallen op (`string` én al-geparsed object).
- **GET route crashte zonder JSON-response** — try/catch toegevoegd aan `GET /api/chat/messages`; bij een serverfout komt er nu altijd JSON terug (geen HTML-errorpagina die de client niet kon parsen). Foutmelding in de app toont nu ook de technische oorzaak.

### Verbeteringen groepschat
- **Toetsenbord-gap op Android** — keyboard-hoogte berekening was fout op Android (`resizes-content`): beide viewports krimpen gelijk, waardoor de formule altijd 0 gaf. Nieuwe aanpak slaat het historisch maximum op en berekent `visualShrink − layoutShrink` als netto toetsenbordhoogte. Werkt nu correct op iOS én Android.
- **@mention — `@all` toegevoegd** — `@all` (📢 Iedereen) verschijnt nu altijd als eerste suggestie wanneer de query leeg is of begint met "all" / "iedereen". Eerder was de lijst leeg als er nog geen berichten geladen waren.

---

## 2026-05-27 — feat: groepschat verbeteringen (fd118c5)
- @mention dropdown en toetsenbord-fix (eerste poging)
- Diverse UI bugfixes groepschat

## 2026-05-26 — feat: in-app groepschat (c69beed)
- Volledig groepschat systeem: tekst, afbeeldingen, GIF, poll, emoji-reacties, reply, swipe-to-reply
- Redis sorted set opslag (Upstash), polling elke 5 seconden
- Push notificaties via web-push + service worker
- @mention systeem (basis)
- Beker-icoon verplaatst van BottomNav naar AppHeader

## 2026-05-26 — data: quoteringen update (20bd1e2)

## 2026-05-24 — feat: diverse updates (94dfcf6)
- Export kladblokspelers
- Fix oranje vraag indienen UX
- Quoteringen update

## 2026-05-24 — feat: LiveSlide ESPN-integratie (cdfbbad)
- Live wedstrijdresultaten via ESPN API
- Data-herstel scripts
- Standings bugfix

## 2026-05-22 — feat: Fantasy XV uitbreidingen
- Handmatige spelertoevoegingen (G. Mora, R. Bounida)
- FDO live testknop in preview
- ALL_SLOTS bugfix
