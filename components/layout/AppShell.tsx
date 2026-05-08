'use client'
import { useState } from 'react'
import { AppHeader } from './AppHeader'
import { FifaInfoDrawer } from './FifaInfoDrawer'

interface Props {
  name: string
  initials: string
  children: React.ReactNode
}

export function AppShell({ name, initials, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <AppHeader name={name} initials={initials} onInfoClick={() => setDrawerOpen(true)} />
      {children}
      <FifaInfoDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
