'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { processFullscreenToolCall } from '@/tool-calls/processFullscreenToolCall'
import { processDialogToolCall } from '@/tool-calls/processDialogToolCall'
import { ToolBox } from './ToolBox'
import Loading from '../Loading'

// Enhanced Avatar component with image preloading
const CopilotAvatar = () => {
  return (
    <div className="h-7 w-7 flex-shrink-0">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
    </div>
  )
}

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null
  })

  const queryClient = useQueryClient()
  const { setMessageInput, isFullscreen, isLoading } = useChatStore()

  // Update useQuery to preserve loading state
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      const res = await fetch(`/api/chat/${chatId}/messages`)
      const data = await res.json()
      return filterAndProcessMessages(data.messages || [])
    },
    enabled: !!chatId,
    // Keep showing loading state until tool calls are complete
    notifyOnChangeProps: ['data', 'isLoading']
  })

  // Update filterAndProcessMessages to preserve loading message
  const filterAndProcessMessages = (messages) => {
    const lastMessage = messages[messages.length - 1]
    const isProcessingTool = messages.some(
      (message) =>
        message.role === 'assistant' &&
        message.toolCalls?.length > 0 &&
        !messages.some(
          (m) => m.role === 'assistant' && m.createdAt > message.createdAt && !m.toolCalls
        )
    )

    return messages
      .filter((message) => {
        // Filter out tool response messages
        if (message.role === 'tool') return false

        // Handle assistant messages with tool calls
        if (message.role === 'assistant' && message.toolCalls?.length > 0) {
          const toolCall = message.toolCalls[0]
          if (
            !messages.some(
              (m) => m.role === 'assistant' && m.createdAt > message.createdAt && !m.toolCalls
            )
          ) {
            handleToolCall(toolCall.function.name, toolCall.function.arguments, message)
            return true
          }
          return false
        }

        return true
      })
      .map((message) => {
        // Show loading for assistant message that initiated tool call
        if (isProcessingTool && message.role === 'assistant' && message.toolCalls?.length > 0) {
          return { ...message, content: 'loading' }
        }
        return message
      })
  }

  // Mutation for sending messages
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content, role, toolCallId }) => {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role, toolCallId })
      })
      return res.json()
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Only add to optimistic update if it's not a tool response
      if (newMessage.role !== 'tool') {
        const updatedMessages = [
          ...previousMessages,
          {
            ...newMessage,
            id: 'temp-' + Date.now(),
            createdAt: new Date().toISOString()
          }
        ]
        queryClient.setQueryData(['messages', chatId], updatedMessages)
      }
      
      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', chatId], context.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    }
  })

  const handleToolCall = (toolName, toolArgs, message) => {
    if (isFullscreen) {
      processFullscreenToolCall(toolName, toolArgs, message.toolCalls[0].id, sendMessage)
    } else {
      processDialogToolCall(toolName, toolArgs, message, setToolState)
    }
  }

  const handleToolComplete = () => {
    setToolState({ isOpen: false, tool: null, params: null, toolCallId: null })
  }

  return (
    <div className="flex flex-col space-y-4 py-4">
      {messages?.map((message) => (
        <div>
          {message.role}:{message.content}
          <MessageItem key={message?.id} message={message} setMessageInput={setMessageInput} />
        </div>
      ))}
      <ToolBox
        toolState={toolState}
        onToolComplete={handleToolComplete}
        sendMessage={sendMessage}
      />
    </div>
  )
}

// Enhanced MessageItem component to handle all avatar and loading states
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

  const renderContent = () => {
    // Show loading component for assistant messages with 'loading' content
    // or empty content with tool calls (indicating processing)
    if (
      message.role === 'assistant' &&
      (message.content === 'loading' || (message.toolCalls?.length > 0 && !message.content))
    ) {
      return <Loading className="pt-2" />
    }

    // Show markdown for non-loading assistant messages
    if (message.role === 'assistant') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="prose max-w-none dark:prose-invert"
          components={components}
        >
          {message.content}
        </ReactMarkdown>
      )
    }

    // Show plain content for user messages
    return message.content
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
        {renderContent()}
      </div>
    </div>
  )
}

export default Messages
