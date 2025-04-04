'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { processAssistantMessage } from '@/tool-calls/toolExecutionManager'
import { ToolBox } from './ToolBox'
import Loading from '../Loading'
import ToolApprovalDialog from '../ToolApprovalDialog'
import { convertToolCallsToXml } from '@/utils/toolXmlParser'

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

  // Initialize tool execution system
  useEffect(() => {
    import('@/tool-calls/toolExecutionManager').then(({ initializeToolExecution }) => {
      initializeToolExecution();
    });
  }, []);

  // Update useQuery to preserve loading state
  const {
    data: messages = [],
    isLoading: queryLoading,
    error
  } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      try {
        const res = await fetch(`/api/chat/${chatId}/messages`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        if (!res.ok) throw new Error('Failed to fetch messages')
        const data = await res.json()
        return filterAndProcessMessages(data.messages || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
        throw error
      }
    },
    enabled: !!chatId,
    retry: 3,
    retryDelay: 1000,
    notifyOnChangeProps: ['data', 'isLoading']
  })

  // Update filterAndProcessMessages to use our tool execution system
  const filterAndProcessMessages = (messages) => {
    // Find the last assistant message with tool calls
    const lastAssistantWithTools = [...messages]
      .reverse()
      .find((msg) => msg.role === 'assistant' && msg.toolCalls?.length > 0)

    // Track if we're still processing a tool call
    const isProcessingTool =
      lastAssistantWithTools &&
      !messages.some(
        (m) =>
          m.role === 'assistant' && m.createdAt > lastAssistantWithTools.createdAt && !m.toolCalls
      )

    // Get all processed tool call IDs
    const processedToolCallIds = messages.filter((m) => m.role === 'tool').map((m) => m.toolCallId)

    return messages
      .filter((message) => {
        // Filter out tool response messages
        if (message.role === 'tool') return false

        // Handle assistant messages with tool calls
        if (message.role === 'assistant' && message.toolCalls?.length > 0) {
          // Only process if this is the last assistant message with tools
          if (message === lastAssistantWithTools) {
            const toolCall = message.toolCalls[0]
            // Only process if this tool call hasn't been handled yet
            if (!processedToolCallIds.includes(toolCall.id)) {
              // Convert tool calls to XML format
              const messageWithXml = {
                ...message,
                content: convertToolCallsToXml(message)
              }
              // Process the assistant message with our tool execution system
              processAssistantMessage(messageWithXml, sendMessage)
            }
            return true
          }
          return false
        }

        return true
      })
      .map((message) => {
        // Show loading for the last assistant message that initiated tool call
        if (isProcessingTool && message === lastAssistantWithTools) {
          return { ...message, content: 'loading' }
        }
        
        // Convert tool calls to XML format for display
        if (message.role === 'assistant' && message.toolCalls?.length > 0) {
          return {
            ...message,
            content: convertToolCallsToXml(message)
          }
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

  const handleToolComplete = () => {
    setToolState({ isOpen: false, tool: null, params: null, toolCallId: null })
  }

  if (queryLoading) {
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
      <ToolBox
        toolState={toolState}
        onToolComplete={handleToolComplete}
        sendMessage={sendMessage}
      />
      <ToolApprovalDialog />
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
      return <Loading className="mt-1 pt-2" />
    }

    // Show markdown for non-loading assistant messages
    if (message.role === 'assistant') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className={`prose overflow-x-auto dark:prose-invert ${useChatStore().isFullscreen ? 'max-w-[820px]' : 'max-w-[328px]'}`}
          components={components}
        >
          {message.content}
        </ReactMarkdown>
      )
    }

    // Show plain content for user messages
    return message.content
  }

  // Add this condition check before rendering
  const shouldHideComponents =
    message.role === 'assistant' && message.toolCalls?.length > 0 && !message.content

  // Skip rendering entirely if conditions are met
  if (shouldHideComponents) {
    return null
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
