'use client'
import { AppHeader } from './AppHeader'
import type { GroupId } from '@/lib/groups'

interface Props {
  name: string
  initials: string
  groupId?: GroupId
  children: React.ReactNode
}

export function AppShell({ name, initials, groupId, children }: Props) {
  return (
    <>
      <AppHeader name={name} initials={initials} groupId={groupId} />
      {children}
    </>
  )
}
