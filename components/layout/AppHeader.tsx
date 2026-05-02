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
    function onScroll() {
      setCompact(window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#2a2a2a] transition-all duration-200"
      style={{ paddingTop: compact ? '0.5rem' : '0.75rem', paddingBottom: compact ? '0.5rem' : '0.75rem' }}
    >
      <img
        src="/Logo/Artboard 1@4x.png"
        alt="Panenka"
        className="transition-all duration-200"
        style={{ height: compact ? '1.75rem' : '2rem' }}
      />
      <div className="flex items-center gap-2">
        {!compact && <span className="text-sm font-bold text-[#ccc]">{name}</span>}
        {!compact && <span className="text-[#444]">|</span>}
        <TokenCount initials={initials} />
      </div>
    </header>
  )
}
