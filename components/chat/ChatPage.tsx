'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ChatMessage } from '@/lib/types/chat'
import { ChatMessageBubble, ChatDateDivider } from './ChatMessage'
import { ChatInput } from './ChatInput'

const POLL_INTERVAL = 5000

interface Props {
  initials: string
}

function isSameDay(a: number, b: number) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

// Register service worker + subscribe to push
async function setupPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    const keyRes = await fetch('/api/push/vapid-public-key')
    if (!keyRes.ok) return
    const { publicKey } = await keyRes.json()

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      // Already subscribed — re-save in case server lost it
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing.toJSON()) })
      return
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
  } catch {
    // Push not available in this browser/context — silently ignore
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function ChatPage({ initials }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastTsRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  function scrollToBottom(force = false) {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Vergrendel body-scroll + volg toetsenbordhoogte via visualViewport
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    function onViewportChange() {
      if (!window.visualViewport) return
      const kbH = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop)
      document.documentElement.style.setProperty('--chat-kb-h', `${kbH}px`)
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange)
      window.visualViewport.addEventListener('scroll', onViewportChange)
      onViewportChange()
    }

    return () => {
      document.body.style.overflow = ''
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onViewportChange)
        window.visualViewport.removeEventListener('scroll', onViewportChange)
      }
      document.documentElement.style.removeProperty('--chat-kb-h')
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetch('/api/chat/messages')
      .then((r) => r.json())
      .then((d) => {
        const msgs: ChatMessage[] = d.messages ?? []
        // Merge met eventueel al optimistisch toegevoegde berichten (race-condition fix)
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
        setTimeout(() => scrollToBottom(true), 50)
      })
      .catch(() => setError('Kon berichten niet laden'))

    setupPush()
  }, [])

  // Polling
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages?since=${lastTsRef.current}&limit=50`)
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
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  async function handleSendText(text: string) {
    const body = {
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
    const res = await fetch('/api/chat/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msgId, optionIndex }) })
    const d = await res.json()
    if (d.pollOptions) {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, pollOptions: d.pollOptions } : m))
    }
  }

  async function handleReact(msgId: string, emoji: string) {
    const res = await fetch('/api/chat/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msgId, emoji }) })
    const d = await res.json()
    if (d.reactions) {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: d.reactions } : m))
    }
  }

  const participants = useMemo(() => {
    const seen = new Map<string, string>()
    for (const msg of messages) {
      if (!seen.has(msg.senderInitials)) seen.set(msg.senderInitials, msg.sender)
    }
    return Array.from(seen, ([initials, name]) => ({ initials, name }))
  }, [messages])

  // Render with date dividers
  const rendered: React.ReactNode[] = []
  let lastDay = 0
  for (const msg of messages) {
    if (!isSameDay(lastDay, msg.ts)) {
      rendered.push(<ChatDateDivider key={`d-${msg.ts}`} ts={msg.ts} />)
      lastDay = msg.ts
    }
    rendered.push(
      <ChatMessageBubble
        key={msg.id}
        msg={msg}
        isOwn={msg.senderInitials === initials}
        currentInitials={initials}
        onReact={handleReact}
        onReply={setReplyTo}
        onVotePoll={handleVotePoll}
      />,
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto py-3"
        onScroll={handleScroll}
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
  )
}
