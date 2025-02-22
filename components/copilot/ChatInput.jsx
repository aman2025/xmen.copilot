'use client'

import { SendHorizontal, Square } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const ChatInput = () => {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  // Get currentChatId and message input from Zustand store
  const { currentChatId, setCurrentChatId, messageInput, setMessageInput } = useChatStore()

  // Mutation for creating a new message
  const createMessageMutation = useMutation({
    mutationFn: async ({ content, role, chatId }) => {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role })
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
            createdAt: new Date().toISOString()
          }
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
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    setIsLoading(true)
    try {
      // Create a new chat if there's no currentChatId
      let activeChatId = currentChatId
      if (!currentChatId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: messageInput.slice(0, 100) })
        })
        const { chatId } = await response.json()
        activeChatId = chatId
        setCurrentChatId(chatId)

        // Initialize the messages cache for the new chat
        queryClient.setQueryData(['messages', chatId], [])
      }

      await createMessageMutation.mutateAsync({
        content: messageInput,
        role: 'user',
        chatId: activeChatId
      })

      setMessageInput('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <div className="flex w-full items-center rounded-2xl border border-gray-200 bg-white px-4 py-[0.5rem] pr-2 dark:border-gray-600 dark:bg-gray-800">
        <input
          id="copilot-input"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Ask Copilot"
          className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`ml-2 rounded-lg p-2 transition-colors ${
            isLoading
              ? 'bg-red-500 hover:bg-red-600'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          {isLoading ? (
            <Square className="h-4 w-4 text-white" />
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  )
}

export default ChatInput
