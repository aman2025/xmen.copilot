'use client'
import React, { useState, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'

const ChatHistory = () => {
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { setCurrentChatId, setView } = useChatStore()

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('/api/chat')
        const data = await response.json()
        setChats(data.chats)
      } catch (error) {
        console.error('Failed to fetch chat history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatHistory()
  }, [])

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>
  }

  if (!chats) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Error loading chats</div>
  }

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId)
    setView('chat')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No chat history found</div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="font-medium">{chat.title || 'Chat ' + chat.id}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(chat.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatHistory
