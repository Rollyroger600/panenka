'use client'

import { useState } from 'react'
import { selectParticipant } from './actions/auth'
import Link from 'next/link'

const PARTICIPANTS = [
  { name: 'Michiel',  initials: 'MG'  },
  { name: 'Bob',      initials: 'BH'  },
  { name: 'Thom',     initials: 'TW'  },
  { name: 'Henk Jan', initials: 'HP'  },
  { name: 'Rogier',   initials: 'RH'  },
  { name: 'Daan',     initials: 'DM'  },
  { name: 'Barthold', initials: 'BM'  },
  { name: 'Robert',   initials: 'RA'  },
  { name: 'Tom',      initials: 'TdL' },
  { name: 'Willem',   initials: 'WP'  },
  { name: 'Bert',     initials: 'BS'  },
  { name: 'Wouter',   initials: 'WS'  },
  { name: 'Tim',      initials: 'TvL' },
  { name: 'Timo',     initials: 'TG'  },
  { name: 'Laurens',  initials: 'LV'  },
]

export default function LandingPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const chosen = PARTICIPANTS.find(p => p.initials === selected)

  async function handleSubmit() {
    if (!chosen) return
    setLoading(true)
    await selectParticipant(chosen.initials, chosen.name)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pt-12 pb-24 max-w-[420px] mx-auto">

      {/* Badge */}
      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-1.5 mb-8 text-xs font-bold tracking-widest text-[#FF6B00] uppercase">
        🏆 WK 2026 · VS / Canada / Mexico
      </div>

      {/* Logo */}
      <img
        src="/Logo/Artboard 1@4x.png"
        alt="Panenka"
        className="w-56 mb-4"
      />

      {/* Subtitle */}
      <p className="text-[#555] uppercase tracking-[0.25em] text-xs mb-5">
        Poule — WK 2026
      </p>

      {/* Divider */}
      <div className="w-full h-px bg-[#FF6B00] mb-6 opacity-60" />

      {/* Prompt */}
      <p className="text-[#888] text-sm mb-4 tracking-wide">Wie ben jij?</p>

      {/* Name grid */}
      <div className="grid grid-cols-3 gap-2 w-full mb-8">
        {PARTICIPANTS.map(p => (
          <button
            key={p.initials}
            onClick={() => setSelected(p.initials === selected ? null : p.initials)}
            className={[
              'py-2.5 px-1 rounded-lg text-sm font-bold tracking-wide transition-all border',
              selected === p.initials
                ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc] hover:border-[#FF6B00] hover:text-white',
            ].join(' ')}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className={[
          'w-full py-4 rounded-xl font-bold text-base tracking-widest uppercase transition-all',
          selected && !loading
            ? 'bg-[#FF6B00] text-white hover:bg-[#e05e00] active:scale-95'
            : 'bg-[#1a1a1a] text-[#444] border border-[#2a2a2a] cursor-not-allowed',
        ].join(' ')}
      >
        {loading ? 'Laden…' : 'Invullen →'}
      </button>

      {/* Leaderboard link */}
      <Link
        href="/leaderboard"
        className="mt-5 text-[#666] text-sm hover:text-[#FF6B00] transition-colors"
      >
        📊 Bekijk tussenstand
      </Link>
    </main>
  )
}
