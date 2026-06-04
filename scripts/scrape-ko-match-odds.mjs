#!/usr/bin/env node
/**
 * scrape-ko-match-odds.mjs
 * Haalt quoteringen op voor KO-wedstrijden (matchId 73–104) van Unibet/Kambi.
 *
 * Gebruik:
 *   node scripts/scrape-ko-match-odds.mjs
 *
 * Vereist:
 *   - Node 18+ (ingebouwde fetch)
 *   - scripts/ko-match-teams.json met de bekende KO-teams (zie formaat hieronder)
 *
 * ko-match-teams.json formaat:
 *   [
 *     { "id": 73, "home": "Nederland", "away": "Argentinië" },
 *     { "id": 74, "home": "Frankrijk", "away": "Brazilië" },
 *     ...
 *   ]
 *   Wedstrijden die nog TBD zijn weglaten; ze worden overgeslagen.
 *
 * Schrijft naar:
 *   lib/data/koMatchOdds.ts  — quoteringen voor bekende KO-wedstrijden
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const TEAMS_FILE   = join(__dirname, 'ko-match-teams.json');
const OUT_FILE     = join(__dirname, '..', 'lib', 'data', 'koMatchOdds.ts');

const BASE = 'https://eu-offering-api.kambicdn.com/offering/v2018/ubnl';
const QS   = 'lang=nl_NL&market=NL&client_id=2&channel_id=1';

const NAME_MAP = {
  'VS':                 'Verenigde Staten',
  'Haiti':              'Haïti',
  'Bosnië-Herzegovina': 'Bosnië en Herzegovina',
};

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function norm(name) { return NAME_MAP[name] ?? name; }
function toScoreKey(label) { return label.replace('-', ' - '); }
function toDecimal(kambiOdds) { return Math.round(kambiOdds / 10) / 100; }

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

async function main() {
  console.log('⚽ WK 2026 KO-wedstrijd quoteringen — Unibet/Kambi\n');

  if (!existsSync(TEAMS_FILE)) {
    console.error(`❌ ${TEAMS_FILE} niet gevonden.`);
    console.error('   Maak dit bestand aan met de bekende KO-teams (zie commentaar bovenin dit script).');
    process.exit(1);
  }

  const koMatches = JSON.parse(readFileSync(TEAMS_FILE, 'utf8'));
  console.log(`📋 ${koMatches.length} KO-wedstrijden geladen uit ko-match-teams.json\n`);

  // Haal eventlijst + 1X2-quotes op
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

  // Verwerk KO-wedstrijden
  const newEntries = {};
  const missing = [];

  for (const match of koMatches) {
    const key   = `${match.home}|${match.away}`;
    const event = eventByTeams[key];

    if (!event) {
      missing.push({ id: match.id, teams: `${match.home} vs ${match.away}` });
      continue;
    }

    process.stdout.write(`  📊 Match ${String(match.id).padStart(3)}: ${match.home} vs ${match.away} ...`);
    const scores = await fetchCorrectScores(event.id);
    newEntries[match.id] = { ...event, scores };
    console.log(` ✓ (${Object.keys(scores).length} scores)`);
    await new Promise(r => setTimeout(r, 250));
  }

  // Lees bestaande koMatchOdds.ts en bewaar al bekende entries
  let existing = {};
  if (existsSync(OUT_FILE)) {
    for (const line of readFileSync(OUT_FILE, 'utf8').split('\n')) {
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
      existing[id] = { home: +m[2], draw: +m[3], away: +m[4], scores };
    }
  }

  // Merge: nieuwe entries overschrijven bestaande voor zelfde ID
  const merged = { ...existing, ...newEntries };

  // Schrijf koMatchOdds.ts
  const lines = [
    `import type { MatchOdds } from './odds'`,
    ``,
    `// Quoteringen voor KO-wedstrijden (matchId 73–104)`,
    `// Worden gevuld door scripts/scrape-ko-match-odds.mjs zodra de teams bekend zijn.`,
    `export const KO_MATCH_ODDS: Record<number, MatchOdds> = {`,
  ];

  for (const id of Object.keys(merged).map(Number).sort((a, b) => a - b)) {
    const { home, draw, away, scores } = merged[id];
    const scoresStr = Object.entries(scores).map(([k, v]) => `'${k}': ${v}`).join(', ');
    lines.push(`  ${id}: { home: ${home}, draw: ${draw}, away: ${away}, scores: { ${scoresStr} } },`);
  }

  lines.push(`}`, ``);
  writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');

  console.log(`\n✅ Klaar!`);
  console.log(`   ${Object.keys(newEntries).length} nieuwe wedstrijden bijgewerkt`);
  console.log(`   ${Object.keys(merged).length} wedstrijden totaal in koMatchOdds.ts`);
  if (missing.length) {
    console.log(`\n   ${missing.length} wedstrijden niet gevonden op Kambi:`);
    for (const m of missing) console.log(`     Match ${m.id}: ${m.teams}`);
    console.log(`   (app toont '-' voor deze wedstrijden)`);
  }
  console.log(`\n📁 ${OUT_FILE}`);
}

main().catch(err => {
  console.error('\n❌ Fout:', err.message);
  process.exit(1);
});
