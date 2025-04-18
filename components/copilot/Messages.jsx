'use client'

import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'

const CopilotAvatar = () => {
  return (
    <div className="h-7 w-7 flex-shrink-0">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
    </div>
  )
}

const Messages = ({ chatId }) => {
  const { setMessageInput, isFullscreen } = useChatStore()

  const {
    data: messages = [],
    isLoading,
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
    retryDelay: 1000,
  })

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading messages...</div>
  }

  if (error) {
    return (
      <div className="flex justify-center p-6 text-red-500">
        Error loading messages. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 py-4">
      {messages?.map((message) => (
        <div key={message?.id}>
          <MessageItem message={message} setMessageInput={setMessageInput} />
        </div>
      ))}
    </div>
  )
}

const MessageItem = ({ message, setMessageInput }) => {
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

  return (
    <div
      className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && <CopilotAvatar />}
      <div
        className={`${
          message.role === 'user' ? 'max-w-[80%] rounded-[0.75rem] bg-blue-100 px-4 py-2' : ''
        }`}
      >
        {message.role === 'assistant' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={`prose overflow-x-auto dark:prose-invert ${
              useChatStore().isFullscreen ? 'max-w-[820px]' : 'max-w-[328px]'
            }`}
            components={components}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>
    </div>
  )
}

export default Messages
