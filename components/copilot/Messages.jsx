'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { processAssistantMessage } from '@/tool-calls/toolExecutionManager'
import { ToolBox } from './ToolBox'
import Loading from '../Loading'
import ToolApprovalDialog from '../ToolApprovalDialog'
import { convertToolCallsToXml, containsXmlToolCalls } from '@/utils/toolXmlParser'

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

  // Add ref to track processed message IDs
  const processedMessageIds = useRef(new Set());

  const queryClient = useQueryClient()
  const { setMessageInput, isFullscreen, isLoading } = useChatStore()

  // Initialize tool execution system
  useEffect(() => {
    import('@/tool-calls/toolExecutionManager').then(({ initializeToolExecution }) => {
      initializeToolExecution()
    })
  }, [])

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
    // Process messages to display
    return messages
      .filter((message) => {
        // Filter out tool response messages
        if (message.role === 'tool') return false
        return true
      })
      .map((message) => {
        // Convert tool calls to XML format for display
        if (message.role === 'assistant' && message.toolCalls?.length > 0) {
          const messageWithXml = {
            ...message,
            content: convertToolCallsToXml(message)
          }

          // Only process messages that haven't been processed yet
          if (message.id && !processedMessageIds.current.has(message.id)) {
            processedMessageIds.current.add(message.id);
            // Process the assistant message with our tool execution system
            processAssistantMessage(messageWithXml, sendMessage)
          }

          return messageWithXml
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
    },
    // Add syntax highlighting for XML tool calls
    code: ({ children, className }) => {
      // Check if this is XML content (tool call)
      const isXml =
        typeof children === 'string' && (children.includes('</') || children.includes('/>'))

      if (isXml) {
        return (
          <div className="my-2 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
              {children}
            </pre>
          </div>
        )
      }

      return <code className={className}>{children}</code>
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

    // Format XML in the content for better display
    let formattedContent = message.content
    if (message.role === 'assistant' && message.toolCalls?.length > 0) {
      // Split content into text and XML parts
      const xmlStartIndex = formattedContent.indexOf('<')
      if (xmlStartIndex > 0) {
        const textPart = formattedContent.substring(0, xmlStartIndex).trim()
        const xmlPart = formattedContent.substring(xmlStartIndex).trim()
        formattedContent = `${textPart}\n\n\`\`\`xml\n${xmlPart}\n\`\`\``
      } else if (xmlStartIndex === 0) {
        formattedContent = `\`\`\`xml\n${formattedContent}\n\`\`\``
      }
    }

    // Show markdown for non-loading assistant messages
    if (message.role === 'assistant') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className={`prose overflow-x-auto dark:prose-invert ${useChatStore().isFullscreen ? 'max-w-[820px]' : 'max-w-[328px]'}`}
          components={components}
        >
          {formattedContent}
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
