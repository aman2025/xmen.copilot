'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { TOOL_CALLS } from '@/tool-calls'
import ToolBox from '@/components/ToolBox'

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({
    isOpen: false,
    tool: null,
    params: null,
    toolCallId: null,
  })
  const queryClient = useQueryClient()

  // Filter out tool-related messages and process tool calls
  const filterAndProcessMessages = (messages) => {
    return messages.filter((message) => {
      // Process tool calls from assistant messages
      if (message.role === 'assistant' && message.toolCalls?.length > 0) {
        const toolCall = message.toolCalls[0]
        handleToolCall(toolCall.function.name, toolCall.function.arguments, message)
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
    enabled: !!chatId,
  })

  // Mutation for sending messages
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content, role, toolCallId }) => {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role, toolCallId }),
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
          createdAt: new Date().toISOString(),
        },
      ]

      queryClient.setQueryData(['messages', chatId], updatedMessages)

      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', chatId], context.previousMessages)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    },
  })

  const handleToolCall = (toolName, toolArgs, message) => {
    console.log('toolName:', toolName)
    console.log('toolArgs:', toolArgs)
    try {
      const parsedArgs = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs
      const toolCall = TOOL_CALLS[toolName](parsedArgs.location)

      setToolState({
        isOpen: true,
        tool: toolCall.tool,
        params: toolCall.params,
        toolCallId: message.toolCalls[0].id, // Store the toolCallId
      })
    } catch (error) {
      console.error('Failed to process tool call:', error)
    }
  }

  const handleToolComplete = (result) => {
    // Stringify the result object before sending
    const stringifiedResult = JSON.stringify(result)

    // Send message with the stringified content
    sendMessage({
      content: stringifiedResult,
      role: 'tool',
      toolCallId: toolState.toolCallId,
    })

    // Then reset the tool state
    setToolState({ isOpen: false, tool: null, params: null, toolCallId: null })
  }
  // Add loading state and null check for messages
  if (isLoading) {
    return <div className="flex-1">Loading messages...</div>
  }

  return (
    <>
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages?.map((message) => (
          <div
            key={message?.id}
            className={`rounded-lg p-3 ${
              message?.role === 'user'
                ? 'ml-auto bg-blue-100 dark:bg-blue-900'
                : 'mr-auto bg-gray-100 dark:bg-gray-700'
            } max-w-[80%]`}
          >
            {message?.content}
          </div>
        ))}
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
