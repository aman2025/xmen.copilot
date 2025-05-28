'use client'

import React, { useState, useEffect } from 'react'
import { Plus, History, ArrowLeft, Maximize, Minimize, X } from 'lucide-react'
import ChatHistory from './History'
import ChatBox from './ChatBox'
import useChatStore from '../../store/useChatStore'
import { startNewChat, initController } from '../../store/chatActions'

const Copilot = () => {
  const {
    view,
    setView,
    currentChatId,
    isFullscreen,
    setIsFullscreen,
    messageInput,
    setMessageInput,
    currentChatTitle
  } = useChatStore()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    initController()
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleHistoryToggle = () => {
    setView('history')
  }

  const handleNewChatClick = () => {
    startNewChat()
    setView('chat')
  }

  const handleBackToChatList = () => {
    setView('history')
    setView('chat')
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handlePresetQuestion = (question) => {
    setMessageInput(question)
    const inputElement = document.getElementById('copilot-input')
    if (inputElement) inputElement.focus()
  }

  const presetQuestions = [
    'How many instances are there?',
    'Help me start an instance named "my-new-app".',
    'What tasks can I ask you to perform?'
  ]

  const getHeaderTitle = () => {
    if (view === 'history') return 'All Chats'
    if (currentChatId && currentChatTitle) return currentChatTitle
    return 'New Conversation'
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 z-[1000] flex h-14 w-14 transform items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        aria-label="Open Copilot"
      >
        <img src="/copilot-icon-white.svg" alt="Copilot" className="h-8 w-8" />
      </button>
    )
  }

  return (
    <div
      className={`fixed z-[999] rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 
                  ${
                    isFullscreen
                      ? 'inset-0 sm:inset-[45px]'
                      : 'bottom-4 right-4 w-[calc(100%-2rem)] max-w-md sm:w-[400px]'
                  } 
                  transition-all duration-300 ease-in-out`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-header-title"
    >
      <div
        className={`flex ${isFullscreen ? 'h-full' : 'h-[600px] max-h-[80vh] sm:max-h-[600px]'} flex-col overflow-hidden rounded-xl`}
      >
        <div className="flex-shrink-0 border-b border-gray-200 px-3 py-2.5 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {view === 'history' && (
                <button
                  onClick={handleBackToChatList}
                  className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Back to Chat"
                  aria-label="Back to Chat"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <span
                id="copilot-header-title"
                className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100"
              >
                {getHeaderTitle()}
              </span>
            </div>
            <div className="flex items-center space-x-0.5">
              {view === 'chat' && (
                <>
                  <button
                    onClick={handleNewChatClick}
                    className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    title="New Chat"
                    aria-label="New Chat"
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
                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Close Copilot"
                aria-label="Close Copilot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
          {view === 'chat' && (
            <ChatBox
              presetQuestions={presetQuestions}
              onPresetQuestionClick={handlePresetQuestion}
            />
          )}
          {view === 'history' && <ChatHistory />}
        </div>
      </div>
    </div>
  )
}

export default Copilot
