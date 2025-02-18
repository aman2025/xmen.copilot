'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import ToolBox from '@/components/ToolBox'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null
  })
  const queryClient = useQueryClient()
  const { setMessageInput } = useChatStore()

  // Filter out tool-related messages and process tool calls
  const filterAndProcessMessages = (messages) => {
    return messages.filter((message) => {
      // Process tool calls from assistant messages
      if (message.role === 'assistant' && message.toolCalls?.length > 0) {
        const toolCall = message.toolCalls[0]
        // Check if there's already a tool response for this toolCallId
        const hasToolResponse = messages.some(
          (m) => m.role === 'tool' && m.toolCallId === toolCall.id
        )

        // Only handle tool call if there's no existing tool response
        if (!hasToolResponse) {
          handleToolCall(toolCall.function.name, toolCall.function.arguments, message)
        }
        return false // Don't show assistant messages with tool calls
      }
      // Filter out tool response messages
      return message.role !== 'tool'
    })
  }

  // Update the query to filter messages
  const { data: messages = [], isLoading } = useQuery({
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
      const data = await res.json()
      console.log('data: ', data)
      return data
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Always create a new array with the new message
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
    try {
      const parsedArgs = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs

      setToolState({
        isOpen: true,
        tool: toolName,
        params: parsedArgs,
        toolCallId: message.toolCalls[0].id
      })
    } catch (error) {
      console.error('Failed to process tool call:', error)
    }
  }

  const handleToolComplete = (result) => {
    // Check if there's already a tool response for this toolCallId
    const hasToolResponse = queryClient
      .getQueryData(['messages', chatId])
      ?.some((m) => m.role === 'tool' && m.toolCallId === toolState.toolCallId)

    if (!hasToolResponse) {
      // Only send message if there's no existing tool response
      const stringifiedResult = JSON.stringify(result)
      sendMessage({
        content: stringifiedResult,
        role: 'tool',
        toolCallId: toolState.toolCallId
      })
    }

    // Reset the tool state regardless
    setToolState({ isOpen: false, tool: null, params: null, toolCallId: null })
  }

  // Add custom components for ReactMarkdown
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

  // Add loading state and null check for messages
  if (isLoading) {
    return <div className="flex-1">Loading messages...</div>
  }

  return (
    <>
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages?.map(
          (message) =>
            message?.role !== 'tool' && (
              <div
                key={message?.id}
                className={`p-3 ${
                  message?.role === 'user'
                    ? 'ml-auto max-w-[80%] rounded-lg bg-blue-100 dark:bg-blue-900'
                    : 'mr-auto'
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
            )
        )}
      </div>
      {toolState.isOpen && (
        <ToolBox
          isOpen={true}
          onClose={handleToolComplete}
          tool={toolState.tool}
          params={toolState.params}
        />
      )}
    </>
  )
}

export default Messages
