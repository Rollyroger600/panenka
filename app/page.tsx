import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PARTICIPANTS } from '@/lib/participants'
import LoginButton from './LoginButton'

const BASE_TOKENS = 335

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const store = await cookies()
  const existingInitials = store.get('participant')?.value
  if (existingInitials && PARTICIPANTS.some(p => p.initials === existingInitials)) {
    redirect('/poulefase')
  }

  const { t: token } = await searchParams
  const participant = token ? PARTICIPANTS.find(p => p.token === token) : null

  return (
    <main className="min-h-screen flex flex-col items-center px-4 max-w-[420px] mx-auto">

      {/* Top: logo + subtitle + divider */}
      <div className="w-full flex flex-col items-center pt-12">
        <img
          src="/Logo/Artboard 1@4x.png"
          alt="Panenka"
          className="w-56 mb-4"
        />
        <p className="text-white uppercase tracking-[0.25em] text-xs mb-5">
          WK 2026 | Mexico | Canada | USA
        </p>
        <div className="w-full h-px bg-[#FF6B00] opacity-60" />
      </div>

      <div className="flex-1 flex flex-col justify-center w-full gap-4 pb-16">
        {participant ? (
          <>
            <div className="w-full rounded-xl bg-[#1a1a1a]/70 border border-[#2a2a2a] px-4 py-5 flex flex-col gap-1 items-center text-center">
              <p className="text-[#888] text-xs uppercase tracking-widest">Welkom</p>
              <p className="text-white font-bold text-2xl">{participant.name}</p>
              <p className="text-[#FF6B00] text-sm font-bold mt-2">
                {BASE_TOKENS + participant.extra} tokens
                <span className="text-[#555] font-normal ml-2">
                  ({BASE_TOKENS} basis + {participant.extra} bonus)
                </span>
              </p>
            </div>
            <LoginButton token={participant.token} />
          </>
        ) : (
          <div className="w-full rounded-xl bg-[#1a1a1a]/70 border border-[#2a2a2a] px-4 py-6 text-center">
            <p className="text-[#555] text-sm leading-relaxed">
              Gebruik je persoonlijke uitnodigingslink om in te loggen.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
