'use client'

import { useState, useRef, useEffect } from 'react'
import { selectParticipant } from './actions/auth'

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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const chosen = PARTICIPANTS.find(p => p.initials === selected)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSubmit() {
    if (!chosen) return
    setLoading(true)
    await selectParticipant(chosen.initials, chosen.name)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 max-w-[420px] mx-auto">

      {/* Top: logo + subtitle + divider */}
      <div className="w-full flex flex-col items-center pt-12">
        <img
          src="/Logo/Artboard 1@4x.png"
          alt="Panenka"
          className="w-56 mb-4"
        />
        <p className="text-white uppercase tracking-[0.25em] text-xs mb-5">
          WK 2026 | Mexico | Canada | USA
        </p>
        <div className="w-full h-px bg-[#FF6B00] opacity-60" />
      </div>

      {/* Buttons — vertically centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center w-full gap-4 pb-16">

      {/* Name dropdown */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide border bg-[#1a1a1a] border-[#2a2a2a] relative flex items-center justify-center transition-all hover:border-[#FF6B00]"
        >
          <span className={chosen ? 'text-white' : 'text-[#555]'}>
            {chosen ? chosen.name : 'Selecteer naam'}
          </span>
          <span className="absolute right-4 text-[#FF6B00]">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
            {PARTICIPANTS.map(p => (
              <button
                key={p.initials}
                onClick={() => { setSelected(p.initials); setOpen(false) }}
                className={[
                  'w-full text-left px-4 py-3 text-sm font-bold tracking-wide transition-all',
                  selected === p.initials
                    ? 'bg-[#FF6B00] text-white'
                    : 'text-[#ccc] hover:bg-[#252525] hover:text-white',
                ].join(' ')}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
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

      </div>
    </main>
  )
}
