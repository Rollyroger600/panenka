'use client'
import { useState } from 'react'
import { MatchdayDrawer } from '@/components/matchday/MatchdayDrawer'

interface Props {
  group: 'og' | 'asc'
}

export function MatchdayButton({ group }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center transition-colors hover:border-[#FF6B00]"
        aria-label="Matchday openen"
        title="Matchday"
      >
        <span style={{ animation: 'matchday-bounce 0.7s ease-in-out infinite alternate', display: 'inline-flex' }}>
          <svg
            viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="#999" strokeWidth={1.8}
            style={{ animation: 'matchday-spin 1.4s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12,2 15.5,8.5 22,9.3 17,14 18.5,20.5 12,17 5.5,20.5 7,14 2,9.3 8.5,8.5" fill="none" />
          </svg>
        </span>
      </button>

      <MatchdayDrawer
        open={open}
        onClose={() => setOpen(false)}
        group={group}
      />
    </>
  )
}
