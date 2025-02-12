'use client'

import { Send } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const ChatInput = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  // Get currentChatId and setter from Zustand store
  const { currentChatId, setCurrentChatId } = useChatStore()

  // Mutation for creating a new message
  const createMessageMutation = useMutation({
    mutationFn: async ({ content, role, chatId }) => {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role }),
      })
      return response.json()
    },
    onMutate: async ({ content, role, chatId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['messages', chatId],
        [
          ...previousMessages,
          {
            id: 'temp-' + Date.now(),
            content,
            role,
            createdAt: new Date().toISOString(),
          },
        ]
      )

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['messages', variables.chatId], context.previousMessages)
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] })
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    try {
      // Create a new chat if there's no currentChatId
      let activeChatId = currentChatId
      if (!currentChatId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.slice(0, 100) }),
        })
        const { chatId } = await response.json()
        activeChatId = chatId
        setCurrentChatId(chatId)

        // Initialize the messages cache for the new chat
        queryClient.setQueryData(['messages', chatId], [])
      }

      await createMessageMutation.mutateAsync({
        content: input,
        role: 'user',
        chatId: activeChatId,
      })

      setInput('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 rounded-md border p-2 text-gray-800 dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? 'Sending...' : <Send size={20} />}
      </button>
    </form>
  )
}

export default ChatInput
