'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MATCH_ODDS } from '@/lib/data/odds'
import { abbrevCountry } from '@/lib/helpers'
import { FlagImage } from '@/components/ui/FlagImage'
import { TotoButtons } from './TotoButtons'
import { TokenChip } from './TokenChip'
import { TokenPicker } from './TokenPicker'
import { ResultQuote } from './ResultQuote'
import { UitslagChip } from './UitslagChip'
import { ScorePicker } from './ScorePicker'
import type { Match } from '@/lib/data/matches'

interface Props {
  match: Match
}

type Panel = 'tokens' | 'score' | null

export function MatchCard({ match }: Props) {
  const { predictions, setPrediction } = useGameStore()
  const pred = predictions[match.id] ?? { toto: null, uitslag: null, tokens: null }
  const [openPanel, setOpenPanel] = useState<Panel>(null)

  const odds = MATCH_ODDS[match.id]
  const totoOdd = pred.toto
    ? pred.toto === '1' ? odds?.home : pred.toto === 'X' ? odds?.draw : odds?.away
    : null
  const scoreOdd = pred.uitslag && odds ? odds.scores[pred.uitslag] ?? null : null

  function togglePanel(panel: Panel) {
    setOpenPanel((p) => (p === panel ? null : panel))
  }

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
      {/* Match header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111]">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <FlagImage country={match.home} size={18} />
          <span className="text-sm font-bold text-white truncate">{abbrevCountry(match.home)}</span>
        </div>
        <div className="flex flex-col items-center px-2 shrink-0">
          <span className="text-[10px] text-[#555] uppercase tracking-widest">Poule {match.poule}</span>
          <span className="text-xs text-[#888]">{match.date}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold text-white truncate">{abbrevCountry(match.away)}</span>
          <FlagImage country={match.away} size={18} />
        </div>
      </div>

      {/* Prediction row */}
      <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
        {/* Token section */}
        <TokenChip tokens={pred.tokens} onClick={() => togglePanel('tokens')} />
        <span className="text-[#444] text-xs">×</span>
        <TotoButtons
          matchId={match.id}
          selected={pred.toto}
          onChange={(toto) => setPrediction(match.id, { toto })}
        />
        <span className="text-[#444] text-xs">=</span>
        <ResultQuote tokens={pred.tokens} odds={totoOdd ?? null} />

        <span className="text-[#333] mx-1">·</span>

        {/* Uitslag section */}
        <UitslagChip uitslag={pred.uitslag} onClick={() => togglePanel('score')} />
        <span className="text-[#444] text-xs">=</span>
        <ResultQuote tokens={pred.tokens} odds={scoreOdd} />
      </div>

      {/* Token picker */}
      {openPanel === 'tokens' && (
        <div className="px-3 pb-2">
          <TokenPicker
            value={pred.tokens}
            onChange={(n) => setPrediction(match.id, { tokens: n })}
            onClose={() => setOpenPanel(null)}
          />
        </div>
      )}

      {/* Score picker */}
      {openPanel === 'score' && (
        <div className="px-3 pb-3">
          <ScorePicker
            matchId={match.id}
            toto={pred.toto}
            selected={pred.uitslag}
            onSelect={(uitslag) => {
              setPrediction(match.id, { uitslag })
              setOpenPanel(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
