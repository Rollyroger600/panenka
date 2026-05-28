'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { ChatMessage } from '@/lib/types/chat'
import type { GroupId } from '@/lib/groups'
import { ChatMessageBubble, ChatDateDivider } from './ChatMessage'
import { ChatInput } from './ChatInput'

const POLL_INTERVAL = 5000

interface Props {
  initials: string
  defaultGroup: GroupId
  isDualGroup: boolean
}

function isSameDay(a: number, b: number) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try { await navigator.serviceWorker.register('/sw.js') } catch { /* ignore */ }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

const LAST_READ_KEY = (ini: string, group: GroupId) => `chat-last-read-${ini}-${group}`
const ACTIVE_GROUP_KEY = (ini: string) => `chat-active-group-${ini}`

export function ChatPage({ initials, defaultGroup, isDualGroup }: Props) {
  const [activeGroup, setActiveGroup] = useState<GroupId>(() => {
    try { return (localStorage.getItem(ACTIVE_GROUP_KEY(initials)) as GroupId) ?? defaultGroup }
    catch { return defaultGroup }
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>('default')
  const [showIosHint, setShowIosHint] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [headerToggleEl, setHeaderToggleEl] = useState<Element | null>(null)
  const [headerBellEl, setHeaderBellEl] = useState<Element | null>(null)
  const lastTsRef = useRef(0)
  const lastReadTsRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const newMsgsDividerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  function scrollToBottom(force = false) {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  function markAsRead(latestTs: number) {
    if (latestTs <= lastReadTsRef.current) return
    lastReadTsRef.current = latestTs
    try { localStorage.setItem(LAST_READ_KEY(initials, activeGroup), String(latestTs)) } catch { /* ignore */ }
    setUnreadCount(0)
  }

  function scrollToBottomAndMarkRead() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setMessages((prev) => {
      if (prev.length) markAsRead(prev[prev.length - 1].ts)
      return prev
    })
  }

  // Vergrendel body-scroll + volg toetsenbordhoogte via visualViewport
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const vv = window.visualViewport
    // Leg initiële hoogte vast als baseline — window.innerHeight kan op iOS mee bewegen met het
    // toetsenbord waardoor het verschil altijd 0 is; vv.height is betrouwbaarder
    const baseHeight = vv ? vv.height : window.innerHeight

    function resetScroll() {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    window.addEventListener('scroll', resetScroll)

    function onViewportChange() {
      if (!vv) return

      // Zet actuele visual-viewport-hoogte als CSS-var — de container gebruikt deze direct
      document.documentElement.style.setProperty('--chat-vvp-h', `${vv.height}px`)

      // Toetsenbordhoogte t.o.v. baseline (niet window.innerHeight — die kan op iOS mee dalen)
      const kbH = Math.max(0, baseHeight - vv.height)

      if (kbH > 100) {
        document.body.classList.add('chat-kb-open')
        document.documentElement.style.setProperty('--chat-nav-h', '0px')
        // Bij open toetsenbord: safe-area zit al in het toetsenbord, niet dubbel meetellen
        document.documentElement.style.setProperty('--chat-safe-inset', '0px')
        // Bewaar hoogte zodat emoji/GIF-panel dezelfde hoogte kan overnemen
        document.documentElement.style.setProperty('--chat-locked-kb-h', `${kbH}px`)
      } else {
        document.body.classList.remove('chat-kb-open')
        document.documentElement.style.setProperty('--chat-nav-h', '3.5rem')
        document.documentElement.style.setProperty('--chat-safe-inset', 'env(safe-area-inset-bottom)')
      }
    }

    if (vv) {
      vv.addEventListener('resize', onViewportChange)
      vv.addEventListener('scroll', onViewportChange)
      onViewportChange()
    }

    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('chat-kb-open')
      window.removeEventListener('scroll', resetScroll)
      if (vv) {
        vv.removeEventListener('resize', onViewportChange)
        vv.removeEventListener('scroll', onViewportChange)
      }
      document.documentElement.style.removeProperty('--chat-vvp-h')
      document.documentElement.style.removeProperty('--chat-nav-h')
      document.documentElement.style.removeProperty('--chat-safe-inset')
      document.documentElement.style.removeProperty('--chat-locked-kb-h')
    }
  }, [])

  // Initial load — herstart ook bij groepswisseling
  useEffect(() => {
    setMessages([])
    lastTsRef.current = 0
    setFirstUnreadId(null)
    setUnreadCount(0)
    setError(null)

    let lastRead = 0
    try { lastRead = Number(localStorage.getItem(LAST_READ_KEY(initials, activeGroup)) ?? '0') } catch { /* ignore */ }
    lastReadTsRef.current = lastRead

    fetch(`/api/chat/messages?group=${activeGroup}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Serverfout')
        return d
      })
      .then((d) => {
        const msgs: ChatMessage[] = d.messages ?? []
        setMessages((prev) => {
          if (prev.length === 0) {
            if (msgs.length) lastTsRef.current = msgs[msgs.length - 1].ts
            return msgs
          }
          const serverIds = new Set(msgs.map((m) => m.id))
          const extraLocal = prev.filter((m) => !serverIds.has(m.id))
          const merged = [...msgs, ...extraLocal].sort((a, b) => a.ts - b.ts)
          if (merged.length) lastTsRef.current = Math.max(lastTsRef.current, merged[merged.length - 1].ts)
          return merged
        })

        // Bepaal eerste ongelezen bericht
        const firstUnread = lastRead > 0 ? msgs.find((m) => m.ts > lastRead) : null
        if (firstUnread) {
          setFirstUnreadId(firstUnread.id)
          const newCount = msgs.filter((m) => m.ts > lastRead).length
          setUnreadCount(newCount)
          // Scroll naar de divider na render
          setTimeout(() => {
            newMsgsDividerRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
          }, 100)
        } else {
          setTimeout(() => scrollToBottom(true), 50)
          // Al bij het einde → direct als gelezen markeren
          if (msgs.length) markAsRead(msgs[msgs.length - 1].ts)
        }
      })
      .catch((e: unknown) => setError(`Kon berichten niet laden${e instanceof Error ? `: ${e.message}` : ''}`))
  }, [initials, activeGroup])

  // Polling — herstart ook bij groepswisseling
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages?since=${lastTsRef.current}&limit=50&group=${activeGroup}`)
        const d = await res.json()
        const newMsgs: ChatMessage[] = d.messages ?? []
        if (newMsgs.length === 0) return
        lastTsRef.current = newMsgs[newMsgs.length - 1].ts
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id))
          const added = newMsgs.filter((m) => !existing.has(m.id))
          return added.length ? [...prev, ...added] : prev
        })
        scrollToBottom()
      } catch { /* ignore */ }
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [activeGroup])

  // Registreer service worker bij mount en lees initiële notificatiestatus
  useEffect(() => {
    registerServiceWorker()
    if ('Notification' in window) setNotifStatus(Notification.permission)
    else setNotifStatus('unsupported')
    setHeaderToggleEl(document.getElementById('header-chat-toggle'))
    setHeaderBellEl(document.getElementById('header-chat-extras'))
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isAtBottomRef.current = atBottom
    setShowScrollBtn(!atBottom)
    if (atBottom) {
      setMessages((prev) => {
        if (prev.length) markAsRead(prev[prev.length - 1].ts)
        return prev
      })
    }
  }, [])

  async function handleSendText(text: string) {
    const body = {
      group: activeGroup,
      text,
      type: 'text',
      ...(replyTo && { replyTo: { id: replyTo.id, sender: replyTo.sender, text: replyTo.type === 'image' ? '[Afbeelding]' : replyTo.type === 'gif' ? '[GIF]' : replyTo.text.slice(0, 100), type: replyTo.type } }),
    }
    setReplyTo(null)
    const res = await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Verzenden mislukt')
    const d = await res.json()
    if (!d.message) throw new Error('Ongeldig antwoord')
    setMessages((prev) => [...prev, d.message])
    lastTsRef.current = d.message.ts
    scrollToBottom(true)
  }

  async function handleSendImage(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: fd })
    const { url } = await uploadRes.json()
    if (!url) return
    const body = {
      group: activeGroup,
      text: '',
      type: 'image',
      imageUrl: url,
      ...(replyTo && { replyTo: { id: replyTo.id, sender: replyTo.sender, text: '[Afbeelding]', type: replyTo.type } }),
    }
    setReplyTo(null)
    const res = await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (d.message) {
      setMessages((prev) => [...prev, d.message])
      lastTsRef.current = d.message.ts
      scrollToBottom(true)
    }
  }

  async function handleSendGif(gifUrl: string) {
    const body = {
      group: activeGroup,
      text: '',
      type: 'gif',
      gifUrl,
      ...(replyTo && { replyTo: { id: replyTo.id, sender: replyTo.sender, text: '[GIF]', type: replyTo.type } }),
    }
    setReplyTo(null)
    const res = await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (d.message) {
      setMessages((prev) => [...prev, d.message])
      lastTsRef.current = d.message.ts
      scrollToBottom(true)
    }
  }

  async function handleSendPoll(question: string, options: string[], multiple: boolean) {
    const body = {
      group: activeGroup,
      type: 'poll',
      text: '',
      pollQuestion: question,
      pollOptions: options.map((text) => ({ text, votes: [] })),
      ...(multiple && { pollMultiple: true }),
    }
    const res = await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (d.message) {
      setMessages((prev) => [...prev, d.message])
      lastTsRef.current = d.message.ts
      scrollToBottom(true)
    }
  }

  async function handleVotePoll(msgId: string, optionIndex: number) {
    const res = await fetch('/api/chat/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group: activeGroup, msgId, optionIndex }) })
    const d = await res.json()
    if (d.pollOptions) {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, pollOptions: d.pollOptions } : m))
    }
  }

  async function handleReact(msgId: string, emoji: string) {
    const res = await fetch('/api/chat/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group: activeGroup, msgId, emoji }) })
    const d = await res.json()
    if (d.reactions) {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: d.reactions } : m))
    }
  }

  async function enableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setNotifStatus('unsupported')
      return
    }
    try {
      // Permission request moet direct na user gesture komen — geen awaits daarvoor
      const permission = await Notification.requestPermission()
      setNotifStatus(permission)
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const keyRes = await fetch('/api/push/vapid-public-key')
      if (!keyRes.ok) return
      const { publicKey } = await keyRes.json()

      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing.toJSON()) })
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
    } catch { /* push niet beschikbaar */ }
  }

  async function handleBellClick() {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInPwa = window.matchMedia('(display-mode: standalone)').matches
    if (isIos && !isInPwa) {
      setShowIosHint((v) => !v)
      return
    }
    setShowIosHint(false)
    await enableNotifications()
  }

  function handleGroupSwitch(group: GroupId) {
    if (group === activeGroup) return
    try { localStorage.setItem(ACTIVE_GROUP_KEY(initials), group) } catch { /* ignore */ }
    setActiveGroup(group)
  }

  const participants = useMemo(() => {
    const seen = new Map<string, string>()
    for (const msg of messages) {
      if (!seen.has(msg.senderInitials)) seen.set(msg.senderInitials, msg.sender)
    }
    return Array.from(seen, ([ini, name]) => ({ initials: ini, name }))
  }, [messages])

  const participantsMap = useMemo(
    () => Object.fromEntries(participants.map((p) => [p.initials, p.name])),
    [participants],
  )

  const topEmojis = useMemo(() => {
    const counts = new Map<string, number>()
    for (const msg of messages) {
      for (const [emoji, users] of Object.entries(msg.reactions ?? {})) {
        if (users.includes(initials)) counts.set(emoji, (counts.get(emoji) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e)
  }, [messages, initials])

  // Render with date dividers + "nieuwe berichten" divider
  const rendered: React.ReactNode[] = []
  let lastDay = 0
  for (const msg of messages) {
    if (!isSameDay(lastDay, msg.ts)) {
      rendered.push(<ChatDateDivider key={`d-${msg.ts}`} ts={msg.ts} />)
      lastDay = msg.ts
    }
    if (msg.id === firstUnreadId) {
      rendered.push(
        <div
          key="new-messages-divider"
          ref={newMsgsDividerRef}
          className="flex items-center gap-3 my-3 px-4"
        >
          <div className="flex-1 h-px bg-[#FF6B00]/40" />
          <span className="text-[10px] text-[#FF6B00] uppercase tracking-wider font-semibold">Nieuwe berichten</span>
          <div className="flex-1 h-px bg-[#FF6B00]/40" />
        </div>,
      )
    }
    rendered.push(
      <ChatMessageBubble
        key={msg.id}
        msg={msg}
        isOwn={msg.senderInitials === initials}
        currentInitials={initials}
        participants={participantsMap}
        onReact={handleReact}
        onReply={setReplyTo}
        onVotePoll={handleVotePoll}
        topEmojis={topEmojis}
      />,
    )
  }

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Messages + scroll-naar-beneden knop */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="h-full overflow-y-auto py-3"
          onScroll={handleScroll}
          onClick={() => { (document.activeElement as HTMLElement)?.blur() }}
        >
          {error && <p className="text-center text-red-400 text-sm py-8">{error}</p>}
          {!error && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#555]">
              <p className="text-sm">Nog geen berichten. Wees de eerste!</p>
            </div>
          )}
          {rendered}
          <div ref={bottomRef} />
        </div>

        {/* Zwevende scroll-naar-beneden knop */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottomAndMarkRead}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center text-white shadow-xl z-10 hover:bg-[#2a2a2a] active:scale-95 transition-all"
            aria-label="Naar nieuwste berichten"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF6B00] text-[10px] font-bold text-white flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Input */}
      <ChatInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendGif={handleSendGif}
        onSendPoll={handleSendPoll}
        participants={participants}
      />
    </div>
    {headerToggleEl && isDualGroup && createPortal(
      <div className="flex rounded-full bg-[#1E1E1E] border border-[#333] p-0.5 gap-0.5">
        {(['og', 'asc'] as GroupId[]).map((g) => (
          <button
            key={g}
            onClick={() => handleGroupSwitch(g)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeGroup === g ? 'bg-[#FF6B00] text-white' : 'text-[#888] hover:text-white'
            }`}
          >
            {g.toUpperCase()}
          </button>
        ))}
      </div>,
      headerToggleEl
    )}
    {headerBellEl && createPortal(
      <div className="relative">
        <button
          onClick={handleBellClick}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            notifStatus === 'granted' ? 'text-[#FF6B00]' : 'text-[#444] hover:text-[#888]'
          }`}
          title={notifStatus === 'granted' ? 'Notificaties aan' : 'Notificaties inschakelen'}
        >
          {notifStatus === 'granted' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zM18 15v1H6v-1l2-2v-2c0-2.76 1.58-4.99 4-5.72V4.5c0-.28.22-.5.5-.5s.5.22.5.5v.78c2.42.73 4 2.96 4 5.72v2l2 2z"/>
            </svg>
          )}
        </button>
        {showIosHint && (
          <div className="absolute right-0 top-10 w-64 bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 text-xs text-[#aaa] z-[100] shadow-2xl">
            <p className="text-white font-semibold mb-2">Notificaties op iPhone/iPad</p>
            <p>Open Panenka in <strong className="text-white">Safari</strong>, tik op <strong className="text-white">Delen</strong> → <strong className="text-white">Zet op beginscherm</strong>. Open dan de app via het beginscherm.</p>
            <button onClick={() => setShowIosHint(false)} className="mt-3 text-[#FF6B00] font-semibold">Begrepen</button>
          </div>
        )}
      </div>,
      headerBellEl
    )}
    </>
  )
}
