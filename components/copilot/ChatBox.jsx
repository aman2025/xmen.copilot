'use client'

import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import Messages from './Messages'
import ChatInput from './ChatInput'
import ChatView from './ChatView'
import useChatStore from '../../store/useChatStore'
import { initController, sendMessage } from '../../store/chatActions'
import { SendHorizontal } from 'lucide-react'

const ChatBox = ({ presetQuestions, onPresetQuestionClick }) => {
  const { currentChatId, messageInput, setMessageInput, isLoading } = useChatStore()
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  const handleScroll = () => {
    // We can add scroll handling logic here if needed in the future
  }

  // Scroll to bottom function with smooth behavior
  const scrollToBottom = (immediate = false) => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        if (immediate) {
          // Use setTimeout instead of requestAnimationFrame for better animation timing
          setTimeout(() => {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: 'smooth'
            })
          }, 50) // Add a slight delay to ensure the first scroll completes
        } else {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }
  }

  // Add scroll event listener
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.addEventListener('scroll', handleScroll)
        return () => viewport.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // Add scroll to bottom to global state with immediate option
  useEffect(() => {
    useChatStore.setState({
      scrollToBottom,
      scrollToBottomImmediate: () => scrollToBottom(true)
    })
    return () => {
      useChatStore.setState({
        scrollToBottom: null,
        scrollToBottomImmediate: null
      })
    }
  }, [])

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 [&>div:nth-child(2)>div:nth-child(1)]:h-full"
        type="always"
      >
        <div className="flex h-full flex-col items-center">
          <div
            className={`flex h-full w-full flex-col justify-between px-4 ${useChatStore().isFullscreen ? 'max-w-[888px]' : ''}`}
          >
            {currentChatId ? (
              <div>
                <Messages chatId={currentChatId} />
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <ChatView />
                </div>
                <div className="py-2 dark:border-gray-700">
                  <div className="mb-2 text-sm text-gray-500">Ask about tasks:</div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {presetQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => onPresetQuestionClick(question)}
                        className="flex items-center rounded-lg border p-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <SendHorizontal className="mr-2 h-4 w-4 rotate-[-45deg]" />
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <div className="flex justify-center border-t px-4 py-2">
        <div className={`w-full ${useChatStore().isFullscreen ? 'max-w-[888px]' : ''}`}>
          <ChatInput
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Type a message..."
          />
        </div>
      </div>
    </div>
  )
}

export default ChatBox
