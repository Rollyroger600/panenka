'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { PARTICIPANTS } from '@/lib/participants'
import { MatchSlide } from '@/components/matchday/slides/MatchSlide'
import { InzetSlide } from '@/components/matchday/slides/InzetSlide'
import { OverzichtSlide } from '@/components/matchday/slides/OverzichtSlide'
import { RanglijstSlide } from '@/components/matchday/slides/RanglijstSlide'
import { MATCHDAY_COUNT } from '@/lib/data/matchdayMap'
import type { FullMatchdayData } from '@/lib/types/matchday'

interface Props {
  open: boolean
  onClose: () => void
  group: 'og' | 'asc'
  initialMatchday?: number
  mockData?: FullMatchdayData
}

export function MatchdayDrawer({ open, onClose, group, initialMatchday, mockData }: Props) {
  const [matchdayId, setMatchdayId] = useState(initialMatchday ?? 1)
  const [slideIndex, setSlideIndex] = useState(0)
  const [data, setData] = useState<FullMatchdayData | null>(mockData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const slide0Ref = useRef<HTMLDivElement>(null)
  const slide1Ref = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)
  const slide3Ref = useRef<HTMLDivElement>(null)
  const slide4Ref = useRef<HTMLDivElement>(null)
  const slideRefs = [slide0Ref, slide1Ref, slide2Ref, slide3Ref, slide4Ref]

  const loadData = useCallback(async (md: number) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/matchday/${md}/full?group=${group}`)
      if (res.status === 404) {
        setError('Matchday nog niet geconfigureerd door de admin.')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: FullMatchdayData = await res.json()
      setData(json)
      setSlideIndex(0)
    } catch {
      setError('Laden mislukt. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }, [group])

  useEffect(() => {
    if (open && !mockData) loadData(matchdayId)
  }, [open, matchdayId, loadData, mockData])

  async function handleExportSlide(idx: number) {
    const ref = slideRefs[idx]
    if (!ref.current || !data) return
    setExporting(true)
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `matchday-${String(matchdayId).padStart(2, '0')}-slide-${idx + 1}-${group}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  async function handleExportAll() {
    if (!data) return
    setExporting(true)
    try {
      const totalSlides = data.matchSlides.length === 1 ? 4 : 5
      for (let i = 0; i < totalSlides; i++) {
        const ref = slideRefs[i]
        if (!ref.current) continue
        const dataUrl = await toPng(ref.current, { pixelRatio: 2 })
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `matchday-${String(matchdayId).padStart(2, '0')}-slide-${i + 1}-${group}.png`
        a.click()
        await new Promise((r) => setTimeout(r, 200))
      }
    } finally {
      setExporting(false)
    }
  }

  if (!open) return null

  const totalSlides = data ? (data.matchSlides.length === 1 ? 4 : 5) : 5

  // Build totoVanDeDag per-match prediction data for InzetSlide
  function buildInzetMatchData() {
    if (!data) return []
    const totoInitials = data.totoVanDeDagInitials
    return data.config.quotes.map((q) => {
      const matchSlide = data.matchSlides.flat().find((ms) => ms.matchId === q.matchId)
      const participant = matchSlide?.participantRows.find((r) => r.initials === totoInitials)
      return {
        match: matchSlide?.match ?? { id: q.matchId, poule: '', round: 1, date: '', home: 'TBD', away: 'TBD', stadium: '' },
        quote: q,
        participantToto: participant?.toto ?? null,
        participantUitslag: participant?.uitslag ?? null,
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#222]">
        <button
          onClick={onClose}
          className="text-[#888] hover:text-white text-sm px-2 py-1 rounded"
        >
          ✕
        </button>
        <span className="font-heading text-white tracking-widest text-sm flex-1 text-center">
          MATCHDAY
        </span>
        {/* Matchday selector */}
        <select
          value={matchdayId}
          onChange={(e) => setMatchdayId(parseInt(e.target.value))}
          className="bg-[#1a1a1a] text-white text-xs border border-[#333] rounded px-2 py-1"
        >
          {Array.from({ length: MATCHDAY_COUNT }, (_, i) => (
            <option key={i + 1} value={i + 1}>MD {String(i + 1).padStart(2, '0')}</option>
          ))}
        </select>
      </div>

      {/* Group toggle */}
      <div className="flex gap-1 px-3 py-1 border-b border-[#1a1a1a]">
        <span className="text-[#555] text-xs">Groep:</span>
        <span className="text-[#FF6B00] text-xs font-bold">{group.toUpperCase()}</span>
      </div>

      {/* Slide navigator tabs */}
      {data && (
        <div className="flex gap-1 px-3 py-1 border-b border-[#1a1a1a] overflow-x-auto">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className="px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors"
              style={{
                background: slideIndex === i ? '#FF6B00' : '#1a1a1a',
                color: slideIndex === i ? '#fff' : '#888',
              }}
            >
              {i === 0 ? 'Match 1-2'
                : i === 1 && totalSlides === 5 ? 'Match 3-4'
                : i === (totalSlides === 5 ? 2 : 1) ? 'Inzet'
                : i === (totalSlides === 5 ? 3 : 2) ? 'Overzicht'
                : 'Ranglijst'}
            </button>
          ))}
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-3">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#888] text-sm">Laden...</div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 px-4">
            <div className="text-[#888] text-sm text-center">{error}</div>
            <button
              onClick={() => loadData(matchdayId)}
              className="text-[#FF6B00] text-sm underline"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {data && !loading && (() => {
          const has2MatchSlides = data.matchSlides.length === 2
          // Slide index mapping: 0=Match1, 1=Match2(optional), 2=Inzet, 3=Overzicht, 4=Ranglijst
          // For MD 26-27 (1 match slide): 0=Match1, 1=Inzet, 2=Overzicht, 3=Ranglijst
          const inzetIdx   = has2MatchSlides ? 2 : 1
          const overzichtIdx = has2MatchSlides ? 3 : 2
          const ranglijstIdx = has2MatchSlides ? 4 : 3

          return (
            <div className="relative" style={{ overflow: 'hidden' }}>
              {/* All slides rendered (hidden when not active) for ref access */}
              {data.matchSlides.map((matchesInSlide, i) => (
                <div key={i} style={{ display: slideIndex === i ? 'block' : 'none' }}>
                  <MatchSlide
                    ref={slideRefs[i]}
                    matchdayId={matchdayId}
                    slideIndex={(i + 1) as 1 | 2}
                    matches={matchesInSlide}
                  />
                </div>
              ))}

              <div style={{ display: slideIndex === inzetIdx ? 'block' : 'none' }}>
                <InzetSlide
                  ref={slideRefs[inzetIdx]}
                  matchdayId={matchdayId}
                  config={data.config}
                  group={group}
                  totoVanDeDagName={data.totoVanDeDagName}
                  totoVanDeDagInitials={data.totoVanDeDagInitials}
                  matchData={buildInzetMatchData()}
                  potHistory={data.potHistory}
                />
              </div>

              <div style={{ display: slideIndex === overzichtIdx ? 'block' : 'none' }}>
                <OverzichtSlide
                  ref={slideRefs[overzichtIdx]}
                  matchdayId={matchdayId}
                  rows={data.scores}
                />
              </div>

              <div style={{ display: slideIndex === ranglijstIdx ? 'block' : 'none' }}>
                <RanglijstSlide
                  ref={slideRefs[ranglijstIdx]}
                  matchdayId={matchdayId}
                  rows={data.scores}
                  scoreHistory={data.scoreHistory}
                  totalMatchdays={MATCHDAY_COUNT}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Export buttons */}
      {data && !loading && (
        <div className="flex gap-2 px-3 py-2 border-t border-[#222]">
          <button
            onClick={() => handleExportSlide(slideIndex)}
            disabled={exporting}
            className="flex-1 py-2 rounded text-sm font-bold transition-colors"
            style={{ background: '#1a1a1a', color: exporting ? '#555' : '#FF6B00', border: '1px solid #333' }}
          >
            Download slide
          </button>
          <button
            onClick={handleExportAll}
            disabled={exporting}
            className="flex-1 py-2 rounded text-sm font-bold transition-colors"
            style={{ background: exporting ? '#1a1a1a' : '#FF6B00', color: '#fff', opacity: exporting ? 0.5 : 1 }}
          >
            {exporting ? 'Exporteren...' : 'Alles exporteren'}
          </button>
        </div>
      )}
    </div>
  )
}
