'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { TOOL_CALLS } from '@/tool-calls'
import ToolBox from '@/components/ToolBox'

const Messages = ({ chatId }) => {
  const [toolState, setToolState] = useState({ isOpen: false, tool: null, params: null })
  const queryClient = useQueryClient()

  // Add error handling and loading state
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return []
      const res = await fetch(`/api/chat/${chatId}/messages`)
      const data = await res.json()
      return data.messages || []
    },
    enabled: !!chatId, // Ensure immediate refetch
  })

  // Mutation for sending messages
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content, role }) => {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role }),
      })
      const data = await res.json()
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

  const handleToolCall = (toolName, toolArgs) => {
    console.log('toolName:', toolName)
    console.log('toolArgs:', toolArgs)
    try {
      const parsedArgs = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs
      const toolCall = TOOL_CALLS[toolName](parsedArgs.location)

      setToolState({
        isOpen: true,
        tool: toolCall.tool,
        params: toolCall.params,
      })
    } catch (error) {
      console.error('Failed to process tool call:', error)
    }
  }

  // Watch for tool_calls in messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.tool_calls?.[0]) {
      const toolCall = lastMessage.tool_calls[0]
      handleToolCall(toolCall.function.name, toolCall.function.arguments)
    }
  }, [messages])

  const handleToolComplete = (result) => {
    setToolState({ isOpen: false, tool: null, params: null })
    // Handle the result as needed
    console.log('Tool completed with result:', result)
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
      <ToolBox
        isOpen={toolState.isOpen}
        onClose={handleToolComplete}
        tool={toolState.tool}
        params={toolState.params}
      />
    </>
  )
}

export default Messages
