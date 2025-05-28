'use client'
import React, { useState, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import { loadChatSession } from '../../store/chatActions'
import { Trash2, MessageSquare } from 'lucide-react'

const ChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([])
  const [isFetchingHistory, setIsFetchingHistory] = useState(true)
  const { setCurrentChatId, setView, currentChatId } = useChatStore()

  const fetchUserChatHistory = async () => {
    setIsFetchingHistory(true)
    try {
      const response = await fetch('/api/chat')
      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`)
      }
      const data = await response.json()
      setChatHistory(data.chats || [])
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
      setChatHistory([])
    } finally {
      setIsFetchingHistory(false)
    }
  }

  useEffect(() => {
    fetchUserChatHistory()
  }, [])

  const handleDeleteChat = async (e, chatIdToDelete) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const response = await fetch(`/api/chat/${chatIdToDelete}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error(`Failed to delete chat: ${response.statusText}`)
        }
        fetchUserChatHistory()
        if (currentChatId === chatIdToDelete) {
          useChatStore.getState().setCurrentChatId(null)
          useChatStore.getState().setCurrentChatTitle(null)
          useChatStore.getState().clearMessages()
          setView('chat')
        }
      } catch (error) {
        console.error('Failed to delete chat:', error)
        alert(`Error deleting chat: ${error.message}`)
      }
    }
  }

  const handleSelectChat = (chatIdToLoad, chatTitle) => {
    if (currentChatId === chatIdToLoad) {
        setView('chat')
        return
    }
    loadChatSession(chatIdToLoad, chatTitle)
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.round((now - date) / 1000)
    const minutes = Math.round(seconds / 60)
    const hours = Math.round(minutes / 60)
    const days = Math.round(hours / 24)

    if (seconds < 60) return `${seconds} sec ago`
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hr ago`
    if (days < 7) return `${days} day(s) ago`
    return date.toLocaleDateString()
  }

  if (isFetchingHistory) {
    return <div className="flex h-full items-center justify-center p-4">Loading history...</div>
  }

  if (!chatHistory || chatHistory.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
        <MessageSquare className="mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="text-lg font-medium">No chat history</p>
        <p className="text-sm">Start a new conversation to see it here.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleSelectChat(chat.id, chat.title || 'Chat')}
            className={`group flex w-full cursor-pointer items-center justify-between rounded-lg p-3 transition-colors
                        ${currentChatId === chat.id ? 'bg-blue-100 dark:bg-blue-800/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <MessageSquare className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm text-gray-800 dark:text-gray-200">
                  {chat.title || 'Untitled Chat'}
                </div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Updated {getTimeAgo(chat.updatedAt)}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteChat(e, chat.id)}
              className="ml-2 flex-shrink-0 rounded-full p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-700/50 dark:hover:text-red-400"
              title="Delete chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatHistory
