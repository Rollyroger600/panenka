'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (question: string, options: string[], multiple: boolean) => Promise<void>
  onClose: () => void
}

export function PollCreatorPanel({ onSubmit, onClose }: Props) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiple, setMultiple] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    const validOptions = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || validOptions.length < 2) return
    setSubmitting(true)
    try {
      await onSubmit(question.trim(), validOptions, multiple)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2

  return (
    <div className="border-t border-[#2a2a2a] bg-[#111] px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Nieuwe poll</span>
        <button onClick={onClose} className="text-[#555] hover:text-[#888] text-lg leading-none">✕</button>
      </div>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Vraag..."
        className="w-full bg-[#1E1E1E] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#FF6B00]/50"
      />

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Optie ${i + 1}`}
              className="flex-1 bg-[#1E1E1E] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#FF6B00]/50"
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                className="text-[#555] hover:text-[#888] text-sm w-6 h-6 flex items-center justify-center flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Meerdere antwoorden toggle */}
      <button
        onClick={() => setMultiple((v) => !v)}
        className={`flex items-center gap-2 text-sm transition-colors w-fit ${multiple ? 'text-[#FF6B00]' : 'text-[#555] hover:text-[#888]'}`}
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${multiple ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-[#444]'}`}>
          {multiple && (
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-white">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
        Meerdere antwoorden mogelijk
      </button>

      <div className="flex items-center gap-3">
        {options.length < 4 && (
          <button
            onClick={() => setOptions((prev) => [...prev, ''])}
            className="text-sm text-[#555] hover:text-[#888] transition-colors"
          >
            + Optie toevoegen
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="ml-auto bg-[#FF6B00] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-30 hover:bg-[#FF8C33] active:scale-95 transition-all"
        >
          {submitting ? '...' : 'Verstuur'}
        </button>
      </div>
    </div>
  )
}
