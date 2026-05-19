'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const touchStartX = useRef<number | null>(null)

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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent, total: number) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0 && slideIndex < total - 1) setSlideIndex((s) => s + 1)
      if (deltaX > 0 && slideIndex > 0) setSlideIndex((s) => s - 1)
    }
    touchStartX.current = null
  }

  function applyExportBackground(el: HTMLElement) {
    el.style.backgroundImage = 'url(/Background/1a@4x.png)'
    el.style.backgroundSize = 'cover'
    el.style.backgroundPosition = 'center top'
    el.style.backgroundRepeat = 'no-repeat'
  }

  function clearExportBackground(el: HTMLElement) {
    el.style.backgroundImage = ''
    el.style.backgroundSize = ''
    el.style.backgroundPosition = ''
    el.style.backgroundRepeat = ''
  }

  function addExportLogo(el: HTMLElement) {
    const img = document.createElement('img')
    img.src = '/Logo/Artboard 1@4x.png'
    img.setAttribute('data-export-logo', '')
    img.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);height:48px;opacity:0.9;z-index:20'
    el.appendChild(img)
  }

  function removeExportLogo(el: HTMLElement) {
    el.querySelector('[data-export-logo]')?.remove()
  }

  async function handleExportSlide(idx: number) {
    const ref = slideRefs[idx]
    if (!ref.current || !data) return
    setExporting(true)
    applyExportBackground(ref.current)
    addExportLogo(ref.current)
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `matchday-${String(matchdayId).padStart(2, '0')}-slide-${idx + 1}-${group}.png`
      a.click()
    } finally {
      removeExportLogo(ref.current)
      clearExportBackground(ref.current)
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
        applyExportBackground(ref.current)
        addExportLogo(ref.current)
        const dataUrl = await toPng(ref.current, { pixelRatio: 2 })
        removeExportLogo(ref.current)
        clearExportBackground(ref.current)
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
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: '#0D0D0D',
        backgroundImage: 'url(/Background/1a@4x.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top bar */}
      <div className="relative flex items-center px-3 py-2 pt-5">
        {/* Matchday navigator — gecentreerd */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl px-2 py-1" style={{ border: '1px solid white' }}>
          <button
            onClick={() => setMatchdayId((m) => Math.max(1, m - 1))}
            disabled={matchdayId <= 1}
            className="font-heading font-bold text-white text-sm px-1 disabled:opacity-30"
          >
            ‹
          </button>
          <span className="font-heading text-xs font-bold tracking-widest uppercase text-white px-2">
            MATCHDAY {String(matchdayId).padStart(2, '0')}
          </span>
          <button
            onClick={() => setMatchdayId((m) => Math.min(MATCHDAY_COUNT, m + 1))}
            disabled={matchdayId >= MATCHDAY_COUNT}
            className="font-heading font-bold text-white text-sm px-1 disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <button
          onClick={onClose}
          className="ml-auto text-[#888] hover:text-white text-sm px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* Slide content */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => handleTouchEnd(e, totalSlides)}
      >
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
                  exporting={exporting}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Panenka logo — vaste overlay, altijd op dezelfde schermhoogte boven de dots */}
      <div className="flex justify-center pointer-events-none" style={{ paddingBottom: 4 }}>
        <img
          src="/Logo/Artboard 1@4x.png"
          alt="Panenka"
          style={{ height: 48, opacity: 0.9 }}
        />
      </div>

      {/* Dot indicators — onderkant */}
      {data && (
        <div className="flex justify-center gap-2 py-3">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: slideIndex === i ? 20 : 8,
                height: 8,
                background: slideIndex === i ? '#FF6B00' : '#333',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
