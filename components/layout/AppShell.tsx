'use client'
import { AppHeader } from './AppHeader'
import type { GroupId } from '@/lib/groups'

interface Props {
  name: string
  initials: string
  groupId?: GroupId
  isDualGroup?: boolean
  children: React.ReactNode
}

export function AppShell({ name, initials, groupId, isDualGroup, children }: Props) {
  return (
    <>
      <AppHeader name={name} initials={initials} groupId={groupId} isDualGroup={isDualGroup} />
      {children}
    </>
  )
}
