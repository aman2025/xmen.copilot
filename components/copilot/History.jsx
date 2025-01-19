import React, { useState, useEffect } from 'react'

const ChatHistory = ({ onSelectChat }) => {
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
    return <div className="flex justify-center items-center h-full">Loading...</div>
  }

  if (!chats) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Error loading chats</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No chat history found
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
