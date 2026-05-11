#!/usr/bin/env node
/**
 * scrape-ko-odds.mjs
 * Haalt WK 2026 KO-outright quoteringen op van Unibet/Kambi.
 *
 * Gebruik: node scripts/scrape-ko-odds.mjs
 * Vereist: Node 18+ (ingebouwde fetch)
 *
 * Schrijft:
 *   lib/data/knockoutQuotes.ts        — KO-quoteringen per land
 *   lib/data/knockoutQuotes_trends.ts — stijging/daling t.o.v. vorige run
 *
 * Datastructuur in Kambi:
 *   - Event "WK 2026" (id via /event/group/{groupId})
 *     → 5× "Eindpositie" betOffers (gesorteerd hoog→laag = winnaar→r16)
 *   - Events "Groep A–L"
 *     → "Eindpositie Groep" betOffer = poulewinnaar per land
 *   - Events "{Land} Markten 2026"
 *     → "Kwalificeert zich voor knockout-fase" (Ja) = derde/qualify
 *   - tweede wordt berekend: 1 / (1/qualify - 1/win_group)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const QUOTES_FILE = join(__dirname, '..', 'lib', 'data', 'knockoutQuotes.ts');
const TRENDS_FILE = join(__dirname, '..', 'lib', 'data', 'knockoutQuotes_trends.ts');

const BASE      = 'https://eu-offering-api.kambicdn.com/offering/v2018/ubnl';
const QS        = 'lang=nl_NL&market=NL&client_id=2&channel_id=1';
const GROUP_ID  = 2010133908; // WK 2026 Kambi groep-ID

// Kambi/event-naam → app-naam
const NAME_MAP = {
  'VS':                   'Verenigde Staten',
  'Haiti':                'Haïti',
  'Saudi-Arabië':         'Saoedi-Arabië',
  'Bosnië-Herzegovina':   'Bosnië en Herzegovina',
};

function norm(name) { return NAME_MAP[name] ?? name; }
function toDecimal(kambiOdds) { return Math.round(kambiOdds / 10) / 100; }

function calcTrend(prev, curr) {
  if (prev == null || curr == null) return null;
  if (curr > prev + 0.01) return 'up';
  if (curr < prev - 0.01) return 'down';
  return 'same';
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function getBetOffers(eventId) {
  return getJSON(`${BASE}/betoffer/event/${eventId}.json?${QS}`);
}

// ── Vorige quotes lezen voor trends ────────────────────────────────────────

function parsePrevQuotes(filePath) {
  if (!existsSync(filePath)) return {};
  const prev = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^\s+'([^']+)':\s*\{([^}]+)\}/);
    if (!m) continue;
    const entry = {};
    for (const [, k, v] of m[2].matchAll(/(\w+):\s*([\d.]+)/g)) {
      entry[k] = parseFloat(v);
    }
    if (Object.keys(entry).length > 0) prev[m[1]] = entry;
  }
  return prev;
}

// ── Hoofdprogramma ──────────────────────────────────────────────────────────

async function main() {
  console.log('🏆 WK 2026 KO-outright quoteringen scraper — Unibet/Kambi\n');

  const prevQuotes = parsePrevQuotes(QUOTES_FILE);
  const hasPrev    = Object.keys(prevQuotes).length > 0;
  console.log(hasPrev
    ? `📈 Vorige run: ${Object.keys(prevQuotes).length} landen als basis voor trends\n`
    : `📈 Eerste run — nog geen trenddata\n`
  );

  // 1. Haal alle events op in de WK 2026-groep
  console.log('📡 Ophalen WK 2026 event-groep...');
  const groupData = await getJSON(`${BASE}/event/group/${GROUP_ID}.json?${QS}`);
  const allEvents = groupData.events ?? [];
  console.log(`   ${allEvents.length} events gevonden\n`);

  // Categoriseer events
  const tournamentEvent = allEvents.find(e => e.name === 'WK 2026' && !e.awayName);
  const groupEvents     = allEvents.filter(e => /^Groep [A-L]$/.test(e.name) && !e.awayName);
  const countryEvents   = allEvents.filter(e => /markten 2026$/i.test(e.name) && !e.awayName);

  console.log(`   Toernooi-event: ${tournamentEvent?.name ?? '(niet gevonden)'} (id ${tournamentEvent?.id})`);
  console.log(`   Groepsevents: ${groupEvents.length} (A–L)`);
  console.log(`   Landenmarkten: ${countryEvents.length}`);
  console.log('');

  if (!tournamentEvent) {
    console.error('❌ Geen "WK 2026" toernooi-event gevonden — controleer groep-ID');
    process.exit(1);
  }

  // 2. Toernooi-outrights: 5× Eindpositie → winnaar/finale/r4/r8/r16
  console.log('📊 Ophalen toernooi-outrights (winnaar/finale/r4/r8/r16)...');
  const tournData    = await getBetOffers(tournamentEvent.id);
  const eindposOffer = tournData.betOffers?.filter(bo => bo.criterion?.label === 'Eindpositie') ?? [];
  console.log(`   ${eindposOffer.length} Eindpositie-offers gevonden`);

  // Sorteer op gemiddelde odds (hoog→laag = winnaar→r16)
  const withAvg = eindposOffer.map(bo => {
    const sum = (bo.outcomes ?? []).reduce((s, o) => s + (o.odds ?? 0), 0);
    const avg = sum / (bo.outcomes?.length ?? 1);
    return { bo, avg };
  }).sort((a, b) => b.avg - a.avg);

  const ROUND_KEYS = ['winnaar', 'finale', 'r4', 'r8', 'r16'];
  const byRound    = {}; // key → { country → decimal }

  withAvg.forEach(({ bo }, idx) => {
    const key = ROUND_KEYS[idx];
    if (!key) return;
    byRound[key] = {};
    for (const o of bo.outcomes ?? []) {
      if (!o.label || !o.odds) continue;
      byRound[key][norm(o.label)] = toDecimal(o.odds);
    }
    console.log(`   ${key.padEnd(8)} (${Object.keys(byRound[key]).length} landen, bv. Argentinië: ${byRound[key]['Argentinië'] ?? '?'})`);
  });
  console.log('');

  await new Promise(r => setTimeout(r, 300));

  // 3. Groepswinnaars: Eindpositie Groep per groep
  console.log('📊 Ophalen groepswinnaar-quoteringen (Groep A–L)...');
  const byPoulewinnaar = {};

  for (const ev of groupEvents.sort((a, b) => a.name.localeCompare(b.name))) {
    process.stdout.write(`   ${ev.name}...`);
    const gData = await getBetOffers(ev.id);
    const offer = gData.betOffers?.find(bo => bo.criterion?.label === 'Eindpositie Groep');
    if (!offer) {
      console.log(' ⚠ geen "Eindpositie Groep" markt');
    } else {
      let n = 0;
      for (const o of offer.outcomes ?? []) {
        if (!o.label || !o.odds) continue;
        byPoulewinnaar[norm(o.label)] = toDecimal(o.odds);
        n++;
      }
      console.log(` ✓ (${n} landen)`);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`   Totaal: ${Object.keys(byPoulewinnaar).length} landen\n`);

  // 4. Kwalificatie KO-fase per land
  console.log('📊 Ophalen "kwalificeert voor KO-fase" per land...');
  const byDerde = {};

  for (const ev of countryEvents) {
    const country = norm(ev.name.replace(/ [Mm]arkten 2026$/, ''));
    const cData   = await getBetOffers(ev.id);
    const offer   = cData.betOffers?.find(bo =>
      bo.criterion?.label?.toLowerCase().includes('kwalificeert') ||
      bo.criterion?.label?.toLowerCase().includes('knockout')
    );
    if (offer) {
      const jaOutcome = offer.outcomes?.find(o => o.label === 'Ja' && o.odds);
      if (jaOutcome) {
        byDerde[country] = toDecimal(jaOutcome.odds);
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`   Totaal: ${Object.keys(byDerde).length} landen\n`);

  // 5. Bereken 'tweede' via formule: 1 / (p_qualify - p_win)
  const byTweede = {};
  for (const country of Object.keys(byPoulewinnaar)) {
    const oddsWin     = byPoulewinnaar[country];
    const oddsQualify = byDerde[country];
    if (!oddsWin || !oddsQualify) continue;

    const pWin    = 1 / oddsWin;
    const pQual   = 1 / oddsQualify;
    const pTweede = pQual - pWin;

    let oddsTweede;
    if (pTweede <= 0) {
      oddsTweede = 501;
    } else if (pTweede >= 1) {
      oddsTweede = 1.01;
    } else {
      oddsTweede = Math.round(100 / pTweede) / 100;
      oddsTweede = Math.max(1.01, Math.min(501, oddsTweede));
    }
    byTweede[country] = oddsTweede;
  }
  console.log(`   Tweede berekend voor ${Object.keys(byTweede).length} landen\n`);

  // 6. Samenvoegen per land
  const allCountries = new Set([
    ...Object.keys(byRound.winnaar ?? {}),
    ...Object.keys(byPoulewinnaar),
    ...Object.keys(byDerde),
  ]);

  const result = {};
  for (const country of [...allCountries].sort()) {
    const entry = {
      poulewinnaar: byPoulewinnaar[country] ?? null,
      tweede:       byTweede[country]       ?? null,
      derde:        byDerde[country]         ?? null,
      r16:          byRound.r16?.[country]   ?? null,
      r8:           byRound.r8?.[country]    ?? null,
      r4:           byRound.r4?.[country]    ?? null,
      finale:       byRound.finale?.[country] ?? null,
      winnaar:      byRound.winnaar?.[country] ?? null,
    };
    if (Object.values(entry).some(v => v !== null)) {
      result[country] = entry;
    }
  }

  // 7. Schrijf knockoutQuotes.ts
  const lines = [
    `// Automatisch gegenereerd door scripts/scrape-ko-odds.mjs — niet handmatig aanpassen`,
    ``,
    `export interface CountryKOQuotes {`,
    `  poulewinnaar: number | null`,
    `  tweede: number | null`,
    `  derde: number | null`,
    `  r16: number | null`,
    `  r8: number | null`,
    `  r4: number | null`,
    `  finale: number | null`,
    `  winnaar: number | null`,
    `}`,
    ``,
    `export const KO_QUOTES: Record<string, CountryKOQuotes> = {`,
  ];

  for (const [country, entry] of Object.entries(result)) {
    const vals = Object.entries(entry).map(([k, v]) => `${k}: ${v ?? 'null'}`).join(', ');
    lines.push(`  '${country}': { ${vals} },`);
  }
  lines.push(`}`, ``);
  writeFileSync(QUOTES_FILE, lines.join('\n'), 'utf8');

  // 8. Schrijf knockoutQuotes_trends.ts
  const updatedAt  = new Date().toISOString();
  const trendLines = [
    `// Automatisch gegenereerd door scripts/scrape-ko-odds.mjs — niet handmatig aanpassen`,
    ``,
    `export type OddsTrend = 'up' | 'down' | 'same' | null`,
    ``,
    `export interface KOTrends {`,
    `  poulewinnaar: OddsTrend`,
    `  tweede: OddsTrend`,
    `  derde: OddsTrend`,
    `  r16: OddsTrend`,
    `  r8: OddsTrend`,
    `  r4: OddsTrend`,
    `  finale: OddsTrend`,
    `  winnaar: OddsTrend`,
    `}`,
    ``,
    `export const KO_QUOTES_UPDATED_AT = '${updatedAt}'`,
    ``,
    `export const KO_TRENDS: Record<string, KOTrends> = {`,
  ];

  for (const [country, entry] of Object.entries(result)) {
    const prev    = prevQuotes[country];
    const tVals   = ['poulewinnaar','tweede','derde','r16','r8','r4','finale','winnaar']
      .map(k => `${k}: ${JSON.stringify(calcTrend(prev?.[k] ?? null, entry[k]))}`)
      .join(', ');
    trendLines.push(`  '${country}': { ${tVals} },`);
  }
  trendLines.push(`}`, ``);
  writeFileSync(TRENDS_FILE, trendLines.join('\n'), 'utf8');

  // 9. Samenvatting
  console.log(`✅ Klaar!`);
  console.log(`   ${Object.keys(result).length} landen met KO-quotes`);
  if (hasPrev) {
    const changed = Object.entries(result).filter(([c, e]) => {
      const p = prevQuotes[c];
      return p && Object.keys(e).some(k => e[k] !== null && p[k] !== null && Math.abs(e[k] - p[k]) > 0.01);
    }).length;
    console.log(`   ${changed} landen met gewijzigde quote t.o.v. vorige run`);
  }
  console.log(`\n📁 ${QUOTES_FILE}`);
  console.log(`📁 ${TRENDS_FILE}`);
}

main().catch(err => {
  console.error('\n❌ Fout:', err.message);
  process.exit(1);
});
