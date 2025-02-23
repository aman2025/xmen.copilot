'use client'
import React, { useState, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'

const ChatHistory = () => {
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { setCurrentChatId, setView } = useChatStore()

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

  useEffect(() => {
    fetchChatHistory()
  }, [])

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation() // Prevent triggering the chat selection
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE'
      })
      fetchChatHistory() // Refresh the list after deletion
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  // Helper function to format time
  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    return new Date(date).toLocaleDateString()
  }

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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">No chat history found</div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{chat.title || 'What can GitHub Copilot do?'}</div>
                    <div className="text-sm text-gray-500">{getTimeAgo(chat.createdAt)}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="rounded-full p-2 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-600"
                >
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatHistory
