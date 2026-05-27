'use client'
import { useState, useRef } from 'react'
import { EmojiGifPanel } from './EmojiGifPanel'
import { PollCreatorPanel } from './PollCreatorPanel'
import { IconSmile } from '@/components/icons/NavIcons'
import type { ChatMessage } from '@/lib/types/chat'

type Panel = 'none' | 'emoji-gif' | 'poll' | 'plus'

interface Participant {
  name: string
  initials: string
}

interface Props {
  replyTo: ChatMessage | null
  onCancelReply: () => void
  onSendText: (text: string) => Promise<void>
  onSendImage: (file: File) => Promise<void>
  onSendGif: (url: string) => Promise<void>
  onSendPoll: (question: string, options: string[], multiple: boolean) => Promise<void>
  disabled?: boolean
  participants?: Participant[]
}

function IconKeyboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM4 15V7h16v8H4zm2-5h2v2H6zm0-3h2v2H6zm3 0h2v2H9zm0 3h2v2H9zm3-3h2v2h-2zm0 3h2v2h-2zm3 0h2v2h-2zm0-3h2v2h-2zm-8 6h8v2H7zm11 0h-2v-2h2z"/>
    </svg>
  )
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"/>
    </svg>
  )
}

function IconPoll({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
  )
}

export function ChatInput({ replyTo, onCancelReply, onSendText, onSendImage, onSendGif, onSendPoll, disabled, participants = [] }: Props) {
  const [text, setText] = useState('')
  const [panel, setPanel] = useState<Panel>('none')
  const [uploading, setUploading] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function openEmojiPanel() {
    setPanel('emoji-gif')
    setMentionQuery(null)
    // Blur zodat het toetsenbord sluit; het panel neemt de hoogte over
    textareaRef.current?.blur()
  }

  function closeEmojiPanel() {
    setPanel('none')
    // Focus opent het toetsenbord weer
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function togglePlus() {
    setPanel((cur) => (cur === 'plus' ? 'none' : 'plus'))
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    setPanel('none')
    setMentionQuery(null)
    try {
      await onSendText(trimmed)
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = ''
    } catch {
      // tekst blijft staan zodat gebruiker opnieuw kan proberen
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    const pos = e.target.selectionStart ?? val.length
    setText(val)

    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'

    const before = val.slice(0, pos)
    const lastAt = before.lastIndexOf('@')
    if (lastAt >= 0) {
      const charBeforeAt = lastAt > 0 ? before[lastAt - 1] : ' '
      const afterAt = before.slice(lastAt + 1)
      if ((/\s/.test(charBeforeAt) || lastAt === 0) && /^\w*$/.test(afterAt)) {
        setMentionQuery(afterAt)
        setMentionStart(lastAt)
        return
      }
    }
    setMentionQuery(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && e.key === 'Escape') {
      e.preventDefault()
      setMentionQuery(null)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextareaFocus() {
    // iOS scrollt de pagina bij keyboard open — reset direct zodat de header zichtbaar blijft
    window.scrollTo(0, 0)
    if (panel === 'emoji-gif') setPanel('none')
    if (panel === 'plus') setPanel('none')
  }

  function selectMention(participant: Participant) {
    if (mentionQuery === null || !textareaRef.current) return
    const before = text.slice(0, mentionStart)
    const after = text.slice(mentionStart + 1 + mentionQuery.length)
    const mention = `@${participant.name} `
    const newText = before + mention + after
    setText(newText)
    setMentionQuery(null)
    const newPos = before.length + mention.length
    textareaRef.current.focus()
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const mentionSuggestions = mentionQuery !== null
    ? (() => {
        const q = mentionQuery.toLowerCase()
        const allEntry: Participant = { name: 'all', initials: '📢' }
        const showAll = 'all'.startsWith(q) || 'iedereen'.startsWith(q)
        const matched = participants
          .filter((p) =>
            p.name.toLowerCase().startsWith(q) ||
            p.initials.toLowerCase().startsWith(q),
          )
          .slice(0, showAll ? 4 : 5)
        return showAll ? [allEntry, ...matched] : matched
      })()
    : []

  function handleEmojiSelect(emoji: string) {
    setText((t) => t + emoji)
    textareaRef.current?.focus()
  }

  function openFilePicker() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true)
      setPanel('none')
      try {
        await onSendImage(file)
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  async function handleGifSelect(url: string) {
    setPanel('none')
    await onSendGif(url)
  }

  async function handlePollSubmit(question: string, options: string[], multiple: boolean) {
    setPanel('none')
    await onSendPoll(question, options, multiple)
  }

  const replyPreview = replyTo
    ? replyTo.type === 'image' ? '📷 Afbeelding'
    : replyTo.type === 'gif' ? '🎞️ GIF'
    : replyTo.type === 'poll' ? '📊 Poll'
    : replyTo.text.slice(0, 60)
    : null

  return (
    <div className="border-t border-[#2a2a2a] bg-[#0D0D0D]">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#161616] border-t border-[#2a2a2a] border-b border-[#FF6B00]/30">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#FF6B00] font-bold">Reactie op {replyTo.sender}</p>
            <p className="text-[11px] text-[#888] truncate">{replyPreview}</p>
          </div>
          <button onClick={onCancelReply} className="text-[#555] hover:text-[#888] flex-shrink-0 text-lg leading-none">✕</button>
        </div>
      )}

      <div className="relative flex items-end gap-2 px-3 py-2">
        {/* @mention dropdown */}
        {mentionQuery !== null && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden z-10 shadow-lg">
            {mentionSuggestions.map((p) => (
              <button
                key={p.initials}
                onMouseDown={(e) => { e.preventDefault(); selectMention(p) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] text-left"
              >
                {p.name === 'all'
                  ? <span className="text-base flex-shrink-0">📢</span>
                  : <span className="text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 rounded-full px-1.5 py-0.5 flex-shrink-0">{p.initials}</span>
                }
                <span className="text-sm text-white">{p.name === 'all' ? '@all — Iedereen' : p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Plus-menu popup */}
        {panel === 'plus' && (
          <div className="absolute bottom-full left-3 mb-2 z-20">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden shadow-xl">
              <button
                onMouseDown={(e) => { e.preventDefault(); openFilePicker(); setPanel('none') }}
                disabled={disabled || uploading}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#2a2a2a] active:bg-[#333] text-left disabled:opacity-40"
              >
                <IconCamera className="w-5 h-5 text-[#888] flex-shrink-0" />
                <span className="text-sm text-white">{uploading ? 'Bezig…' : 'Foto / Camera'}</span>
              </button>
              <div className="h-px bg-[#333]" />
              <button
                onMouseDown={(e) => { e.preventDefault(); setPanel('poll') }}
                disabled={disabled}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#2a2a2a] active:bg-[#333] text-left disabled:opacity-40"
              >
                <IconPoll className="w-5 h-5 text-[#888] flex-shrink-0" />
                <span className="text-sm text-white">Poll aanmaken</span>
              </button>
            </div>
          </div>
        )}

        {/* Knoppen: emoji-toggle en plus */}
        <div className="flex gap-1 flex-shrink-0 pb-1">
          {/* Emoji / toetsenbord toggle */}
          <button
            tabIndex={-1}
            onClick={panel === 'emoji-gif' ? closeEmojiPanel : openEmojiPanel}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
              panel === 'emoji-gif'
                ? 'text-[#FF6B00] bg-[#FF6B00]/10'
                : 'text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E]'
            }`}
            title={panel === 'emoji-gif' ? 'Toetsenbord' : 'Emoji & GIF'}
          >
            {panel === 'emoji-gif'
              ? <IconKeyboard className="w-5 h-5" />
              : <IconSmile className="w-5 h-5" />
            }
          </button>

          {/* Plus knop */}
          <button
            tabIndex={-1}
            onClick={togglePlus}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xl font-light leading-none transition-colors disabled:opacity-40 ${
              panel === 'plus'
                ? 'text-[#FF6B00] bg-[#FF6B00]/10'
                : 'text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E]'
            }`}
            title="Meer opties"
          >
            {panel === 'plus' ? '✕' : '+'}
          </button>
        </div>

        {/* Tekstvak */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={handleTextareaFocus}
          placeholder="Bericht..."
          rows={1}
          disabled={disabled}
          inputMode="text"
          enterKeyHint="send"
          className="flex-1 bg-[#1E1E1E] border border-[#2a2a2a] rounded-2xl px-4 py-2 text-white placeholder:text-[#555] outline-none focus:border-[#FF6B00]/50 resize-none overflow-hidden disabled:opacity-40"
          style={{ minHeight: '2.5rem', maxHeight: '7.5rem', fontSize: '16px' }}
        />

        {/* Verzendknop */}
        <button
          tabIndex={-1}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-[#FF6B00] flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF8C33] active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-90">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      {/* Gecombineerd Emoji/GIF panel — onder de invoerbalk */}
      {panel === 'emoji-gif' && (
        <EmojiGifPanel onSelectEmoji={handleEmojiSelect} onSelectGif={handleGifSelect} />
      )}

      {/* Poll aanmaken — onder de invoerbalk */}
      {panel === 'poll' && (
        <PollCreatorPanel onSubmit={handlePollSubmit} onClose={() => setPanel('none')} />
      )}

    </div>
  )
}
