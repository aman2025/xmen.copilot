'use client'

import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { initController, handleResponse } from '../../store/chatActions'
import { useEffect } from 'react'

const CopilotAvatar = () => {
  return (
    <div className="h-7 w-7 flex-shrink-0">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
    </div>
  )
}

const Messages = ({ chatId }) => {
  const { setMessageInput, userMessages, copilotMessages, isLoading } = useChatStore()

  // Initialize controller on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  // For backward compatibility, still fetch messages from API if chatId is provided
  const {
    data: apiMessages = [],
    isLoading: isApiLoading,
    error
  } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      try {
        const res = await fetch(`/api/chat/${chatId}/messages`, {
          signal: AbortSignal.timeout(5000)
        })
        if (!res.ok) throw new Error('Failed to fetch messages')
        const data = await res.json()
        return data.messages || []
      } catch (error) {
        console.error('Error fetching messages:', error)
        throw error
      }
    },
    enabled: !!chatId,
    retry: 3,
    retryDelay: 1000
  })

  // Combine user and copilot messages for display
  const allMessages = [
    ...userMessages.map((msg) => ({ ...msg, role: 'user' })),
    ...copilotMessages.map((msg) => ({ ...msg, role: 'assistant' }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  // Use API messages if chatId is provided, otherwise use messages from store
  const messages = chatId ? apiMessages : allMessages
  const loading = chatId ? isApiLoading : isLoading

  if (loading && messages.length === 0) {
    return <div className="flex justify-center p-6">Loading messages...</div>
  }

  if (error && chatId) {
    return (
      <div className="flex justify-center p-6 text-red-500">
        Error loading messages. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 py-4">
      {messages?.map((message) => (
        <div key={message?.id || `${message.role}-${message.createdAt}`}>
          <MessageItem
            message={message}
            setMessageInput={setMessageInput}
            handleResponse={handleResponse}
          />
        </div>
      ))}
    </div>
  )
}

const MessageItem = ({ message, setMessageInput, handleResponse }) => {
  const { isFullscreen } = useChatStore()

  const components = {
    a: ({ href, children }) => {
      if (href === 'send_to_message_box') {
        return (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMessageInput(children.toString())
            }}
            className="cursor-pointer text-blue-500 underline hover:text-blue-600"
          >
            {children}
          </a>
        )
      }
      return <a href={href}>{children}</a>
    }
  }

  // Render buttons for ask and tool message types
  const renderButtons = () => {
    if (
      message.role !== 'assistant' ||
      !message.type ||
      (message.type !== 'ask' && message.type !== 'tool')
    ) {
      return null
    }

    return (
      <div className="mt-3 flex space-x-3">
        <button
          onClick={() => handleResponse('approve')}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Approve
        </button>
        <button
          onClick={() => handleResponse('reject')}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Reject
        </button>
      </div>
    )
  }

  // Get message class based on type
  const getMessageClass = () => {
    if (message.role !== 'assistant' || !message.type) {
      return ''
    }

    switch (message.type) {
      case 'ask':
        return 'border-l-4 border-yellow-500 pl-3'
      case 'tool':
        return 'border-l-4 border-green-500 pl-3'
      case 'error':
        return 'border-l-4 border-red-500 pl-3'
      case 'completion_result':
        return 'border-l-4 border-blue-500 pl-3'
      default:
        return ''
    }
  }

  return (
    <div
      className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && <CopilotAvatar />}
      <div
        className={`${
          message.role === 'user' ? 'max-w-[80%] rounded-[0.75rem] bg-blue-100 px-4 py-2' : ''
        } ${message.role === 'assistant' ? getMessageClass() : ''}`}
      >
        {message.role === 'assistant' ? (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className={`prose overflow-x-auto dark:prose-invert ${
                isFullscreen ? 'max-w-[820px]' : 'max-w-[328px]'
              }`}
              components={components}
            >
              {message.content}
            </ReactMarkdown>
            {renderButtons()}
          </>
        ) : (
          message.content
        )}
      </div>
    </div>
  )
}

export default Messages
