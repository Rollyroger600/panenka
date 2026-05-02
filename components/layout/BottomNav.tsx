'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/poulefase', label: 'Poule', icon: '⚽' },
  { href: '/oranje', label: 'Oranje', icon: '🟠' },
  { href: '/knockout', label: 'KO', icon: '🏆' },
  { href: '/fantasy', label: 'Fantasy', icon: '⭐' },
  { href: '/overzicht', label: 'Overzicht', icon: '📋' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-t border-[#2a2a2a]">
      <div className="max-w-[700px] mx-auto flex">
        {TABS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-[#FF6B00]' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
      {/* iOS safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} className="bg-[#0D0D0D]" />
    </nav>
  )
}
