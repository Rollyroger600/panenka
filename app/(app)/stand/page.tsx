import { cookies } from 'next/headers'
import { kvGet, groupKey } from '@/lib/kv/kv'
import { PARTICIPANTS } from '@/lib/participants'
import { GROUP_MEMBERS, getGroupForParticipant } from '@/lib/groups'
import type { GroupId } from '@/lib/groups'
import { Podium } from '@/components/leaderboard/Podium'
import { RankList } from '@/components/leaderboard/RankList'
import type { ParticipantScore } from '@/app/leaderboard/types'
import { LeaderboardRefresh } from '@/app/leaderboard/LeaderboardRefresh'

const SCORE_DEFAULTS: ParticipantScore = {
  name: '', initials: '', total: 0, poulefase: 0, knockout: 0,
  koWedstrijden: 0, oranje: 0, oranjeTokens: 0, fantasy: 0,
}

async function getScores(groupId: GroupId): Promise<ParticipantScore[]> {
  const groupParticipants = PARTICIPANTS.filter(p => GROUP_MEMBERS[groupId].includes(p.initials))
  try {
    const stored =
      await kvGet<Record<string, Partial<ParticipantScore>>>(groupKey('scores', groupId)) ??
      (groupId === 'og' ? await kvGet<Record<string, Partial<ParticipantScore>>>('scores') : null)

    if (stored && Object.keys(stored).length > 0) {
      return groupParticipants.map((p) => {
        const s = stored[p.initials.toLowerCase()]
        return { ...SCORE_DEFAULTS, name: p.name, initials: p.initials, ...(s ?? {}) }
      }).sort((a, b) => b.total - a.total)
    }
  } catch {}
  return groupParticipants.map((p) => ({ ...SCORE_DEFAULTS, name: p.name, initials: p.initials }))
}

export default async function StandPage() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const groupId = getGroupForParticipant(initials)
  const scores = await getScores(groupId)
  const currentInitials = initials

  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)
  const hasScores = scores.some((s) => s.total > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white font-heading">Tussenstand</h1>
        <LeaderboardRefresh />
      </div>
      <p className="text-[#888] text-sm mb-6">WK 2026 · {groupId.toUpperCase()}</p>

      {!hasScores && (
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center mb-6">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-[#888] text-sm">
            Scores worden berekend na de eerste wedstrijden
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
  )
}
