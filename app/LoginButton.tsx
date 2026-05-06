'use client'

import { useState } from 'react'
import { selectParticipant } from './actions/auth'

export default function LoginButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await selectParticipant(token)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        'w-full py-4 rounded-xl font-bold text-base tracking-widest uppercase transition-all',
        !loading
          ? 'bg-[#FF6B00] text-white hover:bg-[#e05e00] active:scale-95'
          : 'bg-[#1a1a1a] text-[#444] border border-[#2a2a2a] cursor-not-allowed',
      ].join(' ')}
    >
      {loading ? 'Laden…' : 'Invullen →'}
    </button>
  )
}
