'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { processFullscreenToolCall } from '@/tool-calls/processFullscreenToolCall'
import { processDialogToolCall } from '@/tool-calls/processDialogToolCall'
import { ToolBox } from './ToolBox'
import Loading from '../Loading'

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null
  })

  const queryClient = useQueryClient()
  const { setMessageInput, isFullscreen, isLoading } = useChatStore()

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

  if (queryLoading) {
    return <div className="flex-1">Loading messages...</div>
  }

  return (
    <div className="flex flex-col space-y-4 py-4">
      {messages?.map((message) => (
        <MessageItem key={message?.id} message={message} setMessageInput={setMessageInput} />
      ))}
      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 flex-shrink-0">
            <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
          </div>
          <Loading className="pt-2" />
        </div>
      )}
      <ToolBox
        toolState={toolState}
        onToolComplete={handleToolComplete}
        sendMessage={sendMessage}
      />
    </div>
  )
}

// Separate component for rendering individual messages
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

  if (message?.role === 'tool') return null

  return (
    <div
      className={`flex items-start gap-2 ${message?.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message?.role === 'assistant' && (
        <div className="h-7 w-7 flex-shrink-0">
          <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
        </div>
      )}
      <div
        className={`${
          message?.role === 'user'
            ? 'max-w-[80%] rounded-[0.75rem] bg-blue-500 px-4 py-2 text-white'
            : ''
        }`}
      >
        {message?.role === 'assistant' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose max-w-none dark:prose-invert"
            components={components}
          >
            {message?.content}
          </ReactMarkdown>
        ) : (
          message?.content
        )}
      </div>
    </div>
  )
}

export default Messages
