'use client'

import React, { useState } from 'react'
import { Send } from 'lucide-react'

const Copilot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e) => {
    setPrompt(e.target.value)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data.response)
    } catch (error) {
      console.error('Failed to fetch Gemini API:', error)
      setResponse('Failed to get response from Gemini API.')
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
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 p-2 border rounded-md text-gray-800 dark:text-white dark:bg-gray-700"
                value={prompt}
                onChange={handleInputChange}
              />
              <button
                onClick={handleSubmit}
                className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : <Send />}
              </button>
            </div>
            {response && (
              <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                {response}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
