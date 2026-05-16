'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { POPUPS } from '@/lib/popups'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'

const MIN_INTERVAL_MS = 20 * 60_000
const DISPLAY_MS = 5000
const STORAGE_KEY = 'popup_next_time'

export function PopupToast({ currentUserName, groupId }: { currentUserName: string; groupId: GroupId }) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dismiss = useCallback(() => {
    clearTimeout(autoDismissRef.current)
    setVisible(false)
    setTimeout(() => setMessage(null), 300)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Eerste bezoek: toon na 2–5 minuten
      localStorage.setItem(STORAGE_KEY, String(Date.now() + (2 + Math.random() * 3) * 60_000))
    }

    const nextTime = parseInt(localStorage.getItem(STORAGE_KEY)!, 10)
    const now = Date.now()
    // Als de tijd al verstreken is, wacht nog 30–60 seconden zodat het niet direct popped
    const delay = nextTime > now ? nextTime - now : 30_000 + Math.random() * 30_000

    const scheduleTimer = setTimeout(() => {
      const groupPopups = POPUPS[groupId] ?? {}
      const msgs = [
        ...(groupPopups.global ?? []),
        ...(groupPopups[pathnameRef.current] ?? []),
      ]
      if (msgs.length === 0) return

      const groupInitials = GROUP_MEMBERS[groupId]
      const otherNames = PARTICIPANTS
        .filter((p) => groupInitials.includes(p.initials) && p.name !== currentUserName)
        .map((p) => p.name)
      const randomName = otherNames[Math.floor(Math.random() * otherNames.length)]
      const raw = msgs[Math.floor(Math.random() * msgs.length)]
      const text = raw.replace(/\{naam\}/g, randomName)

      setMessage(text)
      setTimeout(() => setVisible(true), 50)

      // Volgende popup: 20–30 minuten later
      localStorage.setItem(STORAGE_KEY, String(Date.now() + MIN_INTERVAL_MS + Math.random() * 10 * 60_000))

      autoDismissRef.current = setTimeout(dismiss, DISPLAY_MS)
    }, delay)

    return () => clearTimeout(scheduleTimer)
  }, [currentUserName, dismiss])

  if (!message) return null

  return (
    <div
      className={`fixed bottom-24 inset-x-4 z-[80] flex justify-center pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="pointer-events-auto max-w-sm w-full bg-[#1a1a1a] border border-[#FF6B00]/40 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3">
          <span className="text-lg shrink-0">⚽</span>
          <p className="text-sm text-white flex-1 leading-snug">{message}</p>
          <button
            onClick={dismiss}
            className="text-[#555] hover:text-white text-sm shrink-0 mt-0.5 leading-none"
          >
            ✕
          </button>
        </div>
        <div className="h-0.5 bg-[#FF6B00]/20">
          <div
            className="h-full bg-[#FF6B00]"
            style={{ animation: visible ? `popup-shrink ${DISPLAY_MS}ms linear forwards` : 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
