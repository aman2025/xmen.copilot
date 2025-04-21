'use client'

import { SendHorizontal } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { sendMessage, initController } from '../../store/chatActions'
import { useEffect } from 'react'

const ChatInput = () => {
  const { messageInput, setMessageInput, isLoading } = useChatStore()

  // Initialize controller on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return
    sendMessage(messageInput)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <div className="flex w-full items-center rounded-2xl border border-gray-200 bg-white px-4 py-[0.5rem] pr-2 dark:border-gray-600 dark:bg-gray-800">
        <input
          id="copilot-input"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Copilot"
          className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none dark:text-white"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !messageInput.trim()}
          className={`ml-2 rounded-lg p-2 transition-colors ${
            isLoading || !messageInput.trim()
              ? 'not-allowed text-gray-300'
              : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}

export default ChatInput
