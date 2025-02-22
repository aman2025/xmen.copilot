'use client'

import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '../../store/useChatStore'

const ChatBox = () => {
  const { currentChatId } = useChatStore()

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2"
        // Add space for Sparkles icon
      >
        <Messages chatId={currentChatId} />
      </div>
      <div className="sticky bottom-0 p-4 pt-1 dark:bg-gray-800">
        <ChatInput />
      </div>
    </div>
  )
}

export default ChatBox
