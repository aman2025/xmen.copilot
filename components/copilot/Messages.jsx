'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

const Messages = ({ chatId }) => {
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

  // Add loading state and null check for messages
  if (isLoading) {
    return <div className="flex-1">Loading messages...</div>
  }

  return (
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
  )
}

export default Messages
