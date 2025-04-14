'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { processAssistantMessage } from '@/tool-calls/core/executor'
import Loading from '../Loading'
import ToolApprovalDialog from '../ToolApprovalDialog'
import { containsXmlToolCalls } from '@/tool-calls/core/parser/xml-parser'
import { stripContextTags } from '@/utils/context-manager'

/**
 * CopilotAvatar component renders the Copilot icon
 * @returns {JSX.Element} The avatar component
 */
const CopilotAvatar = () => {
  return (
    <div className="h-7 w-7 flex-shrink-0">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-full w-full" />
    </div>
  )
}

// Add this helper function at the top level
const isAttemptCompletionTag = (content) => {
  return content.includes('<attempt_completion>') && content.includes('</attempt_completion>')
}

// Add helper function at the top level
const isFollowUpQuestion = (content) => {
  return content.includes('<ask_followup_question>') && content.includes('</ask_followup_question>')
}

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null
  })

  // Add ref to track processed message IDs
  const processedMessageIds = useRef(new Set())

  const queryClient = useQueryClient()
  const { setMessageInput, isFullscreen, isLoading } = useChatStore()

  // Initialize tool execution system
  useEffect(() => {
    // Import and call the initialization function.
    // The function itself now prevents multiple initializations.
    import('@/tool-calls/core/executor').then(({ initializeToolExecution }) => {
      initializeToolExecution()
    })

    // No complex cleanup needed here as the listeners should persist
    // If specific cleanup is needed for the component, add it here.
    return () => {
      // Optional: Add cleanup logic if necessary when the Messages component unmounts
    }
  }, []) // Still runs on mount

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

  // Simplified to handle only XML content checks
  const filterAndProcessMessages = (messages) => {
    return messages
      .filter((message) => {
        if (message.role === 'tool') return false
        return true
      })
      .map((message) => {
        if (message.role === 'assistant' && containsXmlToolCalls(message.content)) {
          // Skip processing if it's an attempt_completion or ask_followup_question tag
          if (isAttemptCompletionTag(message.content) || isFollowUpQuestion(message.content)) {
            return message
          }

          // Process other tool calls as before
          if (message.id && !processedMessageIds.current.has(message.id)) {
            console.log('Processing message with XML content:', message.id)
            processedMessageIds.current.add(message.id)
            processAssistantMessage(message, sendMessage)
            return message
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
      <ToolApprovalDialog />
    </div>
  )
}

// Enhanced MessageItem component to handle all avatar and loading states
const MessageItem = ({ message, setMessageInput }) => {
  const fullscreenState = useChatStore((state) => state.isFullscreen)
  const queryClient = useQueryClient()
  const chatId = useChatStore((state) => state.currentChatId) // Changed from chatId to currentChatId

  // Mutation for sending messages
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content, role }) => {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role })
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      return res.json()
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Add optimistic update
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
      console.error('Error sending message:', err)
      queryClient.setQueryData(['messages', chatId], context.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    }
  })

  const handleOptionClick = async (option) => {
    console.log('Option clicked:', option)
    console.log('Current chatId:', chatId)

    if (!chatId) {
      console.error('No chatId available')
      return
    }

    sendMessage({ content: option, role: 'user' })
  }

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
    if (message.role === 'assistant' && message.content === 'loading') {
      return <Loading className="mt-1 pt-2" />
    }

    let formattedContent = message.content

    // Strip task tags for user messages
    if (message.role === 'user') {
      formattedContent = stripContextTags(message.content.split('<environment_details>')[0].trim())
    }

    // Handle attempt_completion differently
    if (message.role === 'assistant' && isAttemptCompletionTag(message.content)) {
      // Extract the result content from between the tags
      const resultMatch = message.content.match(/<result>([\s\S]*?)<\/result>/)
      const resultContent = resultMatch ? resultMatch[1].trim() : message.content

      return (
        <div className="mt-2 rounded-md bg-green-50 p-3 dark:bg-green-900/30">
          <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
            Task Completed
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{resultContent}</p>
        </div>
      )
    }

    // Handle follow-up questions
    if (message.role === 'assistant' && isFollowUpQuestion(message.content)) {
      const questionMatch = message.content.match(/<question>([\s\S]*?)<\/question>/)
      const optionsMatch = message.content.match(/<options>\[(.*?)\]<\/options>/)

      const question = questionMatch ? questionMatch[1].trim() : ''
      const options = optionsMatch
        ? optionsMatch[1].split(',').map((opt) => opt.trim().replace(/['"]/g, ''))
        : []

      return (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">{question}</p>
          {options.length > 0 && (
            <div className="flex flex-col gap-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="w-full rounded border border-blue-500 bg-transparent px-4 py-2 text-left text-sm text-blue-500 hover:bg-blue-500 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Handle other XML tool calls
    if (message.role === 'assistant' && containsXmlToolCalls(message.content)) {
      return (
        <div className="mt-2 rounded-md bg-blue-50 p-3 dark:bg-blue-900/30">
          <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            Tool execution requested
          </p>
          <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
            {formattedContent}
          </pre>
        </div>
      )
    }

    // Show markdown for non-loading assistant messages
    if (message.role === 'assistant') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className={`prose overflow-x-auto dark:prose-invert ${
            fullscreenState ? 'max-w-[820px]' : 'max-w-[328px]'
          }`}
          components={components}
        >
          {formattedContent}
        </ReactMarkdown>
      )
    }

    return formattedContent
  }

  // Add this condition check before rendering
  const shouldHideComponents = message.role === 'assistant' && message.content === 'loading'

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
