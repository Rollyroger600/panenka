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
        className="flex items-center justify-center transition-opacity hover:opacity-100"
        aria-label="Matchday openen"
        title="Matchday"
      >
        <span style={{ animation: 'matchday-bounce 0.7s ease-in-out infinite alternate', display: 'inline-flex' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-ball.svg"
            width={24} height={24} alt=""
            style={{ animation: 'matchday-spin 1.4s linear infinite', opacity: 0.85, filter: 'brightness(1.1)' }}
          />
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
