import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { DeadlineBanner } from '@/components/layout/DeadlineBanner'
import { AppShell } from '@/components/layout/AppShell'
import { GlobalDataLoader } from '@/components/layout/GlobalDataLoader'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { PopupToast } from '@/components/ui/PopupToast'
import { getGroupForParticipant } from '@/lib/groups'
import { OnboardingController } from '@/components/onboarding/OnboardingController'
import { PostHogProvider } from '@/components/PostHogProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const name = store.get('participantName')?.value
  const initials = store.get('participant')?.value
  if (!name || !initials) redirect('/')
  const groupId = getGroupForParticipant(initials)

  return (
    <PostHogProvider initials={initials} name={name}>
    <div className="min-h-screen" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <DeadlineBanner />
      <AppShell name={name} initials={initials}>
        <div className="max-w-[700px] mx-auto px-4 py-6">
          {children}
        </div>
      </AppShell>

      <GlobalDataLoader />
      <SaveIndicator />
      <PopupToast currentUserName={name} groupId={groupId} />
      <OnboardingController />
      <BottomNav />
    </div>
    </PostHogProvider>
  )
}
