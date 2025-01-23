'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { get_weather } from '@/tool-calls'
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
    enabled: !!chatId,
  })

  const handleToolCall = () => {
    // This is a test call - you would normally get the tool name from the API
    const { tool, params } = get_weather('London')
    setToolState({
      isOpen: true,
      tool,
      params,
    })
  }

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
        <button onClick={handleToolCall} className="rounded bg-blue-500 px-4 py-2 text-white">
          Call Tool
        </button>
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
