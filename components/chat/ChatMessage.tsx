'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ChatMessage, PollOption } from '@/lib/types/chat'
import { EmojiPickerPanel } from './EmojiPickerPanel'

const DEFAULT_QUICK_EMOJIS = ['⚽', '🔥', '😂', '👏', '❤️']

interface PollProps {
  question: string
  options: PollOption[]
  multiple: boolean
  currentInitials: string
  participants: Record<string, string>
  onVote: (optionIndex: number) => void
}

function PollBubble({ question, options, multiple, currentInitials, participants, onVote }: PollProps) {
  const [showVoters, setShowVoters] = useState(false)
  const totalVotes = options.reduce((sum, o) => sum + o.votes.length, 0)
  const votedIndices = options.reduce<number[]>((acc, o, i) => o.votes.includes(currentInitials) ? [...acc, i] : acc, [])
  const hasVoted = votedIndices.length > 0

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <p className="text-[13px] font-bold text-white leading-snug">{question}</p>
      {multiple && <p className="text-[10px] text-[#FF6B00] -mt-1">Meerdere antwoorden mogelijk</p>}
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => {
          const isVoted = votedIndices.includes(i)
          const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
          return (
            <button
              key={i}
              onClick={() => onVote(i)}
              className="relative w-full text-left rounded-lg overflow-hidden border transition-colors"
              style={{ borderColor: isVoted ? '#FF6B00' : '#2a2a2a' }}
            >
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{
                  width: hasVoted ? `${pct}%` : '0%',
                  background: isVoted ? 'rgba(255,107,0,0.25)' : 'rgba(255,255,255,0.05)',
                }}
              />
              <div className="relative flex items-center justify-between px-3 py-2 gap-2">
                <span className={`text-[13px] leading-snug ${isVoted ? 'text-[#FF6B00] font-bold' : 'text-[#ccc]'}`}>
                  {opt.text}
                </span>
                {hasVoted && (
                  <span className={`text-[11px] flex-shrink-0 ${isVoted ? 'text-[#FF6B00] font-bold' : 'text-[#555]'}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-[#555]">
          {totalVotes === 0 ? 'Nog geen stemmen' : `${totalVotes} stem${totalVotes !== 1 ? 'men' : ''}`}
          {hasVoted && (multiple ? ' · Tik nogmaals om stem in te trekken' : ' · Tik om stem te wijzigen')}
        </p>
        {totalVotes > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowVoters((v) => !v) }}
            className="text-[10px] text-[#FF6B00] hover:text-[#ff8c33] transition-colors flex-shrink-0"
          >
            {showVoters ? 'Verberg stemmen' : 'Wie stemde?'}
          </button>
        )}
      </div>

      {showVoters && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#2a2a2a]">
          {options.map((opt, i) => (
            <div key={i}>
              <p className="text-[10px] text-[#666] mb-1 font-semibold">{opt.text}</p>
              {opt.votes.length === 0 ? (
                <p className="text-[10px] text-[#444] italic">Niemand</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {opt.votes.map((ini) => (
                    <span key={ini} className="text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 rounded-full px-2 py-0.5">
                      {participants[ini] ?? ini}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  msg: ChatMessage
  isOwn: boolean
  currentInitials: string
  participants: Record<string, string>
  onReact: (msgId: string, emoji: string) => void
  onReply: (msg: ChatMessage) => void
  onVotePoll: (msgId: string, optionIndex: number) => void
  topEmojis: string[]
}

function timeStr(ts: number) {
  return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function dateStr(ts: number) {
  return new Date(ts).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function ChatDateDivider({ ts }: { ts: number }) {
  return (
    <div className="flex items-center gap-3 my-3 px-4">
      <div className="flex-1 h-px bg-[#aaa]" />
      <span className="text-[11px] text-[#aaa] uppercase tracking-wide">{dateStr(ts)}</span>
      <div className="flex-1 h-px bg-[#aaa]" />
    </div>
  )
}

export function ChatMessageBubble({ msg, isOwn, currentInitials, participants, onReact, onReply, onVotePoll, topEmojis }: Props) {
  const [showQuickReact, setShowQuickReact] = useState(false)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [quickReactStyle, setQuickReactStyle] = useState<React.CSSProperties>({})
  const [swipeDelta, setSwipeDelta] = useState(0)
  const [mounted, setMounted] = useState(false)

  const bubbleRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  const reactionEntries = Object.entries(msg.reactions ?? {})
  const hasReactions = reactionEntries.length > 0

  const quickEmojis = topEmojis.length >= 5 ? topEmojis.slice(0, 5) : [
    ...topEmojis,
    ...DEFAULT_QUICK_EMOJIS.filter((e) => !topEmojis.includes(e)),
  ].slice(0, 5)

  function openQuickReact() {
    if (!bubbleRef.current) return
    const rect = bubbleRef.current.getBoundingClientRect()
    const barWidth = 232
    let left = isOwn ? rect.right - barWidth : rect.left
    left = Math.max(8, Math.min(left, window.innerWidth - barWidth - 8))
    const top = Math.max(8, rect.top - 56)
    setQuickReactStyle({ position: 'fixed', top, left, zIndex: 9999 })
    setShowQuickReact(true)
  }

  function closeAll() {
    setShowQuickReact(false)
    setShowEmojiPanel(false)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
    longPressFired.current = false
    if (msg.type !== 'poll') {
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true
        openQuickReact()
      }, 500)
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const isRightSwipe = !isOwn && deltaX > 0
    const isLeftSwipe = isOwn && deltaX < 0

    if ((isRightSwipe || isLeftSwipe) && Math.abs(deltaX) > deltaY) {
      isSwiping.current = true
      const capped = Math.min(Math.abs(deltaX), 80)
      setSwipeDelta(isRightSwipe ? capped : -capped)
    }
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isSwiping.current) {
      if (Math.abs(swipeDelta) > 50) onReply(msg)
      isSwiping.current = false
    }
    setSwipeDelta(0)
  }

  const arrowOpacity = Math.min(Math.abs(swipeDelta) / 50, 1)

  return (
    <div className={`flex gap-2 px-3 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-[10px] font-bold text-[#FF6B00]">{msg.senderInitials}</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`mb-1 px-2 py-1 rounded-lg border-l-2 border-[#FF6B00] bg-[#1a1a1a] text-[11px] text-[#888] max-w-full ${isOwn ? 'mr-1' : 'ml-1'}`}>
            <span className="text-[#FF6B00] font-bold">{msg.replyTo.sender}</span>
            <span className="ml-1 truncate block">
              {msg.replyTo.type === 'image' ? '📷 Afbeelding' : msg.replyTo.type === 'gif' ? '🎞️ GIF' : msg.replyTo.text}
            </span>
          </div>
        )}

        {/* Swipeable bubble wrapper */}
        <div
          ref={bubbleRef}
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            transform: `translateX(${swipeDelta}px)`,
            transition: swipeDelta === 0 ? 'transform 0.2s ease' : 'none',
            userSelect: 'none',
          }}
        >
          {/* Swipe reply arrow */}
          {Math.abs(swipeDelta) > 8 && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[#FF6B00] text-base pointer-events-none ${isOwn ? '-right-7' : '-left-7'}`}
              style={{ opacity: arrowOpacity }}
            >
              ↩
            </span>
          )}

          <div
            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
              isOwn && msg.type !== 'poll'
                ? 'bg-[#FF6B00] text-white rounded-tr-sm'
                : 'bg-[#1E1E1E] text-[#F0F0F0] rounded-tl-sm border border-[#2a2a2a]'
            }`}
          >
            <span className={`block text-[11px] font-bold mb-1 ${isOwn && msg.type !== 'poll' ? 'text-orange-200' : 'text-[#FF6B00]'}`}>
              {msg.sender}
            </span>

            {msg.type === 'image' && msg.imageUrl && (
              <img src={msg.imageUrl} alt="Afbeelding" className="rounded-xl max-w-full max-h-64 object-contain mb-1" loading="lazy" />
            )}

            {msg.type === 'gif' && msg.gifUrl && (
              <img src={msg.gifUrl} alt="GIF" className="rounded-xl max-w-full max-h-48 object-contain mb-1" loading="lazy" />
            )}

            {msg.type === 'poll' && msg.pollQuestion && msg.pollOptions && (
              <PollBubble
                question={msg.pollQuestion}
                options={msg.pollOptions}
                multiple={msg.pollMultiple ?? false}
                currentInitials={currentInitials}
                participants={participants}
                onVote={(i) => onVotePoll(msg.id, i)}
              />
            )}

            {msg.text && (
              <span>
                {msg.text.split(/(@\w+)/g).map((part, i) =>
                  /^@\w+$/.test(part)
                    ? <span key={i} className={isOwn ? 'font-bold text-white bg-white/25 rounded px-1' : 'font-semibold text-[#FF8C33]'}>{part}</span>
                    : <span key={i}>{part}</span>,
                )}
              </span>
            )}

            <span className={`block text-[10px] mt-0.5 ${isOwn && msg.type !== 'poll' ? 'text-orange-200' : 'text-[#555]'}`}>
              {timeStr(msg.ts)}
            </span>
          </div>
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactionEntries.map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  users.includes(currentInitials)
                    ? 'bg-[#FF6B00]/20 border-[#FF6B00]/60 text-[#FF6B00]'
                    : 'bg-[#1E1E1E] border-[#333] text-[#888] hover:border-[#555]'
                }`}
              >
                {emoji}
                {users.length > 1 && <span>{users.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick reaction bar — via portal zodat scroll-container het niet afknipt */}
      {mounted && showQuickReact && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={closeAll} />
          <div
            style={quickReactStyle}
            className="flex items-center gap-0.5 bg-[#1a1a1a] border border-[#333] rounded-full px-2 py-1.5 shadow-2xl"
          >
            {quickEmojis.map((e) => (
              <button
                key={e}
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  onReact(msg.id, e)
                  closeAll()
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 active:scale-110 transition-transform leading-none"
              >
                {e}
              </button>
            ))}
            <button
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => {
                ev.stopPropagation()
                setShowQuickReact(false)
                setShowEmojiPanel(true)
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#252525] border border-[#333] text-[#888] text-lg font-bold hover:text-[#aaa] transition-colors"
            >
              +
            </button>
          </div>
        </>,
        document.body,
      )}

      {/* Volledige emoji picker — onderaan het scherm */}
      {mounted && showEmojiPanel && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] bg-black/50" onClick={closeAll} />
          <div className="fixed bottom-0 left-0 right-0 z-[9999]">
            <EmojiPickerPanel
              onSelect={(e) => { onReact(msg.id, e); closeAll() }}
              onClose={closeAll}
            />
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
