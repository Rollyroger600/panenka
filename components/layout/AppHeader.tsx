'use client'
import { useEffect, useState } from 'react'
import { TokenCount } from './TokenCount'
import { useGameStore } from '@/store/gameStore'
import { MatchdayButton } from '@/components/matchday/MatchdayButton'
import type { GroupId } from '@/lib/groups'

interface Props {
  name: string
  initials: string
  groupId?: GroupId
}

export function AppHeader({ name, initials, groupId }: Props) {
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
      <div className="relative flex items-center justify-center w-full mt-1 px-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-[#555]">|</span>
          <TokenCount initials={initials} />
        </div>
        <div className="absolute right-4 flex items-center gap-2">
          {/* TODO: re-enable na toernooistart (9 juni 2026) */}
          {/* {groupId && <MatchdayButton group={groupId} />} */}
          <button
            onClick={() => setOnboardingOpen(true)}
            className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center font-heading text-xs font-bold transition-colors hover:border-[#555] hover:text-[#aaa]"
            style={{ color: '#555' }}
            aria-label="Uitleg bekijken"
          >
            ?
          </button>
        </div>
      </div>
    </header>
  )
}
