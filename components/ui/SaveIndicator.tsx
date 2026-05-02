'use client'
import { useGameStore } from '@/store/gameStore'

export function SaveIndicator() {
  const saveStatus = useGameStore((s) => s.saveStatus)
  if (saveStatus === 'idle') return null

  const config = {
    saving: { text: 'Opslaan…', bg: 'bg-[#2a2a2a]', color: 'text-[#888]' },
    saved:  { text: '✓ Opgeslagen', bg: 'bg-[#1a3a1a]', color: 'text-[#2ECC71]' },
    error:  { text: '✕ Fout bij opslaan', bg: 'bg-[#3a1a1a]', color: 'text-[#E74C3C]' },
  }[saveStatus]

  return (
    <div className={`fixed bottom-24 right-4 z-50 px-3 py-1.5 rounded-lg text-xs font-bold ${config.bg} ${config.color} border border-white/5 shadow-lg transition-all`}>
      {config.text}
    </div>
  )
}
