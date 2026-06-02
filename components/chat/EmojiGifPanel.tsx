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

// Nederlandse zoekindex: termen → emojis (ondersteunt gedeeltelijke overeenkomst)
const SEARCH_MAP: { terms: string[]; emojis: string[] }[] = [
  { terms: ['liefde', 'verliefd', 'hart', 'hartje', 'harten', 'valentijn', 'kus'], emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','💔','❣️','💕','💞','💓','💗','💖','💝','💟','😍','🥰','😘','😗','😚'] },
  { terms: ['blij', 'gelukkig', 'lachen', 'grappig', 'humor', 'vrolijk', 'haha', 'lol'], emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','😊','😇','🥳','😉','😋','😛','😜','🤪'] },
  { terms: ['verdriet', 'huilen', 'tranen', 'droef', 'triest', 'janken', 'snot'], emojis: ['😢','😭','🥺','😞','😟','😦','😧','😰','😥','😔','😪'] },
  { terms: ['boos', 'kwaad', 'woede', 'irritant', 'frustratie', 'razend'], emojis: ['😤','😡','😠','🤬','👿','💀'] },
  { terms: ['verrast', 'verbaasd', 'shock', 'wow', 'wauw', 'ongeloof'], emojis: ['😮','😯','😲','🤯','🫣','😱'] },
  { terms: ['cool', 'stoer', 'zonnebril', 'swag'], emojis: ['😎','🤩','🥸','🤓','🧐'] },
  { terms: ['ziek', 'misselijk', 'corona', 'grieperig', 'koorts'], emojis: ['😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴'] },
  { terms: ['slapen', 'moe', 'gapen', 'slaap', 'rust'], emojis: ['😴','🥱','😪','💤'] },
  { terms: ['schouders', 'weet niet', 'geen idee', 'whatever', 'mja'], emojis: ['🤷','🤦','🙄','😶','😑','😐'] },
  { terms: ['voetbal', 'bal', 'sport', 'wedstrijd', 'match', 'goal', 'keeper'], emojis: ['⚽','🏟️','🥅','🎽','🧤','🏃','🤸','⛹️','🏋️','🤾'] },
  { terms: ['trofee', 'award', 'winnen', 'prijs', 'kampioen', 'goud', 'zilver', 'brons', 'medaille'], emojis: ['🏆','🥇','🥈','🥉','🏅','🎖️','👑'] },
  { terms: ['geel', 'kaart'], emojis: ['🟨','🟡'] },
  { terms: ['rood', 'kaart'], emojis: ['🟥','🔴'] },
  { terms: ['feest', 'vieren', 'jubel', 'party', 'verjaardag', 'jarig', 'gefeliciteerd'], emojis: ['🎉','🎊','🥳','🎈','🎁','🎂','🍰'] },
  { terms: ['vuur', 'heet', 'brand', 'vlam', 'fire'], emojis: ['🔥','⚡','❤️‍🔥'] },
  { terms: ['sterk', 'kracht', 'spier'], emojis: ['💪','✊','👊','🤛','🤜'] },
  { terms: ['klap', 'applaus', 'klappen'], emojis: ['👏','🙌','🤝','🫶'] },
  { terms: ['duim', 'omhoog', 'goed', 'top', 'prima', 'akkoord', 'ok'], emojis: ['👍','✅','💯','✔️'] },
  { terms: ['nee', 'fout', 'slecht', 'verkeerd', 'af', 'afwijzen'], emojis: ['👎','❌','🚫'] },
  { terms: ['hand', 'handen', 'gebaar', 'hallo', 'dag', 'bye', 'doei', 'groet'], emojis: ['👋','🤚','🖐️','✋','🤙','🫱','🫲'] },
  { terms: ['vrede', 'oke', 'peace', 'overwinning', 'twee'], emojis: ['✌️','🤞','🖖'] },
  { terms: ['gebed', 'bidden', 'dank', 'please', 'alsjeblieft'], emojis: ['🙏','🤲'] },
  { terms: ['kroon', 'koning', 'koningin', 'baas'], emojis: ['👑','🏆'] },
  { terms: ['hond', 'puppy', 'doggo'], emojis: ['🐶'] },
  { terms: ['kat', 'poes', 'kitten', 'miauw'], emojis: ['🐱'] },
  { terms: ['varken', 'pig'], emojis: ['🐷'] },
  { terms: ['aap', 'monkey'], emojis: ['🐵'] },
  { terms: ['beer', 'panda', 'koala'], emojis: ['🐻','🐼','🐨'] },
  { terms: ['nederland', 'oranje', 'hollands', 'dutch', 'holland'], emojis: ['🇳🇱'] },
  { terms: ['duitsland', 'german', 'duits'], emojis: ['🇩🇪'] },
  { terms: ['frankrijk', 'french', 'frans'], emojis: ['🇫🇷'] },
  { terms: ['brazilië', 'brazilie', 'braziliaan'], emojis: ['🇧🇷'] },
  { terms: ['argentinië', 'argentinie', 'argentijn', 'messi'], emojis: ['🇦🇷'] },
  { terms: ['spanje', 'spaans'], emojis: ['🇪🇸'] },
  { terms: ['portugal', 'portugees', 'ronaldo'], emojis: ['🇵🇹'] },
  { terms: ['belgie', 'belgisch'], emojis: ['🇧🇪'] },
  { terms: ['italië', 'italie', 'italiaans', 'pasta'], emojis: ['🇮🇹'] },
  { terms: ['pizza', 'italiaans'], emojis: ['🍕'] },
  { terms: ['eten', 'lekker', 'food', 'hamburger', 'burger'], emojis: ['🍔','🍟','🌮','🌯','🥪','🌭'] },
  { terms: ['bier', 'drinken', 'alcohol', 'biertje', 'feest'], emojis: ['🍺','🍻','🥂','🍷','🥃'] },
  { terms: ['koffie', 'thee', 'warm'], emojis: ['☕','🧋','🍹'] },
  { terms: ['snoep', 'zoet', 'chocolade', 'lekker'], emojis: ['🍫','🍬','🍭','🍦','🧁','🍪'] },
  { terms: ['ster', 'mooi', 'geweldig', 'schitterend', 'top'], emojis: ['⭐','🌟','💫','✨','🌈'] },
  { terms: ['zon', 'zomer', 'warm', 'zonnig', 'strand'], emojis: ['☀️','🌤️','🌅','🏖️'] },
  { terms: ['sneeuw', 'koud', 'winter', 'ijs'], emojis: ['❄️','🥶','⛷️','🏊'] },
  { terms: ['regen', 'nat', 'buiten'], emojis: ['🌧️','⛅','🌈'] },
  { terms: ['muziek', 'lied', 'song', 'zingen', 'danssen', 'gitaar'], emojis: ['🎵','🎶','🎸','🎹','🎺','🎷','🥁'] },
  { terms: ['vliegtuig', 'vliegen', 'reizen', 'vakantie', 'vlieg'], emojis: ['✈️','🚀','🛸','🚂','🚢'] },
  { terms: ['telefoon', 'bellen', 'mobiel', 'sms'], emojis: ['📱','💻'] },
  { terms: ['foto', 'camera', 'selfie'], emojis: ['📷','📸'] },
  { terms: ['waarschuwing', 'gevaar', 'let op'], emojis: ['⚠️','🆘','🔔','📢'] },
  { terms: ['vlag', 'flag'], emojis: ['🏴󠁧󠁢󠁥󠁮󠁧󠁿','🏴󠁧󠁢󠁷󠁬󠁳󠁿'] },
]

const FREQ_KEY = 'chat-emoji-freq'
const MAX_FAVORITES = 24

interface GifItem { id: string; title: string; preview: string; original: string }

interface Props {
  onSelectEmoji: (emoji: string) => void
  onSelectGif: (url: string) => void
}

export function EmojiGifPanel({ onSelectEmoji, onSelectGif }: Props) {
  const [tab, setTab] = useState<'emoji' | 'gif'>('emoji')
  const [emojiQuery, setEmojiQuery] = useState('')
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [gifLoading, setGifLoading] = useState(false)
  const [gifFetched, setGifFetched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [emojiFreq, setEmojiFreq] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(FREQ_KEY) ?? '{}') } catch { return {} }
  })

  const favoriteEmojis = Object.entries(emojiFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_FAVORITES)
    .map(([emoji]) => emoji)

  const filteredEmojiGroups = (() => {
    const q = emojiQuery.trim().toLowerCase()
    if (!q) {
      const groups = favoriteEmojis.length > 0
        ? [{ label: 'Favorieten', emojis: favoriteEmojis }, ...EMOJI_GROUPS]
        : EMOJI_GROUPS
      return groups
    }
    const hits = new Set<string>()
    for (const { terms, emojis } of SEARCH_MAP) {
      if (terms.some((t) => t.includes(q))) emojis.forEach((e) => hits.add(e))
    }
    EMOJI_GROUPS.filter((g) => g.label.toLowerCase().includes(q))
      .flatMap((g) => g.emojis)
      .forEach((e) => hits.add(e))
    return hits.size > 0 ? [{ label: 'Resultaten', emojis: [...hits] }] : []
  })()

  function handleSelectEmoji(emoji: string) {
    const updated = { ...emojiFreq, [emoji]: (emojiFreq[emoji] ?? 0) + 1 }
    setEmojiFreq(updated)
    try { localStorage.setItem(FREQ_KEY, JSON.stringify(updated)) } catch {}
    onSelectEmoji(emoji)
  }

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
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 py-2 flex-shrink-0">
            <input
              value={emojiQuery}
              onChange={(e) => setEmojiQuery(e.target.value)}
              placeholder="Zoek een emoji..."
              className="w-full bg-[#252525] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-3">
            {filteredEmojiGroups.length === 0 ? (
              <p className="text-center text-[#555] text-sm pt-8">Geen resultaten</p>
            ) : (
              filteredEmojiGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">{group.label}</p>
                  <div className="flex flex-wrap">
                    {group.emojis.map((e) => (
                      <button
                        key={e}
                        onMouseDown={(ev) => { ev.preventDefault(); handleSelectEmoji(e) }}
                        className="text-2xl leading-none p-1 active:scale-95 transition-transform"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
            <div className="h-2" />
          </div>
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
