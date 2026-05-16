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
        className="w-7 h-7 rounded-full border border-[#333] flex items-center justify-center transition-colors hover:border-[#FF6B00]"
        aria-label="Matchday openen"
        title="Matchday"
      >
        {/* Football icon */}
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="#555" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="12,2 15.5,8.5 22,9.3 17,14 18.5,20.5 12,17 5.5,20.5 7,14 2,9.3 8.5,8.5" fill="none" />
        </svg>
      </button>

      <MatchdayDrawer
        open={open}
        onClose={() => setOpen(false)}
        group={group}
      />
    </>
  )
}
