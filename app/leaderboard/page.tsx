import { cookies } from 'next/headers'
import { kvGet, groupKey } from '@/lib/kv/kv'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { Podium } from '@/components/leaderboard/Podium'
import { RankList } from '@/components/leaderboard/RankList'
import type { ParticipantScore } from './types'
import { LeaderboardRefresh } from './LeaderboardRefresh'

async function getScores(groupId: GroupId): Promise<ParticipantScore[]> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  try {
    // Probeer groepsspecifieke scores; val terug op globale 'scores' key (backward compat)
    const stored =
      await kvGet<Record<string, ParticipantScore>>(groupKey('scores', groupId)) ??
      (groupId === 'og' ? await kvGet<Record<string, ParticipantScore>>('scores') : null)

    if (stored && Object.keys(stored).length > 0) {
      return groupParticipants.map((p) =>
        stored[p.initials.toLowerCase()] ?? {
          name: p.name, initials: p.initials,
          total: 0, poulefase: 0, knockout: 0, oranje: 0, fantasy: 0,
        },
      ).sort((a, b) => b.total - a.total)
    }
  } catch {}
  // No scores yet — return all group participants with 0
  return groupParticipants.map((p) => ({
    name: p.name, initials: p.initials,
    total: 0, poulefase: 0, knockout: 0, oranje: 0, fantasy: 0,
  }))
}

export default async function LeaderboardPage() {
  const store = await cookies()
  const groupId = (store.get('group')?.value ?? 'og') as GroupId
  const scores = await getScores(groupId)
  const currentInitials = store.get('participant')?.value

  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)
  const hasScores = scores.some((s) => s.total > 0)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#2a2a2a]">
        <img src="/Logo/Artboard 1@4x.png" alt="Panenka" className="h-8" />
        <LeaderboardRefresh />
      </header>

      <div className="max-w-[700px] mx-auto px-4 py-6 pb-12">
        <h1 className="text-2xl font-bold text-white mb-1">Tussenstand</h1>
        <p className="text-[#888] text-sm mb-6">WK 2026 Poule · {groupId.toUpperCase()}</p>

        {!hasScores && (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center mb-6">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-[#888] text-sm">
              Scores worden berekend na de deadline (9 juni 17:00)
            </div>
          </div>
        )}

        {hasScores && <Podium top3={top3} />}

        <RankList
          participants={hasScores ? rest : scores}
          currentInitials={currentInitials}
          startRank={hasScores ? 4 : 1}
        />
      </div>
    </div>
  )
}
