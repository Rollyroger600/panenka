import { KnockoutClient } from './KnockoutClient'
import { loadKoResults } from '@/app/actions/admin'

export default async function KnockoutPage() {
  const koResults = await loadKoResults()
  return <KnockoutClient koResults={koResults} />
}
