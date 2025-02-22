'use client'

import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '../../store/useChatStore'

const ChatBox = () => {
  const { currentChatId } = useChatStore()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <Messages chatId={currentChatId} />
      </div>
      <div className="sticky bottom-0 border-t bg-white p-4 dark:bg-gray-800">
        <ChatInput />
      </div>
    </div>
  )
}

export default ChatBox
