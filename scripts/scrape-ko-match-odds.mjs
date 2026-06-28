#!/usr/bin/env node
/**
 * scrape-ko-match-odds.mjs
 * Haalt quoteringen + kickoff-tijden op voor KO-wedstrijden (matchId 73–104) van Unibet/Kambi.
 *
 * Gebruik:
 *   node scripts/scrape-ko-match-odds.mjs
 *
 * Vereist:
 *   - Node 18+ (ingebouwde fetch)
 *   - scripts/ko-match-teams.json met de bekende KO-teams (zie formaat hieronder)
 *   - .env.local met UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (voor kickoff-tijden)
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
 *   ko_match_teams KV        — kickoff-tijden worden gemerged in bestaande KV-data
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname    = dirname(fileURLToPath(import.meta.url));

// Laad .env.local handmatig (geen dotenv dependency nodig)
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

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
      start: eventObj.start,
    };
  }
  console.log(`   ${Object.keys(eventByTeams).length} events gevonden\n`);

  // Verwerk KO-wedstrijden
  const newEntries = {};
  const kickoffs = {};
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
    if (event.start) kickoffs[match.id] = { home: match.home, away: match.away, kickoff: event.start };
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

  // Schrijf kickoff-tijden naar ko_match_teams KV (merge met bestaande data)
  const kvUrl = process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken && Object.keys(kickoffs).length > 0) {
    console.log('\n📡 Kickoff-tijden opslaan in KV...');
    const kvRes = await fetch(`${kvUrl}/get/ko_match_teams`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    const kvData = await kvRes.json();
    let existing_kv = kvData.result ?? {};
    if (typeof existing_kv === 'string') existing_kv = JSON.parse(existing_kv);
    if (typeof existing_kv === 'string') existing_kv = JSON.parse(existing_kv);
    for (const [id, data] of Object.entries(kickoffs)) {
      existing_kv[id] = { ...existing_kv[id], ...data };
    }
    await fetch(`${kvUrl}/set/ko_match_teams`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` },
      body: JSON.stringify(existing_kv),
    });
    console.log(`   ${Object.keys(kickoffs).length} kickoff-tijden bijgewerkt in KV`);
  } else if (Object.keys(kickoffs).length > 0) {
    console.log('\n⚠ Geen UPSTASH env vars gevonden — kickoff-tijden niet opgeslagen in KV');
    console.log('  Kickoff-tijden gevonden:');
    for (const [id, data] of Object.entries(kickoffs)) {
      console.log(`    Match ${id}: ${data.kickoff}`);
    }
  }

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
