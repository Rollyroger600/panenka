'use client'
import { useDeadline } from '@/hooks/useDeadline'

export function DeadlineBanner() {
  const { isPast, days, hours, minutes } = useDeadline()

  if (isPast) {
    return (
      <div className="w-full bg-[#1a1a1a] text-[#555] text-center text-xs font-bold py-2 tracking-widest uppercase">
        🔒 Deadline verstreken · 9 juni 2026 · 17:00
      </div>
    )
  }

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}u`)
  parts.push(`${minutes}m`)

  return (
    <div className="w-full bg-[#FF6B00] text-white text-center text-xs font-bold py-2 tracking-widest uppercase">
      ⏰ Deadline: 9 juni 2026 · 17:00 &nbsp;·&nbsp; nog {parts.join(' ')}
    </div>
  )
}
