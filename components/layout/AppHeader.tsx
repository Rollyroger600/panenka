'use client'
import { useEffect, useState } from 'react'
import { TokenCount } from './TokenCount'

interface Props {
  name: string
  initials: string
}

export function AppHeader({ name, initials }: Props) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    function onScroll() { setCompact(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 flex flex-col items-center overflow-visible transition-all duration-200"
      style={{
        background: 'rgba(13,13,13,0.75)',
        backdropFilter: 'blur(12px)',
        paddingTop: compact ? '0.4rem' : '0.75rem',
        paddingBottom: compact ? '0.4rem' : '0.6rem',
      }}
    >
      <img
        src="/Logo/Artboard 1@4x.png"
        alt="Panenka"
        className="transition-all duration-200"
        style={{ height: compact ? '1.75rem' : '3rem' }}
      />
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className="text-[#555]">|</span>
        <TokenCount initials={initials} />
      </div>

      {/* Gradient fade below header */}
      <div
        className="absolute left-0 right-0 top-full pointer-events-none"
        style={{ height: '2rem', background: 'linear-gradient(to bottom, rgba(13,13,13,0.6), transparent)' }}
      />
    </header>
  )
}
