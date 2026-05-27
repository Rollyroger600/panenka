'use client'
import { useState, useRef } from 'react'
import { EmojiPickerPanel } from './EmojiPickerPanel'
import { GifPickerPanel } from './GifPickerPanel'
import { PollCreatorPanel } from './PollCreatorPanel'
import { IconCamera, IconSmile } from '@/components/icons/NavIcons'
import type { ChatMessage } from '@/lib/types/chat'

type Panel = 'none' | 'emoji' | 'gif' | 'poll'

interface Props {
  replyTo: ChatMessage | null
  onCancelReply: () => void
  onSendText: (text: string) => Promise<void>
  onSendImage: (file: File) => Promise<void>
  onSendGif: (url: string) => Promise<void>
  onSendPoll: (question: string, options: string[], multiple: boolean) => Promise<void>
  disabled?: boolean
}

function IconPoll({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/>
    </svg>
  )
}

export function ChatInput({ replyTo, onCancelReply, onSendText, onSendImage, onSendGif, onSendPoll, disabled }: Props) {
  const [text, setText] = useState('')
  const [panel, setPanel] = useState<Panel>('none')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function togglePanel(p: Panel) {
    setPanel((cur) => (cur === p ? 'none' : p))
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    setText('')
    setPanel('none')
    await onSendText(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleEmojiSelect(emoji: string) {
    setText((t) => t + emoji)
    setPanel('none')
    textareaRef.current?.focus()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setPanel('none')
    try {
      await onSendImage(file)
    } finally {
      setUploading(false)
    }
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
      {panel === 'emoji' && <EmojiPickerPanel onSelect={handleEmojiSelect} onClose={() => setPanel('none')} />}
      {panel === 'gif' && <GifPickerPanel onSelect={handleGifSelect} onClose={() => setPanel('none')} />}
      {panel === 'poll' && <PollCreatorPanel onSubmit={handlePollSubmit} onClose={() => setPanel('none')} />}

      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#161616] border-t border-[#2a2a2a] border-b border-[#FF6B00]/30">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#FF6B00] font-bold">Reactie op {replyTo.sender}</p>
            <p className="text-[11px] text-[#888] truncate">{replyPreview}</p>
          </div>
          <button onClick={onCancelReply} className="text-[#555] hover:text-[#888] flex-shrink-0 text-lg leading-none">✕</button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <div className="flex gap-1 flex-shrink-0 pb-1">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled || uploading}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E] transition-colors disabled:opacity-40"
            title="Afbeelding sturen"
          >
            {uploading ? <span className="text-xs animate-spin">⏳</span> : <IconCamera className="w-5 h-5" />}
          </button>
          <button
            onClick={() => togglePanel('gif')}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors disabled:opacity-40 ${
              panel === 'gif' ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E]'
            }`}
            title="GIF sturen"
          >
            GIF
          </button>
          <button
            onClick={() => togglePanel('emoji')}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors disabled:opacity-40 ${
              panel === 'emoji' ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E]'
            }`}
            title="Emoji"
          >
            <IconSmile className="w-5 h-5" />
          </button>
          <button
            onClick={() => togglePanel('poll')}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
              panel === 'poll' ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'text-[#555] hover:text-[#FF6B00] hover:bg-[#1E1E1E]'
            }`}
            title="Poll aanmaken"
          >
            <IconPoll className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          onKeyDown={handleKeyDown}
          placeholder="Bericht..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-[#1E1E1E] border border-[#2a2a2a] rounded-2xl px-4 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#FF6B00]/50 resize-none overflow-hidden disabled:opacity-40"
          style={{ minHeight: '2.5rem', maxHeight: '7.5rem' }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-[#FF6B00] flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF8C33] active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-90">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
