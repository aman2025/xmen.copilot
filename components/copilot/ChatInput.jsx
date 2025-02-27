'use client'

import { SendHorizontal, Square } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

const ChatInput = () => {
  const queryClient = useQueryClient()
  const {
    currentChatId,
    setCurrentChatId,
    messageInput,
    setMessageInput,
    setIsLoading,
    scrollToBottom
  } = useChatStore()

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
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Add both user message and temporary assistant loading message
      queryClient.setQueryData(
        ['messages', chatId],
        [
          ...previousMessages,
          {
            id: 'temp-user-' + Date.now(),
            content,
            role,
            createdAt: new Date().toISOString()
          },
          {
            id: 'temp-assistant-' + Date.now(),
            content: 'loading',
            role: 'assistant',
            createdAt: new Date().toISOString()
          }
        ]
      )

      // Immediately scroll to bottom after updating cache
      setTimeout(() => {
        useChatStore.getState().scrollToBottomImmediate?.()
      }, 0)

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['messages', variables.chatId], context.previousMessages)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] })
      setIsLoading(false)
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    setIsLoading(true)
    try {
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
        queryClient.setQueryData(['messages', chatId], [])
      }

      await createMessageMutation.mutateAsync({
        content: messageInput,
        role: 'user',
        chatId: activeChatId
      })

      setMessageInput('')

      // Scroll to bottom after sending message
      scrollToBottom?.()
    } catch (error) {
      console.error('Error:', error)
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
          disabled={createMessageMutation.isLoading}
        />
        <button
          type="submit"
          disabled={createMessageMutation.isLoading}
          className={`ml-2 rounded-lg p-2 transition-colors ${
            createMessageMutation.isLoading
              ? 'bg-red-500 hover:bg-red-600'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          {createMessageMutation.isLoading ? (
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
