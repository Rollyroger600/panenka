export type ChatMessageType = 'text' | 'image' | 'gif' | 'poll'

export interface PollOption {
  text: string
  votes: string[]  // voter initials
}

export interface ChatReplyRef {
  id: string
  sender: string
  text: string
  type: ChatMessageType
}

export interface ChatMessage {
  id: string
  sender: string          // display name e.g. "Rogier"
  senderInitials: string  // e.g. "RH"
  text: string
  ts: number              // unix ms
  type: ChatMessageType
  imageUrl?: string       // Vercel Blob URL
  gifUrl?: string         // GIPHY URL
  replyTo?: ChatReplyRef
  reactions: Record<string, string[]>  // emoji → [initials, ...]
  pollQuestion?: string
  pollOptions?: PollOption[]
  pollMultiple?: boolean
}
