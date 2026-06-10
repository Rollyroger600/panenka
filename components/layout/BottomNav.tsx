'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconPoule, IconKO, IconOranje, IconFantasy, IconOverzicht, IconChat, IconBeker } from '@/components/icons/NavIcons'
import { APP_PHASE } from '@/lib/config'

const TABS_PHASE1 = [
  { href: '/poulefase', label: 'Wedstrijden', Icon: IconPoule },
  { href: '/knockout',  label: 'KO',          Icon: IconKO },
  { href: '/fantasy',   label: 'Fantasy',     Icon: IconFantasy },
  { href: '/oranje',    label: 'Oranje',      Icon: IconOranje },
  { href: '/overzicht', label: 'Overzicht',   Icon: IconOverzicht },
  { href: '/chat',      label: 'Chat',        Icon: IconChat },
]

const TABS_PHASE2 = [
  { href: '/poulefase', label: 'Wedstrijden', Icon: IconPoule },
  { href: '/knockout',  label: 'Landen',      Icon: IconKO },
  { href: '/fantasy',   label: 'Fantasy',     Icon: IconFantasy },
  { href: '/oranje',    label: 'Oranje',      Icon: IconOranje },
  { href: '/stand',     label: 'Stand',       Icon: IconBeker },
  { href: '/chat',      label: 'Chat',        Icon: IconChat },
]

const TABS = APP_PHASE >= 2 ? TABS_PHASE2 : TABS_PHASE1

export function BottomNav() {
  const pathname = usePathname()
  const [kbOpen, setKbOpen] = useState(false)

  useEffect(() => {
    const check = () => setKbOpen(document.body.classList.contains('chat-kb-open'))
    const obs = new MutationObserver(check)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-[#2a2a2a]/60 transition-transform duration-150 ${
        kbOpen ? 'translate-y-full' : ''
      }`}
      style={{ background: 'rgba(13,13,13,0.75)' }}
    >
      <div className="max-w-[700px] mx-auto flex items-stretch">
        {TABS.map(({ href, Icon }) => {
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
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} className="bg-[#0D0D0D]" />
    </nav>
  )
}
