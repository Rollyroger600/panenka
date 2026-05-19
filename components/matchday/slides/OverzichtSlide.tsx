'use client'
import { forwardRef } from 'react'
import { SlideWrapper } from '@/components/matchday/SlideWrapper'
import { ScoreStackedChart } from '@/components/matchday/charts/ScoreStackedChart'
import type { MatchdayScoreRow } from '@/lib/matchday'

interface Props {
  matchdayId: number
  rows: MatchdayScoreRow[]
  exporting?: boolean
}

const VLINE = '1px solid rgba(255,255,255,0.14)'
const HDR_BOTTOM = '1px solid rgba(255,255,255,0.15)'
const ROW_BOTTOM = '1px solid rgba(255,255,255,0.05)'

// Eerste kolom vaste breedte; overige kolommen verdelen de rest gelijkmatig
const NAAM: React.CSSProperties = { width: 50, flexShrink: 0 }
const COL:  React.CSSProperties = { flex: 1, minWidth: 0 }

function fmt(v: number)    { return v > 0 ? v.toFixed(2) : '' }
function fmtInt(v: number) { return v > 0 ? String(v) : '' }

// ── Gedeelde cel-componenten ───────────────────────────────────────────────

function HdrNaam() {
  return (
    <div style={{ ...NAAM, borderRight: VLINE, fontSize: 9, color: '#fff' }} />
  )
}

function HdrCell({ label, last = false }: { label: string; last?: boolean }) {
  return (
    <div
      style={{ ...COL, borderRight: last ? undefined : VLINE, fontSize: 9, color: '#fff' }}
      className="flex items-center justify-center"
    >
      {label}
    </div>
  )
}

function DataNaam({ name }: { name: string }) {
  return (
    <div
      style={{ ...NAAM, borderRight: VLINE, paddingTop: 0, paddingBottom: 0 }}
      className="font-heading text-[9px] text-white flex items-center overflow-hidden px-0.5"
    >
      <span className="truncate">{name}</span>
    </div>
  )
}

function DataCell({ value, last = false }: { value: string; last?: boolean; bold?: boolean }) {
  return (
    <div
      style={{ ...COL, borderRight: last ? undefined : VLINE, paddingTop: 0, paddingBottom: 0 }}
      className="font-heading text-[9px] text-white flex items-center justify-center"
    >
      {value}
    </div>
  )
}

// ── Slide ─────────────────────────────────────────────────────────────────

export const OverzichtSlide = forwardRef<HTMLDivElement, Props>(
  ({ matchdayId, rows, exporting = false }, ref) => {
    const padded = String(matchdayId).padStart(2, '0')

    return (
      <SlideWrapper ref={ref} title={`OVERZICHT ${padded}`} titleFont="accent" minHeight={720} exporting={exporting}>

        {/* Tabel 1: Poule | KO | FXV | Toto | Uitsl */}
        <div className="mb-4" style={{ paddingTop: 8 }}>
          <div className="flex font-heading uppercase" style={{ borderBottom: HDR_BOTTOM, paddingBottom: 2 }}>
            <HdrNaam />
            <HdrCell label="Poule" />
            <HdrCell label="KO" />
            <HdrCell label="FXV" />
            <HdrCell label="Toto" />
            <HdrCell label="Uitsl" last />
          </div>
          {rows.map((row) => (
            <div key={row.initials} className="flex" style={{ borderBottom: ROW_BOTTOM }}>
              <DataNaam name={row.name} />
              <DataCell value={fmt(row.poulefase)} />
              <DataCell value={fmt(row.kofase)} />
              <DataCell value={fmt(row.fantasy)} />
              <DataCell value={fmtInt(row.totoGoed)} />
              <DataCell value={fmtInt(row.uitslagGoed)} last />
            </div>
          ))}
        </div>

        {/* Tabel 2: R32 | R16 | KF | HF | Fin | Win | Totaal */}
        <div className="mb-4">
          <div className="flex font-heading uppercase" style={{ borderBottom: HDR_BOTTOM, paddingBottom: 2 }}>
            <HdrNaam />
            <HdrCell label="R 32" />
            <HdrCell label="R 16" />
            <HdrCell label="KF" />
            <HdrCell label="HF" />
            <HdrCell label="Fin" />
            <HdrCell label="Win" />
            <HdrCell label="Totaal" last />
          </div>
          {rows.map((row) => (
            <div key={row.initials} className="flex" style={{ borderBottom: ROW_BOTTOM }}>
              <DataNaam name={row.name} />
              <DataCell value={fmt(row.koR32)} />
              <DataCell value={fmt(row.koR16)} />
              <DataCell value={fmt(row.koKF)} />
              <DataCell value={fmt(row.koHF)} />
              <DataCell value={fmt(row.koFinale)} />
              <DataCell value={fmt(row.koWinnaar)} />
              <DataCell value={fmt(row.total)} last bold />
            </div>
          ))}
        </div>

        {/* Gestapeld staafdiagram */}
        <ScoreStackedChart rows={rows} />

      </SlideWrapper>
    )
  }
)

OverzichtSlide.displayName = 'OverzichtSlide'
