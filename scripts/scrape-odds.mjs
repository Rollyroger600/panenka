#!/usr/bin/env node
/**
 * scrape-odds.mjs
 * Haalt WK 2026 quoteringen op van Unibet/Kambi.
 *
 * Gebruik: node scripts/scrape-odds.mjs
 * Vereist: Node 18+ (ingebouwde fetch)
 *
 * Schrijft:
 *   lib/data/odds.ts        — alleen wedstrijden met échte Kambi-quotes
 *   lib/data/odds_trends.ts — stijging/daling t.o.v. vorige run
 *
 * Wedstrijden zonder Kambi-quote worden weggelaten (app toont '-').
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ODDS_FILE  = join(__dirname, '..', 'lib', 'data', 'odds.ts');
const TREND_FILE = join(__dirname, '..', 'lib', 'data', 'odds_trends.ts');

const BASE = 'https://eu-offering-api.kambicdn.com/offering/v2018/ubnl';
const QS   = 'lang=nl_NL&market=NL&client_id=2&channel_id=1';

// Kambi teamnamen → namen in matches.ts
const NAME_MAP = {
  'VS':                 'Verenigde Staten',
  'Haiti':              'Haïti',
  'Bosnië-Herzegovina': 'Bosnië en Herzegovina',
};

// Alle 72 groepswedstrijden (ronde 1-3)
const ALL_MATCHES = [
  { id:  1, home: 'Mexico',           away: 'Zuid-Afrika' },
  { id:  2, home: 'Zuid-Korea',        away: 'Tsjechië' },
  { id:  3, home: 'Canada',            away: 'Bosnië en Herzegovina' },
  { id:  4, home: 'Verenigde Staten',  away: 'Paraguay' },
  { id:  5, home: 'Qatar',             away: 'Zwitserland' },
  { id:  6, home: 'Brazilië',          away: 'Marokko' },
  { id:  7, home: 'Haïti',             away: 'Schotland' },
  { id:  8, home: 'Australië',         away: 'Turkije' },
  { id:  9, home: 'Duitsland',         away: 'Curaçao' },
  { id: 10, home: 'Nederland',         away: 'Japan' },
  { id: 11, home: 'Ivoorkust',         away: 'Ecuador' },
  { id: 12, home: 'Zweden',            away: 'Tunesië' },
  { id: 13, home: 'Spanje',            away: 'Kaapverdië' },
  { id: 14, home: 'België',            away: 'Egypte' },
  { id: 15, home: 'Saoedi-Arabië',     away: 'Uruguay' },
  { id: 16, home: 'Iran',              away: 'Nieuw-Zeeland' },
  { id: 17, home: 'Frankrijk',         away: 'Senegal' },
  { id: 18, home: 'Irak',              away: 'Noorwegen' },
  { id: 19, home: 'Argentinië',        away: 'Algerije' },
  { id: 20, home: 'Oostenrijk',        away: 'Jordanië' },
  { id: 21, home: 'Portugal',          away: 'DR Congo' },
  { id: 22, home: 'Engeland',          away: 'Kroatië' },
  { id: 23, home: 'Ghana',             away: 'Panama' },
  { id: 24, home: 'Oezbekistan',       away: 'Colombia' },
  { id: 25, home: 'Tsjechië',          away: 'Zuid-Afrika' },
  { id: 26, home: 'Zwitserland',       away: 'Bosnië en Herzegovina' },
  { id: 27, home: 'Canada',            away: 'Qatar' },
  { id: 28, home: 'Mexico',            away: 'Zuid-Korea' },
  { id: 29, home: 'Verenigde Staten',  away: 'Australië' },
  { id: 30, home: 'Schotland',         away: 'Marokko' },
  { id: 31, home: 'Brazilië',          away: 'Haïti' },
  { id: 32, home: 'Turkije',           away: 'Paraguay' },
  { id: 33, home: 'Nederland',         away: 'Zweden' },
  { id: 34, home: 'Duitsland',         away: 'Ivoorkust' },
  { id: 35, home: 'Ecuador',           away: 'Curaçao' },
  { id: 36, home: 'Tunesië',           away: 'Japan' },
  { id: 37, home: 'Spanje',            away: 'Saoedi-Arabië' },
  { id: 38, home: 'België',            away: 'Iran' },
  { id: 39, home: 'Uruguay',           away: 'Kaapverdië' },
  { id: 40, home: 'Nieuw-Zeeland',     away: 'Egypte' },
  { id: 41, home: 'Argentinië',        away: 'Oostenrijk' },
  { id: 42, home: 'Frankrijk',         away: 'Irak' },
  { id: 43, home: 'Noorwegen',         away: 'Senegal' },
  { id: 44, home: 'Jordanië',          away: 'Algerije' },
  { id: 45, home: 'Portugal',          away: 'Oezbekistan' },
  { id: 46, home: 'Engeland',          away: 'Ghana' },
  { id: 47, home: 'Panama',            away: 'Kroatië' },
  { id: 48, home: 'Colombia',          away: 'DR Congo' },
  { id: 49, home: 'Zwitserland',       away: 'Canada' },
  { id: 50, home: 'Bosnië en Herzegovina', away: 'Qatar' },
  { id: 51, home: 'Schotland',         away: 'Brazilië' },
  { id: 52, home: 'Marokko',           away: 'Haïti' },
  { id: 53, home: 'Tsjechië',          away: 'Mexico' },
  { id: 54, home: 'Zuid-Afrika',       away: 'Zuid-Korea' },
  { id: 55, home: 'Curaçao',           away: 'Ivoorkust' },
  { id: 56, home: 'Ecuador',           away: 'Duitsland' },
  { id: 57, home: 'Japan',             away: 'Zweden' },
  { id: 58, home: 'Tunesië',           away: 'Nederland' },
  { id: 59, home: 'Turkije',           away: 'Verenigde Staten' },
  { id: 60, home: 'Paraguay',          away: 'Australië' },
  { id: 61, home: 'Noorwegen',         away: 'Frankrijk' },
  { id: 62, home: 'Senegal',           away: 'Irak' },
  { id: 63, home: 'Kaapverdië',        away: 'Saoedi-Arabië' },
  { id: 64, home: 'Uruguay',           away: 'Spanje' },
  { id: 65, home: 'Egypte',            away: 'Iran' },
  { id: 66, home: 'Nieuw-Zeeland',     away: 'België' },
  { id: 67, home: 'Panama',            away: 'Engeland' },
  { id: 68, home: 'Kroatië',           away: 'Ghana' },
  { id: 69, home: 'Colombia',          away: 'Portugal' },
  { id: 70, home: 'DR Congo',          away: 'Oezbekistan' },
  { id: 71, home: 'Algerije',          away: 'Oostenrijk' },
  { id: 72, home: 'Jordanië',          away: 'Argentinië' },
];

// --- Hulpfuncties ---

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function norm(name) { return NAME_MAP[name] ?? name; }

function toScoreKey(label) { return label.replace('-', ' - '); }

function toDecimal(kambiOdds) { return Math.round(kambiOdds / 10) / 100; }

// Lees huidige odds.ts en parseer home/draw/away + scores per wedstrijd-ID
function parsePrevOdds(filePath) {
  if (!existsSync(filePath)) return {};
  const byId = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^\s+(\d+):\s*\{\s*home:\s*([\d.]+),\s*draw:\s*([\d.]+),\s*away:\s*([\d.]+)/);
    if (!m) continue;
    const id = parseInt(m[1]);
    const scores = {};
    const scoresMatch = line.match(/scores:\s*\{([^}]*)\}/);
    if (scoresMatch) {
      for (const entry of scoresMatch[1].matchAll(/'([^']+)':\s*([\d.]+)/g)) {
        scores[entry[1]] = parseFloat(entry[2]);
      }
    }
    byId[id] = { home: +m[2], draw: +m[3], away: +m[4], scores };
  }
  return byId;
}

// Bereken trend voor één waarde (drempel 0.01 om float-ruis te filteren)
function calcTrend(prev, curr) {
  if (prev == null) return null;
  if (curr > prev + 0.01) return 'up';
  if (curr < prev - 0.01) return 'down';
  return 'same';
}

async function fetchCorrectScores(eventId) {
  const data = await getJSON(`${BASE}/betoffer/event/${eventId}.json?${QS}`);
  const offer = data.betOffers?.find(bo => bo.criterion?.label === 'Correcte Score');
  if (!offer) {
    console.warn(`    ⚠ Geen Correcte Score markt voor event ${eventId}`);
    return {};
  }
  const scores = {};
  for (const o of offer.outcomes ?? []) {
    if (!o.label || !o.odds) continue;
    if (['Other', 'Overige', 'Anders'].includes(o.label)) continue;
    scores[toScoreKey(o.label)] = toDecimal(o.odds);
  }
  return scores;
}

// --- Hoofdprogramma ---

async function main() {
  console.log('⚽ WK 2026 quoteringen scraper — Unibet/Kambi\n');

  // 1. Bewaar huidige odds voor trendvergelijking
  const prevOdds = parsePrevOdds(ODDS_FILE);
  const hasPrev  = Object.keys(prevOdds).length > 0;
  console.log(hasPrev
    ? `📈 Vorige run: ${Object.keys(prevOdds).length} wedstrijden als basis voor trends\n`
    : `📈 Eerste run — nog geen trenddata\n`
  );

  // 2. Haal eventlijst + 1X2-quotes op
  console.log('📡 Ophalen eventlijst...');
  const listData = await getJSON(`${BASE}/listView/football/world_cup_2026.json?${QS}`);

  const eventByTeams = {};
  for (const ev of listData.events ?? []) {
    const eventObj = ev.event;
    if (!eventObj) continue;
    const offer = ev.betOffers?.find(bo => bo.criterion?.label === 'Reguliere Speeltijd');
    if (!offer) continue;
    const o = offer.outcomes ?? [];
    const homeOdds = o.find(x => x.label === '1')?.odds;
    const drawOdds = o.find(x => x.label === 'X')?.odds;
    const awayOdds = o.find(x => x.label === '2')?.odds;
    if (!homeOdds || !drawOdds || !awayOdds) continue;
    const key = `${norm(eventObj.homeName)}|${norm(eventObj.awayName)}`;
    eventByTeams[key] = {
      id:   eventObj.id,
      home: toDecimal(homeOdds),
      draw: toDecimal(drawOdds),
      away: toDecimal(awayOdds),
    };
  }
  console.log(`   ${Object.keys(eventByTeams).length} events gevonden\n`);

  // 3. Verwerk alle 72 wedstrijden
  const newEntries = {};
  const trends = {};
  const missing = [];

  for (const match of ALL_MATCHES) {
    const key   = `${match.home}|${match.away}`;
    const event = eventByTeams[key];

    if (!event) {
      missing.push(match.id);
      continue;
    }

    process.stdout.write(`  📊 Match ${String(match.id).padStart(2)}: ${match.home} vs ${match.away} ...`);

    const scores     = await fetchCorrectScores(event.id);
    const scoreCount = Object.keys(scores).length;

    newEntries[match.id] = { ...event, scores };

    // Bereken trends t.o.v. vorige run
    const prev = prevOdds[match.id];
    const scoreTrends = {};
    for (const [score, odd] of Object.entries(scores)) {
      scoreTrends[score] = calcTrend(prev?.scores?.[score], odd);
    }
    trends[match.id] = {
      home: calcTrend(prev?.home, event.home),
      draw: calcTrend(prev?.draw, event.draw),
      away: calcTrend(prev?.away, event.away),
      scores: scoreTrends,
    };

    console.log(` ✓ (${scoreCount} scores)`);
    await new Promise(r => setTimeout(r, 250));
  }

  // 4. Schrijf odds.ts (alleen echte Kambi-data, geen placeholders)
  const oddsLines = [
    `export interface MatchOdds {`,
    `  home: number`,
    `  draw: number`,
    `  away: number`,
    `  scores: Record<string, number>`,
    `}`,
    ``,
    `export const MATCH_ODDS: Record<number, MatchOdds> = {`,
  ];

  for (const match of ALL_MATCHES) {
    if (!newEntries[match.id]) continue;
    const { home, draw, away, scores } = newEntries[match.id];
    const scoresStr = Object.entries(scores).map(([k, v]) => `'${k}': ${v}`).join(', ');
    oddsLines.push(`  ${match.id}: { home: ${home}, draw: ${draw}, away: ${away}, scores: { ${scoresStr} } },`);
  }

  oddsLines.push(`}`, ``);
  writeFileSync(ODDS_FILE, oddsLines.join('\n'), 'utf8');

  // 5. Schrijf odds_trends.ts
  const updatedAt  = new Date().toISOString();
  const trendLines = [
    `export type OddsTrend = 'up' | 'down' | 'same' | null`,
    ``,
    `export interface MatchTrends {`,
    `  home: OddsTrend`,
    `  draw: OddsTrend`,
    `  away: OddsTrend`,
    `}`,
    ``,
    `export const ODDS_UPDATED_AT = '${updatedAt}'`,
    ``,
    `export const ODDS_TRENDS: Record<number, MatchTrends> = {`,
  ];

  for (const match of ALL_MATCHES) {
    if (!trends[match.id]) continue;
    const { home, draw, away, scores: st } = trends[match.id];
    const scoresStr = Object.entries(st ?? {}).map(([k, v]) => `'${k}': ${JSON.stringify(v)}`).join(', ');
    trendLines.push(`  ${match.id}: { home: ${JSON.stringify(home)}, draw: ${JSON.stringify(draw)}, away: ${JSON.stringify(away)}, scores: { ${scoresStr} } },`);
  }

  trendLines.push(`}`, ``);
  writeFileSync(TREND_FILE, trendLines.join('\n'), 'utf8');

  // 6. Samenvatting
  const updated = Object.keys(newEntries).length;
  const changed = Object.values(trends).filter(t => t.home !== 'same' || t.draw !== 'same' || t.away !== 'same').length;

  console.log(`\n✅ Klaar!`);
  console.log(`   ${updated} wedstrijden bijgewerkt met echte quotes`);
  if (hasPrev) console.log(`   ${changed} wedstrijden met gewijzigde quote t.o.v. vorige run`);
  if (missing.length) {
    console.log(`   ${missing.length} wedstrijden nog niet op Kambi: matches ${missing.join(', ')}`);
    console.log(`   (app toont '-' voor deze wedstrijden)`);
  }
  console.log(`\n📁 ${ODDS_FILE}`);
  console.log(`📁 ${TREND_FILE}`);
}

main().catch(err => {
  console.error('\n❌ Fout:', err.message);
  process.exit(1);
});
