'use client'
import { useState, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

export function TeamNameEditor() {
  const { teamName, setTeamName } = useGameStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(teamName)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    if (draft.trim()) setTeamName(draft.trim())
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
