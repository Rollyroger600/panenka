import { cookies } from 'next/headers'
import { ChatPage } from '@/components/chat/ChatPage'
import { DUAL_GROUP_INITIALS, type GroupId } from '@/lib/groups'

export default async function ChatRoute() {
  const store = await cookies()
  const initials = store.get('participant')?.value ?? ''
  const isDualGroup = DUAL_GROUP_INITIALS.includes(initials)
  const defaultGroup = (store.get('group')?.value ?? 'og') as GroupId
  return (
    <div
      className="fixed inset-x-0 flex flex-col"
      style={{
        top: '7.5rem',
        // height direct gebaseerd op vv.height (door JS gezet) — immuun voor iOS window.innerHeight-bug
        // waarbij innerHeight meeschaalt met het toetsenbord en kbH altijd 0 uitkomt
        height: 'calc(var(--chat-vvp-h, 100vh) - 7.5rem - var(--chat-nav-h, 3.5rem) - var(--chat-safe-inset, env(safe-area-inset-bottom)))',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <ChatPage initials={initials} defaultGroup={defaultGroup} isDualGroup={isDualGroup} />
    </div>
  )
}
