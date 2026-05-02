import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const name = store.get('participantName')?.value
  if (!name) redirect('/')

  return (
    <div className="min-h-screen">
      {/* Deadline banner */}
      <div className="w-full bg-[#FF6B00] text-white text-center text-xs font-bold py-2 tracking-widest uppercase">
        ⏰ Deadline: 9 juni 2026 · 17:00
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#2a2a2a]">
        <img src="/Logo/Artboard 1@4x.png" alt="Panenka" className="h-8" />
        <span className="text-sm font-bold text-[#ccc]">
          {name} <span className="text-[#444]">|</span> <span className="text-[#FF6B00]">🪙 tokens</span>
        </span>
      </header>

      {/* Content */}
      <div className="max-w-[700px] mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
