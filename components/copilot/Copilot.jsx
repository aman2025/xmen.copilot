'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Plus,
  History,
  ArrowLeft,
  Maximize,
  Minimize,
  SendHorizontal,
  X,
  Square
} from 'lucide-react'
import ChatHistory from './History'
import ChatBox from './ChatBox'
import useChatStore from '../../store/useChatStore'

const Copilot = () => {
  const {
    view,
    setView,
    currentChatId,
    setCurrentChatId,
    isFullscreen,
    setIsFullscreen,
    messageInput,
    setMessageInput
  } = useChatStore()
  const [isOpen, setIsOpen] = useState(true)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleHistoryToggle = () => {
    setView('history')
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    setView('chat')
  }

  const handleBack = () => {
    setView('chat')
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handlePresetQuestion = (question) => {
    setMessageInput(question)
    // Focus the input after setting the question
    const inputElement = document.getElementById('copilot-input')
    if (inputElement) inputElement.focus()
  }

  const presetQuestions = [
    'Can you tell me about this repository?',
    'How should I get started exploring this repo?',
    'What questions can I ask?'
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="flex h-14 w-14 transform items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-blue-600"
      >
        <Sparkles className="h-7 w-7" />
      </button>
      {isOpen && (
        <div
          className={`${
            isFullscreen
              ? 'fixed inset-0 bottom-0 right-0 h-full w-full rounded-none'
              : 'absolute bottom-0 right-0 w-[400px] rounded-[1rem] border shadow-lg'
          } bg-white dark:border-gray-700 dark:bg-gray-800`}
        >
          <div className={`flex ${isFullscreen ? 'h-full' : 'h-[600px]'} flex-col overflow-hidden`}>
            {/* Header */}
            <div className="border-b px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {view === 'history' && (
                    <button
                      onClick={handleBack}
                      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <span className="text-base font-medium">
                    {view === 'history' ? 'All Chats' : 'New conversation'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {view === 'chat' && (
                    <>
                      <button
                        onClick={handleNewChat}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="New chat"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleHistoryToggle}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <History className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleFullscreenToggle}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
              {view === 'chat' && !currentChatId && (
                <div className="flex flex-col space-y-3 p-4">
                  <div className="text-sm text-gray-500">Ask about the repository:</div>
                  {presetQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetQuestion(question)}
                      className="flex items-center rounded-lg border p-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <SendHorizontal className="mr-2 h-4 w-4 rotate-[-45deg]" />
                      {question}
                    </button>
                  ))}
                </div>
              )}
              {view === 'history' ? <ChatHistory /> : <ChatBox />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
