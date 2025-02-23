'use client'

import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '../../store/useChatStore'
import { SendHorizontal } from 'lucide-react'

const ChatBox = ({ presetQuestions, onPresetQuestionClick }) => {
  const { currentChatId } = useChatStore()

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2"
        // Add space for Sparkles icon
      >
        <Messages chatId={currentChatId} />
      </div>

      {!currentChatId && (
        <div className="px-4 py-2 dark:border-gray-700">
          <div className="mb-2 text-sm text-gray-500">Ask about tasks:</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {presetQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onPresetQuestionClick(question)}
                className="flex items-center rounded-lg border p-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <SendHorizontal className="mr-2 h-4 w-4 rotate-[-45deg]" />
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 p-4 pt-1 dark:bg-gray-800">
        <ChatInput />
      </div>
    </div>
  )
}

export default ChatBox
