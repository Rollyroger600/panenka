'use client'
import { AppHeader } from './AppHeader'

interface Props {
  name: string
  initials: string
  children: React.ReactNode
}

export function AppShell({ name, initials, children }: Props) {
  return (
    <>
      <AppHeader name={name} initials={initials} />
      {children}
    </>
  )
}
