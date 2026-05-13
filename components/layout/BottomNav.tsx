'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FifaInfoDrawer } from './FifaInfoDrawer'
import { IconPoule, IconKO, IconOranje, IconFantasy, IconOverzicht, IconBeker } from '@/components/icons/NavIcons'

const TABS = [
  { href: '/poulefase', label: 'Wedstrijden', Icon: IconPoule },
  { href: '/knockout',  label: 'KO',        Icon: IconKO },
  { href: '/oranje',    label: 'Oranje',    Icon: IconOranje },
  { href: '/fantasy',   label: 'Fantasy',   Icon: IconFantasy },
  { href: '/overzicht', label: 'Overzicht', Icon: IconOverzicht },
]

export function BottomNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-[#2a2a2a]/60" style={{ background: 'rgba(13,13,13,0.75)' }}>
        <div className="max-w-[700px] mx-auto flex items-stretch">
          {TABS.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-4 gap-0.5 transition-colors ${
                  isActive ? 'text-[#FF6B00]' : 'text-[#444] hover:text-[#888]'
                }`}
              >
                <Icon className="w-6 h-6" />
              </Link>
            )
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center px-3 text-[#FF6B00] hover:text-[#ff8c33] transition-colors"
            aria-label="Info over dit WK"
          >
            <IconBeker className="w-8 h-8" />
          </button>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} className="bg-[#0D0D0D]" />
      </nav>
      <FifaInfoDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
