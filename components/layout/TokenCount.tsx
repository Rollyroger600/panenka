'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTokenBudget, useKoMatchBudget } from '@/hooks/useTokenBudget'
import { loadMyOranjeTokens, loadKoMatchTeamsPublic } from '@/app/actions/predictions'
import { APP_PHASE } from '@/lib/config'

export function TokenCount({ initials }: { initials: string }) {
  const pathname = usePathname()
  const poule = useTokenBudget(initials)
  const [oranjeTokens, setOranjeTokens] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const ko = useKoMatchBudget(oranjeTokens, matchCount)

  useEffect(() => {
    if (APP_PHASE >= 3) {
      loadMyOranjeTokens().then(setOranjeTokens)
      loadKoMatchTeamsPublic().then((teams) => setMatchCount(Object.keys(teams).length))
    }
  }, [])

  const isKoPage = APP_PHASE >= 3 && pathname === '/knockout'
  const remaining = isKoPage ? ko.remaining : poule.remaining
  const total = isKoPage ? ko.total : poule.total
  const color = remaining < 0 ? 'text-[#E74C3C]' : 'text-[#FF6B00]'

  return (
    <span className={`font-heading font-bold text-sm ${color}`}>
      {remaining}/{total} tokens
    </span>
  )
}
