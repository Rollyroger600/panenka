'use client'
import { useEffect, useState } from 'react'
import { TokenCount } from './TokenCount'
import { useGameStore } from '@/store/gameStore'

interface Props {
  name: string
  initials: string
}

export function AppHeader({ name, initials }: Props) {
  const [compact, setCompact] = useState(false)
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen)

  useEffect(() => {
    function onScroll() { setCompact(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 flex flex-col items-center overflow-visible transition-all duration-200"
      style={{
        paddingTop: compact ? '0.4rem' : '0.75rem',
        paddingBottom: compact ? '0.4rem' : '0.6rem',
      }}
    >
      {/* Blurred background — extends below header and fades via mask */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: 0,
          bottom: '-3rem',
          background: 'rgba(13,13,13,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
        }}
      />

      <img
        src="/Logo/Artboard 1@4x.png"
        alt="Panenka"
        className="transition-all duration-200 relative"
        style={{ height: compact ? '1.75rem' : '3rem' }}
      />
      <div className="flex items-center gap-2 mt-1 relative">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className="text-[#555]">|</span>
        <TokenCount initials={initials} />
        <button
          onClick={() => setOnboardingOpen(true)}
          className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center font-heading text-xs font-bold transition-colors hover:border-[#555] hover:text-[#aaa] ml-1"
          style={{ color: '#555' }}
          aria-label="Uitleg bekijken"
        >
          ?
        </button>
      </div>
    </header>
  )
}
