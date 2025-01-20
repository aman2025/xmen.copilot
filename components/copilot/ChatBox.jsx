import { useState } from 'react'
import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '@/store/useChatStore'

const ChatBox = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { currentChatId } = useChatStore() // Get currentChatId from store

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || !currentChatId) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: input,
          role: 'user',
        }),
      })

      const data = await res.json()
      if (data.message) {
        setInput('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Messages chatId={currentChatId} />
      <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={handleSubmit} />
    </div>
  )
}

export default ChatBox
