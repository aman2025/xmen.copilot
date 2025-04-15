'use client'

import { SendHorizontal } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { formatUserMessage, formatEnvironmentDetails } from '@/utils/context-manager'

const ChatInput = () => {
  const queryClient = useQueryClient()
  const { currentChatId, setCurrentChatId, messageInput, setMessageInput, setIsLoading } =
    useChatStore()
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false)

  // Add state to track if this is the first message
  const [isFirstMessage, setIsFirstMessage] = useState(true)

  useEffect(() => {
    if (currentChatId) {
      const messages = queryClient.getQueryData(['messages', currentChatId]) || []
      setIsFirstMessage(messages.length === 0)
    }
  }, [currentChatId, queryClient])

  // Subscribe to messages to detect when real assistant message arrives
  useEffect(() => {
    if (!currentChatId) return

    const unsubscribe = queryClient.getQueryCache().subscribe(({ query }) => {
      // Only process if this is a messages query for our current chat
      if (query?.queryKey[0] === 'messages' && query?.queryKey[1] === currentChatId) {
        const messages = query.state.data || []
        const lastMessage = messages[messages.length - 1]

        // Check if the last message is a real assistant message (not loading or tool call)
        if (
          lastMessage?.role === 'assistant' &&
          lastMessage?.content !== 'loading' &&
          !lastMessage?.toolCalls
        ) {
          setIsWaitingForAssistant(false)
        }
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [currentChatId, queryClient])

  // Mutation for creating a new message
  const createMessageMutation = useMutation({
    mutationFn: async ({ content, role, chatId }) => {
      // Format message with task tag and environment details
      const messageContent =
        role === 'user'
          ? formatUserMessage(content, isFirstMessage, formatEnvironmentDetails())
          : content

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent, role })
      })
      return response.json()
    },
    onMutate: async ({ content, role, chatId }) => {
      setIsWaitingForAssistant(true)
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] })
      const previousMessages = queryClient.getQueryData(['messages', chatId]) || []

      // Format display content (without task tags)
      const displayContent =
        role === 'user' ? formatUserMessage(content, false, formatEnvironmentDetails()) : content

      queryClient.setQueryData(
        ['messages', chatId],
        [
          ...previousMessages,
          {
            id: 'temp-user-' + Date.now(),
            content: displayContent,
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
      queryClient.setQueryData(['messages', variables.chatId], context?.previousMessages)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] })
      setIsLoading(false)
      if (!error) {
        setIsFirstMessage(false)
      }
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
          disabled={createMessageMutation.isLoading || isWaitingForAssistant}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={createMessageMutation.isLoading || isWaitingForAssistant}
          className={`ml-2 rounded-lg p-2 transition-colors ${
            createMessageMutation.isLoading || isWaitingForAssistant
              ? 'not-allowed text-gray-300'
              : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}

export default ChatInput
