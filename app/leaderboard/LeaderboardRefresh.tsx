'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function LeaderboardRefresh() {
  const router = useRouter()

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(id)
  }, [router])

  return (
    <button
      onClick={() => router.refresh()}
      className="text-xs text-[#555] hover:text-[#FF6B00] transition-colors font-bold uppercase tracking-wide"
    >
      ↻ Vernieuwen
    </button>
  )
}
