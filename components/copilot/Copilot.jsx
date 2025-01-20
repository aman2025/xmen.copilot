'use client'

import React, { useState } from 'react'
import { Sparkles, Plus, History } from 'lucide-react'
import ChatHistory from './History'
import Messages from './Messages'

const Copilot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState(null)

  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
      })
      const data = await res.json()
      setChatId(data.chatId)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e) => {
    setPrompt(e.target.value)
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || !chatId) return

    setIsLoading(true)
    // Add user message immediately
    const userMessage = { role: 'user', content: prompt }
    setMessages((prev) => [...prev, userMessage])
    setPrompt('')

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, chatId }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      // Add assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Failed to fetch Mistral API:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to get response from Mistral API.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleHistoryToggle = () => {
    setShowHistory(!showHistory)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="flex h-14 w-14 transform items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-blue-600"
      >
        <Sparkles className="h-7 w-7" />
      </button>
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
          <div className="flex h-[500px] flex-col">
            <div className="mb-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setMessages([])
                  setShowHistory(false)
                }}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="New Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={handleHistoryToggle}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Chat History"
              >
                <History className="h-5 w-5" />
              </button>
            </div>
            {showHistory ? (
              <ChatHistory
                onSelectChat={(selectedChatId) => {
                  setChatId(selectedChatId)
                  setShowHistory(false)
                }}
              />
            ) : (
              <Messages chatId={chatId} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
