'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminLogin } from '@/app/actions/admin'

export function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await adminLogin(pw)
    if (ok) {
      router.refresh()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Admin</h1>
        <p className="text-[#555] text-sm mb-6 text-center">Panenka WK 2026</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Wachtwoord"
            autoFocus
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B00] placeholder-[#444]"
          />
          {error && <p className="text-[#E74C3C] text-sm text-center">Ongeldig wachtwoord</p>}
          <button
            type="submit"
            disabled={loading || !pw}
            className="py-3 rounded-xl bg-[#FF6B00] text-white font-bold tracking-wide hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Inloggen…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
