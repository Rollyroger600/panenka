export type GroupId = 'og' | 'asc'

export const DUAL_GROUP_INITIALS: readonly string[] = ['WS', 'RA']

export const GROUP_MEMBERS: Record<GroupId, string[]> = {
  og:  ['MG', 'BH', 'TW', 'HP', 'RH', 'DM', 'BM', 'RA', 'TdL', 'WP', 'BS', 'WS', 'TvL', 'TG', 'LV'],
  asc: ['JS', 'CV', 'BV', 'AR', 'MB', 'JH', 'JK', 'NS', 'PN', 'TWo', 'CB', 'DK', 'WW', 'VH', 'WS', 'RA'],
}

export function getGroupForParticipant(initials: string): GroupId {
  const inOg  = GROUP_MEMBERS.og.includes(initials)
  const inAsc = GROUP_MEMBERS.asc.includes(initials)
  if (inOg && !inAsc) return 'og'
  if (inAsc && !inOg) return 'asc'
  return 'og' // dual-group → default OG
}
