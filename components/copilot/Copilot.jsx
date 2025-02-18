'use client'

import React, { useState } from 'react'
import { Sparkles, Plus, History, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import ChatHistory from './History'
import ChatBox from './ChatBox'
import useChatStore from '../../store/useChatStore'

const Copilot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { view, setView, setCurrentChatId } = useChatStore()

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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="flex h-14 w-14 transform items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-blue-600"
      >
        <Sparkles className="h-7 w-7" />
      </button>
      {isOpen && (
        <div className={`${
          isFullscreen 
            ? 'fixed inset-0 bottom-0 right-0 w-full h-full rounded-none'
            : 'absolute bottom-20 right-0 w-96 rounded-lg'
        } bg-white p-4 shadow-lg dark:bg-gray-800`}>
          <div className={`flex ${isFullscreen ? 'h-full' : 'h-[500px]'} flex-col`}>
            <div className="mb-2 flex items-center justify-between">
              {view === 'history' && (
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-2 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span>All Chats</span>
                </div>
              )}
              <div className="ml-auto flex space-x-2">
                <button
                  onClick={handleFullscreenToggle}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={handleNewChat}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="New Chat"
                >
                  <Plus className="h-5 w-5" />
                </button>
                {view !== 'history' && (
                  <button
                    onClick={handleHistoryToggle}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Chat History"
                  >
                    <History className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            {view === 'history' ? <ChatHistory /> : <ChatBox />}
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
