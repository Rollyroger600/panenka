'use client'
import { useState, useEffect, useRef } from 'react'

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Voetbal & Sport',
    emojis: ['⚽','🏆','🥅','🟨','🟥','🔴','🟡','🏟️','🥇','🏅','🎽','🧤','🎯','🤸','🏋️','⛹️','🏃','🤾','🏈','🎾','🏀','🏐','🏄','🤽','🚵','🏇','🥈','🥉','⛷️','🏊'],
  },
  {
    label: 'Smileys & Emoties',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','👿','💀','☠️','💩','🤡'],
  },
  {
    label: 'Mensen & Gebaren',
    emojis: ['👋','🤚','🖐️','✋','🤙','👌','🤌','🤏','✌️','🤞','🖖','🤟','🤘','👈','👉','👆','☝️','👇','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤝','🙏','💪','🫶','🤲','👐'],
  },
  {
    label: 'Dieren & Natuur',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🦓','🦒','🐘','🦏','🦛','🐊','🦈','🐳','🐬','🦭','🐢','🐍','🦋','🌸','🌺','🌻','🌹','🌿','🌳','🌴','☀️','🌤️','⛅','🌧️','❄️','🌈','⚡'],
  },
  {
    label: 'Eten & Drinken',
    emojis: ['🍕','🍔','🌮','🌯','🍟','🌭','🥪','🍩','🎂','🍰','🍫','🍬','🍭','🍦','🧁','🍪','🥤','🧃','🍺','🍻','🥂','🍷','🥃','☕','🧋','🍹','🥛','🥞','🧇','🍳','🍜','🍣','🥗','🥙','🫔','🥘','🍱'],
  },
  {
    label: 'Reizen & Plekken',
    emojis: ['✈️','🚀','🛸','🚂','🚢','🚗','🏎️','🚲','🛵','🏠','🏖️','🏔️','🌍','🌎','🌏','🌅','🌆','🏙️','🌉','🏰','🗼','🗽','🎠','🎡','🎢','⛩️','🕌','⛪','🏕️','🌐'],
  },
  {
    label: 'Objecten & Activiteiten',
    emojis: ['📱','💻','🖥️','🎮','🕹️','📷','📸','🎵','🎶','🎸','🎺','🎷','🥁','🎹','📚','📖','✏️','🖊️','📝','🔬','🔭','🔑','🗝️','🔒','🔓','🎁','🎊','🎉','🎈','🎯','🎳','🃏','🎲','🧩','♟️','🏹','🪄'],
  },
  {
    label: 'Symbolen & Hart',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','💔','❣️','💕','💞','💓','💗','💖','💝','💟','🔥','⭐','🌟','💫','✨','💥','⚡','🌈','✅','❌','⚠️','💯','♾️','🔔','📢','📣','🆘','🎶','🤍'],
  },
  {
    label: 'Vlaggen',
    emojis: ['🇳🇱','🇩🇪','🇫🇷','🇧🇷','🇦🇷','🇪🇸','🇵🇹','🇧🇪','🇮🇹','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇺🇸','🇲🇦','🇯🇵','🇸🇳','🇲🇽','🇺🇾','🇨🇦','🇨🇴','🇪🇨','🏴󠁧󠁢󠁷󠁬󠁳󠁿','🇨🇷','🇵🇦','🇬🇭','🇨🇲','🇯🇲'],
  },
]

interface GifItem { id: string; title: string; preview: string; original: string }

interface Props {
  onSelectEmoji: (emoji: string) => void
  onSelectGif: (url: string) => void
}

export function EmojiGifPanel({ onSelectEmoji, onSelectGif }: Props) {
  const [tab, setTab] = useState<'emoji' | 'gif'>('emoji')
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [gifLoading, setGifLoading] = useState(false)
  const [gifFetched, setGifFetched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (tab === 'gif' && !gifFetched) fetchGifs('')
  }, [tab, gifFetched])

  function fetchGifs(q: string) {
    setGifLoading(true)
    fetch(`/api/chat/gif?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => { setGifs(d.gifs ?? []); setGifLoading(false); setGifFetched(true) })
      .catch(() => setGifLoading(false))
  }

  function handleQuery(q: string) {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchGifs(q), 400)
  }

  return (
    <div
      className="flex flex-col bg-[#161616] border-t border-[#2a2a2a] overflow-hidden"
      style={{ height: 'var(--chat-locked-kb-h, 280px)' }}
    >
      {/* Tabs */}
      <div className="flex flex-shrink-0 border-b border-[#2a2a2a]">
        <button
          onClick={() => setTab('emoji')}
          className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-colors ${
            tab === 'emoji' ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]' : 'text-[#555] hover:text-[#888]'
          }`}
        >
          EMOJI
        </button>
        <button
          onClick={() => setTab('gif')}
          className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-colors ${
            tab === 'gif' ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]' : 'text-[#555] hover:text-[#888]'
          }`}
        >
          GIF
        </button>
      </div>

      {/* Emoji tab */}
      {tab === 'emoji' && (
        <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-3">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">{group.label}</p>
              <div className="flex flex-wrap">
                {group.emojis.map((e) => (
                  <button
                    key={e}
                    onMouseDown={(ev) => { ev.preventDefault(); onSelectEmoji(e) }}
                    className="text-2xl leading-none p-1 active:scale-95 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="h-2" />
        </div>
      )}

      {/* GIF tab */}
      {tab === 'gif' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 py-2 flex-shrink-0">
            <input
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder="Zoek een GIF..."
              className="w-full bg-[#252525] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {gifLoading ? (
              <div className="flex items-center justify-center h-full text-[#555] text-sm">Laden…</div>
            ) : (
              <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                {gifs.map((g) => (
                  <button
                    key={g.id}
                    onMouseDown={(ev) => { ev.preventDefault(); onSelectGif(g.original) }}
                    className="aspect-square overflow-hidden rounded-lg active:opacity-70 transition-opacity"
                  >
                    <img src={g.preview} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-center py-1 text-[10px] text-[#333] flex-shrink-0">Powered by GIPHY</p>
        </div>
      )}
    </div>
  )
}
