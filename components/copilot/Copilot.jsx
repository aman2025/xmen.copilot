'use client'

import React, { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
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

  useEffect(() => {
    // Create a new chat when component mounts
    createNewChat()
  }, [])

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
    setMessages(prev => [...prev, userMessage])
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
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Failed to fetch Mistral API:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response from Mistral API.' }])
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
        className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-transform duration-200 transform hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex flex-col h-[500px]">
            <div className="flex justify-end mb-2 space-x-2">
              <button
                onClick={() => {
                  createNewChat()
                  setMessages([])
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="New Chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <button
                onClick={handleHistoryToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Chat History"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
            </div>
            {showHistory ? (
              <ChatHistory onSelectChat={(selectedChatId) => {
                setChatId(selectedChatId)
                setShowHistory(false)
              }} />
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
