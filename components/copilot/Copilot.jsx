'use client'

import React, { useState, useEffect } from 'react'
import { Send } from 'lucide-react'

const Copilot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState(null)

  useEffect(() => {
    // Create a new chat when component mounts
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
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
                      : 'bg-gray-100 dark:bg-gray-700 mr-auto'
                  } max-w-[80%]`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 p-2 border rounded-md text-gray-800 dark:text-white dark:bg-gray-700"
                value={prompt}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : <Send />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
