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
      </div>
    </header>
  )
}
