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
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false)
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null
  })

  const queryClient = useQueryClient()
  const { setMessageInput, isFullscreen, isLoading } = useChatStore()

  // Move useQuery before the useEffect
  const { data: messages = [], isLoading: queryLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      const res = await fetch(`/api/chat/${chatId}/messages`)
      const data = await res.json()
      return filterAndProcessMessages(data.messages || [])
    },
    enabled: !!chatId
  })

  // Now messages is defined when used in useEffect
  useEffect(() => {
    if (isLoading) {
      setIsWaitingForAssistant(true)
    } else {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role === 'assistant') {
        setIsWaitingForAssistant(false)
      }
    }
  }, [isLoading, messages])

  // Filter out tool-related messages and process tool calls
  const filterAndProcessMessages = (messages) => {
    return messages.filter((message) => {
      if (message.role === 'assistant' && message.toolCalls?.length > 0) {
        const toolCall = message.toolCalls[0]
        const hasToolResponse = messages.some(
          (m) => m.role === 'tool' && m.toolCallId === toolCall.id
        )

        if (!hasToolResponse) {
          handleToolCall(toolCall.function.name, toolCall.function.arguments, message)
        }
        return false
      }
      return message.role !== 'tool'
    })
  }

  // Mutation for sending messages
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content, role, toolCallId }) => {
      // setIsWaitingForAssistant(true) // Set waiting state when mutation starts
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
      const updatedMessages = [
        ...previousMessages,
        {
          ...newMessage,
          id: 'temp-' + Date.now(),
          createdAt: new Date().toISOString()
        }
      ]
      queryClient.setQueryData(['messages', chatId], updatedMessages)
      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', chatId], context.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      // setIsWaitingForAssistant(false) // Reset waiting state when mutation completes
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

  // Simplified loading state logic
  const shouldShowLoading = isLoading || isWaitingForAssistant

  if (queryLoading) {
    return <div className="flex-1">Loading messages...</div>
  }

  return (
    <div className="flex flex-col space-y-4 py-4">
      {messages?.map((message) => (
        <MessageItem key={message?.id} message={message} setMessageInput={setMessageInput} />
      ))}
      {shouldShowLoading && (
        <MessageItem message={{ role: 'assistant', content: '1111111', isLoading: false }} />
      )}
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
    if (message.isLoading || message.role === 'tool') {
      return <Loading className="pt-2" />
    }

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

    return message.content
  }

  return (
    <div
      className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {(message.role === 'assistant' || message.role === 'tool') && <CopilotAvatar />}
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
