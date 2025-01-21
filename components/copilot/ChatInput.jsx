'use client'

import { Send } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const ChatInput = ({ input, setInput, isLoading, onSubmit }) => {
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
    onSuccess: (data, variables) => {
      // Optimistically update the messages cache
      queryClient.setQueryData(['messages', variables.chatId], (old = []) => [...old, data.message])
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

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
        setCurrentChatId(chatId)
        activeChatId = chatId
      }

      // Optimistically add user message
      await createMessageMutation.mutateAsync({
        content: input,
        role: 'user',
        chatId: activeChatId,
      })

      // Call the original onSubmit to handle the AI response
      await onSubmit(e)
      setInput('')
    } catch (error) {
      console.error('Error:', error)
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
