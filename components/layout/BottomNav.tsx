'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/poulefase', label: 'Poule',    icon: '◎' },
  { href: '/knockout',  label: 'KO',       icon: '◈' },
  { href: '/oranje',    label: 'Oranje',   icon: '◆' },
  { href: '/fantasy',   label: 'Fantasy',  icon: '★' },
  { href: '/overzicht', label: 'Overzicht', icon: '≡' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-[#2a2a2a]/60" style={{ background: 'rgba(13,13,13,0.75)' }}>
      <div className="max-w-[700px] mx-auto flex">
        {TABS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-[#FF6B00]' : 'text-[#444] hover:text-[#888]'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} className="bg-[#0D0D0D]" />
    </nav>
  )
}
