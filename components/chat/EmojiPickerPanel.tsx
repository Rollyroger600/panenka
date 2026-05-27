'use client'

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Voetbal', emojis: ['⚽', '🏆', '🥅', '🟨', '🟥', '🔴', '🟡', '🏟️', '🥇', '🎽'] },
  { label: 'Reacties', emojis: ['😂', '🤣', '😭', '😮', '🤯', '🫣', '🤦', '🤷', '👏', '🙌'] },
  { label: 'Aanmoediging', emojis: ['🔥', '💪', '⚡', '🚀', '💯', '🎉', '🎊', '🥳', '✅', '👑'] },
  { label: 'Gevoel', emojis: ['❤️', '🧡', '💛', '💚', '💙', '🖤', '😍', '🤩', '😎', '😤'] },
  { label: 'Landen', emojis: ['🇳🇱', '🇩🇪', '🇫🇷', '🇧🇷', '🇦🇷', '🇪🇸', '🇵🇹', '🇧🇪', '🇮🇹', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'] },
]

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPickerPanel({ onSelect, onClose }: Props) {
  return (
    <div className="bg-[#161616] border-t border-[#2a2a2a] pb-2">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-xs text-[#555] uppercase tracking-wide">Emoji</span>
        <button onClick={onClose} className="text-[#555] hover:text-[#888] text-sm">✕</button>
      </div>
      <div className="max-h-52 overflow-y-auto px-3 pt-2 space-y-2">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">{group.label}</p>
            <div className="flex flex-wrap gap-1">
              {group.emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => onSelect(e)}
                  className="text-2xl hover:scale-125 transition-transform leading-none p-0.5"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
