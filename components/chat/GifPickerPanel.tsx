'use client'
import { useState, useEffect, useRef } from 'react'

interface GifItem {
  id: string
  title: string
  preview: string
  original: string
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export function GifPickerPanel({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fetchGifs(q: string) {
    setLoading(true)
    fetch(`/api/chat/gif?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => { setGifs(d.gifs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchGifs('')
  }, [])

  function handleQuery(q: string) {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchGifs(q), 400)
  }

  return (
    <div className="flex flex-col h-72 bg-[#161616] border-t border-[#2a2a2a]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <input
          autoFocus
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="Zoek een GIF..."
          className="flex-1 bg-[#252525] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#FF6B00]"
        />
        <button onClick={onClose} className="text-[#555] hover:text-[#888] text-sm px-1">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#555] text-sm">Laden...</div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-2">
            {gifs.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelect(g.original)}
                className="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
              >
                <img src={g.preview} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="text-center py-1">
        <span className="text-[10px] text-[#333]">Powered by GIPHY</span>
      </div>
    </div>
  )
}
