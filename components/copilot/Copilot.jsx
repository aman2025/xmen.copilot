'use client'

import React, { useState } from 'react'
import { Plus, History, ArrowLeft, Maximize, Minimize, X } from 'lucide-react'
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
    'How many instances are there?',
    'Help me start an instance?',
    'What tasks can I ask?'
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="flex h-14 w-14 transform items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-blue-600"
      >
        <img src="/copilot-icon-white.svg" alt="Copilot" className="h-8 w-8" />
      </button>
      {isOpen && (
        <div
          className={`${
            isFullscreen
              ? 'fixed inset-0 bottom-[45px] left-[60px] right-[60px] top-[45px] rounded-2xl'
              : 'absolute bottom-0 right-0 w-[400px] rounded-[1rem] border shadow-lg'
          } bg-white dark:border-gray-700 dark:bg-gray-800`}
        >
          <div className={`flex ${isFullscreen ? 'h-full' : 'h-[600px]'} flex-col overflow-hidden`}>
            {/* Header */}
            <div className="border-b px-4 py-[0.3rem] pr-2 dark:border-gray-700 dark:bg-gray-800">
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
      )}
    </div>
  )
}

export default Copilot
