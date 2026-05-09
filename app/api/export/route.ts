import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import path from 'path'
import fs from 'fs/promises'
import ExcelJS from 'exceljs'
import { PARTICIPANTS } from '@/lib/participants'
import { MATCH_ODDS } from '@/lib/data/odds'
import { KO_QUOTES } from '@/lib/data/knockoutQuotes'
import { KNOCKOUT_ROUNDS } from '@/lib/data/knockoutRounds'
import { kvGet, participantKey } from '@/lib/kv/kv'
import { REGULAR_SLOTS, TALENT_SLOTS } from '@/store/gameStore'
import type { Prediction, KnockoutPicks, FantasySquad } from '@/store/gameStore'
import type { OranjeAntwoordenMap, OranjeVragenMap } from '@/lib/types/oranjeVragen'

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

const NED_MATCH_IDS = [10, 33, 58]

const ORANJE_SECTIONS = [
  { matchId: 10, headerRow: 6,  startRow: 7  },
  { matchId: 33, headerRow: 25, startRow: 26 },
  { matchId: 58, headerRow: 44, startRow: 45 },
]

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
    return new NextResponse('Master Excel niet gevonden in projectmap', { status: 404 })
  }

  const filePath = path.join(cwd, xlsxFile)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

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
    const { predictions, knockoutPicks, fantasySquad, antwoorden } = participantData[initials]

    // ── Poule sheet ────────────────────────────────────────────────────────
    const pouleSheet = workbook.getWorksheet(POULE_SHEET[initials])
    if (pouleSheet) {
      pouleSheet.getCell('K1').value = name

      // Match predictions
      for (let matchId = 1; matchId <= 72; matchId++) {
        const pred = predictions[matchId]
        if (!pred) continue
        const row = rowForMatch(matchId)
        const odds = MATCH_ODDS[matchId]

        if (pred.tokens != null) pouleSheet.getCell(`B${row}`).value = pred.tokens

        if (pred.toto) {
          pouleSheet.getCell(`Q${row}`).value = pred.toto
          if (odds) {
            const totoQuote = pred.toto === '1' ? odds.home : pred.toto === 'X' ? odds.draw : odds.away
            pouleSheet.getCell(`R${row}`).value = totoQuote
          }
        }

        if (pred.uitslag) {
          pouleSheet.getCell(`S${row}`).value = pred.uitslag
          if (odds) {
            const key = normalizeScore(pred.uitslag)
            const scoreQuote = odds.scores[key]
            if (scoreQuote != null) pouleSheet.getCell(`T${row}`).value = scoreQuote
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

          if (slot.tok) pouleSheet.getCell(`${mapping.tokCol}${row}`).value = slot.tok
          if (slot.country) {
            pouleSheet.getCell(`${mapping.landCol}${row}`).value = slot.country
            const countryQuotes = KO_QUOTES[slot.country]
            if (countryQuotes && quoteField) {
              pouleSheet.getCell(`${mapping.quoteCol}${row}`).value = countryQuotes[quoteField]
            }
          }
        }
      }
    }

    // ── Fantasy sheet ──────────────────────────────────────────────────────
    const ftSheet = workbook.getWorksheet(FT_SHEET[initials])
    if (ftSheet && fantasySquad) {
      REGULAR_SLOTS.forEach((slotKey, i) => {
        const player = fantasySquad[slotKey]
        if (player) ftSheet.getCell(`D${13 + i}`).value = player.name
      })
      TALENT_SLOTS.forEach((slotKey, i) => {
        const player = fantasySquad[slotKey]
        if (player) ftSheet.getCell(`D${24 + i}`).value = player.name
      })
    }
  }

  // ── Oranje Voorspelling sheet ───────────────────────────────────────────────
  const oranjeSheet = workbook.getWorksheet('Oranje_Voorspelling')
  if (oranjeSheet) {
    for (const { matchId, headerRow, startRow } of ORANJE_SECTIONS) {
      const matchVragen = vragen[matchId] ?? {}

      // Participant initials as column headers
      PARTICIPANTS.forEach((p, i) => {
        oranjeSheet.getCell(`${partCol(i)}${headerRow}`).value = p.initials
      })

      // One row per participant (as question author)
      PARTICIPANTS.forEach((author, rowIdx) => {
        const row = startRow + rowIdx
        const vraag = matchVragen[author.initials.toLowerCase()]

        oranjeSheet.getCell(`C${row}`).value = author.initials
        if (vraag) oranjeSheet.getCell(`D${row}`).value = vraag.tekst

        // Each participant's answer to this question
        PARTICIPANTS.forEach((answerer, colIdx) => {
          const answer =
            participantData[answerer.initials].antwoorden[matchId]?.[author.initials.toLowerCase()]
          oranjeSheet.getCell(`${partCol(colIdx)}${row}`).value = answer ?? null
        })
      })
    }
  }

  // Return the modified workbook as a download
  const buffer = await workbook.xlsx.writeBuffer()
  const exportName = `export_${xlsxFile}`

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exportName}"`,
    },
  })
}
