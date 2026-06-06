'use client'
import { useState, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { saveFantasy } from '@/app/actions/fantasy'

export function TeamNameEditor() {
  const { teamName, setTeamName, fantasySquad, scratchpad } = useGameStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(teamName)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    if (draft.trim()) {
      const name = draft.trim()
      setTeamName(name)
      // Fire-and-forget: ensures the save is in-flight even if the user navigates away
      // within the 500ms debounce window in useFantasyXV
      saveFantasy(fantasySquad, name, scratchpad).catch(() => {})
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] px-4 py-2 mb-4 flex items-center justify-center">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          autoFocus
          className="font-script text-[28px] text-white bg-transparent border-b border-[#FF6B00] outline-none w-full text-center"
        />
      </div>
    )
  }

  return (
    <button
      onClick={startEdit}
      className="w-full rounded-xl bg-[rgba(22,22,22,0.82)] border border-[#2a2a2a] px-4 py-2 mb-4 flex items-center justify-center"
    >
      <span
        className={`font-script text-[28px] transition-colors ${teamName ? 'text-white' : 'text-[#555]'}`}
      >
        {teamName || 'Teamnaam kiezen'}
      </span>
    </button>
  )
}
