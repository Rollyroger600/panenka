import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import path from 'path'
import fs from 'fs/promises'
import * as XLSX from 'xlsx'
import { PARTICIPANTS } from '@/lib/participants'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { kvGet, participantKey } from '@/lib/kv/kv'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import type { OranjeAntwoordenMap, OranjeVragenMap } from '@/lib/types/oranjeVragen'

const REGULAR_SLOTS = Array.from({ length: 11 }, (_, i) => `p${i}`)
const TALENT_SLOTS = Array.from({ length: 4 }, (_, i) => `t${i}`)

// Maps round qkey → KO_QUOTES field (copied from lib/scoring.ts)
const QKEY_TO_QUOTE_FIELD: Record<string, keyof (typeof KO_QUOTES)[string]> = {
  winnaar_poule: 'poulewinnaar',
  tweede:        'tweede',
  derde:         'tweede',
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

// Column letter for oranje sheet: participant index 0-14 → columns E-S
function partCol(idx: number): string {
  return String.fromCharCode(69 + idx) // E=69, S=83
}

const POULE_SHEET: Record<string, string> = {
  MG: 'Poule_MG', BH: 'Poule_BH', TW: 'Poule_TW', HP: 'Poule_HP', RH: 'Poule_RH',
  DM: 'Poule_DM', BM: 'Poule_BM', RA: 'Poule_RA', TdL: 'Poule_TdL', WP: 'Poule_WP',
  BS: 'Poule_BS', WS: 'Poule_WS', TvL: 'Poule_TvL', TG: 'Poule_TG', LV: 'Poule_LV',
}

const FT_SHEET: Record<string, string> = {
  MG: 'FT_MG', BH: 'FT_BH', TW: 'FT_TW', HP: 'FT_HP', RH: 'FT_RH',
  DM: 'FT_DM', BM: 'FT_BM', RA: 'FT_RA', TdL: 'FT_TdL', WP: 'FT_WP',
  BS: 'FT_BS', WS: 'FT_WS', TvL: 'FT_TvL', TG: 'FT_TG', LV: 'FT_LV',
}

const ORANJE_SECTIONS = [
  { matchId: 10, headerRow: 6,  startRow: 7  },
  { matchId: 33, headerRow: 25, startRow: 26 },
  { matchId: 58, headerRow: 44, startRow: 45 },
]

// Set a cell value in a SheetJS worksheet
function cv(ws: XLSX.WorkSheet, addr: string, val: string | number | null | undefined) {
  if (val == null) return
  ws[addr] = { v: val, t: typeof val === 'number' ? 'n' : 's' }
}

export async function GET() {
  const store = await cookies()
  if (store.get('admin')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Find the most recent master Excel in project root
  const cwd = process.cwd()
  const files = await fs.readdir(cwd)
  const xlsxFile = files
    .filter((f) => /_WK 2026_Master\.xlsx$/.test(f))
    .sort()
    .at(-1)

  if (!xlsxFile) {
    const xlsxFiles = files.filter((f) => f.endsWith('.xlsx'))
    return new NextResponse(
      `Master Excel niet gevonden.\ncwd: ${cwd}\nAlle .xlsx bestanden: ${xlsxFiles.join(', ') || '(geen)'}`,
      { status: 404 }
    )
  }

  const filePath = path.join(cwd, xlsxFile)
  const fileData = await fs.readFile(filePath)
  const workbook = XLSX.read(fileData, { type: 'buffer', cellStyles: false })

  // Load global oranje vragen once
  const vragen = await kvGet<OranjeVragenMap>('oranje_vragen') ?? {}

  // Collect all participant data (predictions, knockout, fantasy, oranje answers)
  type ParticipantData = {
    predictions: Record<number, Prediction>
    knockoutPicks: KnockoutPicks
    fantasySquad: FantasySquad | null
    antwoorden: OranjeAntwoordenMap
  }

  const participantData: Record<string, ParticipantData> = {}

  await Promise.all(
    PARTICIPANTS.map(async ({ initials }) => {
      const [predictions, knockoutPicks, fantasyKV, antwoorden] = await Promise.all([
        kvGet<Record<number, Prediction>>(participantKey('predictions', initials)),
        kvGet<KnockoutPicks>(participantKey('knockout', initials)),
        kvGet<{ squad: FantasySquad; teamName: string }>(participantKey('fantasy', initials)),
        kvGet<OranjeAntwoordenMap>(participantKey('oranje_antwoorden', initials)),
      ])
      participantData[initials] = {
        predictions: predictions ?? {},
        knockoutPicks: knockoutPicks ?? {},
        fantasySquad: fantasyKV?.squad ?? null,
        antwoorden: antwoorden ?? {},
      }
    })
  )

  // ── Write per-participant data ──────────────────────────────────────────────
  for (const participant of PARTICIPANTS) {
    const { initials, name } = participant
    const { predictions, knockoutPicks, fantasySquad } = participantData[initials]

    // ── Poule sheet ────────────────────────────────────────────────────────
    const pouleSheet = workbook.Sheets[POULE_SHEET[initials]]
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
          cv(pouleSheet, `Q${row}`, pred.toto)
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
    const ftSheet = workbook.Sheets[FT_SHEET[initials]]
    if (ftSheet && fantasySquad) {
      REGULAR_SLOTS.forEach((slotKey, i) => {
        const player = fantasySquad[slotKey]
        if (player) cv(ftSheet, `D${13 + i}`, player.name)
      })
      TALENT_SLOTS.forEach((slotKey, i) => {
        const player = fantasySquad[slotKey]
        if (player) cv(ftSheet, `D${24 + i}`, player.name)
      })
    }
  }

  // ── Oranje Voorspelling sheet ───────────────────────────────────────────────
  const oranjeSheet = workbook.Sheets['Oranje_Voorspelling']
  if (oranjeSheet) {
    for (const { matchId, headerRow, startRow } of ORANJE_SECTIONS) {
      const matchVragen = vragen[matchId] ?? {}

      // Participant initials as column headers
      PARTICIPANTS.forEach((p, i) => {
        cv(oranjeSheet, `${partCol(i)}${headerRow}`, p.initials)
      })

      // One row per participant (as question author)
      PARTICIPANTS.forEach((author, rowIdx) => {
        const row = startRow + rowIdx
        const vraag = matchVragen[author.initials.toLowerCase()]

        cv(oranjeSheet, `C${row}`, author.initials)
        if (vraag) cv(oranjeSheet, `D${row}`, vraag.tekst)

        // Each participant's answer to this question
        PARTICIPANTS.forEach((answerer, colIdx) => {
          const answer =
            participantData[answerer.initials].antwoorden[matchId]?.[author.initials.toLowerCase()]
          if (answer != null) cv(oranjeSheet, `${partCol(colIdx)}${row}`, answer)
        })
      })
    }
  }

  // Return the modified workbook as a download
  const buffer: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const exportName = `export_${xlsxFile}`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exportName}"`,
    },
  })
}
