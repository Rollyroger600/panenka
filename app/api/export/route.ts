import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import path from 'path'
import fs from 'fs/promises'
import XlsxPopulate from 'xlsx-populate'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { MATCHES } from '@/lib/data/matches'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import type { CountryKOQuotes } from '@/lib/data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { kvGet, participantKey, groupKey } from '@/lib/kv/kv'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import { WK_PLAYERS } from '@/lib/data/players'
import type { OranjeAntwoordenMap, OranjeVragenMap } from '@/lib/types/oranjeVragen'

const REGULAR_SLOTS = Array.from({ length: 11 }, (_, i) => `p${i}`)
const TALENT_SLOTS = Array.from({ length: 4 }, (_, i) => `t${i}`)
const PLAYER_BY_ID = Object.fromEntries(WK_PLAYERS.map((p) => [p.id, p]))

// Maps round qkey → KO_QUOTES field (copied from lib/scoring.ts)
const QKEY_TO_QUOTE_FIELD: Record<string, keyof (typeof KO_QUOTES)[string]> = {
  winnaar_poule: 'poulewinnaar',
  tweede:        'tweede',
  derde:         'derde',
  r16:           'r16',
  r8:            'r8',
  r4:            'r4',
  finale:        'finale',
  winnaar:       'winnaar',
}

// Per-round: which columns and starting row in the Poule sheet
const KO_MAPPING: Record<string, { startRow: number; tokCol: string; landCol: string; quoteCol: string }> = {
  w1:     { startRow: 11, tokCol: 'W',  landCol: 'Z',  quoteCol: 'AA' },
  w2:     { startRow: 25, tokCol: 'W',  landCol: 'Z',  quoteCol: 'AA' },
  w3:     { startRow: 39, tokCol: 'W',  landCol: 'Z',  quoteCol: 'AA' },
  r16:    { startRow: 10, tokCol: 'AE', landCol: 'AG', quoteCol: 'AH' },
  r8:     { startRow: 10, tokCol: 'AK', landCol: 'AM', quoteCol: 'AN' },
  r4:     { startRow: 10, tokCol: 'AQ', landCol: 'AS', quoteCol: 'AT' },
  finale: { startRow: 10, tokCol: 'AW', landCol: 'AY', quoteCol: 'AZ' },
  winner: { startRow: 10, tokCol: 'BC', landCol: 'BE', quoteCol: 'BF' },
}

const MATCH_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m]))

// Match 1-24 → rows 10-33, 25-48 → rows 35-58, 49-72 → rows 60-83
function rowForMatch(matchId: number): number {
  if (matchId <= 24) return matchId + 9
  if (matchId <= 48) return matchId + 10
  return matchId + 11
}

// Normalize "2-1" or "2 - 1" to the format used in MATCH_ODDS keys: "2 - 1"
function normalizeScore(s: string): string {
  return s.replace(/\s*-\s*/, ' - ')
}

// Toto '1'/'X'/'2' → teamnaam of '-'
function totoLabel(toto: string, matchId: number): string {
  const match = MATCH_BY_ID[matchId]
  if (!match) return toto
  if (toto === '1') return match.home
  if (toto === '2') return match.away
  return '-'
}

// Column letter for oranje sheet: participant index 0-14 → columns E-S
function partCol(idx: number): string {
  return String.fromCharCode(69 + idx) // E=69, S=83
}

// OG sheet names
const POULE_SHEET_OG: Record<string, string> = {
  MG: 'Poule_MG', BH: 'Poule_BH', TW: 'Poule_TW', HP: 'Poule_HP', RH: 'Poule_RH',
  DM: 'Poule_DM', BM: 'Poule_BM', RA: 'Poule_RA', TdL: 'Poule_TdL', WP: 'Poule_WP',
  BS: 'Poule_BS', WS: 'Poule_WS', TvL: 'Poule_TvL', TG: 'Poule_TG', LV: 'Poule_LV',
}

const FT_SHEET_OG: Record<string, string> = {
  MG: 'FT_MG', BH: 'FT_BH', TW: 'FT_TW', HP: 'FT_HP', RH: 'FT_RH',
  DM: 'FT_DM', BM: 'FT_BM', RA: 'FT_RA', TdL: 'FT_TdL', WP: 'FT_WP',
  BS: 'FT_BS', WS: 'FT_WS', TvL: 'FT_TvL', TG: 'FT_TG', LV: 'FT_LV',
}

// ASC sheet names — zelfde structuur, gebaseerd op ASC-initialen
const POULE_SHEET_ASC: Record<string, string> = {
  JS: 'Poule_JS', CV: 'Poule_CV', BV: 'Poule_BV', AR: 'Poule_AR', MB: 'Poule_MB',
  JH: 'Poule_JH', JK: 'Poule_JK', NS: 'Poule_NS', PN: 'Poule_PN', TWo: 'Poule_TWo',
  CB: 'Poule_CB', DK: 'Poule_DK', WW: 'Poule_WW', VH: 'Poule_VH',
  WS: 'Poule_WS', RA: 'Poule_RA',
}

const FT_SHEET_ASC: Record<string, string> = {
  JS: 'FT_JS', CV: 'FT_CV', BV: 'FT_BV', AR: 'FT_AR', MB: 'FT_MB',
  JH: 'FT_JH', JK: 'FT_JK', NS: 'FT_NS', PN: 'FT_PN', TWo: 'FT_TWo',
  CB: 'FT_CB', DK: 'FT_DK', WW: 'FT_WW', VH: 'FT_VH',
  WS: 'FT_WS', RA: 'FT_RA',
}

const ORANJE_SECTIONS = [
  { matchId: 10, headerRow: 6,  startRow: 7  },
  { matchId: 33, headerRow: 25, startRow: 26 },
  { matchId: 58, headerRow: 44, startRow: 45 },
]

// Set only the value of a cell, leaving all formatting intact
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cv(sheet: any, addr: string, val: string | number | null | undefined) {
  if (val == null) return
  sheet.cell(addr).value(val)
}

export async function GET(req: Request) {
  try {
  const store = await cookies()
  if (store.get('admin')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Groep bepalen via query param of admin_group cookie
  const url = new URL(req.url)
  const groupId = (url.searchParams.get('group') ?? store.get('admin_group')?.value ?? 'og') as GroupId

  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  const POULE_SHEET = groupId === 'asc' ? POULE_SHEET_ASC : POULE_SHEET_OG
  const FT_SHEET    = groupId === 'asc' ? FT_SHEET_ASC    : FT_SHEET_OG

  // Find the master Excel for the current group
  const cwd = process.cwd()
  const files = await fs.readdir(cwd)

  const xlsxFile = groupId === 'asc'
    ? files.filter((f) => f.includes('ASC') && f.endsWith('.xlsx')).sort().at(-1)
    : files.filter((f) => /_WK 2026_Master\.xlsx$/.test(f) && !f.includes('ASC')).sort().at(-1)

  if (!xlsxFile) {
    const xlsxFiles = files.filter((f) => f.endsWith('.xlsx'))
    return new NextResponse(
      `Master Excel voor groep '${groupId.toUpperCase()}' niet gevonden.\ncwd: ${cwd}\nAlle .xlsx bestanden: ${xlsxFiles.join(', ') || '(geen)'}`,
      { status: 404 }
    )
  }

  const filePath = path.join(cwd, xlsxFile)
  const fileData = await fs.readFile(filePath)
  const workbook = await XlsxPopulate.fromDataAsync(fileData)

  // Load group-specific oranje vragen
  const vragen = await kvGet<OranjeVragenMap>(groupKey('oranje_vragen', groupId)) ?? {}

  // Collect all participant data (predictions, knockout, fantasy, oranje answers)
  type ParticipantData = {
    predictions: Record<number, Prediction>
    knockoutPicks: KnockoutPicks
    fantasySquad: FantasySquad | null
    fantasyTeamName: string | null
    antwoorden: OranjeAntwoordenMap
  }

  const participantData: Record<string, ParticipantData> = {}

  await Promise.all(
    groupParticipants.map(async ({ initials }) => {
      const [predictions, knockoutPicks, fantasyKV, antwoorden] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', initials)),
        kvGet<{ squad: FantasySquad; teamName: string }>(participantKey('fantasy', initials)),
        kvGet<OranjeAntwoordenMap>(groupKey('oranje_antwoorden', groupId, initials)),
      ])
      participantData[initials] = {
        predictions: predictions ?? {},
        knockoutPicks: knockoutPicks ?? {},
        fantasySquad: fantasyKV?.squad ?? null,
        fantasyTeamName: fantasyKV?.teamName ?? null,
        antwoorden: antwoorden ?? {},
      }
    })
  )

  // ── Write per-participant data ──────────────────────────────────────────────
  for (const participant of groupParticipants) {
    const { initials, name } = participant
    const { predictions, knockoutPicks, fantasySquad, fantasyTeamName } = participantData[initials]

    // ── Poule sheet ────────────────────────────────────────────────────────
    const pouleSheet = workbook.sheet(POULE_SHEET[initials])
    if (pouleSheet) {
      cv(pouleSheet, 'K1', name)

      // Match predictions
      for (let matchId = 1; matchId <= 72; matchId++) {
        const pred = predictions[matchId]
        if (!pred) continue
        const row = rowForMatch(matchId)
        const odds = MATCH_ODDS[matchId]

        if (pred.tokens != null) cv(pouleSheet, `B${row}`, pred.tokens)

        if (pred.toto) {
          cv(pouleSheet, `Q${row}`, totoLabel(pred.toto, matchId))
          if (odds) {
            const totoQuote = pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
            cv(pouleSheet, `R${row}`, totoQuote)
          }
        }

        if (pred.uitslag) {
          cv(pouleSheet, `S${row}`, pred.uitslag)
          if (odds) {
            const key = normalizeScore(pred.uitslag)
            const scoreQuote = odds.scores[key]
            if (scoreQuote != null) cv(pouleSheet, `T${row}`, scoreQuote)
          }
        }
      }

      // Knockout picks
      for (const round of KNOCKOUT_ROUNDS) {
        const mapping = KO_MAPPING[round.id]
        if (!mapping) continue
        const quoteField = QKEY_TO_QUOTE_FIELD[round.qkey]

        for (let i = 0; i < round.slots; i++) {
          const slot = knockoutPicks[`${round.id}_${i}`]
          if (!slot) continue
          const row = mapping.startRow + i

          if (slot.tok) cv(pouleSheet, `${mapping.tokCol}${row}`, slot.tok)
          if (slot.country) {
            cv(pouleSheet, `${mapping.landCol}${row}`, slot.country)
            const countryQuotes = KO_QUOTES[slot.country]
            if (countryQuotes && quoteField) {
              cv(pouleSheet, `${mapping.quoteCol}${row}`, countryQuotes[quoteField])
            }
          }
        }
      }
    }

    // ── Fantasy sheet ──────────────────────────────────────────────────────
    const ftSheet = workbook.sheet(FT_SHEET[initials])
    if (ftSheet) {
      cv(ftSheet, 'G2', name)
      if (fantasyTeamName) cv(ftSheet, 'G4', fantasyTeamName)
      if (fantasySquad) {
        REGULAR_SLOTS.forEach((slotKey, i) => {
          const stored = fantasySquad[slotKey]
          if (!stored) return
          const player = PLAYER_BY_ID[stored.id] ?? stored
          cv(ftSheet, `D${13 + i}`, player.middleName)
        })
        TALENT_SLOTS.forEach((slotKey, i) => {
          const stored = fantasySquad[slotKey]
          if (!stored) return
          const player = PLAYER_BY_ID[stored.id] ?? stored
          cv(ftSheet, `D${24 + i}`, player.middleName)
        })
      }
    }
  }

  // ── Oranje Voorspelling sheet ───────────────────────────────────────────────
  const oranjeSheet = workbook.sheet('Oranje_Voorspelling')
  if (oranjeSheet) {
    for (const { matchId, headerRow, startRow } of ORANJE_SECTIONS) {
      const matchVragen = vragen[matchId] ?? {}

      // Participant initials as column headers
      groupParticipants.forEach((p, i) => {
        cv(oranjeSheet, `${partCol(i)}${headerRow}`, p.initials)
      })

      // One row per participant (as question author)
      groupParticipants.forEach((author, rowIdx) => {
        const row = startRow + rowIdx
        const vraag = matchVragen[author.initials.toLowerCase()]

        cv(oranjeSheet, `C${row}`, author.initials)
        if (vraag) cv(oranjeSheet, `D${row}`, vraag.tekst)

        // Each participant's answer to this question
        groupParticipants.forEach((answerer, colIdx) => {
          const answer =
            participantData[answerer.initials].antwoorden[matchId]?.[author.initials.toLowerCase()]
          if (answer != null) cv(oranjeSheet, `${partCol(colIdx)}${row}`, answer)
        })
      })
    }
  }

  // ── Quotes doorgaande landen ────────────────────────────────────────────────
  const quotesSheet = workbook.sheet('Quotes doorgaande landen')
  if (quotesSheet) {
    const KO_COLS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const
    const KO_FIELDS: (keyof CountryKOQuotes)[] = [
      'poulewinnaar', 'tweede', 'derde', 'r16', 'r8', 'r4', 'finale', 'winnaar',
    ]
    for (let i = 0; i < 48; i++) {
      const row = i + 2
      const country = quotesSheet.cell(`A${row}`).value() as string | null
      if (!country) continue
      const quotes = KO_QUOTES[country]
      if (!quotes) continue
      KO_FIELDS.forEach((field, j) => {
        const val = quotes[field]
        if (val != null) cv(quotesSheet, `${KO_COLS[j]}${row}`, val)
      })
    }
  }

  // ── Wedstrijd-tabs (toto + uitslagen quoteringen) ────────────────────────────
  for (let matchId = 1; matchId <= 72; matchId++) {
    const matchSheet = workbook.sheet(String(matchId))
    if (!matchSheet) continue
    const odds = MATCH_ODDS[matchId]
    if (!odds) continue

    cv(matchSheet, 'G5', odds.home)
    cv(matchSheet, 'G6', odds.draw)
    cv(matchSheet, 'G7', odds.away)

    const scores = Object.entries(odds.scores).sort((a, b) => a[1] - b[1])
    scores.forEach(([score, quote], i) => {
      cv(matchSheet, `B${6 + i}`, score)
      cv(matchSheet, `C${6 + i}`, quote)
    })
  }

  // Return the modified workbook as a download
  const buffer = await workbook.outputAsync()
  const exportName = `export_${groupId.toUpperCase()}_${xlsxFile}`

  return new NextResponse(buffer as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exportName}"`,
    },
  })
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('export route fout:', msg)
    return new NextResponse(`Interne fout:\n${msg}`, { status: 500 })
  }
}
