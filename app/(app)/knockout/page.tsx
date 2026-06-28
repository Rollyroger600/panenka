import { cookies } from 'next/headers'
import { KnockoutClient } from './KnockoutClient'
import { loadKoResults, loadResults } from '@/app/actions/admin'
import { loadKoMatchTeamsPublic, loadMyOranjeTokens } from '@/app/actions/predictions'

export default async function KnockoutPage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const [koResults, results, koMatchTeams, oranjeTokens] = await Promise.all([
    loadKoResults(),
    loadResults(),
    loadKoMatchTeamsPublic(),
    loadMyOranjeTokens(),
  ])
  return (
    <KnockoutClient
      koResults={koResults}
      results={results}
      koMatchTeams={koMatchTeams}
      oranjeTokens={oranjeTokens}
    />
  )
}
