'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://eu.i.posthog.com',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    person_profiles: 'always',
  })
}

function PostHogIdentifier({ initials, name }: { initials: string; name: string }) {
  const ph = usePostHog()
  useEffect(() => {
    if (ph && initials) {
      ph.identify(initials, { name, initials })
    }
  }, [ph, initials, name])
  return null
}

export function PostHogProvider({
  children,
  initials,
  name,
}: {
  children: React.ReactNode
  initials: string
  name: string
}) {
  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier initials={initials} name={name} />
      {children}
    </PHProvider>
  )
}
