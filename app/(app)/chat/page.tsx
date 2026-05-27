import { cookies } from 'next/headers'
import { ChatPage } from '@/components/chat/ChatPage'

export default async function ChatRoute() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  return (
    <div
      className="fixed inset-x-0 flex flex-col"
      style={{
        top: '7.5rem',
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + var(--chat-kb-h, 0px))',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <ChatPage initials={initials} />
    </div>
  )
}
