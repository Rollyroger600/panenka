/**
 * Herstel WK-voorspellingen vanuit Recovery CSV exports.
 *
 * Gebruik:
 *   node scripts/restore-predictions.mjs
 *
 * Vereist:
 *   - c:\RA\WK 2026\Recovery\Recovery_OG.csv
 *   - c:\RA\WK 2026\Recovery\Recovery_ASC.csv
 *   - .env.local met UPSTASH_REDIS_REST_URL + TOKEN
 *
 * Voer dit uit NADAT cleanup-live-test.mjs heeft gedraaid.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const RECOVERY_DIR = 'c:\\RA\\WK 2026\\Recovery'

// ── .env.local ────────────────────────────────────────────────────────────────
function readEnvLocal() {
  const env = {}
  try {
    const lines = readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const idx = t.indexOf('=')
      if (idx === -1) continue
      env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim()
    }
  } catch { /* geen .env.local */ }
  return env
}

const env   = readEnvLocal()
const BASE  = env.UPSTASH_REDIS_REST_URL  || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

if (!BASE || !TOKEN) {
  console.error('UPSTASH_REDIS_REST_URL en/of TOKEN niet gevonden in .env.local')
  process.exit(1)
}

// ── Redis helpers ─────────────────────────────────────────────────────────────
async function redisGet(key) {
  const res = await fetch(`${BASE}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) throw new Error(`Redis GET fout: ${res.status}`)
  const json = await res.json()
  return json.result
}

async function redisPipeline(commands) {
  const res = await fetch(`${BASE}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Redis pipeline fout: ${res.status} ${await res.text()}`)
  return res.json()
}

// ── Bevestiging via CLI ───────────────────────────────────────────────────────
function confirm(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// ── Wedstrijdschema (voor teamnaam → 1/X/2) ──────────────────────────────────
const MATCHES = [
  { id:  1, home: 'Mexico',               away: 'Zuid-Afrika' },
  { id:  2, home: 'Zuid-Korea',           away: 'Tsjechië' },
  { id:  3, home: 'Canada',               away: 'Bosnië en Herzegovina' },
  { id:  4, home: 'Verenigde Staten',     away: 'Paraguay' },
  { id:  5, home: 'Qatar',                away: 'Zwitserland' },
  { id:  6, home: 'Brazilië',             away: 'Marokko' },
  { id:  7, home: 'Haïti',               away: 'Schotland' },
  { id:  8, home: 'Australië',            away: 'Turkije' },
  { id:  9, home: 'Duitsland',            away: 'Curaçao' },
  { id: 10, home: 'Nederland',            away: 'Japan' },
  { id: 11, home: 'Ivoorkust',            away: 'Ecuador' },
  { id: 12, home: 'Zweden',               away: 'Tunesië' },
  { id: 13, home: 'Spanje',               away: 'Kaapverdië' },
  { id: 14, home: 'België',               away: 'Egypte' },
  { id: 15, home: 'Saoedi-Arabië',        away: 'Uruguay' },
  { id: 16, home: 'Iran',                 away: 'Nieuw-Zeeland' },
  { id: 17, home: 'Frankrijk',            away: 'Senegal' },
  { id: 18, home: 'Irak',                 away: 'Noorwegen' },
  { id: 19, home: 'Argentinië',           away: 'Algerije' },
  { id: 20, home: 'Oostenrijk',           away: 'Jordanië' },
  { id: 21, home: 'Portugal',             away: 'DR Congo' },
  { id: 22, home: 'Engeland',             away: 'Kroatië' },
  { id: 23, home: 'Ghana',                away: 'Panama' },
  { id: 24, home: 'Oezbekistan',          away: 'Colombia' },
  { id: 25, home: 'Tsjechië',             away: 'Zuid-Afrika' },
  { id: 26, home: 'Zwitserland',          away: 'Bosnië en Herzegovina' },
  { id: 27, home: 'Canada',               away: 'Qatar' },
  { id: 28, home: 'Mexico',               away: 'Zuid-Korea' },
  { id: 29, home: 'Verenigde Staten',     away: 'Australië' },
  { id: 30, home: 'Schotland',            away: 'Marokko' },
  { id: 31, home: 'Brazilië',             away: 'Haïti' },
  { id: 32, home: 'Turkije',              away: 'Paraguay' },
  { id: 33, home: 'Nederland',            away: 'Zweden' },
  { id: 34, home: 'Duitsland',            away: 'Ivoorkust' },
  { id: 35, home: 'Ecuador',              away: 'Curaçao' },
  { id: 36, home: 'Tunesië',              away: 'Japan' },
  { id: 37, home: 'Spanje',               away: 'Saoedi-Arabië' },
  { id: 38, home: 'België',               away: 'Iran' },
  { id: 39, home: 'Uruguay',              away: 'Kaapverdië' },
  { id: 40, home: 'Nieuw-Zeeland',        away: 'Egypte' },
  { id: 41, home: 'Argentinië',           away: 'Oostenrijk' },
  { id: 42, home: 'Frankrijk',            away: 'Irak' },
  { id: 43, home: 'Noorwegen',            away: 'Senegal' },
  { id: 44, home: 'Jordanië',             away: 'Algerije' },
  { id: 45, home: 'Portugal',             away: 'Oezbekistan' },
  { id: 46, home: 'Engeland',             away: 'Ghana' },
  { id: 47, home: 'Panama',               away: 'Kroatië' },
  { id: 48, home: 'Colombia',             away: 'DR Congo' },
  { id: 49, home: 'Zwitserland',          away: 'Canada' },
  { id: 50, home: 'Bosnië en Herzegovina', away: 'Qatar' },
  { id: 51, home: 'Schotland',            away: 'Brazilië' },
  { id: 52, home: 'Marokko',              away: 'Haïti' },
  { id: 53, home: 'Tsjechië',             away: 'Mexico' },
  { id: 54, home: 'Zuid-Afrika',          away: 'Zuid-Korea' },
  { id: 55, home: 'Curaçao',              away: 'Ivoorkust' },
  { id: 56, home: 'Ecuador',              away: 'Duitsland' },
  { id: 57, home: 'Japan',                away: 'Zweden' },
  { id: 58, home: 'Tunesië',              away: 'Nederland' },
  { id: 59, home: 'Turkije',              away: 'Verenigde Staten' },
  { id: 60, home: 'Paraguay',             away: 'Australië' },
  { id: 61, home: 'Noorwegen',            away: 'Frankrijk' },
  { id: 62, home: 'Senegal',              away: 'Irak' },
  { id: 63, home: 'Kaapverdië',           away: 'Saoedi-Arabië' },
  { id: 64, home: 'Uruguay',              away: 'Spanje' },
  { id: 65, home: 'Egypte',              away: 'Iran' },
  { id: 66, home: 'Nieuw-Zeeland',        away: 'België' },
  { id: 67, home: 'Panama',               away: 'Engeland' },
  { id: 68, home: 'Kroatië',              away: 'Ghana' },
  { id: 69, home: 'Colombia',             away: 'Portugal' },
  { id: 70, home: 'DR Congo',             away: 'Oezbekistan' },
  { id: 71, home: 'Algerije',             away: 'Oostenrijk' },
  { id: 72, home: 'Jordanië',             away: 'Argentinië' },
]

const MATCH_MAP = new Map(MATCHES.map(m => [m.id, m]))

function teamToToto(matchId, teamRaw) {
  if (!teamRaw || !teamRaw.trim()) return null
  const team = teamRaw.trim()
  if (team === '-') return 'X'
  const m = MATCH_MAP.get(matchId)
  if (!m) { console.warn(`  ⚠️  Onbekend wedstrijd-ID: ${matchId}`); return null }
  if (team === m.home) return '1'
  if (team === m.away) return '2'
  // Gedeeltelijke match voor afgekapte Excel-waarden
  if (m.home.startsWith(team) || team.startsWith(m.home.slice(0, 6))) return '1'
  if (m.away.startsWith(team) || team.startsWith(m.away.slice(0, 6))) return '2'
  console.warn(`  ⚠️  Teamnaam niet herkend: "${team}" in wedstrijd ${matchId} (${m.home} vs ${m.away})`)
  return null
}

function normalizeScore(raw) {
  if (!raw || !raw.trim()) return null
  return raw.trim().replace(/\s*-\s*/, ' - ')
}

// ── Spelers lookup (middleName → Player object) ───────────────────────────────
const PLAYERS = {
  'Harry Kane':         { id: 202126, leagueId: 13,     name: 'H. Kane',      middleName: 'Harry Kane',         fullName: 'Harry Edward Kane',                      country: 'Engeland',        overall: 90, positions: ['ST'],               age: 32, dob: '1993-07-28', club: 'FC Bayern München',        league: 'Bundesliga',          confederation: 'UEFA'      },
  'Kylian Mbappé':      { id: 231747, leagueId: 53,     name: 'K. Mbappé',    middleName: 'Kylian Mbappé',      fullName: 'Kylian Mbappé Lottin',                   country: 'Frankrijk',       overall: 91, positions: ['ST','LW','LM'],    age: 27, dob: '1998-12-20', club: 'Real Madrid',              league: 'La Liga',             confederation: 'UEFA'      },
  'Vinícius Júnior':    { id: 238794, leagueId: 53,     name: 'Vini Jr.',     middleName: 'Vinícius Júnior',    fullName: 'Vinicius José Paixão de Oliveira Junior', country: 'Brazilië',        overall: 89, positions: ['LW','ST','LM'],   age: 25, dob: '2000-07-12', club: 'Real Madrid',              league: 'La Liga',             confederation: 'CONMEBOL'  },
  'Omar Marmoush':      { id: 256675, leagueId: 13,     name: 'O. Marmoush',  middleName: 'Omar Marmoush',      fullName: 'Omar Khaled Mohamed Marmoush',           country: 'Egypte',          overall: 83, positions: ['ST','CAM','LW'],  age: 27, dob: '1999-02-07', club: 'Manchester City',          league: 'Premier League',      confederation: 'CAF'       },
  'Julián Alvarez':     { id: 246191, leagueId: 53,     name: 'J. Alvarez',   middleName: 'Julián Alvarez',     fullName: 'Julián Álvarez',                         country: 'Argentinië',      overall: 86, positions: ['ST'],            age: 26, dob: '2000-01-31', club: 'Atlético Madrid',          league: 'La Liga',             confederation: 'CONMEBOL'  },
  'Heung Min Son':      { id: 200104, leagueId: 39,     name: 'H. Son',       middleName: 'Heung Min Son',      fullName: 'Heung-min Son',                          country: 'Zuid-Korea',      overall: 84, positions: ['LW','ST','LM'],  age: 33, dob: '1992-07-08', club: 'Los Angeles FC',           league: 'Major League Soccer', confederation: 'AFC'       },
  'Jonathan David':     { id: 243630, leagueId: 31,     name: 'J. David',     middleName: 'Jonathan David',     fullName: 'Jonathan Christian David',               country: 'Canada',          overall: 81, positions: ['ST'],            age: 26, dob: '2000-01-14', club: 'Juventus',                 league: 'Serie A',             confederation: 'CONCACAF'  },
  'Ismael Saibari':     { id: 259480, leagueId: 10,     name: 'I. Saibari',   middleName: 'Ismael Saibari',     fullName: 'Ismael Saibari Ben El Basra',            country: 'Marokko',         overall: 80, positions: ['CAM','CM'],       age: 24, dob: '2001-07-18', club: 'PSV',                      league: 'Eredivisie',          confederation: 'CAF'       },
  'Christian Pulisic':  { id: 227796, leagueId: 31,     name: 'C. Pulisic',   middleName: 'Christian Pulisic',  fullName: 'Christian Mate Pulišić',                 country: 'Verenigde Staten', overall: 85, positions: ['RW','RM','CAM'], age: 27, dob: '1998-09-18', club: 'AC Milan',                 league: 'Serie A',             confederation: 'CONCACAF'  },
  'Ayase Ueda':         { id: 252162, leagueId: 10,     name: 'A. Ueda',      middleName: 'Ayase Ueda',         fullName: 'Ayase Ueda',                             country: 'Japan',           overall: 78, positions: ['ST'],            age: 27, dob: '1998-08-28', club: 'Feyenoord',               league: 'Eredivisie',          confederation: 'AFC'       },
  'Germán Berterame':   { id: 237248, leagueId: 39,     name: 'G. Berterame', middleName: 'Germán Berterame',   fullName: 'Germán Berterame',                       country: 'Mexico',          overall: 78, positions: ['ST','LW'],       age: 27, dob: '1998-11-13', club: 'Inter Miami',              league: 'Major League Soccer', confederation: 'CONCACAF'  },
  'Martin Boyle':       { id: 211221, leagueId: 50,     name: 'M. Boyle',     middleName: 'Martin Boyle',       fullName: 'Martin Callie Boyle',                    country: 'Australië',       overall: 71, positions: ['ST','RM','RW'],  age: 33, dob: '1993-04-25', club: 'Hibernian',               league: 'Premiership',         confederation: 'AFC'       },
  'Lamine Yamal':       { id: 277643, leagueId: 53,     name: 'L. Yamal',     middleName: 'Lamine Yamal',       fullName: 'Lamine Yamal Nasraoui Ebana',            country: 'Spanje',          overall: 89, positions: ['RM','RW'],       age: 18, dob: '2007-07-13', club: 'FC Barcelona',             league: 'La Liga',             confederation: 'UEFA'      },
  'Désiré Doué':        { id: 271421, leagueId: 16,     name: 'D. Doué',      middleName: 'Désiré Doué',        fullName: 'Désiré Nonka-Maho Doué',                 country: 'Frankrijk',       overall: 85, positions: ['RW','LW','CM','RM'], age: 21, dob: '2005-06-03', club: 'Paris Saint-Germain', league: 'Ligue 1',             confederation: 'UEFA'      },
  'Yan Diomande':       { id: 78012,  leagueId: 19,     name: 'Y. Diomande',  middleName: 'Yan Diomande',       fullName: 'Yan Diomande',                           country: 'Ivoorkust',       overall: 80, positions: ['LM','RM','ST','LW'], age: 19, dob: '2006-11-14', club: 'RB Leipzig',           league: 'Bundesliga',          confederation: 'CAF'       },
  'Kendry Páez':        { id: 274559, leagueId: 353,    name: 'K. Páez',      middleName: 'Kendry Páez',        fullName: 'Ray Kendry Páez Andrade',                country: 'Ecuador',         overall: 73, positions: ['CAM','RW','CM'], age: 19, dob: '2007-05-04', club: 'River Plate',              league: 'Liga Profesional de Fútbol', confederation: 'CONMEBOL' },
  'Bruno Guimarães':    { id: 247851, leagueId: 13,     name: 'B. Guimarães', middleName: 'Bruno Guimarães',    fullName: 'Bruno Guimarães Rodrigues Moura',        country: 'Brazilië',        overall: 86, positions: ['CM','CDM'],      age: 28, dob: '1997-11-16', club: 'Newcastle United',         league: 'Premier League',      confederation: 'CONMEBOL'  },
  'Willian Pacho':      { id: 256196, leagueId: 16,     name: 'W. Pacho',     middleName: 'Willian Pacho',      fullName: 'Willian Joel Pacho Tenorio',             country: 'Ecuador',         overall: 87, positions: ['CB'],            age: 24, dob: '2001-10-16', club: 'Paris Saint-Germain',      league: 'Ligue 1',             confederation: 'CONMEBOL'  },
  'Mohammed Kudus':     { id: 245155, leagueId: 13,     name: 'M. Kudus',     middleName: 'Mohammed Kudus',     fullName: 'Mohammed Kudus',                         country: 'Ghana',           overall: 81, positions: ['RW','LW','ST','RM'], age: 25, dob: '2000-08-02', club: 'Tottenham Hotspur',    league: 'Premier League',      confederation: 'CAF'       },
  'Julian Quiñones':    { id: 234579, leagueId: 350,    name: 'J. Quiñones',  middleName: 'Julian Quiñones',    fullName: 'Julián Andrés Quiñones Quiñones',        country: 'Mexico',          overall: 81, positions: ['ST','LW','LM'],  age: 29, dob: '1997-03-24', club: 'Al Qadsiah FC',            league: 'Pro League',          confederation: 'CONCACAF'  },
  'Joe Bell':           { id: 254142, leagueId: 41,     name: 'J. Bell',      middleName: 'Joe Bell',           fullName: 'Joe Zen Robert Bell',                    country: 'Nieuw-Zeeland',   overall: 75, positions: ['CDM','CM'],      age: 27, dob: '1999-04-27', club: 'Viking FK',               league: 'Eliteserien',         confederation: 'OFC'       },
  'Min Su Kim':         { id: 75437,  leagueId: 54,     name: 'Minsu',        middleName: 'Min Su Kim',         fullName: 'Min-su Kim',                             country: 'Zuid-Korea',      overall: 70, positions: ['LM','LW','CAM'], age: 20, dob: '2006-01-19', club: 'FC Andorra',               league: 'La Liga 2',           confederation: 'AFC'       },
  'Montader Madjed':    { id: 264749, leagueId: 56,     name: 'M. Madjed',    middleName: 'Montader Madjed',    fullName: 'Montader Madjed',                        country: 'Irak',            overall: 69, positions: ['RM','RW'],       age: 21, dob: '2005-04-07', club: 'Hammarby Fotboll',         league: 'Allsvenskan',         confederation: 'AFC'       },
  'Antoine Semenyo':    { id: 241236, leagueId: 13,     name: 'A. Semenyo',   middleName: 'Antoine Semenyo',    fullName: 'Antoine Serlom Semenyo',                 country: 'Ghana',           overall: 84, positions: ['RM','LM','RW'],  age: 26, dob: '2000-01-07', club: 'Manchester City',          league: 'Premier League',      confederation: 'CAF'       },
  'Mohamed Salah':      { id: 209331, leagueId: 13,     name: 'M. Salah',     middleName: 'Mohamed Salah',      fullName: 'Mohamed Salah Hamed Ghaly',              country: 'Egypte',          overall: 89, positions: ['RM','RW'],       age: 33, dob: '1992-06-15', club: 'Liverpool',               league: 'Premier League',      confederation: 'CAF'       },
  'Lautaro Martínez':   { id: 231478, leagueId: 31,     name: 'L. Martínez',  middleName: 'Lautaro Martínez',   fullName: 'Lautaro Javier Martínez',                country: 'Argentinië',      overall: 88, positions: ['ST'],            age: 28, dob: '1997-08-22', club: 'Inter',                   league: 'Serie A',             confederation: 'CONMEBOL'  },
  'Liberato Cacace':    { id: 242429, leagueId: 14,     name: 'L. Cacace',    middleName: 'Liberato Cacace',    fullName: 'Liberato Gianpaolo Cacace',              country: 'Nieuw-Zeeland',   overall: 72, positions: ['LB','LM','CAM','LW'], age: 25, dob: '2000-09-27', club: 'Wrexham',             league: 'Championship',        confederation: 'OFC'       },
  'Marquinhos':         { id: 207865, leagueId: 16,     name: 'Marquinhos',   middleName: 'Marquinhos',         fullName: 'Marcos Aoás Corrêa',                     country: 'Brazilië',        overall: 87, positions: ['CB'],            age: 32, dob: '1994-05-14', club: 'Paris Saint-Germain',      league: 'Ligue 1',             confederation: 'CONMEBOL'  },
  'Luis Suárez':        { id: 176580, leagueId: 39,     name: 'L. Suárez',    middleName: 'Luis Suárez',        fullName: 'Luis Alberto Suárez Díaz',               country: 'Uruguay',         overall: 78, positions: ['ST','CAM'],      age: 39, dob: '1987-01-24', club: 'Inter Miami',              league: 'Major League Soccer', confederation: 'CONMEBOL'  },
  'Ricardo Pepi':       { id: 251223, leagueId: 10,     name: 'R. Pepi',      middleName: 'Ricardo Pepi',       fullName: 'Ricardo Daniel Pepi',                    country: 'Verenigde Staten', overall: 76, positions: ['ST'],           age: 23, dob: '2003-01-09', club: 'PSV',                      league: 'Eredivisie',          confederation: 'CONCACAF'  },
  'Nestory Irankunda':  { id: 266245, leagueId: 14,     name: 'N. Irankunda', middleName: 'Nestory Irankunda',  fullName: 'Nestory Irankunda',                      country: 'Australië',       overall: 69, positions: ['RM','ST','LM','RW'], age: 20, dob: '2006-02-09', club: 'Watford',              league: 'Championship',        confederation: 'AFC'       },
  'Obed Vargas':        { id: 263701, leagueId: 53,     name: 'O. Vargas',    middleName: 'Obed Vargas',        fullName: 'Obed Gómez Vargas',                      country: 'Mexico',          overall: 71, positions: ['CM','CDM','RM','CAM'], age: 20, dob: '2005-08-05', club: 'Atlético Madrid',   league: 'La Liga',             confederation: 'CONCACAF'  },
  'Badredine Bouanani': { id: 270465, leagueId: 19,     name: 'B. Bouanani',  middleName: 'Badredine Bouanani', fullName: 'Badredine Bouanani',                     country: 'Algerije',        overall: 75, positions: ['RW','CAM','RM'], age: 21, dob: '2004-12-08', club: 'VfB Stuttgart',            league: 'Bundesliga',          confederation: 'CAF'       },
  'Alexander Isak':     { id: 233731, leagueId: 13,     name: 'A. Isak',      middleName: 'Alexander Isak',     fullName: 'Alexander Isak',                         country: 'Zweden',          overall: 87, positions: ['ST'],            age: 26, dob: '1999-09-21', club: 'Liverpool',               league: 'Premier League',      confederation: 'UEFA'      },
  'Raphinha':           { id: 233419, leagueId: 53,     name: 'Raphinha',     middleName: 'Raphinha',           fullName: 'Raphael Dias Belloli',                   country: 'Brazilië',        overall: 89, positions: ['LM','LW'],       age: 29, dob: '1996-12-14', club: 'FC Barcelona',             league: 'La Liga',             confederation: 'CONMEBOL'  },
  'Luis Díaz':          { id: 241084, leagueId: 19,     name: 'L. Díaz',      middleName: 'Luis Díaz',          fullName: 'Luis Fernando Díaz Marulanda',           country: 'Colombia',        overall: 87, positions: ['LM','LW','ST'],  age: 29, dob: '1997-01-13', club: 'FC Bayern München',        league: 'Bundesliga',          confederation: 'CONMEBOL'  },
  'Sadio Mané':         { id: 208722, leagueId: 350,    name: 'S. Mané',      middleName: 'Sadio Mané',         fullName: 'Sadio Mané',                             country: 'Senegal',         overall: 83, positions: ['LM','RM','ST','LW'], age: 34, dob: '1992-04-10', club: 'Al Nassr',             league: 'Pro League',          confederation: 'CAF'       },
  'Jobe Bellingham':    { id: 270964, leagueId: 19,     name: 'J. Bellingham', middleName: 'Jobe Bellingham',   fullName: 'Jobe Samuel Patrick Bellingham',         country: 'Engeland',        overall: 77, positions: ['CM','CDM','CAM'], age: 20, dob: '2005-09-23', club: 'Borussia Dortmund',        league: 'Bundesliga',          confederation: 'UEFA'      },
  'Arda Güler':         { id: 264309, leagueId: 53,     name: 'A. Güler',     middleName: 'Arda Güler',         fullName: 'Arda Güler',                             country: 'Turkije',         overall: 82, positions: ['RM','CAM','RW'], age: 21, dob: '2005-02-25', club: 'Real Madrid',              league: 'La Liga',             confederation: 'UEFA'      },
  'Kota Takai':         { id: 264702, leagueId: 19,     name: 'K. Takai',     middleName: 'Kota Takai',         fullName: 'Kota Takai',                             country: 'Japan',           overall: 72, positions: ['CB'],            age: 21, dob: '2004-09-04', club: 'Borussia Mönchengladbach', league: 'Bundesliga',          confederation: 'AFC'       },
  'Amad Diallo':        { id: 254088, leagueId: 13,     name: 'Amad',         middleName: 'Amad Diallo',        fullName: 'Amad Diallo Traoré',                     country: 'Ivoorkust',       overall: 80, positions: ['CAM','RW','RM','CM'], age: 23, dob: '2002-07-11', club: 'Manchester United',     league: 'Premier League',      confederation: 'CAF'       },
  'Hirving Lozano':     { id: 221992, leagueId: 39,     name: 'H. Lozano',    middleName: 'Hirving Lozano',     fullName: 'Hirving Rodrigo Lozano Bahena',          country: 'Mexico',          overall: 77, positions: ['LW','RW','LM'],  age: 30, dob: '1995-07-30', club: 'San Diego FC',             league: 'Major League Soccer', confederation: 'CONCACAF'  },
  'Sontje Hansen':      { id: 254752, leagueId: 14,     name: 'S. Hansen',    middleName: 'Sontje Hansen',      fullName: 'Misjonne Juniffer Naigelino Hansen',     country: 'Curaçao',         overall: 69, positions: ['LM','RM','CAM','LW'], age: 24, dob: '2002-05-18', club: 'Middlesbrough',        league: 'Championship',        confederation: 'CONCACAF'  },
  'Donyell Malen':      { id: 231447, leagueId: 31,     name: 'D. Malen',     middleName: 'Donyell Malen',      fullName: 'Donyell Malen',                          country: 'Nederland',       overall: 79, positions: ['RM','RW','LM'],  age: 27, dob: '1999-01-19', club: 'Roma',                     league: 'Serie A',             confederation: 'UEFA'      },
  'Eldor Shomurodov':   { id: 239964, leagueId: 68,     name: 'E. Shomurodov', middleName: 'Eldor Shomurodov',  fullName: 'Eldor Shomurodov',                       country: 'Oezbekistan',     overall: 74, positions: ['ST','CAM'],      age: 30, dob: '1995-06-29', club: 'Medipol Başakşehir FK',    league: 'Süper Lig',           confederation: 'AFC'       },
  'Santiago Giménez':   { id: 245152, leagueId: 31,     name: 'S. Giménez',   middleName: 'Santiago Giménez',   fullName: 'Santiago Tomás Giménez',                 country: 'Mexico',          overall: 79, positions: ['ST'],            age: 25, dob: '2001-04-18', club: 'AC Milan',                 league: 'Serie A',             confederation: 'CONCACAF'  },
  'Riyad Mahrez':       { id: 204485, leagueId: 350,    name: 'R. Mahrez',    middleName: 'Riyad Mahrez',       fullName: 'Riyad Mahrez',                           country: 'Algerije',        overall: 84, positions: ['RM','RW'],       age: 35, dob: '1991-02-21', club: 'Al Ahli SFC',              league: 'Pro League',          confederation: 'CAF'       },
  'Malik Tillman':      { id: 256853, leagueId: 19,     name: 'M. Tillman',   middleName: 'Malik Tillman',      fullName: 'Malik Leon Tillman',                     country: 'Verenigde Staten', overall: 80, positions: ['CAM','LW','CM'],  age: 24, dob: '2002-05-28', club: 'Bayer 04 Leverkusen',     league: 'Bundesliga',          confederation: 'CONCACAF'  },
  'Nico Paz':           { id: 277846, leagueId: 31,     name: 'N. Paz',       middleName: 'Nico Paz',           fullName: 'Nicolás Paz Martínez',                   country: 'Argentinië',      overall: 81, positions: ['CAM','CM'],      age: 21, dob: '2004-09-08', club: 'Como',                     league: 'Serie A',             confederation: 'CONMEBOL'  },
  'Endrick':            { id: 272505, leagueId: 16,     name: 'Endrick',      middleName: 'Endrick',            fullName: 'Endrick Felipe Moreira de Sousa',        country: 'Brazilië',        overall: 78, positions: ['ST','RW'],       age: 19, dob: '2006-07-21', club: 'Olympique Lyonnais',       league: 'Ligue 1',             confederation: 'CONMEBOL'  },
  'Antonio Nusa':       { id: 262863, leagueId: 19,     name: 'A. Nusa',      middleName: 'Antonio Nusa',       fullName: 'Antonio Eromonsele Nordby Nusa',         country: 'Noorwegen',       overall: 78, positions: ['LM','CAM','LW'], age: 21, dob: '2005-04-17', club: 'RB Leipzig',               league: 'Bundesliga',          confederation: 'UEFA'      },
  'Youssef En-Nesyri':  { id: 235410, leagueId: 350,    name: 'Y. En-Nesyri', middleName: 'Youssef En-Nesyri',  fullName: 'Youssef En-Nesyri',                      country: 'Marokko',         overall: 80, positions: ['ST'],            age: 29, dob: '1997-06-01', club: 'Al Ittihad',               league: 'Pro League',          confederation: 'CAF'       },
  'Kaoru Mitoma':       { id: 255565, leagueId: 13,     name: 'K. Mitoma',    middleName: 'Kaoru Mitoma',       fullName: 'Kaoru Mitoma',                           country: 'Japan',           overall: 81, positions: ['LM','LW'],       age: 29, dob: '1997-05-20', club: 'Brighton & Hove Albion',   league: 'Premier League',      confederation: 'AFC'       },
  'Kang In Lee':        { id: 243780, leagueId: 16,     name: 'Lee Kang In',  middleName: 'Kang In Lee',        fullName: 'Kang-in Lee',                            country: 'Zuid-Korea',      overall: 80, positions: ['RW','CM','RM'],  age: 25, dob: '2001-02-19', club: 'Paris Saint-Germain',      league: 'Ligue 1',             confederation: 'AFC'       },
  'Cyle Larin':         { id: 226777, leagueId: 14,     name: 'C. Larin',     middleName: 'Cyle Larin',         fullName: 'Cyle Christopher Larin',                 country: 'Canada',          overall: 74, positions: ['ST'],            age: 31, dob: '1995-04-17', club: 'Southampton',              league: 'Championship',        confederation: 'CONCACAF'  },
  'Darwin Núñez':       { id: 253072, leagueId: 350,    name: 'D. Núñez',     middleName: 'Darwin Núñez',       fullName: 'Darwin Gabriel Núñez Ribeiro',           country: 'Uruguay',         overall: 78, positions: ['ST'],            age: 26, dob: '1999-06-24', club: 'Al Hilal',                 league: 'Pro League',          confederation: 'CONMEBOL'  },
  'Mehdi Taremi':       { id: 241788, leagueId: 63,     name: 'M. Taremi',    middleName: 'Mehdi Taremi',       fullName: 'Mehdi Taremi',                           country: 'Iran',            overall: 78, positions: ['ST'],            age: 33, dob: '1992-07-18', club: 'Olympiacos FC',            league: 'Super League',        confederation: 'AFC'       },
  'Kenan Yıldız':       { id: 277954, leagueId: 31,     name: 'K. Yildiz',    middleName: 'Kenan Yıldız',       fullName: 'Kenan Yıldız',                           country: 'Turkije',         overall: 81, positions: ['CAM','LM','LW','CM'], age: 21, dob: '2005-05-04', club: 'Juventus',             league: 'Serie A',             confederation: 'UEFA'      },
  'Alejandro Garnacho': { id: 268438, leagueId: 13,     name: 'A. Garnacho',  middleName: 'Alejandro Garnacho', fullName: 'Alejandro Garnacho Ferreyra',            country: 'Argentinië',      overall: 78, positions: ['CAM','LW','LM','CM'], age: 21, dob: '2004-07-01', club: 'Chelsea',              league: 'Premier League',      confederation: 'CONMEBOL'  },
  'Lionel Messi':       { id: 158023, leagueId: 39,     name: 'L. Messi',     middleName: 'Lionel Messi',       fullName: 'Lionel Andrés Messi Cuccitini',          country: 'Argentinië',      overall: 86, positions: ['RW','ST','CAM','RM'], age: 38, dob: '1987-06-24', club: 'Inter Miami',          league: 'Major League Soccer', confederation: 'CONMEBOL'  },
  'Almoez Ali':         { id: 268772, leagueId: 888889, name: 'A. Ali',       middleName: 'Almoez Ali',         fullName: 'Almoez Ali Zainalabedeen Mohamed Abdulla', country: 'Qatar',          overall: 73, positions: ['ST','RW'],       age: 29, dob: '1996-08-19', club: 'Al-Duhail',                league: 'Qatar Stars League',  confederation: 'AFC'       },
  'Mohamed Amoura':     { id: 264697, leagueId: 19,     name: 'M. Amoura',    middleName: 'Mohamed Amoura',     fullName: 'Mohamed El Amine Amoura',                country: 'Algerije',        overall: 80, positions: ['ST','LW','LM','CAM'], age: 26, dob: '2000-05-09', club: 'VfL Wolfsburg',        league: 'Bundesliga',          confederation: 'CAF'       },
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsvFile(filepath, codes) {
  const raw = readFileSync(filepath, 'utf8').replace(/^﻿/, '')
  const lines = raw.split('\n').map(l => l.replace(/\r$/, ''))

  const data = {}
  for (const code of codes) {
    data[code.toLowerCase()] = { predictions: {}, squad: {}, teamName: '' }
  }

  let nextLineIsTeamName = false

  for (const line of lines) {
    const cols = line.split(',')
    const first = cols[0].trim()

    // ── Wedstrijd rij: "# N" ──────────────────────────────────────────────────
    if (first.startsWith('# ')) {
      const matchId = parseInt(first.slice(2), 10)
      if (isNaN(matchId)) continue
      nextLineIsTeamName = false

      for (let i = 0; i < codes.length; i++) {
        const key = codes[i].toLowerCase()
        const base = 2 + i * 4
        const tokensRaw = (cols[base]     || '').trim()
        const totoRaw   = (cols[base + 1] || '').trim()
        const uitslagRaw = (cols[base + 2] || '').trim()

        const tokens  = tokensRaw !== '' ? parseInt(tokensRaw, 10) : null
        const toto    = teamToToto(matchId, totoRaw)
        const uitslag = normalizeScore(uitslagRaw)

        if (tokens !== null || toto !== null || uitslag !== null) {
          data[key].predictions[matchId] = { toto, uitslag, tokens }
        }
      }
      continue
    }

    // ── Fantasy rij: "1" t/m "15" ─────────────────────────────────────────────
    const slotNum = parseInt(first, 10)
    if (!isNaN(slotNum) && slotNum >= 1 && slotNum <= 15 && first === String(slotNum)) {
      const slotKey = slotNum <= 11 ? `p${slotNum - 1}` : `t${slotNum - 12}`
      nextLineIsTeamName = false

      for (let i = 0; i < codes.length; i++) {
        const key = codes[i].toLowerCase()
        const base = 2 + i * 4
        const playerName = (cols[base] || '').trim()
        if (!playerName) continue

        const player = PLAYERS[playerName]
        if (player) {
          data[key].squad[slotKey] = player
        } else {
          console.warn(`  ⚠️  Speler niet gevonden: "${playerName}" (${codes[i]} ${slotKey})`)
        }
      }
      continue
    }

    // ── Teamnaam rijen: header + data ─────────────────────────────────────────
    const hasTeamnaamHeader = cols.some(c => c.trim() === 'Teamnaam')
    if (hasTeamnaamHeader) {
      nextLineIsTeamName = true
      continue
    }

    if (nextLineIsTeamName) {
      nextLineIsTeamName = false
      for (let i = 0; i < codes.length; i++) {
        const key = codes[i].toLowerCase()
        const base = 2 + i * 4
        const name = (cols[base] || '').trim()
        if (name) data[key].teamName = name
      }
    }
  }

  return data
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  Restore WK-voorspellingen vanuit Recovery CSVs')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Parse CSVs
  const ogPath  = resolve(RECOVERY_DIR, 'Recovery_OG.csv')
  const ascPath = resolve(RECOVERY_DIR, 'Recovery_ASC.csv')

  console.log(`Laden OG:  ${ogPath}`)
  const ogData  = parseCsvFile(ogPath,  ['BS', 'WP', 'RA', 'WS'])
  console.log(`Laden ASC: ${ascPath}`)
  const ascData = parseCsvFile(ascPath, ['JH', 'NS', 'PN', 'WW', 'VH', 'JS'])

  // Samenvoegen
  const allData = { ...ogData, ...ascData }

  // ── Samenvatting ─────────────────────────────────────────────────────────────
  console.log('\n── Wat wordt hersteld ──────────────────────────────────────\n')
  const redisCommands = []

  for (const [initials, d] of Object.entries(allData)) {
    const predCount = Object.keys(d.predictions).length
    const squadCount = Object.keys(d.squad).length
    const hasPred = predCount > 0
    const hasSquad = squadCount > 0

    if (!hasPred && !hasSquad) {
      console.log(`  ${initials.toUpperCase().padEnd(3)}  — geen data, wordt overgeslagen`)
      continue
    }

    if (hasPred) {
      const withToto = Object.values(d.predictions).filter(p => p.toto).length
      console.log(`  ${initials.toUpperCase().padEnd(3)}  predictions: ${predCount} wedstrijden (${withToto} met toto)`)
      redisCommands.push({ key: `predictions:${initials}`, value: d.predictions, type: 'predictions' })
    }
    if (hasSquad) {
      const teamStr = d.teamName ? ` — team: "${d.teamName}"` : ''
      console.log(`  ${initials.toUpperCase().padEnd(3)}  fantasy:     ${squadCount} spelers${teamStr}`)
      redisCommands.push({ key: `fantasy:${initials}`, value: { squad: d.squad, teamName: d.teamName, scratchpad: {} }, type: 'fantasy' })
    }
  }

  if (redisCommands.length === 0) {
    console.log('\nGeen data om te schrijven. Script beëindigd.')
    return
  }

  // ── Veiligheidscheck: bestaande keys ──────────────────────────────────────
  console.log(`\n── Bestaande keys controleren (${redisCommands.length} keys) ──\n`)
  const nonEmptyKeys = []

  for (const cmd of redisCommands) {
    const current = await redisGet(cmd.key)
    if (current !== null) {
      nonEmptyKeys.push(cmd.key)
      console.log(`  ⚠️  ${cmd.key} is al gevuld — wordt overschreven`)
    } else {
      console.log(`  ✓  ${cmd.key} is leeg`)
    }
  }

  if (nonEmptyKeys.length > 0) {
    console.log(`\n⚠️  ${nonEmptyKeys.length} key(s) bevatten al data.`)
    console.log('   Dit zijn waarschijnlijk overgebleven testkeys.')
    console.log('   TIP: Draai eerst cleanup-live-test.mjs en voer dit script daarna opnieuw uit.\n')
  }

  // ── Bevestiging ───────────────────────────────────────────────────────────
  console.log(`\nKlaar om ${redisCommands.length} keys naar Redis te schrijven.`)
  const answer = await confirm('Doorgaan? [y/N]: ')

  if (answer !== 'y' && answer !== 'yes') {
    console.log('\nGeannuleerd. Geen data geschreven.')
    return
  }

  // ── Schrijven naar Redis ───────────────────────────────────────────────────
  console.log('\n── Schrijven naar Redis ────────────────────────────────────\n')
  const pipeline = redisCommands.map(cmd => ['SET', cmd.key, JSON.stringify(cmd.value)])
  const results  = await redisPipeline(pipeline)

  let ok = 0, err = 0
  results.forEach((r, i) => {
    const key = redisCommands[i].key
    if (r.error) {
      console.error(`  ✗  ${key}: ${r.error}`)
      err++
    } else {
      console.log(`  ✓  ${key}`)
      ok++
    }
  })

  console.log(`\n═══════════════════════════════════════════════════════════`)
  console.log(`  Klaar — ${ok} succesvol, ${err} mislukt.`)
  console.log(`═══════════════════════════════════════════════════════════\n`)

  if (ok > 0) {
    console.log('Volgende stap: verifieer via de app dat de deelnemers hun data zien.')
  }
}

main().catch(err => {
  console.error('Fout:', err)
  process.exit(1)
})
