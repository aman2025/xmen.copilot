'use client'

import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '../../store/useChatStore'

const ChatBox = () => {
  const { currentChatId } = useChatStore()

  return (
    <div className="flex h-full flex-col">
      <Messages chatId={currentChatId} />
      <ChatInput />
    </div>
  )
}

export default ChatBox
