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
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        autoFocus
        className="text-2xl font-bold text-white bg-transparent border-b-2 border-[#FF6B00] outline-none w-full mb-4"
        style={{ fontFamily: 'Chalky, cursive' }}
      />
    )
  }

  return (
    <button onClick={startEdit} className="text-left mb-4 group">
      <span
        className="text-2xl text-white group-hover:text-[#FF6B00] transition-colors"
        style={{ fontFamily: 'Chalky, cursive' }}
      >
        {teamName || 'Mijn Team'}
      </span>
      <span className="ml-2 text-[#444] text-xs group-hover:text-[#666]">✏️</span>
    </button>
  )
}
