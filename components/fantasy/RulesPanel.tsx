'use client'
import { useMemo } from 'react'
import { useGameStore, ALL_SLOTS } from '@/store/gameStore'
import { validateFantasyXV } from '@/lib/validation'

export function RulesPanel() {
  const fantasySquad = useGameStore((s) => s.fantasySquad)

  const { violations, countryMap, confedMap, clubMap, leagueMap, leagueKeyToName, u22Count } = useMemo(() => {
    const players = ALL_SLOTS.map((k) => fantasySquad[k] ?? null)
    return validateFantasyXV(players)
  }, [fantasySquad])

  const filled = ALL_SLOTS.filter((k) => fantasySquad[k]).length

  const rules = [
    {
      label: 'Max 1 speler per land',
      ok: !violations.some((v) => v.startsWith('Max 1 per land')),
      detail: Object.entries(countryMap)
        .filter(([, names]) => names.length > 1)
        .map(([c, names]) => `${c}: ${names.length}`)
        .join(', ') || null,
    },
    {
      label: 'Max 3 spelers per confederatie',
      ok: !violations.some((v) => v.startsWith('Max 3 per confederatie')),
      detail: Object.entries(confedMap)
        .filter(([, names]) => names.length > 3)
        .map(([c, names]) => `${c}: ${names.length}`)
        .join(', ') || null,
    },
    {
      label: 'Max 1 speler per club',
      ok: !violations.some((v) => v.startsWith('Max 1 per club')),
      detail: Object.entries(clubMap)
        .filter(([, names]) => names.length > 1)
        .map(([c, names]) => `${c}: ${names.length}`)
        .join(', ') || null,
    },
    {
      label: 'Max 3 spelers per competitie',
      ok: !violations.some((v) => v.startsWith('Max 3 per competitie')),
      detail: Object.entries(leagueMap)
        .filter(([, names]) => names.length > 3)
        .map(([key, names]) => `${leagueKeyToName[key] ?? key}: ${names.length}`)
        .join(', ') || null,
    },
    {
      label: 'Min 4 spelers U22',
      ok: u22Count >= 4,
      detail: u22Count < 4 ? `${u22Count} / 4` : null,
    },
  ]

  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden mb-4" style={{ background: 'rgba(22,22,22,0.82)' }}>
      <div className="px-4 py-2.5 bg-[#111] flex items-center justify-between">
        <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Regels</span>
        <span className="text-xs font-bold text-[#FF6B00]">{filled} / 15 spelers</span>
      </div>
      <div className="px-4 py-2 flex flex-col gap-2">
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-start gap-2">
            <span className={`text-sm mt-0.5 shrink-0 ${rule.ok ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              {rule.ok ? '✓' : '✗'}
            </span>
            <div className="flex-1 min-w-0">
              <span className={`text-xs ${rule.ok ? 'text-[#888]' : 'text-[#E74C3C]'}`}>{rule.label}</span>
              {rule.detail && (
                <span className="ml-1.5 text-[10px] text-[#E74C3C]">({rule.detail})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
