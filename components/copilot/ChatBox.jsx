'use client'

import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ChatInput from './ChatInput'
import ChatView from './ChatView'
import useChatStore from '../../store/useChatStore'
import { initController, sendMessage, startNewChat }
from '../../store/chatActions'
import { SendHorizontal, MessageSquarePlus } from 'lucide-react'

const ChatBox = ({ presetQuestions, onPresetQuestionClick }) => {
  const { currentChatId, messageInput, setMessageInput, isLoading, clineMessages } = useChatStore()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput)
    }
  }
  
  const handlePresetQuestionClickInternal = (question) => {
    if (!currentChatId) {
        sendMessage(question)
    } else {
        onPresetQuestionClick(question)
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      <div className="flex-1 overflow-hidden">
        {(currentChatId || clineMessages.length > 0 || isLoading) ? (
          <ChatView />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <MessageSquarePlus className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Start a conversation</h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Ask me anything or choose a suggestion below.
            </p>
            <div className="w-full max-w-md space-y-2">
              {presetQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetQuestionClickInternal(question)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <SendHorizontal size={16} className="text-blue-500" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <ChatInput
          placeholder={currentChatId ? "Type your message..." : "Start a new chat..."}
        />
      </div>
    </div>
  )
}

export default ChatBox
